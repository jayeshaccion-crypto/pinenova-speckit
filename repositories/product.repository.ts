import { prisma } from "@/lib/db";
import type { CreateProductInput, UpdateProductInput, ProductFilter, PaginatedResult } from "@/types";
import { Prisma } from "@prisma/client";

export const productRepository = {
  async findByCategory(slug: string) {
    return prisma.product.findMany({
      where: { category: { slug }, published: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug, published: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        reviews: { where: { status: "APPROVED" }, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
  },

  async findAll(filters: ProductFilter): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ProductWhereInput = { published: true };
    if (filters.category) where.category = { slug: filters.category };
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (filters.sortBy === "price") orderBy.price = filters.sortOrder || "asc";
    else if (filters.sortBy === "name") orderBy.name = filters.sortOrder || "asc";
    else orderBy.createdAt = "desc";

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true },
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) };
  },

  async search(query: string, page: number = 1, limit: number = 12): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ProductWhereInput = {
      published: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
    });
  },

  async create(data: CreateProductInput) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return prisma.product.create({
      data: { ...data, slug, sku: `PN-${slug}-${Date.now()}` },
      include: { images: true, category: true },
    });
  },

  async update(id: string, data: UpdateProductInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: { images: true, category: true },
    });
  },

  async delete(id: string) {
    const orderCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) throw new Error("Cannot delete product with active orders. Disable it instead.");
    return prisma.product.delete({ where: { id } });
  },

  async getCategories() {
    return prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { published: true } } } } },
    });
  },
};
