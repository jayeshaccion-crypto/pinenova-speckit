# Sprint 7 Implementation Findings

**Generated:** 12 July 2026  
**Scope:** US-E5-01 through US-E5-05 (Order Management) + US-E7-01 (Product Reviews)  
**Method:** Full source code audit against acceptance criteria in `docs/epics-and-stories.md`

---

## Summary

| Metric | Value |
|--------|-------|
| Stories implemented | 6/6 |
| Total findings | 31 |
| Critical | 0 |
| High | 4 |
| Medium | 13 |
| Low | 14 |
| Findings resolved | 0 (from Sprint 6 code review) |

---

## High Severity Findings

### H-01: Average rating and count computed from only 3 latest reviews

- **File:** `app/(storefront)/products/[slug]/page.tsx` lines 33-38, 50-52, 189
- **Story:** US-E7-01
- **Issue:** Prisma query uses `take: 3` to fetch only the 3 most recent approved reviews. The displayed average rating and count are computed from these 3 reviews. A product with 12 reviews will show average based on 3 and display "3 reviews".
- **Evidence:**
  ```
  // Line 33-38: take: 3 limits to 3 reviews
  reviews: { where: { status: "APPROVED" }, take: 3, orderBy: { createdAt: "desc" } }
  // Line 50-52: avg computed from product.reviews (max 3)
  // Line 189: count shows product.reviews.length (max 3)
  ```
- **Fix:** Query count and avg of ALL approved reviews via separate Prisma aggregation, or remove `take: 3` and slice in-memory.

### H-02: Index-as-key on review list (key={i})

- **File:** `app/(storefront)/products/[slug]/page.tsx` line 194
- **Story:** US-E7-01
- **Issue:** Array index used as React key. Causes stale DOM, broken transitions, and accessibility regressions on reorder.
- **Root cause:** Prisma select at line 35 omits `id: true`
- **Fix:** Add `id: true` to Prisma select; change `key={i}` to `key={review.id}`

### H-03: No purchase validation on review submission

- **File:** `app/api/products/[slug]/reviews/route.ts` lines 48-64
- **Story:** US-E7-02
- **Issue:** Any authenticated user can review any product. No check that user has a confirmed order containing the product.
- **AC:** "Only customers with a confirmed order containing the product may review"
- **Fix:** Query for order with status CONFIRMED/SHIPPED/DELIVERED containing this product before creating review.

### H-04: 403 and 404 on order detail silently redirect

- **File:** `app/(storefront)/account/orders/[id]/page.tsx` line 65
- **Story:** US-E5-02
- **Issue:** Both 403 (wrong user) and 404 (bad order ID) trigger `router.push("/account")`. No dedicated error page.
- **AC:** "Order ID not found — 404 page" and "Order belongs to a different user — 403 Forbidden"
- **Fix:** Use `next/navigation` `notFound()` for 404; render a 403 error state for forbidden access.

---

## Medium Severity Findings

### M-01: Status badge colors inverted from AC

- **File:** `app/(storefront)/account/page.tsx` lines 24-31
- **Story:** US-E5-01
- **AC:** confirmed=blue, shipped=green
- **Actual:** CONFIRMED → badge-gray (fallthrough), SHIPPED → badge-blue
- **Fix:** Add `if (status === "CONFIRMED") return "badge-blue"`; change SHIPPED to `return "badge-green"`

### M-02: Status timeline missing actor name

- **File:** `app/(storefront)/account/orders/[id]/page.tsx` lines 153-157
- **Story:** US-E5-02
- **AC:** "Timeline entries include: status name, timestamp, and (for admin actions) actor name"
- **Actual:** `log.changedBy` is never rendered. The field exists in the API response but is not displayed.

### M-03: Missing "No reviews yet" empty state

- **File:** `app/(storefront)/products/[slug]/page.tsx` lines 186-210
- **Story:** US-E7-01
- **AC:** "I see 'No reviews yet. Be the first to review this product!' with a CTA to write one"
- **Actual:** When `product.reviews.length === 0`, the reviews section shows nothing between the heading and the form.

### M-04: Duplicate reviews when AllReviews expanded

- **File:** `app/(storefront)/products/[slug]/page.tsx` lines 193-203
- **Story:** US-E7-01
- **Issue:** Server renders 3 latest reviews. AllReviews fetches page 1 (latest 20). Same 3 reviews appear twice.

### M-05: Customer name shows only first name

- **Files:** `app/(storefront)/products/[slug]/page.tsx:196`, `components/AllReviews.tsx:49`, `api/products/[slug]/reviews/route.ts:19`
- **Story:** US-E7-01
- **AC:** "customer name (first + last initial)"
- **Issue:** Prisma select only includes `firstName`. No `lastName` available to render last initial.

### M-06: AllReviews silently swallows errors

- **File:** `components/AllReviews.tsx` line 29
- **Story:** US-E7-01
- **Issue:** `.catch(() => {})` — all fetch/network errors invisible. User sees stale or empty state.

### M-07: No HTTP response status check in AllReviews

- **File:** `components/AllReviews.tsx` lines 24-28
- **Story:** US-E7-01
- **Issue:** `.then(r => r.json())` without checking `r.ok`. 4xx/5xx responses treated as successful with empty data.

### M-08: Unauthenticated users redirected instead of seeing CTA

- **Files:** `app/(storefront)/products/[slug]/page.tsx:208`, `components/ReviewForm.tsx:19-22`
- **Story:** US-E7-01
- **AC:** "Unauthenticated user sees 'Log in to write a review' CTA"
- **Actual:** ReviewForm silently redirects to `/login` without any inline CTA.

### M-09: AllReviews pagination uses 20 per page not 10

- **File:** `components/AllReviews.tsx` line 23
- **Story:** US-E7-01
- **AC:** "Pagination: 10 reviews per page"
- **Actual:** `limit=20`

### M-10: Synchronous params (Next.js 15 incompatible)

- **Files:** `api/products/[slug]/reviews/route.ts:7,34`, `products/[slug]/page.tsx:10,28,46`
- **Story:** All
- **Issue:** Next.js 15 requires `params: Promise<...>` with `await`. Current synchronous pattern is deprecated.

### M-11: Nonce header name incompatible with Next.js

- **File:** `middleware.ts` line 133
- **Story:** N/A (pre-existing)
- **Issue:** `X-CSP-Nonce` should be `x-nonce`. Next.js looks for lowercase `x-nonce` to auto-apply to inline scripts.

### M-12: AccessToken cookie missing HttpOnly/Secure

- **File:** `app/(storefront)/account/auth/login/page.tsx` line 36
- **Story:** US-E2-02
- **Issue:** Cookie set without `HttpOnly` or `Secure` flags. Readable by JavaScript — XSS exploitable.

### M-13: Order detail page uses `<img>` instead of `<Image />`

- **File:** `app/(storefront)/account/orders/[id]/page.tsx` line 104
- **Story:** US-E5-02
- **Issue:** Uses native `<img>` instead of Next.js `<Image />`. Slower LCP, no optimization.

---

## Low Severity Findings

| ID | File | Line | Issue |
|----|------|------|-------|
| L-01 | `reviews/route.ts` | 42 | Uncaught JSON parse error on malformed body |
| L-02 | `AllReviews.tsx` | 43 | "No more reviews" misleading when page=1 |
| L-03 | `ReviewForm.tsx` | 50 | `res.json()` can throw on non-JSON response |
| L-04 | `AdminPage.tsx` | 161-167 | `statusBadgeClass` doesn't handle PARTIALLY_REFUNDED |
| L-05 | `AdminPage.tsx` | 244-252 | PENDING and PARTIALLY_REFUNDED missing from filter |
| L-06 | `AdminPage.tsx` | 199 | `totalPages \|\| 1` — 0 coerced to 1 |
| L-07 | `AdminPage.tsx` | 292 | Empty string reason sent on cancel |
| L-08 | `AdminPage.tsx` | 291 | SHIPPED→CANCELLED transition in backend but not in UI |
| L-09 | `admin/orders/route.ts` | 81 | `as any` type cast |
| L-10 | `admin/orders/route.ts` | 82-83 | trackingNumber/carrier written on ALL status updates |
| L-11 | `admin/orders/route.ts` | 166 | Idempotency key uses Date.now() (ms collision) |
| L-12 | `admin/orders/route.ts` | 100-106 | No log when email skipped due to missing `order.email` |
| L-13 | `AdminPage.tsx` | 180 | Unnecessary `origin: window.location.origin` in headers |
| L-14 | `products/[slug]/page.tsx` | 189 | Average rating in reviews section, not "near title" |

---

## Resolution Status (Sprint 6 Findings)

| Sprint 6 Finding | Status | Notes |
|-----------------|--------|-------|
| Race condition on duplicate review | ✅ Fixed | Wrapped in `prisma.$transaction` |
| Product lookup missing `published: true` | ✅ Fixed | Added to `findUnique` |
| Duplicate check blocks rejected resubmit | ✅ Fixed | Excluded REJECTED |
| Dead `productId` prop in ReviewForm | ✅ Fixed | Removed |
| No login redirect on unauthenticated | ✅ Fixed | Redirects to `/login` |
| `useCallback` ineffective in SearchBar | ✅ Fixed | Replaced with regular function |
| No min length on `q` param | ✅ Fixed | Added `.min(2)` |
| Missing `aria-label` on SearchBar input | ✅ Fixed | Added |
| Missing `aria-label` on star buttons | ✅ Fixed | Added |
| JWT expiry check missing in ReviewForm | ✅ Fixed | Added client-side check |

---

## File-by-File Issue Count

| File | High | Medium | Low | Total |
|------|------|--------|-----|-------|
| `products/[slug]/page.tsx` | 2 | 3 | 1 | 6 |
| `reviews/route.ts` | 1 | 1 | 1 | 3 |
| `AllReviews.tsx` | 0 | 3 | 1 | 4 |
| `account/page.tsx` | 0 | 1 | 0 | 1 |
| `account/orders/[id]/page.tsx` | 1 | 2 | 1 | 4 |
| `ReviewForm.tsx` | 0 | 1 | 1 | 2 |
| `AdminPage.tsx` | 0 | 0 | 5 | 5 |
| `admin/orders/route.ts` | 0 | 0 | 4 | 4 |
| `middleware.ts` | 0 | 1 | 0 | 1 |
| `login/page.tsx` | 0 | 1 | 0 | 1 |
| **Total** | **4** | **13** | **14** | **31** |
