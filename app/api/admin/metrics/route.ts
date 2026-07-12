import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/admin-utils";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const format = url.searchParams.get("format");

    const where: any = { status: { not: "CANCELLED" } };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (format === "csv") {
      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
      });

      const headers = "Order #,Date,Customer,Status,Total,Items";
      const rows = orders.map((o) => {
        const customer = o.user ? `${o.user.firstName} ${o.user.lastName} (${o.user.email})` : o.email || "Guest";
        const items = o.items.map((i: any) => {
          const snapshot = i.productSnapshot as Record<string, unknown> | null;
          const itemName = snapshot?.name ?? "Product";
          return `${itemName} x${i.quantity}`;
        }).join("; ");
        return `"${o.orderNumber}","${o.createdAt.toISOString()}","${customer}","${o.status}","${Number(o.total).toFixed(2)}","${items}"`;
      });

      const csv = [headers, ...rows].join("\n");
      return new Response(csv, {
        status: 200,
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="orders-export-${new Date().toISOString().split("T")[0]}.csv"` },
      });
    }

    const [aggregation] = await prisma.$queryRawUnsafe<Array<{ totalRevenue: string; orderCount: bigint; avgOrderValue: string }>>(
      `SELECT COALESCE(SUM(total::numeric), 0)::text as "totalRevenue", COUNT(*)::bigint as "orderCount", COALESCE(AVG(total::numeric), 0)::text as "avgOrderValue" FROM "Order" WHERE status != 'CANCELLED'${dateFrom ? ` AND "createdAt" >= $1` : ""}${dateTo ? ` AND "createdAt" <= $2` : ""}`,
      ...(dateFrom ? [dateFrom] : []),
      ...(dateTo ? [dateTo] : []),
    );

    const orderCount = await prisma.order.count({ where: { status: { not: "CANCELLED" } } });

    return Response.json({
      totalRevenue: Math.round(parseFloat(aggregation.totalRevenue) * 100),
      orderCount: Number(aggregation.orderCount),
      averageOrderValue: orderCount > 0 ? Math.round((parseFloat(aggregation.totalRevenue) / orderCount) * 100) : 0,
    });
  } catch (error) {
    logger.error({ error, context: "admin.metrics" }, "Failed to get metrics");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}
