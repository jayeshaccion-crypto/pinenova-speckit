import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().min(1).max(200),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = searchSchema.safeParse({ q: searchParams.get("q") });

    if (!parsed.success) {
      return Response.json({ error: { code: "INVALID_PARAMS", message: "Query parameter q is required" } }, { status: 400 });
    }

    const { q } = parsed.data;

    const products = await prisma.product.findMany({
      where: {
        published: true,
        isArchived: false,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ products });
  } catch (error) {
    logger.error({ error, context: "products.search" }, "Search failed");
    return Response.json({ products: [] });
  }
}
