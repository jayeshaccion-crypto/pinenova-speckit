import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, adminAudit, isValidTransition } from "@/lib/admin-utils";
import { checkCSRF } from "@/lib/api-utils";
import { AdminStatusUpdateSchema, AdminRefundSchema } from "@/types";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const status = url.searchParams.get("status");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const customer = url.searchParams.get("customer");

    const where: any = {};
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (customer) {
      where.OR = [
        { email: { contains: customer, mode: "insensitive" } },
        { user: { firstName: { contains: customer, mode: "insensitive" } } },
        { user: { lastName: { contains: customer, mode: "insensitive" } } },
        { orderNumber: { contains: customer, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { items: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    return Response.json({ data: orders, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error({ error, context: "admin.orders.list" }, "Failed to list orders");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = AdminStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid status update", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
    if (!order) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Order not found", requestId: crypto.randomUUID() } }, { status: 404 });
    }

    if (!isValidTransition(order.status, parsed.data.status)) {
      return Response.json({ error: { code: "INVALID_TRANSITION", message: `Cannot transition from ${order.status} to ${parsed.data.status}`, requestId: crypto.randomUUID() } }, { status: 409 });
    }

    const updated = await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: {
        status: parsed.data.status,
        trackingNumber: parsed.data.trackingNumber,
        carrier: parsed.data.carrier,
      },
    });

    await prisma.orderStatusLog.create({
      data: {
        orderId: parsed.data.orderId,
        fromStatus: order.status,
        toStatus: parsed.data.status,
        changedBy: auth.sub,
        reason: parsed.data.reason,
      },
    });

    logger.info({ orderId: parsed.data.orderId, from: order.status, to: parsed.data.status, adminId: auth.sub }, "Admin updated order status");
    await adminAudit({ adminId: auth.sub, action: "ORDER_STATUS_UPDATED", entity: "Order", entityId: parsed.data.orderId, before: { status: order.status }, after: { status: parsed.data.status } });

    if (parsed.data.status === "SHIPPED" && order.email) {
      const emailRes = emailTemplates.shippingNotification(order.orderNumber, parsed.data.trackingNumber || undefined);
      sendEmail({ to: order.email, ...emailRes }).catch((e) => logger.error({ error: e, orderId: order.id }, "Failed to send shipping notification"));
    } else if (parsed.data.status === "CANCELLED" && order.email) {
      const emailRes = emailTemplates.orderCancellation(order.orderNumber, parsed.data.reason || undefined);
      sendEmail({ to: order.email, ...emailRes }).catch((e) => logger.error({ error: e, orderId: order.id }, "Failed to send cancellation email"));
    }

    return Response.json({ data: updated });
  } catch (error) {
    logger.error({ error, context: "admin.orders.update" }, "Failed to update order");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = AdminRefundSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid refund request", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
    if (!order) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Order not found", requestId: crypto.randomUUID() } }, { status: 404 });
    }

    if (!order.stripePaymentIntentId) {
      return Response.json({ error: { code: "NO_PAYMENT", message: "Order has no payment to refund", requestId: crypto.randomUUID() } }, { status: 400 });
    }

    if (order.refundId) {
      logger.info({ orderId: parsed.data.orderId, refundId: order.refundId }, "Duplicate refund request — returning existing refund");
      return Response.json({ data: order, message: "Refund already processed" });
    }

    if (order.status === "REFUNDED" || order.status === "CANCELLED") {
      return Response.json({ error: { code: "ALREADY_REFUNDED", message: "Order is already refunded or cancelled", requestId: crypto.randomUUID() } }, { status: 409 });
    }

    let stripe;
    try {
      stripe = (await import("@/lib/stripe")).stripe;
    } catch (error: any) {
      if (error?.code !== "MODULE_NOT_FOUND") throw error;
      logger.error({}, "Stripe not configured — simulating refund");
      const updated = await prisma.order.update({
        where: { id: parsed.data.orderId },
        data: { status: "REFUNDED", refundAmount: order.total, refundId: `simulated_${crypto.randomUUID()}` },
      });
      await prisma.orderStatusLog.create({ data: { orderId: parsed.data.orderId, fromStatus: order.status, toStatus: "REFUNDED", changedBy: auth.sub, reason: parsed.data.reason || "Refunded" } });
      logger.info({ orderId: parsed.data.orderId, adminId: auth.sub }, "Admin issued simulated refund");
      await adminAudit({ adminId: auth.sub, action: "ORDER_REFUNDED", entity: "Order", entityId: parsed.data.orderId, before: { status: order.status }, after: { status: "REFUNDED" } });
      if (order.email) {
        const emailRes = emailTemplates.refundProcessed(order.orderNumber, Number(order.total).toFixed(2));
        sendEmail({ to: order.email, ...emailRes }).catch((e) => logger.error({ error: e, orderId: order.id }, "Failed to send refund email"));
      }
      return Response.json({ data: updated, message: "Simulated refund processed (Stripe not configured)" });
    }

    const idempotencyKey = `refund_${parsed.data.orderId}_${Date.now()}`;
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      metadata: { orderId: parsed.data.orderId, adminId: auth.sub },
    }, { idempotencyKey });

    const updated = await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: { status: "REFUNDED", refundId: refund.id, refundAmount: order.total },
    });

    await prisma.orderStatusLog.create({
      data: { orderId: parsed.data.orderId, fromStatus: order.status, toStatus: "REFUNDED", changedBy: auth.sub, reason: parsed.data.reason || "Refunded via Stripe" },
    });

    logger.info({ orderId: parsed.data.orderId, refundId: refund.id, adminId: auth.sub }, "Admin issued refund");
    await adminAudit({ adminId: auth.sub, action: "ORDER_REFUNDED", entity: "Order", entityId: parsed.data.orderId, before: { status: order.status }, after: { status: "REFUNDED", refundId: refund.id } });

    if (order.email) {
      const emailRes = emailTemplates.refundProcessed(order.orderNumber, Number(order.total).toFixed(2));
      sendEmail({ to: order.email, ...emailRes }).catch((e) => logger.error({ error: e, orderId: order.id }, "Failed to send refund email"));
    }

    return Response.json({ data: updated, message: "Refund processed" });
  } catch (error) {
    logger.error({ error, context: "admin.orders.refund" }, "Failed to process refund");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Refund failed", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}
