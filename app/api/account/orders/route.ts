import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthUser, apiError, apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10) || 10));

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: auth.sub },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { userId: auth.sub } }),
    ]);

    logger.info({ userId: auth.sub, count: data.length }, "Orders fetched");

    return apiSuccess({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error({ error }, "Failed to fetch orders");
    return handleApiError(error, "account.orders");
  }
}
