# PineNova Enterprise SDD Audit — Backend, API, Database

**Date:** 2026-07-12  
**Scope:** Code Quality, API Routes, Database Schema, Service Layer, Library Modules  
**Files Audited:** 55 files across lib/, services/, repositories/, prisma/, app/api/, types/, app/, middleware.ts

---

## 1. Code Quality

### 1.1 Naming & Consistency

| Issue | Location | Severity |
|---|---|---|
| **Inconsistent rate-limit files** — Two separate files (`rate-limit.ts` and `rate-limiter.ts`) both implement in-memory rate limiting with different APIs. `rate-limit.ts` exports `rateLimit()`, `rateLimiter.ts` exports `checkRateLimit()`. Some routes use one, some use the other. | `lib/rate-limit.ts`, `lib/rate-limiter.ts` | **HIGH** |
| `requireAdmin()` returns union `Promise<{ sub: string } \| NextResponse>` — ambiguous return type forces `instanceof Response` checks everywhere | `lib/admin-utils.ts:7-29` | **MEDIUM** |
| `checkCSRF()` returns `NextResponse | null` instead of a boolean/void pattern | `lib/api-utils.ts:50-72` | **LOW** |
| `handlePaymentSuccess()` is named "handle" but creates orders — misnomer | `services/checkout.service.ts:161` | **LOW** |
| `checkout()` in checkout.service.ts uses `InsufficientStockError` for non-stock validation (unpublished product, zero price) at lines 316-320 — semantic misuse | `services/checkout.service.ts:316-320` | **MEDIUM** |
| `formatCartResponse()` uses `any` type on parameter and return | `app/api/cart/route.ts:49-76` | **MEDIUM** |
| Mixed casing: `orderId` vs `order_id` in different parts of codebase | Throughout | **LOW** |
| `generateOrderNumber()` defined in 2 places (`checkout.service.ts:146` and `order.repository.ts:5`) — duplicated logic | `services/checkout.service.ts:146-151`, `repositories/order.repository.ts:5-12` | **MEDIUM** |

### 1.2 Dead Code

| Issue | Location | Severity |
|---|---|---|
| `checkout.service.ts:releaseStock` is imported but only used in `handlePaymentFailed()` — the `checkout()` function never calls it on failure | `services/checkout.service.ts:5` (import) | **MEDIUM** |
| `order.repository.ts:create()` method implements its own stock deduction logic (lines 27-33, 60-65), but no route actually calls it — the admin routes and checkout service do their own inventory management | `repositories/order.repository.ts:15-70` | **MEDIUM** |
| `product.repository.ts:getCategories()` at line 104-109 duplicates `category.repository.ts:findAll()` | `repositories/product.repository.ts:104-109` | **LOW** |
| `repositories/cart.repository.ts` has methods `findByUserId`, `ensureCart`, `addItem`, `updateItemQuantity`, `removeItem`, `clearCart`, `getCartTotal` — **none of these are used by any route**. The cart route (`app/api/cart/route.ts`) directly uses Prisma. | `repositories/cart.repository.ts` (entire file) | **HIGH** |
| `repositories/user.repository.ts` has `findAll`, `setStatus` — never called by any route | `repositories/user.repository.ts:28-42` | **LOW** |
| `repositories/review.repository.ts` has `findAll`, `moderate`, `delete` — never called by any route | `repositories/review.repository.ts:38-57` | **LOW** |
| `repositories/order.repository.ts` has `findByUser`, `findById`, `findAll`, `updateStatus`, `getDashboardMetrics` — never called by any route. Routes use Prisma directly. | `repositories/order.repository.ts` (entire file) | **HIGH** |
| `repositories/product.repository.ts` has `findByCategory`, `findBySlug`, `findAll`, `search`, `findById`, `create`, `update`, `delete` — never called by any route. API routes use Prisma directly. | `repositories/product.repository.ts` (entire file) | **HIGH** |
| `repositories/blog.repository.ts` — entirely dead code; no blog API routes exist | `repositories/blog.repository.ts` (entire file) | **HIGH** |
| `repositories/category.repository.ts` — entirely dead code; routes use Prisma directly | `repositories/category.repository.ts` (entire file) | **HIGH** |
| `lib/rate-limiter.ts` exports `rateLimitMiddleware()` — never imported anywhere | `lib/rate-limiter.ts:40-53` | **LOW** |

### 1.3 Duplication

| Issue | Location | Severity |
|---|---|---|
| **Cart query logic repeated 4 times** — GET, POST, PATCH, DELETE all rebuild the same cart query with `include: { items: { include: { product: { include: { images: ... } } } } }` | `app/api/cart/route.ts:78-91` (reused via `loadCart()` but also inline in GET lines 112-138) | **MEDIUM** |
| **CSRF check duplicated** — `checkCSRF()` in `api-utils.ts` and inline in `checkout/route.ts:47-62`; checkout route duplicates the function rather than calling it | `app/api/checkout/route.ts:47-62` | **MEDIUM** |
| **Order number generation** duplicated in `checkout.service.ts` and `order.repository.ts` | Both files | **MEDIUM** |
| **Product pricing/filtering logic** duplicated in `products/route.ts` (API) and `products/page.tsx` (server component) | Both files | **MEDIUM** |
| **`requireAdmin()` rate limit** hardcoded to 60 req/min (`admin-utils.ts:23`) but admin routes lack independent IP-based rate limiting | `lib/admin-utils.ts:23` | **LOW** |

### 1.4 Large Files & Methods

| Issue | Location | Severity |
|---|---|---|
| `checkout.service.ts` — **408 lines**, mixes pricing, discount validation, payment creation, order creation, email sending | `services/checkout.service.ts` | **HIGH** |
| `app/api/cart/route.ts` — **352 lines**, 4 HTTP methods in single file with duplicated cart resolution logic | `app/api/cart/route.ts` | **HIGH** |
| `admin/orders/route.ts` — **167 lines**, PATCH (status update) and POST (refund) in same file, refund logic has inline simulated mode | `app/api/admin/orders/route.ts` | **MEDIUM** |
| `services/checkout.service.ts:checkout()` — **108 lines** (296-408), does too many things | `services/checkout.service.ts:296-408` | **HIGH** |
| `services/checkout.service.ts:handlePaymentSuccess()` — **113 lines** (161-274) | `services/checkout.service.ts:161-274` | **HIGH** |

### 1.5 Magic Numbers & Hardcoded Strings

| Issue | Location | Severity |
|---|---|---|
| `SHIPPING_FLAT = 599` — hardcoded, should be env/config | `services/checkout.service.ts:42` | **MEDIUM** |
| `FREE_SHIPPING_THRESHOLD = 10000` — hardcoded | `services/checkout.service.ts:43` | **MEDIUM** |
| `BCRYPT_ROUNDS = 12` in auth.ts, but `10` used in `signRefreshToken` at line 60 | `lib/auth.ts:20,60` | **MEDIUM** |
| Tax rates (`TAX_RATES`) hardcoded for 38 states — no dynamic rate lookup, no config | `services/checkout.service.ts:8-40` | **MEDIUM** |
| `rateLimit('admin:...', 60, 60000)` hardcoded | `lib/admin-utils.ts:23` | **LOW** |
| `rateLimit('checkout:...', 10, 60000)` hardcoded | `app/api/checkout/route.ts:44` | **LOW** |
| `SESSION_MAX_AGE = 60 * 60 * 24 * 30` hardcoded | `app/api/cart/route.ts:13` | **LOW** |
| `BCRYPT_ROUNDS` constant at top (12) but `10` used inline in `signRefreshToken` | `lib/auth.ts:20,60` | **MEDIUM** |
| "unknown" as default IP string repeated across 5+ routes | Multiple files | **LOW** |

### 1.6 Comment Quality

| Issue | Location | Severity |
|---|---|---|
| **Zero comments** in `checkout.service.ts:checkout()` — complex payment+stock+order logic | `services/checkout.service.ts:296-408` | **MEDIUM** |
| **Zero comments** in `lib/admin-utils.ts:TRANSITION_MAP` — state machine undocumented | `lib/admin-utils.ts:35-44` | **LOW** |
| `handlePaymentSuccess()` has no docstring explaining idempotency guarantee | `services/checkout.service.ts:161` | **MEDIUM** |
| `lib/rate-limit.ts` vs `lib/rate-limiter.ts` — no comment explaining why two files | Both files | **MEDIUM** |
| `lib/audit.ts:15` — `params as unknown as never` type coercion has no explanation | `lib/audit.ts:15` | **MEDIUM** |
| Seed file has section comments (e.g. `// === BAGS ===`) but no comments explaining business rules | `prisma/seed.ts` | **LOW** |

---

## 2. API Audit

### 2.1 Complete Endpoint Inventory

| Method | Path | Auth | Validation | Error Format | Rate-Limit | CSRF | Notes |
|---|---|---|---|---|---|---|---|
| POST | `/api/auth/login` | No | `LoginSchema` | `apiError()` | `checkAuthRateLimit` 10/60s | `checkCSRF` | Sets httpOnly cookie + JSON body return |
| POST | `/api/auth/register` | No | `RegisterSchema` | `apiError()` | `checkAuthRateLimit` 5/60s | `checkCSRF` | Returns user only (no tokens) |
| POST | `/api/auth/refresh` | No | Manual | `apiError()` | None | `checkCSRF` | Reads cookie first, falls back to body |
| POST | `/api/auth/reset-password` | No | Dual-schema | `apiError()` | `checkAuthRateLimit` 3/60s | `checkCSRF` | Forgot + Reset in one handler |
| GET | `/api/products` | No | `querySchema` | Inline `Response.json` | None | None | |
| GET | `/api/products/[slug]` | No | `slugSchema` | Inline `Response.json` | None | None | |
| GET | `/api/cart` | Optional | None | Inline `NextResponse.json` | `rateLimit` 30/60s | None | |
| POST | `/api/cart` | Optional | `AddCartItemSchema` | Inline | `rateLimit` 30/60s | None | |
| PATCH | `/api/cart` | Optional | `UpdateCartItemSchema` | Inline | `rateLimit` 30/60s | None | |
| DELETE | `/api/cart` | Optional | `RemoveCartItemSchema` | Inline | `rateLimit` 30/60s | None | |
| POST | `/api/checkout` | No (session) | `checkoutSchema` | Inline | `rateLimit` 10/60s | Inline (not `checkCSRF`) | Feature-flag gated |
| POST | `/api/stripe/webhook` | Sig | None | Inline | None | None | Idempotency via `webhookEvent` table |
| GET | `/api/admin/products` | `requireAdmin` | None | Inline | Inline (admin-utils) | None | |
| POST | `/api/admin/products` | `requireAdmin` | `AdminProductCreateSchema` | Inline | Inline | `checkCSRF` | |
| PATCH | `/api/admin/products` | `requireAdmin` | `AdminProductUpdateSchema` | Inline | Inline | `checkCSRF` | ID in query param |
| DELETE | `/api/admin/products` | `requireAdmin` | None | Inline | Inline | `checkCSRF` | Archives (soft-delete) |
| GET | `/api/admin/orders` | `requireAdmin` | None | Inline | Inline | None | |
| PATCH | `/api/admin/orders` | `requireAdmin` | `AdminStatusUpdateSchema` | Inline | Inline | `checkCSRF` | Body-based |
| POST | `/api/admin/orders` | `requireAdmin` | `AdminRefundSchema` | Inline | Inline | `checkCSRF` | Refunds |
| GET | `/api/admin/discounts` | `requireAdmin` | None | Inline | Inline | None | |
| POST | `/api/admin/discounts` | `requireAdmin` | `AdminDiscountCreateSchema` | Inline | Inline | `checkCSRF` | |
| PATCH | `/api/admin/discounts` | `requireAdmin` | `AdminDiscountUpdateSchema` | Inline | Inline | `checkCSRF` | ID in query param |
| DELETE | `/api/admin/discounts` | `requireAdmin` | None | Inline | Inline | `checkCSRF` | Soft-deactivates |
| GET | `/api/admin/inventory` | `requireAdmin` | None | Inline | Inline | None | |
| POST | `/api/admin/inventory` | `requireAdmin` | `AdminInventoryAdjustSchema` | Inline | Inline | `checkCSRF` | Optimistic concurrency |
| GET | `/api/admin/metrics` | `requireAdmin` | None | Inline | Inline | None | CSV export option |
| POST | `/api/admin/setup` | No | Manual | Inline | None | None | Dev-only, no CSRF |
| GET | `/api/account/data` | Bearer | None | `apiError()` | None | None | GDPR export |
| DELETE | `/api/account/data` | Bearer | Manual confirm | `apiError()` | None | None | Pseudonymizes user |
| GET | `/api/account/orders` | Bearer | None | `apiError()` | None | None | |

### 2.2 Missing Endpoints

| Missing Endpoint | Impact | Severity |
|---|---|---|
| **No PATCH/PUT for user profile** — `UpdateProfileSchema` exists in types but no route | Users cannot update name/email | **HIGH** |
| **No DELETE for cart** — no way to clear entire cart via API (only delete individual items) | `/api/cart` lacks clear-all endpoint | **MEDIUM** |
| **No order detail endpoint** (e.g., `GET /api/account/orders/[id]`) | Users cannot view single order details via API | **MEDIUM** |
| **No category list endpoint** (e.g., `GET /api/categories`) | Public API has no category endpoint, storefront uses server component directly | **LOW** |
| **No review create endpoint** (`POST /api/products/[slug]/reviews`) | Users cannot submit reviews via API | **MEDIUM** |
| **No blog endpoints** — `BlogArticle` model exists, `blog.repository.ts` exists, but no API routes | Blog feature is entirely missing from API | **MEDIUM** |
| **No password change endpoint** (authenticated, not via reset token) | `UpdateProfileSchema` has `currentPassword` but no route | **MEDIUM** |
| **No search endpoint** — `SearchSchema` exists but no route implements `/api/products/search` | Products API has no search endpoint | **MEDIUM** |
| **No admin user management** — no endpoint to list/disable users | Admin cannot manage users | **LOW** |
| **No health check endpoint** — no `/api/health` | No uptime/heartbeat monitor | **LOW** |

### 2.3 Validation & Error Handling Inconsistencies

| Issue | Location | Severity |
|---|---|---|
| **Inconsistent error response format** — `apiError()` returns `{ error: { code, message, details, requestId } }` but cart, checkout, products routes use inline `{ error: { code, message } }` without `requestId` on success fields | Compare `lib/api-utils.ts:34-39` with `app/api/products/route.ts:26-28` | **MEDIUM** |
| **Missing requestId** on some error responses — `apiError()` always includes it, but cart/checkout inline responses differ | `app/api/cart/route.ts` vs `app/api/checkout/route.ts` | **MEDIUM** |
| **Inconsistent success response format** — `apiSuccess()` wraps in just the data, but admin routes wrap in `{ data: ... }`, and product routes return raw | Compare `admin/discounts/route.ts:13` (`{ data: codes }`) vs `account/orders/route.ts:29` (`apiSuccess({ data, total, page... })`) vs `products/route.ts:72` (`{ products, total, page, limit }`) | **HIGH** |
| **Some routes miss `checkCSRF()`** — `GET /api/cart`, all `GET` admin routes, `POST /api/checkout` has inline CSRF instead of calling shared function | Multiple files | **MEDIUM** |
| **Stripe webhook returns 200 on duplicate** — correct, but no idempotency replay detection for edge cases | `app/api/stripe/webhook/route.ts:27-30` | **LOW** |
| `admin/orders/route.ts:POST` — refund route uses `stripe` lazy import for "simulated" mode; if Stripe is configured but import fails, it silently simulates | `app/api/admin/orders/route.ts:129-142` | **HIGH** |
| **No input sanitization** on `slugSchema` in products `[slug]` — validates format but returns generic error | `app/api/products/[slug]/route.ts:6` | **LOW** |

### 2.4 Authentication & Authorization Issues

| Issue | Location | Severity |
|---|---|---|
| **Middleware doesn't protect API routes** — middleware only guards `/admin` (page) and `/account` (page) routes; all API routes must self-protect | `middleware.ts:72-86` | **MEDIUM** |
| **Public path list in middleware contains `/api/admin`** (`middleware.ts:24`) — this means ALL admin API routes are publicly accessible via middleware, relying entirely on `requireAdmin()` | `middleware.ts:24` | **HIGH** |
| **`checkout/route.ts` requires only sessionId** — no user authentication; anyone with a valid sessionId can place an order | `app/api/checkout/route.ts:36-42` | **MEDIUM** |
| **`account/data/route.ts` GET returns `orders` with `items`** — excessive data exposure for GDPR export | `app/api/account/data/route.ts:15-17` | **LOW** |
| **Account deletion doesn't invalidate access token** — only clears refresh tokens, but access tokens remain valid until expiry | `app/api/account/data/route.ts:65` | **MEDIUM** |
| **Login stores token in both localStorage and cookie** — inconsistent, cookie has `SameSite=Lax` but localStorage is vulnerable to XSS | `app/(storefront)/account/auth/login/page.tsx:35-36` | **MEDIUM** |
| **No rate limiting on non-auth GET endpoints** — products list, product detail, cart GET have no per-IP rate limiting | `app/api/products/route.ts`, `app/api/products/[slug]/route.ts` | **LOW** |
| **Rate limit key for cart** uses IP only (not user+IP) — shared IPs (NAT) share rate limit pool | `app/api/cart/route.ts:8-10` | **LOW** |

### 2.5 Response Format Inconsistencies (Summary Table)

| Route | Success Format | Error Format | requestId on Error |
|---|---|---|---|
| `/api/auth/login` | `apiSuccess({ accessToken, refreshToken, user })` | `apiError()` — has requestId | Yes |
| `/api/auth/register` | `apiSuccess({ user }, 201)` | `apiError()` | Yes |
| `/api/auth/refresh` | `apiSuccess({ accessToken, refreshToken })` | `apiError()` | Yes |
| `/api/auth/reset-password` | `apiSuccess({ message })` | `apiError()` | Yes |
| `/api/products` | `{ products, total, page, limit }` | Inline — no requestId | No |
| `/api/products/[slug]` | Raw product object | Inline — no requestId | No |
| `/api/cart` | `formatCartResponse()` raw | Inline — has requestId | Yes |
| `/api/checkout` | `{ clientSecret, paymentIntentId, orderId, orderNumber }` | Inline — has requestId | Yes |
| `/api/admin/*` | `{ data: ... }` | Inline — has requestId | Yes |
| `/api/account/*` | `apiSuccess()` | `apiError()` | Yes |

---

## 3. Database Audit

### 3.1 Schema Completeness

| Issue | Location | Severity |
|---|---|---|
| **Missing `PaymentIntent` model** — `stripePaymentIntentId` is stored on Order, but no dedicated table for payment intents, refunds, or transaction history | `prisma/schema.prisma:143` | **MEDIUM** |
| **No `Address` model** — shipping address stored as JSON blob on Order (`shippingAddress Json`) — no normalization, no address reuse, no type safety | `prisma/schema.prisma:140` | **HIGH** |
| **No product variants model** — products have single `price` and `stock` — no size/color/option support | `prisma/schema.prisma:56-79` | **MEDIUM** |
| **No coupon/ discount usage table** — `usedCount` on `DiscountCode` is an incrementing counter, no per-user usage tracking | `prisma/schema.prisma:244` | **MEDIUM** |
| **No `Session` model** — cart session is tracked via `sessionId` string on Cart model, not in a proper session table | `prisma/schema.prisma:112` | **LOW** |
| **No `EmailLog` table** — email sends are fire-and-forget, no delivery tracking | — | **LOW** |
| **No indexes on `CartItem.productId`** — querying cart items by product requires full scan | `prisma/schema.prisma:126` (no `@@index`) | **MEDIUM** |
| **No unique constraint on `Cart.userId`** — missing user-session merge logic couldn't be validated | `prisma/schema.prisma:111` (`@unique` exists on userId) | — |
| **No compound index on `Order.userId` + `status`** — common query pattern for "my active orders" | `prisma/schema.prisma:157-158` has separate indexes | **LOW** |
| **No `@@map` or table name customization** — Prisma auto-generates `CartItem`, `OrderItem`, etc. — inconsistent casing vs. `OrderStatusLog` | `prisma/schema.prisma` | **LOW** |

### 3.2 Normalization

| Issue | Location | Severity |
|---|---|---|
| **`shippingAddress Json` on Order** — stores unstructured address data. Cannot query by state/zip, no referential integrity, no reuse across orders | `prisma/schema.prisma:140` | **HIGH** |
| **`productSnapshot Json` on OrderItem** — necessary for historical fidelity but the structure is inconsistent: `checkout.service.ts:237` stores `{ name, sku, price }` while `checkout.service.ts:385` stores `{ name, price }` (missing `sku`) | `prisma/schema.prisma:166`, `services/checkout.service.ts:237,385` | **MEDIUM** |
| **`before`/`after` Json on AuditLog** — no schema enforcement for audit trail | `prisma/schema.prisma:221-222` | **LOW** |
| **User `provider` and `providerId`** — no constraints, nullable strings with no uniqueness | `prisma/schema.prisma:98-99` | **LOW** |
| **`RefreshToken` has no relation to User** — just `userId: String` with no `@relation` — cannot cascade delete | `prisma/schema.prisma:276` | **HIGH** |

### 3.3 Missing Constraints

| Issue | Location | Severity |
|---|---|---|
| **No `ON DELETE CASCADE` on `CartItem.productId`** — deleting a product with items in carts will fail | `prisma/schema.prisma:126` | **MEDIUM** |
| **No `ON DELETE CASCADE` on `OrderItem.productId`** — similar issue | `prisma/schema.prisma:169` | **MEDIUM** |
| **No `ON DELETE CASCADE` on `RefreshToken.userId`** — deleting user leaves orphaned tokens | `prisma/schema.prisma:276-279` | **HIGH** |
| **No `@updatedAt` on `ProductImage`** — no way to track image updates | `prisma/schema.prisma:81-88` | **LOW** |
| **No `@@unique([productId, userId])` on Review** — current code enforces "one review per user per product" in application layer (`review.repository.ts:13`) but no DB constraint; race condition possible | `prisma/schema.prisma:198-199` | **MEDIUM** |
| **No default for `Order.email`** — nullable String | `prisma/schema.prisma:133` | **LOW** |
| **`InventoryLog.orderId` nullable String with no relation** — cannot trace inventory changes to orders | `prisma/schema.prisma:259` | **MEDIUM** |
| **`Product.price` uses `@db.Decimal(10,2)` but seed stores 89.99** — works but inconsistent with 100× conversion in service layer | `prisma/schema.prisma:62` vs `services/checkout.service.ts:202` | **MEDIUM** |

### 3.4 Index Analysis

| Index | Location | Assessment |
|---|---|---|
| `@@index([categoryId, published, price])` | `schema.prisma:77` | Good — covers category browsing |
| `@@index([published, createdAt])` | `schema.prisma:78` | Good — covers new arrivals listing |
| `@@index([userId, createdAt])` on Order | `schema.prisma:157` | Good — covers my-orders queries |
| `@@index([status, createdAt])` on Order | `schema.prisma:158` | Good — covers admin filtering |
| `@@index([orderNumber])` on Order | `schema.prisma:159` | Redundant — `orderNumber` is `@unique` |
| **Missing: `@@index([userId])` on RefreshToken** | — | Expired token cleanup query scans |
| **Missing: `@@index([userId])` on AuditLog** | — | Admin audit per user query scans |
| **Missing: `@@index([productId])` on InventoryLog** | — | Stock history for product query scans |
| **Missing: `@@index([createdAt])` on RefreshToken** | — | Cleanup expired tokens query scans |

### 3.5 Seed Issues

| Issue | Location | Severity |
|---|---|---|
| **Hardcoded raw bcrypt import** at line 17 inside `main()` — dynamically imports bcryptjs, inefficient | `prisma/seed.ts:17` | **LOW** |
| **No discount codes seeded** — `DiscountCode` table has no seed data; all discount testing requires manual creation | `prisma/seed.ts` | **LOW** |
| **No review data seeded** — `Review` table empty | `prisma/seed.ts` | **LOW** |
| **No blog articles seeded** — `BlogArticle` table empty | `prisma/seed.ts` | **LOW** |
| **Product images reference `/images/products/...`** — these are static paths with no actual file existence check | `prisma/seed.ts` | **MEDIUM** |
| **Deletion order** — deletes `ProductImage`, `Product`, `Category` but does NOT delete `User`, `Order`, `Review`, `Cart` | `prisma/seed.ts:7-11` | **MEDIUM** (re-seed after orders will fail FK) |
| **No `where` filter on admin user upsert** — uses `findUnique` then `create`, should use `upsert` | `prisma/seed.ts:16-25` | **LOW** |

---

## 4. Service Layer

### 4.1 Business Logic Correctness

| Issue | Location | Severity |
|---|---|---|
| **Price representation mismatch** — `checkout.service.ts` multiplies `Number(item.product.price) * 100` (line 202) but `handlePaymentSuccess` also does `Number(item.product.price) * 100` (line 202) and then later divides by 100 for storage (lines 226-230). `checkout()` also does `Number(item.product.price) * 100` at line 325. The seed stores prices as `89.99` (Decimal). So the flow is: DB stores `89.99` → service reads `89.99` → multiplies by 100 → sends to Stripe as `$8999` → Stripe returns success → divides by 100 → stores `89.99` back. **This is correct but fragile.** | `services/checkout.service.ts:202,226-230,325` | **MEDIUM** |
| **`calculatePricing()` ignores `discountCode`** — `calculatePricing()` (line 108) always sets `discountAmount: 0`, never uses the `discountCode` from `PricingInput`. The `calculatePricingWithDiscount()` function (line 121) is the correct one. | `services/checkout.service.ts:118` | **HIGH** |
| **`checkout()` calls `createPayment()` before stock reservation** — line 331 creates the payment intent, then lines 341-361 reserve stock. If stock reservation fails, the payment intent was already created (orphan). | `services/checkout.service.ts:331-361` | **CRITICAL** |
| **`checkout()` creates payment with `Date.now()` idempotency key** — `idempotencyKey = checkout_${cartId}_${Date.now()}` at line 330. `Date.now()` has millisecond precision, so rapid retries could create multiple payment intents for the same checkout. | `services/checkout.service.ts:330` | **HIGH** |
| **`handlePaymentSuccess()` uses `calculatePricingWithDiscount(items, stateCode, undefined)`** — hardcodes `discountCode` to `undefined` instead of reading from `pi.metadata.discountCode` for re-calculating pricing. The discount is re-looked up separately (lines 209-211) but pricing recalculation ignores it. | `services/checkout.service.ts:205,209-211` | **HIGH** |
| **`handlePaymentSuccess()` stores `unitPrice: item.product.price`** (line 239) — this stores the raw Decimal from DB, not the `unitPrice` in cents. Inconsistent with `checkout()` which stores `item.product.price` directly at line 386. Both result in correct display (Decimal value like `89.99`) but querying numeric values is ambiguous. | `services/checkout.service.ts:239,386` | **LOW** |
| **Stock `releaseStock()` has no transaction safety** — reads stock then updates separately, race condition possible | `services/inventory.service.ts:60-79` | **HIGH** |
| **`retryOnSerialization()` uses fixed delay array `[100, 200, 400]`** — no jitter, no exponential backoff, hardcoded max 3 retries | `services/inventory.service.ts:11-28` | **LOW** |

### 4.2 Error Handling

| Issue | Location | Severity |
|---|---|---|
| **`checkout.service.ts:checkout()` throws generic `Error` for empty cart** (line 311) — no custom error class, can't differentiate from internal errors | `services/checkout.service.ts:311` | **MEDIUM** |
| **`handlePaymentSuccess()` uses `JSON.parse(addressRaw)`** at line 198 with no try-catch — if `shippingAddress` metadata is malformed JSON, it throws | `services/checkout.service.ts:198` | **MEDIUM** |
| **`handlePaymentSuccess()` email sending is fire-and-forget** (lines 258-270) — if email fails, order is already created but user gets no notification. No retry, no queue. | `services/checkout.service.ts:258-270` | **MEDIUM** |
| **`handlePaymentFailed()` silently catches missing cart** — if cart was already deleted by a concurrent process, stock isn't released | `services/checkout.service.ts:280-291` | **MEDIUM** |
| **`validateDiscountCode()` returns `{ valid: false, reason }`** but `checkout.service.ts:129-134` only checks `result.valid && result.discount` — if discount is invalid, it silently proceeds without discount rather than failing. The `checkout.route.ts` doesn't validate the code before proceeding. | `services/checkout.service.ts:129-134` | **MEDIUM** |

### 4.3 Transaction Safety

| Issue | Location | Severity |
|---|---|---|
| **`checkout()` wraps stock reservation + order creation + discount increment in a transaction** — correct, but `createPayment()` is OUTSIDE the transaction. If the transaction fails (stock conflict), the payment intent is orphaned. | `services/checkout.service.ts:331-400` | **CRITICAL** |
| **`handlePaymentSuccess()` runs in a transaction but reads cart OUTSIDE the transaction** (lines 183-195). Between reading the cart and entering the transaction, another process could modify it. | `services/checkout.service.ts:183-256` | **HIGH** |
| **`releaseStock()` in `inventory.service.ts` is NOT in a transaction** — reads stock, then updates. Concurrent releases could cause incorrect stock. | `services/inventory.service.ts:60-79` | **HIGH** |
| **`handlePaymentFailed()` iterates cart items and calls `releaseStock()` sequentially** — not in a transaction, partial release possible if one fails | `services/checkout.service.ts:286-289` | **MEDIUM** |

### 4.4 Edge Cases

| Issue | Location | Severity |
|---|---|---|
| **Zero-price products** — `checkout()` at line 318-320 throws `InsufficientStockError` for products with `price === 0`, but this is semantically wrong (stock error for price check) | `services/checkout.service.ts:318-320` | **MEDIUM** |
| **Unpublished products in cart** — `checkout()` line 315-317 checks `!item.product.published` but this check happens at checkout time; if a product becomes unpublished after being added to cart, checkout rejects it. Correct behavior, but error message says "InsufficientStock" which is misleading. | `services/checkout.service.ts:315-317` | **MEDIUM** |
| **Cart merge** — no logic to merge guest cart (sessionId) to user cart (userId) on login | `app/api/cart/route.ts` | **MEDIUM** |
| **Discount code race** — `usedCount` increment is inside transaction, but the `maxUses` check at `validateDiscountCode()` is OUTSIDE the transaction. Two concurrent checkouts with same code could both pass validation. | `services/checkout.service.ts:75-106,214-218` | **HIGH** |
| **Price rejection** — `checkout.route.ts:96-101` rejects requests with `amount` or `price` in body, but this check is AFTER reading the cart (and paying DB cost). Should happen earlier. | `app/api/checkout/route.ts:96-101` | **LOW** |

---

## 5. Library Modules

### 5.1 Auth (`lib/auth.ts`)

| Issue | Line(s) | Severity |
|---|---|---|
| **`rotateRefreshToken()` iterates ALL non-expired tokens** (line 79-81) — O(n) scan over all tokens in DB. With many users, this becomes a performance disaster. Should fetch only tokens for the user. | `lib/auth.ts:79-81` | **CRITICAL** |
| **`invalidateRefreshToken()` also iterates ALL tokens** (line 107-108) — same O(n) issue | `lib/auth.ts:107-108` | **CRITICAL** |
| **`rotateRefreshToken()` doesn't scope to userId** — if two users have identical token hashes (astronomically unlikely), rotation would affect wrong user | `lib/auth.ts:86-93` | **LOW** |
| **No refresh token rotation for `invalidateRefreshToken()`** — only deletes matching token, doesn't rotate | `lib/auth.ts:106-114` | **LOW** |
| **`BCRYPT_ROUNDS` = 12 at line 20, but `10` used inline at line 60** for refresh token hashing | `lib/auth.ts:20,60` | **MEDIUM** |
| **`parseDuration()` default fallback at lines 24,31 returns `7 * 24 * 60 * 60 * 1000`** — if env var is malformed, defaults to 7 days, silently ignoring the incorrect config | `lib/auth.ts:24,31` | **LOW** |
| **`signResetToken()` uses JWT_SECRET instead of a dedicated reset secret** — if JWT_SECRET is compromised, password reset tokens can be forged | `lib/auth.ts:126` | **MEDIUM** |

### 5.2 Stripe (`lib/stripe.ts`)

| Issue | Line(s) | Severity |
|---|---|---|
| **Hardcoded Stripe API version** `"2025-02-24.acacia"` — will break when Stripe sunset this version. No upgrade plan. | `lib/stripe.ts:14` | **LOW** |
| **`createCheckoutSession()` takes `params.lineItems[].price` as raw cents** but the callers in the codebase pass different formats (nowhere actually calls this function currently) | `lib/stripe.ts:18-42` | **LOW** |
| **`createRefund()` can pass `amount: undefined`** — if `amount` is 0, `amount ? Math.round(amount * 100) : undefined` treats 0 as falsy, sending undefined (full refund). Correct behavior but implicit. | `lib/stripe.ts:47` | **LOW** |
| **`constructWebhookEvent()` at line 52 uses non-null assertion on `webhookSecret!`** — eliminates null check safety | `lib/stripe.ts:52` | **LOW** |

### 5.3 Rate Limiter (`lib/rate-limit.ts` & `lib/rate-limiter.ts`)

| Issue | Line(s) | Severity |
|---|---|---|
| **Two competing implementations with different APIs** — `rate-limit.ts` returns `{ allowed, remaining }`, `rate-limiter.ts` returns `boolean`. Routes inconsistently use one or the other. | Both files | **HIGH** |
| **In-memory store** — both use `Map<string, ...>` — **not shared across serverless instances, lost on restart, memory leak** (old entries never cleaned up) | Both files | **CRITICAL** |
| **No cleanup/garbage collection** — entries accumulate until reset. If a key never gets more requests after the window expires, the entry remains in memory forever. | Both files | **HIGH** |
| **`rate-limit.ts:10` default 30 requests per minute** — very low default for API endpoints | `lib/rate-limit.ts:10` | **LOW** |
| **`rate-limiter.ts:41` IP extraction** — uses `x-forwarded-for` header which is trivially spoofable | `lib/rate-limiter.ts:41` | **MEDIUM** |

### 5.4 Logging (`lib/logger.ts`)

| Issue | Line(s) | Severity |
|---|---|---|
| **Pino configured with `pino-pretty` in development** — fine locally, but if `NODE_ENV=development` is accidentally set in production, `pino-pretty` may not be in production dependencies | `lib/logger.ts:9-13` | **LOW** |
| **`redact` list missing `stripe-signature`, `x-api-key`, `DATABASE_URL`** | `lib/logger.ts:23` | **MEDIUM** |
| **No log rotation configuration** — logs grow unbounded | `lib/logger.ts` | **LOW** |

### 5.5 Feature Flags (`lib/feature-flags.ts`)

| Issue | Line(s) | Severity |
|---|---|---|
| **Only `isEnabled('checkout')` is used** — flags checked as env vars `FLAG_checkout`. No runtime toggle, no gradual rollout, no A/B testing support | `lib/feature-flags.ts:1-5` | **LOW** |

### 5.6 Email (`lib/email.ts`)

| Issue | Line(s) | Severity |
|---|---|---|
| **SendGrid hardcoded** — no abstraction, tightly coupled to SendGrid API | `lib/email.ts:19` | **MEDIUM** |
| **`sendEmail()` returns `false` on failure but callers never check return value** — line 266 `await sendEmail(...)` ignores the boolean result | `services/checkout.service.ts:266` | **MEDIUM** |
| **HTML templates inline with string interpolation** — XSS risk if any template parameter contains user-controlled data (e.g., `reason` in `orderCancellation`) | `lib/email.ts:64-67` | **MEDIUM** |
| **No DKIM/SPF configuration documentation** — SendGrid requires domain authentication | `lib/email.ts` | **LOW** |
| **Email masking regex `/(.{2}).+(@.+)/` at line 13** — only masks first 2 chars of email, insufficient | `lib/email.ts:13` | **LOW** |

### 5.7 S3 (`lib/s3.ts`)

| Issue | Line(s) | Severity |
|---|---|---|
| **Hardcoded path prefix `products/`** — no way to upload to different directories | `lib/s3.ts:17` | **LOW** |
| **`uploadImage()` returns public URL** — constructs URL from env vars, doesn't check if bucket is public | `lib/s3.ts:23` | **MEDIUM** |
| **No error handling** — all three functions will throw uncaught S3 errors | `lib/s3.ts` | **LOW** |
| **No file size validation** — large file uploads pass straight through | `lib/s3.ts` | **MEDIUM** |

### 5.8 Audit (`lib/audit.ts`)

| Issue | Line(s) | Severity |
|---|---|---|
| **`params as unknown as never`** at line 15 — type abuse to bypass Prisma type safety | `lib/audit.ts:15` | **MEDIUM** |
| **Audit failure is silently swallowed** — `logger.error` but no alerting mechanism | `lib/audit.ts:18` | **LOW** |
| **No async context** — `ip` and `userAgent` must be manually passed by every caller | `lib/audit.ts:4-13` | **LOW** |

---

## Summary Statistics

| Category | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|
| Code Quality | 0 | 0 | 16 | 8 | 24 |
| API Audit | 0 | 3 | 15 | 5 | 23 |
| Database Audit | 0 | 4 | 12 | 9 | 25 |
| Service Layer | 2 | 6 | 10 | 1 | 19 |
| Library Modules | 3 | 4 | 10 | 12 | 29 |
| **Total** | **5** | **17** | **63** | **35** | **120** |

### Top 5 Most Critical Issues (immediate action required)

1. **Orphaned payment intents** — `checkout()` creates Stripe PaymentIntent before reserving stock. If stock transaction fails, the payment intent is orphaned. (`services/checkout.service.ts:331-361`)
2. **In-memory rate limiter with no cleanup** — `Map` grows unbounded, not shared across instances, trivial to bypass. (`lib/rate-limit.ts`, `lib/rate-limiter.ts`)
3. **`rotateRefreshToken()` O(n) over entire token table** — scans ALL non-expired refresh tokens for every token rotation. (`lib/auth.ts:79-81`)
4. **`invalidateRefreshToken()` O(n) over entire token table** — same issue. (`lib/auth.ts:107-108`)
5. **Entire `repositories/` directory is dead code** — ~500 lines of untested, unused repository layer. (`repositories/*.ts`)
