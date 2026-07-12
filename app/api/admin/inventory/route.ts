import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, adminAudit } from "@/lib/admin-utils";
import { checkCSRF } from "@/lib/api-utils";
import { AdminInventoryAdjustSchema } from "@/types";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const products = await prisma.product.findMany({
      where: { isArchived: false },
      orderBy: { stock: "asc" },
      select: {
        id: true, name: true, slug: true, sku: true, stock: true, lowStockThreshold: true,
        updatedAt: true, createdAt: true,
      },
    });

    const auditLog = await prisma.inventoryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return Response.json({ data: products, auditLog });
  } catch (error) {
    logger.error({ error, context: "admin.inventory.list" }, "Failed to list inventory");
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
    const parsed = AdminInventoryAdjustSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid adjustment", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    if (!product) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Product not found", requestId: crypto.randomUUID() } }, { status: 404 });
    }

    if (parsed.data.newStock < 0) {
      return Response.json({ error: { code: "INVALID_STOCK", message: "Stock cannot be negative", requestId: crypto.randomUUID() } }, { status: 409 });
    }

    const oldStock = product.stock;
    const change = parsed.data.newStock - oldStock;

    let conflictWarning: string | undefined;
    const updatedAtStr = urlSearchParams(request.url).get("expectedUpdatedAt");
    if (updatedAtStr) {
      const expectedUpdatedAt = new Date(updatedAtStr);
      if (product.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        conflictWarning = "Product was modified by another admin since this page was loaded. Last-write-wins.";
        logger.warn({ productId: parsed.data.productId, adminId: auth.sub, expected: expectedUpdatedAt.toISOString(), actual: product.updatedAt.toISOString() }, "Concurrent inventory modification detected");
      }
    }

    const updated = await prisma.product.update({
      where: { id: parsed.data.productId },
      data: { stock: parsed.data.newStock },
    });

    await prisma.inventoryLog.create({
      data: {
        productId: parsed.data.productId,
        oldStock,
        newStock: parsed.data.newStock,
        change,
        reason: parsed.data.reason,
        orderId: null,
      },
    });

    logger.info({ productId: parsed.data.productId, oldStock, newStock: parsed.data.newStock, adminId: auth.sub }, "Admin adjusted inventory");
    await adminAudit({ adminId: auth.sub, action: "INVENTORY_ADJUSTED", entity: "Product", entityId: parsed.data.productId, before: { stock: oldStock }, after: { stock: parsed.data.newStock } });

    const response: any = { data: updated };
    if (conflictWarning) response.warning = conflictWarning;
    return Response.json(response);
  } catch (error) {
    logger.error({ error, context: "admin.inventory.adjust" }, "Failed to adjust inventory");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}

function urlSearchParams(url: string): URLSearchParams {
  return new URL(url).searchParams;
}
