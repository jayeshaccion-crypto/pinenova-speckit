# PineNova — Ecommerce Platform Blueprint

Pineapple-fiber vegan leather ecommerce platform (Bags, Wallets, Belts, Footwear).

This repository is the scaffold for the full production blueprint defined in
`docs/00-assumptions.md`. All deterministic assumptions (brand, product
catalogue, pricing, stack, design tokens) live there and must not be changed
between generations — every later phase references that file as the single
source of truth.

## Status

This is **Phase 0**: folder structure + documentation scaffold only.
No application code has been generated yet. Each subsequent phase fills in
one or more of the folders below and is tracked as its own numbered doc in
`/docs`.

## Phased Delivery Plan

| Phase | Deliverable | Doc |
|---|---|---|
| 0 | Assumptions, repo tree, folder scaffold | `docs/00-assumptions.md`, `docs/01-repository-tree.md` |
| 1 | System architecture, DB ER diagram, Prisma schema, SQL migration, seed script | `docs/02-*` → `docs/06-*` |
| 2 | Product catalogue JSON | `docs/07-product-catalogue.md` |
| 3 | REST API specification + auth flow | `docs/08-api-specification.md`, `docs/09-auth-flow.md` |
| 4 | Frontend pages, reusable components, state management | `docs/10-*` → `docs/12-*` |
| 5 | Checkout flow, admin dashboard | `docs/13-checkout-flow.md`, `docs/14-admin-dashboard.md` |
| 6 | SEO, content marketing (5 blog articles) | `docs/15-seo.md`, `docs/16-content-marketing.md` |
| 7 | Performance, security, accessibility | `docs/17-*` → `docs/19-*` |
| 8 | Environment variables, Docker, CI/CD | `docs/20-*` → `docs/22-*` |
| 9 | Testing strategy, deployment & production readiness checklists | `docs/23-*`, `docs/24-*` |

## Folder Structure

```
pinenova/
├── app/          # Next.js 14 App Router routes, layouts, server actions
├── components/   # Reusable UI components (client + server)
├── lib/          # Core libs: db client, auth, stripe, s3, logger
├── hooks/        # Custom React hooks
├── prisma/       # schema.prisma, migrations, seed.ts
├── public/       # Static assets
├── styles/       # Tailwind config, globals.css
├── types/        # Shared TypeScript types & zod schemas
├── utils/        # Pure helper functions
├── emails/       # Transactional email templates (order confirmation, etc.)
├── scripts/      # One-off / maintenance scripts
├── tests/        # Vitest unit/integration + Playwright e2e
└── docs/         # This blueprint, phase by phase
```

Each of the above folders currently contains a placeholder `README.md`
describing exactly what will land there and in which phase.

## Next Step

Say **"proceed with Phase 1"** (or name any phase/deliverable directly) and
I'll generate that batch of files against the fixed assumptions — no
re-confirmation needed, no scope drift.
