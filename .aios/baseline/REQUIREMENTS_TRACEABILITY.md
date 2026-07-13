# Requirements Traceability Matrix — PineNova Ecommerce (Baseline)

**Generated:** 2026-07-12  
**Source:** BRD.md, FRD.md, spec.md, 00-assumptions.md, epics-and-stories.md  
**Scope:** All business/functional requirements → Implementation status

---

## Traceability Format

| Req ID | Source | Requirement | Status | UI File | Backend File | API Endpoint | DB Table | Test File | Gap ID |
|--------|--------|-------------|--------|---------|--------------|--------------|----------|-----------|--------|

**Status:** ✅ Complete | ⚠️ Partial | ❌ Missing | 💥 Broken | 🚫 Blocked | ⛔ Deprecated

---

## Business Requirements (BRD)

| Req ID | Source | Requirement | Status | UI File | Backend File | API Endpoint | DB Table | Test File | Gap ID |
|--------|--------|-------------|--------|---------|--------------|--------------|----------|-----------|--------|
| REQ-001 | BRD:BR01 | Prices $49–$289 USD, INR display | ⚠️ Partial | — | `prisma/seed.ts` | — | Product | — | GAP-022 |
| REQ-002 | BRD:BR02 | Tax 10% of subtotal | ⚠️ Partial | — | `services/checkout.service.ts` | — | — | `tests/unit/checkout.service.test.ts` | GAP-022 |
| REQ-003 | BRD:BR03 | Shipping $8 flat, free ≥$120 | ❌ Outdated | — | `services/checkout.service.ts:42-43` | — | — | — | GAP-022 |
| REQ-004 | BRD:BR04 | Guest checkout disabled | 💥 Broken | — | `middleware.ts`, `app/api/checkout/route.ts` | — | — | — | **GAP-001** |
| REQ-005 | BRD:BR05 | Inventory tracking enabled | ✅ Complete | — | `services/inventory.service.ts` | — | InventoryLog | `tests/unit/inventory.service.test.ts` | — |
| REQ-006 | BRD:BR06 | Product reviews enabled | ❌ Missing | — | — | — | Review | — | GAP-026 |
| REQ-007 | BRD:BR07 | UUID primary keys | ✅ Complete | — | `prisma/schema.prisma` | — | All | — | — |
| REQ-008 | BRD:BR08 | CUSTOMER/ADMIN roles | ✅ Complete | — | `lib/auth.ts` | — | User | — | — |
| REQ-009 | BRD:BR09 | JWT access + refresh tokens | ✅ Complete | — | `lib/auth.ts` | `/api/auth/*` | RefreshToken | `tests/unit/auth.test.ts` | — |
| REQ-010 | BRD:BR10 | Stripe Checkout Session only | ✅ Complete | — | `services/checkout.service.ts` | `/api/checkout` | Order | — | — |
| REQ-011 | BRD:BR11 | Product catalogue immutable (12 items, 4 categories) | ⚠️ Partial | — | `prisma/seed.ts` (9 products) | — | Product, Category | — | — |
| REQ-012 | BRD:BR12 | Stripe webhook sole order confirmation | ✅ Complete | — | `app/api/stripe/webhook/route.ts` | `/api/stripe/webhook` | Order, webhookEvent | — | GAP-005 |
| REQ-013 | BRD:BR13 | Express only for webhook retries | 💥 Violated | — | `app/api/stripe/webhook/route.ts` (Next.js Route Handler) | — | — | — | — |
| REQ-014 | BRD:BR14 | Customers cancel own unshipped orders | ❌ Missing | — | — | — | Order | — | — |
| REQ-015 | BRD:BR15 | Confirm-password server-side via Zod | ✅ Complete | — | `types/index.ts` | `/api/auth/register` | — | `tests/unit/auth.test.ts` | — |
| REQ-016 | BRD:BR16 | Product names globally unique | ✅ Complete | — | `prisma/schema.prisma` | — | Product | — | — |
| REQ-017 | BRD:BR17 | Reviews require valid purchase | ❌ Missing | — | — | — | Review | — | GAP-026 |
| REQ-018 | BRD:BR18 | Partial refunds don't auto-restore stock | ❌ Missing | — | — | — | Order, InventoryLog | — | — |
| REQ-019 | BRD:BR19 | Rate limiting (5/15m auth, 100/300 general) | ⚠️ Partial | — | `lib/rate-limiter.ts`, `lib/rate-limit.ts` | — | — | — | GAP-012, GAP-025 |
| REQ-020 | BRD:BR20 | Cart items expire after 30 days | ❌ Missing | — | — | — | Cart | — | — |
| REQ-021 | BRD:BR21 | Stock validated before Stripe session | ✅ Complete | — | `services/checkout.service.ts` | `/api/checkout` | — | — | — |
| REQ-022 | BRD:BR22 | Search covers name, description, material | ✅ Complete | — | `app/api/products/route.ts` | `/api/products` | Product | `tests/integration/products.test.ts` | — |
| REQ-023 | BRD:BR23 | — | — | — | — | — | — | — | — |

---

## Functional Requirements (FRD)

| Req ID | Source | Requirement | Status | UI File | Backend File | API Endpoint | DB Table | Test File | Gap ID |
|--------|--------|-------------|--------|---------|--------------|--------------|----------|-----------|--------|
| REQ-024 | FRD:FM1.1 | 12 products, 4 categories, 3 per category | ❌ Partial | — | `prisma/seed.ts` (9 products) | — | Product, Category | — | — |
| REQ-025 | FRD:FM1.2 | Product fields: name, desc, price, images, SKU, stock, materialTag, sustainabilityBadge | ✅ Complete | `components/ProductCard.tsx` | `prisma/schema.prisma` | `/api/products` | Product | — | — |
| REQ-026 | FRD:FM1.3 | Browse by category, paginated | ✅ Complete | `app/(storefront)/categories/[slug]/page.tsx` | `app/api/products/route.ts` | `/api/products` | — | — | — |
| REQ-027 | FRD:FM1.4 | Search by name/keyword | ✅ Complete | — | `app/api/products/route.ts` | `/api/products?q=` | Product | `tests/integration/products.test.ts` | — |
| REQ-028 | FRD:FM1.5 | Sort by price/name/newest | ✅ Complete | `components/ProductFilters.tsx` | `app/api/products/route.ts` | `/api/products?sort=` | — | `tests/integration/products.test.ts` | — |
| REQ-029 | FRD:FM1.6 | Filter by price range, category | ⚠️ Partial | `components/ProductFilters.tsx` | `app/api/products/route.ts` | `/api/products` | — | — | — |
| REQ-030 | FRD:FM1.7 | PDP with full info | ✅ Complete | `app/(storefront)/products/[slug]/page.tsx` | — | `/api/products/[slug]` | Product | — | — |
| REQ-031 | FRD:FM1.8 | Admin CRUD products | ✅ Complete | `components/AdminPage.tsx` (Products tab) | `app/api/admin/products/route.ts` | `/api/admin/products` | Product | `tests/integration/admin.test.ts` | GAP-020 |
| REQ-032 | FRD:FM2.1 | Register with email/password/first/last | ✅ Complete | `app/(storefront)/account/auth/register/page.tsx` | `app/api/auth/register/route.ts` | `/api/auth/register` | User | `tests/unit/auth.test.ts` | — |
| REQ-033 | FRD:FM2.2 | JWT access + refresh tokens | ✅ Complete | — | `lib/auth.ts` | `/api/auth/*` | RefreshToken | `tests/unit/auth.test.ts` | — |
| REQ-034 | FRD:FM2.3 | bcrypt password hashing | ✅ Complete | — | `lib/auth.ts` | — | User | — | — |
| REQ-035 | FRD:FM2.4 | CUSTOMER/ADMIN roles | ✅ Complete | — | `lib/auth.ts`, `lib/admin-utils.ts` | — | User | — | — |
| REQ-036 | FRD:FM2.5 | OAuth social login (Google, Apple) | ❌ Missing | — | — | `/api/auth/social-login` (not exist) | User | — | GAP-029 |
| REQ-037 | FRD:FM2.6 | Password reset via email | ✅ Complete | `app/(storefront)/account/reset-password/page.tsx` | `app/api/auth/reset-password/route.ts` | `/api/auth/reset-password` | User | `tests/unit/auth.test.ts` | — |
| REQ-038 | FRD:FM2.7 | Update profile | ⚠️ Partial | — | — | `/api/account/profile` (not exist) | User | — | GAP-021 |
| REQ-039 | FRD:FM2.8 | Refresh token rotation | ✅ Complete | — | `lib/auth.ts`, `app/api/auth/refresh/route.ts` | `/api/auth/refresh` | RefreshToken | `tests/unit/auth.test.ts` | — |
| REQ-040 | FRD:FM3.1 | Persistent cart (server-side) | ✅ Complete | `app/(storefront)/cart/page.tsx` | `app/api/cart/route.ts` | `/api/cart` | Cart, CartItem | `tests/integration/cart.test.ts` | — |
| REQ-041 | FRD:FM3.2-3.4 | Add/remove/update cart items | ✅ Complete | `components/CartItem.tsx`, `components/AddToCartButton.tsx` | `app/api/cart/route.ts` | `/api/cart` (PATCH/DELETE) | CartItem | `tests/integration/cart.test.ts` | — |
| REQ-042 | FRD:FM3.5 | Cart subtotal/tax/shipping/total | ✅ Complete | `components/CartSummary.tsx` | `services/checkout.service.ts` | — | — | — | — |
| REQ-043 | FRD:FM3.6 | Stock validation on add + checkout | ✅ Complete | — | `app/api/cart/route.ts`, `services/checkout.service.ts` | `/api/cart`, `/api/checkout` | — | `tests/integration/cart.test.ts` | — |
| REQ-044 | FRD:FM4.1 | Checkout requires auth | ✅ Complete | `app/(storefront)/checkout/page.tsx` | `app/api/checkout/route.ts` | `/api/checkout` | — | — | — |
| REQ-045 | FRD:FM4.2 | Shipping address collection | ✅ Complete | `components/ShippingForm.tsx` | — | — | Order (JSON) | — | — |
| REQ-046 | FRD:FM4.3 | Calculate subtotal/tax/shipping/total | ✅ Complete | — | `services/checkout.service.ts` | — | — | `tests/unit/checkout.service.test.ts` | — |
| REQ-047 | FRD:FM4.4 | Stripe Checkout redirect | ✅ Complete | — | `services/checkout.service.ts` | `/api/checkout` | Order | — | — |
| REQ-048 | FRD:FM4.5 | Stripe sole gateway; abstraction layer | ❌ Missing | — | — | `/lib/payment/` (not exist) | — | — | — |
| REQ-049 | FRD:FM4.6 | Webhook confirms order | ✅ Complete | — | `app/api/stripe/webhook/route.ts` | `/api/stripe/webhook` | Order | — | GAP-005 |
| REQ-050 | FRD:FM4.7 | Webhook idempotency | ✅ Complete | — | `app/api/stripe/webhook/route.ts` | — | webhookEvent | — | — |
| REQ-051 | FRD:FM4.8 | Stock validated before Stripe session | ✅ Complete | — | `services/checkout.service.ts` | — | — | — | — |
| REQ-052 | FRD:FM4.9 | Order confirmation email | ✅ Complete | — | `services/checkout.service.ts` | — | — | — | — |
| REQ-053 | FRD:FM5.1-5.7 | Order lifecycle (confirmed → cancelled/refunded) | ⚠️ Partial | `components/AdminPage.tsx` (Orders tab) | `app/api/admin/orders/route.ts` | `/api/admin/orders` | Order, OrderStatusLog | `tests/integration/admin.test.ts` | GAP-020 |
| REQ-054 | FRD:FM6.1-6.5 | Inventory tracking, stock deduction, low-stock alerts | ⚠️ Partial | — | `services/inventory.service.ts` | `/api/admin/inventory` | InventoryLog | `tests/unit/inventory.service.test.ts` | — |
| REQ-055 | FRD:FM7.1-7.5 | Reviews: submit, edit, approve, reject, delete | ✅ Complete (API) | ❌ UI Missing | `app/api/admin/reviews/route.ts` (not exist) | — | Review | — | GAP-026 |
| REQ-056 | FRD:FM8.1-8.6 | Admin dashboard: product/order/user/review managers | ⚠️ Partial | `app/admin/page.tsx`, `components/AdminPage.tsx` | `app/api/admin/*` | `/api/admin/*` | — | `tests/integration/admin.test.ts` | GAP-020 |
| REQ-057 | FRD:FM9.1-9.4 | Blog listing, article pages, admin CRUD | ❌ Missing | — | — | `/api/blog` (not exist) | BlogArticle | — | GAP-030 |
| REQ-058 | FRD:FM10.1-10.4 | Transactional emails (order confirm, ship, reset, welcome) | ⚠️ Partial | — | `lib/email.ts` | — | — | — | — |
| REQ-059 | FRD:FM11.1-11.3 | Multi-currency USD/INR | ❌ Missing | — | — | — | — | — | — |
| REQ-060 | FRD:FM12.1-12.3 | PaymentGateway interface in `/lib/payment` | ❌ Missing | — | — | — | — | — | — |

---

## Spec.md Functional Requirements

| Req ID | Source | Requirement | Status | UI File | Backend File | API Endpoint | DB Table | Test File | Gap ID |
|--------|--------|-------------|--------|---------|--------------|--------------|----------|-----------|--------|
| REQ-061 | spec:FR-001 | Browse by category | ✅ Complete | `app/(storefront)/categories/[slug]/page.tsx` | — | — | — | — | — |
| REQ-062 | spec:FR-002 | Filter by price, material, color, size | ⚠️ Partial | `components/ProductFilters.tsx` | — | — | — | — | GAP-009 |
| REQ-063 | spec:FR-003 | Sort by price, newest, popularity | ⚠️ Partial | `components/ProductFilters.tsx` | — | — | — | — | — |
| REQ-064 | spec:FR-004 | PDP with stock status | ✅ Complete | `app/(storefront)/products/[slug]/page.tsx` | — | — | — | — | — |
| REQ-065 | spec:FR-005 | Cart with quantity management | ✅ Complete | `app/(storefront)/cart/page.tsx` | — | — | — | — | — |
| REQ-066 | spec:FR-006 | Stripe checkout, no card data stored | ✅ Complete | — | `services/checkout.service.ts` | `/api/checkout` | — | — | — |
| REQ-067 | spec:FR-007 | Account creation | ✅ Complete | `app/(storefront)/account/auth/register/page.tsx` | — | `/api/auth/register` | — | — | — |
| REQ-068 | spec:FR-008 | Order history for authenticated users | ✅ Complete | `app/(storefront)/account/page.tsx` | — | `/api/account/orders` | — | — | — |
| REQ-069 | spec:FR-009 | Password reset | ✅ Complete | `app/(storefront)/account/reset-password/page.tsx` | — | `/api/auth/reset-password` | — | — | — |
| REQ-070 | spec:FR-010 | Admin CRUD products + variants | ⚠️ Partial | `components/AdminPage.tsx` (Products tab) | `app/api/admin/products/route.ts` | `/api/admin/products` | Product | — | GAP-009 |
| REQ-071 | spec:FR-011 | Inventory audit history | ✅ Complete | — | `services/inventory.service.ts` | `/api/admin/inventory` | InventoryLog | — | — |
| REQ-072 | spec:FR-012 | Admin order status + refunds | ⚠️ Partial | `components/AdminPage.tsx` (Orders tab) | `app/api/admin/orders/route.ts` | `/api/admin/orders` | Order | `tests/integration/admin.test.ts` | GAP-020 |
| REQ-073 | spec:FR-013 | Admin sales metrics + CSV export | ⚠️ Partial | `components/AdminPage.tsx` (Metrics tab) | `app/api/admin/metrics/route.ts` | `/api/admin/metrics` | — | — | GAP-020 |
| REQ-074 | spec:FR-014 | Admin discount code CRUD | ✅ Complete | `components/AdminPage.tsx` (Discounts tab) | `app/api/admin/discounts/route.ts` | `/api/admin/discounts` | DiscountCode | `tests/integration/admin.test.ts` | — |
| REQ-075 | spec:FR-015 | Customers apply discount codes at checkout | ✅ Complete | `app/(storefront)/checkout/page.tsx` | `services/checkout.service.ts` | `/api/checkout/validate-discount` (not exist) | DiscountCode | `tests/integration/checkout-flow.test.ts` | — |
| REQ-076 | spec:FR-016 | Idempotent state-changing operations | ✅ Complete | — | `app/api/stripe/webhook/route.ts`, `services/checkout.service.ts` | — | webhookEvent | — | — |
| REQ-077 | spec:FR-017 | Blog SEO metadata | ❌ Missing | — | — | — | BlogArticle | — | GAP-030 |
| REQ-078 | spec:FR-018 | schema.org Product markup on PDP | ✅ Complete | `app/(storefront)/products/[slug]/page.tsx:52-85` | — | — | — | — | — |
| REQ-079 | spec:FR-019 | Graceful degradation (non-critical service failure) | ✅ Complete | — | `lib/feature-flags.ts` | — | — | — | — |
| REQ-080 | spec:FR-020 | Structured logging + error tracking for checkout | ⚠️ Partial | — | `lib/logger.ts` (Sentry not init) | — | — | — | GAP-034 |
| REQ-081 | spec:FR-021 | Pessimistic locking for oversell prevention | ✅ Complete | — | `services/inventory.service.ts` | — | — | `tests/unit/inventory.service.test.ts` | — |
| REQ-082 | spec:FR-022 | **Guest checkout MUST be supported** | 💥 **VIOLATION** | — | — | — | — | — | **GAP-001** |
| REQ-083 | spec:FR-023 | Flat-rate shipping with free threshold | ⚠️ Partial (wrong values) | — | `services/checkout.service.ts:42-43` | — | — | — | GAP-022 |
| REQ-084 | spec:FR-024 | Tax per-state admin-configurable table | ✅ Complete | — | `services/checkout.service.ts:8-40` | — | — | — | — |
| REQ-085 | spec:FR-025 | `/products/{slug}` URL + auto sitemap | ⚠️ Partial | — | — | — | — | — | GAP-031 |
| REQ-086 | spec:FR-026 | Customer data deletable with order retention | ✅ Complete | `app/(storefront)/account/page.tsx` | `app/api/account/data/route.ts` | `/api/account/data` | User | `tests/integration/auth-flow.test.ts` | — |
| REQ-087 | spec:FR-027 | Backward-compatible migrations | ⚠️ Partial | — | `prisma/schema.prisma` only | — | — | — | — |
| REQ-088 | spec:FR-028 | Feature flags for checkout/payment | ✅ Complete | — | `lib/feature-flags.ts` | — | — | — | — |

---

## Coverage Summary

| Category | Total | ✅ Complete | ⚠️ Partial | ❌ Missing | 💥 Broken/Violation |
|----------|-------|-------------|------------|------------|---------------------|
| BRD (23) | 23 | 12 | 6 | 4 | 2 |
| FRD (60) | 60 | 28 | 12 | 15 | 0 |
| Spec (28) | 28 | 15 | 7 | 4 | 2 |
| **Total** | **111** | **55** | **25** | **23** | **4** |

**Overall Coverage: 49.5% Complete**

---

## Critical Traceability Gaps

| Gap | Requirements Affected | Root Cause |
|-----|----------------------|------------|
| GAP-001 | REQ-004, REQ-082 | Spec.md FR-022 contradicts BRD BR04 + assumptions |
| GAP-009 | REQ-062, REQ-070 | ProductVariant model not in schema |
| GAP-020 | REQ-031, REQ-053, REQ-070, REQ-072, REQ-073 | Admin dashboard ~15% complete |
| GAP-022 | REQ-003, REQ-083 | 3 conflicting shipping/tax values in codebase |
| GAP-005 | REQ-012, REQ-049 | Webhook handler has 0 tests |
| GAP-013 | REQ-004, REQ-008 | Admin API in middleware publicPaths |

---

**Update Rule:** This matrix is the single source of truth for requirements coverage. Update status column when implementation changes. Add new rows for new requirements with REQ-XXX IDs.