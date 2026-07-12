import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { hashPassword, signResetToken, verifyResetToken } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";
import { ForgotPasswordSchema, ResetPasswordSchema } from "@/types";
import { apiError, apiSuccess, handleApiError, checkCSRF } from "@/lib/api-utils";
import { checkAuthRateLimit } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkAuthRateLimit(`reset:${ip}`, 3, 60000)) {
      return apiError("RATE_LIMITED", "Too many password reset attempts. Please try again later.", 429);
    }

    const body = await request.json();

    if (body.email !== undefined && body.token === undefined) {
      const parsed = ForgotPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("VALIDATION_ERROR", "Valid email is required", 400,
          parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        );
      }

      const { email } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        const token = await signResetToken(email);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetUrl = `${appUrl}/account/reset-password?token=${token}`;
        const template = emailTemplates.passwordReset(resetUrl);
        await sendEmail({ to: email, subject: template.subject, html: template.html });
        logger.info({ email: email.slice(0, 3) + "***" }, "Password reset email sent");
      } else {
        logger.info({ email: email.slice(0, 3) + "***" }, "Password reset requested for unknown email");
      }

      return apiSuccess({ message: "If an account exists with this email, a password reset link has been sent." });
    }

    if (body.token !== undefined) {
      const parsed = ResetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("VALIDATION_ERROR", "Valid token and password are required", 400,
          parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        );
      }

      const { token, password } = parsed.data;
      const email = await verifyResetToken(token);

      if (!email) {
        logger.warn({}, "Invalid or expired reset token used");
        return apiError("INVALID_TOKEN", "Reset token is invalid or has expired", 400);
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return apiError("INVALID_TOKEN", "Reset token is invalid or has expired", 400);
      }

      const passwordHash = await hashPassword(password);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

      logger.info({ userId: user.id, email: email.slice(0, 3) + "***" }, "Password reset completed");
      return apiSuccess({ message: "Password has been updated successfully." });
    }

    return apiError("VALIDATION_ERROR", "Request must include either email or token+password", 400);
  } catch (error) {
    logger.error({ error }, "Password reset failed");
    return handleApiError(error, "reset-password");
  }
}
