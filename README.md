# PineNova — Vegan Leather Ecommerce Platform

Pineapple-fiber vegan leather ecommerce platform selling Bags, Wallets, Belts, and Footwear. Built with Next.js 14, Prisma, Stripe, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Payments**: Stripe (Payment Intents, Webhooks, Refunds)
- **Auth**: JWT access/refresh tokens, bcrypt password hashing
- **UI**: Tailwind CSS, React Server Components
- **Testing**: Vitest (unit + integration), Playwright (e2e)
- **Infrastructure**: AWS S3 (images), Pino (logging)

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
├── (storefront)/     # Public pages (products, cart, checkout, account)
├── admin/            # Admin dashboard UI
└── api/              # API routes
    ├── admin/        # Products, orders, inventory, discounts, metrics
    ├── auth/         # Login, register, refresh, reset-password
    ├── cart/         # Cart CRUD
    ├── checkout/     # Checkout + payment
    ├── account/      # Account data, order history
    └── stripe/       # Webhook handler
components/           # Reusable UI components
lib/                  # Core modules (auth, stripe, db, logger, s3, rate-limit)
services/             # Business logic (checkout, inventory)
prisma/               # Schema, migrations, seed
types/                # Zod schemas + TypeScript types
tests/                # Unit + integration tests
specs/                # Spec-kit documentation
```

## Features

- **Storefront**: Product catalog with categories, search, filter, sort; product detail with images
- **Cart**: Add/remove/update items, session-based, stock validation
- **Checkout**: Shipping address, discount codes, server-authoritative pricing, Stripe payment, webhook processing, order confirmation
- **Auth**: Register, login, JWT refresh, password reset, middleware gating
- **Admin Dashboard**: CRUD products/orders/inventory/discounts, order status state machine, refund processing, sales metrics + CSV export
- **Discount Codes**: Percentage or fixed-amount, usage limits, expiry, min order, validation at checkout

## Tests

```bash
npm test              # vitest run (168 tests across 9 suites)
npm run test:watch    # watch mode
npm run test:e2e      # Playwright e2e
npm run build         # production build
```

## Environment Variables

See `.env.example` for all required vars: database, Stripe, JWT, S3, email.
