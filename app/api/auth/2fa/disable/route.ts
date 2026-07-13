import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { comparePassword, clearUserRefreshTokens } from "@/lib/auth";
import { getAuthUser } from "@/lib/api-utils";
import { apiError, apiSuccess, handleApiError, checkCSRF } from "@/lib/api-utils";
import { TwoFactorDisableSchema } from "@/types";
import { verifyTotp } from "@/lib/totp";

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await getAuthUser(request);
    if (!auth) return apiError("UNAUTHORIZED", "Authentication required", 401);

    const body = await request.json();
    const parsed = TwoFactorDisableSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Password and token are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!user || !user.passwordHash) {
      return apiError("NOT_FOUND", "User not found", 404);
    }

    if (!user.totpEnabled || !user.totpSecret) {
      return apiError("BAD_REQUEST", "Two-factor authentication is not enabled", 400);
    }

    const valid = await comparePassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return apiError("INVALID_CREDENTIALS", "Invalid password", 401);
    }

    if (!(await verifyTotp(parsed.data.token, user.totpSecret))) {
      return apiError("INVALID_TOKEN", "Invalid verification code", 400);
    }

    await prisma.user.update({
      where: { id: auth.sub },
      data: { totpSecret: null, totpEnabled: false },
    });

    await clearUserRefreshTokens(auth.sub);

    logger.warn({ userId: auth.sub }, "2FA disabled — all sessions invalidated");
    return apiSuccess({ message: "Two-factor authentication disabled. All sessions have been invalidated." });
  } catch (error) {
    logger.error({ error }, "2FA disable failed");
    return handleApiError(error, "2fa-disable");
  }
}
