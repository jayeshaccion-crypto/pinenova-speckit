# AIOS SDD Framework v1

## Purpose

AIOS (AI Operating System) for Specification-Driven Development is a
lightweight governance framework designed to **align an existing
software project** with SDD practices **without disrupting the current
development process**.

The goal is incremental adoption, not a rewrite.

------------------------------------------------------------------------

# Guiding Principles

-   Do not rewrite working code just to satisfy a pattern.
-   Treat the existing codebase as the baseline.
-   Improve incrementally.
-   Documentation follows implementation where necessary.
-   Every change must improve traceability.
-   Minimize process overhead.
-   Automate repetitive governance.

------------------------------------------------------------------------

# Incremental Adoption Roadmap

## Phase 0 --- Baseline (1--2 days)

-   Run a complete project audit.
-   Generate:
    -   Architecture report
    -   Gap register
    -   Feature inventory
    -   Technical debt register
    -   Requirements traceability matrix
-   Freeze these as the baseline.

Deliverable: `/aios/baseline/`

------------------------------------------------------------------------

## Phase 1 --- Lightweight Structure

Add a new folder only.

    .aios/
        baseline/
        specs/
        adr/
        audit/
        roadmap/

Do **not** move existing code.

------------------------------------------------------------------------

## Phase 2 --- Traceability

Assign IDs:

-   REQ-xxx
-   SPEC-xxx
-   API-xxx
-   DB-xxx
-   FE-xxx
-   BE-xxx
-   TEST-xxx

Only for new work initially.

------------------------------------------------------------------------

## Phase 3 --- New Features Only

For every new feature:

Requirement → Specification → Implementation → Tests → Documentation

Do not retrofit old modules unless they are already being modified.

------------------------------------------------------------------------

## Phase 4 --- Continuous Audit

Before merge:

-   Architecture check
-   Duplicate check
-   Security check
-   Performance check
-   Documentation check
-   Traceability check

Automate where possible.

------------------------------------------------------------------------

## Phase 5 --- Living Documentation

Update only affected documentation during each feature.

Avoid large documentation-only sprints.

------------------------------------------------------------------------

# Daily Workflow

1.  Understand existing implementation.
2.  Search for reusable code.
3.  Perform impact analysis.
4.  Implement.
5.  Update tests.
6.  Update documentation.
7.  Run audit.
8.  Merge.

------------------------------------------------------------------------

# Rules

## MUST

-   Preserve existing architecture unless there is measurable value.
-   Reuse components.
-   Add acceptance criteria.
-   Keep documentation synchronized.
-   Record architectural decisions (ADR).

## MUST NOT

-   Large-scale rewrites without business justification.
-   Duplicate components.
-   Create parallel architectures.
-   Introduce new patterns inconsistently.
-   Break backward compatibility without approval.

------------------------------------------------------------------------

# Governance Checklist

For every task:

-   Requirement identified
-   Existing implementation reviewed
-   Impact analyzed
-   Acceptance criteria defined
-   Tests updated
-   Documentation updated
-   Audit passed

------------------------------------------------------------------------

# Recommended Repository Layout

    .aios/
        baseline/
        specs/
        adr/
        audit/
        roadmap/
        templates/
        prompts/

This sits beside the existing project. No code relocation required.

------------------------------------------------------------------------

# Practical Adoption Tips

1.  Start with **one project**, not the whole organization.
2.  Apply AIOS only to **new features and modified modules**.
3.  Treat audit findings as backlog items instead of stopping
    development.
4.  Keep specifications concise and version-controlled.
5.  Run a full audit once per release and lightweight audits per pull
    request.
6.  Measure adoption using:
    -   Documentation coverage
    -   Traceability coverage
    -   Test coverage
    -   Open technical debt
    -   Architecture violations

------------------------------------------------------------------------

# Success Criteria

Within 2--4 sprints:

-   Every new feature has a specification.
-   Every merged change updates documentation.
-   No architecture drift.
-   Reduced duplicate code.
-   Audit findings decrease over time.
-   Development speed is maintained or improved.

The objective is **continuous alignment**, not process overhead.
