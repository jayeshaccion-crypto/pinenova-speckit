# Essilor Lens Exception Dashboard Constitution

## Core Principles

### I. Checkout & Payment Reliability
Checkout reliability and payment correctness are the top priority — a broken checkout is a P0 incident, not a bug. Every change touching checkout or payment flows must include regression tests and a live monitoring check.

### II. Data Protection & Privacy
Protect customer payment and personal data: no raw card data stored on our servers, all payment handling delegated to Stripe, PII encrypted at rest, secrets never committed to the repo. Credential scanning is part of CI.

### III. SEO & Core Web Vitals
SEO and Core Web Vitals are first-class, measurable requirements (LCP, CLS, INP budgets), not an afterthought. Every frontend change must be validated against performance budgets before merge.

### IV. Sustainability Claims Accuracy
Every product must carry accurate materials/sustainability copy — no unverified certification or environmental claims. All sustainability copy must link to a verifiable source.

### V. Security-First Design
Security is reviewed at every stage: input validation, auth/authorization on every endpoint, rate limiting on public APIs, dependency scanning. Security reviews are part of the definition of done.

### VI. Test Coverage Mandate
Every user story needs acceptance criteria and automated test coverage. No story is complete without passing tests across unit, integration, and E2E layers.

### VII. TDD for High-Risk Logic
Use TDD for pricing, inventory, tax, and checkout logic — these are the highest-risk areas for silent bugs. Red-Green-Refactor cycle is strictly enforced for these modules.

### VIII. Idempotency
All state-changing operations (orders, inventory, payments) must be idempotent and safe to retry. Duplicate requests must not produce duplicate side effects.

### IX. Dependency Discipline
No external services unless justified; every added dependency must have a named owner and a documented reason. Dependencies without clear rationale will be rejected during review.

### X. Graceful Degradation
The system must support graceful degradation — if a non-critical service (e.g. reviews, recommendations) fails, checkout must still work. Feature flags and circuit breakers are required for all non-critical integrations.

### XI. Observability
Observability is required: structured logging, error tracking, and basic uptime/alerting for checkout and payment flows before launch. All services must expose health check endpoints.

## Governance

The constitution supersedes all other practices. Amendments require a documented proposal, team review, and a migration plan. All PRs must verify constitution compliance.

**Version**: 1.0.0 | **Ratified**: 2026-07-11 | **Last Amended**: 2026-07-11
