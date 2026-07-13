import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, adminAudit } from "@/lib/admin-utils";
import { checkCSRF } from "@/lib/api-utils";
import { AdminDiscountCreateSchema, AdminDiscountUpdateSchema } from "@/types";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({ data: codes });
  } catch (error) {
    logger.error({ error, context: "admin.discounts.list" }, "Failed to list discounts");
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
    const parsed = AdminDiscountCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid discount data", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const existing = await prisma.discountCode.findUnique({ where: { code: parsed.data.code } });
    if (existing) {
      return Response.json({ error: { code: "DUPLICATE_CODE", message: "Discount code already exists", requestId: crypto.randomUUID() } }, { status: 409 });
    }

    const discount = await prisma.discountCode.create({
      data: {
        code: parsed.data.code,
        type: parsed.data.type,
        value: parsed.data.value,
        maxUses: parsed.data.maxUses,
        minOrderAmount: parsed.data.minOrderAmount,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });

    logger.info({ discountId: discount.id, code: discount.code, adminId: auth.sub }, "Admin created discount code");
    await adminAudit({ adminId: auth.sub, action: "DISCOUNT_CREATED", entity: "DiscountCode", entityId: discount.id, after: parsed.data });

    return Response.json({ data: discount }, { status: 201 });
  } catch (error) {
    logger.error({ error, context: "admin.discounts.create" }, "Failed to create discount");
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
    const id = url.searchParams.get("id");
    if (!id) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Discount ID required", requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const body = await request.json();
    const parsed = AdminDiscountUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid discount data", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const before = await prisma.discountCode.findUnique({ where: { id } });
    if (!before) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Discount code not found", requestId: crypto.randomUUID() } }, { status: 404 });
    }

    if (parsed.data.code && parsed.data.code !== before.code) {
      const conflict = await prisma.discountCode.findUnique({ where: { code: parsed.data.code } });
      if (conflict) {
        return Response.json({ error: { code: "DUPLICATE_CODE", message: "Discount code already exists", requestId: crypto.randomUUID() } }, { status: 409 });
      }
    }

    const updateData: any = { ...parsed.data };
    if (updateData.expiresAt) updateData.expiresAt = new Date(updateData.expiresAt);

    const discount = await prisma.discountCode.update({ where: { id }, data: updateData });

    logger.info({ discountId: id, adminId: auth.sub }, "Admin updated discount code");
    await adminAudit({ adminId: auth.sub, action: "DISCOUNT_UPDATED", entity: "DiscountCode", entityId: id, before, after: updateData });

    return Response.json({ data: discount });
  } catch (error) {
    logger.error({ error, context: "admin.discounts.update" }, "Failed to update discount");
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
    const id = url.searchParams.get("id");
    if (!id) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Discount ID required", requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const before = await prisma.discountCode.findUnique({ where: { id } });
    if (!before) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Discount code not found", requestId: crypto.randomUUID() } }, { status: 404 });
    }

    await prisma.discountCode.update({ where: { id }, data: { isActive: false } });

    logger.info({ discountId: id, adminId: auth.sub }, "Admin deactivated discount code");
    await adminAudit({ adminId: auth.sub, action: "DISCOUNT_DEACTIVATED", entity: "DiscountCode", entityId: id, before, after: { isActive: false } });

    return Response.json({ message: "Discount code deactivated" });
  } catch (error) {
    logger.error({ error, context: "admin.discounts.delete" }, "Failed to deactivate discount");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}
