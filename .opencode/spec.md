# PineNova — Project Specification

## Domain
Direct-to-consumer (DTC) ecommerce for sustainable pineapple-fiber (Piñatex) vegan leather goods — bags, wallets, belts, footwear.

## Users

### Customers
- Browse products by category, search, filter, and sort
- View product detail with images, pricing, reviews, sustainability badges
- Manage shopping cart (add, update quantities, remove)
- Checkout via Stripe (shipping address, discount codes)
- View order history and order detail with status timeline
- Submit and read product reviews
- Manage profile and two-factor authentication

### Admins
- Manage products (CRUD, publish/unpublish)
- Manage orders (list, filter, update status, process refunds)
- Manage inventory (view stock, adjust levels, audit log)
- Manage discount codes (create, deactivate, usage tracking)
- View dashboard metrics (revenue, orders, avg order value)
- Manage users (future)

## Technical Architecture

### Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | ^5.6 |
| UI | React (Server + Client Components) | 18.3.1 |
| Styling | Tailwind CSS | ^3.4 |
| Database | PostgreSQL 16 | Docker |
| ORM | Prisma | ^5.22 |
| Payments | Stripe (Checkout Sessions, Payment Intents, Refunds) | ^17.3 |
| Auth | JWT (jose) + bcryptjs + otplib (2FA) | — |
| Cache | Redis 7 | Docker |
| State (Client) | Zustand 5 + TanStack Query 5 | — |
| Validation | Zod | ^3.23 |
| Email | SendGrid (raw fetch) | — |
| File Storage | AWS S3 | @aws-sdk/client-s3 |
| Rate Limiting | ioredis + in-memory fallback | — |
| Logging | Pino | ^9.5 |
| Error Tracking | Sentry | ^10.65 |
| Testing | Vitest | 2.1.9 |
| CI/CD | GitHub Actions (defined, not active) | — |

### Architecture
Monolithic Next.js 14 App Router — Server Components by default, Client Components for interactivity. Route Handlers for API (28 endpoints). Services layer for business logic (checkout, inventory). No Express (ADR-001). Repository layer deprecated (ADR-003).

### Route Structure
- **Storefront (12):** `/`, `/products`, `/products/[slug]`, `/categories/[slug]`, `/cart`, `/checkout`, `/checkout/confirmation`, `/account`, `/account/orders/[id]`, `/account/auth/login`, `/account/auth/register`, `/account/reset-password`
- **Blog (2):** `/blog`, `/blog/[slug]`
- **Admin (1):** `/admin` with 5 tabs (Products, Orders, Inventory, Discounts, Metrics)
- **API (28):** Account (4), Admin (9), Auth (8), Blog (2), Cart (1), Checkout (1), Health (1), Products (2), Stripe webhook (1)

### Key Design Decisions
1. Server-authoritative pricing — client-supplied `amount`/`price` rejected
2. JWT with refresh token rotation — bcrypt-hashed refresh tokens, old deleted on rotation
3. Rate limiting dual backend — Redis with in-memory fallback
4. Idempotent webhook processing — `eventId` unique constraint deduplicates Stripe events
5. Inventory serialization — `SELECT ... FOR UPDATE` with retry on serialization failure
6. Session-based carts — anonymous via `sessionId` cookie, linked on login

## Data Model (14 tables)
User, Product, Category, Image, Cart, CartItem, Order, OrderItem, OrderStatusLog, Review, BlogArticle, DiscountCode, AuditLog, RefreshToken, WebhookEvent

## File Layout (~150 source files, ~12,200 LOC)
```
app/            — 58 files (routes + pages)
components/     — 13 .tsx
lib/            — 13 .ts (core modules)
services/       — 2 .ts (business logic)
types/          — 1 .ts (Zod schemas + TypeScript types)
tests/          — 9 test files (171 tests)
prisma/         — schema + seed
docs/           — 33 files (24 are stubs)
```

## Current State
- **Epics complete:** E1 (Catalogue), E3 (Cart), E5 (Orders), E7 (Reviews)
- **Epics partial:** E2 (Auth — cookie security), E4 (Checkout — double-charge risk), E6 (Inventory — releaseStock race), E10 (Emails — env var mismatch)
- **Epics not started:** E8 (Admin dashboard), E9 (Blog admin), E11 (Multi-currency), E12 (Payment gateways)
- **Overall:** 29/43 stories done (67%)
- **Build:** 41 routes, 0 errors
- **Tests:** 171/171 passing

## Success Criteria
- [ ] Checkout completes in under 3 minutes
- [ ] Orders created within 5s of Stripe webhook confirmation
- [ ] Atomic inventory — no overselling (reserveStock + releaseStock both atomic)
- [ ] Reviews show accurate average rating from all approved reviews
- [ ] Auth cookies have HttpOnly, Secure, SameSite=Lax flags
- [ ] API error responses use consistent format (`apiError()`)
- [ ] CSP nonce header correctly named (`x-nonce`) for production
- [ ] Zero silent catch blocks — all errors logged
- [ ] npm run build passes (0 errors)
- [ ] npm test passes (171/171)
