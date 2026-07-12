import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, adminAudit } from "@/lib/admin-utils";
import { checkCSRF } from "@/lib/api-utils";
import { AdminProductCreateSchema, AdminProductUpdateSchema } from "@/types";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25")));
    const search = url.searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { category: { select: { id: true, name: true } }, images: { take: 1, orderBy: { sortOrder: "asc" } } },
      }),
      prisma.product.count({ where }),
    ]);

    return Response.json({ data: products, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error({ error, context: "admin.products.list" }, "Failed to list products");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = AdminProductCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid product data", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const existing = await prisma.product.findFirst({ where: { OR: [{ slug: parsed.data.slug }, { sku: parsed.data.sku }] } });
    if (existing) {
      return Response.json({ error: { code: "CONFLICT", message: "Product with this slug or SKU already exists", requestId: crypto.randomUUID() } }, { status: 409 });
    }

    const product = await prisma.product.create({ data: parsed.data });

    logger.info({ productId: product.id, adminId: auth.sub }, "Admin created product");
    await adminAudit({ adminId: auth.sub, action: "PRODUCT_CREATED", entity: "Product", entityId: product.id, after: parsed.data });

    return Response.json({ data: product }, { status: 201 });
  } catch (error) {
    logger.error({ error, context: "admin.products.create" }, "Failed to create product");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const productId = url.searchParams.get("id");
    if (!productId) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Product ID required", requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const body = await request.json();
    const parsed = AdminProductUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid product data", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const before = await prisma.product.findUnique({ where: { id: productId } });
    if (!before) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Product not found", requestId: crypto.randomUUID() } }, { status: 404 });
    }

    if (parsed.data.slug && parsed.data.slug !== before.slug) {
      const slugConflict = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
      if (slugConflict) {
        return Response.json({ error: { code: "CONFLICT", message: "Slug already in use", requestId: crypto.randomUUID() } }, { status: 409 });
      }
    }

    const product = await prisma.product.update({ where: { id: productId }, data: parsed.data });

    logger.info({ productId, adminId: auth.sub }, "Admin updated product");
    await adminAudit({ adminId: auth.sub, action: "PRODUCT_UPDATED", entity: "Product", entityId: productId, before, after: parsed.data });

    return Response.json({ data: product });
  } catch (error) {
    logger.error({ error, context: "admin.products.update" }, "Failed to update product");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const productId = url.searchParams.get("id");
    if (!productId) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Product ID required", requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const before = await prisma.product.findUnique({ where: { id: productId } });
    if (!before) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Product not found", requestId: crypto.randomUUID() } }, { status: 404 });
    }

    await prisma.product.update({ where: { id: productId }, data: { isArchived: true } });

    logger.info({ productId, adminId: auth.sub }, "Admin archived product");
    await adminAudit({ adminId: auth.sub, action: "PRODUCT_ARCHIVED", entity: "Product", entityId: productId, before, after: { isArchived: true } });

    return Response.json({ message: "Product archived" });
  } catch (error) {
    logger.error({ error, context: "admin.products.delete" }, "Failed to archive product");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}
