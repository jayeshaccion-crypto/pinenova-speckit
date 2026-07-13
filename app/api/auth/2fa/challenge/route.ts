import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "@/lib/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { TwoFactorChallengeSchema } from "@/types";
import { verifyTotp } from "@/lib/totp";

async function issueTokens(user: { id: string; email: string; firstName: string; lastName: string; role: string }) {
  const accessToken = await signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await signRefreshToken(user.id);

  logger.info({ userId: user.id }, "2FA challenge passed — tokens issued");
  const response = apiSuccess({ accessToken, refreshToken, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
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
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = TwoFactorChallengeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Valid temp token and verification code are required", 400);
    }

    const tempPayload = await verifyAccessToken(parsed.data.tempToken);
    if (!tempPayload) {
      return apiError("INVALID_TOKEN", "Invalid or expired temp token. Please login again.", 401);
    }

    if (tempPayload.role !== "2FA_PENDING") {
      return apiError("INVALID_TOKEN", "Invalid token type", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: tempPayload.sub } });
    if (!user) {
      return apiError("NOT_FOUND", "User not found", 404);
    }

    if (!user.totpEnabled || !user.totpSecret) {
      return apiError("BAD_REQUEST", "Two-factor authentication is not enabled on this account. Please login again.", 400);
    }

    if (!(await verifyTotp(parsed.data.token, user.totpSecret!))) {
      logger.warn({ userId: user.id }, "2FA challenge failed — invalid code");
      return apiError("INVALID_TOKEN", "Invalid verification code", 401);
    }

    return issueTokens(user);
  } catch (error) {
    logger.error({ error }, "2FA challenge failed");
    return handleApiError(error, "2fa-challenge");
  }
}
