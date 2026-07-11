import { NextResponse } from "next/server";
import { verifyAccessToken } from "./auth";

export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  return payload;
}

export function requireRole(payload: { role: string } | null, roles: string[]) {
  if (!payload) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  if (!roles.includes(payload.role)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You do not have permission to perform this action" } },
      { status: 403 },
    );
  }

  return null;
}

export function apiError(code: string, message: string, status: number, details?: Array<{ field: string; message: string }>) {
  return NextResponse.json(
    { error: { code, message, details, requestId: crypto.randomUUID() } },
    { status },
  );
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown, context: string) {
  const { logger } = require("./logger");
  logger.error({ error, context }, "API Error");
  return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}
