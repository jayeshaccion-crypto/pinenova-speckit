# PineNova — Vegan Leather Ecommerce Platform

Pineapple-fiber vegan leather ecommerce platform selling Bags, Wallets, Belts, and Footwear. Built with Next.js 14, Prisma, Stripe, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router), TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM 5.22
- **Cache**: Redis 7
- **Payments**: Stripe v17 (Payment Intents, Webhooks, Refunds)
- **Auth**: JWT access/refresh tokens (httpOnly cookies), bcrypt, 2FA (TOTP)
- **UI**: Tailwind CSS, React Server Components, Client Components
- **Testing**: Vitest (unit + integration), Playwright (e2e)
- **Infrastructure**: AWS S3 (images), Pino (logging), Sentry (error tracking)

## Getting Started

```bash
cp .env.example .env   # fill in DATABASE_URL, STRIPE_SECRET_KEY, JWT_SECRET
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Admin login: `admin@pinenova.com` / `Admin1234` (created by seed).

## Project Structure

```
app/                  # Next.js App Router routes
├── (storefront)/     # Public pages (products, cart, checkout, account, blog)
├── admin/            # Admin dashboard (guarded by server-side JWT check)
└── api/              # API routes
    ├── admin/        # Products, orders, inventory, discounts, metrics, users, webhooks
    ├── auth/         # Login, register, refresh, reset-password, 2FA (setup/verify/disable/challenge)
    ├── cart/         # Cart CRUD (session-based + authenticated)
    ├── checkout/     # Checkout + Stripe PaymentIntent
    ├── account/      # Account data, profile, order history
    ├── products/     # Product listing, search, reviews
    ├── blog/         # Blog articles CRUD
    └── stripe/       # Webhook handler (payment success/failure)
components/           # Reusable UI components (Header, CartDrawer, Gallery, etc.)
lib/                  # Core modules (auth, stripe, db, logger, s3, rate-limit, totp, audit)
services/             # Business logic (checkout with pricing/discounts, inventory)
prisma/               # Schema, migrations, seed
types/                # Zod schemas + TypeScript types
tests/                # Unit + integration tests
specs/                # Spec-kit documentation
```

## Features

- **Storefront**: Product catalog with categories, search, filter, sort; product detail with image gallery (thumbnail strip + main), variant selector (size/color), related products, recently viewed
- **Cart**: Add/remove/update items, session-based, stock validation, mini-cart drawer with quantity controls, discount code input
- **Checkout**: Shipping address, discount codes, server-authoritative pricing (subtotal/discount/shipping/tax breakdown), Stripe PaymentElement, webhook processing, order confirmation with email
- **Auth**: Register, login, JWT refresh (httpOnly cookies), forgot/reset password, 2FA (TOTP setup with QR code + backup codes, verify, challenge, disable)
- **Account**: Profile management, order history, 2FA settings, password change
- **Admin Dashboard**: Server-component auth guard, CRUD products/orders/inventory/discounts, order status state machine, refund processing, sales metrics + CSV export, bulk actions
- **Blog**: Article listing/detail, admin CRUD
- **Discount Codes**: Percentage or fixed-amount, usage limits, expiry, min order, validation at checkout
- **Rate Limiting**: Per-endpoint rate limits with Redis
- **CSRF Protection**: Origin/referer validation on mutating endpoints, CSRF token check on auth-sensitive routes

## UI Components

- `Header` — Sticky header with logo, search bar, nav links, auth state (login/register or UserMenu), cart with badge, mobile hamburger
- `MobileMenu` — Full-screen mobile nav with auth state and cart link
- `UserMenu` — Dropdown with account, orders, admin (if admin), logout
- `MiniCartDrawer` — Slide-in drawer from right with cart items, quantity +/- buttons, remove, subtotal, discount code, checkout links
- `CartDiscountCode` — Discount code input with apply/remove, validation, green applied tag
- `CartItem` — Line item with image, name, price, quantity selector, remove
- `CartSummary` — Order summary card with subtotal, discount, shipping, tax, total
- `ProductImageGallery` — Main image + thumbnail strip, click to switch
- `VariantSelector` — Size and color picker buttons (placeholder)
- `RelatedProducts` — Server component, fetches same-category products
- `RecentlyViewed` — Client component, tracks last 8 viewed products in localStorage
- `AllReviews` — Paginated review list with page reset on toggle
- `ReviewForm` — Star rating + text review submission
- `ProductCard` — Grid card with image, name, price, stock badge, add-to-cart
- `ProductFilters` — Sidebar filters (category, material, price range)
- `SearchBar` — Search input with autocomplete
- `ShippingForm` — Address input fields with validation
- `PaymentForm` — Stripe PaymentElement wrapper
- `ToastProvider` — Global toast notifications (success/error/info)
- `AuthContext` — React Context for user session
- `CartContext` — React Context for cart state (add, update, remove, clear)

## Implementation Status

Phases 1–4 complete (Header, Auth, Cart/Checkout, Product pages). Next: Phase 5 (Admin: sidebar actions, bulk orders, image upload). See `UI_IMPLEMENTATION_AUDIT.md` and `OPENCODE_WORKFLOW_v2.md` for details.

## Tests

```bash
npm test              # vitest run (171 tests across 9 suites)
npm run test:watch    # watch mode
npm run test:e2e      # Playwright e2e
npm run build         # production build (TS + lint)
npm run lint          # ESLint
npm run typecheck     # TypeScript type check
```

## Environment Variables

See `.env.example` for all required vars: database, Stripe, JWT, S3, email, Redis, Sentry.
