# User Story Implementation Guide — PineNova E-Commerce

Each user story follows the same `/speckit.implement` pattern:

```
Purpose: implement only the smallest production-ready, shippable path.

/speckit.implement

Implement only the [Nth] user story from tasks.md (recommended: [name], since it unlocks [reason]).

Constraints:
- no unrelated changes
- run relevant tests, including edge cases (list relevant edge cases)
- update task status
- add/confirm logging and error handling for new code paths
- stop after this story
```

---

## Cross-Cutting Requirements (All User Stories)

The following requirements apply to EVERY user story and are NOT repeated in each story's scope. The implementer MUST verify each one before marking a user story done.

### Security (all stories)

| # | Requirement | Verification |
|---|-------------|--------------|
| CC-SEC-01 | **No PII in logs**: Never log email, password, address, phone, card data, or auth tokens in any `logger.info/warn/error` call. Use `{ userId }` or `{ orderId }` instead. | `git grep` across new files for `.log` calls near PII fields |
| CC-SEC-02 | **CSRF protection**: All state-changing endpoints (POST/PATCH/PUT/DELETE) must verify `Origin` or `Referer` header matches the app origin. Use Next.js built-in CSRF or a middleware check. | Test: forged `Origin` returns 403 |
| CC-SEC-03 | **Rate limiting**: Every mutation endpoint must have rate limiting via `lib/rate-limiter.ts` (already exists). At minimum: 30 req/min per IP on cart/checkout, 10 req/min on auth endpoints, 60 req/min on admin. | 31st cart request returns 429 |
| CC-SEC-04 | **Input validation on every param and body**: Zod schemas on all API routes. No raw `req.body` values passed to Prisma without parsing. | Invalid input returns 400 with field errors |
| CC-SEC-05 | **No raw secrets in code, configs, or logs**: Stripe keys, JWT secrets, DB URLs must come from `env.ts` only. | `git grep` for `sk_live_`, `-----BEGIN`, `AKIA` returns zero |
| CC-SEC-06 | **Authorization check on every protected endpoint**: Verify JWT + ownership/admin role before any data access. Return 401 if missing token, 403 if wrong role/ownership. | Unauthenticated request returns 401; wrong user returns 403 |
| CC-SEC-07 | **Token expiry**: Access tokens expire in 15 minutes. Refresh tokens expire in 7 days. Configurable via `ACCESS_TOKEN_TTL` and `REFRESH_TOKEN_TTL` env vars. | Expired access token returns 401; refresh token rotates before expiry |
| CC-SEC-08 | **Stripe API version pinning**: Pin the Stripe SDK API version in `lib/stripe.ts`. Update deliberately on a schedule. Version mismatch causes silent type errors. | `stripe` instance uses explicit `apiVersion` option |
| CC-SEC-09 | **Webhook handler must ack within 5 seconds**: Stripe expects a 200 response within 5 seconds or it retries. No heavy computation in the webhook handler — defer to background processing if needed. | Stripe CLI reports successful delivery; handler returns 200 under 5s |

### Pricing & Currency (checkout-related stories)

| # | Requirement | Verification |
|---|-------------|--------------|
| CC-PRICE-01 | **Amount unit**: All pricing functions MUST operate in cents (integers) internally. Convert from dollars to cents at the API boundary. Stripe requires cents. | `calculatePricing` returns cents; Stripe `amount` is in cents |
| CC-PRICE-02 | **Negative total protection**: A discount must never reduce total below $0.00 (0 cents). Clamp at zero. | Discount > subtotal → total = 0, no negative |
| CC-PRICE-03 | **Price snapshot at checkout**: Use the product price at checkout time, NOT at add-to-cart time. Cart stores `variantId` + `qty` only; price is re-read from DB during `calculatePricing`. | Change product price between add and checkout → checkout uses new price |
| CC-PRICE-04 | **Rounding**: Always round TO the customer (floor for charges, ceil for discounts). Use `Math.floor` for dollar amounts, `Math.round` for tax (standard rounding half-up). Document per-function. | Test: $1.005 → $1.00 (customer-friendly) |
| CC-PRICE-05 | **Discount application order**: (1) subtotal - discount, (2) + shipping, (3) + tax on (subtotal - discount). Discount never applies to shipping or tax. | Test: discount reduces taxable subtotal |
| CC-PRICE-06 | **Reject checkout on deleted/zero-price products**: If a product or variant was deleted (archived) or has price ≤ 0 at checkout time, return 409 with `{ error: { code: "PRODUCT_UNAVAILABLE", details: { variantId } } }`. | Archive a product then attempt checkout → 409 |
| CC-PRICE-07 | **Price > 0 validation at product creation**: Product and variant prices must be > 0. Zero is not a valid price. Accept free products only if a `isFree` boolean flag is explicitly set. | Create product with price 0 → 400 |

### Error Handling & Observability (all stories)

| # | Requirement | Verification |
|---|-------------|--------------|
| CC-OBS-01 | **Structured error responses**: Every API error returns `{ error: { code: string, message: string, details?: object } }`. Never expose stack traces. | Forced error returns structured JSON, no stack |
| CC-OBS-02 | **Correlation ID**: Generate a UUID on every incoming request in middleware and attach it to the `logger` context for that request. Include in all log lines. | Two concurrent requests have different IDs in logs |
| CC-OBS-03 | **Log levels**: `logger.info` for success events (created, updated, deleted, completed), `logger.warn` for recoverable issues (unknown state tax, rate limit approaching), `logger.error` for failures (DB down, Stripe error, unexpected exceptions). | Review log lines in new code |
| CC-OBS-04 | **500 catch-all**: Every handler must have a top-level try/catch that returns 500 and logs the full error object (without exposing it to the client). | Forced DB error returns 500 + log line |
| CC-OBS-05 | **Distinguish 404 vs 400 vs 409**: Not-found = 404, validation failure = 400, conflict/duplicate = 409, out-of-stock = 409, rate-limit = 429. | Each error case returns correct status code |
| CC-OBS-06 | **DB connection pool exhaustion**: If Prisma cannot acquire a connection from the pool, return 503 `{ error: { code: "SERVICE_UNAVAILABLE" } }`. Do not hang or timeout silently. | Artificially exhaust pool → 503 response |

### SEO (all page-creating stories)

| # | Requirement | Verification |
|---|-------------|--------------|
| CC-SEO-01 | **Page-specific `generateMetadata`**: Every route page must export `generateMetadata` with `title` and `description`. Use the layout's `title.template`. | Each page's `<title>` renders correct text |
| CC-SEO-02 | **`noindex` on non-public pages**: Cart, checkout, checkout confirmation, account (all), auth (login/register/reset), and admin pages must have `{ robots: { index: false, follow: false } }` in metadata. | `<meta name="robots" content="noindex,nofollow">` present |
| CC-SEO-03 | **Canonical URLs**: Product detail, category, blog detail, and blog listing pages must include `<link rel="canonical" href="...">`. Use absolute URL with production domain from env. | Canonical tag present on product/category/blog pages |
| CC-SEO-04 | **schema.org structured data**: Product detail → `Product`, breadcrumb → `BreadcrumbList`, blog post → `Article`. Verify via Google Rich Results Test or equivalent. | JSON-LD validates |

### Database Migrations (all stories)

| # | Requirement | Verification |
|---|-------------|--------------|
| CC-DB-01 | **Backward-compatible migrations only**: Never drop or rename columns without a deprecation window. Additive changes only (new tables, new nullable columns, new indexes). | `npx prisma migrate dev` succeeds; rollback tested |
| CC-DB-02 | **Seed data updated with every model change**: If a new model or required field is added, update `prisma/seed.ts` to include it. Run seed before marking story done. | `npx tsx prisma/seed.ts` completes without error |
| CC-DB-03 | **Deleted/archived records use soft-delete**: Set `deletedAt` or `isArchived` timestamp. Never `DELETE FROM` in application code. Only the data-retention cron job may hard-delete. | Archived records still exist in DB with `deletedAt` set |

### Operations (all stories)

| # | Requirement | Verification |
|---|-------------|--------------|
| CC-OPS-01 | **Health check endpoint**: Add `GET /api/health` returning `{ status: 'ok', timestamp, version }` in the first story that creates API routes (US1). Used by load balancers and CI. | `GET /api/health` returns 200 with JSON |
| CC-OPS-02 | **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` documented**: Add to `.env.example` if not present. Required for client-side Stripe Elements in US3b. | Key is present in `.env.example` with comment |
| CC-OPS-03 | **ISR revalidate values**: Product/category/blog listing pages: `revalidate = 60`. Product detail, category detail, blog detail pages: `revalidate = 60`. Homepage: `revalidate = 300`. These are starting points — adjust based on inventory churn. | Pages serve stale content for at most `revalidate` seconds after publish |
| CC-OPS-04 | **Stripe webhook endpoint URL**: Must be configured in Stripe Dashboard to point to `{base_url}/api/stripe/webhook`. For local dev, use Stripe CLI `--forward-to`. Document in `.env.example` as `STRIPE_WEBHOOK_SECRET`. | `stripe trigger payment_intent.succeeded` reaches the handler |

### Feature Flags (checkout + payment stories)

| # | Requirement | Verification |
|---|-------------|--------------|
| CC-FLAG-01 | **Checkout and payment paths must be feature-gated**: Use `lib/feature-flags.ts` `isEnabled('checkout')` and `isEnabled('payment')`. Disabling the flag returns a friendly maintenance page, not a 500. | `FLAG_checkout=false` in env → POST /api/checkout returns 503 with maintenance message |
| CC-FLAG-02 | **Admin pages feature-gated per-section**: Use feature flags for beta admin sections. Missing flag defaults to enabled (safe default per lib design). | Admin section works without env var set |

### Testing (all stories)

| # | Requirement | Verification |
|---|-------------|--------------|
| CC-TEST-01 | **Failure path tests**: Every story must include tests for DB failure, invalid input, and auth failure (where applicable). Mock the failure. | Test file includes at least one failure-path test |
| CC-TEST-02 | **Edge case coverage**: Empty state, null/missing data, boundary values (max length, zero, negative), and at least one concurrency scenario per story. | Edge cases documented in test file |
| CC-TEST-03 | **Idempotency test** (mutation endpoints): Same request sent twice produces same result (second is no-op or returns existing). | Double-submit test passes |
| CC-TEST-04 | **No tautological tests**: Every test must exercise real application logic, not JS built-in operators. Tests that only test `expect(true).toBe(true)` will be rejected in review. | Review test file for trivial tests |
| CC-TEST-05 | **Test isolation**: Each test must clean up after itself. Use `beforeEach` to reset DB state (transaction rollback or truncate affected tables). Never leave data that could cause another test to fail. | Run full test suite twice in a row — both pass identically |
| CC-TEST-06 | **Dependency: `uuid` or `crypto.randomUUID`**: For correlation IDs and idempotency keys. Prefer Node's built-in `crypto.randomUUID()` to avoid an extra dependency. Verify available in the Node version used by the project. | `crypto.randomUUID()` works in test script |

---

## US1 — Browse & Product Detail (P1) ✅ DONE

**Purpose**: implement only the smallest production-ready, shippable path.

`/speckit.implement`

Implement the first user story (product browse + product detail pages) from `tasks.md`, since it unlocks SEO and cart work after.

### Constraints

- no unrelated changes
- run relevant tests, including edge cases (empty state, out-of-stock, invalid input)
- update task status
- add/confirm logging and error handling for new code paths
- stop after first story

### Scope: Phases 5–7 (Tasks T031–T047)

#### Phase 5 — Browse Products API (T031–T034)

| Task | What |
|------|------|
| T031 | Integration test: `GET /api/products?category=bags` returns only bags; sort parameter works |
| T032 | `app/api/products/route.ts`: GET handler with Prisma query; supports category, material, price, sort, pagination |
| T033 | Zod validation on all query params + `.refine()` for `minPrice ≤ maxPrice`; 400 with field errors on invalid input |
| T034 | try/catch wrapper, `logger.error` on failure, 500 response |

#### Phase 6 — Browse Products UI (T035–T040)

| Task | What |
|------|------|
| T035 | `components/ProductCard.tsx`: `next/image`, name, price, stock badge, low-stock warning, out-of-stock state |
| T036 | `components/ProductGrid.tsx`: responsive grid with empty "No products found" state |
| T037 | `components/ProductFilters.tsx`: client component with category, material radios and sort dropdown |
| T038 | `app/(storefront)/products/page.tsx`: server component with Prisma query, `generateMetadata` (title + description) |
| T039 | `app/(storefront)/categories/[slug]/page.tsx`: category page with description and product count, `generateMetadata` |
| T040 | `error.tsx` boundary in `(storefront)` route group; test by simulating a DB failure |

#### Phase 7 — Product Detail API + UI (T041–T047)

| Task | What |
|------|------|
| T041 | Integration test: `GET /api/products/{slug}` returns product with variants and stock |
| T042 | `app/api/products/[slug]/route.ts`: GET handler, 404 if not found |
| T043 | Slug validation (non-empty, alphanumeric + hyphens only) → 400 |
| T044 | Error handling + `logger.error` on DB failures → 500 |
| T045 | `components/VariantSelector.tsx`: size/color pickers, grays out out-of-stock options, emits `onVariantChange(variantId)` |
| T046 | `app/(storefront)/products/[slug]/page.tsx`: full detail with `next/image`, price, materials, stock, schema.org `Product` JSON-LD, `BreadcrumbList` JSON-LD, `generateMetadata`; ISR-ready pattern |
| T047 | `not-found.tsx` for missing slug, `error.tsx` boundary |

### Created files

- `app/layout.tsx` — root layout with header/footer + default metadata
- `app/page.tsx` — homepage with hero, category grid, new arrivals; `generateMetadata` with description
- `app/error.tsx` — global error boundary
- `app/not-found.tsx` — 404 page
- `vitest.config.ts` — test runner config
- `prisma/seed.ts` — 4 categories, 9 products with images
- `tests/integration/products.test.ts` — 20 tests (validation, slug, sort, minPrice/maxPrice cross-validation, price bounds)
- `app/api/products/route.ts` — listing API with Zod `.refine()` + correlation ID in logging
- `app/api/products/[slug]/route.ts` — detail API with slug validation + 404
- `components/ProductCard.tsx` — stock states with `next/image`
- `components/ProductGrid.tsx` — responsive grid with empty state
- `components/ProductFilters.tsx` — client-side filter UI
- `app/(storefront)/products/page.tsx` — server-rendered listing with `generateMetadata`
- `app/(storefront)/products/[slug]/page.tsx` — detail with schema.org `Product` + `BreadcrumbList`, `generateMetadata`
- `app/(storefront)/categories/[slug]/page.tsx` — category page with `generateMetadata`

### Cross-cutting gaps addressed in US1 implementation

| Gap | Status |
|-----|--------|
| Zod `.refine()` for minPrice/maxPrice cross-validation | ✅ Done (`.refine()` added to schema) |
| `generateMetadata` on all pages | ✅ Done (all browsing pages have it) |
| Empty state in ProductGrid | ✅ Done |
| `error.tsx` and `not-found.tsx` in route group | ✅ Done |
| `next/image` instead of `<img>` | ✅ Done |
| `useCallback` removed (unnecessary optimization) | ✅ Done |
| Reviews query simplified (`take: 3`, no `slice`) | ✅ Done |
| Tautological tests removed | ✅ Done (price formatting + stock arithmetic tests removed) |

### Done Conditions

- `npx vitest run` — all 20 tests pass
- `npx tsc --noEmit` — zero type errors in new files (pre-existing errors in `lib/s3.ts`/`lib/stripe.ts` excluded)
- `npm run dev` — manual verify: homepage loads, category links work, product detail renders with stock badges
- Canonical URL on product detail (`<link rel="canonical">` with absolute URL from `NEXT_PUBLIC_URL`)
- schema.org `Product` + `BreadcrumbList` validate via Google Rich Results Test (copy/paste JSON-LD to validator)
- Task status updated in `tasks.md`

---

## US3a — Cart (P1)

**Purpose**: implement only the smallest production-ready, shippable path.

`/speckit.implement`

Implement the cart user story (Cart API + UI, Phases 8–9) from `tasks.md`, since it unlocks checkout after.

### Constraints

- no unrelated changes
- run relevant tests, including edge cases (empty cart, quantity 0 removal, out-of-stock rejection, missing session, double-click add, concurrent tab adds)
- update task status
- add/confirm logging and error handling for new code paths
- stop after cart is done

### Scope: Phases 8–9 (Tasks T048–T056)

#### Security & correctness must-haves

Before writing cart code, confirm these are understood (cross-cutting requirements):

- CC-SEC-02 (CSRF on all mutation endpoints)
- CC-SEC-03 (rate limiting: 30 req/min on cart endpoints)
- CC-SEC-04 (Zod validation on every request body)
- CC-SEC-06 (cart ownership — only the cart owner can read/write their cart)
- CC-PRICE-03 (cart stores only `variantId` + `qty`; price is re-read at checkout)
- CC-OBS-01 through CC-OBS-05 (structured errors, correlation ID, log levels)
- CC-TEST-01 through CC-TEST-04 (failure paths, edge cases, idempotency)
- CC-SEO-02 (`noindex` on cart page)

#### Phase 8 — Cart API (T048–T052)

| Task | What |
|------|------|
| T048 | Integration test: add → update qty → remove → get cart, verify totals. Also test: double-click add (idempotent), concurrent tab adds (merge), quantity upper bound (max 99 per item) |
| T049 | `app/api/cart/route.ts`: `GET` returns cart + items + totals (price re-read from DB at read time); `POST { variantId, quantity }` creates cart (keyed to sessionId or customerId), adds/updates item. Verify cart ownership before returning data. **Merge logic on login**: when a guest with a session cart logs in, merge their session cart items into their customer cart (if one exists). If both have the same variant, sum quantities. Clear session cart after merge. |
| T050 | `PATCH { variantId, quantity }` updates qty (quantity ≤ 0 removes item); `DELETE { variantId }` removes item. Both verify cart ownership |
| T051 | Validate: `variantId` exists via Prisma, `quantity` is positive int 1–99, variant is in stock → 400. Reject out-of-stock variant at add time (not just checkout) per spec | 
| T052 | Wrap in try/catch, log errors with correlation ID. Distinguish: variant not found → 404, out of stock → 409, invalid input → 400, other → 500 |

#### Phase 9 — Cart UI (T053–T056)

| Task | What |
|------|------|
| T053 | `components/CartItem.tsx`: `next/image`, name, variant label, unit price, qty selector (1–99), line total, remove button. Disable selector during API call |
| T054 | `components/CartSummary.tsx`: subtotal, shipping ("Calculated at checkout"), tax ("Calculated at checkout"), total line + "Proceed to Checkout" button (disabled when cart empty) |
| T055 | `app/(storefront)/cart/page.tsx`: client component, fetches cart on mount, renders `CartItem` list + `CartSummary`. Empty state: "Your cart is empty" with link to `/products`. Add `noindex` metadata |
| T056 | `error.tsx` boundary on cart page; toast on API failures with retry option |

### Done Conditions

- `npx vitest run` — all cart tests pass (including idempotency, concurrent add, quantity bounds)
- `npx tsc --noEmit` — zero type errors in new files (pre-existing errors excluded)
- Manual: add product from browse → navigate to /cart → see item → update qty → remove → empty state
- Manual: open two browser tabs → add same item in both → cart shows correct combined quantity
- Double-click "Add to Cart" produces one item, not two (idempotent)
- Unauthenticated request to cart API with wrong sessionId returns 404 (not another user's cart)
- Cart page has `<meta name="robots" content="noindex,nofollow">`
- Task status updated in `tasks.md`

---

## US3b — Checkout (P1)

**Purpose**: implement only the smallest production-ready, shippable path.

`/speckit.implement`

Implement the checkout user story (Phases 10–14) from `tasks.md`, since it completes the revenue-generating path.

### Constraints

- no unrelated changes
- run relevant tests, including edge cases (insufficient stock, expired discount, unknown state tax, zero total checkout, Stripe API down, webhook replay, concurrent last-item purchase)
- update task status
- add/confirm logging and error handling for new code paths
- stop after checkout is done

### Scope: Phases 10–14 (Tasks T057–T078)

**⚠️ T057–T078 all touch payments or inventory — every PR needs a second pair of eyes**

**PCI compliance prerequisite**: Before deploying checkout to production, complete the PCI SAQ A self-assessment (stored in `docs/pci-saq-a.md`). Since card data never touches our servers (Stripe Elements), SAQ A is the shortest form. Document in PR description for the final checkout task. Without a signed-off SAQ A, checkout must remain behind the feature flag.

#### Security & correctness must-haves

Before writing checkout code, confirm these are understood (cross-cutting + story-specific):

- CC-SEC-01 (no PII in logs — addresses, names must NOT appear in log lines)
- CC-SEC-02 (CSRF on POST /api/checkout)
- CC-SEC-03 (rate limiting: 10 req/min per session on checkout)
- CC-SEC-04 (Zod validation on checkout request body)
- CC-SEC-06 (cart ownership — verify cart belongs to requesting user/session)
- CC-PRICE-01 through CC-PRICE-05 (cents, negative total clamp, price snapshot, rounding, discount order)
- CC-OBS-01 through CC-OBS-05 (structured errors, correlation ID throughout, log levels)
- CC-TEST-01 through CC-TEST-04 (failure paths, idempotency, concurrency)

**Additional checkout-specific requirements:**

| # | Requirement | Verification |
|---|-------------|--------------|
| CK-SEC-01 | **Stripe webhook signature verification**: Use `stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)` on every webhook call. Return 400 if invalid. | Stripe CLI `--forward-to` with tampered body returns 400 |
| CK-SEC-02 | **Idempotency key on `stripe.paymentIntents.create`**: Generate a unique key per checkout attempt (`checkout_{cartId}_{timestamp}`). No duplicate PaymentIntents on retry. | Retry request returns same PI ID, not a new one |
| CK-SEC-03 | **Idempotent `handlePaymentSuccess`**: Store processed Stripe event IDs in DB (unique constraint). On duplicate webhook delivery, return 200 without creating a second order. | Stripe CLI sends same event twice → one order created, second call returns 200 |
| CK-SEC-04 | **Transaction scope**: DB transaction wraps: load cart → validate stock → reserve stock → create order → clear cart. Stripe API call is OUTSIDE the DB transaction. On Stripe failure, release reserved stock. | Checkout half-complete tracking: rollback releases stock |
| CK-SEC-05 | **Deadlock handling for `SELECT ... FOR UPDATE`**: Add `maxRetries = 3` with exponential backoff (100ms, 200ms, 400ms) for serialization failures. Log each retry as `warn`. | Load test: 20 concurrent checkouts on last item produce zero deadlock errors |
| CK-SEC-06 | **`clientSecret` never logged**: Stripe `clientSecret` is returned to client only. Never appears in logs, server state, or error messages. | `git grep` for `clientSecret` in log calls |
| CK-SEC-07 | **Partial failure handling**: If order creation succeeds but email fails, log as `error` but do NOT roll back the order (order is valid, email is a side effect). | Test: mock email failure → order still created |
| CK-SEC-08 | **Server-authoritative pricing**: `POST /api/checkout` MUST reject any `amount` or `price` from the client. All pricing is calculated server-side from DB data. | Tampered request with modified price returns 400/409 |

#### Phase 10 — Pricing + Tax + Shipping (T057–T060)

| Task | What |
|------|------|
| T057 | Unit test: `calculatePricing(cartItems, discountCode?)` returns `{ subtotal, discountAmount, shippingCost, taxAmount, total }` all in cents. Test with: no discount, percentage discount, flat discount, free-shipping threshold (≥ $100.00 = 10000¢), subtotal exactly at threshold, discount > subtotal (clamped to 0), unknown state tax (falls back to 0 with `logger.warn`) |
| T058 | `services/checkout.service.ts`: pure function. Sum line totals (`qty × unitPrice`). Apply valid discount (percentage or fixed-amount). Shipping: $5.99 (599¢) flat, free if subtotal ≥ $10,000¢. Tax: rate from state lookup table applied to (subtotal - discount). Rounding: `Math.floor` for total, `Math.round` for tax. All output in cents. |
| T059 | `validateDiscountCode(code, subtotal)`: checks active, not expired, not exceeded max uses, meets min order. Single code only (no stacking). Returns `{ valid, discount: { type, value, amount } }` or `{ valid: false, reason }`. Amount capped at subtotal (never negative). |
| T060 | `lookupTaxRate(stateCode)`: static table `{ CA: 725, NY: 888, TX: 825, ... }` (basis points, not decimals). Returns basis points. `logger.warn` on unknown state, returns 0. Apply: `Math.round((taxableAmount * rateBps) / 10000)`. |

#### Phase 11 — Inventory Lock + Stripe Payment (T061–T066)

| Task | What |
|------|------|
| T061 | Unit test: `reserveStock(variantId, qty)` succeeds with enough stock, rejects with `InsufficientStockError` if insufficient. Test concurrent reservations (mock). |
| T062 | `reserveStock`: `prisma.$transaction` with `SELECT ... FOR UPDATE` on `ProductVariant`, check `stock >= quantity`, decrement, insert `InventoryLog` with reason `'reserve'`. Retry on serialization failure up to 3 times with backoff. |
| T063 | `releaseStock(variantId, qty)`: increment stock, insert `InventoryLog` with reason `'release'`. Called on payment failure or checkout timeout. No transaction needed (simple reconcile operation). |
| T064 | Integration test (Stripe test mode): add item → create PI → confirm PI → verify order in DB → verify inventory decremented → verify email sent (mock email). |
| T065 | `createPayment(amount, currency, customerId, idempotencyKey)`: calls `stripe.paymentIntents.create({ amount (cents), currency: 'usd', ... })` with idempotency key. Returns `{ paymentIntentId, clientSecret }`. |
| T066 | **Order ID format**: Use a human-readable format like `ORD-{YYMMDD}-{XXXX}` (e.g., `ORD-260712-00A3`) where XXXX is a random alphanumeric. Easier for customer support than UUIDs. The `id` column in the `Order` model remains an auto-increment integer/UUID for internal joins; this is the display ID. Store in an `orderNumber` field. |
| T066 | `handlePaymentSuccess(paymentIntentId)`: query Stripe for PI status (confirm `succeeded`), create `Order` + `OrderLineItems` in DB transaction, clear cart, send confirmation email. If email fails, log error but keep order. Duplicate call (same PI ID) returns existing order without creating a new one. |

#### Phase 12 — Orchestration + API (T067–T072)

| Task | What |
|------|------|
| T067 | `checkout(cartId, shippingAddress, discountCode?)`: (1) load cart with items, (2) validate stock per item (reserve), (3) calculate pricing (server-authoritative), (4) create Stripe payment (outside DB tx), (5) if Stripe succeeds → commit order in DB tx, (6) if Stripe fails → release stock, throw. |
| T068 | `POST /api/checkout`: accepts `{ shippingAddress, discountCode? }`. Verifies cart ownership (matches session/customer). Returns `{ clientSecret, paymentIntentId }`. Rejects any price/amount from client body. |
| T069 | Validate `shippingAddress` (name, line1, city, state, zip required). Validate discount code format (alphanumeric, 3–20 chars) before calling DB. Return 400 with field-level details. |
| T070 | Error mapping: `InsufficientStockError` → 409 `{ error: { code: "INSUFFICIENT_STOCK", details: { variantId, available } } }`. Stripe errors → 502 `{ error: { code: "PAYMENT_PROVIDER_ERROR" } }`. Other → 500. All with correlation ID. |
| T071 | `POST /api/stripe/webhook` for `payment_intent.succeeded`: verify signature via `stripe.webhooks.constructEvent`. Store event ID in DB (unique constraint). If duplicate → return 200 silently. Call `handlePaymentSuccess`. Log event ID + type. |
| T072 | `POST /api/stripe/webhook` for `payment_intent.payment_failed`: verify signature. Call `releaseStock` for all cart items associated with the PI. Log failure reason. Return 200. |

#### Phase 13 — Checkout UI (T073–T077)

| Task | What |
|------|------|
| T073 | `components/ShippingForm.tsx`: renders name, address line1/line2, city, state (dropdown), zip inputs. Validates all required on blur. Emits `onChange(shippingAddress: ValidatedAddress)`. |
| T074 | `components/PaymentForm.tsx`: Stripe Elements integration (`Elements` + `PaymentElement`). No card data in React state — Stripe handles all card data in its iframe. Emits `onReady(clientSecret)`. Validation errors rendered inline by Stripe. |
| T075 | `app/(storefront)/checkout/page.tsx`: client component, renders `ShippingForm` + `PaymentForm` + `CartSummary`. On submit: calls `POST /api/checkout` → `stripe.confirmPayment({ clientSecret })` → on success redirect to `/checkout/confirmation?orderId=x`. Add loading/processing state on submit (disable all buttons, show spinner). Prevent double-submit. Add `noindex` metadata. |
| T076 | `app/(storefront)/checkout/confirmation/page.tsx`: fetches order details by `orderId`, renders "Thank you" + order summary + guest order lookup link. Add `noindex` metadata. |
| T077 | Error states: payment declined, insufficient stock, Stripe unavailable — friendly message with retry option. No technical details in UI. |

#### Phase 14 — Load Test (T078)

| Task | What |
|------|------|
| T078 | k6/Artillery script: 20 concurrent users adding the same last-in-stock variant then checking out. Verify only 1 succeeds, inventory is 0, no negative stock entries. Run against staging with real Stripe test mode. |

### Done Conditions

- `npx vitest run` — all pricing, inventory, checkout tests pass (including idempotency, deadlock retry, partial failure)
- `npx tsc --noEmit` — zero type errors in new files
- Stripe webhook flow tested via Stripe CLI: `stripe trigger payment_intent.succeeded` → order created in DB; replay same event → no duplicate order
- Stripe CLI: tampered webhook body returns 400 (signature verification)
- Full guest checkout flow works end-to-end in dev against Stripe test mode
- Load test: zero negative stock entries, zero deadlock errors
- Checkout/confirmation pages have `noindex`
- Address PII never appears in logs (`git grep` on checkout code for `logger.info/warn/error` + address fields)
- All `⚠️ REVIEW REQUIRED` tasks have PR review sign-off before merge
- Task status updated in `tasks.md`

---

## US4 — Account Creation & Order History (P2)

**Purpose**: implement only the smallest production-ready, shippable path.

`/speckit.implement`

Implement the account user story (Phases 15–17) from `tasks.md`, since it drives retention and repeat purchases.

### Constraints

- no unrelated changes
- run relevant tests, including edge cases (duplicate email, weak password, expired reset token, reused refresh token, unauthorized data access, concurrent sessions, rate-limit on login)
- update task status
- add/confirm logging and error handling for new code paths
- stop after accounts are done

### Scope: Phases 15–17 (Tasks T079–T095)

#### Security & correctness must-haves

- CC-SEC-01 (no PII in logs: email should be truncated or hashed if logged; passwords NEVER logged)
- CC-SEC-02 (CSRF on auth POST endpoints)
- CC-SEC-03 (rate limiting: 10 req/min on login, 5 req/min on register, 3 req/min on password reset)
- CC-SEC-04 (Zod validation on all auth input)
- CC-SEC-06 (JWT auth on account endpoints; ownership check for order history and data export)
- CC-OBS-01 through CC-OBS-05 (structured errors, correlation ID, log levels, 500 catch-all, error distinction)
- CC-TEST-01 through CC-TEST-04 (failure paths, edge cases)
- CC-SEO-02 (`noindex` on all auth pages, account pages)

#### Phase 15 — Auth API (T079–T085)

| Task | What |
|------|------|
| T079 | Unit test: register → login returns tokens → access protected route with token → refresh token → old refresh invalidated → password reset flow. Test: duplicate email, weak password, expired reset token, reused refresh token (rotation detection) |
| T080 | `POST /api/auth/register`: accepts `{ email, password, name }`. Validate email format + domain. Validate password ≥ 8 chars, mixed case + digit. Hash via `hashPassword` from `lib/auth.ts` (must use bcrypt cost ≥ 12 or argon2id — verify in lib). Create `Customer`. Return 201 with `{ customer }` (no tokens — login separately). Duplicate email → 409. |
| T081 | `POST /api/auth/login`: accepts `{ email, password }`. Verify via `verifyPassword`. Return `{ accessToken, refreshToken, customer }`. Wrong password → 401. Rate-limited at 10 req/min per email (applied in middleware). After 10 consecutive failed attempts on the same email, temporarily lock the account for 15 minutes (separate from rate limiting — prevents brute force at the account level). Log success and failure (without password). |
| T082 | `POST /api/auth/refresh`: accepts `{ refreshToken }`. Call `rotateRefreshToken` from `lib/auth.ts`. Return `{ accessToken, refreshToken }`. Reused (already rotated) token → 401 (token theft detected). |
| T083 | `POST /api/auth/reset-password`: Two-step: (1) `{ email }` → generate reset token with 15-min expiry, send email via `lib/email.ts`. (2) `{ token, newPassword }` → verify token not expired, update hash. Log both steps. Return generic "If the email exists, a reset link has been sent" to avoid email enumeration. |
| T084 | Validate email format with Zod `z.string().email()`. Password ≥ 8 chars, at least one uppercase, one lowercase, one digit. Return 400 with field-level error messages. |
| T085 | Wrap all handlers in try/catch, log auth events with correlation ID. Log levels: `info` for success, `warn` for failed login, `error` for unexpected failures. DO NOT log passwords, tokens, or reset links. |

#### Phase 16 — Auth UI (T086–T088)

| Task | What |
|------|------|
| T086 | `app/(storefront)/account/auth/login/page.tsx`: email + password form. On success store tokens (httpOnly cookie recommended, fallback to localStorage documented). Redirect to `/account`. Show inline error on failure. `noindex` metadata. |
| T087 | `app/(storefront)/account/auth/register/page.tsx`: name + email + password + confirm-password. Client-side validation before submit. On success redirect to login with "Account created" flash message. `noindex` metadata. |
| T088 | `app/(storefront)/account/reset-password/page.tsx`: Step 1: email input → show "Check your email" (always, to prevent enumeration). Step 2: token + new password form → "Password updated" + link to login. `noindex` metadata. |

#### Phase 17 — Order History + GDPR (T089–T095)

| Task | What |
|------|------|
| T089 | Integration test: authed user fetches orders → gets their orders only. Exports data → JSON has correct shape. Requests deletion → login blocked, orders preserved. Unauthenticated → 401. Wrong user → 403. |
| T090 | `GET /api/account/orders`: paginated (20 per page). Returns orders for authenticated `customerId` with line items. 401 if no valid JWT. 403 if `customerId` in token doesn't match requested user. |
| T091 | `GET /api/account/data`: returns ALL PII for authenticated customer (name, email, addresses, order history) as JSON. 401/403 enforced. Log as `info` with event `account.data.exported`. |
| T092 | `DELETE /api/account/data`: soft-deletes customer (sets `deletedAt`, clears `name`, replaces `email` with hash). Preserves order records (legal requirement — 7-year hold). 30-day admin restore window: account can be restored within 30 days via admin panel. After 30 days, data-retention cron permanently anonymizes. Requires confirmation token in body. Log as `info`. |
| T093 | Validate JWT on every request to account endpoints via middleware or per-route check. 401 if missing/invalid. 403 if accessing another user's data. |
| T094 | Error handling + logging on all account endpoints. `logger.info` for data export and deletion. `logger.warn` for failed auth attempts. `logger.error` for DB failures. |
| T095 | `app/(storefront)/account/page.tsx`: "Welcome, {name}" — order history table (order #, date, status, total, link to detail). "Download my data" button → calls GET /api/account/data → triggers JSON download. "Delete my account" button → confirmation dialog → calls DELETE /api/account/data → redirect to logout. `noindex` metadata. |

### Done Conditions

- `npx vitest run` — all auth + account tests pass (including token reuse, rate limit, expired reset, wrong user access)
- `npx tsc --noEmit` — zero type errors in new files
- Manual flow: register → login → view orders → download data (valid JSON) → delete account → verify login blocked
- `POST /api/auth/register` with duplicate email returns 409
- 11th login attempt in 1 minute returns 429
- Reused refresh token returns 401
- Expired password reset token returns 400
- All auth pages have `noindex` metadata
- Password never appears in logs (`git grep` for `password` in log calls — should only be in hash/verify functions)
- All `⚠️ REVIEW REQUIRED` tasks have PR review sign-off
- Task status updated in `tasks.md`

---

## US5+US6 — Admin Dashboard (P2)

**Purpose**: implement only the smallest production-ready, shippable path.

`/speckit.implement`

Implement the admin user stories (Phase 18) from `tasks.md`, since admins need product and order management for ongoing operations.

### Constraints

- no unrelated changes
- run relevant tests, including edge cases (non-admin → 403, invalid status transitions, duplicate discount codes, negative inventory, concurrent admin updates, refund idempotency)
- update task status
- add/confirm logging and error handling for new code paths
- stop after admin is done

### Scope: Phase 18 (Tasks T096–T105)

#### Security & correctness must-haves

- CC-SEC-01 (no PII in logs: admin actions logged with `adminId`, not admin name/email)
- CC-SEC-02 (CSRF on all admin mutation endpoints)
- CC-SEC-03 (rate limiting: 60 req/min on admin endpoints)
- CC-SEC-04 (Zod validation on all admin request bodies)
- CC-SEC-06 (admin role check from JWT on every request; verify `role === 'admin'`)
- CC-OBS-01 through CC-OBS-05 (structured errors, correlation ID, log levels)
- CC-TEST-01 through CC-TEST-04 (failure paths, idempotency)
- CC-SEO-02 (`noindex` on admin pages)

**Additional admin-specific requirements:**

| # | Requirement | Verification |
|---|-------------|--------------|
| ADM-SEC-01 | **Refund idempotency**: Stripe refund via `stripe.refunds.create({ paymentIntent, idempotencyKey })`. Store refund ID in order. Duplicate refund request returns existing refund, does not charge again. | Double-click refund produces one refund transaction |
| ADM-SEC-02 | **Order status transition validation**: Valid transitions only: PENDING→CONFIRMED, CONFIRMED→PROCESSING, PROCESSING→SHIPPED, SHIPPED→DELIVERED, any→REFUNDED (if paid), any→CANCELLED (if not paid). Invalid transition → 409. | DELIVERED→SHIPPED returns 409 |
| ADM-SEC-03 | **Inventory audit trail**: Every stock adjustment records `{ variantId, oldStock, newStock, change, reason, adminId }`. Negative `newStock` rejected → 409. | Setting stock to -1 returns 409; audit entry created for valid changes |
| ADM-SEC-04 | **Multi-admin conflict warning**: If stock was modified by another admin since the page loaded (check `updatedAt`), include warning in response. Last-write-wins with audit trail. | Two admins edit same variant: second gets warning |

#### Prerequisite: Admin user seeding

Before any admin functionality works, a first admin user must exist. Add a seed script or a `POST /api/admin/setup` endpoint (disabled in production via feature flag) to create the initial admin. Document this in `prisma/seed.ts`.

#### Phase 18 — Admin Dashboard (T096–T105)

| Task | What |
|------|------|
| T096 | Integration test: admin creates → edits → archives product; lists → updates order status → issues refund. Test: non-admin → 403, invalid status transition → 409, refund idempotency, negative inventory → 409 |
| T097 | `components/AdminPage.tsx`: tabbed layout (Products, Orders, Inventory, Discounts, Metrics). Tab state in URL query param. Use `useCallback` only if profiling shows a need (not by default). |
| T098 | `app/admin/page.tsx`: renders `AdminPage`. Wrapped in admin auth guard from T028. `noindex` metadata. If JWT expires on the admin page, handle 401 gracefully by redirecting to login (not a white-screen error). |
| T099 | `GET /api/admin?section=products`: paginated (25 per page) product list with variants, images, category. `POST` creates product + variants. `PATCH` updates. `DELETE` sets `isArchived=true` (soft-delete) on product AND all its variants (archived variants cannot be added to cart). All validate admin role via JWT. |
| T100 | `GET /api/admin?section=orders`: paginated orders with filters (status, date range). `PATCH { status }` with transition validation. `POST /refund { orderId }` via Stripe with idempotency key. |
| T101 | `GET /api/admin?section=inventory`: variants + stock level + audit log (last 50 entries). `POST { variantId, newStock, reason }` adjusts stock. Reject negative `newStock`. Detect concurrent modification (check `updatedAt`). |
| T102 | `GET /api/admin?section=discounts`: list all codes. `POST { code, type, value, maxUses?, expiresAt? }`: create. `PATCH { id, ... }`: update. `DELETE { id }`: deactivate (set `isActive=false`). Reject duplicate codes. |
| T103 | `GET /api/admin?section=metrics`: returns `{ totalRevenue (cents), orderCount, averageOrderValue (cents) }` for date range. `GET /export?section=orders&format=csv`: returns CSV with headers (order #, date, customer, status, total, items). |
| T104 | Validate admin role from JWT on every admin endpoint. Decode JWT, check `role` claim. 403 if non-admin. Applied as middleware or per-handler check. |
| T105 | Error handling + logging on all admin operations. `logger.info` for creates/updates/deletes. `logger.warn` for concurrent modification warning. `logger.error` for Stripe failures on refund. Include correlation ID. |
| — | **Handler split guidance**: If `app/api/admin/route.ts` exceeds 300 lines, split into separate route files (`/api/admin/products`, `/api/admin/orders`, etc.) rather than using a single `?section=` router. |
| — | **Admin activity log**: All state-changing admin actions (product create/update/delete, refund, inventory adjust, discount create/update) must also write an `AdminLog` entry with `{ adminId, action, resourceType, resourceId, details }`. Not covered by `InventoryLog` alone — this is for security auditing. |

### Done Conditions

- `npx vitest run` — all admin tests pass (including idempotency, state transitions, negative stock)
- `npx tsc --noEmit` — zero type errors in new files
- Manual: admin login → create product → verify on storefront → archive → gone from storefront
- Manual: place order as customer → admin updates status (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED) → customer sees new status
- Refund creates Stripe refund + updates order; second refund request does not charge again
- Invalid status transition (e.g., DELIVERED → SHIPPED) returns 409
- Inventory adjustment creates audit log; negative stock rejected with 409
- Non-admin gets 403 on every admin endpoint
- Admin pages have `noindex` metadata
- All `⚠️ REVIEW REQUIRED` tasks have PR review sign-off
- Task status updated in `tasks.md`

---

## US7 — Discount Codes & Promotions (P3)

**Purpose**: implement only the smallest production-ready, shippable path.

`/speckit.implement`

Implement the discount codes user story from `tasks.md` (covered in Phase 10), since promotions drive sales post-launch.

### Constraints

- no unrelated changes
- run relevant tests, including edge cases (expired code, maxed-out code, below-min-order code, invalid code format, discount > subtotal — clamped to 0)
- update task status
- add/confirm logging and error handling for new code paths
- stop after discounts are done

### Scope: Tasks within Phase 10 + Phase 18

This user story spans discount code management (admin CRUD in Phase 18, T102) and discount validation at checkout (Phase 10, T058–T059).

#### Discount Validation (checkout-side)

| Ref | What |
|-----|------|
| T059 | `validateDiscountCode(code, subtotal)`: checks `isActive`, `expiresAt` not past, `usedCount < maxUses`, `minOrderAmount` ≤ subtotal. No stacking (single code per checkout). Returns `{ valid: true, discount: { type: 'PERCENTAGE'|'FIXED_AMOUNT', value, amount } }` or `{ valid: false, reason }`. Amount capped at subtotal (never negative). |
| T058 | `calculatePricing` applies discount to subtotal before shipping/tax. Percentage: `amount = Math.floor(subtotal * percentage / 100)`. Fixed-amount: `amount = Math.min(fixedValue, subtotal)`. |

#### Discount Management (admin-side)

| Ref | What |
|-----|------|
| T102 | `section=discounts` in admin API. `GET`: list all codes with use count. `POST { code, type, value, maxUses?, expiresAt?, minOrderAmount? }`: create. `PATCH { id, ... }`: update. `DELETE { id }`: deactivate (`isActive=false`). Reject duplicate `code`. Validate `value > 0`. For `PERCENTAGE`, validate `value ≤ 100`. |

#### What already exists

- `DiscountCode` Prisma model (T017) — already in schema
- Admin auth guard (T028 / T104) — already built
- Admin tabbed layout (T097) — already built
- Checkout pricing function (T058) — built in US3b

### Done Conditions

- `npx vitest run` — discount validation tests pass (expired, maxed, below-min, valid, > subtotal clamp)
- Admin CRUD: create code → apply at checkout → verify discount applied → exceed max uses → verify rejection
- Expired code at checkout returns friendly error message (not technical)
- Discount > subtotal → total = 0 (not negative)
- Percentage discount over 100% rejected at creation time
- Duplicate code creation rejected
- All `⚠️ REVIEW REQUIRED` tasks have PR review sign-off
- Task status updated in `tasks.md`

---

## US8 — SEO Content & Blog (P3)

**Purpose**: implement only the smallest production-ready, shippable path.

`/speckit.implement`

Implement the SEO + blog user story (Phase 19) from `tasks.md`, since content marketing drives organic traffic.

### Constraints

- no unrelated changes
- run relevant tests, including edge cases (missing blog slug, unpublished post, empty blog listing, sitemap excludes noindex pages, XML validity)
- update task status
- add/confirm logging and error handling for new code paths
- stop after SEO + blog are done

### Scope: Phase 19 (Tasks T106–T110)

#### Additional requirements

| # | Requirement | Verification |
|---|-------------|--------------|
| BLOG-SEO-01 | **Sitemap must exclude `noindex` pages**: Only products, categories, and blog posts appear in sitemap. Cart, checkout, auth, account, admin pages excluded. | Sitemap XML has no auth/cart/checkout/admin URLs |
| BLOG-SEO-02 | **Blog slug validation**: Same pattern as product slug — lowercase alphanumeric + hyphens only. 404 if invalid format. | `/blog/null%00byte` returns 400 or 404, not 500 |
| BLOG-SEO-03 | **Canonical URL on blog**: Blog listing and detail pages must have `<link rel="canonical">` with absolute URL. | Canonical tag present on blog pages |
| BLOG-SEO-04 | **Open Graph image on product pages**: Product detail must include `<meta property="og:image" content="...">` pointing to the first product image. Required for social sharing previews. | Product page `<head>` has `og:image` matching first product image |
| BLOG-SEO-05 | **Twitter Card meta tags**: Product detail and blog pages must include `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` meta tags. Use `summary_large_image` card type for products, `summary` for blog posts. | `<meta name="twitter:card" content="summary_large_image">` present on product page |

#### Phase 19 — Blog + SEO (T106–T110)

| Task | What |
|------|------|
| T106 | `app/(storefront)/blog/page.tsx`: server component, ISR `revalidate=300`. Fetches published posts (where `publishedAt IS NOT NULL`). Renders list with title, excerpt, publish date, "Read more" link. `generateMetadata` with title "Blog" + description. Canonical URL. |
| T107 | `app/(storefront)/blog/[slug]/page.tsx`: server component, ISR `revalidate=300`. Fetches single post by slug. Validates slug format (lowercase alphanumeric + hyphens). 404 if not found or unpublished. Renders full article with schema.org `Article` JSON-LD (headline, author, datePublished, image, description). `generateMetadata` with post title + excerpt. Canonical URL. |
| T108 | `app/sitemap.ts/route.ts`: dynamic XML sitemap with all products (from `published: true`), categories, blog posts (published). Each entry has `<lastmod>`, `<changefreq>`, `<priority>`. Exclude cart, checkout, auth, account, admin URLs. `robots.txt` at `app/robots.txt` references `Sitemap: https://{domain}/sitemap.xml`. |
| T109 | Add missing `generateMetadata` to any page not yet covered: verify product detail, category, blog, and homepage all have complete title + description + OG tags. This task is a verification pass, not new code (most are done in US1). |
| T110 | Admin CRUD for blog posts: `section=blog` in admin API. `GET` lists all posts (published + drafts). `POST { title, slug, body, excerpt, seoTitle, seoDescription, publishedAt? }` creates. `PATCH` updates. `DELETE` archives. Validate unique slug. |

#### Already done (from US1)

- `generateMetadata` on product detail, products listing, category, homepage pages
- schema.org `Product` + `BreadcrumbList` JSON-LD on product detail page
- Root layout with default OG title + description + template

### Done Conditions

- `npx vitest run` — all tests pass
- `npx tsc --noEmit` — zero type errors in new files
- Blog listing page loads with published posts from seed data
- Blog post page renders with schema.org `Article` JSON-LD
- `GET /sitemap.xml` returns valid XML; no cart/checkout/auth/admin URLs present
- `GET /robots.txt` includes `Sitemap:` reference
- Invalid blog slug (`/blog/null%00`) returns 400, not 500
- Admin can create, publish, edit, and delete blog posts
- Pre-launch crawl (Screaming Frog or equivalent): all public pages return 200, have unique titles, valid schema.org; all auth pages have `noindex`
- Task status updated in `tasks.md`
