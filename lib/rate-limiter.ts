import { NextResponse } from "next/server";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 5;

export function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export function checkAuthRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = `auth:${identifier}`;
  const record = requestCounts.get(key);

  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return true;
  }

  if (record.count >= AUTH_MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

export function rateLimitMiddleware(request: Request, limit?: number): NextResponse | null {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const authenticated = request.headers.get("authorization")?.startsWith("Bearer ");
  const maxRequests = authenticated ? 300 : limit || 100;

  if (!checkRateLimit(ip, maxRequests)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  return null;
}
