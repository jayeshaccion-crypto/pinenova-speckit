import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

const querySchema = z.object({
  category: z.string().optional(),
  material: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "popularity"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine(
  (d) => d.minPrice === undefined || d.maxPrice === undefined || d.minPrice <= d.maxPrice,
  { message: "minPrice must not exceed maxPrice", path: ["minPrice"] },
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(rawParams);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "INVALID_PARAMS", message: "Invalid query parameters", details: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { category, material, minPrice, maxPrice, sort, page, limit } = parsed.data;

    const where: any = { published: true };

    if (category) {
      where.category = { slug: category };
    }

    if (material) {
      where.materialTag = material;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "newest") orderBy = { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    logger.info({ event: "products.list.success", count: products.length, page, category, material, sort });

    return Response.json({ products, total, page, limit });
  } catch (error) {
    logger.error({ error, context: "products.list" }, "Failed to list products");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
  }
}
