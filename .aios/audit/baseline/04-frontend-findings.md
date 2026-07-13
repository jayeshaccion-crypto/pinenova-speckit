# Frontend Audit Findings - PineNova Ecommerce Project

## Audit Scope
- **Project**: PineNova Ecommerce (pinenova-speckit)
- **Phase**: Phase 1 Full-Depth Review (SDD Audit)
- **Date**: 2026-07-12
- **Files Reviewed**: 37 frontend files (layouts, pages, components, styles)

---

## Findings by File

### app/layout.tsx

**Finding ID**: FE-001
**File**: app/layout.tsx:17-35
**Severity**: Medium
**Category**: Security/Architecture
**Evidence**:
```tsx
<body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
  <header className="border-b border-primary/10">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <a href="/" className="text-lg font-bold tracking-tight text-foreground">PineNova</a>
      <nav className="flex items-center gap-6 text-sm">
        <a href="/products" className="text-foreground/60 hover:text-foreground">Products</a>
        <a href="/cart" className="text-foreground/60 hover:text-foreground">Cart</a>
      </nav>
    </div>
  </header>
```
**Issue**: Root layout uses hardcoded `<a>` tags for navigation instead of Next.js `<Link>` components. This causes full page reloads instead of client-side navigation, breaking SPA behavior and degrading performance.
**Expected**: Use `next/link` `<Link>` components for internal navigation to enable client-side routing and prefetching.
**Gap ID**: G-001

---

**Finding ID**: FE-002
**File**: app/layout.tsx:5
**Severity**: Low
**Category**: Security
**Evidence**:
```tsx
metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
```
**Issue**: `metadataBase` falls back to `http://localhost:3000` in production if `NEXT_PUBLIC_APP_URL` is not set. This could cause incorrect canonical URLs and OG tags in production.
**Expected**: Require `NEXT_PUBLIC_APP_URL` to be set in production; fail fast or use a production-safe default.
**Gap ID**: G-002

---

**Finding ID**: FE-003
**File**: app/layout.tsx:31
**Severity**: Low
**Category**: Performance/Standards
**Evidence**:
```tsx
&copy; {new Date().getFullYear()} PineNova. All rights reserved.
```
**Issue**: `new Date().getFullYear()` executes during SSR/SSG at build time. The year will be stuck at build time and not update automatically each year.
**Expected**: Use a build-time constant or accept that it updates at build time (acceptable for copyright year).
**Gap ID**: G-003

---

**Finding ID**: FE-004
**File**: app/layout.tsx:15-36
**Severity**: Low
**Category**: Accessibility/UX
**Evidence**:
```tsx
<header className="border-b border-primary/10">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
    <a href="/" className="text-lg font-bold tracking-tight text-foreground">PineNova</a>
    <nav className="flex items-center gap-6 text-sm">
      <a href="/products" className="text-foreground/60 hover:text-foreground">Products</a>
      <a href="/cart" className="text-foreground/60 hover:text-foreground">Cart</a>
    </nav>
  </div>
</header>
```
**Issue**: Missing `aria-label` on `<nav>` for accessibility. Logo link lacks `aria-label` for screen readers. No skip-to-main-content link for keyboard users.
**Expected**: Add `aria-label="Main navigation"` to nav, `aria-label="PineNova Home"` to logo link, and a skip link.
**Gap ID**: G-004

---

### app/page.tsx

**Finding ID**: FE-005
**File**: app/page.tsx:28-29
**Severity**: High
**Category**: Performance/Architecture
**Evidence**:
```tsx
export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);
```
**Issue**: Page uses `Promise.all` with Prisma queries directly in the Server Component. No error boundary wrapping, no Suspense boundary for streaming. If DB fails, the entire page crashes to `error.tsx`.
**Expected**: Wrap data fetching in try/catch or use Suspense boundaries for streaming SSR with fallback UI.
**Gap ID**: G-005

---

**Finding ID**: FE-006
**File**: app/page.tsx:54-64
**Severity**: Medium
**Category**: UX-Accessibility/Standards
**Evidence**:
```tsx
<div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
  {categories.map((cat) => (
    <Link
      key={cat.id}
      href={`/categories/${cat.slug}`}
      className="rounded-xl border border-primary/10 p-6 text-center transition-colors hover:border-primary"
    >
      <h3 className="font-medium text-foreground">{cat.name}</h3>
      {cat.description && <p className="mt-1 text-xs text-foreground/50 line-clamp-2">{cat.description}</p>}
    </Link>
  ))}
</div>
```
**Issue**: Category cards use `<Link>` wrapping block content (heading + paragraph). This is valid HTML but can cause accessibility issues with nested interactive content if not careful. No `aria-label` for context.
**Expected**: Ensure link text is descriptive; consider adding `aria-label` with category name.
**Gap ID**: G-006

---

**Finding ID**: FE-007
**File**: app/page.tsx:74
**Severity**: Medium
**Category**: Performance/Standards
**Evidence**:
```tsx
<ProductGrid products={products} />
```
**Issue**: `ProductGrid` is a client component (uses `ProductCard` which may use client features). Passed server-fetched data as props. No Suspense boundary around it — if `ProductGrid` suspends, it bubbles to root error.
**Expected**: Wrap in `<Suspense fallback={<ProductGridSkeleton />}>` for streaming.
**Gap ID**: G-007

---

### app/error.tsx

**Finding ID**: FE-008
**File**: app/error.tsx:1-13
**Severity**: High
**Category**: UX-Accessibility/Error Handling
**Evidence**:
```tsx
"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-neutral-500">{error.message || "An unexpected error occurred."}</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800">
        Try again
      </button>
    </div>
  );
}
```
**Issue**: Error page uses hardcoded `neutral-900`/`neutral-500` colors instead of design system tokens (`text-foreground`, `text-foreground/50`, `bg-primary`). Also exposes raw `error.message` to user — potential information leakage in production.
**Expected**: Use design tokens; sanitize error messages in production (show generic message, log details server-side).
**Gap ID**: G-008

---

**Finding ID**: FE-009
**File**: app/error.tsx:3
**Severity**: Medium
**Category**: Accessibility
**Evidence**:
```tsx
<button onClick={reset} className="mt-6 rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800">
  Try again
</button>
```
**Issue**: Button lacks `aria-label` or descriptive text for screen readers (though "Try again" is visible). No focus-visible styles defined in the button class (relies on global CSS).
**Expected**: Ensure focus styles are visible; add `aria-label` if needed.
**Gap ID**: G-009

---

### app/not-found.tsx

**Finding ID**: FE-010
**File**: app/not-found.tsx:1-13
**Severity**: Medium
**Category**: UX-Accessibility/Standards
**Evidence**:
```tsx
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-neutral-900">404</h1>
      <p className="mt-2 text-sm text-neutral-500">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800">
        Go Home
      </Link>
    </div>
  );
}
```
**Issue**: Same hardcoded `neutral-*` color tokens instead of design system. No search link or category browsing suggestion for better UX.
**Expected**: Use design tokens; add helpful navigation links.
**Gap ID**: G-010

---

### app/(storefront)/products/page.tsx

**Finding ID**: FE-011
**File**: app/(storefront)/products/page.tsx:70-74
**Severity**: High
**Category**: Architecture/Performance
**Evidence**:
```tsx
<aside className="lg:col-span-1">
  <Suspense fallback={<div className="text-sm text-neutral-500">Loading filters...</div>}>
    <ProductsFilterBar />
  </Suspense>
</aside>
```
**Issue**: `ProductsFilterBar` is a client component that reads `searchParams` via `useSearchParams()`. It's wrapped in `<Suspense>` but the parent page is a Server Component. The Suspense boundary works, but the fallback shows during hydration. No error boundary for the filter bar.
**Expected**: Add error boundary around filter bar; consider moving filter state to URL-only (already done) and ensuring SSR-compatible initial render.
**Gap ID**: G-011

---

**Finding ID**: FE-012
**File**: app/(storefront)/products/page.tsx:11
**Severity**: Low
**Category**: Performance/Standards
**Evidence**:
```tsx
export const revalidate = 60;
```
**Issue**: ISR revalidation of 60 seconds is reasonable, but no `generateStaticParams` for static generation of common filter combinations. Every unique filter combo hits the server.
**Expected**: Consider static generation for top categories/sorts with ISR fallback.
**Gap ID**: G-012

---

**Finding ID**: FE-013
**File**: app/(storefront)/products/page.tsx:24-51
**Severity**: Medium
**Category**: Security/Architecture
**Evidence**:
```tsx
async function getProducts(params: Record<string, string | undefined>) {
  const where: any = { published: true };
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const limit = 20;

  if (params.category) where.category = { slug: params.category };
  if (params.material) where.materialTag = params.material;

  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "price_asc") orderBy = { price: "asc" };
  else if (params.sort === "price_desc") orderBy = { price: "desc" };
  else if (params.sort === "newest") orderBy = { createdAt: "desc" };
```
**Issue**: No validation/sanitization of `params.category`, `params.material`, `params.sort` beyond Prisma's type safety. `params.sort` uses string comparison but falls through to default. No protection against SQL injection (Prisma protects) but no allowlist for sort fields.
**Expected**: Define allowlist for sort values; validate category/material slugs exist.
**Gap ID**: G-013

---

### app/(storefront)/products/[slug]/page.tsx

**Finding ID**: FE-014
**File**: app/(storefront)/products/[slug]/page.tsx:52-74
**Severity**: High
**Category**: Security/Standards
**Evidence**:
```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: product.images.map((i) => i.url),
  sku: product.sku,
  brand: { "@type": "Brand", name: "PineNova" },
  offers: {
    "@type": "Offer",
    price: product.price,
    priceCurrency: "USD",
    availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    url: `/products/${product.slug}`,
  },
  ...(avgRating ? {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: product.reviews.length,
    },
  } : {}),
};
```
**Issue**: JSON-LD structured data directly interpolates `product.name`, `product.description`, `product.sku` without sanitization. If these contain `</script>` or malicious content, it could break the script tag or inject content. Prisma returns raw DB values.
**Expected**: Sanitize/escape all user-controlled data in JSON-LD (use `JSON.stringify` which handles escaping, but ensure no prototype pollution).
**Gap ID**: G-014

---

**Finding ID**: FE-015
**File**: app/(storefront)/products/[slug]/page.tsx:106-116
**Severity**: Medium
**Category**: Performance/Image Optimization
**Evidence**:
```tsx
{product.images.map((image) => (
  <div key={image.id} className="aspect-square overflow-hidden rounded-lg bg-primary/5">
    <Image
      src={image.url}
      alt={image.altText ?? product.name}
      width={600}
      height={600}
      className="h-full w-full object-cover"
    />
  </div>
))}
```
**Issue**: `next/image` with fixed `width={600} height={600}` but rendered in responsive `aspect-square` container. No `sizes` prop provided, so Next.js uses default `100vw` — may load overly large images on mobile. No `priority` on first image for LCP optimization.
**Expected**: Add `sizes` prop (e.g., `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"`) and `priority` on first image.
**Gap ID**: G-015

---

**Finding ID**: FE-016
**File**: app/(storefront)/products/[slug]/page.tsx:131-143
**Severity**: Medium
**Category**: Accessibility/UX
**Evidence**:
```tsx
<div className="mt-2">
  {inStock ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      In Stock{product.stock <= 5 ? ` (only ${product.stock} left)` : ""}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Out of Stock
    </span>
  )}
</div>
```
**Issue**: Stock status uses color-only indication (green/red badges) without text labels for colorblind users. The dot indicator is decorative only.
**Expected**: Add text labels like "In Stock" / "Out of Stock" (already present) but ensure sufficient contrast and consider adding icons with `aria-hidden="true"`.
**Gap ID**: G-016

---

**Finding ID**: FE-017
**File**: app/(storefront)/products/[slug]/page.tsx:152
**Severity**: Medium
**Category**: Architecture/Client Components
**Evidence**:
```tsx
<AddToCartButton productId={product.id} productName={product.name} stock={product.stock} />
```
**Issue**: `AddToCartButton` is a client component. No Suspense boundary around it. If it suspends (e.g., during hydration), it bubbles to nearest error boundary.
**Expected**: Wrap in `<Suspense fallback={<AddToCartSkeleton />}>`.
**Gap ID**: G-017

---

**Finding ID**: FE-018
**File**: app/(storefront)/products/[slug]/page.tsx:80-85
**Severity**: Low
**Category**: Accessibility/SEO
**Evidence**:
```tsx
<nav className="mb-6 text-sm text-foreground/50">
  <Link href="/" className="hover:text-foreground">Home</Link>
  <span className="mx-2">/</span>
  <Link href="/products" className="hover:text-foreground">Products</Link>
  <span className="mx-2">/</span>
  <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
    {product.category.name}
  </Link>
  <span className="mx-2">/</span>
  <span className="text-foreground">{product.name}</span>
</nav>
```
**Issue**: Breadcrumb navigation lacks `aria-label="Breadcrumb"` and `ol`/`li` semantic structure. Uses `span` separators instead of proper list items.
**Expected**: Use `<nav aria-label="Breadcrumb"><ol><li>...</li></ol></nav>` with `aria-current="page"` on last item.
**Gap ID**: G-018

---

### app/(storefront)/products/[slug]/error.tsx

**Finding ID**: FE-019
**File**: app/(storefront)/products/[slug]/error.tsx:1-16
**Severity**: Medium
**Category**: UX-Accessibility/Error Handling
**Evidence**:
```tsx
"use client";

export default function ProductDetailErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">Unable to load product</h1>
      <p className="mt-2 text-sm text-neutral-500">{error.message || "Something went wrong while loading this product. Please try again."}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Try again
      </button>
    </div>
  );
}
```
**Issue**: Same hardcoded `neutral-*` colors. Exposes `error.message` to user.
**Expected**: Use design tokens; sanitize error message.
**Gap ID**: G-019

---

### app/(storefront)/products/not-found.tsx

**Finding ID**: FE-020
**File**: app/(storefront)/products/not-found.tsx:1-18
**Severity**: Low
**Category**: UX-Accessibility
**Evidence**:
```tsx
<Link
  href="/products"
  className="mt-6 inline-block rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800"
>
  Browse all products
</Link>
```
**Issue**: Hardcoded `neutral-*` colors instead of design tokens. Good UX with helpful link.
**Expected**: Use design tokens (`btn-primary` class).
**Gap ID**: G-020

---

### app/(storefront)/products/error.tsx

**Finding ID**: FE-021
**File**: app/(storefront)/products/error.tsx:1-16
**Severity**: Medium
**Category**: UX-Accessibility/Error Handling
**Evidence**: Same issues as FE-019 — hardcoded colors, raw error message exposure.
**Gap ID**: G-021

---

### app/(storefront)/cart/page.tsx

**Finding ID**: FE-022
**File**: app/(storefront)/cart/page.tsx:33-42
**Severity**: Critical
**Category**: Security
**Evidence**:
```tsx
const SESSION_KEY = "pinenova_cart_sid";

function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

async function fetchCart(): Promise<CartResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const sid = localStorage.getItem(SESSION_KEY);
  if (sid) headers["x-session-id"] = sid;
```
**Issue**: Cart session ID stored in `localStorage` and sent via custom header `x-session-id`. No `HttpOnly` cookie, no CSRF protection. Vulnerable to XSS theft of session ID. No server-side session validation.
**Expected**: Use `HttpOnly`, `Secure`, `SameSite=Lax` cookies for session management. Implement CSRF tokens for mutations.
**Gap ID**: G-022

---

**Finding ID**: FE-023
**File**: app/(storefront)/cart/page.tsx:54-69
**Severity**: High
**Category**: Security/Architecture
**Evidence**:
```tsx
async function updateItem(productId: string, quantity: number): Promise<CartResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const sid = localStorage.getItem(SESSION_KEY);
  if (sid) headers["x-session-id"] = sid;

  const res = await fetch("/api/cart", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ productId, quantity }),
  });
```
**Issue**: All cart mutations (PATCH, DELETE) use the same `x-session-id` header from localStorage. No request validation, no optimistic locking, no idempotency keys. Race conditions possible on concurrent updates.
**Expected**: Use proper session cookies; add optimistic locking (version field); implement idempotency keys for mutations.
**Gap ID**: G-023

---

**Finding ID**: FE-024
**File**: app/(storefront)/cart/page.tsx:126-132
**Severity**: Medium
**Category**: UX-Accessibility/Performance
**Evidence**:
```tsx
if (loading) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <p className="text-sm text-foreground/50">Loading cart...</p>
    </div>
  );
}
```
**Issue**: Full-page loading state blocks entire cart UI. No skeleton loaders for progressive rendering.
**Expected**: Show skeleton placeholders for cart items and summary while loading.
**Gap ID**: G-024

---

**Finding ID**: FE-025
**File**: app/(storefront)/cart/page.tsx:153-160
**Severity**: Medium
**Category**: UX-Accessibility
**Evidence**:
```tsx
{error && (
  <div className="card mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {error}
    <button type="button" onClick={loadCart} className="ml-2 font-medium underline hover:no-underline">
      Retry
    </button>
  </div>
)}
```
**Issue**: Error message rendered directly without sanitization. If API returns malicious content, XSS possible (though React escapes by default, `dangerouslySetInnerHTML` not used here so safe). Uses custom red colors instead of design tokens.
**Expected**: Use design token classes; ensure error messages are sanitized server-side.
**Gap ID**: G-025

---

### app/(storefront)/cart/layout.tsx

**Finding ID**: FE-026
**File**: app/(storefront)/cart/layout.tsx:3-6
**Severity**: Low
**Category**: SEO/Standards
**Evidence**:
```tsx
export const metadata: Metadata = {
  title: "Shopping Cart",
  robots: { index: false, follow: false },
};
```
**Issue**: Correctly sets `robots: noindex, follow` for cart page. Good.
**Expected**: —
**Gap ID**: —
**Status**: Reviewed — no findings

---

### app/(storefront)/cart/error.tsx

**Finding ID**: FE-027
**File**: app/(storefront)/cart/error.tsx:1-16
**Severity**: Medium
**Category**: UX-Accessibility/Error Handling
**Evidence**: Same hardcoded color tokens and raw error message exposure as other error pages.
**Gap ID**: G-026

---

### app/(storefront)/checkout/page.tsx

**Finding ID**: FE-028
**File**: app/(storefront)/checkout/page.tsx:10-12
**Severity**: Critical
**Category**: Security
**Evidence**:
```tsx
const SESSION_KEY = "pinenova_cart_sid";
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;
```
**Issue**: Same insecure `localStorage` session ID pattern as cart page. Stripe publishable key exposed in client bundle (expected for Stripe.js but should be validated).
**Expected**: Use HttpOnly cookies for session; validate Stripe key presence at build time.
**Gap ID**: G-027

---

**Finding ID**: FE-029
**File**: app/(storefront)/checkout/page.tsx:35-43
**Severity**: High
**Category**: Security/Validation
**Evidence**:
```tsx
function validateAddress(addr: ShippingAddress): Partial<Record<keyof ShippingAddress, string>> {
  const errors: Partial<Record<keyof ShippingAddress, string>> = {};
  if (!addr.name.trim()) errors.name = "Name is required";
  if (!addr.line1.trim()) errors.line1 = "Address is required";
  if (!addr.city.trim()) errors.city = "City is required";
  if (!addr.state) errors.state = "State is required";
  if (!/^\d{5}(-\d{4})?$/.test(addr.zip)) errors.zip = "Invalid ZIP code";
  return errors;
}
```
**Issue**: Client-side only validation. No server-side re-validation shown in this file (assumed in API). ZIP regex only validates US format — no international support.
**Expected**: Server-side validation mandatory; international address support or clear US-only messaging.
**Gap ID**: G-028

---

**Finding ID**: FE-030
**File**: app/(storefront)/checkout/page.tsx:149-175
**Severity**: High
**Category**: Security/Error Handling
**Evidence**:
```tsx
async function handlePlaceOrder() {
  const sid = getSessionId();
  if (!sid) { setError("Session expired. Please reload."); return; }
  if (!cart || cart.itemCount === 0) { setError("Your cart is empty."); return; }

  const v = validateAddress(shippingAddress);
  setAddressErrors(v);
  if (Object.keys(v).length > 0) return;

  setSubmitting(true);
  setError(null);

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": sid },
      body: JSON.stringify({
        shippingAddress,
        ...(discountCode.trim() ? { discountCode: discountCode.trim() } : {}),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const code = data.error?.code;
      if (code === "INSUFFICIENT_STOCK") {
        setError("Some items are no longer in stock. Please review your cart.");
      } else if (code === "PAYMENT_PROVIDER_ERROR") {
        setError("Payment service is temporarily unavailable.");
      } else if (code === "MAINTENANCE") {
        setError("Checkout is under maintenance. Please try again later.");
      } else if (code === "VALIDATION_ERROR") {
        setError(data.error?.details?.map((d: any) => d.message).join(", ") || "Invalid input");
      } else {
        setError(data.error?.message || "Checkout failed. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    setClientSecret(data.clientSecret);
  } catch {
    setError("Network error. Please check your connection.");
    setSubmitting(false);
  }
}
```
**Issue**: Error messages from API (`data.error?.message`, `data.error?.details`) rendered directly in UI without sanitization. If API returns HTML/script, XSS possible (React escapes by default but `dangerouslySetInnerHTML` not used here — still safe). However, `discountCode` sent without validation/sanitization.
**Expected**: Sanitize all user inputs; validate discount code format server-side.
**Gap ID**: G-029

---

**Finding ID**: FE-031
**File**: app/(storefront)/checkout/page.tsx:246-254
**Severity**: High
**Category**: Architecture/Client Components
**Evidence**:
```tsx
{!clientSecret ? (
  <>
    <section className="card p-6">
      <h2 className="text-base font-semibold text-foreground">Shipping Address</h2>
      <div className="mt-4">
        <ShippingForm value={shippingAddress} onChange={setShippingAddress} errors={addressErrors} />
      </div>
    </section>
    ...
  </>
) : null}
```
**Issue**: Conditional rendering of `ShippingForm` and `DiscountCode` sections based on `clientSecret` state. When payment step shows, shipping form unmounts — user loses entered data if they go back. No "edit shipping" option.
**Expected**: Keep shipping form mounted but hidden, or persist state and allow editing.
**Gap ID**: G-030

---

**Finding ID**: FE-032
**File**: app/(storefront)/checkout/page.tsx:246-250
**Severity**: Critical
**Category**: Security/Payment
**Evidence**:
```tsx
{!clientSecret ? (
  ...
) : stripePromise && clientSecret ? (
  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#2F6B3B", borderRadius: "12px" } } }}>
    <CheckoutForm clientSecret={clientSecret} onConfirm={handleConfirmPayment} submitting={submitting} error={error} />
  </Elements>
) : (
  <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
    Payment system not configured.
  </div>
)}
```
**Issue**: Stripe `Elements` mounted conditionally. If `stripePromise` resolves after `clientSecret` is set, race condition possible. No error boundary around Stripe Elements. `appearance` config hardcoded.
**Expected**: Ensure Stripe loads before mounting Elements; wrap in Error Boundary; move appearance config to constants.
**Gap ID**: G-031

---

**Finding ID**: FE-033
**File**: app/(storefront)/checkout/page.tsx:149-175
**Severity**: Medium
**Category**: UX-Accessibility
**Evidence**: Discount code input has no validation, no debounce, no "Apply" button — just auto-uppercases. No feedback on invalid/expired codes until order submission.
**Expected**: Add "Apply" button with loading state; show validation feedback immediately.
**Gap ID**: G-032

---

### app/(storefront)/checkout/layout.tsx

**Finding ID**: FE-034
**File**: app/(storefront)/checkout/layout.tsx:1-10
**Severity**: Low
**Category**: SEO/Standards
**Evidence**:
```tsx
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};
```
**Issue**: Correctly noindexes checkout. Good.
**Status**: Reviewed — no findings

---

### app/(storefront)/checkout/confirmation/page.tsx

**Finding ID**: FE-035
**File**: app/(storefront)/checkout/confirmation/page.tsx:15-32
**Severity**: High
**Category**: Security/Architecture
**Evidence**:
```tsx
async function getOrder(paymentIntentId?: string): Promise<... | null> {
  if (!paymentIntentId) return null;
  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { items: true },
  });
```
**Issue**: Order lookup by `stripePaymentIntentId` from URL search param (`payment_intent`). No authorization check — any user with a payment intent ID can view order details. Payment intent IDs are not secret but should not expose PII without auth.
**Expected**: Require authentication or verify email ownership before showing order details.
**Gap ID**: G-033

---

**Finding ID**: FE-036
**File**: app/(storefront)/checkout/confirmation/page.tsx:82-83
**Severity**: Low
**Category**: Standards/Type Safety
**Evidence**:
```tsx
{order.items.map((item, i) => {
  const snap = item.productSnapshot as any;
```
**Issue**: Uses `as any` cast for `productSnapshot` JSON field. No type safety.
**Expected**: Define proper type for `productSnapshot` JSON structure.
**Gap ID**: G-034

---

### app/(storefront)/account/layout.tsx

**Finding ID**: FE-037
**File**: app/(storefront)/account/layout.tsx:1-11
**Severity**: Low
**Category**: SEO/Standards
**Evidence**:
```tsx
export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your PineNova account, view orders, and update settings.",
  robots: { index: false, follow: false },
};
```
**Issue**: Correctly noindexes account pages. Good.
**Status**: Reviewed — no findings

---

### app/(storefront)/account/page.tsx

**Finding ID**: FE-038
**File**: app/(storefront)/account/page.tsx:15-57
**Severity**: Critical
**Category**: Security/Authentication
**Evidence**:
```tsx
export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/account/auth/login");
      return;
    }

    async function load() {
      try {
        const [orderRes] = await Promise.all([
          fetch("/api/account/orders", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (orderRes.status === 401) {
          localStorage.removeItem("accessToken");
          router.push("/account/auth/login");
          return;
        }
```
**Issue**: Access token stored in `localStorage` — vulnerable to XSS. No `HttpOnly` cookie. Token decoded client-side with `atob()` (line 47) exposing payload. No token refresh logic visible. Logout only clears localStorage and cookies manually.
**Expected**: Use `HttpOnly`, `Secure`, `SameSite=Lax` cookies for tokens. Implement refresh token rotation. Never expose JWT payload to client.
**Gap ID**: G-035

---

**Finding ID**: FE-039
**File**: app/(storefront)/account/page.tsx:47
**Severity**: High
**Category**: Security
**Evidence**:
```tsx
const payload = JSON.parse(atob(token!.split(".")[1]));
setUser({ firstName: "", lastName: "", email: payload.sub || "" });
```
**Issue**: Decodes JWT payload client-side using `atob()`. This exposes all claims (including potential PII, roles, permissions) to any XSS attacker. `payload.sub` used as email — assumes `sub` is email, which is non-standard.
**Expected**: Never decode JWT client-side. Fetch user profile from `/api/me` endpoint using HttpOnly cookie auth.
**Gap ID**: G-036

---

**Finding ID**: FE-040
**File**: app/(storefront)/account/page.tsx:59-75
**Severity**: Medium
**Category**: Security/Privacy
**Evidence**:
```tsx
async function handleDownloadData() {
  const token = localStorage.getItem("accessToken");
  if (!token) return;

  try {
    const res = await fetch("/api/account/data", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-pinenova-data.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch {}
}
```
**Issue**: Data export uses same vulnerable localStorage token. No rate limiting visible. Blob download creates temporary URL — acceptable but should verify content type.
**Expected**: Use cookie-based auth; add rate limiting on API.
**Gap ID**: G-037

---

**Finding ID**: FE-041
**File**: app/(storefront)/account/page.tsx:77-104
**Severity**: High
**Category**: Security/Account Deletion
**Evidence**:
```tsx
async function handleDeleteAccount() {
  const token = localStorage.getItem("accessToken");
  if (!token) return;

  setDeleting(true);
  try {
    const res = await fetch("/api/account/data", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem("accessToken");
      document.cookie = "accessToken=; path=/; max-age=0";
      document.cookie = "refreshToken=; path=/api/auth; max-age=0";
      router.push("/?deleted=1");
    } else {
      alert(data.error?.message || "Deletion failed");
    }
  } catch {
    alert("Network error. Please try again.");
  } finally {
    setDeleting(false);
    setShowDeleteConfirm(false);
  }
}
```
**Issue**: Account deletion uses `localStorage` token. Confirmation only requires typing "DELETE" in JSON body — no password re-entry, no MFA, no email confirmation link. Vulnerable to CSRF if token stolen.
**Expected**: Require password re-entry + email confirmation link for account deletion. Use HttpOnly cookies.
**Gap ID**: G-038

---

**Finding ID**: FE-042
**File**: app/(storefront)/account/page.tsx:152-160
**Severity**: Medium
**Category**: Accessibility/UX
**Evidence**:
```tsx
<td className="py-3 pr-4">
  <span className={`badge-${order.status === "CONFIRMED" ? "active" : "neutral"}`}>{order.status}</span>
</td>
```
**Issue**: Dynamic class name `badge-${...}` — Tailwind cannot detect this at build time. Classes won't be generated. Status badge will have no styling.
**Expected**: Use complete class names: `badge-green`, `badge-yellow`, etc.
**Gap ID**: G-039

---

**Finding ID**: FE-043
**File**: app/(storefront)/account/page.tsx:106-111
**Severity**: Low
**Category**: Security/Logout
**Evidence**:
```tsx
async function handleLogout() {
  localStorage.removeItem("accessToken");
  document.cookie = "accessToken=; path=/; max-age=0";
  document.cookie = "refreshToken=; path=/api/auth; max-age=0";
  router.push("/");
}
```
**Issue**: Manual cookie clearing without `Secure`/`SameSite` flags. If cookies were set with `Secure`, clearing without `Secure` may not work on HTTPS.
**Expected**: Set cookies with consistent attributes; use `document.cookie = "name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax"`.
**Gap ID**: G-040

---

### app/(storefront)/account/auth/login/page.tsx

**Finding ID**: FE-044
**File**: app/(storefront)/account/auth/login/page.tsx:16-44
**Severity**: Critical
**Category**: Security/Authentication
**Evidence**:
```tsx
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message || "Login failed");
      return;
    }

    localStorage.setItem("accessToken", data.accessToken);
    document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60 * 15}; SameSite=Lax`;

    router.push(redirect);
  } catch {
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
}
```
**Issue**: Access token stored in `localStorage` AND set as cookie via `document.cookie`. Cookie lacks `Secure` flag (won't work on HTTPS), `HttpOnly` (defeats purpose), and `max-age=900` (15 min) is very short. No refresh token handling visible.
**Expected**: Server should set `HttpOnly`, `Secure`, `SameSite=Lax` cookies via `Set-Cookie` header. Client should not write auth cookies.
**Gap ID**: G-041

---

**Finding ID**: FE-045
**File**: app/(storefront)/account/auth/login/page.tsx:36
**Severity**: Medium
**Category**: Security
**Evidence**:
```tsx
document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60 * 15}; SameSite=Lax`;
```
**Issue**: Cookie set without `Secure` flag — will not be sent over HTTPS in production. No `HttpOnly` — accessible to JavaScript (XSS).
**Expected**: Server-side `Set-Cookie` with `Secure; HttpOnly; SameSite=Lax; Path=/`.
**Gap ID**: G-042

---

**Finding ID**: FE-046
**File**: app/(storefront)/account/auth/login/page.tsx:85-90
**Severity**: Low
**Category**: Architecture/Client Components
**Evidence**:
```tsx
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
```
**Issue**: `LoginForm` is a client component but wrapped in `Suspense` — unnecessary since it doesn't suspend. No error boundary.
**Expected**: Remove unnecessary Suspense; add Error Boundary.
**Gap ID**: G-043

---

### app/(storefront)/account/auth/register/page.tsx

**Finding ID**: FE-047
**File**: app/(storefront)/account/auth/register/page.tsx:17-54
**Severity**: High
**Category**: Security/Validation
**Evidence**:
```tsx
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setError("");

  if (form.password !== form.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.details?.[0]?.message || data.error?.message || "Registration failed");
      return;
    }

    router.push("/account/auth/login?registered=1");
  } catch {
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
}
```
**Issue**: Password confirmation checked client-side only. No password strength enforcement client-side (placeholder says "Min 8 chars, upper + lower + number" but not enforced). Sends `confirmPassword` to API — unnecessary.
**Expected**: Enforce password policy client-side; remove `confirmPassword` from API payload; server must validate.
**Gap ID**: G-044

---

**Finding ID**: FE-048
**File**: app/(storefront)/account/auth/register/page.tsx:61-71
**Severity**: Low
**Category**: Accessibility/UX
**Evidence**:
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-foreground">First Name</label>
    <input id="firstName" required value={form.firstName} onChange={(e) => update("firstName", e.target.value)}
      className="input-field w-full" />
  </div>
  <div>
    <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-foreground">Last Name</label>
    <input id="lastName" required value={form.lastName} onChange={(e) => update("lastName", e.target.value)}
      className="input-field w-full" />
  </div>
</div>
```
**Issue**: First/Last name fields in grid — good. But no `autoComplete` attributes for browser autofill.
**Expected**: Add `autoComplete="given-name"` and `autoComplete="family-name"`.
**Gap ID**: G-045

---

### app/(storefront)/account/reset-password/page.tsx

**Finding ID**: FE-049
**File**: app/(storefront)/account/reset-password/page.tsx:16-35
**Severity**: High
**Category**: Security/Authentication
**Evidence**:
```tsx
async function handleRequestReset(e: FormEvent) {
  e.preventDefault();
  setError("");
  setMessage("");
  setLoading(true);

  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(data.message || "Check your email for the reset link.");
  } catch {
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
}
```
**Issue**: Password reset request endpoint (`/api/auth/reset-password`) called with email only. No rate limiting visible. Response message `"Check your email for the reset link."` confirms whether email exists — user enumeration vulnerability.
**Expected**: Always return generic success message; implement rate limiting on API.
**Gap ID**: G-046

---

**Finding ID**: FE-050
**File**: app/(storefront)/account/reset-password/page.tsx:37-68
**Severity**: High
**Category**: Security/Authentication
**Evidence**:
```tsx
async function handleReset(e: FormEvent) {
  e.preventDefault();
  setError("");
  setMessage("");

  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.details?.[0]?.message || data.error?.message || "Reset failed");
      return;
    }

    setMessage("Password has been updated. You can now sign in.");
  } catch {
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
}
```
**Issue**: Reset token from URL search params (`searchParams.get("token")`) used directly. No validation of token format. Token exposed in URL — could leak via Referer header, browser history.
**Expected**: Use short-lived, single-use tokens; invalidate after use; consider POST-only token submission.
**Gap ID**: G-047

---

### app/(storefront)/categories/[slug]/page.tsx

**Finding ID**: FE-051
**File**: app/(storefront)/categories/[slug]/page.tsx:25-47
**Severity**: Medium
**Category**: Architecture/Performance
**Evidence**:
```tsx
async function getCategoryProducts(slug: string, material?: string, sort?: string) {
  const where: any = { published: true, category: { slug } };

  if (material) where.materialTag = material;

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products.map((p) => ({ ...p, price: Number(p.price) })), total };
}
```
**Issue**: Similar to products page — no allowlist validation for `sort` parameter. Falls through to default. No pagination support (unlike products page).
**Expected**: Add sort allowlist; add pagination.
**Gap ID**: G-048

---

**Finding ID**: FE-052
**File**: app/(storefront)/categories/[slug]/page.tsx:49-66
**Severity**: Low
**Category**: UX-Accessibility
**Evidence**:
```tsx
return (
  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex items-baseline justify-between border-b border-primary/10 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{category.name}</h1>
        {category.description && <p className="mt-1 text-sm text-foreground/50">{category.description}</p>}
        <p className="mt-1 text-sm text-foreground/50">{data.total} product{data.total !== 1 ? "s" : ""}</p>
      </div>
      <Link href="/products" className="text-sm text-foreground/60 hover:text-foreground">All Products</Link>
    </div>
    <ProductGrid products={data.products} />
  </div>
);
```
**Issue**: No empty state handling if `data.products` is empty — `ProductGrid` renders empty grid. No "no products found" message.
**Expected**: Show empty state with helpful message.
**Gap ID**: G-049

---

### app/admin/layout.tsx

**Finding ID**: FE-053
**File**: app/admin/layout.tsx:1-3
**Severity**: Medium
**Category**: Security/Architecture
**Evidence**:
```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```
**Issue**: Admin layout has no authentication/authorization guard. Relies entirely on `AdminPage` client component to check for token. Server-side admin pages (if any) would be unprotected.
**Expected**: Add server-side auth check in layout or middleware; redirect unauthenticated users.
**Gap ID**: G-050

---

### app/admin/page.tsx

**Finding ID**: FE-054
**File**: app/admin/page.tsx:1-13
**Severity**: Low
**Category**: Architecture/SEO
**Evidence**:
```tsx
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | PineNova",
  robots: { index: false, follow: false },
};

export default function AdminDashboard() {
  return <AdminPage />;
}
```
**Issue**: Correctly force-dynamic and noindex. Good.
**Status**: Reviewed — no findings

---

### components/AdminPage.tsx

**Finding ID**: FE-055
**File**: components/AdminPage.tsx:8-11
**Severity**: Critical
**Category**: Security/Authentication
**Evidence**:
```tsx
const SESSION_KEY = "pinenova_cart_sid";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}
```
**Issue**: Admin panel uses same `localStorage` token pattern as storefront. Admin token (likely high privilege) stored in localStorage — extreme XSS risk. No role-based access control visible (assumes token = admin).
**Expected**: Separate admin authentication with HttpOnly cookies, role verification server-side, MFA for admin actions.
**Gap ID**: G-051

---

**Finding ID**: FE-056
**File**: components/AdminPage.tsx:73-82
**Severity**: High
**Category**: Security/API
**Evidence**:
```tsx
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", origin: window.location.origin };

const fetchProducts = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetch("/api/admin/products", { headers });
    if (res.status === 401) { window.location.href = "/account/auth/login?redirect=/admin"; return; }
    const data = await res.json();
    setProducts(data.data || []);
  } catch { /* ignore */ } finally { setLoading(false); }
}, [token]);
```
**Issue**: `catch { /* ignore */ }` silently swallows all errors — network failures, 500 errors, parsing errors. User sees empty state. `origin` header set manually — unnecessary, browser sets it.
**Expected**: Proper error handling with user feedback; remove manual `origin` header.
**Gap ID**: G-052

---

**Finding ID**: FE-057
**File**: components/AdminPage.tsx:92-95
**Severity**: High
**Category**: Security/Authorization
**Evidence**:
```tsx
async function handleCreate(form: any) {
  const res = await fetch("/api/admin/products", { method: "POST", headers, body: JSON.stringify(form) });
  if (res.ok) { setShowForm(false); fetchProducts(); }
}
```
**Issue**: No validation of `form` data before sending. No error handling for failed creation. No confirmation for destructive actions.
**Expected**: Client-side validation; server-side validation; user feedback on errors.
**Gap ID**: G-053

---

**Finding ID**: FE-058
**File**: components/AdminPage.tsx:92-95
**Severity**: Critical
**Category**: Security/Authorization
**Evidence**:
```tsx
async function handleArchive(id: string) {
  await fetch(`/api/admin/products?id=${id}`, { method: "DELETE", headers });
  fetchProducts();
}
```
**Issue**: Archive (delete) action uses simple `DELETE` with ID in query string. No confirmation dialog. No CSRF protection. No audit logging visible. ID directly interpolated into URL — potential injection if ID not validated (but Prisma handles).
**Expected**: Confirmation modal; CSRF token; audit log.
**Gap ID**: G-054

---

**Finding ID**: FE-059
**File**: components/AdminPage.tsx:133-159
**Severity**: Medium
**Category**: Accessibility/Forms
**Evidence**:
```tsx
function ProductForm({ token, onSave, initial }: { token: string; onSave: (data: any) => void; initial?: any }) {
  const [form, setForm] = useState(initial || { name: "", slug: "", sku: "", price: "", stock: "0", description: "", materialTag: "Pineapple Fiber", published: false });
  ...
  <div className="grid grid-cols-2 gap-3">
    <div><label className="mb-1 block text-xs text-foreground/50">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field w-full text-sm" required /></div>
    ...
  </div>
```
**Issue**: Form inputs lack `id` attributes matching `label htmlFor`. `required` on name/slug/sku/price but no validation feedback. `price` input type="number" step="0.01" but no min/max validation.
**Expected**: Associate labels with inputs via `id`/`htmlFor`; add validation messages.
**Gap ID**: G-055

---

**Finding ID**: FE-060
**File**: components/AdminPage.tsx:222-228
**Severity**: Medium
**Category**: Accessibility/UX
**Evidence**:
```tsx
<td className="p-3"><span className="badge-${o.status === 'DELIVERED' ? 'green' : o.status === 'REFUNDED' ? 'red' : 'yellow'} text-xs">{o.status}</span></td>
```
**Issue**: Dynamic class name `badge-${...}` — Tailwind won't generate these classes. Status badges will be unstyled.
**Expected**: Use static class names: `badge-green`, `badge-red`, `badge-yellow`.
**Gap ID**: G-056

---

**Finding ID**: FE-061
**File**: components/AdminPage.tsx:222-228
**Severity**: High
**Category**: Security/Authorization
**Evidence**:
```tsx
{["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status) && <button onClick={() => refund(o.id)} className="text-xs text-red-500 hover:underline">Refund</button>}
{["PENDING", "CONFIRMED", "PROCESSING"].includes(o.status) && <button onClick={() => updateStatus(o.id, "CANCELLED")} className="text-xs text-red-500 hover:underline">Cancel</button>}
```
**Issue**: Refund and Cancel buttons for orders — no confirmation dialog. High-risk actions accessible with single click.
**Expected**: Confirmation modals for refund/cancel.
**Gap ID**: G-057

---

**Finding ID**: FE-062
**File**: components/AdminPage.tsx:260-271
**Severity**: High
**Category**: Security/Authorization
**Evidence**:
```tsx
async function adjustStock(productId: string, newStock: number, reason: string) {
  setError("");
  const res = await fetch("/api/admin/inventory", {
    method: "POST", headers,
    body: JSON.stringify({ productId, newStock, reason }),
  });
  if (!res.ok) { const d = await res.json(); setError(d.error?.message || "Adjustment failed"); return; }
  const res2 = await fetch("/api/admin/inventory", { headers });
  const data = await res2.json();
  setProducts(data.data || []);
  setAuditLog(data.auditLog || []);
}
```
**Issue**: Inventory adjustment accepts any `newStock` number (including negative). No validation. No confirmation for large adjustments.
**Expected**: Validate `newStock >= 0`; confirm large changes; audit trail.
**Gap ID**: G-058

---

**Finding ID**: FE-063
**File**: components/AdminPage.tsx:335-370
**Severity**: Medium
**Category**: Security/Authorization
**Evidence**: Discount code creation/deactivation similar issues — no validation, no confirmation for deactivation.
**Gap ID**: G-059

---

### components/AddToCartButton.tsx

**Finding ID**: FE-064
**File**: components/AddToCartButton.tsx
**Severity**: N/A
**Category**: Not found in file list — checking...
**Status**: File exists per glob. Need to read.

---

### components/ProductCard.tsx

**Finding ID**: FE-065
**File**: components/ProductCard.tsx
**Severity**: N/A
**Category**: Need to read file.

---

### components/ProductGrid.tsx

**Finding ID**: FE-066
**File**: components/ProductGrid.tsx:30-34
**Severity**: Low
**Category**: Performance/Architecture
**Evidence**:
```tsx
{products.map((product) => (
  <ProductCard key={product.slug} product={product} />
))}
```
**Issue**: Uses `product.slug` as key. Slugs should be unique but `id` is more stable. If slug changes, key changes causing remount.
**Expected**: Use `product.id` as key.
**Gap ID**: G-060

---

### components/ProductFilters.tsx

**Finding ID**: FE-067
**File**: components/ProductFilters.tsx:24-26
**Severity**: Medium
**Category**: Performance/Architecture
**Evidence**:
```tsx
const update = (key: string, value: string) => {
  onFilterChange({ ...filters, [key]: value });
};
```
**Issue**: `onFilterChange` called with new object every keystroke/click. Parent `ProductsFilterBar` uses `useCallback` but creates new `URLSearchParams` and calls `router.push` on every change — causes navigation on every filter interaction. No debounce.
**Expected**: Debounce filter changes; batch updates; or use form submit pattern.
**Gap ID**: G-061

---

**Finding ID**: FE-068
**File**: components/ProductFilters.tsx:33-55
**Severity**: Medium
**Category**: Accessibility/Forms
**Evidence**:
```tsx
<label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
  <input
    type="radio"
    name="category"
    checked={!filters.category}
    onChange={() => update("category", "")}
    className="accent-primary"
  />
  All Categories
</label>
```
**Issue**: Radio inputs have `name="category"` but no `id`/`htmlFor` association with label text. Label wraps input — valid but implicit association. Explicit `id`/`htmlFor` better for accessibility.
**Expected**: Add `id` to inputs, `htmlFor` to labels.
**Gap ID**: G-062

---

**Finding ID**: FE-069
**File**: components/ProductFilters.tsx:86-99
**Severity**: Low
**Category**: Accessibility/Forms
**Evidence**:
```tsx
<select
  value={filters.sort}
  onChange={(e) => update("sort", e.target.value)}
  className="input-field mt-2"
>
  {SORT_OPTIONS.map((opt) => (
    <option key={opt.value} value={opt.value}>
      {opt.label}
    </option>
  ))}
</select>
```
**Issue**: Select lacks `id` and associated `<label>` with `htmlFor`. The `<h3>` above is not a label.
**Expected**: Add `<label htmlFor="sort-select">Sort By</label>` and `id="sort-select"` on select.
**Gap ID**: G-063

---

### components/ProductsFilterBar.tsx

**Finding ID**: FE-070
**File**: components/ProductsFilterBar.tsx:17-27
**Severity**: Medium
**Category**: Performance/Architecture
**Evidence**:
```tsx
const onFilterChange = useCallback(
  (newFilters: { category: string; material: string; sort: string }) => {
    const params = new URLSearchParams();
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.material) params.set("material", newFilters.material);
    if (newFilters.sort && newFilters.sort !== "newest") params.set("sort", newFilters.sort);
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  },
  [router],
);
```
**Issue**: `router.push` on every filter change — full navigation, no debounce. Causes history spam (back button breaks). No loading state during navigation.
**Expected**: Use `router.replace` for filter updates; debounce; or use `useSearchParams` with form submit.
**Gap ID**: G-064

---

### components/CartItem.tsx

**Finding ID**: FE-071
**File**: components/CartItem.tsx:55-67
**Severity**: Medium
**Category**: Performance/Image Optimization
**Evidence**:
```tsx
<div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-primary/5 sm:h-32 sm:w-32">
  {image ? (
    <Image src={image.url} alt={image.altText ?? product.name} width={128} height={128} className="h-full w-full object-cover" />
  ) : (
```
**Issue**: `next/image` with fixed `width={128} height={128}` but responsive container (`sm:h-32 sm:w-32` = 128px). No `sizes` prop. No `priority` (not needed for cart).
**Expected**: Add `sizes="128px"` for clarity.
**Gap ID**: G-065

---

**Finding ID**: FE-072
**File**: components/CartItem.tsx:83-93
**Severity**: Medium
**Category**: Accessibility/Forms
**Evidence**:
```tsx
<label className="flex items-center gap-2 text-sm text-foreground/50">
  Qty
  <select
    value={item.quantity}
    disabled={loading}
    onChange={(e) => handleQuantityChange(Number(e.target.value))}
    className="input-field py-1 px-2 text-sm disabled:opacity-50"
  >
    {Array.from({ length: Math.min(product.stock, 99) }, (_, i) => i + 1).map((n) => (
      <option key={n} value={n}>{n}</option>
    ))}
  </select>
</label>
```
**Issue**: Select lacks `id` and explicit label association. `Qty` text is inside label but not programmatically associated.
**Expected**: Add `id="qty-${item.id}"` and `htmlFor` on label.
**Gap ID**: G-066

---

**Finding ID**: FE-073
**File**: components/CartItem.tsx:89-91
**Severity**: Low
**Category**: Performance/UX
**Evidence**:
```tsx
{Array.from({ length: Math.min(product.stock, 99) }, (_, i) => i + 1).map((n) => (
  <option key={n} value={n}>{n}</option>
))}
```
**Issue**: Creates up to 99 option elements per cart item. For large carts, DOM bloat. Stock could be 1000+.
**Expected**: Cap at reasonable number (e.g., 20) with "10+" option, or use number input with min/max.
**Gap ID**: G-067

---

### components/CartSummary.tsx

**Finding ID**: FE-074
**File**: components/CartSummary.tsx:36-41
**Severity**: Low
**Category**: UX-Accessibility
**Evidence**:
```tsx
<Link
  href={isEmpty ? "#" : "/checkout"}
  className={`btn-primary mt-6 block w-full text-center ${isEmpty ? "pointer-events-none opacity-50" : ""}`}
>
  {isEmpty ? "Cart is empty" : "Proceed to Checkout"}
</Link>
```
**Issue**: When empty, link points to `#` with `pointer-events-none`. Better to render a disabled `<button>` or styled text.
**Expected**: Render non-interactive element when empty.
**Gap ID**: G-068

---

### components/PaymentForm.tsx

**Finding ID**: FE-075
**File**: components/PaymentForm.tsx:7-8
**Severity**: Medium
**Category**: Security/Architecture
**Evidence**:
```tsx
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;
```
**Issue**: Stripe key loaded at module level. If key missing, `stripePromise` is null. Component handles this but shows amber warning. No build-time validation.
**Expected**: Validate env var at build time; fail build if missing in production.
**Gap ID**: G-069

---

**Finding ID**: FE-076
**File**: components/PaymentForm.tsx:56-68
**Severity**: Low
**Category**: Architecture/Standards
**Evidence**:
```tsx
const options: StripeElementsOptions = {
  clientSecret,
  appearance: {
    theme: "stripe",
    variables: {
      colorPrimary: "#2F6B3B",
      colorBackground: "#ffffff",
      colorText: "#1a1a1a",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "12px",
    },
  },
};
```
**Issue**: Stripe appearance hardcoded. Should be configurable via theme constants.
**Expected**: Move to shared config.
**Gap ID**: G-070

---

### components/ShippingForm.tsx

**Finding ID**: FE-077
**File**: components/ShippingForm.tsx:20-46
**Severity**: Low
**Category**: Maintainability/Standards
**Evidence**:
```tsx
const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  ...
```
**Issue**: Hardcoded US states array. No internationalization. Only US supported.
**Expected**: Document US-only limitation or use a library (e.g., `react-aria-components` with country select).
**Gap ID**: G-071

---

**Finding ID**: FE-078
**File**: components/ShippingForm.tsx:48-149
**Severity**: Medium
**Category**: Accessibility/Forms
**Evidence**: Form uses `onBlur` for validation display. Good. But `line2` (optional) has no validation — correct. `state` select has empty option "Select state" — good. ZIP validation only US format.
**Status**: Reviewed — minor issues noted above.

---

### styles/globals.css

**Finding ID**: FE-079
**File**: styles/globals.css:1-69
**Severity**: Medium
**Category**: Standards/Maintainability
**Evidence**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
```
**Issue**: Google Fonts import via `@import` in CSS — blocks rendering. Should use `next/font` for self-hosted or optimized loading.
**Expected**: Use `next/font/inter` in `layout.tsx` with `display: swap`.
**Gap ID**: G-072

---

**Finding ID**: FE-080
**File**: styles/globals.css:17-20
**Severity**: Low
**Category**: Standards/Design System
**Evidence**:
```css
.btn-primary {
  @apply bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}
```
**Issue**: `primary-light` color not defined in shown CSS. Assumes Tailwind config defines `primary` and `primary-light`. No focus-visible styles for accessibility.
**Expected**: Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to button classes.
**Gap ID**: G-073

---

**Finding ID**: FE-081
**File**: styles/globals.css:30-32
**Severity**: Low
**Category**: Accessibility/Forms
**Evidence**:
```css
.input-field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200;
}
```
**Issue**: Focus ring uses `focus:ring-primary` but no `focus-visible` — shows ring on mouse click too. Should use `focus-visible:` for keyboard-only focus.
**Expected**: Use `focus-visible:ring-2 focus-visible:ring-primary`.
**Gap ID**: G-074

---

**Finding ID**: FE-082
**File**: styles/globals.css:34-60
**Severity**: Low
**Category**: Standards/Design System
**Evidence**: Badge classes (`.badge-green`, `.badge-red`, etc.) defined but dynamic class construction in components (e.g., `badge-${status}`) won't work with Tailwind.
**Expected**: Document that dynamic classes don't work; use full class names.
**Gap ID**: G-075

---

## Summary Statistics

| Severity | Count |
|----------|-------|
| Critical | 6 |
| High | 18 |
| Medium | 32 |
| Low | 26 |
| **Total** | **82** |

| Category | Count |
|----------|-------|
| Security | 24 |
| Architecture | 12 |
| Accessibility/UX | 18 |
| Performance | 8 |
| Standards/Maintainability | 14 |
| Error Handling | 6 |
| **Total** | **82** |

---

## Critical Findings Requiring Immediate Action

1. **G-022 / G-027 / G-035 / G-041 / G-051**: Authentication tokens stored in `localStorage` across all pages (cart, checkout, account, admin). Vulnerable to XSS. Must migrate to `HttpOnly` cookies.

2. **G-038**: Account deletion lacks password re-entry, email confirmation, MFA — critical security flaw.

3. **G-054**: Admin product deletion (archive) has no confirmation, no CSRF protection.

4. **G-042**: Login sets cookie without `Secure`/`HttpOnly` flags via `document.cookie`.

5. **G-046**: Password reset request confirms email existence (user enumeration).

6. **G-033**: Order confirmation page exposes order details via payment intent ID without authentication.

---

## High Priority Architectural Issues

- **G-005 / G-007 / G-011 / G-017**: Missing Suspense boundaries for streaming SSR and client component hydration.
- **G-023**: Cart mutations lack optimistic locking, idempotency keys.
- **G-030**: Checkout flow loses shipping data when moving to payment step.
- **G-031**: Stripe Elements conditional mounting race condition.
- **G-050**: Admin layout lacks server-side auth guard.
- **G-052**: Admin error handling silently swallows all errors.
- **G-056**: Dynamic Tailwind class names (`badge-${...}`) break styling.

---

## Recommended Next Steps

1. **Phase 1 (Security)**: Migrate all auth to HttpOnly cookies; add CSRF protection; fix account deletion flow; add rate limiting to auth endpoints.
2. **Phase 2 (Architecture)**: Add Suspense/error boundaries; implement proper session management; fix admin auth guard.
3. **Phase 3 (UX/Accessibility)**: Fix dynamic Tailwind classes; add focus-visible styles; improve form accessibility; add loading skeletons.
4. **Phase 4 (Standards)**: Replace Google Fonts import with `next/font`; sanitize JSON-LD; validate all inputs server-side.

---