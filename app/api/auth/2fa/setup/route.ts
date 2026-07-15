import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { comparePassword } from "@/lib/auth";
import { getAuthUser } from "@/lib/api-utils";
import { apiError, apiSuccess, handleApiError, checkCSRF } from "@/lib/api-utils";
import { TwoFactorSetupSchema } from "@/types";
import { generateTotpSecret, generateQrCode } from "@/lib/totp";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await getAuthUser(request);
    if (!auth) return apiError("UNAUTHORIZED", "Authentication required", 401);

    const body = await request.json();
    const parsed = TwoFactorSetupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Password is required", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!user || !user.passwordHash) {
      return apiError("UNAUTHORIZED", "Invalid credentials", 401);
    }

    if (user.totpEnabled) {
      return apiError("CONFLICT", "Two-factor authentication is already enabled", 409);
    }

    const valid = await comparePassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return apiError("INVALID_CREDENTIALS", "Invalid password", 401);
    }

    const secret = generateTotpSecret();

    await prisma.user.update({
      where: { id: auth.sub },
      data: { totpSecret: secret },
    });

    const qrCode = await generateQrCode(secret, user.email);

    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString("hex"));

    logger.info({ userId: auth.sub }, "2FA setup initiated");
    return apiSuccess({ secret, qrCode, backupCodes });
  } catch (error) {
    logger.error({ error }, "2FA setup failed");
    return handleApiError(error, "2fa-setup");
  }
}
