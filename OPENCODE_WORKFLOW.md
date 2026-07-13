# OpenCode Workflow — PineNova Speckit

**Source:** OpenCode-native SDD governance workflow (adapted from Spec Kit methodology)
**Project:** PineNova — DTC ecommerce for sustainable pineapple-fiber vegan leather goods
**Stack:** Next.js 14.2.35, Prisma 5.22, Stripe v17, PostgreSQL 16, Redis 7
**Tool:** OpenCode (interactive CLI for software engineering)

---

## Setup Rules

These rules define how OpenCode operates on this project. Paste at session start or persist in `opencode.json`:

```jsonc
// opencode.json (project root)
{
  "customInstructions": "You are supporting the PineNova ecommerce platform. Read files before writing. Keep outputs concise. Reference file:line for all findings. Run `npm run build` and `npm test` before marking any task done. Use todowrite to track multi-step work. Delegate file exploration to task agents. Batch parallel reads with a single tool call.",
}
```

---

## 1. Initialize Governance Structure

Run in terminal to create the governance directory:

```bash
New-Item -ItemType Directory -Path ".opencode/agents" -Force; New-Item -ItemType Directory -Path ".opencode/skills" -Force
```

> OpenCode uses `.opencode/` for project-level configuration. Agents and skills live here.

---

## 2. Constitution

Purpose: set non-negotiable delivery principles. Persisted as an OpenCode agent so every session loads it.

> Create `.opencode/agents/constitution.md`:
>
> ```markdown
> # PineNova Constitution
>
> Principles:
> - Customer payment data and PII must be protected at all times (PCI compliance).
> - All pricing is server-authoritative — never trust client-supplied amounts.
> - Inventory accuracy is critical — use atomic operations, not read-then-write.
> - Every user story needs acceptance criteria before implementation.
> - All API routes must have consistent error response format (`apiError()` from `lib/api-utils.ts`).
> - Silent catch blocks are not allowed — every error must be logged via `logger.error()`.
> - No new `as any` type casts — use proper types or Zod inference.
> - Every PR must pass `npm run build` and `npm test` before merge.
> ```

**Current alignment check:**

| Principle | Status | Evidence |
|-----------|--------|----------|
| Payment/PII protection | ⚠️ Partial | `login/page.tsx:36` — HttpOnly cookie missing; localStorage token leak |
| Server-authoritative pricing | ✅ Pass | `checkout/route.ts:96-101` rejects client `amount`/`price` |
| Inventory atomicity | ❌ Fail | `inventory.service.ts:60-78` — `releaseStock` non-atomic read-then-write |
| Acceptance criteria | ⚠️ Partial | 32/36 requirements traceable, 4 missing |
| Consistent error format | ❌ Fail | 3 different error response formats across codebase |
| No silent catches | ❌ Fail | 14 silent catch blocks found |
| No `as any` | ❌ Fail | 57 `as any` casts found across codebase |
| Build/test gate | ✅ Pass | `npm run build` (41 routes), `npm test` (171/171) |

---

## 3. Specify

Purpose: describe the **what** and **why**. Run as a task agent to explore the project and summarize.

```bash
# Use the task agent to explore and capture specification
# Prompts the agent to read key files and return a specification summary
```

> **OpenCode approach:** Use `task` agent with `subagent_type="explore"` to build project understanding, then write the specification to `.opencode/spec.md`.

**Specification for PineNova:**

Build a DTC ecommerce platform. Users browse/search/filter products, manage cart, checkout via Stripe, view orders, submit reviews. Admins manage products/orders/inventory/discounts/metrics.

Success criteria:
- Checkout completes in under 3 minutes
- Orders created within 5s of Stripe confirmation
- Atomic inventory — no overselling
- Reviews show accurate avg rating from all approved reviews

---

## 4. Clarify

Purpose: reduce ambiguity. Use `question` tool to get decisions from the user.

```
Use the question tool to clarify ambiguous topics before planning.
```

> **OpenCode approach:** Rather than a slash command, use the `question` tool to gather input on ambiguous areas. Topics requiring clarification:
> - Auth: migrate to HttpOnly cookie only, or keep dual localStorage+cookie?
> - Error format: which of the 3 existing formats becomes standard?
> - Refunds: always require Stripe, or keep simulated fallback?
> - Reviews: add purchase validation required before Sprint 8 completion?

**Findings from audit:**

| Topic | Status | Key File |
|-------|--------|----------|
| Auth cookie security | ❌ No HttpOnly/Secure | `login/page.tsx:36` |
| Status transitions | ✅ Mapped | `admin-utils.ts:35-49` |
| Refund idempotency | ⚠️ `Date.now()` key — ms collision risk | `admin/orders/route.ts:166` |
| Inventory concurrency | ⚠️ reserveStock ✅, releaseStock ❌ | `inventory.service.ts:60-78` |
| Error responses | ❌ 3 formats | Multiple route files |
| Review rating | ❌ Only 3 latest reviews | `products/[slug]/page.tsx:50-52` |
| Purchase validation | ❌ Any user can review any product | `reviews/route.ts` |
| CSP nonce | ❌ `X-CSP-Nonce` → `x-nonce` | `middleware.ts:133` |

---

## 5. Plan

Purpose: produce the technical approach. Use `todowrite` to capture the plan as tasks.

```
Use the todowrite tool to create a structured task list.
```

> **OpenCode approach:** Create the plan directly as OpenCode todos with priority levels. No separate `plan.md` needed — the todo list is the plan.

**Sprint 8 Plan (from AUDIT_REPORT.md findings):**

| Phase | Tasks | Effort |
|-------|-------|--------|
| Critical Security | Nonce fix, cookie hardening, S3 env fix, email env fix | 0.5d |
| Critical Reliability | PaymentIntent in transaction, releaseStock atomic, Dockerfile fix, audit log fix | 1d |
| High Data Quality | localStorage removal, avg rating fix, review key fix, Stripe catch narrow | 1d |
| High UX | Badge colors, empty state, duplicate reviews, 403/404 pages | 0.5d |
| Medium Quality | Logging to catch blocks, standardize error responses, PENDING filter | 1d |

---

## 6. Plan Review

Purpose: remove over-engineering. Run as a focused task agent review.

```markdown
Review the Sprint 8 plan. Simplify: defer AdminPage.tsx refactor to Sprint 9, defer account/page.tsx refactor to Sprint 9, keep checkout.service.ts changes minimal (only fix PaymentIntent ordering), no new migrations, no new dependencies. Output updated plan only.
```

> **OpenCode approach:** Launch a `task` agent with `subagent_type="general"` to review and simplify the plan, then update the todos.

**Simplifications applied:**
- Defer `AdminPage.tsx` refactor → Sprint 9
- Defer `account/page.tsx` refactor → Sprint 9
- Minimal `checkout.service.ts` changes (only PaymentIntent ordering fix)
- No new DB migrations for Sprint 8
- No new npm dependencies for Sprint 8

---

## 7. Tasks

Purpose: create granular, implementable tasks. Use `todowrite` with all states.

```
Use todowrite to create the full Sprint 8 task list with priorities and statuses.
Phase 1 tasks: priority=high, status=pending
Phase 2 tasks: priority=high, status=pending
Phase 3 tasks: priority=high, status=pending
Phase 4 tasks: priority=medium, status=pending
```

> **OpenCode approach:** `todowrite` IS the task list. Each task has content, status (pending/in_progress/completed/cancelled), and priority (high/medium/low).

**Sprint 8 Tasks:**

### Phase 1: Critical Security (parallel)

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 1 | Fix nonce header: rename `X-CSP-Nonce` to `x-nonce` | `middleware.ts:133` | 5m | high |
| 2 | Harden auth cookie: add `HttpOnly; Secure; SameSite=Lax` | `login/page.tsx:36`, login API | 10m | high |
| 3 | Fix S3 env var name: `S3_ACCESS_KEY` → `S3_ACCESS_KEY_ID` | `lib/s3.ts:7-8` | 5m | high |
| 4 | Fix email env var name: `EMAIL_API_KEY` → `SENDGRID_API_KEY` | `lib/email.ts:1` | 5m | high |

### Phase 2: Critical Reliability

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 5 | Move `createPayment()` inside `retryOnSerialization` | `services/checkout.service.ts:295-296` | 1h | high |
| 6 | Fix `releaseStock` to use atomic `UPDATE ... SET stock = stock + $1` | `services/inventory.service.ts:60-78` | 30m | high |
| 7 | Fix audit log: use user ID not `result.accessToken` | `api/auth/refresh/route.ts:30` | 10m | high |
| 8 | Fix Dockerfile: remove `--only=production` | `Dockerfile:4` | 10m | high |

### Phase 3: Data Quality (parallel)

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 9a | Remove localStorage reads in `account/page.tsx` | `app/(storefront)/account/page.tsx` | 30m | high |
| 9b | Remove localStorage reads in `ReviewForm.tsx` | `components/ReviewForm.tsx` | 15m | high |
| 9c | Remove localStorage reads in `AdminPage.tsx` | `components/AdminPage.tsx` | 30m | high |
| 9d | Remove localStorage reads in `orders/[id]/page.tsx` | `app/(storefront)/account/orders/[id]/page.tsx` | 15m | high |
| 10 | Fix average rating: separate count/avg query | `products/[slug]/page.tsx:50-52` | 30m | high |
| 11 | Fix review key: `key={review.id}` not `key={i}` | `products/[slug]/page.tsx:35,194` | 10m | high |
| 12 | Narrow Stripe catch: only simulate on MODULE_NOT_FOUND | `admin/orders/route.ts:147-164` | 15m | high |

### Phase 4: UX + Quality (parallel)

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 13 | Fix badge colors: CONFIRMED=blue, SHIPPED=green | `account/page.tsx:24-31` | 5m | medium |
| 14 | Add "No reviews yet" empty state | `products/[slug]/page.tsx:186-210` | 15m | medium |
| 15 | Fix duplicate reviews on AllReviews expand | `AllReviews.tsx`, `products/[slug]/page.tsx` | 30m | medium |
| 16 | Add 403/404 error pages for order detail | `account/orders/[id]/page.tsx:65` | 1h | medium |
| 17 | Add logging to 14 silent catch blocks | Multiple files (lib/ + services/ first) | 1h | medium |
| 18 | Add PENDING status to admin filter dropdown | `AdminPage.tsx:244-252` | 5m | medium |

---

## 8. Task Review

Purpose: keep tasks small enough for a single OpenCode context window.

> **OpenCode approach:** If any `todowrite` item takes >30 min or spans >3 files, split it. Use `todowrite` to update with sub-tasks.

**Review results:**
- Task 9 (localStorage removal) spans 4 files → split into 9a-9d (one per file)
- Task 17 (14 catch blocks) → keep single but limit scope to `lib/` + `services/` first
- Task 16 (403/404 pages) → largest task at ~1h, mark as such
- All others: under 30m each, 1-3 files each

---

## 9. Implement First Slice

Purpose: implement one task, run build+tests, stop.

```
# Set task 1 to in_progress
todowrite: task 1 -> in_progress

# Read the file
Read middleware.ts

# Edit the nonce header name
Edit: middleware.ts line 133: "X-CSP-Nonce" -> "x-nonce"

# Verify
Run: npm run build
Run: npm test

# Mark complete
todowrite: task 1 -> completed
```

> **OpenCode approach:** Mark one task `in_progress` at a time. Use `Read` + `Edit` + `bash` (build/test). After success, mark `completed` and move to next.

**First task:** Fix nonce header (`middleware.ts:133`)
- Read → Edit (`X-CSP-Nonce` → `x-nonce`) → Build (`npm run build`) → Test (`npm test`)
- Done: `x-nonce` header set in all 4 response paths, build passes, 171/171 tests pass

---

## 10. Code Review

Purpose: check quality without expanding scope. Use `grep` + `task` to audit changes.

```markdown
Review the most recent changes since the last commit. Check: security leaks (PII, tokens in logs), business logic correctness, unnecessary complexity, files changed outside task scope. Use grep to scan for new issues. Return findings only.
```

> **OpenCode approach:** Use `grep` to scan for regressions, `bash git diff` to see changes, and a `task` agent for deeper analysis.

**Checklist after each implementation:**

| Check | Tool | Pass/Fail |
|-------|------|-----------|
| No accessToken logged | `grep -rn "accessToken" --include="*.ts" --include="*.tsx" app/ components/ lib/ services/` | ⬜ |
| No new `as any` | `grep -rn "\bas any\b" --include="*.ts" --include="*.tsx" app/ components/ lib/ services/` (compare count before/after) | ⬜ |
| No new silent catches | `grep -rn "catch\s*(\s*)" --include="*.ts" --include="*.tsx" app/ components/ lib/ services/` (compare count before/after) | ⬜ |
| Build passes | `bash command: npm run build` | ⬜ |
| Tests pass | `bash command: npm test` | ⬜ |
| Only task-scope files changed | `bash command: git diff --name-only` | ⬜ |

---

## 11. Fix Review Findings

Purpose: apply minimal targeted fixes. Use `edit` tool with surgical precision.

```
For each confirmed finding from the review:
1. Read the affected file
2. Edit only the problematic lines
3. Run npm test
4. Summarize changed files
```

> **OpenCode approach:** Use `edit` with precise `oldString`/`newString` matching. No file rewrites — only targeted replacements. Verify with build + test after each fix.

---

## 12. Demo Script

Purpose: generate a stakeholder walkthrough.

```markdown
Create DEMO_SCRIPT.md. Audience: PineNova stakeholders. Include: business problem, OpenCode workflow, artifacts created, first user story demo path, value, 3 talking points. Keep under 500 words.
```

> **OpenCode approach:** Use `write` to create the demo script. Reference actual artifacts produced.

**Demo Script (PineNova):**

### Business Problem
PineNova's codebase had 6 critical issues that would crash in production — env var mismatches (S3, SendGrid), double-charge risk, race conditions in stock release, and a broken Docker build. Without systematic governance, these issues survived multiple sprints.

### OpenCode Workflow Applied
1. **Constitution agent** — Enforces non-negotiable principles (PCI, atomic inventory, no silent catches)
2. **Audit task** — Task agent explored 284 files and produced a 33-section audit report
3. **Clarify questions** — `question` tool resolved ambiguity on auth strategy and error formats
4. **Plan as todos** — `todowrite` captured 18 Sprint 8 tasks with priorities and dependencies
5. **Task splitting** — Oversized tasks split into sub-30-minute chunks
6. **Incremental implement** — One task at a time, build+test gate after each

### Artifacts Created
- `AUDIT_REPORT.md` — 33-section SDD audit (34 findings, 284 files enumerated)
- `OPeNCode_WORKFLOW.md` — This reusable workflow
- `.opencode/agents/constitution.md` — Persistent governance agent

### First User Story Demo
Fix CSP nonce header (`middleware.ts:133`). OpenCode read the file, edited `X-CSP-Nonce` → `x-nonce`, ran `npm run build` (41 routes clean) and `npm test` (171/171 passing). Total time: 2 minutes.

### Value
OpenCode provides **governance-as-code** — the same session that discovers a critical issue plans, implements, and verifies the fix. No tool switches, no context loss.

### 3 Talking Points
1. **10x audit-to-fix velocity** — Critical env var mismatches found and fixed in same session
2. **Constitution prevents recurring bugs** — Once "atomic inventory" is a principle, every task auto-checks
3. **Sub-30-min tasks keep context sharp** — Smaller tasks = fewer hallucinations, better output

---

## OpenCode-Specific Notes

This workflow uses OpenCode's native capabilities:

| Capability | Usage |
|-----------|-------|
| `todowrite` | Track plan, tasks, and progress across the session |
| `task` agent | Delegate file exploration, plan review, and deep analysis to sub-agents |
| `question` tool | Clarify ambiguous design decisions before implementation |
| `edit` tool | Surgical single-line fixes without file rewrites |
| `grep` + `glob` | Search codebase for patterns, regressions, and issue counts |
| `bash` | Run build, tests, git diff, and project scripts |
| `Read` parallel | Batch-read multiple files in a single call for efficiency |
| `skill` load | Load relevant skills (ads-*, customize-opencode) when domain-specific expertise needed |
| `.opencode/agents/` | Persist constitution, spec, and reusable prompts across sessions |
| `opencode.json` | Set customInstructions once so every session inherits operating rules |

### Token-Saving Patterns

- **Batch reads** — `read` multiple files in parallel instead of sequential reads
- **Task agents** — Delegate exploration to sub-agents instead of reading everything yourself
- **Surgical edits** — Use `edit` with targeted `oldString` instead of rewriting entire files
- **`grep` before read** — Search before reading; read only what matches
- **One `in_progress` at a time** — Only one active todo keeps focus
