# 00 — Deterministic Assumptions (Source of Truth)

> This file is fixed. Every other document and every generated code file in
> every phase must be consistent with this file. If any later phase appears
> to contradict this file, this file wins.

## Brand

| Key | Value |
|---|---|
| Brand Name | PineNova |
| Product Material | Pineapple-fiber vegan leather |
| Target Market | United States |
| Language | English |
| Currency | USD, INR |
| Timezone | UTC |

## Commerce Rules

| Key | Value |
|---|---|
| Price Range | $49–$289 (USD); ₹4,084–₹24,116 (INR) |
| Tax | 10% |
| Shipping | Flat rate $8; free above $120 |
| Guest Checkout | Disabled (account required) |
| Customer Self-Cancellation | Enabled (before shipping only) |
| Inventory Tracking | Enabled |
| Reviews | Enabled |
| Primary Keys | UUID |

## Authentication

| Key | Value |
|---|---|
| Strategy | JWT Access Token + Refresh Token |
| Password Hashing | bcrypt |
| Roles | CUSTOMER, ADMIN |

## Payments

| Key | Value |
|---|---|
| Provider | Stripe |
| Flow | Stripe Checkout Session API |
| Webhook | Required for order confirmation |

## Deployment Targets

| Layer | Provider |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Railway PostgreSQL |
| Object Storage | AWS S3-compatible bucket |

## Technology Stack (Fixed)

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, React Server
Components, Server Actions where appropriate, TanStack Query, Zustand, React
Hook Form, Zod.

**Backend:** Next.js API Routes (Express only where a capability is
unavailable in Route Handlers — e.g. long-running webhook retries with
custom middleware chains; this is the only permitted exception and is
decided once, here, not re-litigated per endpoint), PostgreSQL, Prisma ORM,
JWT, bcrypt, Stripe, security headers (via Next.js middleware), rate limiter, Pino logger.

**Validation:** Zod (shared schemas between client and server). Confirm-password validation enforced server-side via Zod schemas in addition to client-side.

**Testing:** Vitest (unit/integration), Playwright (e2e).

**Tooling:** ESLint, Prettier, Husky.

## Product Catalogue (Fixed — do not rename, reorder, or invent)

| Category | Product 1 | Product 2 | Product 3 |
|---|---|---|---|
| Bags | Pine Classic Tote | Pine Urban Backpack | Pine Travel Duffel |
| Wallets | Slim Fold Wallet | Minimal Card Holder | Travel Passport Wallet |
| Belts | Classic Brown Belt | Classic Black Belt | Reversible Belt |
| Footwear | Urban Sneakers | Casual Loafers | Weekend Slip-ons |

12 products total, 4 categories, 3 products per category.

## Design System

| Token | Value |
|---|---|
| Primary | `#2F6B3B` |
| Secondary | `#8AAE5D` |
| Accent | `#D6C28F` |
| Background | `#FAFAF7` |
| Text | `#1A1A1A` |
| Border Radius | 12px |
| Spacing Unit | 8px grid |
| Typography | Inter |

## Coding Standards

- Strict TypeScript, no `any`.
- Repository pattern for data access (no direct Prisma calls scattered
  through route handlers/components).
- No duplicated logic — shared logic factored into `/lib` or `/utils`.
- No pseudocode, no `TODO`, no "implement later" comments in any generated
  code file.
- Search covers product name, description, and material tag.
- Security headers (Helmet-equivalent) applied via Next.js middleware.ts
  since Route Handlers do not support Express middleware natively.
