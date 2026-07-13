import { NextResponse } from "next/server";
import Redis from "ioredis";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

let redisClient: Redis | null = null;
let redisInitTried = false;

export function getRedis(): Redis | null {
  if (redisInitTried) return redisClient;
  redisInitTried = true;
  const url = process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL;
  if (!url) return null;
  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });
    redisClient.connect().catch(() => {
      redisClient = null;
    });
  } catch {
    redisClient = null;
  }
  return redisClient;
}

export async function rateLimit(
  key: string,
  maxOrOpts?: number | { max?: number; windowMs?: number },
  windowMs?: number,
): Promise<RateLimitResult> {
  let max: number;
  let winMs: number;

  if (typeof maxOrOpts === "object") {
    max = maxOrOpts.max ?? 30;
    winMs = maxOrOpts.windowMs ?? 60000;
  } else {
    max = maxOrOpts ?? 30;
    winMs = windowMs ?? 60000;
  }

  const client = getRedis();
  if (client) {
    try {
      const current = await client.incr(key);
      if (current === 1) {
        await client.pexpire(key, winMs);
      }
      const ttl = await client.pttl(key);
      return {
        allowed: current <= max,
        remaining: Math.max(0, max - current),
        resetAt: ttl > 0 ? Date.now() + ttl : Date.now() + winMs,
      };
    } catch {
      return fallbackRateLimit(key, max, winMs);
    }
  }

  return fallbackRateLimit(key, max, winMs);
}

function fallbackRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = inMemoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }
  entry.count++;
  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function resetRateLimit(key: string): Promise<void> {
  const client = getRedis();
  if (client) {
    try {
      await client.del(key);
      return;
    } catch {
      // fall through to in-memory
    }
  }
  inMemoryStore.delete(key);
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
