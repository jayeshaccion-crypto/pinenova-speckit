import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";

function generateOrderNumber(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const rand = randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `ORD-${yy}${mm}${dd}-${rand}`;
}

export const orderRepository = {
  async create(data: {
    userId: string;
    items: Array<{ productId: string; productSnapshot: unknown; quantity: number; unitPrice: number }>;
    subtotal: number;
    tax: number;
    shippingCost: number;
    total: number;
    shippingAddress: unknown;
    stripeSessionId: string;
  }) {
    const orderNumber = generateOrderNumber();
    return prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
      }

      const order = await tx.order.create({
        data: {
          userId: data.userId,
          orderNumber,
          status: "CONFIRMED",
          subtotal: data.subtotal,
          tax: data.tax,
          shippingCost: data.shippingCost,
          total: data.total,
          shippingAddress: data.shippingAddress as never,
          stripeSessionId: data.stripeSessionId,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              productSnapshot: item.productSnapshot as never,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
          statusLogs: {
            create: { toStatus: "CONFIRMED" },
          },
        },
        include: { items: true },
      });

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      logger.info({ orderId: order.id, userId: data.userId }, "Order created with stock deduction");
      return order;
    });
  },

  async findByUser(userId: string, page: number = 1, limit: number = 10) {
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { items: true, statusLogs: { orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: "desc" } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  },

  async findAll(page: number = 1, limit: number = 20, filters?: { status?: string; userId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateStatus(id: string, status: string, changedBy?: string, trackingNumber?: string, carrier?: string, reason?: string) {
    const data: Record<string, unknown> = { status };
    if (trackingNumber) data.trackingNumber = trackingNumber;
    if (carrier) data.carrier = carrier;
    if (reason && status === "CANCELLED") data.cancelReason = reason;

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });

    await prisma.orderStatusLog.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: status,
        changedBy,
        reason,
      },
    });

    if (status === "CANCELLED") {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return order;
  },

  async getDashboardMetrics() {
    const [totalOrders, totalRevenue, lowStockCount, newUsers] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      lowStockCount,
      newUsers,
    };
  },
};
