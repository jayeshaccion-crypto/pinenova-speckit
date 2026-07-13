# UI Implementation Specification — PineNova

**Source:** UI_IMPLEMENTATION_AUDIT.md  
**Methodology:** OpenCode-native SDD (Spec Kit adapted)  
**Goal:** Close ~55% backend-to-frontend gap

---

## Executive Summary

| Area | Backend | UI | Gap |
|------|---------|-----|-----|
| Auth (login, register, 2FA, password reset) | 95% | 30% | **CRITICAL** |
| Cart & Checkout | 90% | 40% | **HIGH** |
| Account Management | 85% | 35% | **HIGH** |
| Admin Dashboard | 70% | 60% | **MEDIUM** |
| Product Browsing | 80% | 60% | **MEDIUM** |
| Navigation & Header | 0% | **MISSING** | **CRITICAL** |
| User Session Indicators | 100% | **MISSING** | **CRITICAL** |

**Overall: ~55% of backend features have zero/minimal UI**

---

## Phase 1: Foundation & Header (P0 — CRITICAL)

### 1.1 Create AuthContext — React Context for session
**File:** `components/AuthContext.tsx`  
**Effort:** 1h  
**Reads:** `lib/auth.ts:60-67` (verifyAccessToken)

```tsx
// Provides: user, loading, login(), register(), logout(), refreshUser(), updateUser()
// Fetches /api/auth/me on mount (credentials: include)
```

### 1.2 Create CartContext — React Context for cart state
**File:** `components/CartContext.tsx`  
**Effort:** 1h  
**Reads:** `app/api/cart/route.ts` (GET/POST/PATCH/DELETE)

```tsx
// Provides: items[], count, loading, addItem(), updateQuantity(), removeItem(), clear(), refresh()
// All mutations re-fetch cart
```

### 1.3 Create ToastProvider — Global notifications
**File:** `components/ToastProvider.tsx`  
**Effort:** 30m  
**Dependency:** `sonner` (add to package.json)

```tsx
// useToast() returns { showToast(message, type), hideToast(id) }
// Types: success | error | info | warning
// Auto-dismiss 5s, accessible (aria-live)
```

### 1.4 Create Header — Persistent navigation
**File:** `components/Header.tsx`  
**Effort:** 2h  
**Reads:** `components/SearchBar.tsx`, `components/UserMenu.tsx`, `components/MobileMenu.tsx`

**Desktop:**
- Logo + SearchBar + Nav(Products, Blog) + Cart(badge) + Auth/UserMenu

**Mobile:**
- Logo + Search + Hamburger → MobileMenu (slide-in panel)

**Auth states:**
- Unauth: Sign In | Create Account
- Auth: UserMenu (avatar → dropdown: My Account, Orders, Admin*, Sign Out)

### 1.5 Create UserMenu — Dropdown
**File:** `components/UserMenu.tsx`  
**Effort:** 1.5h  
**Props:** `user`, `onLogout`

**Items:**
- My Account → `/account`
- My Orders → `/account/orders`
- Cart → `/cart`
- Admin Dashboard* → `/admin` (role === ADMIN)
- Divider
- Sign Out → calls onLogout + logout()

### 1.6 Create CartIndicator — Badge on cart link
**File:** `components/CartIndicator.tsx`  
**Effort:** 30m  
**Consumes:** `useCart().count`

```tsx
<Link href="/cart" aria-label={count > 0 ? `Cart, ${count} items` : "Cart, empty"}>
  <CartIcon />
  {count > 0 && <span className="badge">{count > 99 ? "99+" : count}</span>}
</Link>
```

### 1.7 Create MobileMenu — Hamburger panel
**File:** `components/MobileMenu.tsx`  
**Effort:** 1h  
**Props:** `isOpen`, `onClose`, `user`, `onLogout`, `cartCount`

**Sections:**
- Nav: Products, Blog, Cart(badge)
- Auth: Sign In / Create Account (unauth) OR User info + My Account + Orders + Admin* + Sign Out (auth)

### 1.8 Wrap Storefront Layout with Providers + Header
**File:** `app/layout.tsx` (modify)  
**Effort:** 30m

```tsx
<AuthProvider>
  <CartProvider>
    <ToastProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </ToastProvider>
  </CartProvider>
</AuthProvider>
```

---

## Phase 2: Authentication Flows (P0 — CRITICAL)

### 2.1 Login Page — Enhance existing
**File:** `app/(storefront)/account/auth/login/page.tsx` (modify)  
**Effort:** 1h

**Add:**
- "Forgot password?" → `/account/auth/reset-password`
- 2FA challenge redirect handling (middleware sets redirect)
- Remember me checkbox (extend refresh token TTL)

### 2.2 Register Page — Enhance existing
**File:** `app/(storefront)/account/auth/register/page.tsx` (modify)  
**Effort:** 45m

**Add:**
- Terms checkbox (required)
- Redirect after email verification

### 2.3 Forgot Password — Request reset email
**File:** `app/(storefront)/account/auth/reset-password/page.tsx` (new step 1)  
**Effort:** 1h

**UI:** Email input → POST `/api/auth/reset-password` (request) → "Check your email"

### 2.4 Reset Password — Confirm token + new password
**File:** `app/(storefront)/account/auth/reset-password/page.tsx` (step 2, `?token=`)  
**Effort:** 1h

**UI:** Token from URL → password + confirm → POST `/api/auth/reset-password` (confirm) → redirect to login

### 2.5 2FA Setup — QR code + verification
**File:** `app/(storefront)/account/auth/2fa/setup/page.tsx` (new)  
**Effort:** 1.5h  
**API:** `POST /api/auth/2fa/setup` → returns `{ secret, qrCode, backupCodes }`  
**UI:** QR code image, manual secret entry, backup codes display, 6-digit verification input → POST `/api/auth/2fa/verify`

### 2.6 2FA Verify — Enable/confirm
**File:** `app/(storefront)/account/auth/2fa/verify/page.tsx` (new)  
**Effort:** 1h  
**API:** `POST /api/auth/2fa/verify` with TOTP code

### 2.7 2FA Challenge — Login step 2
**File:** `app/(storefront)/account/auth/2fa/challenge/page.tsx` (new)  
**Effort:** 1h  
**API:** `POST /api/auth/2fa/challenge` with TOTP code  
**Flow:** Middleware detects 2FA enabled → redirects here → on success → redirect to intended page

### 2.8 Logout API + Client Hook
**Files:**  
- `app/api/auth/logout/route.ts` (new) — clears cookies, invalidates refresh token  
- `components/AuthContext.tsx` — `logout()` calls API  

**Effort:** 30m

### 2.9 Middleware 2FA Redirect Logic
**File:** `middleware.ts` (modify)  
**Effort:** 30m

```ts
// After auth check for /account/*
// If user.twoFactorEnabled && !request.cookies.has('2fa_verified')
// → redirect to /account/auth/2fa/challenge?redirect=...
```

---

## Phase 3: Account Management (P0 — HIGH)

### 3.1 Account Layout — Sidebar navigation
**File:** `app/(storefront)/account/layout.tsx` (new)  
**Effort:** 1h

**Sidebar sections:**
- Profile (active)
- Orders
- Security (2FA)
- Privacy (GDPR)
- Settings

**Props:** `children` rendered in main area

### 3.2 Account Page — Profile + 2FA + GDPR
**File:** `app/(storefront)/account/page.tsx` (modify)  
**Effort:** 1.5h

**Tabs/Sections:**
- Profile: firstName, lastName, avatar upload → PATCH `/api/auth/me`
- 2FA: Enable/Disable buttons → link to setup/verify/disable pages
- GDPR: Download Data (GET `/api/auth/me/export`), Delete Account (DELETE `/api/auth/me` with confirmation modal)

**Add:** Breadcrumbs (Home > Account), active section indicator

### 3.3 Orders Page — History with pagination
**File:** `app/(storefront)/account/orders/page.tsx` (modify)  
**Effort:** 1h

**Features:**
- Table: Order#, Date, Status(badge), Total, Actions(View)
- Status badges: CONFIRMED=blue, PROCESSING=yellow, SHIPPED=green, DELIVERED=green, CANCELLED=red, REFUNDED=gray
- Pagination (API supports `page`, `limit`)

### 3.4 Order Detail — Timeline + tracking
**File:** `app/(storefront)/account/orders/[id]/page.tsx` (modify)  
**Effort:** 1h

**Features:**
- Order summary (items, prices, shipping, tax, total)
- Status timeline (confirmed → processing → shipped → delivered)
- Tracking number + carrier link (if shipped)
- Download invoice button
- Reorder button (adds items to cart)
- Back navigation (breadcrumb)

### 3.5 GDPR Modals
**File:** `app/(storefront)/account/page.tsx` (inline modals)  
**Effort:** 45m

- Export: "Preparing download..." → triggers file download
- Delete: Two-step confirmation (type email, confirm) → DELETE `/api/auth/me`

---

## Phase 4: Cart & Checkout Polish (P0 — HIGH)

### 4.1 MiniCartDrawer — Slide-out cart
**File:** `components/CartDrawer.tsx`  
**Effort:** 2h

**Trigger:** CartIndicator click (desktop)  
**Content:**
- Items: image, name, variant, price, qty stepper, remove
- Subtotal
- Discount code input (real-time validation)
- "View Cart" → `/cart`, "Checkout" → `/checkout`

### 4.2 Cart Page — Enhance discount UI
**File:** `app/(storefront)/cart/page.tsx` (modify)  
**Effort:** 1h

**Add:**
- DiscountCodeInput component with apply/remove feedback
- Shipping estimate (postal code input)
- "Continue Shopping" link

### 4.3 Checkout — Order review step + breakdown
**File:** `app/(storefront)/checkout/page.tsx` (modify)  
**Effort:** 1.5h

**Steps:**
1. Shipping address (ShippingForm)
2. **Review** (NEW): items, shipping, tax, discount, total — editable back to step 1
3. Payment (Stripe Elements)

**Breakdown display:** Subtotal, Discount, Shipping, Tax, Total

### 4.4 Checkout Success Page
**File:** `app/(storefront)/checkout/success/page.tsx` (new)  
**Effort:** 1h

**Content:**
- Order number, date, total
- Items summary
- Shipping address
- "Confirmation email sent to X"
- "Continue Shopping" link

### 4.5 Guest Cart Merge Notification
**File:** `components/AuthContext.tsx` (modify login flow)  
**Effort:** 30m

```tsx
// After login, if guest cart had items → show toast: "Your guest cart has been merged"
```

---

## Phase 5: Product Browsing (P1 — MEDIUM)

### 5.1 VariantSelector — Placeholder
**File:** `components/VariantSelector.tsx`  
**Effort:** 2h  
**Note:** Blocked on Prisma ProductVariant model (T012)

**Current:** Displays "Variants coming soon" disabled state  
**Future:** Size/color swatches, stock-aware, updates price/image

### 5.2 Product Detail — Image gallery
**File:** `app/(storefront)/products/[slug]/page.tsx` (modify)  
**Effort:** 1.5h

**Add:**
- Thumbnail strip below main image
- Click thumbnail → main image swap
- Lightbox modal on main image click (keyboard nav, zoom)

### 5.3 ReviewForm — Submit review
**File:** `components/ReviewForm.tsx`  
**Effort:** 1.5h

**Fields:** Rating (1-5 stars), Title, Body  
**Validation:** Auth required, max 1000 chars  
**Submit:** POST `/api/products/[slug]/reviews` → refresh reviews

### 5.4 Related Products
**File:** `app/(storefront)/products/[slug]/page.tsx` (modify)  
**Effort:** 1h

**Query:** Same category, exclude current, limit 4  
**Display:** ProductCard grid "You may also like"

### 5.5 Fix Average Rating Query
**File:** `app/(storefront)/products/[slug]/page.tsx`  
**Line:** 50-52  
**Effort:** 30m

```tsx
// Current: fetches 3 reviews, calculates avg client-side
// Fix: Separate query for AVG(rating) + COUNT(*) from all approved reviews
```

---

## Phase 6: Admin Dashboard Access (P1 — HIGH)

### 6.1 Admin Login Page
**File:** `app/(storefront)/admin/login/page.tsx` (new)  
**Effort:** 1h

**Features:** Same as user login but redirects to `/admin` on success, shows "Admin Access" branding

### 6.2 Admin Layout Guard
**File:** `app/admin/layout.tsx` (modify)  
**Effort:** 30m

```tsx
// Server component
const user = await getAuthUser(request.headers);
if (!user || user.role !== 'ADMIN') redirect('/account/auth/login?redirect=/admin');
return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
```

### 6.3 Admin Link in UserMenu
**File:** `components/UserMenu.tsx` (modify)  
**Effort:** 15m

```tsx
{user.role === 'ADMIN' && (
  <Link href="/admin">Admin Dashboard</Link>
)}
```

### 6.4 AdminPage Refactor — Toast + Loading
**File:** `components/AdminPage.tsx` (modify)  
**Effort:** 2h

**Replace:** All `alert()` → `useToast().showToast()`  
**Add:** Loading skeletons for each tab, error boundaries

### 6.5 Admin Sub-components
**Files:** `components/admin/*.tsx` (new)  
**Effort:** 3h

- `AdminProductsTable` — CRUD products
- `AdminOrdersTable` — filter, status transitions, refund
- `AdminInventoryTable` — stock levels, audit log, adjust
- `AdminDiscountsTable` — CRUD discounts
- `AdminMetricsCards` — revenue, orders, AOV, CSV export
- `AdminProductForm` — create/edit modal

---

## Phase 7: Search & Blog (P2 — MEDIUM)

### 7.1 Search Autocomplete
**Effort:** 4h  
**API:** New `/api/products/search?q=` with debounce

### 7.2 Blog Listing
**File:** `app/(storefront)/blog/page.tsx` (new)  
**Effort:** 4h  
**ISR:** `revalidate: 3600`

### 7.3 Blog Article
**File:** `app/(storefront)/blog/[slug]/page.tsx` (new)  
**Effort:** 4h  
**SEO:** JSON-LD Article schema, OG tags

### 7.4 Blog Admin UI
**Effort:** 4h  
**Tab:** Add to AdminPage

---

## Phase 8: Technical Debt & Quality (P2 — MEDIUM)

| Task | File | Line | Effort |
|------|------|------|--------|
| Remove localStorage reads | `account/page.tsx` | — | 30m |
| Remove localStorage reads | `ReviewForm.tsx` | — | 15m |
| Remove localStorage reads | `AdminPage.tsx` | — | 30m |
| Remove localStorage reads | `orders/[id]/page.tsx` | — | 15m |
| Fix review key | `products/[slug]/page.tsx` | 35,194 | 10m |
| Narrow Stripe catch | `admin/orders/route.ts` | 147-164 | 15m |
| Add logging to 14 silent catches | Multiple | — | 1h |
| Add PENDING to admin filter | `AdminPage.tsx` | 244-252 | 15m |
| Add skeleton screens | Multiple | — | 2h |
| Add error boundaries + 403/404 | `app/error.tsx`, `not-found.tsx` | — | 1h |
| Accessibility audit | Multiple | — | 2h |
| Mobile responsive testing | — | — | 1h |

---

## API Endpoints (Reference)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/me` | Update profile |
| DELETE | `/api/auth/me` | Delete account (GDPR) |
| GET | `/api/auth/me/export` | GDPR data export |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/refresh` | Refresh tokens |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Confirm reset |
| POST | `/api/auth/2fa/setup` | Generate 2FA secret + QR |
| POST | `/api/auth/2fa/verify` | Enable 2FA |
| POST | `/api/auth/2fa/disable` | Disable 2FA |
| POST | `/api/auth/2fa/challenge` | Login 2FA step |
| GET | `/api/cart` | Get cart |
| POST | `/api/cart` | Add item |
| PATCH | `/api/cart/:id` | Update qty |
| DELETE | `/api/cart/:id` | Remove item |
| DELETE | `/api/cart/clear` | Clear cart |
| GET | `/api/products` | List products |
| GET | `/api/products/:slug` | Product detail |
| GET | `/api/products/categories` | Categories |
| POST | `/api/products/:slug/reviews` | Submit review |
| GET | `/api/admin?section=products` | Admin products |
| GET | `/api/admin?section=orders` | Admin orders |
| GET | `/api/admin?section=inventory` | Admin inventory |
| GET | `/api/admin?section=discounts` | Admin discounts |
| GET | `/api/admin?section=metrics` | Admin metrics |

---

## Acceptance Criteria (Definition of Done)

1. **Header visible on all storefront pages** with correct auth/cart state
2. **Mobile navigation works** — hamburger opens panel, links navigate
3. **All auth flows reachable from header** — login, register, 2FA setup, password reset
4. **Account page reachable from UserMenu** — profile, orders, 2FA, GDPR functional
5. **Cart count updates in real-time** — add/remove updates badge
6. **Mini-cart drawer opens from header** — shows items, subtotal, checkout link
7. **Checkout has review step** — shows shipping/tax breakdown before payment
8. **Admin dashboard reachable from UserMenu (admin only)** — guarded by middleware + layout
9. **No `alert()` in production code** — all replaced with toasts
10. **No localStorage for auth/cart** — all via context + cookies
11. **`npm run build` passes** (41 routes)
12. **`npm test` passes** (171/171)

---

## Out of Scope

- New backend APIs
- Database migrations
- New npm dependencies (except `sonner`, `@radix-ui/react-dropdown-menu`)
- Full AdminPage refactor (deferred)
- Full account/page.tsx refactor (deferred)
- ProductVariant model (blocked on T012)
- PaymentIntent transaction ordering fix (minimal only)