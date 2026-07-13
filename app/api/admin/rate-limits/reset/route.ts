import { NextResponse } from "next/server";
import { requireAdmin, adminAudit } from "@/lib/admin-utils";
import { resetRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { AdminRateLimitResetSchema } from "@/types";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = AdminRateLimitResetSchema.parse(await request.json());
    await resetRateLimit(body.key);
    logger.info({ adminId: auth.sub, key: body.key }, "Rate limit key reset by admin");
    await adminAudit({ adminId: auth.sub, action: "RESET_RATE_LIMIT", entity: "rate_limit", entityId: body.key });
    return NextResponse.json({ reset: true, key: body.key });
  } catch (error: any) {
    logger.error({ error: { message: error.message } }, "Rate limit reset failed");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to reset rate limit" } }, { status: 500 });
  }
}
