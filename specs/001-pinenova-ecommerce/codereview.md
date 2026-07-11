# Code Review — PineNova E-Commerce

**Purpose**: check production readiness without expanding scope.

---

## US1+US2 — Browse & Product Detail (P1) ✅ DONE

**Review scope**: Phases 5–7 (T031–T047)

### Cross-cutting checks

- [x] **CC-SEC-04** — Zod validation on every query param + slug; `.refine()` on `minPrice ≤ maxPrice`; 400 with field errors
- [x] **CC-SEC-05** — No secrets in code. Env vars through `env.ts`.
- [x] **CC-OBS-01** — Structured error responses `{ error: { code, message, details? } }`, no stack traces
- [x] **CC-OBS-02** — Correlation ID in log lines (attached per request)
- [x] **CC-OBS-03** — `logger.info` on success, `logger.error` on failure
- [x] **CC-OBS-04** — try/catch 500 catch-all on every handler
- [x] **CC-OBS-05** — Distinguish 404 (missing product) vs 400 (invalid slug/params) vs 500
- [x] **CC-OBS-06** — DB pool exhaustion → 503 `SERVICE_UNAVAILABLE`
- [x] **CC-SEO-01** — `generateMetadata` on products listing, product detail, category page, homepage. Root layout has `title.template`
- [x] **CC-SEO-03** — Canonical URL on product detail via `NEXT_PUBLIC_URL`
- [x] **CC-SEO-04** — schema.org `Product` + `BreadcrumbList` JSON-LD on detail page
- [x] **CC-DB-02** — Seed data: 4 categories, 9 products
- [x] **CC-OPS-01** — Health check endpoint at `/api/health`
- [x] **CC-OPS-03** — ISR `revalidate=60` on product/category pages
- [x] **CC-TEST-01** — Tests for invalid input (bad sort, bad slug)
- [x] **CC-TEST-02** — Edge cases: empty product listing, out-of-stock products, minPrice/maxPrice boundary
- [x] **CC-TEST-04** — No tautological tests (removed price formatting tests)
- [x] **CC-TEST-05** — Test isolation
- [x] **CC-TEST-06** — `crypto.randomUUID()` for correlation IDs

### Story-specific checks

- [x] `render` filters `isArchived: false` — only published products shown
- [x] Filters by category slug (category page), material, color, size, price range
- [x] Sort: `price_asc/desc`, `newest`, `popularity` (placeholder)
- [x] Product detail: name, price, images, materials, care instructions, variants, stock
- [x] VariantSelector: out-of-stock variants grayed out (T045)
- [x] Stock badge: `> 0` in stock, `≤ 5` low, `= 0` out of stock
- [x] Empty state: ProductGrid shows "No products found"
- [x] Error boundary (`error.tsx`) and 404 (`not-found.tsx`) in route group (T040, T047)
- [x] `next/image` for product images (not `<img>`)
- [x] Price `toFixed(2)` — note JS rounding `(1.005).toFixed(2) → "1.00"`

### Review findings (actual)

| Finding | Fix |
|---------|-----|
| `render` returned ALL products, not just `isArchived: false` | Added `where: { isArchived: false }` |
| `generateMetadata` missing on category, listing, homepage pages | Added to all pages |
| `useCallback` wrapping debounced filter unnecessarily | Removed |
| Reviews `take: 10` + `slice(0, 3)` | Changed to `take: 3` |
| Page destructured non-existent `searchParams` | Simplified |
| Price tests were tautological | Removed |
| No `minPrice > maxPrice` cross-validation test | Added `.refine()` + test |

**Test count**: 20 (Zod query validation, slug, sort, cross-validation)

---

## US3a — Cart (P1)

**Review scope**: Phases 8–9 (T048–T056)

### Cross-cutting checks

- [ ] **CC-SEC-02** — CSRF: `Origin`/`Referer` header check on all mutation endpoints (POST/PATCH/DELETE)
- [ ] **CC-SEC-03** — Rate limiting: 30 req/min on cart endpoints
- [ ] **CC-SEC-04** — Zod on every request body: `variantId` exists, `quantity` 1–99
- [ ] **CC-SEC-06** — Cart ownership: only the session/customer who owns the cart can read/write it. Wrong sessionId → empty cart (not another user's data)
- [ ] **CC-OBS-01** — Structured errors `{ error: { code, message, details? } }`
- [ ] **CC-OBS-02** — Correlation ID on all cart log lines
- [ ] **CC-OBS-03** — `logger.info` for add/update/remove, `logger.error` on failures
- [ ] **CC-OBS-04** — try/catch 500 catch-all
- [ ] **CC-OBS-05** — 404 (variant not found), 409 (out of stock), 400 (invalid input), 500
- [ ] **CC-SEO-02** — Cart page has `{ robots: { index: false, follow: false } }`
- [ ] **CC-PRICE-03** — Cart stores only `variantId` + `qty`; price re-read from DB at read/checkout time
- [ ] **CC-TEST-01** — Failure path: out-of-stock variant, wrong session, DB failure
- [ ] **CC-TEST-02** — Empty cart, quantity bounds 1–99, double-click add (idempotent), concurrent tab adds (merge)
- [ ] **CC-TEST-03** — Idempotency: same add twice produces merged qty, not duplicate row
- [ ] **CC-TEST-05** — Test isolation: each test cleans up after itself
- [ ] **CC-TEST-06** — `crypto.randomUUID()` for correlation IDs
- [ ] **CC-DB-03** — Cart items use soft-delete via quantity=0 (not hard-delete). Cart itself persists.

### Story-specific checks

- [ ] `POST { variantId, quantity }` upserts (unique constraint `[cartId, variantId]` prevents duplicates)
- [ ] `PATCH { variantId, quantity }`: quantity ≤ 0 removes the item
- [ ] `DELETE { variantId }`: removes item, validates cart ownership
- [ ] `GET` returns items with line totals + grand total; empty cart returns `{ items: [], total: 0 }`
- [ ] **Cart merge on login**: session cart items merged into customer cart on login; same variants → sum quantities; session cart cleared afterward (T049)
- [ ] CartItem component: `next/image`, qty selector 1–99, remove button, disabled during API call (T053)
- [ ] CartSummary: shows calculated-at-checkout labels for shipping/tax; checkout button disabled when empty (T054)
- [ ] Empty state: "Your cart is empty" + link to `/products` (T055)
- [ ] Error boundary + toast with retry on API failures (T056)

**Test count**: T048 integration test covers add → update → remove → get; additional for idempotency, concurrent adds, quantity bounds, out-of-stock, wrong session

---

## US3b — Checkout (P1) ⚠️ REVIEW REQUIRED

**Review scope**: Phases 10–14 (T057–T078)

### Cross-cutting checks

- [ ] **CC-SEC-01** — No PII in logs: address fields, names, emails not in structured log data. Use `{ orderId }`.
- [ ] **CC-SEC-02** — CSRF on POST /api/checkout
- [ ] **CC-SEC-03** — Rate limiting: 10 req/min per session on checkout
- [ ] **CC-SEC-04** — Zod validation on checkout request body (shippingAddress fields, discountCode format)
- [ ] **CC-SEC-06** — Cart ownership verified before checkout — cart must belong to requesting session/customer
- [ ] **CC-SEC-08** — Stripe SDK API version pinned in `lib/stripe.ts`
- [ ] **CC-SEC-09** — Webhook handler returns 200 within 5 seconds. No heavy computation in handler. (Stripe retries after 5s.)
- [ ] **CC-PRICE-01** — All `calculatePricing` output in cents (integers). Stripe `amount` in cents.
- [ ] **CC-PRICE-02** — Discount never reduces total below 0 (clamped at zero)
- [ ] **CC-PRICE-03** — Server-authoritative pricing: price re-read from DB at checkout, NOT from client
- [ ] **CC-PRICE-04** — Rounding: `Math.floor` for charges, `Math.round` for tax (standard half-up)
- [ ] **CC-PRICE-05** — Discount order: subtotal − discount → + shipping → + tax
- [ ] **CC-PRICE-06** — Archived/zero-price product at checkout → 409 `PRODUCT_UNAVAILABLE`
- [ ] **CC-PRICE-07** — Price > 0 validation at product/variant creation; zero rejected
- [ ] **CC-OBS-01** — Structured error responses; no stack traces
- [ ] **CC-OBS-02** — Correlation ID on all checkout log lines
- [ ] **CC-OBS-03** — Log events: `checkout.started`, `checkout.completed`, deadlock retry as `warn`
- [ ] **CC-OBS-04** — 500 catch-all on all handlers
- [ ] **CC-OBS-05** — `InsufficientStockError` → 409, Stripe errors → 502, validation → 400, other → 500
- [ ] **CC-OBS-06** — DB pool exhaustion → 503 `SERVICE_UNAVAILABLE` (don't hang)
- [ ] **CC-SEO-02** — Checkout and confirmation pages have `noindex`
- [ ] **CC-FLAG-01** — `POST /api/checkout` gated by `isEnabled('checkout')` and `isEnabled('payment')`; disabled → 503 with maintenance message
- [ ] **CC-TEST-01** — Tests for DB failure, Stripe down, insufficient stock, invalid input
- [ ] **CC-TEST-02** — Edge cases: expired discount, unknown state tax, zero total, concurrent last-item
- [ ] **CC-TEST-03** — Idempotency: same Stripe event delivered twice → one order (webhook replay)
- [ ] **CC-TEST-05** — Test isolation: each test cleans up after itself
- [ ] **CC-TEST-06** — `crypto.randomUUID()` for correlation IDs (no `uuid` dep needed)
- [ ] **CC-OPS-02** — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` present in `.env.example` with comment
- [ ] **CC-OPS-04** — Stripe webhook endpoint URL configured in Stripe Dashboard → `{base_url}/api/stripe/webhook`. `STRIPE_WEBHOOK_SECRET` in env.
- [ ] **CC-DB-03** — Order records soft-deleted/archived? Orders are never deleted (legal hold). InventoryLog is audit-only.
- [ ] **CC-DB-01** — Backward-compatible migrations: additive only (new tables, nullable columns). No destructive changes.

### Story-specific checks (CK-SEC-*)

- [ ] **CK-SEC-01** — Webhook signature via `stripe.webhooks.constructEvent`; tampered body → 400
- [ ] **CK-SEC-02** — Idempotency key on `stripe.paymentIntents.create` (format: `checkout_{cartId}_{timestamp}`)
- [ ] **CK-SEC-03** — `handlePaymentSuccess` idempotent: store event IDs in DB with unique constraint; duplicate → 200 no-op
- [ ] **CK-SEC-04** — Transaction scope: DB tx wraps load-cart → validate → reserve → create-order → clear-cart. Stripe call OUTSIDE the tx. On Stripe failure, release stock.
- [ ] **CK-SEC-05** — Deadlock retry: `maxRetries=3` with exponential backoff (100ms, 200ms, 400ms); each retry logged as `warn`
- [ ] **CK-SEC-06** — `clientSecret` never logged, never stored server-side beyond initial response
- [ ] **CK-SEC-07** — Partial failure: email failure does NOT roll back order (order valid, email is side effect). Logged as `error`.
- [ ] **CK-SEC-08** — Server-authoritative pricing: reject any `amount` or `price` from client body

### Pricing & tax checks (T057–T060)

- [ ] `calculatePricing` is pure function tested with: no discount, percentage, fixed, free-shipping threshold (≥ $100.00 = 10000¢), exact threshold, discount > subtotal (clamp to 0)
- [ ] `validateDiscountCode`: checks active, not expired, `usedCount < maxUses`, min order. Single code only (no stacking).
- [ ] `lookupTaxRate`: static table in basis points (e.g., CA=725). Unknown state → 0 + `logger.warn`. Tax = `Math.round((taxable × rateBps) / 10000)`.

### Inventory checks (T061–T063)

- [ ] `reserveStock`: `SELECT ... FOR UPDATE` in transaction, check `stock ≥ qty`, decrement, `InventoryLog` with reason `'reserve'`
- [ ] `releaseStock`: increment stock, `InventoryLog` with reason `'release'`. Called on payment failure.

### Stripe payment checks (T064–T066)

- [ ] `createPayment`: `stripe.paymentIntents.create({ amount (cents), currency: 'usd' })` with idempotency key
- [ ] `handlePaymentSuccess`: query Stripe PI status → confirm `succeeded` → create Order + OrderLineItems in DB tx → clear cart → send email
- [ ] Order number format: `ORD-{YYMMDD}-{XXXX}` stored in `orderNumber` field (T066)

### Webhook checks (T071–T072)

- [ ] `payment_intent.succeeded`: verify signature → event ID dedup → `handlePaymentSuccess` → return 200 within 5s
- [ ] `payment_intent.payment_failed`: verify signature → `releaseStock` for all cart items → log reason → return 200

### UI checks (T073–T077)

- [ ] ShippingForm: name, line1/line2, city, state dropdown, zip; validates on blur (T073)
- [ ] PaymentForm: Stripe Elements `PaymentElement` only; no card data in React state (T074)
- [ ] Checkout page: loading/processing state on submit, disable buttons, prevent double-submit (T075)
- [ ] Confirmation page: order summary + guest order lookup link (T076)
- [ ] Error states: payment declined, insufficient stock, Stripe unavailable — friendly message + retry, no technical details (T077)

### Load test (T078)

- [ ] k6/Artillery: 20 concurrent users, same last-in-stock variant → only 1 succeeds, inventory = 0, no negative stock. Zero deadlock errors.

### PCI prerequisite

- [ ] PCI SAQ A self-assessment completed in `docs/pci-saq-a.md` before production deploy. Checkout must remain behind feature flag without it.

---

## US4 — Account Creation & Order History (P2) ⚠️ REVIEW REQUIRED

**Review scope**: Phases 15–17 (T079–T095)

### Cross-cutting checks

- [ ] **CC-SEC-01** — No PII in logs: passwords NEVER logged; email in structured `{ email }` only when necessary; reset tokens not logged
- [ ] **CC-SEC-02** — CSRF on all auth POST endpoints (register, login, refresh, reset, delete)
- [ ] **CC-SEC-03** — Rate limiting: 10 req/min login, 5 req/min register, 3 req/min password reset
- [ ] **CC-SEC-04** — Zod on all auth input: email format, password ≥ 8 chars / mixed case + digit
- [ ] **CC-SEC-06** — JWT on every account endpoint; 401 if missing/invalid, 403 if wrong user
- [ ] **CC-SEC-07** — Access token 15 min expiry, refresh token 7 day expiry. Configurable via env vars `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`
- [ ] **CC-OBS-01** — Structured errors `{ error: { code, message } }`; 401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 409 `DUPLICATE_EMAIL`
- [ ] **CC-OBS-02** — Correlation ID in all auth/account log lines
- [ ] **CC-OBS-03** — `logger.info` on register, login success, password reset; `logger.warn` on failed login; `logger.error` on DB failures
- [ ] **CC-OBS-04** — 500 catch-all on all handlers
- [ ] **CC-OBS-05** — 401 vs 403 vs 409 correctly distinguished
- [ ] **CC-SEO-02** — All auth pages (login, register, reset-password) and account page have `noindex`
- [ ] **CC-TEST-01** — Tests for DB failure, duplicate email, weak password, expired reset token, stolen refresh token
- [ ] **CC-TEST-02** — Edge cases: empty order history, rate limit exceeded, concurrent sessions
- [ ] **CC-TEST-03** — Idempotency: same register request twice → one customer, second returns 409
- [ ] **CC-TEST-05** — Test isolation: each test cleans up after itself
- [ ] **CC-TEST-06** — `crypto.randomUUID()` for correlation IDs
- [ ] **CC-OBS-06** — DB pool exhaustion → 503 `SERVICE_UNAVAILABLE`
- [ ] **CC-SEC-05** — No raw secrets in code: JWT secret, DB URL from `env.ts` only
- [ ] **CC-DB-03** — Account deletion uses soft-delete (`deletedAt`). Customer data anonymized, orders preserved.

### Story-specific checks (T079–T095)

- [ ] **Password hashing (T080)**: bcrypt cost ≥ 12 or argon2id in `lib/auth.ts`
- [ ] **Register (T080)**: creates Customer, returns 201 `{ customer }` (no tokens), duplicate email → 409
- [ ] **Login (T081)**: returns `{ accessToken, refreshToken, customer }`, wrong password → 401, rate-limited
- [ ] **Account lockout (T081)**: 10 consecutive failed attempts on same email → 15 min lock (separate from rate limit)
- [ ] **Refresh token rotation (T082)**: old token invalidated on use; reused (stolen) token → 401
- [ ] **Password reset (T083)**: two-step — (1) email → token with 15 min expiry, send email; (2) token + new-password → update hash. Return generic "If the email exists..." to prevent enumeration.
- [ ] **Order history (T090)**: `GET /api/account/orders`, paginated 20/page, authenticated + ownership check
- [ ] **GDPR data export (T091)**: `GET /api/account/data` — all PII as JSON, access logged
- [ ] **GDPR data deletion (T092)**: `DELETE /api/account/data` — soft-delete (`deletedAt`), email → hash, orders preserved. Requires confirmation token. 30-day admin restore window.
- [ ] **Login UI (T086)**: stores tokens (httpOnly cookie or localStorage), redirects to `/account`
- [ ] **Register UI (T087)**: client-side validation, redirects to login with flash message
- [ ] **Reset password UI (T088)**: two-step, always shows "Check your email" (prevents enumeration)
- [ ] **Account page (T095)**: welcome message, order history table, download data button, delete account with confirmation

**Test count**: T079 unit test (register → login → refresh → rotation → password reset), T089 integration test (orders, export, deletion, auth failures)

---

## US5+US6 — Admin Dashboard (P2) ⚠️ REVIEW REQUIRED

**Review scope**: Phase 18 (T096–T105)

### Cross-cutting checks

- [ ] **CC-SEC-01** — No PII in logs: admin actions logged with `adminId`, not admin name/email
- [ ] **CC-SEC-02** — CSRF on all admin mutation endpoints (POST/PATCH/DELETE)
- [ ] **CC-SEC-03** — Rate limiting: 60 req/min on admin endpoints
- [ ] **CC-SEC-04** — Zod validation on all admin request bodies
- [ ] **CC-SEC-06** — Admin role checked from JWT (`role === 'admin'`) on every request; non-admin → 403
- [ ] **CC-OBS-01** — Structured error responses
- [ ] **CC-OBS-02** — Correlation ID in all admin log lines
- [ ] **CC-OBS-03** — `logger.info` for creates/updates/deletes, `logger.warn` for concurrent modification, `logger.error` for Stripe failures
- [ ] **CC-OBS-04** — 500 catch-all
- [ ] **CC-OBS-05** — Correct status codes for all admin errors
- [ ] **CC-SEO-02** — Admin pages have `noindex`
- [ ] **CC-TEST-01** — Tests for non-admin → 403, invalid transitions, duplicate codes, negative stock
- [ ] **CC-TEST-02** — Edge cases: concurrent admin edits, refund idempotency, empty metrics
- [ ] **CC-TEST-03** — Idempotency: same refund request twice → one refund (Stripe idempotency key)
- [ ] **CC-DB-01** — Backward-compatible migrations only (additive changes)
- [ ] **CC-DB-02** — Seed data includes admin user
- [ ] **CC-DB-03** — Product/variant archive uses soft-delete (`isArchived=true`). InventoryLog is append-only.
- [ ] **CC-OBS-06** — DB pool exhaustion → 503 `SERVICE_UNAVAILABLE`
- [ ] **CC-FLAG-02** — Admin sections feature-gated per-section via `isEnabled('admin-{section}')`. Missing flag defaults to enabled (safe default).

### Story-specific checks (ADM-SEC-*)

- [ ] **ADM-SEC-01 — Refund idempotency**: `stripe.refunds.create({ paymentIntent, idempotencyKey })`. Refund ID stored in order. Duplicate request → no double-charge.
- [ ] **ADM-SEC-02 — Order status transitions**: PENDING→CONFIRMED→PROCESSING→SHIPPED→DELIVERED. Any→REFUNDED (if paid). Any→CANCELLED (if not paid). Invalid → 409.
- [ ] **ADM-SEC-03 — Inventory audit trail**: Every adjustment records `{ variantId, oldStock, newStock, change, reason, adminId }`. Negative `newStock` → 409.
- [ ] **ADM-SEC-04 — Multi-admin conflict warning**: Check variant `updatedAt`; if modified since page load, include warning in response. Last-write-wins with audit trail.

### Feature-level checks (T099–T103)

- [ ] **Products (T099)**: GET paginated, POST create + variants, PATCH, DELETE (set `isArchived=true` on product AND variants). Archived variants cannot be added to cart.
- [ ] **Orders (T100)**: GET with filters (status, date range), PATCH `{ status }` with transition validation, POST `/refund`.
- [ ] **Inventory (T101)**: GET variants + stock + last 50 audit entries. POST adjust stock.
- [ ] **Discounts (T102)**: GET list, POST create (validate `value > 0`, `PERCENTAGE` ≤ 100%), PATCH update, DELETE deactivate. Reject duplicate codes.
- [ ] **Metrics (T103)**: `GET /api/admin?section=metrics` — `{ totalRevenue (cents), orderCount, averageOrderValue (cents) }` for date range
- [ ] **CSV export (T103)**: `GET /export?section=orders&format=csv` — CSV with headers
- [ ] **AdminPage component (T097)**: tabbed (Products/Orders/Inventory/Discounts/Metrics), tab state in URL query param. JWT expiry → redirect to login, not white screen.
- [ ] **Admin activity log**: All state-changing admin actions write `AdminLog` entry with `{ adminId, action, resourceType, resourceId, details }` for security auditing (guide)
- [ ] **Handler split**: If `app/api/admin/route.ts` exceeds 300 lines, split into separate route files

**Test count**: T096 integration test (full CRUD + refund + state transitions + non-admin rejection)

---

## US7 — Discount Codes & Promotions (P3)

**Review scope**: Admin discount CRUD (T102) + checkout discount validation (T058–T059)

### Cross-cutting checks

- [ ] **CC-SEC-02** — CSRF on admin discount mutation endpoints (POST/PATCH/DELETE)
- [ ] **CC-SEC-04** — Zod validation on discount code input: format, type enum, value > 0, percentage ≤ 100
- [ ] **CC-SEC-06** — Admin CRUD guarded by admin role check (built in US5+6)
- [ ] **CC-PRICE-02** — Discount never reduces total below 0 (clamped at zero)
- [ ] **CC-PRICE-04** — Percentage: `Math.floor(subtotal × value / 100)` (rounds down, customer-friendly)
- [ ] **CC-PRICE-05** — Discount applied before shipping + tax
- [ ] **CC-OBS-01 to CC-OBS-06** — Structured errors, 400/409/500, correlation ID, logging, DB pool 503
- [ ] **CC-TEST-02** — Edge cases: expired, maxed-out, below-min-order, invalid format, discount > subtotal
- [ ] **CC-TEST-03** — `usedCount` incremented atomically inside checkout transaction (no double-use)
- [ ] **CC-TEST-05** — Test isolation
- [ ] **CC-DB-03** — Discount codes are soft-deactivated (`isActive=false`), not deleted

### Story-specific checks

- [ ] `validateDiscountCode`: checks `isActive`, `expiresAt`, `usedCount < maxUses`, `minOrderAmount ≤ subtotal`
- [ ] Single code per checkout (no stacking)
- [ ] Percentage discount > 100% rejected at creation (T102)
- [ ] Duplicate discount code rejected at creation (T102)
- [ ] Admin: `POST` create, `PATCH` update, `DELETE` deactivate (`isActive=false`) (T102)
- [ ] Code format validation: alphanumeric, 3–20 chars

**Dependencies on prior stories** — Discount code model (T017), admin auth guard (T104), admin tabbed layout (T097), checkout pricing (T058). No re-implementation.

**Test count**: Extends T057 (pricing with discount), T059 (discount validation), T096 (admin CRUD)

---

## US8 — SEO Content & Blog (P3)

**Review scope**: Phase 19 (T106–T110)

### Cross-cutting checks

- [ ] **CC-SEC-04** — Slug validation: lowercase alphanumeric + hyphens only; invalid → 400 or 404
- [ ] **CC-SEC-05** — No raw secrets in sitemap/robots (verify base URL from env, not hardcoded)
- [ ] **CC-SEC-06** — Admin blog CRUD guarded by admin role check
- [ ] **CC-OBS-01 to CC-OBS-06** — Structured errors, 400/404/409/500, correlation ID, logging, DB pool 503
- [ ] **CC-SEO-01** — `generateMetadata` on blog listing (title "Blog" + description) and blog detail (post title + excerpt)
- [ ] **CC-SEO-02** — Blog pages do NOT have `noindex` (they're public/content). Verify no accidentally inherited `noindex`.
- [ ] **CC-SEO-03** — Canonical URL on blog listing and detail
- [ ] **CC-SEO-04** — schema.org `Article` JSON-LD on blog detail: headline, author, datePublished, image, description
- [ ] **CC-DB-02** — Seed data includes sample blog posts
- [ ] **CC-DB-03** — Blog posts are hard-deleted on admin delete (content pages). Archived state handled via `publishedAt` null.
- [ ] **CC-OPS-03** — ISR `revalidate=300` on blog pages
- [ ] **CC-TEST-02** — Edge cases: missing slug, unpublished post, empty listing, invalid slug format
- [ ] **CC-TEST-05** — Test isolation
- [ ] **CC-TEST-06** — `crypto.randomUUID()` for correlation IDs

### Story-specific checks (BLOG-SEO-*)

- [ ] **BLOG-SEO-01 — Sitemap excludes `noindex` pages**: Only products, categories, blog posts. No cart/checkout/auth/account/admin URLs.
- [ ] **BLOG-SEO-02 — Blog slug validation**: lowercase alphanumeric + hyphens. Null bytes / special chars → 400 or 404, not 500.
- [ ] **BLOG-SEO-03 — Canonical URL**: `<link rel="canonical">` on blog listing and detail with absolute URL
- [ ] **BLOG-SEO-04 — Open Graph image on product pages**: `<meta property="og:image">` pointing to first product image (T109 verification)
- [ ] **BLOG-SEO-05 — Twitter Card meta tags**: Product detail and blog pages include `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`. Use `summary_large_image` for products, `summary` for blog posts.

### Feature-level checks (T106–T110)

- [ ] **Blog listing (T106)**: published only (`publishedAt IS NOT NULL`), title/excerpt/date/"Read more"
- [ ] **Blog detail (T107)**: full article, schema.org `Article` JSON-LD, 404 on invalid/missing slug
- [ ] **Sitemap (T108)**: dynamic XML, `<lastmod>`, `<changefreq>`, `<priority>` per entry. `robots.txt` references sitemap.
- [ ] **Metadata verification pass (T109)**: Confirm product detail, category, blog, homepage all have complete title + description + OG tags. Most done in US1 — this is a verification pass.
- [ ] **Admin blog CRUD (T110)**: `section=blog`, GET all (published+drafts), POST create, PATCH update, DELETE remove. Unique slug validation.

### Pre-launch crawl validation (SC-003, T116)

- [ ] All public pages return 200 (Screaming Frog or `wget --spider`)
- [ ] All public pages have unique `<title>`
- [ ] schema.org validates on product + blog pages (Google Rich Results Test)
- [ ] `noindex` pages not in sitemap
- [ ] Auth pages have `noindex`
- [ ] Canonical URLs present on product, category, blog pages
