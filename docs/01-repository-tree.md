# 01 — Complete Repository Tree

Full target tree for the finished application. Files marked `(phase N)` do
not exist yet in this scaffold; they are generated in the phase indicated.
Everything not marked is already present as a placeholder.

```
pinenova/
├── README.md
├── package.json                          (phase 1)
├── tsconfig.json                         (phase 1)
├── next.config.mjs                       (phase 1)
├── tailwind.config.ts                    (phase 1)
├── postcss.config.js                     (phase 1)
├── .eslintrc.json                        (phase 1)
├── .prettierrc                           (phase 1)
├── .husky/
│   └── pre-commit                       (phase 1)
├── .env.example                         (phase 8)
├── Dockerfile                            (phase 8)
├── docker-compose.yml                    (phase 8)
├── .github/
│   └── workflows/
│       └── ci.yml                        (phase 8)
│
├── app/
│   ├── README.md
│   ├── layout.tsx                        (phase 4)
│   ├── page.tsx                          (phase 4)              # Home
│   ├── globals.css                       (phase 4)
│   ├── (auth)/
│   │   ├── login/page.tsx                (phase 4)
│   │   ├── register/page.tsx             (phase 4)
│   │   └── reset-password/page.tsx       (phase 4)
│   ├── (shop)/
│   │   ├── products/page.tsx             (phase 4)              # PLP
│   │   ├── products/[slug]/page.tsx      (phase 4)              # PDP
│   │   ├── category/[category]/page.tsx  (phase 4)
│   │   ├── cart/page.tsx                 (phase 5)
│   │   ├── checkout/page.tsx             (phase 5)
│   │   └── order-confirmation/[id]/page.tsx (phase 5)
│   ├── account/
│   │   ├── page.tsx                      (phase 4)
│   │   ├── orders/page.tsx               (phase 4)
│   │   └── addresses/page.tsx            (phase 4)
│   ├── admin/
│   │   ├── page.tsx                      (phase 5)
│   │   ├── products/page.tsx             (phase 5)
│   │   ├── orders/page.tsx               (phase 5)
│   │   ├── inventory/page.tsx            (phase 5)
│   │   ├── customers/page.tsx            (phase 5)
│   │   ├── reviews/page.tsx              (phase 5)
│   │   └── analytics/page.tsx            (phase 5)
│   ├── blog/
│   │   ├── page.tsx                      (phase 6)
│   │   └── [slug]/page.tsx               (phase 6)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts         (phase 3)
│   │   │   ├── login/route.ts            (phase 3)
│   │   │   ├── refresh/route.ts          (phase 3)
│   │   │   ├── logout/route.ts           (phase 3)
│   │   │   └── password-reset/route.ts   (phase 3)
│   │   ├── products/route.ts             (phase 3)
│   │   ├── products/[id]/route.ts        (phase 3)
│   │   ├── cart/route.ts                 (phase 3)
│   │   ├── checkout/route.ts             (phase 3)
│   │   ├── webhooks/stripe/route.ts      (phase 3)
│   │   ├── orders/route.ts               (phase 3)
│   │   ├── reviews/route.ts              (phase 3)
│   │   └── admin/**/route.ts             (phase 3)
│   ├── sitemap.ts                        (phase 6)
│   └── robots.ts                         (phase 6)
│
├── components/
│   ├── README.md
│   ├── ui/                               (phase 4)              # buttons, inputs, modal, etc.
│   ├── product/                          (phase 4)
│   ├── cart/                             (phase 5)
│   ├── checkout/                         (phase 5)
│   ├── admin/                            (phase 5)
│   └── layout/                           (phase 4)              # header, footer, nav
│
├── lib/
│   ├── README.md
│   ├── db.ts                             (phase 1)              # Prisma client singleton
│   ├── auth.ts                           (phase 3)
│   ├── stripe.ts                         (phase 5)
│   ├── s3.ts                             (phase 1)
│   ├── logger.ts                         (phase 1)
│   └── repositories/                     (phase 1)              # repository pattern data access
│
├── hooks/
│   ├── README.md
│   ├── use-cart.ts                       (phase 5)
│   ├── use-auth.ts                       (phase 3)
│   └── use-products.ts                   (phase 4)
│
├── prisma/
│   ├── README.md
│   ├── schema.prisma                     (phase 1)
│   ├── migrations/                       (phase 1)
│   └── seed.ts                           (phase 1)
│
├── public/
│   ├── README.md
│   └── products/                         (phase 2)              # product imagery references
│
├── styles/
│   ├── README.md
│   └── tokens.css                        (phase 1)              # design system CSS variables
│
├── types/
│   ├── README.md
│   ├── product.ts                        (phase 1)
│   ├── order.ts                          (phase 1)
│   └── user.ts                           (phase 1)
│
├── utils/
│   ├── README.md
│   ├── formatCurrency.ts                 (phase 1)
│   └── slugify.ts                        (phase 1)
│
├── emails/
│   ├── README.md
│   ├── order-confirmation.tsx            (phase 5)
│   └── password-reset.tsx                (phase 3)
│
├── scripts/
│   ├── README.md
│   └── generate-sitemap.ts               (phase 6)
│
├── tests/
│   ├── README.md
│   ├── unit/                             (phase 9)
│   ├── integration/                       (phase 9)
│   └── e2e/                               (phase 9)
│
└── docs/
    ├── 00-assumptions.md                  ✅ done
    ├── 01-repository-tree.md              ✅ done
    ├── 02-system-architecture.md          (phase 1)
    ├── 03-database-er-diagram.md          (phase 1)
    ├── 04-prisma-schema.md                (phase 1)
    ├── 05-sql-migration.md                (phase 1)
    ├── 06-seed-script.md                  (phase 1)
    ├── 07-product-catalogue.md            (phase 2)
    ├── 08-api-specification.md            (phase 3)
    ├── 09-auth-flow.md                    (phase 3)
    ├── 10-frontend-pages.md               (phase 4)
    ├── 11-reusable-components.md          (phase 4)
    ├── 12-state-management.md             (phase 4)
    ├── 13-checkout-flow.md                (phase 5)
    ├── 14-admin-dashboard.md              (phase 5)
    ├── 15-seo.md                          (phase 6)
    ├── 16-content-marketing.md            (phase 6)
    ├── 17-performance.md                  (phase 7)
    ├── 18-security.md                     (phase 7)
    ├── 19-accessibility.md                (phase 7)
    ├── 20-environment-variables.md        (phase 8)
    ├── 21-docker.md                       (phase 8)
    ├── 22-github-actions.md               (phase 8)
    ├── 23-testing-strategy.md             (phase 9)
    └── 24-deployment-checklist.md         (phase 9)
```
