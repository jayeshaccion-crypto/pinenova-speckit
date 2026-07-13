# Technical Debt Register — PineNova Ecommerce (Baseline)

**Generated:** 2026-07-12  
**Source:** Deterministic SDD Audit  
**Total Items:** 11 (5 High, 3 Medium, 3 Low)

---

## Debt Items

| ID | Area | Item | Severity | Effort | Detail | Sprint Target |
|----|------|------|----------|--------|--------|---------------|
| DEBT-001 | Architecture | Dead repository layer (7 files, ~500 LOC) | **High** | Low (delete) | `repositories/*.ts` completely unused; routes use Prisma directly. Creates confusion about data access pattern. | 1 |
| DEBT-002 | Architecture | Dual rate limiter modules with different APIs | **High** | Low (consolidate) | `lib/rate-limit.ts` (checkout) vs `lib/rate-limiter.ts` (general). Inconsistent usage across routes. | 2 |
| DEBT-003 | Architecture | Stale `reserveStock` transaction concern | **High** | Medium | `fixreview.md:69` flags "reserveStock runs outside checkout transaction with catch-based rollback (race window)". Current code may have fixed but doc stale. | 3 |
| DEBT-004 | Documentation | Phase 7-9 docs not generated (7 of 24) | **High** | High | `docs/17-performance.md` through `docs/24-deployment-checklist.md` marked "Not yet generated". | 1-5 |
| DEBT-005 | Compliance | PCI SAQ A sign-off incomplete (all `[TBD]`) | **High** | Trivial | `docs/pci-saq-a.md:56-60` — blocks production checkout enablement. | 1 |
| DEBT-006 | Code Quality | `auth.test.ts` double mock declarations | **Medium** | Trivial | Lines 3-4 and 5-6 mock `@/lib/db` and `@/lib/logger` identically. | 4 |
| DEBT-007 | Code Quality | Hardcoded tax table in `checkout.service.ts` | **Medium** | Low | `TAX_RATES` object (38 states) in service — not configurable, US-only. | 3 |
| DEBT-008 | Code Quality | Duplicated `stockBadge` test logic | **Medium** | Trivial | Same function tested in `products.test.ts:165-201` and `cart.test.ts:318-340`. | 4 |
| DEBT-009 | Dependencies | Dual state management: Zustand + @tanstack/react-query | **Low** | Medium | Both in `package.json`, neither used. Remove or adopt one. | 3 |
| DEBT-010 | Dependencies | Unused frontend deps: Zustand, React Query, React Hook Form | **Low** | Low | All three in `package.json`, zero imports in audited files. | 3 |
| DEBT-011 | Security | In-memory rate limiter (non-atomic, no cleanup, not shared) | **Medium** | Medium | Already tracked as GAP-012; root cause is architecture debt. | 2 |

---

## Debt Severity Summary

| Severity | Count | Items |
|----------|-------|-------|
| Critical | 0 | — |
| **High** | **5** | DEBT-001 to DEBT-005 |
| **Medium** | **3** | DEBT-006 to DEBT-008 |
| **Low** | **3** | DEBT-009 to DEBT-011 |

---

## Debt Resolution Policy

1. **No new debt without ADR** — Any intentional shortcut requires Architecture Decision Record
2. **High debt in Sprint 1-2** — DEBT-001, 002, 004, 005 must be resolved early
3. **Debt tracked in GAP register** — DEBT-011 = GAP-012; resolve together
4. **Definition of Done includes debt check** — No feature complete if it introduces new HIGH debt

---

## Debt Velocity Target

| Sprint | Debt Items Targeted | New Debt Allowed |
|--------|---------------------|------------------|
| 1 | DEBT-001, DEBT-005, DEBT-004 (start) | 0 |
| 2 | DEBT-002, DEBT-011 | 0 |
| 3 | DEBT-003, DEBT-007 | 0 |
| 4 | DEBT-006, DEBT-008 | 0 |
| 5 | DEBT-009, DEBT-010 | 0 |

---

**Update Rule:** Add new debt items with next sequential ID. Never remove — mark `Resolved` with commit/PR reference.