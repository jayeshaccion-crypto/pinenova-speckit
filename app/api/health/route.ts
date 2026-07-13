import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRedis } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: { db: boolean; redis: boolean } = { db: false, redis: false };
  const start = Date.now();

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.db = true;
  } catch {
    // db remains false
  }

  if (process.env.REDIS_URL) {
    try {
      const client = getRedis();
      if (client) {
        await client.ping();
        checks.redis = true;
      }
    } catch {
      // redis remains false
    }
  }

  const healthy = checks.db && checks.redis;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      db: checks.db,
      redis: checks.redis,
      uptime: process.uptime(),
      responseTime: Date.now() - start,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
