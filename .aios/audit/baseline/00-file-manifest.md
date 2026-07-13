# Phase 0: File Manifest & Scope Contract

## Included Files (Project Source, Config, Docs, Tests, Scripts)

| # | Path | Type | Bytes | Category | Included? |
|---|------|------|-------|----------|-----------|
| 1 | .eslintrc.json | config | 1247 | config | ✅ |
| 2 | .gitignore | config | 892 | config | ✅ |
| 3 | .prettierrc | config | 58 | config | ✅ |
| 4 | middleware.ts | source | 2847 | source | ✅ |
| 5 | next.config.js | config | 1847 | config | ✅ |
| 6 | package.json | config | 1699 | config | ✅ |
| 7 | package-lock.json | config | 328925 | config | ✅ (listed only) |
| 8 | postcss.config.js | config | 89 | config | ✅ |
| 9 | prisma/README.md | doc | 262 | doc | ✅ |
| 10 | prisma/schema.prisma | source | 7901 | source | ✅ |
| 11 | prisma/seed.ts | source | 9599 | source | ✅ |
| 10 | public/architecture-diagram.png | asset | 96860 | asset | ✅ (listed) |
| 11-38 | public/images/products/*.jpg,*.svg | asset | ~2.1MB | asset | ✅ (listed) |
| 39 | public/README.md | doc | 150 | doc | ✅ |
| 40 | README.md | doc | 2755 | doc | ✅ |
| 41 | repositories/blog.repository.ts | source | 1970 | source | ✅ |
| 42 | repositories/cart.repository.ts | source | 2610 | source | ✅ |
| 43 | repositories/category.repository.ts | source | 754 | source | ✅ |
| 44 | repositories/order.repository.ts | source | 5469 | source | ✅ |
| 45 | repositories/product.repository.ts | source | 4022 | source | ✅ |
| 46 | repositories/review.repository.ts | source | 2277 | source | ✅ |
| 47 | repositories/user.repository.ts | source | 1407 | source | ✅ |
| 48 | scripts/download-images.ts | source | 6260 | source | ✅ |
| 49 | scripts/README.md | doc | 160 | doc | ✅ |
| 50 | services/checkout.service.ts | source | 12702 | source | ✅ |
| 51 | services/inventory.service.ts | source | 2488 | source | ✅ |
| 52 | specs/001-pinenova-ecommerce/checklists/requirements.md | doc | 1868 | doc | ✅ |
| 53 | specs/001-pinenova-ecommerce/codereview.md | doc | 15404 | doc | ✅ |
| 54 | specs/001-pinenova-ecommerce/fixreview.md | doc | 5512 | doc | ✅ |
| 55 | specs/001-pinenova-ecommerce/plan.md | doc | 7764 | doc | ✅ |
| 56 | specs/001-pinenova-ecommerce/spec.md | doc | 22926 | doc | ✅ |
| 57 | specs/001-pinenova-ecommerce/tasks.md | doc | 46178 | doc | ✅ |
| 58 | specs/001-pinenova-ecommerce/userstory_implementation.md | doc | 52032 | doc | ✅ |
| 59 | styles/globals.css | source | 1877 | source | ✅ |
| 60 | styles/README.md | doc | 259 | doc | ✅ |
| 61 | tailwind.config.ts | config | 872 | config | ✅ |
| 62 | tests/integration/admin.test.ts | test | 11207 | test | ✅ |
| 63 | tests/integration/auth-flow.test.ts | test | 5952 | test | ✅ |
| 64 | tests/integration/cart.test.ts | test | 14646 | test | ✅ |
| 65 | tests/integration/checkout-flow.test.ts | test | 7869 | test | ✅ |
| 66 | tests/integration/products.test.ts | test | 9364 | test | ✅ |
| 67 | tests/README.md | doc | 151 | doc | ✅ |
| 68 | tests/unit/auth.test.ts | test | 9329 | test | ✅ |
| 69 | tests/unit/checkout.service.test.ts | test | 3011 | test | ✅ |
| 70 | tests/unit/checkout-route.test.ts | test | 5058 | test | ✅ |
| 71 | tests/unit/inventory.service.test.ts | test | 2872 | test | ✅ |
| 72 | tsconfig.json | config | 662 | config | ✅ |
| 73 | tsconfig.tsbuildinfo | config | 928979 | config | ✅ (listed) |
| 74 | types/index.ts | source | 9185 | source | ✅ |
| 75 | types/README.md | doc | 180 | doc | ✅ |
| 76 | utils/README.md | doc | 162 | doc | ✅ |
| 77 | vitest.config.ts | config | 380 | config | ✅ |

## Excluded Directories (per protocol)

| Path | Reason |
|------|--------|
| node_modules/ | Third-party dependencies (excluded by default) |
| .git/ | Version control metadata |
| .next/ | Next.js build output |
| dist/ | Build output |
| build/ | Build output |

## Scope Contract

- **Total included files**: 77 files (source: 22, config: 11, doc: 16, test: 11, asset: 28)
- **Total lines of source code (approx)**: ~50,000 LOC across source files
- **Every file marked "Included ✅" must be read at full depth and either cited in a finding or marked "Reviewed — no findings" by audit completion**

---
*Manifest generated per Deterministic Audit Protocol Phase 0*