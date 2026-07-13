# Feature Inventory — PineNova Ecommerce (Baseline)

**Generated:** 2026-07-12  
**Source:** Codebase scan + Audit reports  
**Scope:** All implemented, partial, and missing features

---

## Feature Status Legend

| Status | Meaning |
|--------|---------|
| ✅ **Complete** | Fully implemented, tested, documented |
| ⚠️ **Partial** | Core logic done; UI/API gaps remain |
| ❌ **Missing** | Not implemented |
| 💥 **Broken** | Implemented but fails/incorrect |
| 🚫 **Blocked** | Waiting on dependency |

---

## Feature Inventory by Epic

### EPIC 1: Product Discovery (US1 — Browse Products)

| Feature ID | Feature | Status | Files | Gaps |
|------------|---------|--------|-------|------|
| FEAT-001 | Homepage with hero, categories, featured products | ✅ Complete | `app/page.tsx`, `components/ProductGrid.tsx` | — |
| FEAT-002 | Product listing page (`/products`) with filters | ⚠️ Partial | `app/(storefront)/products/page.tsx`, `components/ProductsFilterBar.tsx`, `components/ProductFilters.tsx` | No pagination UI (data exists) |
| FEAT-003 | Product detail page (`/products/[slug]`) | ✅ Complete | `app/(storefront)/products/[slug]/page.tsx`, `components/AddToCartButton.tsx` | No review submission form |
| FEAT-004 | Category listing page (`/categories/[slug]`) | ⚠️ Partial | `app/(storefront)/categories/[slug]/page.tsx` | No filter sidebar, no pagination |
| FEAT-005 | Search functionality | ❌ Missing | — | No `/search` route, no search input in nav |
| FEAT-006 | Product images (Next.js Image optimization) | ✅ Complete | `next.config.js`, product pages | No `sizes` prop, no `priority` on LCP |
| FEAT-007 | Structured data (JSON-LD Product, Breadcrumb) | ✅ Complete | `app/(storefront)/products/[slug]/page.tsx:52-105` | Homepage/category pages missing |
| FEAT-008 | Product variants (size/color) | 🚫 Blocked | — | Requires ProductVariant model (GAP-009) |
| FEAT-009 | Stock badges (In Stock / Low Stock / Out of Stock) | ✅ Complete | `components/ProductCard.tsx`, `app/(storefront)/products/[slug]/page.tsx` | Color-only indicator (accessibility) |

---

### EPIC 2: Shopping Cart (US3a — Cart)

| Feature ID | Feature | Status | Files | Gaps |
|------------|---------|--------|-------|------|
| FEAT-010 | Persistent cart (server-side, session-based) | ✅ Complete | `app/api/cart/route.ts`, `app/(storefront)/cart/page.tsx` | Session ID in localStorage (not HttpOnly cookie) |
| FEAT-011 | Add to cart (with stock validation) | ✅ Complete | `app/api/cart/route.ts:POST`, `components/AddToCartButton.tsx` | No optimistic update |
| FEAT-012 | Update quantity (with stock validation) | ✅ Complete | `app/api/cart/route.ts:PATCH` | No optimistic update |
| FEAT-013 | Remove item | ✅ Complete | `app/api/cart/route.ts:DELETE` | — |
| FEAT-014 | Cart summary (subtotal, tax, shipping, total) | ✅ Complete | `components/CartSummary.tsx` | Shipping/tax show "Calculated at checkout" |
| FEAT-015 | Empty cart state | ✅ Complete | `app/(storefront)/cart/page.tsx` | — |
| FEAT-016 | Cart error/loading states | ✅ Complete | `app/(storefront)/cart/page.tsx` | Full-page loading, no skeletons |
| FEAT-017 | Guest cart merge on login | ❌ Missing | — | GAP-032 |

---

### EPIC 3: Checkout (US3b — Checkout + Payment)

| Feature ID | Feature | Status | Files | Gaps |
|------------|---------|--------|-------|------|
| FEAT-018 | Checkout API (server-authoritative pricing) | ✅ Complete | `app/api/checkout/route.ts`, `services/checkout.service.ts` | — |
| FEAT-019 | Stripe Checkout Session creation | ✅ Complete | `services/checkout.service.ts:331`, `lib/stripe.ts` | — |
| FEAT-020 | Inventory reservation (pessimistic locking) | ✅ Complete | `services/inventory.service.ts:34-58` | Race window if payment fails |
| FEAT-021 | Order creation on webhook | ✅ Complete | `services/checkout.service.ts:161-274`, `app/api/stripe/webhook/route.ts` | — |
| FEAT-022 | Idempotent webhook handling | ✅ Complete | `app/api/stripe/webhook/route.ts:27-30` | — |
| FEAT-023 | Discount code validation | ✅ Complete | `services/checkout.service.ts:75-134` | Race condition on `maxUses` check |
| FEAT-024 | Checkout UI (Shipping + Payment + Confirmation) | ❌ Missing | — | **GAP-008** — Core revenue flow |
| FEAT-025 | Shipping address form | ❌ Missing | `components/ShippingForm.tsx` exists but not integrated | — |
| FEAT-026 | Stripe Payment Element | ❌ Missing | `components/PaymentForm.tsx` exists but **unused** | — |
| FEAT-027 | Order confirmation page | ❌ Missing | `app/(storefront)/checkout/confirmation/page.tsx` exists but no checkout flow to reach it | — |
| FEAT-028 | Guest checkout email capture | ❌ Missing | — | Contradicts REQ-004 |

---

### EPIC 4: Customer Account (US4 — Auth + Account)

| Feature ID | Feature | Status | Files | Gaps |
|------------|---------|--------|-------|------|
| FEAT-029 | Registration (email, password, first/last name) | ✅ Complete | `app/api/auth/register/route.ts`, `app/(storefront)/account/auth/register/page.tsx` | No terms checkbox, no password strength |
| FEAT-030 | Login (JWT access + refresh tokens) | ✅ Complete | `app/api/auth/login/route.ts`, `app/(storefront)/account/auth/login/page.tsx` | Tokens in localStorage + cookie (no HttpOnly) |
| FEAT-031 | Token refresh (rotation + reuse detection) | ✅ Complete | `app/api/auth/refresh/route.ts`, `lib/auth.ts:78-103` | O(n) scan on rotation |
| FEAT-032 | Password reset (request + confirm) | ✅ Complete | `app/api/auth/reset-password/route.ts`, `app/(storefront)/account/reset-password/page.tsx` | User enumeration via response |
| FEAT-033 | Account dashboard (order history) | ⚠️ Partial | `app/(storefront)/account/page.tsx` | No profile edit, no order detail, no address book, no password change |
| FEAT-034 | GDPR data export | ✅ Complete | `app/api/account/data/route.ts:GET` | Uses vulnerable localStorage token |
| FEAT-035 | Account deletion (pseudonymize, retain orders) | ✅ Complete | `app/api/account/data/route.ts:DELETE` | No password re-entry, no MFA, no email confirm |
| FEAT-036 | Profile editing | ❌ Missing | — | GAP-021 |
| FEAT-037 | Address book management | ❌ Missing | — | GAP-021 |
| FEAT-038 | Password change (authenticated) | ❌ Missing | — | GAP-021 |
| FEAT-039 | Order detail page | ❌ Missing | — | GAP-027 |

---

### EPIC 5: Admin Dashboard (US5+US6 — Admin)

| Feature ID | Feature | Status | Files | Gaps |
|------------|---------|--------|-------|------|
| FEAT-040 | Admin auth (role check) | 💥 Broken | `middleware.ts:72-77`, `lib/admin-utils.ts` | Middleware checks token presence ONLY, no role validation |
| FEAT-041 | Product CRUD (list, create, archive) | ⚠️ Partial | `app/api/admin/products/route.ts`, `components/AdminPage.tsx` | No edit, no image upload, no variant mgmt |
| FEAT-042 | Order management (list, status transitions) | ⚠️ Partial | `app/api/admin/orders/route.ts`, `components/AdminPage.tsx` | No search/filter, no order detail view, no pagination |
| FEAT-043 | Refund processing (Stripe + idempotency) | ⚠️ Partial | `app/api/admin/orders/route.ts:POST`, `lib/stripe.ts:47` | No confirmation dialog, simulated mode fallback |
| FEAT-044 | Inventory management (list, adjust stock) | ⚠️ Partial | `app/api/admin/inventory/route.ts`, `components/AdminPage.tsx` | No validation on negative stock, no audit trail UI |
| FEAT-045 | Discount code CRUD | ⚠️ Partial | `app/api/admin/discounts/route.ts`, `components/AdminPage.tsx` | No edit, only deactivate |
| FEAT-046 | Sales metrics + CSV export | ⚠️ Partial | `app/api/admin/metrics/route.ts` | No charts, no date range, CSV export untested |
| FEAT-047 | Admin setup (initial admin creation) | ✅ Complete | `app/api/admin/setup/route.ts` | Dev-only |
| FEAT-048 | Admin layout/navigation | ❌ Missing | `app/admin/layout.tsx` empty | No sidebar, no header, no logout |

---

### EPIC 6: Discounts & Promotions (US7)

| Feature ID | Feature | Status | Files | Gaps |
|------------|---------|--------|-------|------|
| FEAT-049 | Discount code types (percentage, fixed) | ✅ Complete | `types/index.ts`, `services/checkout.service.ts` | — |
| FEAT-050 | Discount validation (active, expiry, max uses, min order) | ✅ Complete | `services/checkout.service.ts:75-134` | `maxUses` check outside transaction |
| FEAT-051 | Atomic `usedCount` increment | ✅ Complete | `services/checkout.service.ts:214-218` | — |
| FEAT-052 | Percentage discount > 100% rejected | ✅ Complete | `types/index.ts` refine | — |
| FEAT-053 | Admin discount management | ⚠️ Partial | `app/api/admin/discounts/route.ts` | No edit, only deactivate |

---

### EPIC 7: Content & SEO (US8 — Blog)

| Feature ID | Feature | Status | Files | Gaps |
|------------|---------|--------|-------|------|
| FEAT-054 | Blog article listing | ❌ Missing | — | No `/blog` routes |
| FEAT-055 | Blog article detail | ❌ Missing | — | No `/blog/[slug]` routes |
| FEAT-056 | Admin blog CRUD | ❌ Missing | — | No admin blog tab |
| FEAT-057 | Sitemap.xml generation | ❌ Missing | — | GAP-031 |
| FEAT-058 | robots.txt | ❌ Missing | — | GAP-031 |
| FEAT-059 | SEO metadata (OG, Twitter, canonical) | ⚠️ Partial | `app/layout.tsx`, product pages | Homepage missing Org/WebSite JSON-LD, no og:image |

---

### EPIC 8: Platform & Infrastructure (US9-US11)

| Feature ID | Feature | Status | Files | Gaps |
|------------|---------|--------|-------|------|
| FEAT-060 | CI/CD Pipeline (GitHub Actions) | ❌ Missing | — | GAP-003 |
| FEAT-061 | Docker configuration | ❌ Missing | — | GAP-004 |
| FEAT-062 | Health check endpoint | ❌ Missing | — | GAP-017 |
| FEAT-063 | Database connection pooling (PgBouncer) | ❌ Missing | — | GAP-016 |
| FEAT-064 | Monitoring/Alerting (Sentry) | ❌ Missing | — | GAP-034 |
| FEAT-065 | Structured logging + redaction | ⚠️ Partial | `lib/logger.ts` | Missing EMAIL_API_KEY redaction |
| FEAT-066 | Rate limiting (production-ready) | 💥 Broken | `lib/rate-limit.ts`, `lib/rate-limiter.ts` | GAP-012 |
| FEAT-067 | CSP (production-hardened) | 💥 Broken | `middleware.ts` | GAP-002 |
| FEAT-068 | Security headers (COOP, COEP, CORP, HSTS preload) | ⚠️ Partial | `middleware.ts` | Missing COOP/COEP/CORP |
| FEAT-069 | CI security scanning (npm audit, SAST) | ❌ Missing | — | — |
| FEAT-070 | Staging environment | ❌ Missing | — | GAP-033 |
| FEAT-071 | Backup strategy | ❌ Missing | — | — |
| FEAT-072 | Rollback procedure | ❌ Missing | — | — |
| FEAT-073 | PCI SAQ A compliance | 💥 Broken | `docs/pci-saq-a.md` | GAP-010 |

---

### EPIC 9: Cross-Cutting

| Feature ID | Feature | Status | Files | Gaps |
|------------|---------|--------|-------|------|
| FEAT-074 | Multi-currency (USD/INR) | ❌ Missing | — | GAP-028 |
| FEAT-075 | OAuth login (Google, Apple) | ❌ Missing | `.env.example` has keys | GAP-029 |
| FEAT-076 | Customer self-cancel unshipped orders | ❌ Missing | — | REQ-014 |
| FEAT-077 | Product reviews (customer) | ❌ Missing | — | GAP-026 |
| FEAT-078 | Admin review moderation | ❌ Missing | — | GAP-026 |
| FEAT-079 | Cart expiry (30 days) | ❌ Missing | — | REQ-020 |
| FEAT-080 | Email templates (6 types) | ❌ Missing | `emails/` only README | — |
| FEAT-081 | Loading skeletons (Next.js `loading.tsx`) | ❌ Missing | — | GAP-039 |
| FEAT-082 | Toast/notification system | ❌ Missing | — | GAP-040 |
| FEAT-083 | Skip-to-content / ARIA / keyboard nav | ❌ Missing | — | GAP-041 |
| FEAT-084 | Mobile hamburger menu | ❌ Missing | `app/layout.tsx` | — |
| FEAT-085 | Wishlist | ❌ Missing | — | — |

---

## Summary Statistics

| Epic | Total | Complete | Partial | Missing | Broken | Blocked |
|------|-------|----------|---------|---------|--------|---------|
| E1: Product Discovery | 9 | 5 | 2 | 1 | 0 | 1 |
| E2: Cart | 8 | 7 | 0 | 1 | 0 | 0 |
| E3: Checkout | 11 | 6 | 0 | 5 | 0 | 0 |
| E4: Account | 11 | 6 | 1 | 4 | 0 | 0 |
| E5: Admin | 9 | 1 | 6 | 1 | 1 | 0 |
| E6: Discounts | 5 | 4 | 1 | 0 | 0 | 0 |
| E7: Blog/SEO | 6 | 0 | 1 | 5 | 0 | 0 |
| E8: Platform | 14 | 0 | 1 | 13 | 0 | 0 |
| E9: Cross-Cutting | 12 | 0 | 0 | 12 | 0 | 0 |
| **TOTAL** | **85** | **29** | **12** | **42** | **1** | **1** |

**Completion Rate: 34%** (29/85 features complete)

---

**Update Rule:** Update status when implementation changes. Add new features with next FEAT-XXX ID. Link to GAP register for missing/blocked items.