import { NextResponse } from "next/server";
import { verifyAccessToken } from "./auth";
import { logger } from "./logger";
import { rateLimit } from "./rate-limit";
import { logAuditEvent } from "./audit";

export async function requireAdmin(request: Request): Promise<{ sub: string } | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required", requestId: crypto.randomUUID() } }, { status: 401 });
  }

  const payload = await verifyAccessToken(authHeader.slice(7));
  if (!payload) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token", requestId: crypto.randomUUID() } }, { status: 401 });
  }

  if (payload.role !== "ADMIN") {
    logger.warn({ userId: payload.sub }, "Non-admin attempted admin access");
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required", requestId: crypto.randomUUID() } }, { status: 403 });
  }

  const rl = await rateLimit(`admin:${payload.sub}`, { max: 60, windowMs: 60000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests", requestId: crypto.randomUUID() } }, { status: 429 });
  }

  return { sub: payload.sub };
}

export async function adminAudit(params: { adminId: string; action: string; entity: string; entityId?: string; before?: unknown; after?: unknown }) {
  await logAuditEvent({ userId: params.adminId, action: params.action, entity: params.entity, entityId: params.entityId, before: params.before, after: params.after });
}

const TRANSITION_MAP: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "REFUNDED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "REFUNDED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUNDED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["REFUNDED"],
};

export function isValidTransition(from: string, to: string): boolean {
  const allowed = TRANSITION_MAP[from];
  if (!allowed) return false;
  return allowed.includes(to);
}
