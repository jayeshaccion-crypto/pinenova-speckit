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

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| F1 | `render` returned ALL products, not just `isArchived: false` | Added `where: { isArchived: false }` to Prisma query | `lib/api-utils.ts` | Archived products excluded from listing |
| F2 | `generateMetadata` missing on category, listing, homepage pages | Added `generateMetadata` export to each page | `app/(storefront)/products/page.tsx`, `app/(storefront)/products/[slug]/page.tsx`, `app/(storefront)/categories/[slug]/page.tsx`, `app/page.tsx` | Each page `<title>` renders correct text |
| F3 | `useCallback` wrapping debounced filter unnecessarily | Removed `useCallback` wrapper | `components/ProductFilters.tsx` | Filter still works, no re-render issue |
| F4 | Reviews `take: 10` + `slice(0, 3)` | Changed query to `take: 3` | `app/(storefront)/products/[slug]/page.tsx` | Detail page shows 3 reviews |
| F5 | Page destructured non-existent `searchParams` | Simplified to read params directly | `app/(storefront)/products/page.tsx` | No console errors |
| F6 | Price formatting tests were tautological | Removed tests | `tests/integration/products.test.ts` | Test suite still passes |
| F7 | No `minPrice > maxPrice` cross-validation | Added Zod `.refine()` + test | `app/api/products/route.ts`, `tests/integration/products.test.ts` | Invalid range returns 400 |

**Sign-off**: None required — all read-only endpoints, no auth, no payment data.

---

## US3a — Cart (P1)

**Constraints**: same as above.

### Findings

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

**Sign-off required if**: payment data exposure, auth bypass, ownership leak.

---

## US3b — Checkout (P1) ✅ FIXED

**Constraints**: same as above.

### Findings

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| F1 | `usedCount` never incremented after successful checkout — `maxUses` limit is dead | Added `discountCode.update({ usedCount: { increment: 1 } })` inside both `checkout()` and `handlePaymentSuccess()` transactions; stored `discountCode` in PaymentIntent metadata for webhook path | `services/checkout.service.ts` | Discount code with `maxUses=1` can only be used once |
| F2 | No zero-price product guard — $0 product proceeds to free checkout | Added `if (Number(item.product.price) === 0)` check → thrown `InsufficientStockError` (maps to 409) | `services/checkout.service.ts` | Zero-price product returns 409 |
| F3 | Dead code in `calculatePricing()` — bare `subtotal; discountAmount;` expressions | Removed dead code lines and simplified tax calculation | `services/checkout.service.ts` | No change in behavior; tests still pass |
| F4 | `generateOrderNumber()` used `Math.random()` — predictable, PCI concern | Replaced with `crypto.randomUUID().slice(0, 4).toUpperCase()` | `services/checkout.service.ts` | Order numbers use CSPRNG |
| F5 | Rate limit keyed by IP not session (spec says "per session") | Changed `checkout:${ip}` to `checkout:${sessionId}`; moved sessionId check before rate limit gate | `app/api/checkout/route.ts` | Same session from different IPs shares rate limit; removed unused `getClientIp` |
| F6 | CSRF gap — both `origin` and `referer` headers absent bypasses check | Added `if (!origin && !referer)` guard → returns 403 CSRF_REJECTED | `app/api/checkout/route.ts` | No-header request returns 403 |
| F7 | Feature flag defaulted to `true` — checkout accessible without explicit `FLAG_checkout=true` | Changed default to `false` — opt-in via env var | `lib/feature-flags.ts` | Checkout returns 503 when `FLAG_checkout` env var unset |

**Sign-off required if**: Stripe key handling, webhook idempotency, inventory concurrency, price tampering, PII in logs.

---

## US4 — Account Creation & Order History (P2) ⚠️ REVIEW REQUIRED

**Constraints**: same as above.

### Findings

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

**Sign-off required if**: password/token logging, auth bypass, GDPR data leak.

---

## US5+US6 — Admin Dashboard (P2) ⚠️ REVIEW REQUIRED

**Constraints**: same as above.

### Findings

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

**Sign-off required if**: admin auth bypass, refund double-charge, inventory corruption.

---

## US7 — Discount Codes & Promotions (P3)

**Constraints**: same as above.

### Findings

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

**Sign-off required if**: discount validation bypass, race condition on usedCount.

---

## US8 — SEO Content & Blog (P3)

**Constraints**: same as above.

### Findings

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

**Sign-off required if**: admin auth bypass on blog CRUD.
