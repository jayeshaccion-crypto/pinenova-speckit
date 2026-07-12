# Code Review — PineNova E-Commerce

**Purpose**: check production readiness without expanding scope.

Review recent changes.

---

## US1+US2 — Browse & Product Detail (P1) ✅ DONE

**Scope**: T031–T047 (Phases 5–7)

### Check

- **payment/PII data leaks**: All read-only product catalog. No payment data, PII, or secrets involved. Public routes, no auth needed.
- **pricing, inventory, tax**: Price display uses `toFixed(2)` — note JS quirk `(1.005).toFixed(2) → "1.00"`. Stock badge: `> 0` in stock, `≤ 5` low, `= 0` out of stock. No tax/discount logic in this story. Zod `.refine()` validates `minPrice ≤ maxPrice`.
- **authentication/authorization**: All endpoints public. No auth needed. Correct.
- **SEO metadata**: `generateMetadata` on products listing, product detail, category page, homepage. Root layout `%s | PineNova` template. schema.org `Product` + `BreadcrumbList` JSON-LD on detail page. Canonical URL via `NEXT_PUBLIC_URL`.
- **test coverage**: 20 tests — Zod query param validation, slug validation, sort derivation, minPrice/maxPrice cross-validation. Gap: DB failure mock test, empty API response test.
- **error handling + logging**: try/catch with `logger.error` on failure, 500 catch-all, `logger.info` on success. Zod 400 with field errors. 404 on missing product. Structured error format `{ error: { code, message, details? } }`.
- **unnecessary complexity**: `useCallback` removed. Reviews `take: 10` + `slice(0, 3)` → `take: 3`. Params destructuring simplified. No extraneous components.
- **files changed outside scope**: None.
- **dependency additions**: None.

### Findings

| Finding | Fix |
|---------|-----|
| `render` returned all products, not just `isArchived: false` | Added `where: { isArchived: false }` |
| `generateMetadata` missing on 3 pages | Added to all |
| `useCallback` wrapping filter unnecessarily | Removed |
| Reviews `take: 10` + `slice(0, 3)` | Changed to `take: 3` |
| Page destructured non-existent `searchParams` | Simplified |
| Price tests were tautological | Removed |
| No minPrice/maxPrice cross-validation test | Added `.refine()` + test |

---

## US3a — Cart (P1)

**Scope**: T048–T056 (Phases 8–9)

### Check

- **payment/PII data leaks**: Cart stores only `variantId` + `qty`. No PII. Session ID or customer ID used for ownership — verify session token not logged. No payment data.
- **pricing, inventory, tax**: Cart stores only `variantId` + `qty` — price re-read from DB at checkout. Quantity bounded 1–99. Concurrent tab adds merge quantities (upsert via unique constraint). Double-click add idempotent. Out-of-stock variant rejected at add time (409).
- **authentication/authorization**: Cart ownership verified on every endpoint — wrong sessionId returns empty cart, not another user's data. On login, guest cart merges into customer cart. CSRF on all mutation endpoints.
- **SEO metadata**: Cart page has `noindex`. No canonical needed.
- **test coverage**: Integration test: add → update qty → remove → get cart. Additional: double-click idempotency, concurrent tab adds, quantity bounds 1–99, out-of-stock rejection, wrong session, empty cart, DB failure.
- **error handling + logging**: Error distinction: variant not found → 404, out of stock → 409, invalid input → 400, other → 500. Correlation ID in logs. Rate limited at 30 req/min returns 429.
- **unnecessary complexity**: POST/PATCH/DELETE mapped cleanly. Cart merge on login in single well-defined operation. No premature abstraction.
- **files changed outside scope**: Verify only cart files touched.
- **dependency additions**: None expected.

---

## US3b — Checkout (P1) ✅ DONE

**Scope**: T057–T078 (Phases 10–14)

### Check

- **payment/PII data leaks**: Stripe webhook signature verified via `constructEvent`. `clientSecret` never logged. No `logger` calls include address/name/phone (uses `orderId`, `orderNumber`, `paymentIntentId`). No checkout UI pages exist yet — Stripe Elements not integrated so no card data risk. Stripe API version pinned at `2024-11-20.acacia`. ⚠️ Low: dev-mode `console.log([EMAIL DEV] …)` leaks recipient email in `lib/email.ts:13`.
- **pricing, inventory, tax — concurrency + rounding**: All pricing in cents. `calculatePricing` pure function: subtotal → shipping → tax. `calculatePricingWithDiscount` adds discount step. Rounding: `Math.floor` for charges (discount, total), `Math.round` for tax. Discount never reduces total below 0 (`Math.max` clamp, discount capped at subtotal). Tax in basis points from 30-state static table; unknown state → 0 with `warn`. Deadlock retry: `SELECT ... FOR UPDATE` with 3 retries, exponential backoff 100/200/400ms. Stripe API call outside DB transaction. Zero-price product → 409. `usedCount` incremented atomically inside checkout transaction (✅ FIXED).
- **authentication/authorization**: Cart ownership via session ID before checkout. Guest checkout allowed — no auth required. Server-authoritative pricing — `amount`/`price` in body → 400 `PRICE_REJECTED`. Rate limited at 10 req/min per session (keyed by session ID — ✅ FIXED). CSRF on POST — origin/referer check, both absent → 403 (✅ FIXED).
- **SEO metadata**: Checkout and confirmation pages don't exist yet — `noindex` not applicable until UI is built.
- **test coverage**: 114 tests (5 files). `calculatePricing` covers no discount, percentage, flat, free-shipping threshold, exact threshold, discount > subtotal. `validateDiscountCode` covers expired, maxed-out, below-min, valid. Inventory reserve/release + serialization retry. ⚠️ Gap: no route-level tests (CSRF, rate limit, maintenance mode).
- **error handling + logging**: Error mapping: `InsufficientStockError` → 409 with `{ productId, available }`, Stripe errors → 502, other → 500. Event ID stored in DB with unique constraint for webhook idempotency. Webhook handler synchronous (no early-ack — risk of >5s timeout). Log events: `checkout.started`, `checkout.completed`, deadlock retry as `warn`. ⚠️ Gap: no DB pool exhaustion → 503 handler.
- **unnecessary complexity**: Checkout service has 9 exported functions mixing pure logic, DB access, and orchestration. Acceptable for v1. Transaction scope explicit. No background job system. ⚠️ `reserveStock` runs outside checkout transaction with catch-based rollback (race window).
- **files changed outside scope**: Only checkout files touched.
- **dependency additions**: Stripe SDK already in deps. No new deps. `crypto.randomUUID()` used everywhere.
- **PCI prerequisite**: PCI SAQ A self-assessment not yet created (`docs/pci-saq-a.md` missing). Feature flag now defaults to `false` (opt-in via `FLAG_checkout=true`). Checkout behind flag until PCI doc exists.

### Findings

| Finding | Fix |
|---------|-----|
| `usedCount` never incremented after successful checkout | Added atomic increment in both `checkout()` and `handlePaymentSuccess()` transactions; stored discount code in PaymentIntent metadata |
| Zero-price product proceeds to free checkout | Added guard → `InsufficientStockError` → 409 |
| Dead code in `calculatePricing` (bare expressions at lines 111-112) | Removed |
| `generateOrderNumber` used `Math.random()` | Changed to `crypto.randomUUID()` |
| Rate limit keyed by IP not session | Changed to session ID |
| CSRF bypass when both `origin` and `referer` absent | Added both-missing → 403 |
| Feature flag defaulted to enabled | Changed to `false` (opt-in) |
| No `docs/pci-saq-a.md` | **Blocking for production** — still needed |

---

## US4 — Account Creation & Order History (P2) ⚠️ REVIEW REQUIRED

**Scope**: T079–T095 (Phases 15–17)

### Check

- **payment/PII data leaks**: Password NEVER logged — verify all `logger` calls exclude password, tokens, reset links. Email in structured `{ email }` only when necessary, never in unstructured messages. Refresh tokens stored securely (httpOnly cookie preferred). GDPR export returns all PII as JSON — response not cached, access logged. Deletion anonymizes PII, preserves order records (7-year legal hold), 30-day admin restore window.
- **pricing, inventory, tax**: Not applicable.
- **authentication/authorization**: Password hashing bcrypt cost ≥ 12 or argon2id. Token expiry: access 15 min, refresh 7 days, configurable via env vars. Refresh token rotation invalidates old tokens; reused token → 401. Account endpoints verify JWT + ownership — 403 if accessing another user's data. Admin role check for admin-only endpoints. Rate limiting: 10 req/min login, 5 req/min register, 3 req/min password reset. Account lockout after 10 consecutive failed attempts (15 min). CSRF on all auth POST endpoints.
- **SEO metadata**: All auth pages (login, register, reset-password) and account page have `noindex`.
- **test coverage**: Unit: register → login → access protected route → refresh → old refresh invalidated → password reset. Additional: duplicate email → 409, weak password → 400, expired reset token → 400, reused refresh token → 401, 11th login → 429, wrong user → 403, unauthenticated → 401, data export valid JSON, deletion preserves orders.
- **error handling + logging**: `logger.info` for register, login success, password reset, data export, deletion. `logger.warn` for failed login, expired token attempts. `logger.error` for DB failures. Correlation ID. Structured errors: 400 with field details, 401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 409 `DUPLICATE_EMAIL`.
- **unnecessary complexity**: Auth API uses clear POST endpoints per operation (register, login, refresh, reset-password). Password reset two-step with no client-side state. GDPR export is single JSON endpoint.
- **files changed outside scope**: Verify only auth/account files touched.
- **dependency additions**: `bcrypt` or `bcryptjs` already expected in `lib/auth.ts`. No new deps.

---

## US5+US6 — Admin Dashboard (P2) ⚠️ REVIEW REQUIRED

**Scope**: T096–T105 (Phase 18)

### Check

- **payment/PII data leaks**: Admin actions logged with `adminId`, not admin name/email — no PII in admin audit logs. Refund uses Stripe idempotency key to prevent duplicate charges. Customer data visible in order management — verify admin pages have no caching headers that could expose data.
- **pricing, inventory, tax — concurrency + rounding**: Inventory adjustments reject negative `newStock` (409). Concurrent admin edits detected via `updatedAt` check — last-write-wins with audit trail. Order status transitions validated against allowed matrix — invalid → 409. Refund idempotent via Stripe refund ID dedup.
- **authentication/authorization**: Admin role (`role === 'admin'`) verified from JWT on every endpoint. Non-admin → 403. Expired JWT → redirect to login (not white screen). CSRF on all admin mutation endpoints. Rate limited at 60 req/min.
- **SEO metadata**: Admin pages have `noindex`.
- **test coverage**: Integration: admin creates → edits → archives product; lists → filters → updates order status → issues refund. Additional: non-admin → 403, invalid status transition → 409, refund idempotency (double-click), negative inventory → 409, duplicate discount code → 409.
- **error handling + logging**: `logger.info` for creates/updates/deletes with `adminId`. `logger.warn` for concurrent modification. `logger.error` for Stripe failures on refund. Correlation ID. Admin activity log (`AdminLog`) for all state-changing actions.
- **unnecessary complexity**: Single `?section=` router acceptable if file under 300 lines; split into separate route files if exceeded. Tab state in URL query param (bookmarkable).
- **files changed outside scope**: Verify only admin files touched.
- **dependency additions**: None expected. Stripe SDK already in deps for refunds.

---

## US7 — Discount Codes & Promotions (P3)

**Scope**: T102 (admin CRUD) + T058–T059 (checkout validation)

### Check

- **payment/PII data leaks**: Discount codes are not PII. `usedCount` increment must be atomic (inside checkout transaction) to prevent race conditions on max-uses.
- **pricing, inventory, tax — concurrency + rounding**: Percentage discount: `Math.floor(subtotal * percentage / 100)` — never rounds up against customer. Fixed-amount: `Math.min(fixedValue, subtotal)` — never exceeds subtotal. Discount applied before shipping/tax. No stacking (single code per checkout). `usedCount` incremented atomically inside checkout transaction. Percentage > 100% rejected at creation. Duplicate code rejected.
- **authentication/authorization**: Admin CRUD guarded by admin role check (from US5+6). Discount application at checkout requires cart ownership (from US3b). CSRF on admin mutation endpoints.
- **SEO metadata**: Not applicable — no new pages.
- **test coverage**: Discount validation: expired, maxed-out, below-min, valid, discount > subtotal (clamped to 0), invalid format. Admin: duplicate code rejection, percentage > 100% rejection. Pricing with discount: percentage, fixed, clamp to zero.
- **error handling + logging**: `validateDiscountCode` returns `{ valid: false, reason }` for all failure modes. Admin creates/updates/deletes logged with `adminId`. Duplicate code → 409.
- **unnecessary complexity**: Discount logic is single pure function reused between validation and pricing. Admin CRUD follows same pattern as other sections.
- **files changed outside scope**: Verify only discount-related additions to existing files.
- **dependency additions**: None expected.

---

## US8 — SEO Content & Blog (P3)

**Scope**: T106–T110 (Phase 19)

### Check

- **payment/PII data leaks**: Blog is public content — no PII concerns. Admin blog CRUD guarded by admin role check. Sitemap must not expose `noindex` URLs.
- **pricing, inventory, tax**: Not applicable.
- **authentication/authorization**: Blog listing + detail are public. Admin blog CRUD guarded by admin role check (from US5+6).
- **SEO metadata**: `generateMetadata` on blog listing (title "Blog" + description) and blog detail (post title + excerpt). schema.org `Article` JSON-LD on detail page. Canonical URL on all blog pages. `og:image` on product pages (first product image). Twitter Card meta tags on product + blog pages (`summary_large_image` for products, `summary` for blog). Sitemap includes products, categories, blog posts — excludes all `noindex` pages. `robots.txt` references sitemap.
- **test coverage**: Blog listing renders published posts only (drafts excluded). Blog detail: valid slug renders, invalid slug → 400/404, unpublished → 404. Sitemap: valid XML, correct URL count, no `noindex` URLs. Admin CRUD: create, publish, edit, delete blog post. Duplicate slug rejected.
- **error handling + logging**: Blog detail 404 for missing/invalid slug. Admin blog operations logged with `adminId`. ISR errors handled by Next.js fallback.
- **unnecessary complexity**: Blog pages are server components with simple fetch-and-render. Sitemap is single dynamic route. Admin CRUD follows existing pattern.
- **files changed outside scope**: Verify only blog/sitemap files touched. T109 is a verification pass only — should not modify existing page logic.
- **dependency additions**: None expected.
