import { prisma } from "@/lib/db";

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data: { email: string; passwordHash: string; firstName: string; lastName: string }) {
    return prisma.user.create({
      data: { ...data, role: "CUSTOMER" },
    });
  },

  async createSocialUser(data: { email: string; firstName: string; lastName: string; provider: string; providerId: string }) {
    return prisma.user.create({
      data: { ...data, role: "CUSTOMER", passwordHash: null },
    });
  },

  async update(id: string, data: Partial<{ firstName: string; lastName: string; email: string; passwordHash: string }>) {
    return prisma.user.update({ where: { id }, data });
  },

  async findAll(page: number = 1, limit: number = 20) {
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async setStatus(id: string, status: "ACTIVE" | "DISABLED") {
    return prisma.user.update({ where: { id }, data: { status } });
  },
};
