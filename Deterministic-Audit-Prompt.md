# MASTER PROMPT (Deterministic) — Enterprise Project Audit & Gap Analysis

This is a rewrite of the original audit prompt. The scope and section list are preserved.
What's added: a fixed traversal algorithm, explicit scoring formulas, severity
thresholds, an evidence citation standard, a token-budget/priority protocol, and
explicit stopping criteria — so two runs against the same repo state produce the
same coverage and comparable scores.

---

## PHASE 0 — REPOSITORY MANIFEST (do this first, always)

1. Enumerate every file in the repository using a fixed traversal order: **top-down,
   alphabetical within each directory, directories before files**.
2. Exclude by default (log the exclusion, don't silently drop):
   `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`, `venv/`, `__pycache__/`,
   lockfiles' contents (list the file, don't parse it line-by-line), binary assets
   (list filename + size only), and anything in `.gitignore`.
3. Produce a **File Manifest Table** before any analysis:

   | # | Path | Type | LOC | Category (source/config/doc/test/infra/asset) | Included in audit? |

4. This manifest is the audit's scope contract. Any file marked "Included" must be
   referenced by at least one finding or explicitly marked "Reviewed — no findings"
   by the end of the audit. Any file marked "Excluded" must state why.

## PHASE 1 — FULL-DEPTH AUDIT PROTOCOL

There is no context or effort budget constraint on this audit. Every file marked
"Included" in the Phase 0 manifest gets a full-depth, line-level review — no
inventory-only passes, no sampling, no skipped categories. This applies equally to
source, config, infra, tests, and documentation.

The **Priority Order** below governs sequencing only — the order files are audited
in, and the order findings are surfaced in the report — not depth or inclusion. Every
category still gets the same full-depth treatment; this just fixes the traversal
order so two runs process the repo identically.

**Priority Order (highest first, sequencing only — never reorder, never skip):**
1. Auth/authz code and security-sensitive config (secrets, env, CORS, middleware)
2. Public API surface (routes/controllers/schemas)
3. Database schema/migrations
4. Core domain/business logic
5. Frontend routes/pages and components
6. CI/CD and infra-as-code
7. Tests (full review, including individual test assertions)
8. Documentation
9. Remaining utilities/assets/config

## PHASE 2 — SCORING RUBRICS (fixed formulas, not vibes)

All scores are 0–100 unless stated otherwise. Show the formula inline in the report,
not just the number.

- **Documentation Coverage %** = (docs found matching a required-doc checklist ÷ size
  of that checklist) × 100. Required-doc checklist: README, architecture doc, API
  spec, setup/dev guide, contribution guide, changelog, ADRs (count if any exist).
- **API Coverage %** = (endpoints implemented in code that also have a schema/doc
  entry ÷ total endpoints found in code) × 100. State both numerator and denominator.
- **Test Coverage %** = use the tool-reported number (coverage report / CI artifact)
  if one exists in the repo. If none exists, state "Not found in repository" — never
  estimate this number from reading test files.
- **Code Quality Score** = weighted average of: Duplication (20%), Cyclomatic
  complexity of largest 10% of functions (20%), File/function size violations vs.
  project's own stated or de facto convention (20%), Dead code found (15%), Naming
  consistency (15%), Comment-to-noise ratio (10%). Show each sub-score.
- **Accessibility Score** = (WCAG 2.1 AA checks passed ÷ WCAG 2.1 AA checks
  applicable to the components found) × 100. List which checks were applicable.
- **Overall Health Score** = simple average of: Documentation Coverage,
  Code Quality Score, Test Coverage %, Security Findings Score (100 − 10×Critical −
  5×High − 2×Medium − 1×Low, floor 0), Architecture Compliance % (manual, defined in
  Architecture Audit section — must list which principles were checked against).

## PHASE 3 — SEVERITY THRESHOLDS (fixed, applies to every finding)

| Severity | Definition |
|---|---|
| Critical | Actively exploitable security hole, data loss risk, or breaks a core user flow in production as-is |
| High | Violates a stated architecture/security rule, no workaround, will cause an incident under load or edge case |
| Medium | Deviates from spec/standard, has a workaround, degrades quality/maintainability |
| Low | Cosmetic, stylistic, or minor inconsistency with no functional impact |

Every finding must be assigned one of these four — no unranked findings allowed.

## PHASE 4 — EVIDENCE CITATION STANDARD

Every finding cites evidence as `path/to/file.ext:line_start-line_end`. If the finding
is about an absence (missing file/feature), cite the manifest row instead and state
"Not found in repository" — never fabricate a path.

## PHASE 5 — STOPPING / COMPLETION CRITERIA

The audit is complete when, and only when:
1. Every file marked "Included" in the manifest has been read at full depth and is
   either cited in a finding or marked "Reviewed — no findings."
2. Every one of the 33 report sections (below) is populated or contains an explicit
   "Not applicable — [reason]" or "Not found in repository."
3. No file is skipped, sampled, or deferred for any reason — there is no budget
   exception. If a section appears exhausting, that is expected; continue rather than
   summarizing or truncating.

---

# SCOPE, INPUTS, DISCOVERY

(Unchanged from original — audit project structure, source, docs, architecture,
frontend, backend, database, infra, auth, API, UI/UX, testing, CI/CD, deployment,
security, performance, accessibility, observability, logging, caching, state
management, error handling, developer experience.)

Discover and document, before continuing, in an **Architecture Understanding**
section: purpose, business domain, users, architecture style, tech stack,
frameworks/libraries, services/integrations, deployment model, auth model,
authz model, folder structure, build process, dev workflow, release process,
coding standards actually observed in code (not assumed), design system,
component library, feature modules, bounded contexts, database model,
infrastructure, dependencies.

# REQUIREMENTS TRACEABILITY

| Requirement | Source doc:line | UI file | Backend file | API endpoint | DB table/migration | Test file | Status | Gap |

Status ∈ {Complete, Partial, Missing, Broken, Deprecated, Blocked} — no other values.
If no requirements documents exist in the manifest, state that and derive a
requirements list from code + README only, flagged as "Inferred, not sourced."

# ARCHITECTURE / CODE QUALITY / FRONTEND / UI COMPONENT / SCREEN / FEATURE /
# USER FLOW / BACKEND / API / DATABASE / SECURITY / PERFORMANCE / ACCESSIBILITY /
# TESTING / DEVOPS / TECHNICAL DEBT AUDITS

(Unchanged in scope from the original — same checklists apply.) Each of these
sections must:
- Follow the Phase 1 priority order for sequencing only — every file still gets
  full-depth review regardless of category.
- Cite every finding per the Phase 4 standard.
- Assign every finding a Phase 3 severity.
- Use table formats exactly as specified in the original prompt (Component
  Inventory, Feature Inventory, etc.).

# GAP ANALYSIS / INCOMPLETE FEATURES / MISSING FEATURES

For every gap: ID, Category, Description, Current State (cited), Expected State
(cited to source doc or "Inferred from architecture norms"), Evidence, Files,
Dependencies, Severity (Phase 3), Estimated Effort (S/M/L/XL — define: S=<1 day,
M=1-3 days, L=1-2 weeks, XL=>2 weeks), Acceptance Criteria, Implementation Notes.

# DEVELOPMENT ROADMAP

Sprints built strictly from the Gap Analysis backlog, ordered by Severity then
Dependency chain (a task cannot appear in a sprint before its dependencies). Each
task: Priority, Dependencies, Files, Acceptance Criteria, Definition of Done,
Effort (S/M/L/XL), Severity.

# UI SPECIFICATION VALIDATION

Only run this section if a design source (Figma export, design tokens file, style
guide doc) exists in the manifest. If none exists, state "Not found in repository —
UI validated against internal consistency only" and skip pixel-level comparison.

---

# FINAL REPORT — REQUIRED SECTIONS (in order)

1 Executive Summary (≤300 words, high-level only — this is the one permitted
  summary; it does not violate "never summarize," which applies to findings, not
  this synopsis)
2 File Manifest & Scope Contract (Phase 0 output)
3 Project Understanding
4 Architecture Overview
5 Tech Stack
6 Documentation Audit
7 Requirements Traceability Matrix
8 Architecture Audit
9 Folder Structure Audit
10 Code Quality Audit
11 Frontend Audit
12 UI Audit
13 Screen Audit
14 Component Audit
15 Backend Audit
16 API Audit
17 Database Audit
18 Security Audit
19 Performance Audit
20 Accessibility Audit
21 Testing Audit
22 DevOps Audit
23 Technical Debt
24 Feature Inventory
25 Missing Features
26 Incomplete Features
27 Gap Analysis
28 Risks
29 Recommendations
30 Prioritized Development Backlog
31 Sprint Roadmap
32 Production Readiness Assessment
33 Overall Health Score (with formula shown, per Phase 2)
34 Next Immediate Actions (top 5, each tied to a Gap ID)
35 Audit Completion Statement (confirms Phase 5 criteria met, or states resume point)

---

# OUTPUT RULES

- Every finding: cited (Phase 4), severity-tagged (Phase 3).
- Every score: formula shown (Phase 2).
- No unranked findings, no uncited claims, no fabricated paths or doc contents.
- If information can't be verified from the repo: "Not found in repository."
- The audit is complete only when Phase 5 criteria are met — not when it "feels"
  thorough.
