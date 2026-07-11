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

- [ ] T031 Write two integration tests in `tests/integration/products.test.ts`: (1) `GET /api/products?category=bags` returns only bag products, (2) `GET /api/products?category=bags&sort=price_asc` returns sorted.
  Done when: both tests fail (no API yet), proving they run.

- [ ] T032 [P] Create `src/app/api/products/route.ts`: `GET` handler querying `Product` + `ProductVariant` via Prisma. Supports `?category=slug`, `?material=`, `?color=`, `?size=`, `?minPrice=`, `?maxPrice=`, `?sort=price_asc|price_desc|newest|popularity`, `?page=1&limit=20`.
  Done when: `npx tsx` sends request to dev server and gets JSON array. T031 tests pass. No lint/type errors.

- [ ] T033 In `src/app/api/products/route.ts`: validate every query param with Zod before passing to Prisma. Return 400 with `{ error, details }` on invalid input.
  Done when: `GET /api/products?sort=invalid` returns 400. No lint/type errors.

- [ ] T034 In `src/app/api/products/route.ts`: wrap handler in try/catch, log failures via `logger.error({ event: 'products.list.error', error })`. Return 500 with generic message.
  Done when: forced error returns 500 + log line in stdout. No lint/type errors.

---

## Phase 6: Browse Products — UI (US1 — P1)

- [ ] T035 Create `src/components/ProductCard.tsx`: receives `{ product }`, renders image, name, price range, stock badge. Links to `/products/{slug}`. Pure presentational.
  Done when: storybook or inline test renders with mock data. No lint/type errors.

- [ ] T036 Create `src/components/ProductGrid.tsx`: receives `{ products[] }`, renders responsive grid of `ProductCard`. Handles empty array (shows "No products found").
  Done when: renders 0, 1, 4+ cards correctly. No lint/type errors.

- [ ] T037 Create `src/components/ProductFilters.tsx`: renders category selector, price range inputs, material/color/size checkboxes. Emits `onFilterChange(filters)` on any change. Debounced 300ms.
  Done when: filter change callback fires with correct shape. No lint/type errors.

- [ ] T038 Create `src/app/(storefront)/products/page.tsx`: server component that fetches products via `GET /api/products`, renders `ProductFilters` + `ProductGrid` + pagination. ISR `revalidate = 60`.
  Done when: page loads in browser with real products from seed data. No lint/type errors.

- [ ] T039 Create `src/app/(storefront)/categories/[slug]/page.tsx`: server component, fetches products by category slug, renders same grid/filter layout. ISR `revalidate = 60`.
  Done when: navigating to `/categories/bags` shows only bags. No lint/type errors.

- [ ] T040 In `src/app/(storefront)/products/page.tsx`: add `not-found.tsx` for empty results, `error.tsx` boundary for API failures.
  Done when: network error shows "Something went wrong" page. No lint/type errors.

---

## Phase 7: Product Detail — API + UI (US2 — P1)

- [ ] T041 Write integration test in `tests/integration/products.test.ts`: `GET /api/products/{slug}` returns product + variants + stock.
  Done when: test fails (no endpoint yet).

- [ ] T042 In `src/app/api/products/route.ts`: add `GET /api/products/[slug]` via Next.js `dynamic` route. Query `Product` include `variants`, `category`. Return 404 if not found.
  Done when: T041 passes. No lint/type errors.

- [ ] T043 In `src/app/api/products/[slug]/route.ts`: validate slug param is non-empty alphanumeric + hyphens. Return 400 on invalid slug.
  Done when: `GET /api/products//` returns 400. No lint/type errors.

- [ ] T044 In `src/app/api/products/[slug]/route.ts`: add error handling + `logger.error` for DB failures. Return 500.
  Done when: forced DB failure returns 500 + log line. No lint/type errors.

- [ ] T045 Create `src/components/VariantSelector.tsx`: receives `{ variants[] }`, renders size and color pickers. Highlights selected, grays out out-of-stock options. Emits `onVariantChange(variantId)`.
  Done when: selecting a color updates available sizes. No lint/type errors.

- [ ] T046 Create `src/app/(storefront)/products/[slug]/page.tsx`: server component fetching product + variants. Renders images, name, price, description, materials, care instructions, variant selector, stock badge, "Add to Cart" button. ISR `revalidate = 60`. Includes `<script type="application/ld+json">` with schema.org Product.
  Done when: product page loads with all sections, structured data validates. No lint/type errors.

- [ ] T047 In product detail page: add `not-found.tsx` for missing slug, `error.tsx` boundary.
  Done when: visiting `/products/nonexistent` shows 404. No lint/type errors.

---

## Phase 8: Cart — API (US3a — P1)

- [ ] T048 Write integration test in `tests/integration/cart.test.ts`: add item → update qty → remove item → get cart. Verify totals recalculate.
  Done when: test fails (no API yet).

- [ ] T049 Create `src/app/api/cart/route.ts`: `GET` returns current cart with items + totals. `POST { variantId, quantity }` creates cart if none exists, adds/updates item.
  Done when: `POST` then `GET` returns expected cart shape. No lint/type errors.

- [ ] T050 In `src/app/api/cart/route.ts`: `PATCH { variantId, quantity }` updates item quantity (quantity=0 removes it). `DELETE { variantId }` removes item.
  Done when: PATCH + DELETE endpoints work. T048 passes. No lint/type errors.

- [ ] T051 In `src/app/api/cart/route.ts`: validate `variantId` exists, `quantity` is positive int. Reject adding out-of-stock variant. Return 400 with details.
  Done when: `POST { variantId: 'invalid', quantity: -1 }` returns 400. No lint/type errors.

- [ ] T052 In `src/app/api/cart/route.ts`: wrap handlers in try/catch, log errors. Return 500.
  Done when: forced error returns 500 + log line. No lint/type errors.

---

## Phase 9: Cart — UI (US3a — P1)

- [ ] T053 Create `src/components/CartItem.tsx`: receives `{ item, onUpdateQuantity, onRemove }`. Shows image, name, variant label, unit price, quantity selector, line total, remove button.
  Done when: renders with mock data, quantity change fires callback. No lint/type errors.

- [ ] T054 Create `src/components/CartSummary.tsx`: receives `{ subtotal, shipping, tax, discount, total }`. Shows line items + "Proceed to Checkout" button.
  Done when: renders correct totals. No lint/type errors.

- [ ] T055 Create `src/app/(storefront)/cart/page.tsx`: client component (needs interactivity). Fetches cart on mount, renders `CartItem` list + `CartSummary`. Shows "Your cart is empty" with link to shop when empty.
  Done when: adding a product then navigating to /cart shows it. No lint/type errors.

- [ ] T056 In `src/app/(storefront)/cart/page.tsx`: add error boundary. Show toast on API failures.
  Done when: network error shown as user-friendly toast. No lint/type errors.

---

## Phase 10: Checkout — Pricing + Tax + Shipping (US3b — P1)

- [ ] T057 Write unit test in `tests/unit/checkout.service.test.ts`: `calculatePricing(cartItems, discountCode)` returns `{ subtotal, discountAmount, shippingCost, taxAmount, total }`. Test with no discount, percentage discount, flat discount, free-shipping threshold.
  Done when: all cases in test pass. No lint/type errors.

- [ ] T058 Implement `calculatePricing` in `src/services/checkout.service.ts`: pure function. Sums line totals (`qty × unitPrice`). Applies discount if code valid (checks `DiscountCode` via Prisma). Calculates shipping (flat $5.99, free if subtotal ≥ $100). Looks up tax rate from static table `{ state → rate }`. Returns pricing breakdown.
  ⚠️ **REVIEW REQUIRED**: discount application logic, free-shipping threshold
  Done when: T057 passes. No lint/type errors.

- [ ] T059 Add `validateDiscountCode(code, subtotal)` to `src/services/checkout.service.ts`: checks active, not expired, not exceeded max uses, meets min order. Returns `{ valid, discount }` or `{ valid: false, reason }`.
  ⚠️ **REVIEW REQUIRED**: discount validation correctness
  Done when: unit test covers expired, maxed-out, below-min, valid cases. T057 still passes. No lint/type errors.

- [ ] T060 Add `lookupTaxRate(stateCode)` to `src/services/checkout.service.ts`: returns rate from `{ CA: 0.0725, NY: 0.08875, TX: 0.0825, ... }`. Returns 0 for unknown state. Logs warning on unknown state.
  Done when: unit test: `lookupTaxRate('CA')` returns 0.0725, `lookupTaxRate('XX')` returns 0 + log line. No lint/type errors.

---

## Phase 11: Checkout — Inventory Lock + Stripe Payment (US3b — P1)

- [ ] T061 Write unit test in `tests/unit/inventory.service.test.ts`: `reserveStock(variantId, quantity)` succeeds when stock sufficient, rejects when insufficient. `releaseStock(variantId, quantity)` restores stock.
  Done when: test fails (no service yet).

- [ ] T062 Implement `reserveStock(variantId, quantity)` in `src/services/inventory.service.ts`: runs `prisma.$transaction` with `SELECT ... FOR UPDATE` on `ProductVariant`. Throws `InsufficientStockError` if `stock < quantity`. Decrements stock. Creates `InventoryLog`.
  ⚠️ **REVIEW REQUIRED**: pessimistic locking correctness, deadlock potential, transaction isolation
  Done when: T061 passes. Concurrent test (2 simultaneous requests for last item) — only one succeeds. No lint/type errors.

- [ ] T063 Implement `releaseStock(variantId, quantity)` in `src/services/inventory.service.ts`: increments stock, creates `InventoryLog` with reason `'release'`. Used on payment failure or checkout timeout.
  ⚠️ **REVIEW REQUIRED**: release-not-on-commit path correctness
  Done when: unit test: release restores stock + audit entry. No lint/type errors.

- [ ] T064 Write integration test in `tests/integration/checkout-flow.test.ts`: full checkout with Stripe test mode. Add item → create payment intent → confirm payment → verify order created → verify inventory decremented.
  Done when: test fails (no checkout flow yet).

- [ ] T065 Implement `createPayment(amount, currency, customerId, idempotencyKey)` in `src/services/checkout.service.ts`: calls `stripe.paymentIntents.create` with idempotency key. Returns `{ paymentIntentId, clientSecret }`.
  ⚠️ **REVIEW REQUIRED**: idempotency key uniqueness, amount in cents, currency code
  Done when: unit test (mocked Stripe) returns expected shape. Integration test with real Stripe test mode succeeds. No lint/type errors.

- [ ] T066 Implement `handlePaymentSuccess(paymentIntentId)` in `src/services/checkout.service.ts`: queries Stripe for PI status, creates `Order` + `OrderLineItems`, clears cart, sends confirmation email. Wrapped in Prisma transaction.
  ⚠️ **REVIEW REQUIRED**: order creation transaction includes inventory finalization, no double-charge risk
  Done when: integration test: webhook trigger creates order in DB. No lint/type errors.

---

## Phase 12: Checkout — Orchestration + API (US3b — P1)

- [ ] T067 Implement `checkout(cartId, shippingAddress, discountCode?)` in `src/services/checkout.service.ts`: orchestrates: load cart → validate stock → calculate pricing → create Stripe payment → return `{ clientSecret, paymentIntentId }`. All in one Prisma transaction except Stripe call.
  ⚠️ **REVIEW REQUIRED**: full orchestration correctness, partial-failure safety
  Done when: unit test (mocked deps) calls each step in order. Integration test: `checkout()` → Stripe PI created with correct amount. No lint/type errors.

- [ ] T068 Create `POST /api/checkout` in `src/app/api/checkout/route.ts`: accepts `{ shippingAddress, discountCode? }`, calls `checkout()`, returns `{ clientSecret, paymentIntentId }`. Calls `logger.info` on success.
  ⚠️ **REVIEW REQUIRED**: request body shape, no card data in request
  Done when: `POST /api/checkout` with valid cart returns `clientSecret`. No lint/type errors.

- [ ] T069 In `POST /api/checkout`: validate `shippingAddress` (name, line1, city, state, zip required). Validate `discountCode` format if present. Return 400 with `{ error, details }`.
  Done when: missing address field returns 400. No lint/type errors.

- [ ] T070 In `POST /api/checkout`: wrap in try/catch, log errors. Handle `InsufficientStockError` → 409. Handle Stripe errors → 502. Other → 500.
  Done when: out-of-stock returns 409. Stripe down returns 502. No lint/type errors.

- [ ] T071 Create `POST /api/stripe/webhook` handler for `payment_intent.succeeded`: calls `handlePaymentSuccess`. Returns 200 within 5s. Logs event ID for idempotency dedup.
  ⚠️ **REVIEW REQUIRED**: webhook idempotency (replay), 5s timeout, no double-order on retry
  Done when: Stripe CLI sends `payment_intent.succeeded` → order created. Second identical event → order NOT duplicated (idempotent). No lint/type errors.

- [ ] T072 Create `POST /api/stripe/webhook` handler for `payment_intent.payment_failed`: calls `releaseStock` for all cart items. Logs failure reason. Returns 200.
  ⚠️ **REVIEW REQUIRED**: stock release on failure, no release-on-success path
  Done when: Stripe CLI sends `payment_intent.payment_failed` → stock restored. No lint/type errors.

---

## Phase 13: Checkout — UI (US3b — P1)

- [ ] T073 Create `src/components/ShippingForm.tsx`: renders name, address line1/line2, city, state (dropdown), zip inputs. Validates all required on blur. Emits `onChange(shippingAddress)`.
  Done when: form renders, state dropdown has US states. No lint/type errors.

- [ ] T074 Create `src/components/PaymentForm.tsx`: integrates Stripe Elements (`Elements` + `PaymentElement`). Emits `onReady(clientSecret)` when mounted. Handles Stripe validation errors inline.
  ⚠️ **REVIEW REQUIRED**: Stripe Elements integration — no card data in React state or logs
  Done when: form renders with Stripe iframe, validation shows inline errors. No lint/type errors.

- [ ] T075 Create `src/app/(storefront)/checkout/page.tsx`: client component. Renders `ShippingForm` + `PaymentForm` + `CartSummary`. On submit: calls `POST /api/checkout` → confirms Stripe payment via `stripe.confirmPayment`. On success: redirects to `/checkout/confirmation?orderId=x`.
  Done when: full guest checkout flow works end-to-end. No lint/type errors.

- [ ] T076 Create `src/app/(storefront)/checkout/confirmation/page.tsx`: reads `orderId` from query params, fetches order details, renders "Thank you" + order summary + guest order lookup link.
  Done when: confirmation page shows order details. No lint/type errors.

- [ ] T077 In `src/app/(storefront)/checkout/page.tsx`: add error states for payment declined, insufficient stock, Stripe unavailable. Show friendly message + retry option.
  Done when: each error state renders correctly (test by mocking failures). No lint/type errors.

---

## Phase 14: Checkout — Load Test (US3b — P1)

- [ ] T078 Write k6/Artillery test script in `tests/load/checkout-contention.js`: simulate 20 concurrent users adding the same last-in-stock variant then checking out. Verify only 1 succeeds, inventory is 0, no negative stock.
  ⚠️ **REVIEW REQUIRED**: concurrency correctness
  Done when: script runs against staging, zero negative stock entries in DB. If test fails, T062 needs review.

---

## Phase 15: Account — Auth API (US4 — P2)

- [ ] T079 Write unit test in `tests/unit/auth.test.ts`: register → login returns tokens → access protected route with token → refresh token → old refresh invalidated → password reset flow.
  Done when: test fails (no auth yet).

- [ ] T080 Create `POST /api/auth/register` in `src/app/api/auth/route.ts`: accepts `{ email, password, name }`. Hashes password via `hashPassword`. Creates `Customer`. Returns `{ customer }` (no tokens — login separately).
  ⚠️ **REVIEW REQUIRED**: password hashing strength, duplicate email handling
  Done when: register creates customer in DB. Duplicate email returns 409. No lint/type errors.

- [ ] T081 Create `POST /api/auth/login` in `src/app/api/auth/route.ts`: accepts `{ email, password }`. Verifies via `verifyPassword`. Returns `{ accessToken, refreshToken, customer }`. Rate-limited via middleware.
  ⚠️ **REVIEW REQUIRED**: rate-limit bypass, token expiry
  Done when: login returns tokens. Wrong password returns 401. 6th attempt returns 429. No lint/type errors.

- [ ] T082 Create `POST /api/auth/refresh` in `src/app/api/auth/route.ts`: accepts `{ refreshToken }`. Calls `rotateRefreshToken`. Returns `{ accessToken, refreshToken }`. Rejects rotated token.
  ⚠️ **REVIEW REQUIRED**: refresh token reuse detection
  Done when: valid refresh returns new pair. Reused old refresh returns 401. No lint/type errors.

- [ ] T083 Create `POST /api/auth/reset-password` in `src/app/api/auth/route.ts`: (1) accepts `{ email }` → generates reset token, sends email via `email.ts`. (2) accepts `{ token, newPassword }` → verifies token, updates hash.
  ⚠️ **REVIEW REQUIRED**: token expiry, email delivery failure handling
  Done when: request sends email with link. Reset with valid token succeeds. Expired token returns 400. No lint/type errors.

- [ ] T084 In `src/app/api/auth/route.ts`: validate email format, password min 8 chars with mixed case + number. Return 400 with details.
  Done when: weak password returns 400. Invalid email returns 400. No lint/type errors.

- [ ] T085 In `src/app/api/auth/route.ts`: wrap handlers in try/catch, log auth events (login success/failure, registration, password reset). Return 500.
  Done when: forced error returns 500 + log line. No lint/type errors.

---

## Phase 16: Account — UI (US4 — P2)

- [ ] T086 Create `src/app/(storefront)/account/auth/login/page.tsx`: email + password form. On success stores tokens (httpOnly cookie or localStorage), redirects to `/account`. Shows error on failure.
  Done when: login form works end-to-end. No lint/type errors.

- [ ] T087 Create `src/app/(storefront)/account/auth/register/page.tsx`: name + email + password + confirm-password form. On success redirects to login with "Account created" message.
  Done when: register → login flow works. No lint/type errors.

- [ ] T088 Create `src/app/(storefront)/account/reset-password/page.tsx`: step 1: email input → "Check your email". Step 2: token + new password form → "Password updated".
  Done when: reset flow works end-to-end with real email. No lint/type errors.

---

## Phase 17: Account — Order History + GDPR (US4 — P2)

- [ ] T089 Write integration test in `tests/integration/auth-flow.test.ts`: authenticated user fetches their orders, exports data, requests deletion.
  Done when: test fails (no endpoints yet).

- [ ] T090 Create `GET /api/account/orders` in `src/app/api/account/route.ts`: returns orders for authenticated `customerId`. Includes line items. Authenticated via JWT from header.
  Done when: returns orders for authed user. Unauthenticated returns 401. No lint/type errors.

- [ ] T091 Create `GET /api/account/data` in `src/app/api/account/route.ts`: returns all PII for authenticated customer as JSON (GDPR data portability).
  ⚠️ **REVIEW REQUIRED**: PII exposure — must be authenticated + logged
  Done when: authed request returns customer JSON. No lint/type errors.

- [ ] T092 Create `DELETE /api/account/data` in `src/app/api/account/route.ts`: sets `deletedAt` on customer (soft-delete). Clears name, email replaced with hash. Order records preserved.
  ⚠️ **REVIEW REQUIRED**: irreversible action confirmation, order record integrity
  Done when: after deletion, customer cannot log in. Orders remain in DB. No lint/type errors.

- [ ] T093 In `src/app/api/account/route.ts`: validate JWT on every request. Return 401 if missing/invalid. Return 403 if accessing another user's data.
  Done when: no-token returns 401. Wrong user returns 403. No lint/type errors.

- [ ] T094 In `src/app/api/account/route.ts`: add error handling + logging for order fetch, data export, deletion.
  Done when: forced error returns 500 + log line. No lint/type errors.

- [ ] T095 Build `src/app/(storefront)/account/page.tsx`: shows "Welcome, {name}", order history table (order #, date, status, total, link to detail), link to settings, "Download my data" button, "Delete my account" button with confirmation dialog.
  Done when: page renders with real order data. Delete flow works end-to-end. No lint/type errors.

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

- [ ] T102 Create `GET /api/admin?section=discounts` in `src/app/api/admin/route.ts`: returns discount codes. `POST` creates new code. `PATCH` updates. `DELETE` deactivates.
  Done when: CRUD works. Duplicate code rejected. No lint/type errors.

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
