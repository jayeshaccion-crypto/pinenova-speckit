# Specification Template — AIOS SDD

**Location:** `.aios/specs/SPEC-XXX-feature-name.md`  
**Naming:** `SPEC-XXX` (sequential, matches ADR/GAP when applicable)  
**Status:** Draft → Review → Approved → Implemented → Verified

---

## SPEC Template

```markdown
# SPEC-XXX: [Feature Name]

**Status:** Draft | Review | Approved | Implemented | Verified  
**Author:** [Name]  
**Reviewers:** [Names]  
**Created:** YYYY-MM-DD  
**Approved:** YYYY-MM-DD  
**Related:** ADR-XXX, GAP-XXX, FEAT-XXX, REQ-XXX

---

## 1. Problem Statement

What user/business problem does this solve? Why now?

## 2. Requirements Traceability

| Req ID | Source | Requirement | Priority |
|--------|--------|-------------|----------|
| REQ-XXX | BRD/FRD/spec.md | ... | P0/P1/P2 |

## 3. Functional Specification

### 3.1 User Stories

- As a [role], I want to [action], so that [benefit]
- ...

### 3.2 Acceptance Criteria

| AC ID | Scenario | Given | When | Then |
|-------|----------|-------|------|------|
| AC-001 | Happy path | ... | ... | ... |
| AC-002 | Edge case | ... | ... | ... |
| AC-003 | Error case | ... | ... | ... |

### 3.3 Business Rules

- Rule 1: ...
- Rule 2: ...

## 4. Technical Specification

### 4.1 API Contract

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/...` | JWT | `{...}` | `201 {...}` | `400`, `401`, `409` |

### 4.2 Data Model Changes

```prisma
// New/modified models
model NewModel {
  id        String   @id @default(cuid())
  field     Type
  relation  OtherModel @relation(...)
  @@index([field])
}
```

### 4.3 Component Architecture

```
New/Modified Files:
├── app/(storefront)/feature/page.tsx          # Server Component
├── components/FeatureComponent.tsx            # Client Component
├── app/api/feature/route.ts                   # API Route
├── lib/feature-utils.ts                       # Shared logic
└── types/index.ts                             # Zod schemas
```

### 4.4 Security Considerations

- [ ] Input validation (Zod)
- [ ] Auth/Authorization checks
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] CSP compliance
- [ ] No secrets in client bundle

### 4.5 Performance Requirements

- Target: < 200ms p95 API latency
- Bundle impact: < 10KB gzipped
- DB queries: ≤ 3 per request, indexed

## 5. UI/UX Specification

### 5.1 Wireframes/References
- Figma link: ...
- Screenshot: ...

### 5.2 Component States

| State | Description | Visual |
|-------|-------------|--------|
| Default | ... | |
| Loading | ... | |
| Error | ... | |
| Empty | ... | |
| Success | ... | |

### 5.3 Accessibility

- [ ] Semantic HTML
- [ ] ARIA labels/roles
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Color contrast (WCAG AA)
- [ ] Screen reader tested

### 5.4 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (<640px) | |
| Tablet (640-1024px) | |
| Desktop (>1024px) | |

## 6. Testing Strategy

### 6.1 Unit Tests

| Function | Cases |
|----------|-------|
| `validateX()` | valid, invalid, edge cases |

### 6.2 Integration Tests

| Flow | Test File |
|------|-----------|
| API happy path | `tests/integration/feature.test.ts` |
| Auth required | |
| Error handling | |

### 6.3 E2E Tests

| User Journey | Test File |
|--------------|-----------|
| Full flow | `tests/e2e/feature.spec.ts` |

### 6.4 Coverage Targets

- Lines: ≥ 80%
- Branches: ≥ 75%
- Functions: ≥ 80%

## 7. Documentation Updates

| Doc | Update |
|-----|--------|
| README.md | |
| API docs | |
| User guide | |
| ADR | |

## 8. Rollout Plan

- [ ] Feature flag: `FLAG_feature_name`
- [ ] Staging deployment
- [ ] Smoke test checklist
- [ ] Production deployment
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

## 9. Open Questions

- Question 1?
- Question 2?

## 10. Changelog

| Date | Version | Change |
|------|---------|--------|
| YYYY-MM-DD | 0.1.0 | Initial draft |
```

---

## Specification Lifecycle

```
Draft → (author completes all sections) → Review
  ↓
Review → (reviewers approve) → Approved
  ↓
Approved → (implementation + tests + docs) → Implemented
  ↓
Implemented → (QA verifies all ACs) → Verified
  ↓
Verified → (merged to main) → Done
```

**Gate Rules:**
- No implementation without **Approved** spec
- No merge without **Verified** spec
- Spec updates during implementation require re-approval if ACs change

---

## Current Specs (Baseline)

| SPEC | Title | Status | Related |
|------|-------|--------|---------|
| SPEC-001 | Guest Checkout Policy Resolution | Draft | GAP-001, ADR-012 |
| SPEC-002 | CSP Hardening & Nonce Implementation | Draft | GAP-002 |
| SPEC-003 | Admin Middleware Authorization | Draft | GAP-013 |
| SPEC-004 | Auth Token HttpOnly Cookie Migration | Draft | GAP-014 |
| SPEC-005 | CI/CD Pipeline (GitHub Actions) | Draft | GAP-003 |
| SPEC-006 | Docker Configuration | Draft | GAP-004 |
| SPEC-007 | Rate Limiter Consolidation (Redis) | Draft | GAP-012, GAP-025 |
| SPEC-008 | ProductVariant Model & API | Draft | GAP-009, ADR-010 |
| SPEC-009 | Checkout UI (Shipping + Payment + Confirmation) | Draft | GAP-008 |
| SPEC-010 | Test Database + Webhook Integration Tests | Draft | GAP-005, GAP-006 |
| SPEC-011 | E2E Test Suite (Playwright) | Draft | GAP-007 |
| SPEC-012 | Admin Dashboard Completion | Draft | GAP-020 |
| SPEC-013 | Account Pages Completion | Draft | GAP-021 |
| SPEC-014 | PCI SAQ A Sign-Off | Draft | GAP-010 |

---

## Spec Creation Checklist

For every new feature:

- [ ] Create SPEC file from template
- [ ] Fill ALL sections (no TODOs in final)
- [ ] Link to REQ/GAP/ADR/FEAT IDs
- [ ] Get 2 approvals (1 backend, 1 frontend if applicable)
- [ ] Store in `.aios/specs/`
- [ ] Update this index table
- [ ] Reference in PR: `Implements SPEC-XXX`