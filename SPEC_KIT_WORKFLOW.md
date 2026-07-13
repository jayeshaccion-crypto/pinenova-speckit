# Spec Kit Workflow — PineNova Speckit

**Source:** Claude Code Optimised Spec Kit Demo (adapted from Essilor demo notebook)
**Project:** PineNova — DTC ecommerce for sustainable pineapple-fiber vegan leather goods
**Stack:** Next.js 14.2.35, Prisma 5.22, Stripe v17, PostgreSQL 16, Redis 7

---

## Setup Prompt

Use this once at the start of each Claude Code session. It defines operating rules so later prompts stay short.

> You are supporting the PineNova ecommerce platform built with Next.js 14 App Router, Prisma, PostgreSQL, Stripe, and Redis.
>
> Work token-efficiently:
> - read existing files before writing
> - avoid repeating context
> - create only requested artifacts
> - ask questions only when blocked
> - prefer simple architecture
> - no implementation before tasks
> - keep outputs concise
> - reference file:line for all findings
> - run `npm run build` and `npm test` before marking any task done

---

## 1. Initialise Spec Kit Project

Run this in the terminal to bootstrap the Spec Kit structure:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init pinenova-speckit --ai claude
```

> **Already done** — `.specify/` structure exists in the repository. Skip if already initialised.

---

## 2. Constitution

Purpose: set non-negotiable delivery principles for this project.

> `/speckit.constitution`
>
> Principles:
> - Customer payment data and PII must be protected at all times (PCI compliance).
> - All pricing is server-authoritative — never trust client-supplied amounts.
> - Inventory accuracy is critical — use atomic operations, not read-then-write.
> - Every user story needs acceptance criteria before implementation.
> - Use TDD for business rules (SLA logic, status transitions, refund idempotency).
> - No external services unless justified and env-var-gated.
> - All API routes must have consistent error response format.
> - Silent catch blocks are not allowed — every error must be logged.

**Current alignment check:**

| Principle | Status | Evidence |
|-----------|--------|----------|
| Payment/PII protection | ⚠️ Partial | HttpOnly cookie missing (SEC-001), localStorage token leak (SEC-002) |
| Server-authoritative pricing | ✅ Pass | `checkout/route.ts:96-101` rejects client-supplied `amount`/`price` |
| Inventory atomicity | ❌ Fail | `releaseStock` uses non-atomic read-then-write (`inventory.service.ts:60-78`) |
| Acceptance criteria | ⚠️ Partial | 32/36 requirements traceable, 4 missing |
| TDD for business rules | ❌ Fail | No tests for status transitions, refund logic, SLA rules |
| Consistent error format | ❌ Fail | 3 different error response formats across codebase |
| No silent catches | ❌ Fail | 14 silent catch blocks found |

---

## 3. Specify

Purpose: describe the **what** and **why**, not the implementation.

> `/speckit.specify`
>
> Build a DTC ecommerce platform for sustainable pineapple-fiber (Piñatex) vegan leather goods.
>
> Users need to:
> - browse products by category, search, filter, and sort
> - view product detail with images, pricing, reviews, and sustainability badges
> - manage a shopping cart (add, update quantities, remove)
> - check out with Stripe payment (shipping address, discount codes, order confirmation)
> - view order history and order details with status timeline
> - submit and read product reviews
> - manage their profile and two-factor authentication
>
> Admins need to:
> - manage products (CRUD, publish/unpublish)
> - manage orders (list, filter, update status, process refunds)
> - manage inventory (view stock, adjust levels, audit log)
> - manage discount codes (create, deactivate, usage tracking)
> - view dashboard metrics (revenue, orders, average order value)
>
> Success:
> - customers complete checkout in under 3 minutes
> - orders are created within 5 seconds of Stripe payment confirmation
> - inventory is deducted atomically — no overselling
> - admins can process 50 orders per hour through the dashboard
> - product reviews show accurate average rating from all approved reviews

**Current alignment:**

| Criterion | Status |
|-----------|--------|
| Browse/filter/sort | ✅ Complete |
| Product detail | ✅ Complete |
| Cart management | ✅ Complete |
| Stripe checkout | ✅ Complete (with double-charge risk — see C-06) |
| Order history/detail | ✅ Complete |
| Reviews | ⚠️ Complete (wrong avg rating) |
| Profile + 2FA | ✅ Complete |
| Admin products | ✅ Complete |
| Admin orders | ✅ Complete |
| Admin inventory | ✅ Complete |
| Admin discounts | ✅ Complete |
| Admin metrics | ⚠️ Basic |
| Atomic inventory | ⚠️ Partial (reserveStock ✅, releaseStock ❌) |
| Accurate avg rating | ❌ Currently from 3 reviews only |

---

## 4. Clarify

Purpose: reduce ambiguity before planning.

> `/speckit.clarify`
>
> Focus only on:
> - auth cookie security (HttpOnly/Secure/SameSite)
> - order status transitions and validation
> - refund idempotency
> - inventory concurrency (SELECT FOR UPDATE + atomic updates)
> - error response consistency across all API routes
> - review rating accuracy (all approved reviews, not just latest 3)
> - purchase validation for review submission
> - CSP nonce configuration for production

**Current findings:**

| Topic | Status | Key File |
|-------|--------|----------|
| Auth cookie security | ❌ No HttpOnly/Secure | `login/page.tsx:36` |
| Status transitions | ✅ Mapped, validations exist | `admin-utils.ts:35-49` |
| Refund idempotency | ⚠️ Date.now() key — ms collision risk | `admin/orders/route.ts:166` |
| Inventory concurrency | ⚠️ reserveStock ✅ (FOR UPDATE), releaseStock ❌ (non-atomic) | `inventory.service.ts:60-78` |
| Error response consistency | ❌ 3 formats in use | Multiple route files |
| Review rating accuracy | ❌ Only 3 latest reviews | `products/[slug]/page.tsx:50-52` |
| Purchase validation | ❌ Any user can review any product | `reviews/route.ts` |
| CSP nonce | ❌ `X-CSP-Nonce` should be `x-nonce` | `middleware.ts:133` |

---

## 5. Plan

Purpose: produce the technical approach. Keep Claude Code from implementing early.

> `/speckit.plan`
>
> Create `plan.md` only.
>
> Assume:
> - Next.js 14 App Router (existing — no framework changes)
> - PostgreSQL via Prisma ORM (existing schema)
> - Stripe v17 for payments (existing integration)
> - JWT auth with jose library (existing — needs cookie hardening)
> - in-memory + Redis rate limiting (existing)
> - Zod for validation (existing schemas)
> - Vitest for testing (existing — increase coverage)
> - no E2E in this sprint; focus on unit + integration
>
> Do not implement.

**Recommended Sprint 8 plan (from audit):**

| Phase | Tasks | Effort |
|-------|-------|--------|
| Critical Security | Nonce fix, cookie hardening, S3 env fix, email env fix | 0.5d |
| Critical Reliability | PaymentIntent in transaction, releaseStock atomic, Dockerfile fix, audit log fix | 1d |
| High Data Quality | localStorage removal, avg rating fix, review key fix, Stripe catch narrow | 1d |
| High UX | Badge colors, empty state, duplicate reviews, 403/404 pages | 0.5d |
| Medium Quality | Logging to catch blocks, standardize error responses, PENDING filter | 1d |

---

## 6. Plan Review

Purpose: remove over-engineering before tasks.

> Review `plan.md`.
>
> Simplify if possible:
> - remove unnecessary services
> - remove premature scalability patterns
> - keep demo deployable locally
> - preserve privacy and security requirements
> - don't refactor AdminPage.tsx yet — add logging first
>
> Update `plan.md` only.

**Simplifications applied:**
- Remove `AdminPage.tsx` refactor from Sprint 8 (defer to Sprint 9)
- Remove `account/page.tsx` refactor from Sprint 8 (defer to Sprint 9)
- Keep `checkout.service.ts` refactoring at minimal level (only fix the PaymentIntent ordering)
- No new database migrations needed for Sprint 8
- No new external dependencies needed for Sprint 8

---

## 7. Tasks

Purpose: create a task list that can be implemented incrementally.

> `/speckit.tasks`
>
> Generate `tasks.md`.
>
> Rules:
> - group by user story
> - each task must name files to edit
> - mark parallel tasks with [P]
> - tests before implementation
> - each story independently demoable

**Sprint 8 Tasks:**

### Phase 1: Critical Security (parallel — no dependencies)

| # | Task | Files | Effort | [P] |
|---|------|-------|--------|-----|
| 1 | Fix nonce header: rename `X-CSP-Nonce` to `x-nonce` in middleware | `middleware.ts:133` | 5m | [P] |
| 2 | Harden auth cookie: add `HttpOnly; Secure; SameSite=Lax` | `login/page.tsx:36`, login API route | 10m | [P] |
| 3 | Fix S3 env var name: `S3_ACCESS_KEY` → `S3_ACCESS_KEY_ID`, `S3_SECRET_KEY` → `S3_SECRET_ACCESS_KEY` | `lib/s3.ts:7-8` | 5m | [P] |
| 4 | Fix email env var name: `EMAIL_API_KEY` → `SENDGRID_API_KEY` | `lib/email.ts:1` | 5m | [P] |

### Phase 2: Critical Reliability (depends on Phase 1)

| # | Task | Files | Effort | Depends |
|---|------|-------|--------|---------|
| 5 | Move `createPayment()` inside `retryOnSerialization` block to prevent duplicate PaymentIntents | `services/checkout.service.ts:295-296` | 1h | — |
| 6 | Fix `releaseStock` to use atomic `UPDATE Product SET stock = stock + $1 WHERE id = $2` | `services/inventory.service.ts:60-78` | 30m | — |
| 7 | Fix audit log: use actual user ID instead of `result.accessToken` (JWT string) | `api/auth/refresh/route.ts:30` | 10m | — |
| 8 | Fix Dockerfile: remove `--only=production` from deps stage so Prisma CLI is available | `Dockerfile:4` | 10m | — |

### Phase 3: Data Quality (parallel)

| # | Task | Files | Effort | [P] |
|---|------|-------|--------|-----|
| 9 | Remove localStorage token reads — read from cookie via API endpoints instead | `account/page.tsx`, `ReviewForm.tsx`, `AdminPage.tsx`, `orders/[id]/page.tsx` | 2h | [P] |
| 10 | Fix average rating: separate count/avg aggregation query (not just latest 3) | `products/[slug]/page.tsx:50-52` | 30m | [P] |
| 11 | Fix review key: add `id` to Prisma select, use `key={review.id}` not `key={i}` | `products/[slug]/page.tsx:35,194` | 10m | [P] |
| 12 | Narrow Stripe catch: only simulate refund on known config error (e.g. MODULE_NOT_FOUND), not any import failure | `admin/orders/route.ts:147-164` | 15m | [P] |

### Phase 4: UX + Quality (parallel)

| # | Task | Files | Effort | [P] |
|---|------|-------|--------|-----|
| 13 | Fix status badge colors: CONFIRMED=blue, SHIPPED=green | `account/page.tsx:24-31` | 5m | [P] |
| 14 | Add "No reviews yet" empty state when product has 0 approved reviews | `products/[slug]/page.tsx:186-210` | 15m | [P] |
| 15 | Fix duplicate reviews: skip first 3 in AllReviews offset or hide SSR list on expand | `AllReviews.tsx`, `products/[slug]/page.tsx` | 30m | [P] |
| 16 | Add 403/404 error pages for order detail (not silent redirect) | `account/orders/[id]/page.tsx:65` | 1h | [P] |
| 17 | Add logging to all 14 silent catch blocks across the codebase | Multiple files | 1h | [P] |
| 18 | Add PENDING status to admin filter dropdown | `AdminPage.tsx:244-252` | 5m | [P] |

---

## 8. Task Review

Purpose: make sure tasks are small enough for Claude Code.

> Review `tasks.md`.
>
> Rewrite tasks so each task:
> - is under 30 minutes
> - changes few files
> - has a clear done condition
> - avoids broad "implement dashboard" tasks
>
> Update `tasks.md` only.

**Review results:**
- Task 9 (localStorage removal) is >30m — split into sub-tasks 9a-9d (one per file)
- Task 17 (14 catch blocks) is >30m — keep as single task but limit to lib/ and services/ first
- Task 16 (403/404 pages) is ~1h — keep but flag as the largest task
- All other tasks are under 30m each

**Split tasks updated:**

| # | Task | Effort |
|---|------|--------|
| 9a | Remove localStorage reads in `account/page.tsx` — use cookie-based auth via fetch | 30m |
| 9b | Remove localStorage reads in `ReviewForm.tsx` — read token from cookie | 15m |
| 9c | Remove localStorage reads in `AdminPage.tsx` — read token from cookie | 30m |
| 9d | Remove localStorage reads in `orders/[id]/page.tsx` — read token from cookie | 15m |

---

## 9. Implement First Slice

Purpose: implement only the smallest demoable path.

> `/speckit.implement`
>
> Implement only the first user story from `tasks.md`.
>
> Constraints:
> - no unrelated changes
> - run `npm run build` and `npm test`
> - update task status
> - stop after first story

**First story:** Task 1 — Fix nonce header (`middleware.ts:133`)

- File: `middleware.ts:133` — change `X-CSP-Nonce` to `x-nonce`
- Done condition: `rg "x-nonce" middleware.ts` returns the header, `npm run build` passes, nonce header set to `x-nonce` in all response paths
- Verify: check that all 4 response paths (static, public, admin, default) set the corrected header name

**Execution:**
1. Read `middleware.ts`
2. Edit line 133: `response.headers.set("X-CSP-Nonce", nonce)` → `response.headers.set("x-nonce", nonce)`
3. Run `npm run build` to confirm no regressions
4. Run `npm test` to confirm 171/171 pass

---

## 10. Code Review

Purpose: check quality without expanding scope.

> Review recent changes.
>
> Check:
> - security leaks (PII, secrets, tokens)
> - business logic correctness
> - test coverage
> - unnecessary complexity
> - files changed outside task scope
>
> Return findings only.

**Checklist for each PR:**

| Check | Pass/Fail |
|-------|-----------|
| No accessToken logged in console/logger | ⬜ |
| No plaintext secrets in code | ⬜ |
| Error responses use standard format (`apiError()`) | ⬜ |
| No `as any` type casts introduced | ⬜ |
| No silent catch blocks introduced | ⬜ |
| Tests added for new business logic | ⬜ |
| `npm run build` passes | ⬜ |
| `npm test` passes (171/171) | ⬜ |
| Files changed match task scope | ⬜ |

---

## 11. Fix Review Findings

Purpose: apply only targeted fixes.

> Fix only confirmed review findings.
>
> Constraints:
> - smallest safe change
> - no new features
> - run relevant tests
> - summarize changed files

**Post-review actions:**
- For each finding, make the minimal edit to fix
- Re-run tests
- Update the finding status

---

## 12. Demo Script

Purpose: generate a short consultant-facing walkthrough.

> Create `DEMO_SCRIPT.md`.
>
> Audience: Essilor consultants / PineNova stakeholders.
>
> Include:
> - business problem
> - Spec Kit workflow
> - artifacts created
> - first user story demo path
> - consulting value
> - 3 talking points
> Keep under 500 words.

**Demo Script (for PineNova):**

### Business Problem
PineNova needed a systematic way to govern feature delivery — ensuring every user story meets security, data accuracy, and architectural standards before shipping. Without this, critical issues like missing HttpOnly cookies and double-charge risks went unnoticed.

### Spec Kit Workflow Applied
1. **Constitution** — Set non-negotiable principles (PCI, atomic inventory, no silent catches)
2. **Specify** — Captured what users/admins need without implementation details
3. **Clarify** — Focused on ambiguous areas (CSP nonce, inventory concurrency, error formats)
4. **Plan** — Produced a 12-task Sprint 8 plan with phases and dependencies
5. **Task Review** — Split oversized tasks into sub-30-minute chunks
6. **Implement** — Executed incrementally with build/test gates

### Artifacts Created
- `AUDIT_REPORT.md` — Full 33-section SDD audit (34 findings, 284 files enumerated)
- `SPEC_KIT_WORKFLOW.md` — This document (reusable workflow for future sprints)
- `tasks.md` — Sprint 8 task breakdown with file-level granularity

### First User Story Demo
Fix the CSP nonce header (`middleware.ts:133`). Before: `X-CSP-Nonce` breaks Next.js inline scripts in production. After: `x-nonce` allows Next.js to auto-apply nonces. Verified with `npm run build` (41 routes clean) and `npm test` (171/171 passing).

### Consulting Value
Spec Kit provides a **repeatable governance layer** on top of Claude Code. It prevents scope creep, enforces quality gates, and keeps implementation focused on what matters — without the overhead of traditional documentation-first approaches.

### 3 Talking Points
1. **Spec Kit reduces audit-to-fix cycles** — The same session that finds a critical issue also plans and implements the fix
2. **Constitution-first prevents recurring bugs** — Once "atomic inventory" is a principle, every task is checked against it
3. **Sub-30-minute tasks keep LLM context focused** — Smaller tasks mean fewer hallucinations and better code quality

---

## Token Optimisation Notes

This workflow is Claude Code-friendly because it:
- defines context once in the setup prompt
- uses `/speckit.*` commands directly
- limits each prompt to one objective
- asks for file updates instead of long explanations
- prevents premature implementation
- keeps implementation scoped to one task at a time
- uses `tasks.md` as the single source of truth for what to do next
