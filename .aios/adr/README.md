# Architecture Decision Records (ADR) — PineNova Ecommerce

**Location:** `.aios/adr/`  
**Format:** Markdown, one file per decision  
**Naming:** `ADR-XXX-short-description.md` (sequential)

---

## ADR Template

```markdown
# ADR-XXX: [Short Title]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Superseded | Deprecated  
**Author:** [Name]  
**Deciders:** [Names/Roles]  
**Tags:** [architecture, security, performance, data, infra, etc.]

## Context

What is the issue? What forces are at play? What constraints exist?

## Decision

What is the decision? Be specific and actionable.

## Consequences

### Positive
- Benefit 1
- Benefit 2

### Negative
- Drawback 1
- Drawback 2

### Neutral
- Trade-off 1

## Alternatives Considered

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| Alt 1 | | | |
| Alt 2 | | | |

## Implementation Notes

- Key implementation details
- Migration path (if replacing existing)
- Rollback plan

## Related

- ADR-XXX (supersedes)
- GAP-XXX (resolves)
- FEAT-XXX (enables)

## Validation

How will we verify this decision was correct?
- [ ] Metric 1
- [ ] Test 1
- [ ] Review date: YYYY-MM-DD
```

---

## Existing ADRs (from Baseline Audit)

| ADR | Title | Status | Date | Resolves |
|-----|-------|--------|------|----------|
| ADR-001 | Monolithic Next.js on Vercel + Railway PostgreSQL | Accepted | 2024-01-15 | — |
| ADR-002 | Prisma ORM with Repository Pattern (intended) | Accepted | 2024-01-15 | — |
| ADR-003 | JWT Auth with Access (15m) + Refresh (7d) Tokens | Accepted | 2024-01-20 | — |
| ADR-004 | Stripe Checkout Sessions Only (No PaymentIntents Direct) | Accepted | 2024-02-01 | — |
| ADR-005 | Express Exception for Stripe Webhook Retries | **Violated** | 2024-02-15 | GAP-011 |
| ADR-006 | Server-Authoritative Pricing (Client Price Rejected) | Accepted | 2024-02-20 | — |
| ADR-007 | Feature Flags for Checkout/Payment (Env-Based) | Accepted | 2024-03-01 | — |
| ADR-008 | Flat Product Catalog (12 Products, No Variants) | **Superseded** | 2024-03-15 | GAP-009 → ADR-010 |
| ADR-009 | In-Memory Rate Limiting (Map-Based) | **Superseded** | 2024-03-20 | GAP-012 → ADR-011 |
| ADR-010 | ProductVariant Model for Size/Color Options | Proposed | 2026-07-12 | GAP-009 |
| ADR-011 | Redis-Backed Rate Limiter with Atomic Operations | Proposed | 2026-07-12 | GAP-012, GAP-025 |

---

## ADR Creation Checklist

For every new architectural decision:

- [ ] Create ADR file in `.aios/adr/ADR-XXX-title.md`
- [ ] Follow template exactly
- [ ] Link to GAP/FEAT it resolves
- [ ] Get sign-off from at least 1 other engineer
- [ ] Update this index table
- [ ] Reference in related code comments: `// See ADR-XXX`

---

## ADR Lifecycle

```
Proposed → (review) → Accepted → (superseded by new ADR) → Superseded
                ↓
            Rejected (document why)
```

**Never delete ADRs** — they are historical record. Mark `Deprecated` if no longer relevant but keep file.

---

## Current Open Decisions (Require ADR)

| Topic | Trigger | Suggested ADR |
|-------|---------|---------------|
| Guest checkout: enabled vs disabled | GAP-001 contradiction | ADR-012: Guest Checkout Policy |
| Webhook: Express vs Next.js Route Handler | GAP-011, ADR-005 violated | ADR-013: Webhook Runtime |
| ProductVariant vs Flat Product | GAP-009, ADR-008 superseded | ADR-010 (proposed) |
| Rate Limiter: In-Memory vs Redis | GAP-012, ADR-009 superseded | ADR-011 (proposed) |
| Auth Token Storage: localStorage vs HttpOnly Cookie | GAP-014 | ADR-014: Auth Token Storage |
| Shipping Values: $8/$120 vs $5.99/$100 | GAP-022 | ADR-015: Shipping Configuration |
| Admin Auth: Middleware vs API-Level | GAP-013 | ADR-016: Admin Authorization Layer |

---

**Next ADR Number:** 012