import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, adminAudit, isValidTransition } from "@/lib/admin-utils";
import { checkCSRF } from "@/lib/api-utils";

export async function PATCH(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const { orderIds, status, reason } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "orderIds must be a non-empty array", requestId: crypto.randomUUID() } }, { status: 400 });
    }

    if (!status) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "status is required", requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const orders = await prisma.order.findMany({ where: { id: { in: orderIds } } });
    if (orders.length === 0) {
      return Response.json({ error: { code: "NOT_FOUND", message: "No orders found", requestId: crypto.randomUUID() } }, { status: 404 });
    }

    const errors: { orderId: string; message: string }[] = [];
    const updated: { id: string; orderNumber: string; from: string; to: string }[] = [];

    for (const order of orders) {
      if (!isValidTransition(order.status, status)) {
        errors.push({ orderId: order.id, message: `Cannot transition from ${order.status} to ${status}` });
        continue;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status },
      });

      await prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: status,
          changedBy: auth.sub,
          reason: reason || "Bulk status update",
        },
      });

      updated.push({ id: order.id, orderNumber: order.orderNumber, from: order.status, to: status });
    }

    logger.info({ adminId: auth.sub, count: updated.length, targetStatus: status }, "Bulk order status update");
    await adminAudit({
      adminId: auth.sub, action: "BULK_ORDER_STATUS", entity: "Order",
      after: { status, orderIds, updatedCount: updated.length, errorCount: errors.length },
    });

    return Response.json({ data: { updated, errors } });
  } catch (error) {
    logger.error({ error, context: "admin.orders.bulk" }, "Failed to bulk update orders");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}
