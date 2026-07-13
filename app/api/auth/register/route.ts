import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/lib/auth";
import { RegisterSchema } from "@/types";
import { apiError, apiSuccess, handleApiError, checkCSRF } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rl = await rateLimit(`register:${ip}`, { max: 5, windowMs: 60000 });
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", "Too many registration attempts. Please try again later.", 429);
    }

    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid request body", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { email, password, firstName, lastName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("EMAIL_EXISTS", "An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, role: "CUSTOMER" },
    });

    await logAuditEvent({ userId: user.id, action: "USER_REGISTERED", entity: "User", entityId: user.id });

    logger.info({ userId: user.id, email: user.email }, "User registered");

    return apiSuccess({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } }, 201);
  } catch (error) {
    logger.error({ error }, "Registration failed");
    return handleApiError(error, "register");
  }
}
