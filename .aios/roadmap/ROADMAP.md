# Sprint Roadmap — PineNova Ecommerce (Baseline)

**Generated:** 2026-07-12  
**Source:** GAP_REGISTER.md + FEATURE_INVENTORY.md + TECH_DEBT_REGISTER.md  
**Methodology:** AIOS SDD Framework — Phased, dependency-ordered, severity-driven

---

## Roadmap Overview

| Sprint | Theme | Duration | Focus | Target Gaps |
|--------|-------|----------|-------|-------------|
| **Sprint 1** | Spec Alignment + Critical Security | 1 week | Fix contradictions, harden CSP, admin auth, env validation | GAP-001, GAP-002, GAP-010, GAP-013, GAP-014, GAP-022, GAP-023 |
| **Sprint 2** | CI/CD + Docker + Rate Limiter | 1 week | Deployment infrastructure, consolidated rate limiting | GAP-003, GAP-004, GAP-012, GAP-025, DEBT-002, DEBT-011 |
| **Sprint 3** | Data Model + Checkout UI | 1-2 weeks | ProductVariant model, Stripe Elements checkout flow | GAP-008, GAP-009, FEAT-024 through FEAT-027 |
| **Sprint 4** | Admin + Account Completion + Testing | 1 week | Full admin dashboard, account pages, test DB, webhook/E2E tests | GAP-005, GAP-006, GAP-007, GAP-018, GAP-019, GAP-020, GAP-021 |
| **Sprint 5** | Polish + Launch Prep | 1 week | DB indexes, PCI sign-off, staging deploy, monitoring | GAP-015, GAP-016, GAP-017, GAP-010 (complete) |

---

## Sprint 1: Spec Alignment + Critical Security (Week 1)

**Goal:** Resolve all P0 spec contradictions and critical security vulnerabilities before any feature work.

### Sprint Backlog

| Task ID | Description | Files | DoD | Gap/Ref |
|---------|-------------|-------|-----|---------|
| TASK-001 | Fix guest checkout contradiction — update `spec.md` FR-022 to "disabled" matching assumptions.md | `spec.md:182` | FR-022 reads "Guest checkout disabled per BRD BR04" | GAP-001 |
| TASK-002 | Align shipping/tax values to assumptions: $8 flat, free ≥$120, 10% flat tax | `services/checkout.service.ts:42-43`, `types/index.ts` | All 3 locations consistent; tests updated | GAP-022 |
| TASK-003 | Harden CSP: remove `unsafe-eval`, `unsafe-inline`; implement nonce-based scripts; restrict `img-src` to S3/Stripe | `middleware.ts:27-37`, `next.config.js` | CSP header passes securityheaders.com scan; dev works with nonce | GAP-002 |
| TASK-004 | Remove `/api/admin` from middleware `publicPaths`; add admin role validation in middleware | `middleware.ts:24,72-77` | Admin API returns 401 without valid ADMIN JWT; 403 for CUSTOMER | GAP-013 |
| TASK-005 | Move JWT to HttpOnly Secure SameSite=Lax cookies only; remove localStorage usage | `app/(storefront)/account/auth/login/page.tsx:35-36`, `app/(storefront)/account/page.tsx:37-38`, `app/(storefront)/checkout/page.tsx:10`, `components/AdminPage.tsx:27` | No auth token in localStorage; cookies have Secure flag in prod | GAP-014 |
| TASK-006 | Add `lib/env.ts` with Zod schema for all required env vars; fail-fast at startup | `lib/env.ts` (new), all env consumers | `npm run dev` crashes with clear message if any required var missing | GAP-023 |
| TASK-007 | Fix `NEXT_PUBLIC_APP_URL` fallback — require in production, no localhost default | `app/layout.tsx:44` | Production build fails if unset | GAP-023 |
| TASK-008 | Sign off PCI SAQ A — complete all `[TBD]` fields | `docs/pci-saq-a.md:56-60` | All sign-off fields filled with names/dates | GAP-010 |
| TASK-009 | Delete dead repository layer (7 files) | `repositories/*.ts` | Files removed; no imports broken | DEBT-001, GAP-011 |
| TASK-010 | Update `architecture.md` to reflect Route Handler for webhook (or implement Express) | `architecture.md` | Doc matches implementation | GAP-011 (arch violation) |

### Sprint 1 Dependencies
- TASK-001 unblocks all checkout/account work
- TASK-004 must complete before any admin feature work
- TASK-006 must complete before Docker/CI (Sprint 2)

---

## Sprint 2: CI/CD + Docker + Rate Limiter (Week 2)

**Goal:** Production-ready deployment infrastructure and consolidated rate limiting.

### Sprint Backlog

| Task ID | Description | Files | DoD | Gap/Ref |
|---------|-------------|-------|-----|---------|
| TASK-011 | Create GitHub Actions CI workflow: lint → typecheck → test → build → security scan | `.github/workflows/ci.yml` | PR checks pass; merge blocked on failure | GAP-003 |
| TASK-012 | Create Dockerfile (multi-stage) + docker-compose.yml for local dev (app + postgres) | `Dockerfile`, `docker-compose.yml` | `docker-compose up` runs full stack locally | GAP-004 |
| TASK-013 | Consolidate rate limiters: single Redis-backed implementation with atomic INCR + TTL | `lib/rate-limit.ts` (new), remove `lib/rate-limiter.ts` | All routes use single limiter; no race condition; auto-cleanup | GAP-012, GAP-025, DEBT-002, DEBT-011 |
| TASK-014 | Add Redis dependency + configuration for rate limiter | `package.json`, `lib/rate-limit.ts`, `docker-compose.yml` | Rate limiter works across container restarts | GAP-012 |
| TASK-015 | Add health check endpoint `/api/health` with DB connectivity check | `app/api/health/route.ts` (new) | Returns 200 + `{ status: "ok", db: "connected" }` | GAP-017 |
| TASK-016 | Configure Sentry for error tracking (server + client) | `lib/observability.ts` (new), `app/layout.tsx` | Errors appear in Sentry dashboard | GAP-034 |
| TASK-017 | Add Pino transport for Sentry + structured logging | `lib/logger.ts`, `lib/observability.ts` | Logs correlated with errors in Sentry | GAP-034 |
| TASK-018 | Add `EMAIL_API_KEY` to Pino redaction paths | `lib/logger.ts:22-25` | Email API key never appears in logs | DEBT-004 (partial) |

### Sprint 2 Dependencies
- TASK-006 (env validation) must complete first
- TASK-013 requires Redis in docker-compose (TASK-012)

---

## Sprint 3: Data Model + Checkout UI (Weeks 3-4)

**Goal:** Implement ProductVariant model and complete checkout UI — the core revenue flow.

### Sprint Backlog

| Task ID | Description | Files | DoD | Gap/Ref |
|---------|-------------|-------|-----|---------|
| TASK-019 | Add ProductVariant model to Prisma schema (SKU, size, color, stock, price override) | `prisma/schema.prisma`, migration | `prisma migrate dev` succeeds; seed updated | GAP-009 |
| TASK-020 | Create Variant API routes (CRUD under admin products) | `app/api/admin/products/[id]/variants/route.ts` (new) | Admin can manage variants per product | GAP-009, FEAT-008 |
| TASK-021 | Build VariantSelector component (color swatches + size dropdown) | `components/VariantSelector.tsx` (new) | Renders on PDP; updates price/stock display | GAP-009, FEAT-008 |
| TASK-022 | Update inventory service for variant-level stock | `services/inventory.service.ts` | Reservations work per variant | GAP-009 |
| TASK-023 | Build checkout UI page: ShippingForm → PaymentElement → Confirmation | `app/(storefront)/checkout/page.tsx` (rewrite), `components/ShippingForm.tsx`, `components/PaymentForm.tsx` | Full flow works: address → Stripe → confirmation | GAP-008, FEAT-024, FEAT-025, FEAT-026 |
| TASK-024 | Integrate Stripe Payment Element with client secret from checkout API | `app/(storefront)/checkout/page.tsx`, `components/PaymentForm.tsx` | Payment completes; webhook creates order | FEAT-026 |
| TASK-025 | Build order confirmation page with order details + continue shopping | `app/(storefront)/checkout/confirmation/page.tsx` | Shows order #, items, totals, shipping address | FEAT-027 |
| TASK-026 | Add cart count badge to header (global cart state) | `app/layout.tsx`, `components/CartBadge.tsx` (new), Zustand store | Header shows item count; updates on add/remove | FEAT-010 (enhancement) |
| TASK-027 | Add optimistic updates to cart (Zustand + React Query) | `components/AddToCartButton.tsx`, `app/(storefront)/cart/page.tsx` | UI updates instantly; syncs with server | FEAT-011, FEAT-012 |

### Sprint 3 Dependencies
- TASK-019 (schema) must complete before TASK-020, TASK-021, TASK-022
- TASK-023 requires checkout API complete (done) + Stripe keys configured
- TASK-026, TASK-027 require Zustand/React Query decision (DEBT-009)

---

## Sprint 4: Admin + Account + Testing (Week 5)

**Goal:** Complete admin dashboard, account pages, and establish true testing infrastructure.

### Sprint Backlog

| Task ID | Description | Files | DoD | Gap/Ref |
|---------|-------------|-------|-----|---------|
| TASK-028 | Split `AdminPage.tsx` into route groups: `/admin/products`, `/admin/orders`, `/admin/inventory`, `/admin/discounts`, `/admin/metrics` | `app/admin/products/`, `app/admin/orders/`, etc. (new) | Each tab is separate page; lazy-loaded | GAP-020, FEAT-041 through FEAT-046 |
| TASK-029 | Add AdminSidebar + AdminHeader layout components | `components/layout/AdminSidebar.tsx`, `components/layout/AdminHeader.tsx` (new) | Consistent admin navigation; logout button | FEAT-048 |
| TASK-030 | Add pagination + search + filters to all admin tables | `app/admin/*/page.tsx` | Tables support page size, search, column filters | FEAT-041, FEAT-042, FEAT-044 |
| TASK-031 | Add product image upload (S3) in admin product create/edit | `app/admin/products/[id]/edit/page.tsx` (new), `lib/s3.ts` | Images upload to S3; preview in form | FEAT-041 |
| TASK-032 | Implement account profile page (edit name, email) | `app/(storefront)/account/profile/page.tsx` (new) | User can update profile; validates email unique | GAP-021, FEAT-036 |
| TASK-033 | Implement password change page (current + new + confirm) | `app/(storefront)/account/password/page.tsx` (new) | Secure password change; invalidates refresh tokens | GAP-021, FEAT-038 |
| TASK-034 | Implement address book page (CRUD addresses) | `app/(storefront)/account/addresses/page.tsx` (new) | Multiple addresses; select at checkout | GAP-021, FEAT-037 |
| TASK-035 | Implement order detail page (`/account/orders/[id]`) | `app/(storefront)/account/orders/[id]/page.tsx` (new) | Shows full order, status timeline, tracking | GAP-027, FEAT-039 |
| TASK-036 | Set up test database (Docker PostgreSQL) for integration tests | `docker-compose.test.yml` (new), `tests/setup.ts` (new) | `npm run test:integration` runs against real DB | GAP-006 |
| TASK-037 | Write Stripe webhook integration tests (signature, duplicate, error paths) | `tests/integration/stripe-webhook.test.ts` (new) | 100% webhook handler coverage | GAP-005 |
| TASK-038 | Write E2E test: browse → cart → checkout → payment → confirmation | `tests/e2e/checkout.spec.ts` (new) | Playwright test passes in CI | GAP-007 |
| TASK-039 | Write E2E test: login → account → order detail | `tests/e2e/account.spec.ts` (new) | Playwright test passes in CI | GAP-007 |
| TASK-040 | Write concurrent checkout test (race on last item) | `tests/integration/concurrent-checkout.test.ts` (new) | Simulates 2 users buying last item; 1 succeeds | GAP-018 |
| TASK-041 | Add Vitest coverage thresholds (80% line/branch) | `vitest.config.ts` | CI fails if coverage drops | GAP-018 (partial) |
| TASK-042 | Fix `auth.test.ts` double mock declarations | `tests/unit/auth.test.ts:3-6` | Clean single mock block | DEBT-006 |
| TASK-043 | Deduplicate `stockBadge` test logic | `tests/unit/stockBadge.test.ts` (new shared), update `products.test.ts`, `cart.test.ts` | Single source of truth | DEBT-008 |

### Sprint 4 Dependencies
- TASK-036 (test DB) must complete before TASK-037 through TASK-040
- TASK-028 through TASK-031 can run in parallel with TASK-032 through TASK-035

---

## Sprint 5: Polish + Launch Prep (Week 6)

**Goal:** Performance hardening, compliance sign-off, staging validation.

### Sprint Backlog

| Task ID | Description | Files | DoD | Gap/Ref |
|---------|-------------|-------|-----|---------|
| TASK-044 | Add missing DB indexes: `Order.stripePaymentIntentId`, `RefreshToken.userId`, `RefreshToken.expiresAt`, `CartItem.productId`, `CartItem.cartId` | `prisma/schema.prisma`, migration | Query plans show index scans | GAP-015 |
| TASK-045 | Configure PgBouncer for connection pooling | `docker-compose.yml`, `lib/db.ts` | Pool size config; no connection exhaustion under load | GAP-016 |
| TASK-046 | Add Cache-Control headers: products (60s), categories (300s), blog (600s), admin (no-store) | `middleware.ts`, `next.config.js` | Headers present on responses | GAP-035 |
| TASK-047 | Complete `docs/17-performance.md` through `docs/24-deployment-checklist.md` | `docs/17-*.md` through `docs/24-*.md` | All 7 docs complete with actionable content | DEBT-004, GAP-036 |
| TASK-048 | Deploy to staging via GitHub Actions | `.github/workflows/cd.yml` (new) | Staging URL accessible; mirrors prod config | GAP-033 |
| TASK-049 | Run k6 load test against staging; tune thresholds | `k6/checkout-test.js`, CI | <1% error rate, p95 < 2s | GAP-019 (validation) |
| TASK-050 | Final PCI SAQ A sign-off verification | `docs/pci-saq-a.md` | All fields signed; ready for production | GAP-010 (complete) |
| TASK-051 | Remove unused deps: Zustand, @tanstack/react-query, react-hook-form | `package.json` | Bundle size reduced; no import errors | DEBT-009, DEBT-010 |
| TASK-052 | Add `loading.tsx` files for all route segments | `app/loading.tsx`, `app/(storefront)/*/loading.tsx` | Streaming SSR with skeletons | GAP-039 |
| TASK-053 | Add toast notification system | `components/Toast.tsx` (new), `components/ToastProvider.tsx` (new) | Non-blocking success/error feedback | GAP-040 |

### Sprint 5 Dependencies
- TASK-044 (indexes) should run before load test (TASK-049)
- TASK-047 (docs) can start anytime in sprint

---

## Milestone Gates

| Gate | Criteria | Sprint |
|------|----------|--------|
| **M1: Spec Lock** | All P0 contradictions resolved; architecture.md matches code | End of Sprint 1 |
| **M2: Deploy Ready** | CI/CD passes; Docker runs locally; health check works | End of Sprint 2 |
| **M3: Revenue Flow** | Checkout UI complete; E2E test passes; ProductVariant live | End of Sprint 3 |
| **M4: Feature Complete** | Admin + Account done; integration + E2E tests in CI | End of Sprint 4 |
| **M5: Production Ready** | Staging validated; load test passes; PCI signed; docs complete | End of Sprint 5 |

---

## Resource Assumptions

- **Team:** 2 engineers (1 frontend-leaning, 1 backend-leaning) + 1 QA (part-time)
- **Capacity:** ~10 story points/engineer/sprint (2-week sprints compressed to 1-week for roadmap)
- **Risk Buffer:** 20% capacity reserved for unplanned fixes

---

## Risk Register (Top 5)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stripe SDK v17→v16 downgrade breaks checkout | High | High | Pin exact version in Sprint 2; test in staging |
| ProductVariant migration breaks existing orders | Medium | High | Expand/contract pattern; version API |
| CSP nonce breaks Next.js dev tooling | High | Medium | Test thoroughly; use `next/script` nonce prop |
| No CI/CD means manual deploy errors | Certain | Critical | Sprint 2 is non-negotiable |
| PCI SAQ A requires external auditor | Low | Blocker | Start paperwork Sprint 1; internal sign-off Sprint 5 |

---

**Update Rule:** This roadmap is the single source of truth for sprint planning. Update task status in-place. Move incomplete tasks to next sprint with reason. Never delete — mark `Deferred` with reason.