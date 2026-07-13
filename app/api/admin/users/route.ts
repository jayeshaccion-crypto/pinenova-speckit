import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, adminAudit } from "@/lib/admin-utils";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-utils";
import { AdminUserUpdateSchema } from "@/types";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25")));
    const search = url.searchParams.get("search");

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, provider: true, totpEnabled: true, createdAt: true, updatedAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    return apiSuccess({ data: users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error({ error, context: "admin.users.list" }, "Failed to list users");
    return handleApiError(error, "admin.users");
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = AdminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid user update", 400, parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })));
    }

    const { userId, ...updates } = parsed.data;
    if (Object.keys(updates).length === 0) {
      return apiError("VALIDATION_ERROR", "No fields to update", 400);
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return apiError("NOT_FOUND", "User not found", 404);
    }

    if (userId === auth.sub && updates.role === "CUSTOMER") {
      return apiError("FORBIDDEN", "Cannot demote yourself from admin", 403);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
    });

    logger.info({ adminId: auth.sub, targetUserId: userId, changes: updates }, "Admin updated user");
    await adminAudit({ adminId: auth.sub, action: "USER_UPDATED", entity: "User", entityId: userId, before: { role: existing.role, status: existing.status }, after: updates });

    return apiSuccess({ data: updated });
  } catch (error) {
    logger.error({ error, context: "admin.users.update" }, "Failed to update user");
    return handleApiError(error, "admin.users");
  }
}
