# Implementation Plan: PineNova E-Commerce Platform

**Branch**: `001-pinenova-ecommerce` | **Date**: 2026-07-11 | **Spec**: specs/001-pinenova-ecommerce/spec.md

**Input**: Feature specification from `specs/001-pinenova-ecommerce/spec.md`

## Summary

Build a production e-commerce platform for a pineapple vegan leather goods brand. Customers browse products by category (bags, wallets, belts, footwear), filter/sort, view details with real-time stock, checkout via Stripe (guest or account), and access SEO content. Admins manage products, inventory, orders, discounts, and view sales metrics. System must meet Core Web Vitals, PCI compliance via Stripe, oversell prevention with pessimistic locking, and graceful degradation when non-critical services fail.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS

**Primary Dependencies**: Next.js 14 (App Router), Tailwind CSS, Prisma ORM, Stripe SDK, JWT (jsonwebtoken + jose), Sentry-equivalent error tracking, Sharp (image optimization)

**Storage**: PostgreSQL 16 (via Prisma migrations), S3-compatible object storage (product images), CDN (CloudFront/Cloudflare) in front of static assets

**Testing**: Vitest (unit), Playwright (E2E), k6 or Artillery (load/concurrency tests)

**Target Platform**: Web — modern browsers (Chrome, Firefox, Safari, Edge, mobile browsers)

**Project Type**: Web application (SSR + ISR for SEO-critical pages)

**Performance Goals**: LCP < 2.5s, CLS < 0.1, INP < 200ms per Core Web Vitals; product page SSR response < 200ms p95; checkout submission < 1s p95 including Stripe API latency

**Constraints**: No card data stored on servers (Stripe Elements only); inventory never oversells via pessimistic locking; backward-compatible DB migrations; feature flags gate checkout/payment; checkout error rate < 0.1%

**Scale/Scope**: Launch targeting single-country (US) with flat-rate shipping and static tax tables. Multi-country, Avalara/TaxJar, backorders, and cart reservations deferred to v2.

## Constitution Check

- **Checkout/Payment Reliability (P0)**: Met — Stripe tokenization, pessimistic inventory locking, idempotency keys, feature flag gate, alerting on error rate
- **Data Protection**: Met — Stripe handles card data; PII encrypted at rest; secrets via environment variables; credential scanning in CI
- **SEO & Core Web Vitals**: Met — SSR/ISR for product/category pages, image CDN, schema.org markup, sitemap, pre-launch crawl
- **TDD for High-Risk Logic**: Met — pricing, inventory, tax, checkout logic require tests before implementation
- **Idempotency**: Met — Stripe idempotency keys, database-level locking, webhook idempotency via event IDs
- **Graceful Degradation**: Met — feature flags isolate checkout from non-critical services; circuit breakers for recommendations/reviews
- **Observability**: Met — structured logging + error tracking on all checkout/payment paths; uptime alerting

## Project Structure

### Documentation (this feature)

```text
specs/001-pinenova-ecommerce/
├── spec.md              # Feature specification
├── plan.md              # This file
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router
│   ├── (storefront)/             # Customer-facing routes
│   │   ├── page.tsx              # Homepage
│   │   ├── products/
│   │   │   ├── [slug]/page.tsx   # Product detail (ISR)
│   │   │   └── page.tsx          # Listing + filters
│   │   ├── cart/page.tsx
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   └── confirmation/page.tsx
│   │   ├── account/
│   │   │   ├── page.tsx          # Overview + order history
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   └── blog/
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx   # Blog post (ISR)
│   ├── admin/
│   │   ├── page.tsx              # Dashboard + all admin views (tabbed)
│   │   └── layout.tsx            # Admin auth guard wrapper
│   ├── api/
│   │   ├── auth/route.ts         # Login, register, refresh, reset
│   │   ├── products/route.ts
│   │   ├── cart/route.ts
│   │   ├── checkout/route.ts     # Create payment intent + confirm
│   │   ├── stripe/webhook/route.ts
│   │   ├── admin/route.ts        # All admin CRUD (products, orders, inventory, discounts, blog, metrics)
│   │   └── account/route.ts      # Orders, GDPR data export/deletion
│   └── sitemap.ts/route.ts
├── components/
│   ├── ui/                       # Primitives (Button, Input, Modal, Select, Table)
│   ├── ProductCard.tsx
│   ├── ProductFilters.tsx
│   ├── VariantSelector.tsx
│   ├── CartItem.tsx
│   ├── CartSummary.tsx
│   ├── PaymentForm.tsx           # Stripe Elements wrapper
│   ├── ShippingForm.tsx
│   └── AdminPage.tsx             # Single admin page with tabbed sections
├── lib/
│   ├── prisma.ts
│   ├── stripe.ts
│   ├── auth.ts                   # JWT utils + refresh rotation
│   ├── s3.ts
│   ├── email.ts
│   ├── rate-limiter.ts
│   ├── feature-flags.ts
│   └── observability.ts          # Logger + Sentry init (combined)
├── services/                     # Business logic (testable, no HTTP dependency)
│   ├── checkout.service.ts       # Orchestrates: pricing → inventory lock → Stripe charge → order
│   └── inventory.service.ts      # Pessimistic locking, stock queries, audit trail
├── middleware.ts                 # Auth guard + rate limiting
├── instrumentation.ts            # Sentry + logging bootstrap
└── scripts/
    ├── seed.ts                   # Seed categories + sample products
    └── data-retention.ts         # Weekly GDPR data purge (run via cron)
prisma/
├── schema.prisma
└── migrations/
tests/
├── unit/
│   ├── checkout.service.test.ts  # Covers pricing, tax, shipping, inventory lock, order
│   └── inventory.service.test.ts # Covers lock acquisition, oversell prevention, audit
├── integration/
│   ├── checkout-flow.test.ts     # Full checkout via Stripe test mode
│   └── auth-flow.test.ts         # Login, register, refresh, password reset
└── e2e/
    ├── customer-journey.spec.ts  # Browse → product → add to cart → checkout (guest + account)
    └── admin.spec.ts             # Login → manage products → manage orders → view metrics
```

**Structure Decision**: Next.js App Router monolith — one deploy unit, small-team operable. Business logic extracted to only 2 services (`checkout.service` and `inventory.service`) where TDD is constitution-mandated. All other data access is direct Prisma queries in API routes or server components. Admin uses a single page with tabbed sections to minimize route/component surface area. Background jobs are npm scripts (no job infrastructure). No premature service abstraction.

## Complexity Tracking

No constitution violations. Service count reduced from 12 to 2; background job infrastructure removed; admin routes collapsed into single page. Architecture is proportional to small-team delivery of a single-country v1 launch.
