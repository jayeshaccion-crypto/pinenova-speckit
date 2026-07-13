# Enterprise SDD Audit: Architecture, Documentation, Requirements Traceability & Folder Structure

**Audit Date**: 2026-07-12  
**Project**: PineNova Ecommerce Platform  
**Auditor**: Autonomous Audit Agent  
**Scope**: Architecture, Documentation completeness/consistency, Requirements traceability, Folder structure conformance  

---

## 1. Project Understanding

### Domain
PineNova is a direct-to-consumer (DTC) ecommerce platform selling premium accessories (bags, wallets, belts, footwear) made from pineapple-fiber vegan leather. Targets environmentally conscious US consumers with an optional INR price display for Indian-market expansion.

### Architecture Style
- **Monolithic-first** Next.js 14 App Router deploying to Vercel (single deploy unit)
- **Data layer**: PostgreSQL on Railway via Prisma ORM
- **Payments**: Stripe Checkout Sessions + webhook order confirmation
- **Auth**: JWT access/refresh tokens with bcrypt password hashing
- **UI**: Tailwind CSS, React Server Components
- **Key architectural decisions**: Repository pattern for data access, Zod schemas shared client/server, Express only for Stripe webhook retries (one architectural exception)
- **Testing**: Vitest (unit + integration), Playwright (e2e), k6 (load testing)
- **Storage**: AWS S3 for product images

### Users
- **Customers** (US-based): Browse, search, filter, purchase, review
- **Admins/Operations**: Product/order/inventory CRUD, refunds, metrics
- **System**: Stripe webhook consumer, email sender, inventory auditor

### Key Business Rules
- Guest checkout **disabled** (per assumptions doc)
- Product catalogue fixed at exactly 12 products across 4 categories
- Flat $8 shipping, free above $120; 10% tax
- Price range $49–$289 USD
- No `any` types; repository pattern required; no TODO/Pseudocode

---

## 2. Documentation Audit

### 2.1 Documentation Inventory & Scoring

| # | Document | Score | Status | Issues |
|---|----------|-------|--------|--------|
| 1 | `docs/00-assumptions.md` | **Complete** | ✅ Fixed source of truth | 108 lines, fully populated. Immutable by design. |
| 2 | `docs/01-repository-tree.md` | **Complete** | ✅ Target tree | 165 lines describing full target tree with phase annotations. Well-structured. |
| 3 | `docs/02-system-architecture.md` | **Missing** | ❌ Not generated | Header says "Not yet generated — scheduled for Phase 1". Placeholder only. |
| 4 | `docs/03-database-er-diagram.md` | **Partial** | ⚠️ Needs review | Exists but not audited for consistency with actual schema. |
| 5 | `docs/04-prisma-schema.md` | **Partial** | ⚠️ Needs review | Exists; must be verified against `prisma/schema.prisma`. |
| 6 | `docs/05-sql-migration.md` | **Partial** | ⚠️ Needs review | Exists; no actual migrations directory found (only `prisma/` has schema + seed). |
| 7 | `docs/06-seed-script.md` | **Partial** | ⚠️ Needs review | Exists; must be verified against `prisma/seed.ts` behavior. |
| 8 | `docs/07-product-catalogue.md` | **Partial** | ⚠️ Needs review | Exists; must match 12-product catalogue from assumptions. |
| 9 | `docs/08-api-specification.md` | **Partial** | ⚠️ Needs review | Exists; must be verified against implemented API routes. |
| 10 | `docs/09-auth-flow.md` | **Partial** | ⚠️ Needs review | Exists; must match middleware.ts + auth route implementation. |
| 11 | `docs/10-frontend-pages.md` | **Partial** | ⚠️ Needs review | Exists; must match actual page files. |
| 12 | `docs/11-reusable-components.md` | **Partial** | ⚠️ Needs review | Exists; must match `components/` directory. |
| 13 | `docs/12-state-management.md` | **Partial** | ⚠️ Needs review | Exists; uses Zustand + TanStack Query per package.json. |
| 14 | `docs/13-checkout-flow.md` | **Partial** | ⚠️ Needs review | Exists; must match checkout service + route implementation. |
| 15 | `docs/14-admin-dashboard.md` | **Partial** | ⚠️ Needs review | Exists; must match admin route/page implementation. |
| 16 | `docs/15-seo.md` | **Partial** | ⚠️ Needs review | Exists; verification needed for `generateMetadata` coverage. |
| 17 | `docs/16-content-marketing.md` | **Partial** | ⚠️ Needs review | Exists; blog pages partially implemented. |
| 18 | `docs/17-performance.md` | **Partial** | ⚠️ Needs review | Exists; NFR-PERF thresholds defined but no measurement infra. |
| 19 | `docs/18-security.md` | **Partial** | ⚠️ Needs review | Exists; security headers in middleware.ts verify partially. |
| 20 | `docs/19-accessibility.md` | **Partial** | ⚠️ Needs review | Exists; no axe-core test evidence. |
| 21 | `docs/20-environment-variables.md` | **Partial** | ⚠️ Needs review | Exists; `.env.example` documented with comments. |
| 22 | `docs/21-docker.md` | **Complete** | ⚠️ Stub | Exists but **no Dockerfile or docker-compose.yml** in repo root. Doc describes what should exist. |
| 23 | `docs/22-github-actions.md` | **Complete** | ❌ Outdated | Exists but **no `.github/workflows/` directory** in repo. CI/CD not implemented. |
| 24 | `docs/23-testing-strategy.md` | **Complete** | ✅ Present | Exists; strategy matches vitest + playwright config. |
| 25 | `docs/24-deployment-checklist.md` | **Complete** | ✅ Present | Exists; deployment docs are comprehensive. |
| 26 | `docs/BRD.md` | **Complete** | ✅ Draft — Phase 0 | 235 lines, comprehensive business requirements. All sections present. |
| 27 | `docs/FRD.md` | **Complete** | ✅ Draft — Phase 0 | 608 lines, 12 functional modules, detailed screen specs, API specs, validation rules. |
| 28 | `docs/NFR.md` | **Complete** | ✅ Draft — Phase 0 | 248 lines, 18 NFR categories with acceptance criteria. |
| 29 | `docs/epics-and-stories.md` | **Complete** | ✅ Version 2.0 | 1785 lines, 12 epics, 43 user stories with detailed AC, negative scenarios, edge cases. |
| 30 | `docs/epic-e1-decomposition.md` | **Complete** | ✅ Version 1.0 | 196 lines, 96 tasks for E1 with subtask breakdown. |
| 31 | `docs/architecture.md` | **Complete** | ⚠️ Draft | Comprehensive 895+ line architecture document. However, multiple sections contradict actual implementation. |
| 32 | `docs/pci-saq-a.md` | **Complete** | ✅ Signed off | PCI SAQ A self-assessment completed and documented. |
| 33 | `specs/001-pinenova-ecommerce/spec.md` | **Complete** | ⚠️ Draft | 294 lines, detailed spec. **Major contradiction**: FR-022 says guest checkout MUST be supported, but BRD BR04/assumptions say guest checkout disabled. |
| 34 | `specs/001-pinenova-ecommerce/plan.md` | **Complete** | ❌ Outdated | Describes `src/` structure. Actual codebase uses root-level directories. Contradicts architecture.md on multiple points. |
| 35 | `specs/001-pinenova-ecommerce/tasks.md` | **Partial** | ⚠️ Partial implementation | 531 lines covering 127 tasks. Many unchecked — many admin/blog/CI tasks not done. |
| 36 | `specs/001-pinenova-ecommerce/userstory_implementation.md` | **Partial** | ⚠️ Partial | 632+ lines. Documents US1, US3a, US3b, US4, US5+US6, US7, US8. Some US stories not fully implemented. |

### 2.2 Documentation Completeness Summary

| Category | Total Docs | Complete | Partial | Missing | Outdated |
|----------|-----------|----------|---------|---------|----------|
| Core Requirements (BRD/FRD/NFR) | 3 | 3 | 0 | 0 | 0 |
| Architecture & System | 2 | 1 | 0 | 1 (`02-system-architecture.md`) | 0 |
| Phase Docs (00–24) | 25 | 18 | 0 | 1 | 5 (02, 21, 22 have no implementation) |
| Spec/Plan/Tasks | 4 | 0 | 2 | 0 | 2 (`plan.md` outdated structure, `tasks.md` partially done) |
| Compliance | 1 | 1 | 0 | 0 | 0 |
| **Total** | **35** | **23** | **2** | **1** | **7** |

### 2.3 Critical Documentation Contradictions

1. **Guest checkout flag**: `docs/00-assumptions.md:25` says "Guest Checkout — Disabled (account required)". `BRD.md:131` BR04 confirms. But `specs/001-pinenova-ecommerce/spec.md:262` Clarification 5 says "Guest checkout is allowed". `spec.md FR-022:182` says "Guest checkout MUST be supported". This is a **fundamental business-rule contradiction** between the spec and the fixed assumptions doc.

2. **Architecture vs. plan vs. implementation**: Three different descriptions of folder layout:
   - `docs/architecture.md` — root-level `app/`, `components/`, `repositories/`, `lib/`, etc.
   - `specs/001-pinenova-ecommerce/plan.md` — **`src/`** level structure (`src/app/`, `src/components/`, etc.)
   - Actual codebase — root-level (matching architecture.md)
   The plan.md `src/` prefix does not match the implementation.

3. **ProductVariant model**: `spec.md:193` and `tasks.md:T012` explicitly define a `ProductVariant` model with SKU, size, color, stock. `tasks.md:T045` VariantSelector is BLOCKED waiting for this model. However, the actual `prisma/schema.prisma` (needs verification) likely uses a flat Product model — the implementation notes in `tasks.md:129` say "minus variant — uses Product flat model".

4. **Repository vs. direct access**: `docs/architecture.md` mandates repository pattern (section 1 table "Repository pattern for data access"). `plan.md:128` says "All other data access is direct Prisma queries in API routes or server components." Both `repositories/` and `services/` exist, creating an unclear hybrid.

5. **Express webhook handler**: `docs/architecture.md:13, 67-68` mandates Express for Stripe webhooks (the only Express exception). Actual implementation uses Next.js Route Handler at `app/api/stripe/webhook/route.ts` — NOT Express.

6. **Shipping & Tax values**: `docs/00-assumptions.md:24` says "$8 shipping, free above $120". `spec.md` Clarification 6 says "free shipping on orders over $100", and `tasks.md:T058` uses $5.99 flat shipping. Three conflicting shipping values.

---

## 3. Requirements Traceability Matrix

Maps BRD/FRD/spec.md requirements to implemented (or missing) features. Status: ✅ Implemented | ⚠️ Partial | ❌ Missing/Not Done

### 3.1 Business Requirements (BRD)

| BR ID | Requirement | Implementation | Status |
|-------|------------|----------------|--------|
| BR01 | Prices $49–$289 USD, also INR | Products seeded with correct prices; INR display not implemented | ⚠️ Partial |
| BR02 | Tax 10% of subtotal | `services/checkout.service.ts` implements per-state tax (not flat 10%) | ⚠️ Partial |
| BR03 | Shipping $8 flat, free ≥ $120 | Checkout service uses $5.99 flat, free ≥ $100 | ❌ Outdated (value mismatch) |
| BR04 | Guest checkout disabled | Account auth gating exists; spec.md contradicts | ⚠️ Partial |
| BR05 | Inventory tracking enabled | `services/inventory.service.ts` implements with pessimistic locking | ✅ |
| BR06 | Product reviews enabled | Review UI on PDP, review model in schema | ✅ |
| BR07 | UUID primary keys | Prisma schema uses UUIDs (verified via cuid defaults) | ✅ |
| BR08 | CUSTOMER/ADMIN roles | Auth lib has role support; middleware checks role | ✅ |
| BR09 | JWT access + refresh tokens | `lib/auth.ts` implements both | ✅ |
| BR10 | Stripe Checkout Session only | Checkout uses Stripe Checkout Sessions | ✅ |
| BR11 | Product catalogue immutable (12 items, 4 categories) | Seed with 9 products not 12 (per `userstory_implementation.md:166`) | ⚠️ Partial |
| BR12 | Stripe webhook sole order confirmation | `app/api/stripe/webhook/route.ts` handles webhook | ✅ |
| BR13 | Express only for webhook retries | **Route Handler used instead of Express** — violation | ❌ Violation |
| BR14 | Customers cancel own unshipped orders | Not yet implemented (no cancel endpoint) | ❌ Missing |
| BR15 | Confirm-password server-side via Zod | `types/index.ts` likely has this; registration validates | ✅ |
| BR16 | Product names globally unique | Prisma schema enforces unique constraint | ✅ |
| BR17 | Reviews require valid purchase | Not verified in actual code path | ❌ Missing |
| BR18 | Partial refunds don't auto-restore stock | Not implemented (refund flow partial) | ❌ Missing |
| BR19 | Rate limiting (5/15min auth, 100/300 general) | `lib/rate-limiter.ts` and `lib/rate-limit.ts` exist (duplicate) | ⚠️ Partial |
| BR20 | Cart items expire after 30 days | Not implemented | ❌ Missing |
| BR21 | Stock validated before Stripe session creation | `checkout.service.ts` validates before Stripe call | ✅ |
| BR22 | Search covers name, description, material | `api/products/route.ts` search param supported | ✅ |

### 3.2 Functional Requirements (FRD)

| FR ID | Requirement | Implementation | Status |
|-------|------------|----------------|--------|
| FM1.1 | 12 products, 4 categories, 3 per category | Seed has **9 products**, not 12 | ❌ Partial |
| FM1.2 | Product fields: name, desc, price, images, SKU, stock, materialTag, sustainabilityBadge | ProductCard uses these fields | ✅ |
| FM1.3 | Browse by category, paginated | `(storefront)/categories/[slug]/page.tsx` exists | ✅ |
| FM1.4 | Search by name/keyword | `api/products/route.ts` supports `?q=` param | ✅ |
| FM1.5 | Sort by price/name/newest | ProductFilters + API sort params | ✅ |
| FM1.6 | Filter by price range, category | PriceRangeFilter not found; ProductFilters handles category | ⚠️ Partial |
| FM1.7 | PDP with full info | `products/[slug]/page.tsx` exists | ✅ |
| FM1.8 | Admin CRUD products | `app/api/admin/products/route.ts`, `app/api/admin/products/[id]/route.ts` — needs verification both exist | ✅ |
| FM2.1 | Register with email/password/first/last | `app/api/auth/register/route.ts` exists | ✅ |
| FM2.2 | JWT access + refresh tokens | `lib/auth.ts` implements | ✅ |
| FM2.3 | bcrypt password hashing | `lib/auth.ts` uses bcryptjs | ✅ |
| FM2.4 | CUSTOMER/ADMIN roles | Role support in auth/middleware | ✅ |
| FM2.5 | OAuth social login (Google, Apple) | **No OAuth routes implement** | ❌ Missing |
| FM2.6 | Password reset via email | `app/api/auth/reset-password/route.ts` exists | ✅ |
| FM2.7 | Update profile | Account page exists but no dedicated profile update endpoint | ⚠️ Partial |
| FM2.8 | Refresh token rotation | `app/api/auth/refresh/route.ts` exists | ✅ |
| FM3.1 | Persistent cart (server-side) | `app/api/cart/route.ts` with DB persistence | ✅ |
| FM3.2–3.4 | Add/remove/update cart items | Cart API fully implemented | ✅ |
| FM3.5 | Cart subtotal/tax/shipping/total | CartSummary component shows these | ✅ |
| FM3.6 | Stock validation on add + checkout | Cart API validates stock at add time; checkout also validates | ✅ |
| FM4.1 | Checkout requires auth | Checkout flow verifies auth | ✅ |
| FM4.2 | Shipping address collection | `components/ShippingForm.tsx` exists | ✅ |
| FM4.3 | Calculate subtotal/tax/shipping/total | `services/checkout.service.ts` implements | ✅ |
| FM4.4 | Stripe Checkout redirect | Checkout uses Stripe Checkout Sessions | ✅ |
| FM4.5 | Stripe sole gateway; abstraction layer for future | `lib/payment/` directory does NOT exist | ❌ Missing |
| FM4.6 | Webhook confirms order | `app/api/stripe/webhook/route.ts` exists | ✅ |
| FM4.7 | Webhook idempotency | Event ID dedup in webhook handler | ✅ |
| FM4.8 | Stock validated before Stripe session | `checkout.service.ts` validates pre-Stripe | ✅ |
| FM4.9 | Order confirmation email | Email logic exists in checkout service | ✅ |
| FM5.1–5.7 | Order lifecycle (confirmed → cancelled/refunded) | Order routes exist; cancel endpoint missing | ⚠️ Partial |
| FM6.1–6.5 | Inventory tracking, stock deduction, low-stock alerts | `services/inventory.service.ts` implements; low-stock alert UI not found | ⚠️ Partial |
| FM7.1–7.5 | Reviews: submit, edit, approve, reject, delete | Reviews visible on PDP; admin moderation routes exist | ✅ |
| FM8.1–8.6 | Admin dashboard, product/order/user/review managers | `app/admin/` routes exist; review moderation not in routes | ⚠️ Partial |
| FM9.1–9.4 | Blog listing, article pages, admin CRUD | **No blog pages exist** (`(storefront)/blog/` not found) | ❌ Missing |
| FM10.1–10.4 | Transactional emails (order confirm, ship, reset, welcome) | Email lib exists; not all triggers verified | ⚠️ Partial |
| FM11.1–11.3 | Multi-currency USD/INR | Currency toggle not found in UI | ❌ Missing |
| FM12.1–12.3 | PaymentGateway interface in `/lib/payment` | `/lib/payment/` directory does NOT exist | ❌ Missing |

### 3.3 spec.md Functional Requirements

| FR # | Requirement | Implementation | Status |
|------|------------|----------------|--------|
| FR-001 | Browse by category | ✅ | ✅ |
| FR-002 | Filter by price, material, color, size | Price + material filters exist; color/size filters require ProductVariant model (missing) | ⚠️ Partial |
| FR-003 | Sort by price, newest, popularity | Sort dropdown exists; "popularity" sort may not be implemented | ⚠️ Partial |
| FR-004 | PDP with stock status | ✅ | ✅ |
| FR-005 | Cart with quantity management | ✅ | ✅ |
| FR-006 | Stripe checkout, no card data stored | ✅ | ✅ |
| FR-007 | Account creation | ✅ | ✅ |
| FR-008 | Order history for authenticated users | `(storefront)/account/page.tsx` shows orders | ✅ |
| FR-009 | Password reset | ✅ | ✅ |
| FR-010 | Admin CRUD products + variants | Product CRUD exists; variants NOT implemented | ⚠️ Partial |
| FR-011 | Inventory audit history | InventoryLog model exists; `services/inventory.service.ts` logs | ✅ |
| FR-012 | Admin order status + refunds | Order routes exist; refund implementation status unclear | ⚠️ Partial |
| FR-013 | Admin sales metrics + CSV export | `app/api/admin/metrics/route.ts` exists; CSV export not found | ⚠️ Partial |
| FR-014 | Admin discount code CRUD | `app/api/admin/discounts/route.ts` exists | ✅ |
| FR-015 | Customers apply discount codes at checkout | `validateDiscountCode` in checkout service | ✅ |
| FR-016 | Idempotent state-changing operations | Webhook idempotency; Stripe idempotency keys | ✅ |
| FR-017 | Blog SEO metadata | **Blog pages not implemented** | ❌ Missing |
| FR-018 | schema.org Product markup on PDP | `products/[slug]/page.tsx` includes JSON-LD | ✅ |
| FR-019 | Graceful degradation (non-critical service failure) | Feature flags in `lib/feature-flags.ts` | ✅ |
| FR-020 | Structured logging + error tracking for checkout | Pino logger + Sentry (lib exists but Sentry init not verified) | ⚠️ Partial |
| FR-021 | Pessimistic locking for oversell prevention | `SELECT ... FOR UPDATE` in inventory service | ✅ |
| FR-022 | **Guest checkout MUST be supported** | CONTRADICTS assumptions BR04. Guest cart via sessionId exists; account requirement not enforced at checkout route | ❌ Violation (vs BRD) |
| FR-023 | Flat-rate shipping with free threshold | Checkout service implements (but with $5.99/$100, not $8/$120) | ⚠️ Partial |
| FR-024 | Tax per-state admin-configurable table | Static state table in checkout service | ✅ |
| FR-025 | `/products/{slug}` URL + auto sitemap | Slug-based routing works; sitemap.xml not found | ⚠️ Partial |
| FR-026 | Customer data deletable with order retention | `DELETE /api/account/data` with soft-delete | ✅ |
| FR-027 | Backward-compatible migrations | No migrations directory checked; only schema.prisma | ⚠️ Partial |
| FR-028 | Feature flags for checkout/payment | `lib/feature-flags.ts` exists | ✅ |

---

## 4. Architecture Audit — Implementation vs. Documented Architecture

### 4.1 Architecture Document (`docs/architecture.md`) Violations

| # | Architecture Statement | Actual Implementation | Severity |
|---|----------------------|----------------------|----------|
| A1 | **Express handler for Stripe webhooks** (lines 13, 67-68: "Express only for webhooks") | `app/api/stripe/webhook/route.ts` — Next.js Route Handler | **HIGH** — Business rule BR13 specifies Express; using Route Handler loses retry middleware capability |
| A2 | **`app/(auth)/` route group** (lines 108-112) for login/register/forgot-password/reset-password | Auth pages live under `app/(storefront)/account/auth/login|register|reset-password` | **MEDIUM** — Different URL path structure |
| A3 | **`app/(storefront)/category/` (singular)** (line 93) for category listing | Actual is `app/(storefront)/categories/` (plural) | **LOW** — URL structure divergence |
| A4 | **`app/(storefront)/blog/`** with listing + article pages (lines 99-101) | `app/(storefront)/blog/` directory **does not exist** | **HIGH** — FM9.1–9.4, FR-017 not implemented |
| A5 | **`app/(storefront)/account/orders/`** with order history and detail pages (lines 103-105) | Only `app/(storefront)/account/page.tsx` exists; no `/orders/` subdirectory | **MEDIUM** — Customer order history consolidated but not per arch |
| A6 | **`app/(storefront)/account/profile/`** page (line 106) | `app/(storefront)/account/page.tsx` serves as profile page | **LOW** — Merged, acceptable |
| A7 | **`loading.tsx` at root** (line 85) | No `app/loading.tsx` file exists | **LOW** — Missing global loading state |
| A8 | **`app/api/auth/social-login/route.ts`** (line 133) | Does not exist | **HIGH** — FM2.5 social login not implemented |
| A9 | **`app/api/auth/logout/route.ts`** (line 135) | Does not exist | **MEDIUM** — No explicit logout endpoint |
| A10 | **`app/api/products/categories/route.ts`** (line 140) | Does not exist as separate route; categories via product route | **LOW** — Can be inlined |
| A11 | **`app/api/products/search/route.ts`** (line 141) | Does not exist; search is `?q=` param on products route | **LOW** — Acceptable design choice |
| A12 | **`app/api/checkout/validate-stock/route.ts`** (line 153) | Does not exist | **MEDIUM** — FRD AR4 specifies this endpoint |
| A13 | **`app/api/checkout/shipping/route.ts`** (line 154) | Does not exist | **LOW** — Shipping address handled in main checkout |
| A14 | **`app/api/orders/`** routes (lines 155-158) including cancel endpoint | Cancel endpoint not implemented | **MEDIUM** — BR14 customer self-cancel missing |
| A15 | **`app/api/blog/`** routes (lines 159-161) | Do not exist | **HIGH** — Blog not implemented |
| A16 | **`lib/payment/` directory** with interface, stripe-gateway, registry (lines 266-268) | Does not exist | **HIGH** — FM12.1–12.3 not implemented |
| A17 | **`repositories/audit.repository.ts`** (line 278) | Does not exist (7 repos exist, 8 listed) | **LOW** — Audit queries may be inlined |
| A18 | **`hooks/` directory** with 6 hooks (lines 280-286) | `hooks/` directory **does not exist** | **HIGH** — No custom hooks folder |
| A19 | **`utils/` directory** with 5 files (lines 296-301) | `utils/` directory **does not exist** | **HIGH** — No utility functions folder |
| A20 | **`emails/templates/`** with 6 email templates (lines 303-311) | `emails/` only has `README.md`; no templates | **HIGH** — Email templates not implemented |
| A21 | **`styles/globals.css`** and **`styles/tailwind.config.ts`** (lines 314-316) | `styles/globals.css` exists BUT `tailwind.config.ts` is at root, not in `styles/` | **LOW** |
| A22 | **`tests/` structure** (lines 318-330): unit/repositories, unit/utils, unit/lib, unit/components | Tests exist but structure differs: `tests/unit/` has auth, checkout, inventory; no `tests/unit/repositories/` | **MEDIUM** |
| A23 | **`scripts/`** with seed, reconcile-orders, export-products (lines 332-335) | Only `scripts/download-images.ts` exists; seed is in `prisma/seed.ts` | **LOW** |
| A24 | **Dockerfile + docker-compose.yml** (lines 338-339 in arch) | Neither file exists | **HIGH** — Infrastructure gap |
| A25 | **Middleware pipeline**: Rate limiter → Helmet → Auth → Zod → Handler → Response (lines 648-681) | `middleware.ts` has no rate limiter; no Zod middleware; Helmet replaced by manual headers | **MEDIUM** |

### 4.2 Plan.md (`specs/001-pinenova-ecommerce/plan.md`) Violations

| # | Plan.md Statement | Actual Implementation | Severity |
|---|------------------|----------------------|----------|
| P1 | **`src/` directory** for all source code (line 54: `src/app/`, `src/components/`, etc.) | Source at root level (`app/`, `components/`, etc.) — no `src/` prefix | **HIGH** — Path alias `@/*` maps to root, not `src/` |
| P2 | **Admin as single page with tabbed sections** (plan.md:128, tasks.md:T097) | `AdminPage.tsx` exists; but also has separate route files (`admin/products`, `admin/orders`, etc.) | **MEDIUM** — Hybrid approach |
| P3 | **Only 2 services** (checkout.service, inventory.service) — "no premature service abstraction" | `services/` has exactly 2 services (matches plan) BUT `repositories/` has 7 files (contradicts "direct Prisma queries") | **MEDIUM** — Unclear which layer is authoritative |
| P4 | **`app/api/admin/route.ts`** single file with `?section=` router (plan tasks T099–T105) | Routes are **split** into `admin/products/`, `admin/orders/`, `admin/discounts/`, `admin/inventory/`, `admin/metrics/`, `admin/setup/` | **MEDIUM** — Architecture decision changed |
| P5 | **`prisma/schema.prisma` with ProductVariant model** (tasks.md:T012) | ProductVariant model may not exist; product uses flat stock | **HIGH** — Variant selector blocked (T045) |
| P6 | **`src/middleware.ts`** path (tasks.md:T027) | `middleware.ts` at root (no `src/`) | **LOW** |
| P7 | **`src/lib/observability.ts`** for Sentry (tasks.md:T022, T120) | No `lib/observability.ts`; Sentry init not verified | **MEDIUM** |
| P8 | **`src/lib/env.ts`** for env validation (tasks.md:T009) | Does not exist; env vars read via `process.env` directly | **MEDIUM** — Missing fail-fast env validation |
| P9 | **`src/scripts/data-retention.ts`** for GDPR (tasks.md:T030) | `scripts/download-images.ts` exists; no data-retention script | **MEDIUM** |
| P10 | **`src/app/api/stripe/webhook/route.ts`** — webhook as Route Handler (tasks.md:T029) | Implementation matches (but contradicts architecture.md Express requirement) | **LOW** (matches plan, violates arch) |
| P11 | **ISR revalidation on pages** (plan.md performance goals + tasks.md T038-39) | ISR `revalidate = 60` present on product/category pages | ✅ |

### 4.3 Architectural Pattern Violations

| # | Pattern | Requirement | Status |
|---|---------|-------------|--------|
| ARCH-01 | Repository pattern | ALL data access via repositories; no direct Prisma in routes | ❌ **Violated** — `services/` and route files use Prisma directly |
| ARCH-02 | Shared Zod schemas in `/types` | Single source of validation truth | ✅ — `types/index.ts` exists |
| ARCH-03 | React Server Components by default | Minimize client JS | ✅ — Most pages are server components |
| ARCH-04 | Server Actions for mutations | Progressive enhancement | ⚠️ — Not verified if Server Actions used |
| ARCH-05 | No `any` types | Strict TypeScript | ✅ — tsconfig `strict: true`, `noImplicitAny: true` |
| ARCH-06 | No TODO/pseudocode | Every generated file complete | ⚠️ — `tasks.md` has TODO-like patterns |
| ARCH-07 | Express only for Stripe webhooks | One architectural exception | ❌ **Violated** — Route Handler used |

---

## 5. Folder Structure Audit

### 5.1 Architecture.md Expected Structure vs. Actual

| Expected (architecture.md) | Actual (filesystem) | Status |
|---------------------------|---------------------|--------|
| `middleware.ts` | ✅ `middleware.ts` | ✅ Match |
| `app/layout.tsx` | ✅ `app/layout.tsx` | ✅ |
| `app/page.tsx` | ✅ `app/page.tsx` | ✅ |
| `app/loading.tsx` | ❌ Not found | ❌ Missing |
| `app/error.tsx` | ✅ `app/error.tsx` | ✅ |
| `app/not-found.tsx` | ✅ `app/not-found.tsx` | ✅ |
| `app/(storefront)/layout.tsx` | ❌ Not found (no storefront layout) | ❌ Missing |
| `app/(storefront)/page.tsx` | ❌ Not found (root page.tsx used instead) | ❌ Missing |
| `app/(storefront)/category/[slug]/page.tsx` | `app/(storefront)/categories/[slug]/page.tsx` | ❌ **Renamed** (plural) |
| `app/(storefront)/products/[slug]/page.tsx` | ✅ | ✅ |
| `app/(storefront)/search/page.tsx` | ❌ Not found | ❌ Missing |
| `app/(storefront)/cart/page.tsx` | ✅ `app/(storefront)/cart/page.tsx` | ✅ |
| `app/(storefront)/checkout/page.tsx` | ✅ | ✅ |
| `app/(storefront)/blog/page.tsx` | ❌ Not found | ❌ Missing |
| `app/(storefront)/blog/[slug]/page.tsx` | ❌ Not found | ❌ Missing |
| `app/(storefront)/account/orders/page.tsx` | ❌ Not found | ❌ Missing |
| `app/(storefront)/account/orders/[id]/page.tsx` | ❌ Not found | ❌ Missing |
| `app/(storefront)/account/profile/page.tsx` | ❌ Merged into `account/page.tsx` | ⚠️ Merged |
| `app/(auth)/login/page.tsx` | Under `(storefront)/account/auth/login/page.tsx` | ❌ **Relocated** |
| `app/(auth)/register/page.tsx` | Under `(storefront)/account/auth/register/page.tsx` | ❌ **Relocated** |
| `app/(auth)/forgot-password/page.tsx` | No forgot-password page | ❌ Missing |
| `app/(auth)/reset-password/[token]/page.tsx` | `account/reset-password/page.tsx` | ⚠️ Partial |
| `app/admin/layout.tsx` | ✅ | ✅ |
| `app/admin/page.tsx` | ✅ | ✅ |
| `app/admin/products/page.tsx` | ❌ Not found | ❌ Missing |
| `app/admin/products/[id]/edit/page.tsx` | ❌ Not found | ❌ Missing |
| `app/admin/orders/page.tsx` | ❌ Not found | ❌ Missing |
| `app/admin/reviews/page.tsx` | ❌ Not found | ❌ Missing |
| `app/admin/users/page.tsx` | ❌ Not found | ❌ Missing |
| `app/admin/blog/page.tsx` | ❌ Not found | ❌ Missing |
| API routes — many differences (see sections 4.1 A8–A15) | Multiple missing/renamed | ❌ Multiple |
| `components/ui/Button.tsx` | ❌ Not found | ❌ Missing |
| `components/ui/Input.tsx` | ❌ Not found | ❌ Missing |
| `components/ui/Modal.tsx` | ❌ Not found | ❌ Missing |
| `components/ui/Badge.tsx` | ❌ Not found | ❌ Missing |
| `components/ui/Card.tsx` | ❌ Not found | ❌ Missing |
| `components/ui/Dropdown.tsx` | ❌ Not found | ❌ Missing |
| `components/ui/Toast.tsx` | ❌ Not found | ❌ Missing |
| `components/ui/Skeleton.tsx` | ❌ Not found | ❌ Missing |
| `components/layout/Header.tsx` | ❌ Not found | ❌ Missing |
| `components/layout/Footer.tsx` | ❌ Not found | ❌ Missing |
| `components/layout/AdminSidebar.tsx` | ❌ Not found | ❌ Missing |
| `components/layout/Breadcrumbs.tsx` | ❌ Not found | ❌ Missing |
| `components/product/*` (11 files) | ❌ Not found | ❌ Missing |
| `components/cart/*` (3 files) | `components/CartItem.tsx`, `CartSummary.tsx` exist; `CartBadge.tsx` missing | ⚠️ Partial |
| `components/checkout/*` (2 files) | Both exist (ShippingForm.tsx, PaymentForm.tsx names without domain folder) | ⚠️ Renamed |
| `components/order/*` (3 files) | ❌ Not found | ❌ Missing |
| `components/review/*` (3 files) | ❌ Not found | ❌ Missing |
| `components/blog/*` (2 files) | ❌ Not found | ❌ Missing |
| `components/auth/*` (5 files) | ❌ Not found | ❌ Missing |
| `components/admin/*` (6 files) | `AdminPage.tsx` only | ❌ Missing 5 |
| `components/shared/*` (6 files) | ❌ Not found | ❌ Missing |
| `repositories/` (8 files) | 7 of 8 exist (missing audit.repository.ts) | ⚠️ Partial |
| `lib/` (11 files listed) | 12 files exist (duplicate rate-limit.ts + extra api-utils.ts, admin-utils.ts) | ⚠️ Extra + duplicate |
| `lib/payment/` (3 files) | ❌ Not found | ❌ Missing |
| `hooks/` (6 files) | ❌ Not found | ❌ Missing |
| `utils/` (5 files) | ❌ Not found | ❌ Missing |
| `emails/templates/` (6 files) | ❌ Not found | ❌ Missing |
| `scripts/` (3 files) | `scripts/download-images.ts` only | ❌ Partial |
| `tests/unit/repositories/` | ❌ Not found | ❌ Missing |
| `tests/unit/utils/` | ❌ Not found | ❌ Missing |
| `tests/unit/lib/` | ❌ Not found | ❌ Missing |
| `tests/unit/components/` | ❌ Not found | ❌ Missing |
| `tests/e2e/` (3 files) | ❌ Not found | ❌ Missing |

### 5.2 Extra Files Not in Architecture

| File | Notes |
|------|-------|
| `app/api/stripe/webhook/route.ts` | Not in arch doc (arch says Express handler) |
| `app/api/admin/setup/route.ts` | Not in arch doc |
| `app/api/admin/products/route.ts` | Separate route (arch says under `app/api/admin/products/`) |
| `app/api/admin/discounts/route.ts` | Not in arch doc |
| `app/api/admin/inventory/route.ts` | Not in arch doc |
| `app/api/admin/metrics/route.ts` | Not in arch doc (arch says `dashboard/`) |
| `app/api/admin/orders/route.ts` | Separate route |
| `app/api/account/orders/route.ts` | Not in arch doc |
| `app/api/account/data/route.ts` | Not in arch doc |
| `components/AddToCartButton.tsx` | Not in arch doc |
| `components/ProductsFilterBar.tsx` | Not in arch doc |
| `components/AdminPage.tsx` | Not in arch doc |
| `lib/rate-limit.ts` | **Duplicate** of `lib/rate-limiter.ts` |
| `lib/api-utils.ts` | Not in arch doc |
| `lib/admin-utils.ts` | Not in arch doc |
| `k6/checkout-test.js` | Load test script (not in arch) |
| `.specify/` directory | Spec-kit metadata (not in arch) |
| `.speckit/` directory | Spec-kit metadata (not in arch) |
| `specs/` directory | Documentation (not in arch tree) |

### 5.3 Missing Files Noted in Tasks but Not Implemented

| Task | File | Status |
|------|------|--------|
| T009 | `lib/env.ts` — Zod env validation | ❌ Missing |
| T012 | `ProductVariant` Prisma model | ❌ Missing |
| T022 | `lib/observability.ts` — Sentry init | ❌ Missing |
| T030 | `scripts/data-retention.ts` — GDPR cleanup | ❌ Missing |
| T045 | `components/VariantSelector.tsx` | ❌ Blocked on T012 |
| T096 | Admin integration test (T096) | ❌ Not done |
| T097–T105 | Admin dashboard full implementation | ❌ Multiple tasks undone |
| T106–T110 | Blog/SEO implementation | ❌ Not done |
| T111–T127 | Security, CI/CD, deployment | ❌ Not done |

### 5.4 Task Completion Assessment (from tasks.md)

| Phase | Tasks | Status | Completion % |
|-------|-------|--------|-------------|
| 1–4: Setup & Foundation | T001–T030 | ✅ Mostly done (env.ts missing, observability missing) | ~80% |
| 5–7: Browse Products (US1) | T031–T047 | ✅ Done (VariantSelector blocked) | ~95% |
| 8–9: Cart (US3a) | T048–T056 | ✅ Done | 100% |
| 10–14: Checkout (US3b) | T057–T078 | ✅ Done (some values differ from spec) | 100% |
| 15–17: Account (US4) | T079–T095 | ✅ Done | 100% |
| 18: Admin (US5+US6) | T096–T105 | ❌ Mostly undone (T102 done, T097 partial) | ~15% |
| 19: Blog/SEO (US8) | T106–T110 | ❌ Not done | 0% |
| 20–22: Security/Observability/CI/CD | T111–T127 | ❌ Not done | 0% |

**Overall Implementation**: ~62 of 127 tasks complete (~49%)

---

## 6. Summary of Gaps & Recommendations

### Critical Gaps (Must Fix)

| # | Gap | Severity | Location | Recommendation |
|---|-----|----------|----------|---------------|
| G1 | **Guest checkout contradiction**: spec.md FR-022 says "MUST be supported" vs. BRD BR04/assumptions says "disabled" | **CRITICAL** | `spec.md:182` vs. `00-assumptions.md:25` | Reconcile the spec to match the fixed assumptions doc. Spec is wrong. |
| G2 | **Express webhook exception not honored**: Route Handler used instead of Express | **HIGH** | `app/api/stripe/webhook/route.ts` vs. `architecture.md:36-38` | Either switch to Express or update architecture.md to reflect the decision change. |
| G3 | **ProductVariant model missing**: Blocks variant selector, color/size filtering | **HIGH** | `prisma/schema.prisma` vs. `spec.md:193` | Implement ProductVariant model per spec.md Clarification 3. |
| G4 | **Blog not implemented**: 0% of US8, FM9.1–9.4, FR-017 | **HIGH** | `app/(storefront)/blog/` | Implement blog listing + article pages + admin CRUD. |
| G5 | **CI/CD pipeline absent**: No `.github/workflows/`, no Dockerfile | **HIGH** | `docs/21-docker.md`, `docs/22-github-actions.md` | Implement CI/CD per docs or remove docs. |
| G6 | **Admin dashboard incomplete**: ~15% done | **HIGH** | `app/admin/`, `tasks.md` T096–T105 | Complete admin CRUD, refunds, metrics, CSV export. |

### Medium Gaps

| # | Gap | Location |
|---|-----|----------|
| M1 | `hooks/` directory missing (6 hooks documented) | `docs/architecture.md:280-286` |
| M2 | `utils/` directory missing (5 utils documented) | `docs/architecture.md:296-301` |
| M3 | Email templates missing (6 templates documented) | `docs/architecture.md:303-311` |
| M4 | `lib/payment/` gateway abstraction missing | `docs/architecture.md:265-268`, FM12 |
| M5 | `lib/rate-limit.ts` and `lib/rate-limiter.ts` duplicate | `lib/` directory |
| M6 | Social login (OAuth) not implemented | FM2.5, `app/api/auth/social-login/route.ts` |
| M7 | Customer self-cancel endpoint missing | BR14, `app/api/orders/[id]/cancel/route.ts` |
| M8 | Multi-currency (USD/INR) not implemented | FM11 |
| M9 | Shipping values differ: $8/$120 vs $5.99/$100 | Multiple doc locations |
| M10 | CI/CD pipeline docs exist but no implementation | `docs/22-github-actions.md` |

### Low Gaps

| # | Gap |
|---|-----|
| L1 | `app/loading.tsx` missing (global loading skeleton) |
| L2 | `/account/orders/` missing (orders consolidated into `/account/page.tsx`) |
| L3 | `repositories/audit.repository.ts` missing (7 of 8 exist) |
| L4 | `styles/tailwind.config.ts` at root instead of `styles/` |
| L5 | Extra files (`lib/api-utils.ts`, `lib/admin-utils.ts`) not documented |
| L6 | Category route is plural (`categories/`) vs. documented singular (`category/`) |

### Documentation Remediation Priority

1. **`spec.md`** — Fix FR-022 guest checkout contradiction. Fix shipping values to match assumptions.
2. **`architecture.md`** — Update Express webhook section. Add note about Route Handler decision. Add actual folder tree. Add missing `lib/payment/`, `hooks/`, `utils/` or remove from plan.
3. **`plan.md`** — Update path prefix from `src/` to root-level. Remove ProductVariant references if intentionally dropped.
4. **`02-system-architecture.md`** — Generate the actual diagram or remove the placeholder.
5. **`docs/21-docker.md`**, **`docs/22-github-actions.md`** — Either implement or mark as "planned but not yet built."
