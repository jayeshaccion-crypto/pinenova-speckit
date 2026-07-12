import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(key: string, maxRequests: number = 30, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function rateLimitResponse(remaining: number): NextResponse {
  const response = NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later.", requestId: crypto.randomUUID() } },
    { status: 429 },
  );
  response.headers.set("Retry-After", "60");
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}
