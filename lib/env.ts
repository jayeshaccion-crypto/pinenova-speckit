import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_"),
  S3_ACCESS_KEY_ID: z.string().min(16, "S3_ACCESS_KEY_ID too short").optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(32, "S3_SECRET_ACCESS_KEY too short").optional(),
  S3_BUCKET: z.string().min(3, "S3_BUCKET name too short").optional(),
  S3_REGION: z.string().default("us-east-1"),
  SENDGRID_API_KEY: z.string().startsWith("SG.", "SENDGRID_API_KEY must start with SG.").optional(),
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email").optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional(),
  FLAG_CHECKOUT: z.coerce.boolean().default(false),
  FLAG_DISCOUNTS: z.coerce.boolean().default(true),
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default("PineNova"),
});

let cachedEnv: z.infer<typeof serverSchema> | null = null;

function validateEnv() {
  if (cachedEnv) return cachedEnv;

  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-production-server";

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    if (isBuildTime) {
      console.warn("⚠️ Build-time: Some env vars missing, using defaults");
      return serverSchema.parse({
        ...process.env,
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || "build-placeholder",
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || "build-placeholder",
        S3_BUCKET: process.env.S3_BUCKET || "build-placeholder",
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "SG.build-placeholder",
        EMAIL_FROM: process.env.EMAIL_FROM || "build@example.com",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      });
    }

    const errors = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
      .join("\n");

    console.error("❌ Invalid environment variables:\n" + msg);
    process.exit(1);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

const serverEnv = validateEnv();

const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

export const env = {
  ...serverEnv,
  ...clientEnv,
} as const;

export type Env = typeof env;

export function assertServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("Server env accessed on client");
  }
}