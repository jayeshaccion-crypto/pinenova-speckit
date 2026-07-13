# SPEC-001: Guest Checkout Policy Resolution

**Status:** Draft  
**Author:** AIOS Governance System  
**Reviewers:** [Pending]  
**Created:** 2026-07-12  
**Approved:** —  
**Related:** GAP-001, ADR-012, REQ-004, REQ-082

---

## 1. Problem Statement

**Critical Contradiction:** The project has two authoritative sources with opposing requirements for guest checkout:

- **`docs/00-assumptions.md:25`** (Source of Truth): "Guest Checkout — Disabled (account required)"
- **`specs/001-pinenova-ecommerce/spec.md:182`** (FR-022): "Guest checkout MUST be supported"

This contradiction blocks:
- Checkout UI implementation (SPEC-009) — unclear if guest flow needed
- Authentication architecture — token storage differs for guest vs authenticated
- Testing strategy — different test matrices
- Compliance — PCI SAQ A scope changes with guest checkout

**Decision Required:** Align all documentation and implementation to a single policy.

---

## 2. Requirements Traceability

| Req ID | Source | Requirement | Priority |
|--------|--------|-------------|----------|
| REQ-004 | BRD:BR04 | Guest checkout disabled | P0 |
| REQ-082 | spec.md:FR-022 | Guest checkout MUST be supported | P0 |
| REQ-011 | BRD:BR11 | Product catalogue immutable (12 items) | P1 |
| REQ-021 | BRD:BR21 | Stock validated before Stripe session | P0 |

---

## 3. Functional Specification

### 3.1 User Stories

- As a **customer**, I want to **purchase without creating an account** [IF ENABLED], so that **I can complete my purchase faster**
- As a **customer**, I want to **be required to create an account** [IF DISABLED], so that **my order history is preserved and I get loyalty benefits**
- As an **admin**, I want **clear policy documentation**, so that **implementation matches business intent**

### 3.2 Acceptance Criteria

| AC ID | Scenario | Given | When | Then |
|-------|----------|-------|------|------|
| AC-001 | Policy documented | All docs reference single source | Developer reads any doc | All state "Guest checkout: DISABLED" |
| AC-002 | Checkout requires auth | User not logged in | User clicks checkout logged in | Redirect to `/account/auth/login?redirect=/checkout` |
| AC-003 | Cart persists for guests | Guest adds items | Guest logs in | Cart merges to user account (GAP-032) |
| AC-004 | No guest order creation | Any path | Order created | `Order.userId` is never null |
| AC-005 | Spec.md updated | spec.md FR-022 reads | Developer checks | "Guest checkout is DISABLED per assumptions" |

### 3.3 Business Rules

1. **Account required for all purchases** — No exceptions
2. **Cart persists via sessionId** — Guest cart uses localStorage sessionId, merges on login
3. **No guest email capture at checkout** — Email only collected during account creation
4. **Order always linked to User** — `Order.userId` required (NOT NULL in schema)

---

## 4. Technical Specification

### 4.1 API Contract Changes

| Method | Path | Auth | Change |
|--------|------|------|--------|
| POST | `/api/checkout` | Required (JWT) | Return 401 if no valid accessToken |
| GET | `/api/cart` | Optional | Returns cart by sessionId |
| POST | `/api/cart` | Optional | Creates/updates cart by sessionId |
| POST | `/api/auth/login` | None | On success, merge guest cart → user cart |

### 4.2 Data Model

**No schema changes required.** Current schema already enforces `Order.userId` required.

```prisma
// Already exists in schema.prisma
model Order {
  id        String   @id @default(cuid())
  userId    String   // REQUIRED - no nullable
  user      User     @relation(fields: [userId], references: [id])
  // ...
}
```

### 4.3 Files to Modify

| File | Change |
|------|--------|
| `specs/001-pinenova-ecommerce/spec.md` | Update FR-022 to "Guest checkout is DISABLED per assumptions" |
| `docs/00-assumptions.md` | Confirm as single source of truth (no change) |
| `app/api/checkout/route.ts` | Add auth guard: require valid JWT, return 401 |
| `app/api/cart/route.ts` | Add cart merge logic on login (new endpoint or extend login) |
| `app/(storefront)/checkout/page.tsx` | Remove any guest-specific UI; add auth redirect |
| `middleware.ts` | Ensure `/api/checkout` NOT in publicPaths |
| `lib/admin-utils.ts` | No change (admin separate) |

### 4.4 Security Considerations

- [x] Checkout requires valid JWT (not just sessionId)
- [x] Cart merge on login validates ownership
- [x] No guest email/password capture at checkout
- [x] CSP unaffected
- [x] Rate limiting on checkout remains (10/min)

### 4.5 Performance Requirements

- Cart merge: < 50ms additional latency on login
- Checkout auth check: < 10ms
- No additional DB queries on checkout (auth already validated)

---

## 5. UI/UX Specification

### 5.1 Component States

| State | Description |
|-------|-------------|
| Unauthenticated → Checkout | Redirect to login with `?redirect=/checkout` |
| Login success with guest cart | Toast: "Your cart has been merged" |
| Login success, no guest cart | Normal redirect to checkout |

### 5.2 Accessibility

- [ ] Redirect preserves focus
- [ ] Toast announced to screen readers
- [ ] Login form has proper labels

### 5.3 Responsive

- Same behavior all breakpoints

---

## 6. Testing Strategy

### 6.1 Unit Tests

| Function | Cases |
|----------|-------|
| `mergeGuestCart(userId, sessionId)` | merges items, sums quantities, deletes guest cart, handles conflicts |

### 6.2 Integration Tests

| Flow | Test File |
|------|-----------|
| Unauthenticated checkout → 401 | `tests/integration/checkout-auth.test.ts` |
| Guest cart + login → merged cart | `tests/integration/cart-merge.test.ts` |
| Authenticated checkout → success | `tests/integration/checkout-flow.test.ts` |

### 6.3 E2E Tests

| User Journey | Test File |
|--------------|-----------|
| Browse → Cart → Login → Checkout → Success | `tests/e2e/checkout-auth.spec.ts` |
| Guest cart items persist after login | `tests/e2e/cart-merge.spec.ts` |

### 6.4 Coverage Targets

- Lines: ≥ 80%
- Branches: ≥ 75%
- Functions: ≥ 80%

---

## 7. Documentation Updates

| Doc | Update |
|-----|--------|
| `specs/001-pinenova-ecommerce/spec.md` | FR-022: "Guest checkout is DISABLED per assumptions doc" |
| `docs/architecture.md` | Note: Checkout requires auth; guest cart merges on login |
| `README.md` | Add note: "Account required for purchase" |

---

## 8. Rollout Plan

- [ ] Feature flag: `FLAG_guest_checkout=false` (default)
- [ ] Staging deployment
- [ ] Smoke test: Unauthenticated checkout returns 401
- [ ] Smoke test: Guest cart merges on login
- [ ] Production deployment
- [ ] Monitor: 401 rate on checkout endpoint

---

## 9. Open Questions

1. **Cart merge strategy:** Sum quantities vs keep separate lines? → Sum quantities (simpler, matches UX expectation)
2. **Max cart items per user:** Enforce limit on merge? → Yes, 99 per product (existing limit)
3. **Abandoned guest carts cleanup:** 30-day TTL job? → Separate task (GAP-020)

---

## 10. Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-07-12 | 0.1.0 | Initial draft |