# SPEC-002: CSP Hardening & Nonce Implementation

**Status:** Draft  
**Author:** AIOS Governance System  
**Reviewers:** [Pending]  
**Created:** 2026-07-12  
**Approved:** —  
**Related:** GAP-002, GAP-046, GAP-047

---

## 1. Problem Statement

**Current CSP (middleware.ts:27-37) is critically broken:**
- `'unsafe-eval'` — Enables `eval()` and `new Function()` — major XSS vector
- `'unsafe-inline'` — Allows inline scripts/styles — defeats CSP purpose
- `img-src https:` — Allows images from ANY HTTPS domain — data exfiltration risk
- No `frame-ancestors` — Clickjacking possible
- No `object-src 'none'` — Plugin content allowed
- No nonce/hash-based script allowance — Stripe.js cannot load securely

**Production Risk:** CSP provides near-zero protection in current state.

---

## 2. Requirements Traceability

| Req ID | Source | Requirement | Priority |
|--------|--------|-------------|----------|
| NFR-SEC-01 | NFR.md | CSP must not use unsafe-inline/eval | P0 |
| NFR-SEC-02 | NFR.md | All external resources restricted to known origins | P0 |
| REQ-066 | FEAT-067 | CSP production-hardened | P0 |
| GAP-002 | Audit | CSP too permissive | P0 |

---

## 3. Functional Specification

### 3.1 User Stories

- As a **security engineer**, I want **CSP to block inline scripts**, so that **XSS payloads cannot execute**
- As a **developer**, I want **nonce-based script loading**, so that **Stripe.js and Next.js scripts work without unsafe-inline**
- As a **compliance officer**, I want **CSP to restrict images to S3/Stripe**, so that **data exfiltration via img-src is prevented**

### 3.2 Acceptance Criteria

| AC ID | Scenario | Given | When | Then |
|-------|----------|-------|------|------|
| AC-001 | No unsafe-inline/eval | Production build | Page loads | CSP header contains no `unsafe-inline` or `unsafe-eval` in script-src |
| AC-002 | Stripe.js loads | CSP with nonce | Checkout page loads | `js.stripe.com` script executes with valid nonce |
| AC-003 | Next.js scripts load | CSP with nonce | Any page loads | Next.js runtime scripts execute with valid nonce |
| AC-004 | Images restricted | CSP deployed | Image from unknown HTTPS | Image blocked by CSP |
| AC-005 | Images allowed | CSP deployed | Image from S3/Stripe | Image loads |
| AC-006 | Frame ancestors denied | CSP deployed | Page in iframe | Browser blocks framing |
| AC-007 | Nonce rotation | Each request | Middleware runs | Unique nonce generated per response |

### 3.3 Business Rules

1. **Nonce per response** — Each HTML response gets unique nonce
2. **Nonce in script tags** — All `<script>` tags include `nonce={nonce}`
3. **Stripe allowed via nonce** — `js.stripe.com` script gets nonce
4. **Images: S3 + Stripe only** — `img-src` restricted to bucket + `js.stripe.com`
5. **No inline styles** — Move to CSS files or use nonce (Next.js handles)

---

## 4. Technical Specification

### 4.1 CSP Header Construction

```typescript
// middleware.ts - New implementation
function generateCSP(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "img-src 'self' data: https://pinenova-assets.s3.amazonaws.com https://js.stripe.com",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "connect-src 'self' https://api.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
```

### 4.2 Nonce Generation

```typescript
// middleware.ts
import { randomBytes } from "crypto";

function generateNonce(): string {
  return randomBytes(16).toString("base64");
}
```

### 4.3 Files to Modify

| File | Change |
|------|--------|
| `middleware.ts` | Replace CSP array with nonce-based generator; add nonce to response headers; pass nonce via `x-csp-nonce` header for client access |
| `app/layout.tsx` | Read nonce from header; pass to `<script nonce={nonce}>` via context or global |
| `components/PaymentForm.tsx` | Ensure Stripe `<Elements>` script gets nonce (Next.js auto-handles if nonce in layout) |
| `next.config.js` | Remove `dangerouslyAllowSVG: true`; remove inline CSP config |
| `lib/stripe.ts` | No change (server-only) |

### 4.4 Next.js Integration

Next.js 14 App Router supports nonce via:
1. Middleware generates nonce → sets `x-csp-nonce` header on response
2. `app/layout.tsx` reads header via `headers()` (Server Component) or context
3. `<Script nonce={nonce}>` for any inline scripts
4. Next.js automatically nonces its own scripts when nonce present

### 4.5 Security Considerations

- [x] No `unsafe-eval` — Next.js 14 doesn't require it in production
- [x] No `unsafe-inline` — Nonce replaces it
- [x] `img-src` restricted to S3 bucket + Stripe
- [x] `frame-ancestors 'none'` — Prevents clickjacking
- [x] `object-src 'none'` — No plugins
- [x] Nonce 128-bit entropy (16 bytes base64)
- [x] Nonce unique per response

---

## 5. UI/UX Specification

### 5.1 Component States

| State | Behavior |
|-------|----------|
| CSP violation | Browser blocks; no UI change needed |
| Stripe loads | Normal (nonce allows) |
| Images from S3 | Normal |
| Images from unknown | Broken image (CSP blocks) |

### 5.2 Accessibility

- No CSP-related accessibility impact

---

## 6. Testing Strategy

### 6.1 Unit Tests

| Function | Cases |
|----------|-------|
| `generateCSP(nonce)` | Contains nonce, no unsafe-*, correct domains |
| `generateNonce()` | 24-char base64, unique per call |

### 6.2 Integration Tests

| Flow | Test File |
|------|-----------|
| Middleware adds CSP header | `tests/unit/middleware.test.ts` |
| CSP header has nonce | `tests/unit/middleware.test.ts` |
| Nonce unique per request | `tests/unit/middleware.test.ts` |

### 6.3 E2E Tests

| User Journey | Test File |
|--------------|-----------|
| Homepage loads, CSP valid | `tests/e2e/csp.spec.ts` |
| Checkout loads, Stripe works | `tests/e2e/csp-checkout.spec.ts` |
| Image from S3 loads | `tests/e2e/csp-images.spec.ts` |
| Image from unknown blocked | `tests/e2e/csp-images.spec.ts` |

### 6.4 Manual Verification

- [ ] Chrome DevTools → Network → Response Headers → CSP present
- [ ] Console → No CSP violations on all pages
- [ ] Checkout → Stripe Elements renders
- [ ] Product images load from S3

---

## 7. Documentation Updates

| Doc | Update |
|-----|--------|
| `docs/architecture.md` | Document CSP nonce strategy |
| `docs/18-security.md` | CSP configuration section |
| `README.md` | Security headers summary |

---

## 8. Rollout Plan

- [ ] Feature flag: `FLAG_csp_nonce=true`
- [ ] Staging deployment
- [ ] Run CSP report-only mode first: `Content-Security-Policy-Report-Only`
- [ ] Monitor violations for 48h
- [ ] Switch to enforce mode
- [ ] Production deployment
- [ ] Monitor: CSP violation reports (if endpoint configured)

---

## 9. Open Questions

1. **Report-Only period:** How long? → 48 hours minimum
2. **Violation reporting endpoint:** Need `/api/security/csp-report`? → Yes, implement in Sprint 2
3. **FontAwesome/Google Fonts:** Currently `fonts.googleapis.com` + `fonts.gstatic.com` allowed — keep?
4. **Inline styles from Tailwind:** Next.js 14 handles via nonce automatically — verify

---

## 10. Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-07-12 | 0.1.0 | Initial draft |