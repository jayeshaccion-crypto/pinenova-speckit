import { NextResponse } from "next/server";
import { verifyAccessToken } from "./auth";
import { logger } from "./logger";

export async function getAuthUser(request: Request) {
  let token: string | null = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/accessToken=([^;]+)/);
      if (match) token = match[1];
    }
  }
  if (!token) return null;

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
  logger.error({ error, context }, "API Error");
  return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

export function checkCSRF(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const allowedOrigin = new URL(appUrl).origin;
  if (!origin && !referer) {
    return apiError("CSRF_REJECTED", "Request origin or referer required", 403);
  }
  if (origin && origin !== allowedOrigin) {
    return apiError("CSRF_REJECTED", "Invalid request origin", 403);
  }
  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== allowedOrigin) {
        return apiError("CSRF_REJECTED", "Invalid request referer", 403);
      }
    } catch {
      return apiError("CSRF_REJECTED", "Invalid referer header", 403);
    }
  }
  return null;
}
