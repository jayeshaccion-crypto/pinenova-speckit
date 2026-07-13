# Project Understanding Model — PineNova Ecommerce

**Generated:** 2026-07-12  
**Audit Version:** Deterministic SDD Audit (Phase 0-5)  
**Status:** Baseline — Source of Truth for All Future Alignment

---

## 1. Business Domain

**Product:** PineNova — DTC ecommerce platform for premium pineapple-fiber vegan leather goods  
**Catalog:** Bags, wallets, belts, footwear (fixed 12 products / 4 categories)  
**Markets:** Primary US (USD), planned India expansion (INR display)  
**Users:** Eco-conscious consumers, admin/operations staff

---

## 2. Architecture Style

| Aspect | Decision |
|--------|----------|
| **Pattern** | Monolithic-first Next.js 14 App Router |
| **Deployment** | Vercel (frontend) + Railway (PostgreSQL) |
| **Data Layer** | Prisma ORM → PostgreSQL |
| **Payments** | Stripe Checkout Sessions + Webhook confirmation |
| **Auth** | JWT access (15m) + refresh (7d), bcrypt(12), HS256, CUSTOMER/ADMIN roles |
| **UI** | React Server Components default, Tailwind CSS, client components only where needed |
| **Testing** | Vitest (unit/integration, mocked DB), Playwright (E2E), k6 (load) |
| **Storage** | AWS S3 for product images |
| **Email** | SendGrid |

**Architectural Exceptions (Documented):**
- Express.js ONLY for Stripe webhook retries (per architecture.md) — **CURRENTLY VIOLATED: Using Next.js Route Handler**
- Repository pattern for all data access — **CURRENTLY VIOLATED: 7 repos dead code, routes use Prisma directly**

---

## 3. Tech Stack (Pinned)

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| Next.js | 14.2.x | 14.2.16+ | CVE patches |
| Prisma | Latest | Latest | |
| Stripe Node | 17.3.0 | 16.x | v17 = v2023-10-16 API breaking |
| @stripe/stripe-js | 4.9.0 | 5.x | Breaking changes for Payment Element |
| bcryptjs | 2.4.3 | 2.4.6+ | CVE |
| AWS SDK | 3.1085 | 3.600+ | 115 versions behind |
| Zustand | 5.0.0 | Audit v5 | Breaking v4→v5 |
| Vitest | 2.1.0 | 2.1.x | Add @vitest/coverage-v8 |

---

## 4. Coding Standards (Enforced)

- `strict: true`, `noImplicitAny: true` in tsconfig
- **No `any` types** — zero tolerance
- **Repository pattern** — all data access via `repositories/*.ts`
- **Zod schemas in `/types`** — single source of validation truth
- **No TODO/pseudocode** — every generated file complete
- **Server Components by default** — `"use client"` only when required
- **Feature flags** — checkout gated behind `FLAG_checkout=true`

---

## 5. Folder Structure (Actual — Source of Truth)

```
pinenova-speckit/
├── app/
│   ├── (storefront)/          # Customer-facing pages
│   │   ├── products/
│   │   ├── categories/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── account/
│   ├── admin/                 # Admin dashboard (force-dynamic)
│   ├── api/                   # API routes
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── products/
│   │   ├── account/
│   │   └── stripe/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── AdminPage.tsx          # 471-line monolith (needs split)
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── AddToCartButton.tsx
│   ├── CartItem.tsx
│   ├── CartSummary.tsx
│   ├── ShippingForm.tsx
│   ├── PaymentForm.tsx       # UNUSED — checkout uses inline
│   └── ...
├── lib/
│   ├── auth.ts               # JWT, bcrypt, tokens
│   ├── db.ts                 # Prisma client
│   ├── rate-limit.ts         # Checkout-specific (DUPLICATE)
│   ├── rate-limiter.ts       # General (DUPLICATE)
│   ├── api-utils.ts          # CSRF, error helpers
│   ├── admin-utils.ts        # requireAdmin, audit, transitions
│   ├── audit.ts
│   ├── email.ts
│   ├── feature-flags.ts
│   ├── logger.ts
│   ├── s3.ts
│   └── stripe.ts
├── repositories/              # 7 files — ALL DEAD CODE
│   ├── blog.repository.ts
│   ├── cart.repository.ts
│   ├── category.repository.ts
│   ├── order.repository.ts
│   ├── product.repository.ts
│   ├── review.repository.ts
│   └── user.repository.ts
├── services/
│   ├── checkout.service.ts   # 408 lines — core business logic
│   └── inventory.service.ts  # Pessimistic locking
├── prisma/
│   ├── schema.prisma         # 7901 bytes
│   └── seed.ts               # 9599 bytes
├── types/
│   └── index.ts              # 9185 bytes — all Zod schemas
├── tests/
│   ├── unit/                 # 4 files
│   └── integration/          # 5 files
├── middleware.ts             # Auth gating, CSP, security headers
├── next.config.js
├── tailwind.config.ts
├── vitest.config.ts
└── package.json
```

**Missing from Architecture Doc:**
- `hooks/` directory (6 hooks planned)
- `utils/` directory (5 utils planned)
- `lib/payment/` abstraction (3 files planned)
- `emails/templates/` (6 templates planned)

---

## 6. Auth Model

| Token | TTL | Storage | Rotation |
|-------|-----|---------|----------|
| Access (JWT) | 15 min | **localStorage + cookie (NO HttpOnly)** | N/A |
| Refresh (JWT) | 7 days | HttpOnly cookie `/api/auth` | Rotated on use; reused → 401 |
| Reset | 1 hour | JWT with `purpose: "password-reset"` | Single-use |

**Current Issues:**
- Access token in localStorage = XSS vulnerable
- Cookie missing `Secure` flag in production
- Middleware only checks token PRESENCE, not VALIDITY
- Admin route: no role check in middleware

---

## 7. Key Business Rules (Immutable — from 00-assumptions.md)

| Rule | Value | Status |
|------|-------|--------|
| Guest checkout | **DISABLED** | ⚠️ CONTRADICTED by spec.md FR-022 |
| Products | 12 fixed / 4 categories | Seed has 9 |
| Shipping | $8 flat, free ≥ $120 | ⚠️ Code uses $5.99 / $100 |
| Tax | 10% flat | ⚠️ Code uses per-state table |
| Price range | $49–$289 USD | ✅ |
| Cart expiry | 30 days | Not implemented |

---

## 8. Implemented Features (Traceable)

| Feature | User Story | API | UI | Tests | Status |
|---------|------------|-----|-----|-------|--------|
| Browse Products | US1 | ✅ | ✅ | ✅ | **Complete** |
| Cart (persistent) | US3a | ✅ | ✅ | ✅ | **Complete** |
| Checkout (Stripe) | US3b | ✅ | ❌ | ✅ | **API only — no UI** |
| Auth (reg/login/reset) | US4 | ✅ | ✅ | ✅ | **Complete** |
| Account Dashboard | US4 | ✅ | ⚠️ Partial | ✅ | No profile edit, no order detail |
| Admin Products CRUD | US5 | ✅ | ⚠️ Partial | ✅ | No edit, no image upload |
| Admin Orders | US6 | ✅ | ⚠️ Partial | ✅ | No detail view, no search |
| Admin Inventory | US6 | ✅ | ⚠️ Partial | ✅ | |
| Admin Discounts | US7 | ✅ | ⚠️ Partial | ✅ | |
| Admin Metrics | US6 | ✅ | ⚠️ Partial | ❌ | No CSV export test |
| Blog/SEO | US8 | ❌ | ❌ | ❌ | **0%** |
| CI/CD/Security | US9-11 | ❌ | ❌ | ❌ | **0%** |

---

## 9. Test Baseline

| Suite | Files | Tests | Type | DB |
|-------|-------|-------|------|-----|
| auth | 1 | 15 | Unit | Mocked |
| checkout-service | 1 | 11 | Unit | Mocked |
| checkout-route | 1 | 12 | Unit | Mocked |
| inventory-service | 1 | 4 | Unit | Mocked |
| admin | 1 | 17 | Integration | Mocked |
| auth-flow | 1 | 9 | Integration | Mocked |
| cart | 1 | 46 | Integration | Mocked |
| checkout-flow | 1 | 12 | Integration | Mocked |
| products | 1 | 37 | Integration | Mocked |
| **Total** | **9** | **~168** | | **All mocked** |

**Critical Gap:** Zero true integration tests (real DB), zero E2E tests.

---

## 10. Security Baseline

| Control | Status | Evidence |
|---------|--------|----------|
| CSP | ❌ Broken | `unsafe-eval`, `unsafe-inline`, `img-src https:` |
| CSRF | ⚠️ Partial | Double-submit cookie; checkout uses inline not shared |
| Rate Limiting | ⚠️ Broken | In-memory Map, race condition, no cleanup, not shared |
| JWT | ⚠️ Issues | HS256, localStorage, no HttpOnly, middleware no validation |
| Input Validation | ✅ | Zod schemas on all routes |
| Webhook Signature | ✅ | Stripe verified |
| Pricing Authority | ✅ | Server-side only, client price rejected |
| Audit Log | ✅ | Admin actions logged |
| PCI SAQ A | ❌ | Document exists, all `[TBD]` |

---

## 11. Performance Baseline

| Metric | Current | Target |
|--------|---------|--------|
| DB Indexes | Missing 5 critical | Add all |
| Connection Pool | Default (no PgBouncer) | PgBouncer |
| Caching | None | Cache-Control headers |
| Bundle Size | +25KB unused deps | Remove Zustand/ReactQuery/RHF |
| ISR | 60s on products | Add generateStaticParams |

---

## 12. DevOps Baseline

| Capability | Status |
|------------|--------|
| CI/CD Pipeline | ❌ None |
| Docker | ❌ None |
| Staging Env | ❌ None |
| Health Check | ❌ None |
| Monitoring | ❌ None |
| Log Aggregation | ❌ None |
| Backup Strategy | ❌ None |
| Rollback Plan | ❌ None |

---

## 13. Documentation Baseline

| Doc | Status | Issues |
|-----|--------|--------|
| 00-assumptions.md | ✅ Complete | Source of truth |
| BRD.md | ✅ Draft | |
| FRD.md | ✅ Draft | |
| NFR.md | ✅ Draft | |
| architecture.md | ⚠️ Draft | Contradicts implementation |
| spec.md | ⚠️ Draft | FR-022 contradicts assumptions |
| plan.md | ❌ Outdated | `src/` prefix not used |
| tasks.md | ⚠️ Partial | 49% complete |
| Phase 7-9 docs | ❌ Missing | 7 of 24 "Not yet generated" |

---

## 14. Traceability IDs (For All Future Work)

| Prefix | Scope |
|--------|-------|
| **REQ-** | Business Requirements (BRD/FRD) |
| **FR-** | Functional Requirements (spec.md) |
| **NFR-** | Non-Functional Requirements |
| **ARCH-** | Architecture Decisions (ADR) |
| **GAP-** | Audit Gaps (this baseline) |
| **DEBT-** | Technical Debt Items |
| **TASK-** | Implementation Tasks |
| **TEST-** | Test Cases |
| **SPRINT-** | Sprint Backlog Items |

---

**End of Baseline** — All future alignment checks reference this document.