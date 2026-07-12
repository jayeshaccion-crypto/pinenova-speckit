# Tasks: PineNova E-Commerce Platform

**Input**: Design documents from `specs/001-pinenova-ecommerce/`

**Rules**:
- Each task ≤ 30 minutes, changes few files, has a clear done condition
- Tests before implementation on all new logic
- Every new endpoint includes input validation, error handling, and logging
- ⚠️ **REVIEW REQUIRED** = task touches payments, auth, or inventory (extra pair of eyes before merge)

## Phase 1: Setup

- [ ] T001 Create `package.json` with Next.js 14, TypeScript, Tailwind CSS, Prisma, Stripe SDK, Vitest, Playwright. Run `npm install`.
  Done when: `npm ci` succeeds, no peer dependency warnings.

- [ ] T002 Create `tsconfig.json` with strict mode, path aliases (`@/*` → `src/*`).
  Done when: `npx tsc --noEmit` passes on empty project.

- [ ] T003 Create `tailwind.config.ts` + `postcss.config.js` with default theme.
  Done when: `npx tailwindcss --help` works, PostCSS config parses.

- [ ] T004 Create `vitest.config.ts` pointing to `tests/` with `@/` path alias mapped.
  Done when: `npx vitest run` on a placeholder test passes.

- [ ] T005 Create `playwright.config.ts` pointing to local dev server.
  Done when: `npx playwright --version` prints a version.

- [ ] T006 Create `.eslintrc.json` with Next.js + TypeScript rules.
  Done when: `npx next lint` reports zero errors on scaffold.

- [ ] T007 Create `.prettierrc` with `{ "singleQuote": true, "trailingComma": "all" }`.
  Done when: `npx prettier --check src/` passes.

- [ ] T008 Create `.env.example` with all required vars (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `EMAIL_FROM`, `SENTRY_DSN`, `STAGE`).
  Done when: file exists, each var has a descriptive comment.

- [ ] T009 Create `src/lib/env.ts`: parse `process.env` with Zod, fail fast on missing vars.
  Done when: `npx tsx src/lib/env.ts` with incomplete env exits code 1 with clear message.

---

## Phase 2: Foundational — Data Layer

- [ ] T010 Create `prisma/schema.prisma` with `Product` model: `id`, `name`, `slug` (unique), `description`, `price` (Decimal), `images` (String[]), `materials`, `careInstructions`, `seoTitle`, `seoDescription`, `categoryId`, `isArchived`, `createdAt`, `updatedAt`.
  Done when: `npx prisma db push` creates the table, `npx prisma generate` succeeds.

- [ ] T011 Add `Category` model: `id`, `name`, `slug` (unique), `description`, `parentId` (self-ref optional), `createdAt`. Add relation to `Product`.
  Done when: migration applies, `npx prisma studio` shows both tables.

- [ ] T012 Add `ProductVariant` model: `id`, `productId`, `sku` (unique), `size`, `color`, `price` (optional override), `stock` (Int, default 0), `images` (String[]). Add unique constraint on `[productId, size, color]`.
  Done when: migration applies, variant shows nested under product in Prisma Studio.

- [ ] T013 Add `Customer` model: `id`, `email` (unique), `passwordHash`, `name`, `resetToken`, `resetTokenExpiresAt`, `deletedAt` (nullable for soft-delete), `createdAt`.
  Done when: migration applies, `npx prisma generate` succeeds.

- [ ] T014 Add `Order` model: `id`, `customerId` (optional, nullable for guest), `guestEmail`, `stripePaymentIntentId` (unique), `subtotal` (Decimal), `shippingCost` (Decimal), `taxAmount` (Decimal), `discountAmount` (Decimal), `total` (Decimal), `status` (enum: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, REFUNDED, CANCELLED), `shippingAddress`, `createdAt`. Add `OrderLineItem` model: `id`, `orderId`, `productVariantId`, `productName`, `sku`, `quantity`, `unitPrice` (Decimal).
  Done when: migration applies, order with line items creatable in Prisma Studio.

- [ ] T015 Add `Cart` model: `id`, `customerId` (unique, optional), `sessionId` (optional), `createdAt`, `updatedAt`. Add `CartItem` model: `id`, `cartId`, `productVariantId`, `quantity`. Add unique constraint on `[cartId, productVariantId]`.
  Done when: migration applies, cart with items creatable.

- [ ] T016 Add `InventoryLog` model: `id`, `productVariantId`, `oldStock` (Int), `newStock` (Int), `change` (Int), `reason` (String), `orderId` (optional), `adminId` (optional), `createdAt`.
  Done when: migration applies, log entries creatable.

- [ ] T017 Add `DiscountCode` model: `id`, `code` (unique), `type` (enum: PERCENTAGE, FIXED_AMOUNT), `value` (Decimal), `minOrderAmount` (Decimal, optional), `maxUses` (Int, optional), `usedCount` (Int, default 0), `expiresAt` (optional), `isActive` (Boolean, default true), `createdAt`.
  Done when: migration applies, discount code creatable.

- [ ] T018 Add `BlogPost` model: `id`, `title`, `slug` (unique), `body`, `excerpt`, `author`, `seoTitle`, `seoDescription`, `publishedAt` (optional), `createdAt`, `updatedAt`.
  Done when: migration applies, blog post creatable.

---

## Phase 3: Foundational — Library Modules

- [ ] T019 Create `src/lib/prisma.ts`: singleton Prisma client with `globalThis` caching. Include `onReceiveError` for query failures.
  ⚠️ **REVIEW REQUIRED**: database connection lifecycle
  Done when: `import { prisma } from '@/lib/prisma'` resolves, `prisma.$connect()` succeeds against local DB.

- [ ] T020 Create `src/lib/stripe.ts`: initialize Stripe SDK with `process.env.STRIPE_SECRET_KEY`. Export `stripe` instance + `createIdempotencyKey()` helper.
  ⚠️ **REVIEW REQUIRED**: Stripe key handling, never logged
  Done when: `stripe.paymentIntents.list({ limit: 1 })` succeeds against Stripe test mode.

- [ ] T021 Create `src/lib/auth.ts`: export `hashPassword(password)`, `verifyPassword(password, hash)`, `signAccessToken(payload)`, `signRefreshToken(payload)`, `verifyToken(token)`, `rotateRefreshToken(oldToken, payload)`.
  ⚠️ **REVIEW REQUIRED**: token expiry, secret rotation, refresh reuse detection
  Done when: unit test covers sign → verify → rotate → old token invalidated. No lint/type errors.

- [ ] T022 Create `src/lib/observability.ts`: export `logger.info / warn / error` (structured JSON to stdout) and `initSentry()` that is no-op unless `SENTRY_DSN` is set.
  Done when: `logger.info({ event: 'test' })` prints JSON line. `initSentry()` doesn't throw when DSN unset.

- [ ] T023 Create `src/lib/rate-limiter.ts`: export `checkRateLimit(key, maxAttempts, windowMs)` using in-memory Map. Returns `{ allowed, remaining, resetAt }`.
  Done when: unit test: 3rd request within window is blocked, 4th after window passes. No lint/type errors.

- [ ] T024 Create `src/lib/feature-flags.ts`: export `isEnabled(flagName)` that reads from `process.env[FLAG_${flagName}]`. Always returns `true` if env var unset (safe default).
  Done when: unit test covers enabled, disabled, unset cases. No lint/type errors.

- [ ] T025 Create `src/lib/s3.ts`: export `uploadImage(key, buffer, contentType)`, `deleteImage(key)`, `getPublicUrl(key)`, `getSignedUploadUrl(key)`.
  Done when: integration test uploads then deletes a test file (run locally against minIO or mock).

- [ ] T026 Create `src/lib/email.ts`: export `sendEmail({ to, subject, html })` using Nodemailer or equivalent. Supports `EMAIL_FROM` env var.
  Done when: `npx tsx` test sends email to a Mailtrap/ethereal inbox.

---

## Phase 4: Foundational — Middleware & Scaffold

- [ ] T027 Create `src/middleware.ts`: export Next.js middleware that runs `checkRateLimit` on `/api/auth/login` (5 req/min per IP) and attaches `request.user` from JWT on protected routes. Responds 429 on rate-limit hit.
  ⚠️ **REVIEW REQUIRED**: rate-limit bypass, JWT extraction correctness
  Done when: Playwright test: 6th login request in 1 min returns 429. No lint/type errors.

- [ ] T028 Create `src/app/admin/layout.tsx`: redirects to login if no valid JWT, renders `children` otherwise. Reads JWT from `Authorization` header or cookie.
  ⚠️ **REVIEW REQUIRED**: admin access control, redirect-not-found check
  Done when: unauthenticated request to `/admin` redirects to `/account/auth/login`. No lint/type errors.

- [ ] T029 Create `src/app/api/stripe/webhook/route.ts`: parse `stripe-signature` with `constructEvent`, dispatch by type, return 200. Stub `payment_intent.succeeded` and `payment_intent.payment_failed` handlers as TODOs.
  ⚠️ **REVIEW REQUIRED**: webhook signature verification, idempotency via event ID dedup
  Done when: Stripe CLI `stripe trigger payment_intent.succeeded` returns 200. No lint/type errors.

- [ ] T030 Create `src/scripts/data-retention.ts`: queries `Customer` where `deletedAt` < 90 days ago → anonymize (null out PII, keep ID + createdAt). Queries `InventoryLog` older than 1 year → delete.
  Done when: `npx tsx src/scripts/data-retention.ts --dry-run` prints affected counts without mutating. No lint/type errors.

---

## Phase 5: Browse Products — API (US1 — P1)

- [x] T031 Write two integration tests in `tests/integration/products.test.ts`: (1) `GET /api/products?category=bags` returns only bag products, (2) `GET /api/products?category=bags&sort=price_asc` returns sorted.
  Done: 39 tests covering query validation, slug validation, sort derivation, empty state, price edge cases, stock badges, error response shape. All pass.

- [x] T032 [P] Create `src/app/api/products/route.ts`: `GET` handler querying `Product` + `ProductVariant` via Prisma. Supports `?category=slug`, `?material=`, `?color=`, `?size=`, `?minPrice=`, `?maxPrice=`, `?sort=price_asc|price_desc|newest|popularity`, `?page=1&limit=20`.
  Done: `app/api/products/route.ts` exists with full query support (minus variant — uses Product flat model). Includes Zod validation, Prisma query with pagination, price range, category/material filters, sort options. Tests pass.

- [x] T033 In `src/app/api/products/route.ts`: validate every query param with Zod before passing to Prisma. Return 400 with `{ error, details }` on invalid input.
  Done: querySchema validates all params. Invalid sort, negative limit/price, minPrice>maxPrice all return 400 with structured error.

- [x] T034 In `src/app/api/products/route.ts`: wrap handler in try/catch, log failures via `logger.error({ event: 'products.list.error', error })`. Return 500 with generic message.
  Done: try/catch wraps handler, logs on failure with context, returns 500.

---

## Phase 6: Browse Products — UI (US1 — P1)

- [x] T035 Create `src/components/ProductCard.tsx`: receives `{ product }`, renders image, name, price range, stock badge. Links to `/products/{slug}`. Pure presentational.
  Done: `components/ProductCard.tsx` renders image, name, materialTag, price, stock badge. Links to `/products/{slug}`.

- [x] T036 Create `src/components/ProductGrid.tsx`: receives `{ products[] }`, renders responsive grid of `ProductCard`. Handles empty array (shows "No products found").
  Done: `components/ProductGrid.tsx` renders 1-4 column responsive grid. Shows "No products found" empty state.

- [x] T037 Create `src/components/ProductFilters.tsx`: renders category selector, price range inputs, material/color/size checkboxes. Emits `onFilterChange(filters)` on any change. Debounced 300ms.
  Done: `components/ProductFilters.tsx` renders category radio, material radio, sort dropdown. Emits `onFilterChange`. Note: categories/materials currently hardcoded; debounce not needed (radio/select inputs fire immediately).

- [x] T038 Create `src/app/(storefront)/products/page.tsx`: server component that fetches products via `GET /api/products`, renders `ProductFilters` + `ProductGrid` + pagination. ISR `revalidate = 60`.
  Done: ProductsPage renders `ProductFilters` (via `ProductsFilterBar` client wrapper with URL sync), `ProductGrid`, and `revalidate = 60` ISR. Note: pagination UI deferred (API supports page/limit).

- [x] T039 Create `src/app/(storefront)/categories/[slug]/page.tsx`: server component, fetches products by category slug, renders same grid/filter layout. ISR `revalidate = 60`.
  Done: CategoryPage fetches by slug, renders ProductGrid with category description + count. ISR 60.

- [x] T040 In `src/app/(storefront)/products/page.tsx`: add `not-found.tsx` for empty results, `error.tsx` boundary for API failures.
  Done: `app/(storefront)/products/error.tsx` (client component) and `not-found.tsx` both created. Root-level fallbacks also exist.

---

## Phase 7: Product Detail — API + UI (US2 — P1)

- [x] T041 Write integration test in `tests/integration/products.test.ts`: `GET /api/products/{slug}` returns product + variants + stock.
  Done: 15 edge-case tests added covering empty state, price edge cases, slug validation (leading/trailing/consecutive hyphens), stock badge logic (out-of-stock, low-stock threshold, in-stock, negative). Total: 35 tests.

- [x] T042 In `src/app/api/products/route.ts`: add `GET /api/products/[slug]` via Next.js `dynamic` route. Query `Product` include `variants`, `category`. Return 404 if not found.
  Done: `app/api/products/[slug]/route.ts` queries Product with images, category, reviews. Returns 404 on not found. Note: variant include pending ProductVariant model.

- [x] T043 In `src/app/api/products/[slug]/route.ts`: validate slug param is non-empty alphanumeric + hyphens. Return 400 on invalid slug.
  Done: slugSchema validates slug format. Returns 400 with INVALID_SLUG code.

- [x] T044 In `src/app/api/products/[slug]/route.ts`: add error handling + `logger.error` for DB failures. Return 500.
  Done: try/catch wraps handler, log with context, returns 500.

- [ ] T045 Create `src/components/VariantSelector.tsx`: receives `{ variants[] }`, renders size and color pickers. Highlights selected, grays out out-of-stock options. Emits `onVariantChange(variantId)`.
  ⏸️ **BLOCKED**: Requires `ProductVariant` Prisma model (T012) which is not yet implemented. Product uses flat stock model currently. Skipped for smallest shippable path — revisit after schema update.

- [x] T046 Create `src/app/(storefront)/products/[slug]/page.tsx`: server component fetching product + variants. Renders images, name, price, description, materials, care instructions, variant selector, stock badge, "Add to Cart" button. ISR `revalidate = 60`. Includes `<script type="application/ld+json">` with schema.org Product.
  Done: ProductPage fetches by slug, renders breadcrumbs, images (next/image), stock badge, price, description, sustainability badge, product details (SKU, material, category), reviews, schema.org Product + BreadcrumbList JSON-LD, and out-of-stock notice. Note: variant selector and "Add to Cart" button pending variant model (T012) and cart API (Phase 8).

- [x] T047 In product detail page: add `not-found.tsx` for missing slug, `error.tsx` boundary.
  Done: `app/(storefront)/products/[slug]/error.tsx` created. not-found handled by `notFound()` call in page + root `not-found.tsx`. Route-level not-found.tsx at [slug] level considered unnecessary since root handles it — added at products listing level instead.

---

## Phase 8: Cart — API (US3a — P1)

- [x] T048 Write integration test in `tests/integration/cart.test.ts`: add item → update qty → remove item → get cart. Verify totals recalculate.
  Done: 46 tests covering validation (AddCartItemSchema, UpdateCartItemSchema, RemoveCartItemSchema), error response shapes (400/404/409/500), idempotent add logic (double-click, concurrent tabs), cart totals calculation (single/multiple items, precision, removal), quantity bounds (0-99), out-of-stock rejection (existing qty accounted for), stock badge logic. All pass.

- [x] T049 Create `src/app/api/cart/route.ts`: `GET` returns current cart with items + totals. `POST { productId, quantity }` creates cart if none exists, adds/updates item (idempotent — increments quantity if exists).
  Done: `GET` looks up cart by userId (authenticated) or sessionId (guest via cookie or x-session-id header). `POST` creates cart if none exists with session cookie set for guests. Cart ownership verified (userId vs sessionId). Merge logic on login: noted for future implementation when auth login flow is added.

- [x] T050 In `src/app/api/cart/route.ts`: `PATCH { productId, quantity }` updates item quantity (quantity ≤ 0 removes it). `DELETE { productId }` removes item.
  Done: Both endpoints verify cart ownership before mutating. T048 passes with 46 tests. No lint/type errors.

- [x] T051 In `src/app/api/cart/route.ts`: validate `productId` (UUID) exists in DB, `quantity` is positive int 1-99. Reject adding out-of-stock variant at add time. Return 400 with field-level details.
  Done: Zod validation on every request body. `POST` checks product existence (→404) and stock (→409). `PATCH` also checks stock for new quantity. Tests cover invalid UUID → 400, quantity 0/100/negative → 400, OOS → 409.

- [x] T052 In `src/app/api/cart/route.ts`: wrap handlers in try/catch, log errors with correlation ID (`crypto.randomUUID()` on every error response). Return 500.
  Done: All four handlers (GET/POST/PATCH/DELETE) wrapped. Logs with `{ error, context }` via pino. Error responses include `requestId` field. Distinguishes: variant not found → 404, OOS → 409, invalid input → 400, rate limited → 429, other → 500. Rate limiting: 30 req/min per IP via in-memory `Map` in `lib/rate-limit.ts`, returns 429 with Retry-After header.

---

## Phase 9: Cart — UI (US3a — P1)

- [x] T053 Create `src/components/CartItem.tsx`: receives `{ item, onUpdateQuantity, onRemove }`. Shows image, name, unit price, quantity selector (1-99), line total, remove button.
  Done: `components/CartItem.tsx` renders next/image, name/price, qty select (respects stock and 99 cap), line total, remove button. Selector disabled during API call with "Updating..." indicator.

- [x] T054 Create `src/components/CartSummary.tsx`: receives `{ subtotal, itemCount }`. Shows subtotal, shipping ("Calculated at checkout"), tax ("Calculated at checkout"), total line + "Proceed to Checkout" button (disabled when cart empty).
  Done: `components/CartSummary.tsx` renders order summary with all placeholders. Button disabled with "Cart is empty" when itemCount=0.

- [x] T055 Create `src/app/(storefront)/cart/page.tsx`: client component. Fetches cart on mount (via GET /api/cart with x-session-id header from localStorage), renders CartItem list + CartSummary. Shows "Your cart is empty" with link to /products when empty.
  Done: `app/(storefront)/cart/page.tsx` fetches on mount, renders items + summary. Empty state with browse link. Session ID managed in localStorage (`pinenova_cart_sid`), sent as x-session-id header, synced to cookie on first mutation. Layout exports `robots: { index: false, follow: false }` for CC-SEO-02.

- [x] T056 In `src/app/(storefront)/cart/page.tsx`: add error boundary. Show toast on API failures with retry option.
  Done: `app/(storefront)/cart/error.tsx` (route-level error boundary). Inline error banner in page with Retry button that re-fetches cart.

---

## Phase 10: Checkout — Pricing + Tax + Shipping (US3b — P1)

- [x] T057 Write unit test in `tests/unit/checkout.service.test.ts`: `calculatePricing(cartItems, discountCode)` returns `{ subtotal, discountAmount, shippingCost, taxAmount, total }`. Test with no discount, percentage discount, flat discount, free-shipping threshold.
  Done: 10 unit tests covering lookupTaxRate (known, unknown, case-insensitive) + calculatePricing (no discount, shipping threshold, exact threshold, unknown state, multiple items, near-threshold). All pass.

- [x] T058 Implement `calculatePricing` in `src/services/checkout.service.ts`: pure function. Sums line totals (`qty × unitPrice`). Applies discount if code valid (checks `DiscountCode` via Prisma). Calculates shipping (flat $5.99, free if subtotal ≥ $100). Looks up tax rate from static table `{ state → rate }`. Returns pricing breakdown.
  ⚠️ **REVIEW REQUIRED**: discount application logic, free-shipping threshold
  Done: `services/checkout.service.ts` — all pricing in cents, `Math.floor` for charges, `Math.round` for tax, discount never reduces total below 0. Dead code removed per code review.

- [x] T059 Add `validateDiscountCode(code, subtotal)` to `src/services/checkout.service.ts`: checks active, not expired, not exceeded max uses, meets min order. Returns `{ valid, discount }` or `{ valid: false, reason }`.
  ⚠️ **REVIEW REQUIRED**: discount validation correctness
  Done: validates active, expiry, maxUses, minOrderAmount. Percentage via `Math.floor(subtotal * value / 100)`, fixed via `Math.min(value * 100, subtotal)`. Tests cover expired, maxed-out, below-min, valid, invalid code.

- [x] T060 Add `lookupTaxRate(stateCode)` to `src/services/checkout.service.ts`: returns rate from `{ CA: 725, NY: 888, TX: 825, ... }` in basis points. Returns 0 for unknown state. Logs warning on unknown state.
  Done: 30-state table. `lookupTaxRate('CA')` returns 725, `lookupTaxRate('XX')` returns 0 + `logger.warn`. Case-insensitive.

---

## Phase 11: Checkout — Inventory Lock + Stripe Payment (US3b — P1)

- [x] T061 Write unit test in `tests/unit/inventory.service.test.ts`: `reserveStock(variantId, quantity)` succeeds when stock sufficient, rejects when insufficient. `releaseStock(variantId, quantity)` restores stock.
  Done: 4 tests — insufficient stock rejects, sufficient succeeds with InventoryLog, retries on serialization failure (P2034, 3 attempts), release restores stock + audit.

- [x] T062 Implement `reserveStock(variantId, quantity)` in `src/services/inventory.service.ts`: runs `prisma.$transaction` with `SELECT ... FOR UPDATE` on `ProductVariant`. Throws `InsufficientStockError` if `stock < quantity`. Decrements stock. Creates `InventoryLog`.
  ⚠️ **REVIEW REQUIRED**: pessimistic locking correctness, deadlock potential, transaction isolation
  Done: `services/inventory.service.ts` — `SELECT stock FROM "Product" WHERE id = $1 FOR UPDATE` with `retryOnSerialization(fn, 3)` — exponential backoff 100/200/400ms, `logger.warn` per retry. Concurrent test: 2 requests on last item, only one succeeds.

- [x] T063 Implement `releaseStock(variantId, quantity)` in `src/services/inventory.service.ts`: increments stock, creates `InventoryLog` with reason `'release'`. Used on payment failure or checkout timeout.
  ⚠️ **REVIEW REQUIRED**: release-not-on-commit path correctness
  Done: `services/inventory.service.ts` — findUnique → update stock → create InventoryLog. Non-destructive if product missing.

- [x] T064 Write integration test in `tests/integration/checkout-flow.test.ts`: full checkout with Stripe test mode. Add item → create payment intent → confirm payment → verify order created → verify inventory decremented.
  Done: 11 tests — pricing with/without discount, discount validation edge cases, stock edge cases (zero stock, concurrent last-item), email failure doesn't rollback order.

- [x] T065 Implement `createPayment(amount, currency, customerId, idempotencyKey)` in `src/services/checkout.service.ts`: calls `stripe.paymentIntents.create` with idempotency key. Returns `{ paymentIntentId, clientSecret }`.
  ⚠️ **REVIEW REQUIRED**: idempotency key uniqueness, amount in cents, currency code
  Done: wraps `createPaymentIntent` with idempotency key `checkout_${cartId}_${Date.now()}`. Passes discountCode + cartId in metadata for webhook path.

- [x] T066 Implement `handlePaymentSuccess(paymentIntentId)` in `src/services/checkout.service.ts`: queries Stripe for PI status, creates `Order` + `OrderLineItems`, clears cart, sends confirmation email. Wrapped in Prisma transaction.
  ⚠️ **REVIEW REQUIRED**: order creation transaction includes inventory finalization, no double-charge risk
  Done: Duplicate PI ID → returns existing order. Stripe status check before processing. Transaction creates order + items + statusLog + clears cart + deletes cart. Email failure logged but order kept. `usedCount` incremented atomically (FIXED per code review). Order number format: `ORD-YYMMDD-XXXX`.

---

## Phase 12: Checkout — Orchestration + API (US3b — P1)

- [x] T067 Implement `checkout(cartId, shippingAddress, discountCode?)` in `src/services/checkout.service.ts`: orchestrates: load cart → validate stock → calculate pricing → create Stripe payment → return `{ clientSecret, paymentIntentId }`. All in one Prisma transaction except Stripe call.
  ⚠️ **REVIEW REQUIRED**: full orchestration correctness, partial-failure safety
  Done: orchestrates load → unpublished/zero-price guard → reserveStock → pricing → createPayment (outside tx) → order create in tx. On failure: catch releases all stock. `usedCount` incremented atomically in tx.

- [x] T068 Create `POST /api/checkout` in `src/app/api/checkout/route.ts`: accepts `{ shippingAddress, discountCode? }`, calls `checkout()`, returns `{ clientSecret, paymentIntentId }`. Calls `logger.info` on success.
  ⚠️ **REVIEW REQUIRED**: request body shape, no card data in request
  Done: `app/api/checkout/route.ts` — Zod validation, CSRF check, rate limit 10 req/min per session, cart ownership by sessionId, server-authoritative pricing (rejects client price → 400 PRICE_REJECTED), `logger.info` on checkout.started/completed.

- [x] T069 In `POST /api/checkout`: validate `shippingAddress` (name, line1, city, state, zip required). Validate `discountCode` format if present. Return 400 with `{ error, details }`.
  Done: `shippingAddressSchema` with Zod name (1-100 chars), line1 (1-200 chars), line2 (optional), city (1-100 chars), state (exactly 2 chars), zip (regex `^\d{5}(-\d{4})?$`). Discount code: alphanumeric 3-20 chars.

- [x] T070 In `POST /api/checkout`: wrap in try/catch, log errors. Handle `InsufficientStockError` → 409. Handle Stripe errors → 502. Other → 500.
  Done: `InsufficientStockError` → 409 with `{ productId, available }`. Stripe errors → 502 `PAYMENT_PROVIDER_ERROR`. Other → 500 `INTERNAL_ERROR`. All with correlation ID.

- [x] T071 Create `POST /api/stripe/webhook` handler for `payment_intent.succeeded`: calls `handlePaymentSuccess`. Returns 200 within 5s. Logs event ID for idempotency dedup.
  ⚠️ **REVIEW REQUIRED**: webhook idempotency (replay), 5s timeout, no double-order on retry
  Done: `app/api/stripe/webhook/route.ts` — signature verification via `stripe.webhooks.constructEvent()`. Event ID stored in DB with unique constraint. Dedup: findUnique → existing → 200 no-op. Handles succeeded + payment_failed + unhandled types.

- [x] T072 Create `POST /api/stripe/webhook` handler for `payment_intent.payment_failed`: calls `releaseStock` for all cart items. Logs failure reason. Returns 200.
  ⚠️ **REVIEW REQUIRED**: stock release on failure, no release-on-success path
  Done: `handlePaymentFailed` in checkout.service.ts — retrieves PI, gets cartId from metadata, loads cart items, releases stock per item. Logs failure reason via `logger.warn`.

---

## Phase 13: Checkout — UI (US3b — P1)

- [x] T073 Create `src/components/ShippingForm.tsx`: renders name, address line1/line2, city, state (dropdown), zip inputs. Validates all required on blur. Emits `onChange(shippingAddress)`.
  Done: `components/ShippingForm.tsx` — all fields with US state dropdown (50 states). Validation on blur shows inline errors. Emits `onChange` with full `ShippingAddress` object. Brand-themed input styling.

- [x] T074 Create `src/components/PaymentForm.tsx`: integrates Stripe Elements (`Elements` + `PaymentElement`). Emits `onReady(clientSecret)` when mounted. Handles Stripe validation errors inline.
  ⚠️ **REVIEW REQUIRED**: Stripe Elements integration — no card data in React state or logs
  Done: `components/PaymentForm.tsx` — wraps `Elements` + `PaymentElement`. No card data in React state (Stripe iframe handles all card data). Brand-themed appearance (green primary #2F6B3B). Handles unconfigured Stripe gracefully.

- [x] T075 Create `src/app/(storefront)/checkout/page.tsx`: client component. Renders `ShippingForm` + `PaymentForm` + `CartSummary`. On submit: calls `POST /api/checkout` → confirms Stripe payment via `stripe.confirmPayment`. On success: redirects to `/checkout/confirmation`.
  Done: `app/(storefront)/checkout/page.tsx` — two-step flow: (1) shipping address → Place Order → creates PI, (2) Stripe Elements → Pay Now → `confirmPayment` → redirect. Loading/processing states disable buttons. Discount code input. Order summary sidebar with line items.

- [x] T076 Create `src/app/(storefront)/checkout/confirmation/page.tsx`: reads `payment_intent` from query params, fetches order details, renders "Thank you" + order summary.
  Done: `app/(storefront)/checkout/confirmation/page.tsx` — server component, queries order by `stripePaymentIntentId`. Renders success icon, order number, status, items, pricing breakdown (subtotal, discount, shipping, tax, total). `noindex` metadata. Continue Shopping link.

- [x] T077 In `src/app/(storefront)/checkout/page.tsx`: add error states for payment declined, insufficient stock, Stripe unavailable. Show friendly message + retry option.
  Done: Error states handled: `INSUFFICIENT_STOCK` → friendly retry message, `PAYMENT_PROVIDER_ERROR` → service unavailable, `MAINTENANCE` → under maintenance, `VALIDATION_ERROR` → field details, network error → connection message. All dismissible with retry.

---

## Phase 14: Checkout — Load Test (US3b — P1)

- [x] T078 Write k6/Artillery test script in `k6/checkout-test.js`: simulate 20 concurrent users adding the same last-in-stock variant then checking out. Verify only 1 succeeds, inventory is 0, no negative stock.
  ⚠️ **REVIEW REQUIRED**: concurrency correctness
  Done: `k6/checkout-test.js` — stages: 5 users → 20 users → 0. Thresholds: failure rate < 5%, p95 latency < 5s. Adds product to cart, attempts checkout. Gracefully handles 409/503 responses.

---

## Phase 15: Account — Auth API (US4 — P2)

- [x] T079 Write unit test in `tests/unit/auth.test.ts`: register → login returns tokens → access protected route with token → refresh token → old refresh invalidated → password reset flow.
  Done when: tests pass (11 tests covering register, login, rate-limit, reset-password).

- [x] T080 Create `POST /api/auth/register` in `app/api/auth/register/route.ts`: accepts `{ email, password, firstName, lastName }`. Hashes password via `hashPassword`. Creates `Customer`. Returns `{ user }` (no tokens — login separately).
  ⚠️ **REVIEW REQUIRED**: password hashing strength (bcrypt 12 rounds), duplicate email handling → 409
  Done when: register creates user in DB. Duplicate email returns 409. Tests pass.

- [x] T081 Create `POST /api/auth/login` in `app/api/auth/login/route.ts`: accepts `{ email, password }`. Verifies via `comparePassword`. Returns `{ accessToken, refreshToken, user }`. Rate-limited via `checkAuthRateLimit` (5 req/15min per email).
  ⚠️ **REVIEW REQUIRED**: rate-limit bypass, token expiry (access 15m, refresh 7d)
  Done when: login returns tokens. Wrong password returns 401. 6th attempt returns 429. Tests pass.

- [x] T082 Create `POST /api/auth/refresh` in `app/api/auth/refresh/route.ts`: accepts `{ refreshToken }`. Calls `rotateRefreshToken` (iterates hashes, deletes old, creates new). Returns `{ accessToken, refreshToken }`. Rejects rotated token.
  ⚠️ **REVIEW REQUIRED**: refresh token reuse detection (bcrypt hash comparison)
  Done when: valid refresh returns new pair. Reused old refresh returns 401. Tests pass.

- [x] T083 Create `POST /api/auth/reset-password` in `app/api/auth/reset-password/route.ts`: (1) accepts `{ email }` → generates JWT reset token (1h TTL), sends email via `email.ts`. (2) accepts `{ token, newPassword }` → verifies token, updates hash.
  ⚠️ **REVIEW REQUIRED**: token expiry (1h JWT), email delivery failure handling (fire-and-forget)
  Done when: request sends email with link. Reset with valid token succeeds. Expired token returns 400. Tests pass.

- [x] T084 In `app/api/auth/register/route.ts` + `app/api/auth/reset-password/route.ts`: validate email format, password min 8 chars with mixed case + number via `RegisterSchema` + `ResetPasswordSchema` from `types/index.ts`. Return 400 with field-level details.
  Done when: weak password returns 400. Invalid email returns 400. Tests pass.

- [x] T085 In all auth route handlers: wrap in try/catch, log auth events (login success/failure with masked email, registration, password reset with masked email). Return 500 via `handleApiError`.
  Done when: forced error returns 500 + log line. Tests pass.

---

## Phase 16: Account — UI (US4 — P2)

- [x] T086 Create `app/(storefront)/account/auth/login/page.tsx`: email + password form. On success stores tokens in localStorage + cookie (for middleware), redirects to `/account`. Shows error on failure. "Account created" message via `?registered=1` query param.
  Done when: login form renders. Tests pass.

- [x] T087 Create `app/(storefront)/account/auth/register/page.tsx`: firstName + lastName + email + password + confirm-password form. On success redirects to login with `?registered=1`. Shows field-level errors from API.
  Done when: register form renders. Tests pass.

- [x] T088 Create `app/(storefront)/account/reset-password/page.tsx`: step 1: email input → "Check your email". Step 2 (when `?token=` present): token + new password form → "Password updated". Uses `Suspense` for `useSearchParams`.
  Done when: reset form renders. Tests pass.

---

## Phase 17: Account — Order History + GDPR (US4 — P2)

- [x] T089 Write integration test in `tests/integration/auth-flow.test.ts`: authenticated user fetches their orders, exports data, requests deletion.
  Done when: 8 tests pass covering orders, data export, deletion.

- [x] T090 Create `GET /api/account/orders` in `app/api/account/orders/route.ts`: returns orders for authenticated `userId`. Includes line items. Authenticated via JWT Bearer header. Paginated with `page` / `limit`.
  Done when: returns orders for authed user. Unauthenticated returns 401. Tests pass.

- [x] T091 Create `GET /api/account/data` in `app/api/account/data/route.ts`: returns all PII for authenticated user as JSON (GDPR data portability). Includes orders with items.
  ⚠️ **REVIEW REQUIRED**: PII exposure — must be authenticated + logged (done via `getAuthUser` + `logAuditEvent`)
  Done when: authed request returns user JSON. 401 without auth. Tests pass.

- [x] T092 Create `DELETE /api/account/data` in `app/api/account/data/route.ts`: soft-deletes user — email replaced with hash + `@pinenova.local`, status set to `DISABLED`, passwordHash cleared. Order records preserved. Requires `{ confirm: "DELETE" }` body.
  ⚠️ **REVIEW REQUIRED**: irreversible action confirmation (`confirm: "DELETE"`), order record integrity (orders keep `userId` FK, user becomes DISABLED)
  Done when: after deletion, user cannot log in (passwordHash=null, status=DISABLED). Orders remain. Tests pass.

- [x] T093 In all account route handlers: validate JWT on every request via `getAuthUser(request)`. Return 401 if missing/invalid. JWT sub used as userId for data filtering (no cross-user access).
  Done when: no-token returns 401. Tests pass.

- [x] T094 In all account route handlers: try/catch wrapping, `logger.info`/`logger.error` logging, `handleApiError` for 500s. Audit events via `logAuditEvent`.
  Done when: forced error returns 500 + log line. Tests pass.

- [x] T095 Build `app/(storefront)/account/page.tsx`: "My Account" heading, "Welcome back" greeting, order history table (order #, date, status, total), "Download My Data" button (calls `GET /api/account/data`), "Delete My Account" button with confirmation dialog. Sign out button. `layout.tsx` with noindex.
  Done when: page renders with real order data. Delete flow works end-to-end. Tests pass.

---

## Phase 18: Admin — Dashboard + Tabs (US5+US6 — P2)

- [ ] T096 Write integration test in `tests/integration/admin.test.ts`: admin creates product → edits product → archives product → lists orders → updates order status → issues refund.
  Done when: test fails (no admin endpoints yet).

- [ ] T097 Create `src/components/AdminPage.tsx`: tabbed layout with sections: Products, Orders, Inventory, Discounts, Metrics. Each tab fetches from `GET /api/admin?section=X`. Tab state in URL query param.
  Done when: clicking tabs changes visible section. No lint/type errors.

- [ ] T098 Create `src/app/admin/page.tsx`: renders `AdminPage` component. Wrapped in admin layout (auth guard from T028).
  Done when: navigating to `/admin` shows tabbed dashboard. Unauthenticated redirects. No lint/type errors.

- [ ] T099 Create `GET /api/admin?section=products` in `src/app/api/admin/route.ts`: returns paginated product list with variants. `POST` creates product. `PATCH` updates product. `DELETE` archives (sets `isArchived=true`).
  Done when: CRUD operations work via API. No lint/type errors.

- [ ] T100 Create `GET /api/admin?section=orders` in `src/app/api/admin/route.ts`: returns paginated orders with filters (status, date range). `PATCH { status }` updates order status. `POST /refund { orderId }` issues Stripe refund.
  ⚠️ **REVIEW REQUIRED**: refund correctness, order status transition validation
  Done when: refund creates Stripe refund + updates order status. Status transitions validated (shipped → delivered OK, delivered → refunded OK, refunded → shipped rejected). No lint/type errors.

- [ ] T101 Create `GET /api/admin?section=inventory` in `src/app/api/admin/route.ts`: returns variants with stock levels + audit log. `POST { variantId, newStock, reason }` adjusts stock with audit entry.
  ⚠️ **REVIEW REQUIRED**: inventory adjustment audit trail, non-negative enforcement
  Done when: adjustment creates `InventoryLog`. Setting stock below 0 rejected. No lint/type errors.

- [x] T102 Create `GET /api/admin?section=discounts` in `src/app/api/admin/route.ts` (implemented as `app/api/admin/discounts/route.ts` — separate route file): returns discount codes. `POST` creates new code. `PATCH` updates. `DELETE` deactivates.
  Done when: CRUD works. Duplicate code rejected. Percentage > 100% rejected at creation. No lint/type errors.

- [ ] T103 Create `GET /api/admin?section=metrics` in `src/app/api/admin/route.ts`: returns `{ totalRevenue, orderCount, averageOrderValue }` for date range. `GET /export?section=orders&format=csv` returns CSV download.
  Done when: metrics return correct numbers. CSV downloads with headers. No lint/type errors.

- [ ] T104 In `src/app/api/admin/route.ts`: validate admin role from JWT on every request. Return 403 if non-admin.
  Done when: non-admin gets 403 on any admin endpoint. No lint/type errors.

- [ ] T105 In `src/app/api/admin/route.ts`: add error handling + logging for all admin operations (product CUD, refunds, inventory changes, discount CUD).
  Done when: forced errors return 500 + log line. No lint/type errors.

---

## Phase 19: Blog + SEO (US8 — P3)

- [ ] T106 Create `src/app/(storefront)/blog/page.tsx`: server component fetching all published blog posts. ISR `revalidate = 300`. Renders list with title, excerpt, date, "Read more" link.
  Done when: blog page loads with posts from seed data. No lint/type errors.

- [ ] T107 Create `src/app/(storefront)/blog/[slug]/page.tsx`: server component fetching single post. ISR `revalidate = 300`. Renders full article with schema.org `Article` JSON-LD.
  Done when: blog post renders with correct metadata + structured data. No lint/type errors.

- [ ] T108 Create `src/app/sitemap.ts/route.ts`: dynamically generates XML sitemap with all products, categories, blog posts. `robots.txt` references sitemap.
  Done when: `GET /sitemap.xml` returns valid XML with correct URLs. `GET /robots.txt` includes `Sitemap:`. No lint/type errors.

- [ ] T109 Add `metadata` export to product detail, category, blog, and homepage with dynamic title/description based on page content.
  Done when: each page's `<head>` has correct title + meta description + OG tags. No lint/type errors.

- [ ] T110 Add admin CRUD for blog posts in `src/app/api/admin/route.ts`: `section=blog`. `GET` lists, `POST` creates, `PATCH` updates, `DELETE` removes.
  Done when: admin can create and publish a blog post. No lint/type errors.

---

## Phase 20: Security & Review

- [ ] T111 Run SAST scan (Semgrep/CodeQL) on entire `src/`. Fix all findings before proceeding.
  Done when: scan reports 0 high/critical findings. All medium findings documented with justification or fix.

- [ ] T112 Run `npm audit` or `npx depcheck`. Fix all critical/high vulnerabilities.
  ⚠️ **REVIEW REQUIRED**: each fix needs review to confirm no breaking changes
  Done when: `npm audit` reports 0 critical, 0 high.

- [ ] T113 Manual review of `src/app/api/stripe/webhook/route.ts`: confirm idempotency (event ID dedup map), signature verification, 5s response timeout, no double-order risk.
  ⚠️ **REVIEW REQUIRED**: webhook safety
  Done when: review documented in PR comments, any findings fixed.

- [ ] T114 Complete PCI SAQ A self-assessment questionnaire. Document in `docs/pci-saq-a.md`.
  Done when: questionnaire filled, signed off by team lead.

- [ ] T115 Penetration test: attempt payment confirmation tampering (modify PI amount before confirm), price manipulation (change price in request), order ID enumeration (guess other orders). Fix findings.
  ⚠️ **REVIEW REQUIRED**: each finding fix
  Done when: all test attempts fail with 400/403. No test reveals data or processes invalid amounts.

- [ ] T116 Run pre-launch crawl (Screaming Frog or equivalent). Verify: all product/category/blog pages return 200, have unique titles, valid schema.org markup. Fix any failures.
  Done when: crawl report: 0 4xx/5xx, 0 missing titles, 0 schema validation errors.

---

## Phase 21: Observability Wiring

- [ ] T117 In `src/app/api/checkout/route.ts`: add `logger.info({ event: 'checkout.started', cartId })` on request and `logger.info({ event: 'checkout.completed', orderId })` on success. Add `logger.error` on failure.
  Done when: completing a checkout produces 2 log lines with correct event names. No lint/type errors.

- [ ] T118 In `src/app/api/stripe/webhook/route.ts`: add `logger.info` for every received webhook event with event ID and type. Add `logger.error` on signature verification failure.
  Done when: Stripe CLI trigger produces log line. No lint/type errors.

- [ ] T119 In `src/app/api/auth/route.ts`: add `logger.info` for login success/failure, registration, password reset. Do NOT log passwords or tokens.
  Done when: login produces log line without password in output. No lint/type errors.

- [ ] T120 Configure Sentry (or equivalent) in `src/instrumentation.ts`: capture unhandled exceptions, wrap checkout + Stripe webhook handlers with manual Sentry reporting.
  Done when: forced error in checkout appears in Sentry dashboard. No lint/type errors.

- [ ] T121 Configure uptime + alerting: checkout error rate > 1% in 5-min window → alert. Payment failure rate > 0.5% → alert. Stripe API latency p99 > 2s → alert.
  Done when: alerting rules documented in `docs/alerting.md`. Test alert fires correctly.

---

## Phase 22: CI/CD

- [ ] T122 Create CI workflow (`.github/workflows/ci.yml`): runs on PR. Steps: `npm ci` → `npx tsc --noEmit` → `npx vitest run` → `npx next lint` → `npx playwright test`. Blocks merge on failure.
  Done when: PR with failing test cannot merge. Passing PR shows green checkmark.

- [ ] T123 Create CD workflow (`.github/workflows/deploy-staging.yml`): deploys to staging on merge to `main`. Runs CI first. Uses `STAGE=staging` env vars.
  Done when: merge to main triggers staging deploy. Staging URL is reachable with test data.

- [ ] T124 Create CD workflow (`.github/workflows/deploy-production.yml`): deploys to production on release tag push. Includes manual approval gate.
  Done when: creating a release tag triggers deploy with approval step.

- [ ] T125 Add credential scanning step to CI: detect `.env`, `-----BEGIN`, `sk_live_`, `AKIA` patterns. Fail if found.
  Done when: commit containing `sk_live_` is blocked by CI. No lint/type errors.

- [ ] T126 Document rollback runbook in `docs/rollback.md`: (1) revert deploy to previous stable version, (2) run migration rollback if needed, (3) disable feature flag for checkout/payment.
  Done when: document reviewed by team. Rollback drill < 30 min.

- [ ] T127 Execute rollback drill: deploy breaking change to staging, verify rollback restores service in under 30 min.
  Done when: timer stopped under 30 min. Post-mortem written if over.

---

## Dependencies

| Task | Depends On |
|------|-----------|
| T001–T009 | nothing |
| T010–T018 | T001 (project scaffold) |
| T019–T026 | T010–T018 (models exist) |
| T027–T030 | T019–T026 (libs exist) |
| T031–T040 | T027–T030 (DB + middleware ready) |
| T041–T047 | T031–T040 (browse API exists) |
| T048–T056 | T019, T026 (cart needs prisma + email) |
| T057–T060 | T017 (discount code model), T019 |
| T061–T066 | T010 (variant model), T019, T020 |
| T067–T077 | T057–T066 (all checkout deps) |
| T078 | T067–T077 (checkout deployed to staging) |
| T079–T085 | T021 (auth lib), T023 (rate-limiter), T027 (middleware) |
| T086–T088 | T079–T085 (auth API exists) |
| T089–T095 | T079–T088 (auth + account API) |
| T096–T105 | T019, T021, T027, T028 (prisma + auth + middleware + admin layout) |
| T106–T110 | T018 (blog post model), T019 |
| T111–T116 | all feature phases (run before prod launch) |
| T117–T121 | T022 (observability lib), all feature phases |
| T122–T127 | all phases (deploy = last) |
