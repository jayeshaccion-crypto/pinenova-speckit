import { prisma } from "@/lib/db";

export const reviewRepository = {
  async findByProduct(productId: string) {
    return prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(productId: string, userId: string, rating: number, body: string, orderId?: string) {
    const existing = await prisma.review.findFirst({ where: { productId, userId } });
    if (existing) throw new Error("You have already reviewed this product");

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId, status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      });
      if (!order) throw new Error("Cannot review: no valid purchase found for this product");
    }

    return prisma.review.create({
      data: { productId, userId, orderId, rating, body, status: "PENDING" },
    });
  },

  async update(id: string, userId: string, data: Partial<{ rating: number; body: string }>) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review || review.userId !== userId) throw new Error("Review not found or not owned by user");
    if (Date.now() - review.createdAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
      throw new Error("Review can only be edited within 30 days");
    }

    return prisma.review.update({ where: { id }, data: { ...data, status: "PENDING" } });
  },

  async findAll(page: number = 1, limit: number = 20) {
    const [data, total] = await Promise.all([
      prisma.review.findMany({
        include: { user: { select: { firstName: true, lastName: true } }, product: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async moderate(id: string, status: "APPROVED" | "REJECTED") {
    return prisma.review.update({ where: { id }, data: { status } });
  },

  async delete(id: string) {
    return prisma.review.delete({ where: { id } });
  },
};
