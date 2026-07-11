# Fix Review Findings — PineNova E-Commerce

**Purpose**: apply only targeted fixes.

Fix only confirmed review findings.

### Constraints

- smallest safe change
- no new features
- run relevant tests
- summarize changed files
- flag anything requiring a security or payments sign-off before merge

---

## US1+US2 — Browse & Product Detail (P1) ✅ FIXED

### Findings and fixes applied

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| F1 | `render` returned ALL products instead of filtering `isArchived: false` | Added `where: { isArchived: false }` to Prisma query | `lib/api-utils.ts:renderProducts` | `GET /api/products` omits archived products |
| F2 | `generateMetadata` missing on category page, product listing, homepage | Added `generateMetadata` export to each page with dynamic title/description | `app/(storefront)/products/page.tsx`, `app/(storefront)/products/[slug]/page.tsx`, `app/(storefront)/categories/[slug]/page.tsx`, `app/page.tsx` | Each page `<title>` renders correct text; `og:title` present |
| F3 | `useCallback` unnecessarily wrapping debounced filter handler | Removed `useCallback` wrapper | `components/ProductFilters.tsx` | Filter still works, no re-render issue |
| F4 | Reviews query used `take: 10` then `slice(0, 3)` | Changed Prisma query to `take: 3` | `app/(storefront)/products/[slug]/page.tsx` | Details page shows exactly 3 reviews |
| F5 | Product listing page destructured non-existent `searchParams` | Simplified to read params from `searchParams` object directly | `app/(storefront)/products/page.tsx` | Page renders without console errors |
| F6 | Price formatting tests were tautological (testing JS `toFixed` built-in) | Removed tautological tests | `tests/integration/products.test.ts` | Test suite still passes, count adjusted |
| F7 | No `minPrice > maxPrice` cross-validation test | Added Zod `.refine()` + test | `app/api/products/route.ts`, `tests/integration/products.test.ts` | `GET /api/products?minPrice=100&maxPrice=50` returns 400 |

### Security/payments sign-off required

None — all read-only endpoints, no auth, no payment data.

---

## US3a — Cart (P1) ⏳ PENDING

### Anticipated findings (fill from code review)

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

### Sign-off checklist

- [ ] No payment data in cart (stores only `variantId` + `qty`)
- [ ] Cart ownership verified — wrong sessionId returns empty cart, not another user's data
- [ ] CSRF on all mutation endpoints (POST/PATCH/DELETE) — forged `Origin` returns 403
- [ ] Rate limiting 30 req/min — 31st request returns 429
- [ ] Idempotent add — double-click produces merged qty, not duplicate row
- [ ] `variantId` validated exists in DB via Prisma

### Test run

- [ ] `npx vitest run` — cart tests pass
- [ ] `npx tsc --noEmit` — zero type errors in new files
- [ ] Manual: add product → navigate to cart → see item → update qty → remove → empty state
- [ ] Manual: two browser tabs, same item added → combined quantity
- [ ] Manual: double-click "Add to Cart" → one item, not two

### Files changed

<!-- List all modified files -->

---

## US3b — Checkout (P1) ⏳ PENDING ⚠️ REVIEW REQUIRED

### Anticipated findings (fill from code review)

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

### Sign-off checklist

- [ ] Stripe webhook signature verified — tampered body returns 400
- [ ] Idempotency key on `stripe.paymentIntents.create` — no duplicate PIs on retry
- [ ] Webhook replay idempotent — event ID dedup in DB; duplicate event → 200 no-op
- [ ] Transaction scope correct — Stripe API OUTSIDE DB transaction; on Stripe failure, stock released
- [ ] Deadlock retry maxRetries=3 with backoff
- [ ] `clientSecret` never logged
- [ ] Email failure does not roll back order
- [ ] Server-authoritative pricing — price from client body rejected
- [ ] No PII in logs — address fields not in structured log data
- [ ] `calculatePricing` rounding correct: `Math.floor` for charges, `Math.round` for tax
- [ ] `noindex` on checkout + confirmation pages
- [ ] Feature flags gate checkout + payment → disabled returns 503

### Test run

- [ ] `npx vitest run` — all pricing, inventory, checkout tests pass
- [ ] Stripe CLI: `stripe trigger payment_intent.succeeded` → order created; replay → no duplicate
- [ ] Stripe CLI: tampered webhook body → 400
- [ ] Full guest checkout flow against Stripe test mode
- [ ] Load test: 20 concurrent users, same last item → 1 succeeds, inventory = 0
- [ ] PCI SAQ A completed in `docs/pci-saq-a.md` (prerequisite for production)

### Files changed

<!-- List all modified files -->

---

## US4 — Account Creation & Order History (P2) ⏳ PENDING ⚠️ REVIEW REQUIRED

### Anticipated findings (fill from code review)

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

### Sign-off checklist

- [ ] Passwords NEVER logged — `git grep` for `password` in log calls returns zero (except hash/verify functions)
- [ ] CSRF on all auth POST endpoints
- [ ] Rate limiting: 10 req/min login, 5/min register, 3/min password reset
- [ ] Password hashing bcrypt cost ≥ 12 or argon2id
- [ ] Account lockout after 10 consecutive failed attempts (15 min)
- [ ] Refresh token rotation — reused old token returns 401
- [ ] Password reset two-step: generic "If the email exists..." message prevents enumeration
- [ ] JWT on account endpoints — 401 missing, 403 wrong user
- [ ] GDPR deletion soft-delete (`deletedAt`), email → hash, orders preserved
- [ ] All auth/account pages have `noindex`

### Test run

- [ ] `npx vitest run` — auth + account tests pass
- [ ] Manual: register → login → view orders → download data (valid JSON) → delete account → login blocked
- [ ] 11th login attempt → 429
- [ ] Reused refresh token → 401
- [ ] Expired reset token → 400
- [ ] Duplicate email → 409

### Files changed

<!-- List all modified files -->

---

## US5+US6 — Admin Dashboard (P2) ⏳ PENDING ⚠️ REVIEW REQUIRED

### Anticipated findings (fill from code review)

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

### Sign-off checklist

- [ ] Admin role checked from JWT on every endpoint — non-admin → 403
- [ ] CSRF on all admin mutation endpoints
- [ ] Rate limiting 60 req/min on admin endpoints
- [ ] Refund idempotent via Stripe idempotency key — double-click → one refund
- [ ] Order status transitions validated — invalid (e.g., DELIVERED→SHIPPED) → 409
- [ ] Negative stock rejected → 409 with audit trail
- [ ] Multi-admin conflict warning on stock edits
- [ ] All admin actions logged with `adminId`, no PII in logs
- [ ] Admin activity log (`AdminLog`) for security auditing
- [ ] Admin pages have `noindex`
- [ ] JWT expiry on admin page → redirect to login, not white screen

### Test run

- [ ] `npx vitest run` — admin tests pass
- [ ] Manual: admin login → create product → verify on storefront → archive → gone from storefront
- [ ] Order status transitions: PENDING→CONFIRMED→PROCESSING→SHIPPED→DELIVERED
- [ ] Invalid transition → 409
- [ ] Refund → Stripe refund created + order status updated
- [ ] Negative inventory → 409
- [ ] Non-admin → 403 on every endpoint

### Files changed

<!-- List all modified files -->

---

## US7 — Discount Codes & Promotions (P3) ⏳ PENDING

### Anticipated findings (fill from code review)

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

### Sign-off checklist

- [ ] Percentage discount > 100% rejected at creation
- [ ] Duplicate discount code rejected at creation
- [ ] `usedCount` incremented atomically inside checkout transaction (no double-use)
- [ ] Discount never reduces total below 0 (clamped at zero)
- [ ] Single code per checkout (no stacking)

### Test run

- [ ] `npx vitest run` — discount validation tests pass
- [ ] Manual: create code → apply at checkout → exceed max uses → rejection
- [ ] Discount > subtotal → total = 0 (not negative)

### Files changed

<!-- List all modified files -->

---

## US8 — SEO Content & Blog (P3) ⏳ PENDING

### Anticipated findings (fill from code review)

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

### Sign-off checklist

- [ ] Sitemap excludes `noindex` pages (cart, checkout, auth, account, admin)
- [ ] Blog slug validated — null bytes/special chars → 400, not 500
- [ ] Canonical URLs on blog listing and detail
- [ ] schema.org `Article` JSON-LD validates on blog detail
- [ ] `og:image` on product pages pointing to first product image
- [ ] Twitter Card meta tags on product + blog pages
- [ ] `robots.txt` references sitemap
- [ ] Admin blog CRUD guarded by admin role check
- [ ] Duplicate blog slug → 409

### Test run

- [ ] `npx vitest run` — all tests pass
- [ ] `GET /sitemap.xml` — valid XML, no `noindex` URLs
- [ ] `GET /robots.txt` — includes `Sitemap:` reference
- [ ] Blog page loads with published posts; unpublished returns 404
- [ ] Invalid blog slug returns 400, not 500

### Files changed

<!-- List all modified files -->
