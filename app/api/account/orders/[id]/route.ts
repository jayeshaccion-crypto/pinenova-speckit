import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthUser, apiError, apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return apiError("UNAUTHORIZED", "Authentication required", 401);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) return apiError("NOT_FOUND", "Order not found", 404);
    if (order.userId !== auth.sub) return apiError("FORBIDDEN", "Access denied", 403);

    logger.info({ orderId: params.id, userId: auth.sub }, "Order detail fetched");
    return apiSuccess({ data: order });
  } catch (error) {
    logger.error({ error, orderId: params.id }, "Failed to fetch order detail");
    return handleApiError(error, "account.order.detail");
  }
}
