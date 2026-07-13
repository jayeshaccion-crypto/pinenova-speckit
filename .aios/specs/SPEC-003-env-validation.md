# SPEC-003: Environment Validation with Zod (lib/env.ts)

**Status:** Draft  
**Author:** AIOS Governance System  
**Reviewers:** [Pending]  
**Created:** 2026-07-12  
**Approved:** —  
**Related:** GAP-023, DEBT-004 (partial), TASK-006

---

## 1. Problem Statement

**Current state:** Environment variables accessed directly via `process.env` across 30+ files with:
- No validation at startup
- Silent fallbacks (empty strings, localhost defaults)
- Type safety gaps (strings vs numbers vs booleans)
- Missing required vars only discovered at runtime
- Production risk: `NEXT_PUBLIC_APP_URL` falls back to `http://localhost:3000`

**Required:** Single source of truth for env validation with fail-fast at startup.

---

## 2. Requirements Traceability

| Req ID | Source | Requirement | Priority |
|--------|--------|-------------|----------|
| NFR-DEV-01 | NFR.md | Fail-fast on missing config | P0 |
| NFR-DEV-02 | NFR.md | Type-safe env access | P0 |
| GAP-023 | Audit | `NEXT_PUBLIC_APP_URL` localhost fallback | P0 |
| TASK-006 | Sprint 1 | Add lib/env.ts | P0 |

---

## 3. Functional Specification

### 3.1 User Stories

- As a **developer**, I want **startup to crash with clear message** if required env vars missing, so that **I don't deploy broken config**
- As a **DevOps engineer**, I want **type-safe env access** (`env.DATABASE_URL` not `process.env.DATABASE_URL`), so that **refactoring is safe**
- As a **security auditor**, I want **all secrets validated at build time**, so that **no empty secrets reach production**

### 3.2 Acceptance Criteria

| AC ID | Scenario | Given | When | Then |
|-------|----------|-------|------|------|
| AC-001 | Missing required var | `DATABASE_URL` not set | `npm run dev` | Process exits with "Missing required env: DATABASE_URL" |
| AC-002 | Invalid format | `JWT_SECRET` = "short" | `npm run build` | Process exits with "JWT_SECRET must be ≥ 32 chars" |
| AC-003 | Type coercion | `PORT` = "3000" (string) | `env.PORT` accessed | Returns `number` 3000 |
| AC-004 | Boolean parsing | `FLAG_checkout` = "true" | `env.FLAG_CHECKOUT` accessed | Returns `boolean` true |
| AC-005 | Optional with default | `LOG_LEVEL` not set | `env.LOG_LEVEL` accessed | Returns "info" (default) |
| AC-006 | Client-safe prefix | `NEXT_PUBLIC_API_URL` set | `env.NEXT_PUBLIC_API_URL` accessed | Returns string; available in browser bundle |
| AC-007 | Server-only secret | `STRIPE_SECRET_KEY` set | Client code imports `env` | Build fails or value undefined in client |

### 3.3 Business Rules

1. **Fail-fast** — Process must not start if validation fails
2. **Single source** — All env access via `env` object only
3. **Prefix separation** — `NEXT_PUBLIC_*` = client-safe; rest = server-only
4. **No silent defaults** — Required vars must be explicit; optional vars document defaults
5. **Validation at import** — Schema validated on first import (module evaluation time)

---

## 4. Technical Specification

### 4.1 Zod Schema Structure

```typescript
// lib/env.ts
import { z } from "zod";

const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be valid PostgreSQL URL"),
  
  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be ≥ 32 chars"),
  JWT_ACCESS_TTL: z.string().default("15m").transform(v => v),
  JWT_REFRESH_TTL: z.string().default("7d").transform(v => v),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "STRIPE_SECRET_KEY must be sk_*"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must be whsec_*"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_", "Publishable key must be pk_*"),
  
  // AWS S3
  S3_ACCESS_KEY_ID: z.string().min(16),
  S3_SECRET_ACCESS_KEY: z.string().min(32),
  S3_BUCKET: z.string().min(3),
  S3_REGION: z.string().default("us-east-1"),
  
  // Email (SendGrid)
  SENDGRID_API_KEY: z.string().startsWith("SG."),
  EMAIL_FROM: z.string().email(),
  
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be valid URL"),
  
  // Feature Flags
  FLAG_CHECKOUT: z.coerce.boolean().default(false),
  FLAG_DISCOUNTS: z.coerce.boolean().default(true),
  
  // Rate Limiting (Redis)
  REDIS_URL: z.string().url().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  NEXT_PUBLIC_APP_NAME: z.string().default("PineNova"),
});
```

### 4.2 Implementation

```typescript
// lib/env.ts
import { z } from "zod";

const serverSchema = z.object({ ... });
const clientSchema = z.object({ ... });

function validateEnv() {
  const parsed = serverSchema.safeParse(process.env);
  
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
      .join("\n");
    
    console.error("❌ Invalid environment variables:\n" + msg);
    process.exit(1);
  }
  
  return parsed.data;
}

// Server-side only
const serverEnv = validateEnv();

// Client-safe subset (Next.js replaces at build time)
const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

// Export unified object
export const env = {
  ...serverEnv,
  ...clientEnv,
} as const;

// Type export
export type Env = typeof env;

// Helper for server-only checks
export function assertServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("Server env accessed on client");
  }
}
```

### 4.3 Files to Modify

| File | Change |
|------|--------|
| `lib/env.ts` | **NEW** — Create with schema + validation |
| `lib/auth.ts` | Replace `process.env.JWT_SECRET` → `env.JWT_SECRET` |
| `lib/stripe.ts` | Replace `process.env.STRIPE_*` → `env.STRIPE_*` |
| `lib/s3.ts` | Replace `process.env.S3_*` → `env.S3_*` |
| `lib/email.ts` | Replace `process.env.SENDGRID_*` → `env.SENDGRID_*` |
| `lib/feature-flags.ts` | Replace `process.env.FLAG_*` → `env.FLAG_*` |
| `lib/logger.ts` | Replace `process.env.LOG_LEVEL` → `env.LOG_LEVEL` |
| `lib/db.ts` | Replace `process.env.DATABASE_URL` → `env.DATABASE_URL` |
| `services/checkout.service.ts` | Replace all `process.env` → `env` |
| `services/inventory.service.ts` | Replace all `process.env` → `env` |
| `app/api/stripe/webhook/route.ts` | Replace `process.env.STRIPE_WEBHOOK_SECRET` |
| `middleware.ts` | Replace `process.env.NEXT_PUBLIC_APP_URL` → `env.NEXT_PUBLIC_APP_URL` |
| `app/layout.tsx` | Replace `process.env.NEXT_PUBLIC_APP_URL` → `env.NEXT_PUBLIC_APP_URL` |
| `prisma/seed.ts` | Replace all `process.env` → `env` |
| `scripts/download-images.ts` | Replace all `process.env` → `env` |

### 4.4 Type Safety

```typescript
// types/env.d.ts (auto-generated via z.infer)
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof serverSchema> {}
  }
}
```

### 4.5 Client-Side Safety

Next.js 14 automatically strips non-`NEXT_PUBLIC_*` vars from client bundle. The `clientSchema` ensures only allowed vars are typed for client use.

```typescript
// Client component
import { env } from "@/lib/env";
// Only NEXT_PUBLIC_* available — others undefined at runtime
const url = env.NEXT_PUBLIC_APP_URL; // ✅ Works
const secret = env.STRIPE_SECRET_KEY; // ❌ TypeScript error / undefined
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

| Function | Cases |
|----------|-------|
| `validateEnv()` | Valid env → returns parsed; Missing required → exits; Invalid format → exits |
| Schema coercion | String "3000" → number 3000; "true" → boolean true |

### 5.2 Integration Tests

| Scenario | Test File |
|----------|-----------|
| Build fails without `.env` | `tests/unit/env-validation.test.ts` |
| Build passes with valid `.env` | `tests/unit/env-validation.test.ts` |
| Client bundle lacks secrets | `tests/unit/env-client.test.ts` |

### 5.3 CI Integration

- GitHub Actions: `npm run build` fails if env invalid
- Staging/Production: Build step validates before deploy

---

## 6. Documentation Updates

| Doc | Update |
|-----|--------|
| `docs/20-environment-variables.md` | Complete with all vars, descriptions, required/optional, examples |
| `README.md` | Add "Environment Setup" section |
| `.env.example` | Sync with schema (add missing, remove unused) |

---

## 7. Rollout Plan

- [ ] Create `lib/env.ts` with schema
- [ ] Update all 15+ files to import from `env`
- [ ] Update `.env.example` to match schema
- [ ] Add `lib/env.ts` to `tsconfig.json` types
- [ ] Test: `npm run build` with valid `.env` → passes
- [ ] Test: `npm run build` without `.env` → fails with clear message
- [ ] Test: `npm run dev` → starts successfully
- [ ] Deploy to staging
- [ ] Verify no `process.env` direct usage (ESLint rule)

---

## 8. Open Questions

1. **Redis URL optional?** — Yes, rate limiter falls back to in-memory if not set (but logs warning)
2. **SENTRY_DSN optional?** — Yes, monitoring works without
3. **Default NODE_ENV:** — "development" for local, must be "production" in prod
4. **Validate on every request?** — No, module-level validation at import time sufficient

---

## 9. Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-07-12 | 0.1.0 | Initial draft |