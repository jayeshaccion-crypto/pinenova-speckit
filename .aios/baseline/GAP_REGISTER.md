# Gap Register — PineNova Ecommerce (Baseline)

**Generated:** 2026-07-12  
**Source:** Deterministic SDD Audit (4 reports, 77 files)  
**Total Gaps:** 42 (14 P0, 11 P1, 11 P2, 6 P3)

---

## P0 — Critical (Must Fix Before Production)

| ID | Category | Description | Evidence | Sprint |
|----|----------|-------------|----------|--------|
| GAP-001 | Spec | Guest checkout contradiction: spec.md FR-022 "MUST support" vs assumptions.md BR04 "disabled" | `spec.md:182` vs `00-assumptions.md:25` | 1 |
| GAP-002 | Security | CSP allows `unsafe-eval` + `unsafe-inline` + `img-src https:` wildcard | `middleware.ts:27-37` | 1 |
| GAP-003 | Infra | No CI/CD pipeline (GitHub Actions missing) | `docs/22-github-actions.md`: "Not yet generated" | 2 |
| GAP-004 | Infra | No Docker configuration | `docs/21-docker.md`: "Not yet generated" | 2 |
| GAP-005 | Testing | No Stripe webhook tests | `tests/` — no webhook test file | 4 |
| GAP-006 | Testing | No true integration tests (all mock Prisma) | All 9 test files use `vi.mock("@/lib/db")` | 4 |
| GAP-007 | Testing | No E2E tests (Playwright 0 tests) | `package.json:19` `test:e2e` defined but no specs | 4 |
| GAP-008 | Feature | No checkout UI pages | `codereview.md:63` "No checkout UI pages exist yet" | 3 |
| GAP-009 | Feature | ProductVariant model missing (blocks variant selector) | `prisma/schema.prisma` flat Product; `tasks.md:T012` | 3 |
| GAP-010 | Security | PCI SAQ A sign-off incomplete (all `[TBD]`) | `docs/pci-saq-a.md:56-60` | 1 |
| GAP-011 | Arch | Repository pattern violated — all 7 repositories dead code | `repositories/*.ts` unused; routes use Prisma directly | 1 |
| GAP-012 | Perf | In-memory rate limiter: race condition + memory leak + no cleanup | `lib/rate-limit.ts`, `lib/rate-limiter.ts` | 2 |
| GAP-013 | Security | Admin routes in middleware `publicPaths` — bypasses auth gating | `middleware.ts:24` includes `/api/admin` | 1 |
| GAP-014 | Auth | JWT in localStorage + cookie without HttpOnly/Secure | Multiple frontend files | 1 |

---

## P1 — High (Should Fix Before v1 Launch)

| ID | Category | Description | Evidence | Sprint |
|----|----------|-------------|----------|--------|
| GAP-015 | DB | Missing indexes: `Order.stripePaymentIntentId`, `RefreshToken.userId`, `RefreshToken.expiresAt`, `CartItem.productId`, `CartItem.cartId` | Audit report | 5 |
| GAP-016 | Infra | No database connection pooling (PgBouncer) | Audit report | 5 |
| GAP-017 | Infra | No health check endpoint (`/api/health`) | Audit report | 5 |
| GAP-018 | Testing | No concurrent checkout race condition test | Audit report | 4 |
| GAP-019 | Testing | No DB failure/error handling tests | Audit report | 4 |
| GAP-020 | Feature | Admin dashboard incomplete (~15% done) | `tasks.md` T096–T105 | 3 |
| GAP-021 | Feature | Account pages incomplete (no profile edit, password change, addresses) | Audit report | 3 |
| GAP-022 | Spec | Shipping values conflict: $8/$120 vs $5.99/$100 vs free ≥$100 | Multiple files | 1 |
| GAP-023 | Security | `NEXT_PUBLIC_APP_URL` fallback to localhost in production | `app/layout.tsx:44` | 1 |
| GAP-024 | Security | Refresh token rotation O(n) scan over all tokens | `lib/auth.ts:79-81` | 2 |
| GAP-025 | Code | Duplicate rate limiter implementations | `lib/rate-limit.ts`, `lib/rate-limiter.ts` | 2 |

---

## P2 — Medium (Post-v1, Pre-Public Launch)

| ID | Category | Description | Evidence | Sprint |
|----|----------|-------------|----------|--------|
| GAP-026 | Feature | Product reviews (model exists, no API/UI) | `prisma/schema.prisma:185-200` | — |
| GAP-027 | Feature | Order tracking page for customers | `tests/integration/auth-flow.test.ts:46-79` | — |
| GAP-028 | Feature | Full-text product search UI | `middleware.ts:18` search route public | — |
| GAP-029 | Feature | OAuth login (Google/Apple) | `.env.example:24-25` configured | — |
| GAP-030 | Feature | Blog frontend pages | `prisma/schema.prisma:202-213` model exists | — |
| GAP-031 | Feature | Sitemap.xml + robots.txt | `codereview.md:153` mentioned | — |
| GAP-032 | Feature | Guest cart merge on login | `codereview.md` mentioned | — |
| GAP-033 | Infra | Staging environment | `docs/22-github-actions.md` | — |
| GAP-034 | Infra | Monitoring/alerting (Sentry) | `lib/logger.ts` Pino only | — |
| GAP-035 | Perf | Caching strategy (Cache-Control headers) | `middleware.ts` only admin gets | — |
| GAP-036 | Spec | 7 of 24 phase docs "Not yet generated" | Audit report | — |

---

## P3 — Low (Nice to Have)

| ID | Category | Description | Evidence |
|----|----------|-------------|----------|
| GAP-037 | UI | Consolidate rate limiter modules | Tech Debt |
| GAP-038 | UI | Remove unused deps (Zustand, React Query, React Hook Form) | Bundle analysis |
| GAP-039 | UI | Add `loading.tsx` files for streaming SSR | Next.js convention |
| GAP-040 | UI | Add toast/notification system | UX gap |
| GAP-041 | Accessibility | ARIA, skip links, keyboard nav audit | WCAG 2.1 AA |
| GAP-042 | Code | Move tax rates to database/config | Hardcoded in service |

---

## Gap Resolution Tracker

| ID | Status | Resolution | PR/Commit | Verified |
|----|--------|------------|-----------|----------|
| GAP-001 | Open | | | |
| GAP-002 | Open | | | |
| GAP-003 | Open | | | |
| GAP-004 | Open | | | |
| GAP-005 | Open | | | |
| GAP-006 | Open | | | |
| GAP-007 | Open | | | |
| GAP-008 | Open | | | |
| GAP-009 | Open | | | |
| GAP-010 | Open | | | |
| GAP-011 | Open | | | |
| GAP-012 | Open | | | |
| GAP-013 | Open | | | |
| GAP-013 | Open | | | |
| GAP-014 | Open | | | |
| GAP-015 | Open | | | |
| GAP-016 | Open | | | |
| GAP-017 | Open | | | |
| GAP-018 | Open | | | |
| GAP-019 | Open | | | |
| GAP-020 | Open | | | |
| GAP-021 | Open | | | |
| GAP-022 | Open | | | |
| GAP-023 | Open | | | |
| GAP-024 | Open | | | |
| GAP-025 | Open | | | |

---

**Update Rule:** This register is the single source of truth. Update status in-place when gaps are resolved. Never delete rows.