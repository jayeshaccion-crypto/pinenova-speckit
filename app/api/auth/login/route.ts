import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { comparePassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { LoginSchema } from "@/types";
import { apiError, apiSuccess, handleApiError, checkCSRF } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid request body", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { email, password } = parsed.data;
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    const rl = await rateLimit(`login:${email}`, { max: 10, windowMs: 60000 });
    if (!rl.allowed) {
      logger.warn({ email: email.slice(0, 3) + "***", ip }, "Login rate limited");
      return apiError("RATE_LIMITED", "Too many login attempts. Please try again later.", 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return apiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    if (user.status !== "ACTIVE") {
      return apiError("ACCOUNT_DISABLED", "This account has been disabled", 403);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      logger.warn({ userId: user.id, email: email.slice(0, 3) + "***", ip }, "Login failed — wrong password");
      await logAuditEvent({ userId: user.id, action: "LOGIN_FAILED", entity: "User", entityId: user.id, ip });
      return apiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    if (user.totpEnabled) {
      const tempToken = await signAccessToken({ sub: user.id, role: "2FA_PENDING" });
      logger.info({ userId: user.id, email: email.slice(0, 3) + "***", ip }, "Login — 2FA required");
      return apiSuccess({ requiresTwoFactor: true, tempToken });
    }

    const accessToken = await signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await signRefreshToken(user.id);

    logger.info({ userId: user.id, email: email.slice(0, 3) + "***", ip }, "Login successful");
    await logAuditEvent({ userId: user.id, action: "LOGIN_SUCCESS", entity: "User", entityId: user.id, ip });

    const response = apiSuccess({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    logger.error({ error }, "Login failed");
    return handleApiError(error, "login");
  }
}
