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

## US3b — Checkout (P1) ⚠️ REVIEW REQUIRED

**Constraints**: same as above.

### Findings

| # | Finding | Fix | Files changed | Validation |
|---|---------|-----|---------------|------------|
| | | | | |

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
