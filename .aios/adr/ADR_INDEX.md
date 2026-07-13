# Architecture Decision Records (ADR) — PineNova Ecommerce

**Format:** Lightweight ADR (Title, Context, Decision, Consequences, Status)  
**Location:** `.aios/adr/`  
**Naming:** `ADR-XXX-title.md`  
**Trigger:** Any decision affecting architecture, security, data model, or cross-cutting concerns

---

## ADR Index

| ADR | Title | Date | Status | Supersedes |
|-----|-------|------|--------|------------|
| ADR-001 | Use Next.js Route Handler for Stripe Webhooks (not Express) | 2026-07-12 | Accepted | — |
| ADR-002 | Consolidate Rate Limiter to Single Redis-Backed Implementation | 2026-07-12 | Proposed | — |
| ADR-003 | Remove Dead Repository Layer; Use Prisma Direct in Routes | 2026-07-12 | Proposed | — |
| ADR-004 | JWT in HttpOnly Cookies Only (No localStorage) | 2026-07-12 | Proposed | — |
| ADR-005 | ProductVariant Model Required for MVP | 2026-07-12 | Proposed | — |

---

## ADR Template

```markdown
# ADR-XXX: [Short Title]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Rejected | Superseded  
**Deciders:** [Names]  
**Technical Lead:** [Name]

## Context

[Describe the situation, problem, or opportunity. Include constraints and assumptions.]

## Decision

[State the decision clearly. What are we doing?]

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Option A | | |
| Option B | | |

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Drawback 1]
- [Drawback 2]

### Risks
- [Risk 1] — Mitigation: [Strategy]

## Implementation Notes

- [File changes]
- [Migration steps]
- [Rollback plan]

## Related

- GAP-XXX
- SPEC-XXX
- PR #XXX
```

---

## ADR-001: Use Next.js Route Handler for Stripe Webhooks

**Date:** 2026-07-12  
**Status:** Accepted  
**Deciders:** Architecture Team  
**Technical Lead:** AIOS Governance

### Context

- `docs/architecture.md` (lines 13, 67-68) mandates: "Express only for Stripe webhooks — one architectural exception"
- Current implementation: `app/api/stripe/webhook/route.ts` uses Next.js Route Handler
- `specs/001-pinenova-ecommerce/plan.md` tasks.md T029 also specifies Route Handler
- Express would add: separate process, port, deployment complexity, retry middleware

### Decision

**Accept the current implementation.** Use Next.js Route Handler for Stripe webhooks. Update `architecture.md` to reflect this decision.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Migrate to Express | Matches architecture.md; retry middleware | New deployment target; port management; separate health checks; dev complexity |
| Keep Route Handler | Single deploy; native Next.js; edge-compatible; simpler | No built-in retry (Stripe retries anyway); 30s timeout limit |

### Consequences

**Positive:**
- Single deployment unit (Vercel)
- No port/process management
- Edge runtime compatible (future)
- Simpler CI/CD

**Negative:**
- 30s function timeout (Vercel) — must acknowledge webhook < 30s
- No automatic retry middleware — rely on Stripe's built-in retry

**Risks:**
- Webhook processing > 30s → timeout → Stripe retries → potential duplicate processing
- **Mitigation:** Acknowledge immediately (200), process async via queue (future) or keep processing < 5s

### Implementation Notes

- `app/api/stripe/webhook/route.ts` — already implemented
- Update `docs/architecture.md` lines 13, 67-68 to remove Express mandate
- Document 30s timeout constraint in `docs/18-security.md`

### Related

- GAP-002 (architecture violation)
- SPEC-001 (guest checkout)
- `app/api/stripe/webhook/route.ts`

---

## ADR-002: Consolidate Rate Limiter to Single Redis-Backed Implementation

**Date:** 2026-07-12  
**Status:** Proposed  
**Deciders:** [Pending]  
**Technical Lead:** [Pending]

### Context

- Two rate limiter modules exist:
  - `lib/rate-limiter.ts` — General purpose, IP-based, in-memory `Map`
  - `lib/rate-limit.ts` — Checkout-specific, session-based, in-memory `Map`
- Both have critical flaws: race condition (non-atomic increment), memory leak (no cleanup), not shared across instances
- Production requires: atomic operations, distributed (Redis), TTL cleanup

### Decision

**Consolidate into single `lib/rate-limit.ts` backed by Redis with atomic INCR + TTL.** Remove `lib/rate-limiter.ts`.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Keep both, fix both | Minimal API changes | Double maintenance; inconsistent patterns |
| Use `@upstash/ratelimit` | Battle-tested; Redis; edge-compatible | New dependency; vendor lock-in |
| Custom Redis + atomic INCR | Full control; no new dep | More code to maintain |

### Consequences

**Positive:**
- Single source of truth for rate limiting
- Atomic operations eliminate race condition
- Redis TTL = automatic cleanup
- Works across multiple instances
- Consistent API across all routes

**Negative:**
- Redis dependency required (already in docker-compose)
- API migration for existing callers

**Risks:**
- Redis unavailable → rate limiter fails open or closed?
- **Mitigation:** Fail-open with warning log; circuit breaker

### Implementation Notes

- New `lib/rate-limit.ts` with Redis client
- Atomic: `INCR key; EXPIRE key window` (Lua script for true atomicity)
- Keys: `ratelimit:{prefix}:{identifier}`
- Remove `lib/rate-limiter.ts`
- Update all 12+ route files to use new API

### Related

- GAP-012, GAP-025
- DEBT-002, DEBT-011
- Sprint 2 tasks

---

## ADR-003: Remove Dead Repository Layer; Use Prisma Direct in Routes

**Date:** 2026-07-12  
**Status:** Proposed  
**Deciders:** [Pending]  
**Technical Lead:** [Pending]

### Context

- 7 repository files exist (`repositories/*.ts`) — **all dead code**
- Zero routes import any repository
- All routes use Prisma Client directly
- `docs/architecture.md` mandates repository pattern
- `specs/plan.md` says "All other data access is direct Prisma queries"

### Decision

**Delete `repositories/` directory entirely.** Use Prisma directly in routes/services. Update `architecture.md` to reflect reality.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Refactor routes to use repos | Matches architecture.md | 500+ lines of unused code to wire up; no value add |
| Keep repos for future | "Might need later" | YAGNI; confusion; maintenance burden |
| Delete repos, update docs | Honest; simple; no dead code | Architecture.md loses pattern |

### Consequences

**Positive:**
- Removes 500 LOC dead code
- Eliminates confusion about data access pattern
- Simpler codebase

**Negative:**
- Architecture doc loses "repository pattern" claim
- Future team might re-add unnecessarily

**Risks:** None — code is already not using repos

### Implementation Notes

- Delete `repositories/` directory (7 files)
- Update `docs/architecture.md` Section 1 table: remove "Repository pattern" row
- Update `docs/01-repository-tree.md` to remove `repositories/`
- No route changes needed (already using Prisma)

### Related

- GAP-011
- DEBT-001
- Sprint 1 TASK-009

---

## ADR-004: JWT in HttpOnly Cookies Only (No localStorage)

**Date:** 2026-07-12  
**Status:** Proposed  
**Deciders:** [Pending]  
**Technical Lead:** [Pending]

### Context

- Current: Access token in **both** `localStorage` AND cookie
- Cookie: `SameSite=Lax`, **no `Secure`**, **no `HttpOnly`**
- Middleware checks cookie presence only (no validation)
- Client decodes JWT with `atob()` — exposes all claims to XSS
- Admin panel uses same pattern — high privilege token in localStorage

### Decision

**Access tokens ONLY in HttpOnly Secure SameSite=Lax cookies.** Remove all `localStorage` token storage. Server sets cookie via `Set-Cookie` header.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Keep both | Works now | XSS = token theft; no HttpOnly protection |
| localStorage only | Simple | No CSRF protection; XSS = token theft |
| HttpOnly cookie only | XSS-safe; CSRF via SameSite | Requires server-side cookie setting; no JS access to payload |

### Consequences

**Positive:**
- XSS cannot steal access tokens
- CSRF protected by `SameSite=Lax` + double-submit cookie (existing)
- Tokens never in JavaScript scope

**Negative:**
- Server must set cookies (no `document.cookie` for auth)
- Client cannot read token payload (need `/api/me` endpoint)
- SSR pages need cookie forwarded to API

**Risks:**
- Cookie not sent cross-origin (OK — same domain)
- `Secure` flag requires HTTPS (production only)
- **Mitigation:** Dev uses `lvh.me` or `localhost` with HTTPS via `mkcert`

### Implementation Notes

- `app/api/auth/login/route.ts` → `Set-Cookie` header with `HttpOnly; Secure; SameSite=Lax`
- `app/api/auth/refresh/route.ts` → Rotate refresh token, set new cookies
- `middleware.ts` → Validate JWT from cookie (not just presence)
- `lib/auth.ts` → Remove `localStorage` helpers
- Frontend: Remove all `localStorage.getItem("accessToken")`
- Add `/api/auth/me` endpoint for client to get user profile

### Related

- GAP-014
- GAP-013 (admin auth)
- Sprint 1 TASK-005

---

## ADR-005: ProductVariant Model Required for MVP

**Date:** 2026-07-12  
**Status:** Proposed  
**Deciders:** [Pending]  
**Technical Lead:** [Pending]

### Context

- `specs/spec.md` FR-002: "Filter by price, material, color, size"
- `specs/spec.md` Clarification 3: Explicit ProductVariant model with SKU, size, color, stock
- `tasks.md` T012: Create ProductVariant model
- `tasks.md` T045: VariantSelector component (BLOCKED on T012)
- Current `prisma/schema.prisma` has flat `Product` with single `price` + `stock`
- 9 products seeded, no variants

### Decision

**Add ProductVariant model to Prisma schema for MVP.** Do not launch without variant support.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| Launch flat, add variants post-MVP | Faster initial launch | Spec violation; FR-002 unmet; T045 blocked; poor UX (no size/color) |
| Add variants now | Spec compliant; unblocks T045; proper inventory | Migration effort; seed data update |

### Consequences

**Positive:**
- Spec compliant (FR-002, FR-010)
- Unblocks VariantSelector (T045)
- Proper inventory per variant
- Foundation for future options (engraving, gift wrap)

**Negative:**
- Schema migration required
- Seed data must expand (12 products × variants)
- API routes need variant-aware queries
- Admin UI needs variant management

**Risks:**
- Migration breaks existing orders if not careful
- **Mitigation:** Expand/contract pattern; version API

### Implementation Notes

```prisma
// prisma/schema.prisma
model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku       String   @unique
  size      String?  // e.g., "S", "M", "L", "One Size"
  color     String?  // e.g., "Natural", "Black", "Brown"
  price     Decimal  @db.Decimal(10,2) // override product base price
  stock     Int      @default(0)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
  @@unique([productId, size, color])
}

// Product model changes:
model Product {
  // ... existing fields
  variants ProductVariant[]
  // basePrice Decimal? // keep for non-variant products
}
```

- Migration: `prisma migrate dev --name add_product_variants`
- Update `prisma/seed.ts` with variant data
- Update `services/checkout.service.ts` for variant pricing/stock
- Update `components/AddToCartButton.tsx` → `VariantSelector`
- Update admin product CRUD for variants

### Related

- GAP-009
- T012, T045
- FR-002, FR-010
- Sprint 3 TASK-019 through TASK-022

---

**End of ADR Index** — New ADRs added sequentially. Never delete; mark `Superseded` if overridden.