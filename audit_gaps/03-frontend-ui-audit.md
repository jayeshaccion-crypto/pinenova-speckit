# Frontend UI/UX Audit Report — PineNova

**Audit Date:** 2026-07-12
**Scope:** Storefront pages, components, user flows, responsiveness, state management, SEO, performance
**Files Audited:** All pages under `app/(storefront)/`, `app/admin/`, `app/layout.tsx`, `app/error.tsx`, `app/not-found.tsx`, `components/*.tsx`, `styles/globals.css`, `tailwind.config.ts`, `middleware.ts`

---

## 1. Page Inventory

| Route | File | Purpose | State | Issues |
|-------|------|---------|-------|--------|
| `/` | `app/page.tsx:28-79` | Homepage — hero, categories, featured products | ✅ Complete | No structured data; categories fetched but grid uses few items; no `loading.tsx` |
| `/products` | `app/(storefront)/products/page.tsx:54-82` | Product listing with filters, pagination query | ⚠️ Partial | Filters wired up but **pagination UI missing**; `Suspense` boundary for filters only; `total` data exists but no page controls |
| `/products/[slug]` | `app/(storefront)/products/[slug]/page.tsx:43-216` | Product detail — images, reviews, structured data | ✅ Complete | Rich structured data; breadcrumbs; but no review submission form |
| `/categories/[slug]` | `app/(storefront)/categories/[slug]/page.tsx:49-68` | Category product listing, no filters | ⚠️ Partial | **No filter sidebar** (unlike `/products`); no structured data; no pagination |
| `/cart` | `app/(storefront)/cart/page.tsx:85-179` | Shopping cart — client-side, session-based | ✅ Complete | Good error/loading/empty states; but no optimistic updates |
| `/checkout` | `app/(storefront)/checkout/page.tsx:69-292` | Checkout — address, discount, Stripe payment | ⚠️ Partial | No shipping method selection; no address validation on blur; `elements: undefined as any` (L157) is a dangerous type bypass |
| `/checkout/confirmation` | `app/(storefront)/checkout/confirmation/page.tsx:34-129` | Order confirmation — server-rendered | ✅ Complete | Good order summary; but no guest email capture in checkout so confirmation may show no email |
| `/account` | `app/(storefront)/account/page.tsx:15-198` | Account dashboard — orders list, settings | ⚠️ Partial | **User profile not loaded** (L47: `firstName` hardcoded to `""`); **no order detail page**; no profile editing; no address management; no password change |
| `/account/auth/login` | `app/(storefront)/account/auth/login/page.tsx:85-91` | Login form | ✅ Complete | Handles registered redirect; wrapped in `Suspense` for `useSearchParams` |
| `/account/auth/register` | `app/(storefront)/account/auth/register/page.tsx:7-103` | Registration form | ✅ Complete | Password confirmation match check; no terms checkbox |
| `/account/reset-password` | `app/(storefront)/account/reset-password/page.tsx:114-123` | Password reset request + reset form | ⚠️ Partial | **Single page handles both request and reset** via token param; no dedicated "forgot password" route; `Suspense` wrapper correct |
| `/admin` | `app/admin/page.tsx:11-13` | Admin dashboard — 5 tabs | ⚠️ Partial | **No admin layout** (no sidebar, no header); **no role-based access** in middleware; **no pagination** on tables; **no image upload** in product form |
| `/` (404) | `app/not-found.tsx:3-13` | Global 404 | ✅ Complete | Minimal but functional |
| `/` (error) | `app/error.tsx:3-13` | Global error boundary | ✅ Complete | Has reset button |
| `/products/not-found` | `app/(storefront)/products/not-found.tsx` | Products not found | ✅ Complete | Has "Browse all" link |
| `/products/error` | `app/(storefront)/products/error.tsx` | Products error boundary | ✅ Complete | Has reset button |
| `/products/[slug]/error` | `app/(storefront)/products/[slug]/error.tsx` | Product detail error boundary | ✅ Complete | Has reset button |
| `/cart/error` | `app/(storefront)/cart/error.tsx` | Cart error boundary | ✅ Complete | Has reset button |

### Missing Pages

| Missing Route | Severity | Reason |
|---------------|----------|--------|
| `/search` | High | No search functionality exists anywhere — no search input in nav, no search route |
| `/account/orders/[id]` | High | Order list on account page has no clickable links; user cannot view order detail |
| `/account/profile` | Medium | No profile editing page |
| `/account/addresses` | Medium | No address book management |
| `/about` | Low | No brand/about page |
| `/contact` | Low | No contact/support page |
| `/faq` | Low | No FAQ page |
| `/shipping-returns` | Medium | No policy page (required for ecommerce) |
| `/privacy` | Medium | No privacy policy page |
| `/terms` | Medium | No terms of service page |
| Blog routes | Medium | No blog/posts routes despite article schemas existing in `types/index.ts` |

---

## 2. Component Audit

### AdminPage.tsx (`components/AdminPage.tsx`)

**CRITICAL ISSUE: This is a 471-line monolithic component antipattern.** It contains 8 sub-components — `AdminProductsTab`, `ProductForm`, `AdminOrdersTab`, `AdminInventoryTab`, `AdjustStockForm`, `AdminDiscountsTab`, `DiscountForm`, `AdminMetricsTab` — all in one file.

| Concern | Detail |
|---------|--------|
| **Props** | `AdminPage` takes no props, reads `token` from localStorage (L27) |
| **State handling** | Each tab manages its own loading/error state separately; no shared state pattern |
| **Template literal bug** | L220: `` <span className="badge-${o.status...}"> `` — This is a **JSX runtime bug**. Backtick strings in JSX attributes do NOT evaluate as template expressions — they render as literal string ``badge-${o.status...}``. Must use dynamic class expression instead. **No badge styling works on order status**. |
| **Error state** | `AdminProductsTab`: error silently swallowed (L82: `catch { /* ignore */ }`) |
| **Loading state** | Each tab shows "Loading..." text — no skeleton/placeholder |
| **Empty state** | Tables render with empty `<tbody>` if no data — no "No records found" message |
| **Accessibility** | Tab buttons (L50-56) have no `aria-selected`, no `role="tablist"`, no `aria-controls` |
| **Re-fetch after mutation** | Every create/update/delete re-fetches the **entire list** — inefficient; no optimistic updates |
| **Security** | Token stored in `localStorage` and passed as Bearer header; no httpOnly cookie auth for admin |

### AddToCartButton.tsx (`components/AddToCartButton.tsx`)

| Concern | Detail |
|---------|--------|
| **Props** | `productId`, `productName`, `stock`, `variant` — well-typed |
| **State handling** | 3-state machine: `idle` → `added` → (timeout) → `idle`, plus `error`. Good. |
| **Loading state** | Shows "Adding..." while fetching |
| **Error state** | Shows "Added to Cart!" on success but error shows nothing (button returns to "Add to Cart") — **no visible error feedback** when request fails |
| **Empty/edge** | `stock <= 0` disables button and shows "Out of Stock" |
| **Accessibility** | Icon variant has `title` attribute; no `aria-label` used though |
| **Missing** | No cart count badge on nav — button adds item but header cart icon doesn't update globally |

### ProductCard.tsx (`components/ProductCard.tsx`)

| Concern | Detail |
|---------|--------|
| **Props** | `product` object — inline interface, well-typed |
| **State handling** | Server component — no local state |
| **Image missing** | ✅ Shows placeholder SVG when no image |
| **Stock states** | ✅ Handles out-of-stock badge and low-stock badge |
| **Link wrapping** | Two `<Link>` elements (image + info) — slightly redundant but functional |
| **Missing** | No `alt` descriptive generation for images |
| **Accessibility** | AddToCartButton in absolute-positioned container — tab order may be unexpected |

### ProductGrid.tsx (`components/ProductGrid.tsx`)

| Concern | Detail |
|---------|--------|
| **Props** | `products` array — typed inline |
| **Empty state** | ✅ Good: SVG icon + message "No products found" |
| **Responsive grid** | ✅ `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |
| **Missing** | No loading/skeleton variant; no pagination controls |

### ProductFilters.tsx (`components/ProductFilters.tsx`)

| Concern | Detail |
|---------|--------|
| **Props** | `filters`, `onFilterChange` — well-typed |
| **Category list** | Hardcoded array (L3-8) — should be fetched from API or passed as prop |
| **Material list** | Hardcoded array (L10) — same issue |
| **Sort options** | Hardcoded — acceptable for limited options |
| **Missing** | No "Clear all filters" button; no price range filter (despite `ProductFilterSchema` supporting `minPrice`/`maxPrice`) |
| **Accessibility** | Radio inputs use `accent-primary` class — works but no `fieldset`/`legend` grouping |

### ProductsFilterBar.tsx (`components/ProductsFilterBar.tsx`)

| Concern | Detail |
|---------|--------|
| **Client-side** | Bridges URL search params ↔ filter state. Good pattern. |
| **Issue** | `useCallback` with `router` dependency — `router.push()` triggers full navigation, not shallow. Causes page reload. |
| **Missing** | No debounce on filter changes |

### CartItem.tsx (`components/CartItem.tsx`)

| Concern | Detail |
|---------|--------|
| **Props** | `item`, `onUpdateQuantity`, `onRemove` — well-typed |
| **Loading state** | Shows "Updating..." text and disables select — acceptable |
| **Quantity select** | `Array.from({ length: Math.min(product.stock, 99) })` — capped at 99 |
| **Error state** | No individual error display — errors bubble to parent global error banner |
| **Accessibility** | Remove button is just text "Remove" — consider `aria-label` |
| **Optimistic updates** | Not implemented — UI blocks on network |

### CartSummary.tsx (`components/CartSummary.tsx`)

| Concern | Detail |
|---------|--------|
| **Props** | `subtotal`, `itemCount` |
| **Empty state** | Disables checkout link with `pointer-events-none opacity-50` |
| **Missing** | Shipping/tax estimates show "Calculated at checkout" — acceptable for MVP |
| **Reuse** | Checkout page duplicates the order summary markup (checkout L262-288) instead of reusing CartSummary |

### PaymentForm.tsx (`components/PaymentForm.tsx`)

**⚠️ UNUSED COMPONENT** — `checkout/page.tsx` defines an inline `CheckoutForm` (L45-67) instead of importing this. Dead code.

| Concern | Detail |
|---------|--------|
| **Props** | `clientSecret`, `onConfirm`, `submitting`, `error` |
| **Stripe not configured** | ✅ Shows clear amber warning message |
| **Loading state** | ✅ Shows `animate-pulse` skeleton when no `clientSecret` |
| **Why unused** | Checkout page duplicated the logic inline instead of importing `PaymentForm` |

### ShippingForm.tsx (`components/ShippingForm.tsx`)

| Concern | Detail |
|---------|--------|
| **Props** | `value`, `onChange`, `errors` — well-typed with exported `ShippingAddress` interface |
| **Validation** | ✅ On-blur field-level error display with red border |
| **US states** | ✅ Complete 50-state list |
| **Missing** | ❌ No international shipping support (hardcoded US states only) |
| **Missing** | ❌ No phone number field |
| **Missing** | ❌ No email field (for guest checkout) |
| **Missing** | ❌ No country selector |

---

## 3. UI/UX Audit

### Responsive Design

| Area | Status | Issues |
|------|--------|--------|
| Breakpoints | ✅ `sm`, `md`, `lg`, `xl` used consistently | None |
| Mobile nav | ⚠️ Minimal | No hamburger menu, no mobile drawer — nav is just two links |
| Product grid | ✅ Responsive 1-4 columns | None |
| Cart page | ✅ `lg:grid-cols-3` with responsive stacking | None |
| Checkout | ✅ `lg:grid-cols-3` | None |
| Tables (admin) | ⚠️ Overflow-x-auto on tables | No responsive table variant for mobile (no card conversion on small screens) |
| Forms | ✅ `input-field` styles use `w-full` | None |
| Touch targets | ⚠️ Acceptable | Buttons are minimum 32px |

### Forms & Validation

| Form | Validation | Issues |
|------|-----------|--------|
| Login | Client-side: `required` attributes; Server-side: API returns errors | Good |
| Register | Client-side: password match check; Server-side: API returns `details` array | No password strength indicator; no show/hide password toggle |
| Reset password | Client-side: password match check | Good |
| Checkout — Shipping | Client-side: `validateAddress()` on submit; field-level on blur in ShippingForm | ✅ Best validation in project |
| Checkout — Discount | None client-side | No validation until server call |
| Admin — Product form | `required` HTML attrs | No category dropdown; no image upload; prices accept decimals but no sanitization |
| Admin — Inventory | Numeric input with `min="0"` | No validation that reason is non-empty |

### Navigation

| Element | Status | Issues |
|---------|--------|--------|
| Global header | `<header>` in root layout | Only has "Products" and "Cart" — **no account link**, no search, no mobile menu |
| Breadcrumbs | On product detail page only | No breadcrumbs on category, cart, checkout, or account pages |
| Admin navigation | Tab bar only | No sidebar, no persistent admin nav |
| Back navigation | Link to "/products" on category page | No explicit "Back" button patterns |

### Visual Feedback

| Interaction | Feedback | Issues |
|-------------|----------|--------|
| Add to cart | Button text changes to "Added to Cart!" for 2s | ✅ Good — but no cart count badge update in header |
| Loading states | Text-based ("Loading...", "Loading cart...") | No skeleton loading components exist anywhere |
| Error display | Red banner cards with dismiss/retry | ✅ Consistent pattern |
| Form validation errors | Red text below fields | ✅ Consistent |
| Button loading | "Processing...", "Signing in..." text | ✅ Consistent |
| Page transitions | None — default Next.js navigation | No loading bar or transition animations |

### Error Messages

| Issue | Pattern | Assessment |
|-------|---------|------------|
| Global error | `app/error.tsx` — generic "Something went wrong" | Good |
| Cart error | `cart/error.tsx` — "Unable to load cart" | Good |
| Products error | `products/error.tsx` — "Unable to load products" | Good |
| Product detail error | `[slug]/error.tsx` — "Unable to load product" | Good |
| Checkout errors | Specific codes: `INSUFFICIENT_STOCK`, `PAYMENT_PROVIDER_ERROR`, `MAINTENANCE`, `VALIDATION_ERROR` | ✅ Excellent — meaningful user-facing messages |
| Network errors | "Network error. Please check your connection." | ✅ Consistent |
| API 401 | Redirects to login with `redirect` param | ✅ In middleware and components |

### Color & Style Inconsistencies

| Location | Issue |
|----------|-------|
| `app/not-found.tsx:6` | Uses `text-neutral-900`, `bg-neutral-900` — but Tailwind config defines `foreground: "#1A1A1A"`, not neutral colors |
| `app/error.tsx:9` | Same neutral color usage |
| `app/(storefront)/products/not-found.tsx:10` | Same |
| All error/not-found pages | Use `rounded-lg bg-neutral-900` — should use custom `primary` color for brand consistency |
| `AdminPage.tsx:220` | Template literal bug — see above |

---

## 4. User Flow Audit

### Flow 1: Browse → Product → Add to Cart → Checkout → Payment → Confirmation

```
Home → Products → Product Detail → Cart → Checkout → Payment → Confirmation
```

| Step | Status | Issues |
|------|--------|--------|
| Home → Products | ✅ Via hero CTA, "View All", or nav link | |
| Products → Detail | ✅ Card click navigates to `/[slug]` | |
| Detail → Cart | ✅ AddToCartButton (primary or icon) | No animation or cart indicator |
| Cart → Checkout | ✅ CartSummary "Proceed to Checkout" link | No quantity recap in checkout (duplicated inline) |
| Checkout → Payment | ✅ Place Order button triggers `/api/checkout` → gets `clientSecret` | **Shipping and tax not calculated on frontend** — shows "Calculated at checkout" until payment |
| Payment → Confirmation | ✅ Stripe confirm + redirect/`router.push` | `elements: undefined as any` (L157) is dangerous — Stripe may not render properly |
| Confirmation → Continue | ✅ "Continue Shopping" link to `/products` | No "View Order" link to account detail (no such page exists) |

**Break points:**
1. **No cart quantity badge** — user adds item but header shows no count change
2. **Checkout has no progress stepper** — user doesn't know how many steps remain
3. **No shipping method selection** — free/express/standard not offered
4. **No guest checkout separation** — no way to identify if user is guest or logged in
5. **No email/password capture during guest checkout** — if user is not logged in, order has no user association

### Flow 2: Register → Login → Account → Order History

```
Register → Login → Account Dashboard → Order Detail (missing!)
```

| Step | Status | Issues |
|------|--------|--------|
| Register → Login | ✅ Redirects with `?registered=1` success message | |
| Login → Account | ✅ localStorage token + cookie set; redirect to `/account` | Token-based auth — no httpOnly cookie for accessToken despite middleware checking cookies |
| Account → Order History | ✅ Table of orders | |
| Order → Detail | ❌ **Missing** | Order numbers are plain text — no `<Link>` to a detail page |
| Account → Profile | ❌ **Missing** | No profile editing form |
| Account → Addresses | ❌ **Missing** | No address management |
| Account → Password | ❌ **Missing** | No password change form |

**Critical gap:** Account page L47-48 hardcodes user profile:
```typescript
setUser({ firstName: "", lastName: "", email: payload.sub || "" });
```
The user's actual name/email is **never fetched from an API** — only the JWT `sub` claim is used for email.

### Flow 3: Admin Flow

```
/admin → Login redirect → Tab-based dashboard
```

| Step | Status | Issues |
|------|--------|--------|
| `/admin` → auth check | ⚠️ Partial | Middleware checks `accessToken` cookie (L72-77) but **does not check admin role** — any authenticated user can access admin |
| Login → redirect | ⚠️ Broken | Middleware redirect to login (L75) does NOT preserve `redirect=/admin` in URL |
| Dashboard tabs | ✅ 5 tabs with query-param routing | |
| Products tab → CRUD | ⚠️ Partial | Create new product works; **edit product is missing** (only archive); no image upload field |
| Orders tab → Status updates | ✅ Status progression buttons | No search/filter; no order detail view |
| Orders tab → Refund | ✅ Refund button | No confirmation dialog before refund |
| Inventory → Stock adjust | ✅ Inline adjust form | No confirmation dialog |
| Discounts → CRUD | ✅ Create/deactivate | No edit |
| Metrics → CSV export | ✅ Download | No charts, no date range selector |
| **Logout** | ❌ **Missing** | Admin page has no sign-out button |

### Flow 4: Checkout Error Recovery

```
Checkout → error → fix → retry → success
```

| Error Scenario | Handling | Issue |
|----------------|----------|-------|
| Empty cart | Redirects to `/cart` | ✅ |
| Insufficient stock | Error message: "Some items are no longer in stock" | ✅ |
| Payment provider error | Error message: "Payment service is temporarily unavailable" | ✅ |
| Maintenance | Error message: "Checkout is under maintenance" | ✅ |
| Validation error | Shows API detail messages joined by comma | Acceptable but could be formatted per-field |
| Network error | "Network error. Please check your connection." | ✅ |
| Payment declined | Stripe error shown in red banner | ✅ |
| Session expired | "Session expired. Please reload." | Good detection |

---

## 5. Frontend Performance

### Bundle Concerns

| Issue | Severity | Detail |
|-------|----------|--------|
| `@tanstack/react-query` installed but unused | Medium | Listed in `package.json` but zero imports across all audited files. Adds ~13KB gzipped to bundle for no reason. |
| `react-hook-form` installed but unused | Medium | Listed in `package.json` but all forms use raw `useState`. Adds weight. |
| `zustand` installed but unused | Medium | Listed — could replace manual cart state management. |
| `AdminPage.tsx` 471 lines | High | All admin functionality in one client bundle — lazy-loading tabs via `next/dynamic` would reduce initial JS. |
| Inline `CheckoutForm` in checkout page | Low | Duplicated `PaymentForm` component — both are in bundle. |
| `pino`/`pino-pretty` server deps | Low | Server-only, not a frontend concern. |

### SSR vs Client Component Analysis

| Page | Render Strategy | Assessment |
|------|----------------|------------|
| Homepage | ✅ Server component (`async`) | Correct — no interactivity |
| Products listing | ✅ Server component | Correct — data fetching on server |
| Product detail | ✅ Server component | Correct — SEO-critical |
| Category | ✅ Server component | Correct |
| Cart | ✅ `"use client"` | Necessary for localStorage/interactivity |
| Checkout | ✅ `"use client"` | Necessary for Stripe |
| Confirmation | ✅ Server component | Correct — just display data |
| Login/Register | ✅ `"use client"` | Necessary |
| Account | ✅ `"use client"` | Necessary |
| Admin | ✅ `"use client"` | Necessary |

### Hydration & Rendering Issues

| Concern | Detail |
|---------|--------|
| `products/page.tsx:L72` | `<Suspense fallback>` only wraps `ProductsFilterBar` — not `ProductGrid`. If filter fetch is slow, products don't show but filters do (or vice versa). |
| No `loading.tsx` files | Zero loading.tsx files found. All loading states are manual `useState` in client components. Next.js `loading.js` convention not used. |
| Dynamic content in footer | `app/layout.tsx:L31` — `{new Date().getFullYear()}` — server-rendered, fine. |
| `crypto.randomUUID()` | Used in `AddToCartButton.tsx:L27` and `cart/page.tsx:L38` — works in modern browsers, but not available in older ones without polyfill. |

### Image Optimization

| Concern | Detail | Severity |
|---------|--------|----------|
| `next.config.js` remote patterns | Only allows `**.s3.amazonaws.com` and `**.vercel.app` | ⚠️ May break if images hosted elsewhere |
| No `sizes` attribute | All `<Image>` components use fixed width/height without `sizes` prop | Medium — extra bandwidth on responsive layouts |
| `ProductCard.tsx` | `<Image width={400} height={400}>` — no responsive sizes | Low |
| `Product detail` | `<Image width={600} height={600}>` — no responsive sizes | Low |
| `CartItem.tsx` | `<Image width={128} height={128}>` — fine for thumbnail | Acceptable |
| SVG allowed | `dangerouslyAllowSVG: true` | Low risk if images are trusted |

### State Management Gaps

| Gap | Detail | Impact |
|-----|--------|--------|
| No global cart state | Cart is fetched via API on each page load; no Zustand/React Query cache | Cart count badge can't be shown in nav |
| No optimistic updates | Cart quantity changes wait for API response before updating UI | Perceived slowness |
| No toast/notification system | Success feedback only via button text change (AddToCartButton) | User may miss feedback |
| JWT decoded client-side | Account page parses JWT with `atob()` to get email | Not a validation of token; no refresh logic visible on frontend |

---

## 6. SEO & Metadata Audit

### Per-Page Analysis

| Route | Title | Description | Canonical | OG Tags | Robots | Structured Data |
|-------|-------|-------------|-----------|---------|--------|----------------|
| `/` (root layout) | ✅ Template: `"%s \| PineNova"` default "PineNova — Vegan Leather Goods" | ✅ "Sustainable, cruelty-free accessories crafted from pineapple fiber" | ❌ Not set | ✅ `og:title`, `og:description`, `og:type:website` | Default (index/follow) | ❌ **No Organization, Website, or breadcrumb structured data** |
| `/` (homepage) | Uses root default | ✅ Override description | ✅ `/` | Inherits root | Inherits root | ❌ **Missing** |
| `/products` | ✅ Dynamic from category | ✅ Dynamic | ✅ `/products` | ❌ No specific OG | Default | ❌ **Missing product listing structured data** |
| `/products/[slug]` | ✅ Dynamic product name | ✅ Dynamic description | ✅ Canonical | ❌ No `og:image` | Default | ✅ **Product + BreadcrumbList JSON-LD** (L52-85) |
| `/categories/[slug]` | ✅ Dynamic category name | ✅ Dynamic | ✅ Canonical | ❌ No OG | Default | ❌ **Missing** |
| `/cart` | ✅ "Shopping Cart" | ❌ Not set (layout only) | ❌ Not set | ❌ | ✅ `noindex, nofollow` | N/A |
| `/checkout` | ✅ "Checkout" | ❌ Not set | ❌ Not set | ❌ | ✅ `noindex, nofollow` | N/A |
| `/checkout/confirmation` | ✅ "Order Confirmation" | ❌ Not set | ❌ Not set | ❌ | ✅ `noindex, nofollow` | ❌ Missing receipt structured data |
| `/account` | ✅ "My Account" | ✅ "Manage your PineNova account" | ❌ Not set | ❌ | ✅ `noindex, nofollow` | N/A |
| `/admin` | ✅ "Admin Dashboard \| PineNova" | ❌ Not set | ❌ Not set | ❌ | ✅ `noindex, nofollow` | N/A |
| 404 | ❌ Not set | ❌ Not set | ❌ | ❌ | Default | ❌ |

### Critical SEO Gaps

| Gap | Severity | Detail |
|-----|----------|--------|
| **Homepage structured data** | **High** | No `Organization`, `WebSite`, or `BreadcrumbList` JSON-LD on the most important page |
| **Product listing missing structured data** | **High** | No `ItemList` or `Product` structured data on `/products` or category pages — products are invisible to search crawlers as structured entities |
| **Missing `og:image`** | Medium | No page sets `og:image` — social shares will show no preview image |
| **Missing `twitter:card`** | Medium | No Twitter card meta tags anywhere |
| **Missing `hreflang`** | Low | Multi-language not yet supported, but no tags prepared |
| **No breadcrumb on category pages** | Medium | Only product detail has breadcrumb structured data |
| **Canonical missing on important pages** | Medium | Homepage, cart, checkout, account, and admin pages lack `<link rel="canonical">` |
| **No meta description on cart/checkout/admin** | Low | Not critical since these are noindex'd |

---

## 7. Critical Issues Summary

### 🔴 P0 — Must Fix Before Launch

| # | File:Line | Issue |
|---|-----------|-------|
| 1 | `components/AdminPage.tsx:220` | **Template literal bug in JSX**: `` className="badge-${o.status === 'DELIVERED' ? 'green' : ...}" `` renders as literal string, not dynamic class. All order status badges are broken. |
| 2 | `app/(storefront)/checkout/page.tsx:157` | **Dangerous type assertion**: `elements: undefined as any` bypasses Stripe Elements typing — may cause payment sheet rendering failures. |
| 3 | `middleware.ts:75` | **Admin redirect loses redirect param**: Redirect to login from `/admin` does not append `?redirect=/admin` — admin users are sent to login then redirected to `/` not `/admin`. |
| 4 | `middleware.ts:72-77` | **No admin role check**: Any authenticated user can access `/admin`. The middleware only checks for token presence, not `role === "ADMIN"`. |
| 5 | `app/(storefront)/account/page.tsx:47-48` | **User profile never loaded**: `firstName` hardcoded to empty string; only `payload.sub` used for email. No `/api/account/profile` call. |

### 🟠 P1 — High Priority

| # | File:Line | Issue |
|---|-----------|-------|
| 6 | `app/(storefront)/products/page.tsx` | **No pagination UI** — server fetches with `skip/take` and returns `total`/`page`/`limit`, but no page controls rendered. |
| 7 | `app/(storefront)/account/page.tsx` | **No order detail page** — order numbers are plain text, not links. |
| 8 | `components/AdminPage.tsx` | **471-line monolithic component** — all admin tabs in one file. Should be lazy-loaded. |
| 9 | `app/(storefront)/products/[slug]/page.tsx:89-90` | **`dangerouslySetInnerHTML`** for JSON-LD — acceptable here but no sanitization. |
| 10 | `package.json` | **3 unused frontend libraries** — `@tanstack/react-query`, `react-hook-form`, `zustand` add ~25KB+ to bundle. Either use them or remove them. |

### 🟡 P2 — Medium Priority

| # | Issue |
|---|-------|
| 11 | No `loading.tsx` files — manual loading states everywhere |
| 12 | No search functionality (no `/search` route, no search input in nav) |
| 13 | No toast/snackbar notification system |
| 14 | No global cart state — cart count badge cannot be shown in nav |
| 15 | `PaymentForm.tsx` is unused dead code (checkout uses inline `CheckoutForm`) |
| 16 | No shipping method selection in checkout |
| 17 | No guest checkout email capture |
| 18 | Color inconsistency — error/not-found pages use `neutral` palette instead of brand colors |
| 19 | No password strength indicator on register/reset forms |
| 20 | No breadcrumbs on category, cart, checkout, or account pages |

### 🟢 P3 — Low Priority / Enhancement

| # | Issue |
|---|-------|
| 21 | No `sizes` attribute on `Image` components |
| 22 | No skip-to-content link for accessibility |
| 23 | No `aria-label` on icon buttons |
| 24 | No FAQ, About, Contact, Shipping/Returns, Privacy, or Terms pages |
| 25 | No `hreflang` or country variants |
| 26 | No mobile hamburger menu |
| 27 | No optimistic updates on cart operations |
| 28 | Missing `og:image` on all pages |

---

## 8. Recommendations

### Immediate (P0)
1. Fix template literal bug in `AdminPage.tsx:220`
2. Fix Stripe `elements` type issue in `checkout/page.tsx:157`
3. Fix admin redirect in `middleware.ts:75`
4. Add admin role check in `middleware.ts`
5. Add user profile API call in `account/page.tsx`

### Short-term (P1-P2)
1. Implement pagination component for product listing
2. Create order detail page (`/account/orders/[id]`)
3. Split `AdminPage.tsx` into separate route groups + lazy-load tabs
4. Remove unused dependencies or start using them (React Query for cart state)
5. Add global cart state (Zustand or React Query) for nav badge
6. Add search functionality
7. Add toast notification system
8. Add `loading.tsx` files for server components

### Long-term (P2-P3)
1. Internationalization (i18n)
2. Wishlist feature
3. Product comparison
4. Advanced filtering (price range, ratings, etc.)
5. Accessibility audit (ARIA, keyboard nav, screen reader)
6. E2E tests for critical user flows
7. Image CDN optimization with `sizes` and `priority` attributes
