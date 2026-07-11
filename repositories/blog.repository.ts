import { prisma } from "@/lib/db";
import type { CreateBlogInput, UpdateBlogInput } from "@/types";

export const blogRepository = {
  async findAllPublished(page: number = 1, limit: number = 10) {
    const [data, total] = await Promise.all([
      prisma.blogArticle.findMany({
        where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogArticle.count({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findBySlug(slug: string) {
    return prisma.blogArticle.findUnique({
      where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    });
  },

  async findAll(page: number = 1, limit: number = 20) {
    const [data, total] = await Promise.all([
      prisma.blogArticle.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.blogArticle.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.blogArticle.findUnique({ where: { id } });
  },

  async create(data: CreateBlogInput) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return prisma.blogArticle.create({
      data: {
        ...data,
        slug,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
    });
  },

  async update(id: string, data: UpdateBlogInput) {
    return prisma.blogArticle.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.status === "PUBLISHED" ? new Date() : undefined,
      },
    });
  },

  async delete(id: string) {
    return prisma.blogArticle.delete({ where: { id } });
  },
};
