import { prisma } from "@/lib/db";

export const categoryRepository = {
  async findAll() {
    return prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
  },

  async findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { published: true },
          include: { images: { orderBy: { sortOrder: "asc" } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { products: { where: { published: true } } } },
      },
    });
  },

  async findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },
};
