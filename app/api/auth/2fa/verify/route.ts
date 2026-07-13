import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthUser } from "@/lib/api-utils";
import { apiError, apiSuccess, handleApiError, checkCSRF } from "@/lib/api-utils";
import { TwoFactorVerifySchema } from "@/types";
import { verifyTotp } from "@/lib/totp";

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await getAuthUser(request);
    if (!auth) return apiError("UNAUTHORIZED", "Authentication required", 401);

    const body = await request.json();
    const parsed = TwoFactorVerifySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Valid token and secret are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!user) {
      return apiError("NOT_FOUND", "User not found", 404);
    }

    if (user.totpEnabled) {
      return apiError("CONFLICT", "Two-factor authentication is already enabled", 409);
    }

    if (!user.totpSecret) {
      return apiError("BAD_REQUEST", "No 2FA setup in progress. Call setup first.", 400);
    }

    if (parsed.data.secret !== user.totpSecret) {
      return apiError("BAD_REQUEST", "Secret mismatch. Restart setup.", 400);
    }

    if (!(await verifyTotp(parsed.data.token, user.totpSecret))) {
      return apiError("INVALID_TOKEN", "Invalid verification code", 400);
    }

    await prisma.user.update({
      where: { id: auth.sub },
      data: { totpEnabled: true },
    });

    logger.info({ userId: auth.sub }, "2FA enabled successfully");
    return apiSuccess({ message: "Two-factor authentication enabled" });
  } catch (error) {
    logger.error({ error }, "2FA verification failed");
    return handleApiError(error, "2fa-verify");
  }
}
