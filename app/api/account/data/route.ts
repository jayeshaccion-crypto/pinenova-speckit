import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthUser, apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { logAuditEvent } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { clearUserRefreshTokens } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, orders: { include: { items: true } } },
    });

    if (!user) {
      return apiError("NOT_FOUND", "User not found", 404);
    }

    logger.info({ userId: auth.sub }, "GDPR data export");
    await logAuditEvent({ userId: auth.sub, action: "DATA_EXPORTED", entity: "User", entityId: auth.sub });

    return apiSuccess({ data: user });
  } catch (error) {
    logger.error({ error }, "Failed to export data");
    return handleApiError(error, "account.data.export");
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await request.json();
    if (!body.confirm || body.confirm !== "DELETE") {
      return apiError("CONFIRMATION_REQUIRED", "Send { confirm: 'DELETE' } to confirm account deletion", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!user) {
      return apiError("NOT_FOUND", "User not found", 404);
    }

    const deletedEmailHash = await hashPassword(user.email);
    const maskedEmail = `deleted_${deletedEmailHash.slice(0, 16)}@pinenova.local`;

    await prisma.user.update({
      where: { id: auth.sub },
      data: {
        email: maskedEmail,
        firstName: "Deleted",
        lastName: "User",
        passwordHash: null,
        status: "DISABLED",
      },
    });

    await clearUserRefreshTokens(auth.sub);

    await logAuditEvent({ userId: auth.sub, action: "ACCOUNT_DELETED", entity: "User", entityId: auth.sub });

    logger.info({ userId: auth.sub }, "Account deleted");
    return apiSuccess({ message: "Account deleted. Your order history has been preserved." });
  } catch (error) {
    logger.error({ error }, "Failed to delete account");
    return handleApiError(error, "account.data.delete");
  }
}
