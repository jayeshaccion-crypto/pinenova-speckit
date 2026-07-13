import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthUser, apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { CreateReviewSchema } from "@/types";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const product = await prisma.product.findUnique({ where: { slug: params.slug, published: true }, select: { id: true } });
    if (!product) return apiError("NOT_FOUND", "Product not found", 404);

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: product.id, status: "APPROVED" },
        select: { id: true, rating: true, body: true, createdAt: true, user: { select: { firstName: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { productId: product.id, status: "APPROVED" } }),
    ]);

    return apiSuccess({ data: reviews, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error({ error, slug: params.slug }, "Failed to fetch reviews");
    return handleApiError(error, "reviews.list");
  }
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return apiError("UNAUTHORIZED", "Authentication required", 401);

    const product = await prisma.product.findUnique({ where: { slug: params.slug, published: true } });
    if (!product) return apiError("NOT_FOUND", "Product not found", 404);

    const body = await request.json();
    const parsed = CreateReviewSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid input", 400, parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })));
    }

    const review = await prisma.$transaction(async (tx) => {
      const existing = await tx.review.findFirst({
        where: { productId: product.id, userId: auth.sub, status: { not: "REJECTED" } },
      });
      if (existing) {
        throw new Error("ALREADY_REVIEWED");
      }
      return tx.review.create({
        data: {
          productId: product.id,
          userId: auth.sub,
          rating: parsed.data.rating,
          body: parsed.data.body,
          status: "PENDING",
        },
      });
    });

    logger.info({ reviewId: review.id, productId: product.id, userId: auth.sub }, "Review submitted");
    return apiSuccess({ data: review }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_REVIEWED") {
      return apiError("CONFLICT", "You have already reviewed this product", 409);
    }
    logger.error({ error, slug: params.slug }, "Failed to create review");
    return handleApiError(error, "reviews.create");
  }
}
