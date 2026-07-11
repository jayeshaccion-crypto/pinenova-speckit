import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

const slugSchema = z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const parsed = slugSchema.safeParse(params.slug);
    if (!parsed.success) {
      return Response.json(
        { error: { code: "INVALID_SLUG", message: "Invalid product slug format" } },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { slug: params.slug, published: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" } },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true, body: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!product) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 },
      );
    }

    logger.info({ event: "products.detail.success", slug: params.slug, productId: product.id });

    return Response.json(product);
  } catch (error) {
    logger.error({ error, context: "products.detail", slug: params.slug }, "Failed to get product");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }, { status: 500 });
  }
}
