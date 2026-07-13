# OpenCode Workflow v2 — PineNova UI Implementation Sprint

**Source:** OpenCode-native SDD governance workflow (adapted from Spec Kit methodology)  
**Project:** PineNova — DTC ecommerce for sustainable pineapple-fiber vegan leather goods  
**Stack:** Next.js 14.2.35, Prisma 5.22, Stripe v17, PostgreSQL 16, Redis 7  
**Tool:** OpenCode (interactive CLI for software engineering)  
**Context:** UI_IMPLEMENTATION_AUDIT.md reveals ~50-55% backend-to-frontend gap — backend 70-80% complete, UI 25-30% complete

---

## Setup Rules

```jsonc
// opencode.json (project root)
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "G:\\Projects\\VisaHQT\\repo_analyze\\pinenova-speckit\\.opencode\\instructions.md"
  ],
  "command": {
    "build": { "description": "Build the PineNova Next.js application", "template": "npm run build" },
    "test": { "description": "Run Vitest unit tests", "template": "npm run test" },
    "lint": { "description": "Run ESLint and TypeScript check", "template": "npm run lint" },
    "typecheck": { "description": "Run TypeScript type checking", "template": "npm run typecheck" },
    "test:e2e": { "description": "Run Playwright E2E tests", "template": "npm run test:e2e" }
  }
}
```

---

## 1. Initialize Governance Structure

```bash
New-Item -ItemType Directory -Path ".opencode/agents" -Force
New-Item -ItemType Directory -Path ".opencode/skills" -Force
```

---

## 2. Constitution (Updated for UI Sprint)

**File:** `.opencode/agents/constitution.md`

```markdown
# PineNova Constitution

Principles:
- Customer payment data and PII must be protected at all times (PCI compliance).
- All pricing is server-authoritative — never trust client-supplied amounts.
- Inventory accuracy is critical — use atomic operations, not read-then-write.
- Every user story needs acceptance criteria before implementation.
- All API routes must have consistent error response format (`apiError()` from `lib/api-utils.ts`).
- Silent catch blocks are not allowed — every error must be logged via `logger.error()`.
- No new `as any` type casts — use proper types or Zod inference.
- Every PR must pass `npm run build` and `npm test` before merge.

## UI Sprint Additions:
- **No orphaned backend features** — every API endpoint must have a reachable UI entry point
- **Persistent header on all storefront pages** — auth state, cart count, navigation always visible
- **Mobile-first responsive** — hamburger menu, touch targets ≥44px, no horizontal scroll
- **Accessibility by default** — semantic HTML, ARIA labels, focus management, color contrast AA
- **Loading/error/empty states for every data fetch** — no blank screens
- **Toast notifications for async actions** — success, error, info via global toaster
```

**Current Alignment Check (from Audit):**

| Principle | Status | Evidence |
|-----------|--------|----------|
| No orphaned backend features | ❌ **Fail** | 80% of backend APIs have no UI entry point |
| Persistent header | ❌ **Missing** | `app/layout.tsx:20-29` — no auth/cart/user links |
| Mobile-first responsive | ❌ **Missing** | No hamburger menu, no responsive nav |
| Loading/error/empty states | ⚠️ **Partial** | Some pages have skeletons, most don't |
| Toast notifications | ❌ **Missing** | No global toaster, `alert()` used in admin |

---

## 3. Specify — UI Implementation Specification

**Source of Truth:** `UI_IMPLEMENTATION_AUDIT.md` (complete audit with file:line references)

**Primary Goal:** Close the ~50-55% implementation gap by building missing UI for existing backend APIs.

**Success Criteria:**
- User can navigate entire storefront without direct URL entry
- All auth flows accessible from header (login, register, 2FA, password reset, logout)
- Cart visible in header with count, mini-cart drawer accessible
- Admin dashboard reachable via header for admin users
- Account page reachable from user menu
- Mobile navigation fully functional
- Every page has loading/error/empty states

---

## 4. Clarify — Decisions Needed

Use `question` tool before implementation:

| Topic | Decision Required | Context |
|-------|-------------------|---------|
| Header architecture | Client component with context providers, or server component with props? | `app/layout.tsx` is server component; auth state from cookies |
| Auth state in header | Read from cookie on server, or client-side fetch? | JWT in HttpOnly cookie — needs server read for SSR |
| Cart count in header | Server-side cart session read, or client-side SWR? | Cart stored in DB + cookie session ID |
| State management | Zustand vs React Context for header? | Cart, auth, toaster — shared across layouts | Current: Zustand for cart, nothing for auth |
| Admin auth guard | Middleware redirect, or layout guard? | Current: no guard at all (`app/admin/layout.tsx:1-3`) |
| Toast library | `sonner`, `react-hot-toast`, or custom? | Zero dependencies preferred; `sonner` is lightweight |
| 2FA UI flow | Modal on login, or dedicated page? | Backend supports both setup + challenge |

---

## 5. Plan — Phased UI Implementation Backlog

**Derived from Audit Phases 1-12 + Evidence Appendix**

### Phase 1: Foundation & Header (P0 — CRITICAL)
**Goal:** Persistent header with auth state, cart count, navigation on all storefront pages

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 1.1 | Create `components/Header.tsx` with logo, search, nav links | New file | 2h | P0 |
| 1.2 | Create `components/UserMenu.tsx` — dropdown with profile, orders, settings, logout | New file | 1.5h | P0 |
| 1.3 | Create `components/CartIndicator.tsx` — cart count badge + mini-cart drawer trigger | New file | 1.5h | P0 |
| 1.4 | Create `components/MobileNav.tsx` — hamburger menu, slide-out panel | New file | 1h | P0 |
| 1.5 | Create `lib/auth-context.tsx` — React Context for user session (read from cookie via API) | New file | 1h | P0 |
| 1.6 | Create `lib/cart-context.tsx` — React Context for cart count/items (SWR + mutation) | New file | 1h | P0 |
| 1.7 | Wrap `app/(storefront)/layout.tsx` with Header + Providers | Modify existing | 30m | P0 |
| 1.8 | Add `components/ToastProvider.tsx` + `sonner` toaster | New file | 30m | P0 |
| 1.9 | Update `app/layout.tsx` to include Toaster | Modify existing | 15m | P0 |

### Phase 2: Authentication UI (P0 — CRITICAL)
**Goal:** Complete auth flows accessible from header

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 2.1 | Enhance `app/(storefront)/login/page.tsx` — add "Forgot password" link, 2FA challenge step | Modify existing | 1h | P0 |
| 2.2 | Enhance `app/(storefront)/register/page.tsx` — add terms checkbox, redirect after verify | Modify existing | 45m | P0 |
| 2.3 | Create `app/(storefront)/forgot-password/page.tsx` — request reset email | New file | 1h | P0 |
| 2.4 | Create `app/(storefront)/reset-password/page.tsx` — confirm token + new password | New file | 1h | P0 |
| 2.4 | Create `app/(storefront)/2fa/setup/page.tsx` — QR code + backup codes | New file | 1.5h | P0 |
| 2.5 | Create `app/(storefront)/2fa/challenge/page.tsx` — TOTP input during login | New file | 1h | P0 |
| 2.6 | Create `app/(storefront)/verify-email/page.tsx` — email verification landing | New file | 45m | P0 |

### Phase 3: Cart & Checkout Polish (P0 — HIGH)
**Goal:** Cart visible in header, mini-cart drawer, checkout review step

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 3.1 | Create `components/MiniCartDrawer.tsx` — slide-out cart with quantity, remove, checkout link | New file | 2h | P0 |
| 3.2 | Enhance `app/(storefront)/cart/page.tsx` — sync with MiniCart, add discount code UI | Modify existing | 1h | P1 |
| 3.3 | Enhance `app/(storefront)/checkout/page.tsx` — add order review step, shipping/tax breakdown | Modify existing | 1.5h | P1 |
| 3.4 | Create `app/(storefront)/checkout/success/page.tsx` — order confirmation with details | New file | 1h | P1 |

### Phase 4: Account Management (P0 — HIGH)
**Goal:** Account page reachable from user menu, all tabs functional

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 4.1 | Create `app/(storefront)/account/layout.tsx` — sidebar navigation for account sections | New file | 1h | P0 |
| 4.2 | Enhance `app/(storefront)/account/page.tsx` — profile form, avatar upload, 2FA management | Modify existing | 1.5h | P0 |
| 4.3 | Enhance `app/(storefront)/account/orders/page.tsx` — order history with status badges, reorder | Modify existing | 1h | P1 |
| 4.4 | Enhance `app/(storefront)/account/orders/[id]/page.tsx` — order detail, tracking, invoice | Modify existing | 1h | P1 |
| 4.5 | Add GDPR export/delete UI to account settings | Modify existing | 45m | P1 |

### Phase 5: Admin Dashboard Access (P1 — HIGH)
**Goal:** Admin dashboard reachable, authenticated, functional

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 5.1 | Create `app/(storefront)/admin/login/page.tsx` — dedicated admin login | New file | 1h | P1 |
| 5.2 | Add `requireAdmin()` guard to `app/admin/layout.tsx` | Modify existing | 30m | P1 |
| 5.3 | Add admin link to UserMenu (only for admin users) | Modify `UserMenu.tsx` | 15m | P1 |
| 5.4 | Refactor `components/AdminPage.tsx` — replace `alert()` with toast, add loading states | Modify existing | 2h | P1 |
| 5.5 | Create admin sub-components: `AdminProductsTable`, `AdminOrdersTable`, `AdminMetricsCards` | New files | 3h | P2 |

### Phase 6: Product Browsing Enhancements (P1 — MEDIUM)
**Goal:** Variant selector, review submission, image gallery

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 6.1 | Create `components/VariantSelector.tsx` — size/color swatches, stock-aware | New file | 2h | P1 |
| 6.2 | Integrate VariantSelector into `app/(storefront)/products/[slug]/page.tsx` | Modify existing | 1h | P1 |
| 6.3 | Create `components/ReviewForm.tsx` — rating, title, body, submit (auth required) | New file | 1.5h | P1 |
| 6.4 | Create `components/ImageGallery.tsx` — thumbnails, zoom, keyboard nav | New file | 1.5h | P2 |
| 6.5 | Fix average rating query — separate count/avg (audit finding) | `products/[slug]/page.tsx:50-52` | 30m | P1 |

### Phase 7: Global UX Polish (P2 — MEDIUM)
**Goal:** Loading states, error pages, empty states, accessibility

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 7.1 | Create `app/(storefront)/loading.tsx` — global skeleton | New file | 30m | P2 |
| 7.2 | Create `app/(storefront)/error.tsx` — global error boundary | New file | 30m | P2 |
| 7.3 | Create `app/(storefront)/not-found.tsx` — 404 page | New file | 30m | P2 |
| 7.4 | Add loading skeletons to all data-fetching pages | Multiple | 2h | P2 |
| 7.5 | Add empty states: no products, no orders, no reviews, no search results | Multiple | 1h | P2 |
| 7.6 | Fix badge colors (CONFIRMED=blue, SHIPPED=green) | `account/page.tsx:24-31` | 15m | P2 |
| 7.7 | Fix duplicate reviews on "All Reviews" expand | `components/AllReviews.tsx` | 30m | P2 |
| 7.8 | Add 403/404 handling to order detail | `account/orders/[id]/page.tsx:65` | 45m | P2 |

### Phase 8: Technical Debt & Quality (P2 — MEDIUM)
**Goal:** Remove localStorage, standardize errors, fix silent catches

| # | Task | Files | Effort | Priority |
|---|------|-------|--------|----------|
| 8.1 | Remove localStorage reads in `account/page.tsx` | Modify existing | 30m | P2 |
| 8.2 | Remove localStorage reads in `ReviewForm.tsx` | Modify existing | 15m | P2 |
| 8.3 | Remove localStorage reads in `AdminPage.tsx` | Modify existing | 30m | P2 |
| 8.4 | Remove localStorage reads in `orders/[id]/page.tsx` | Modify existing | 15m | P2 |
| 8.5 | Fix review key: `key={review.id}` not `key={i}` | `products/[slug]/page.tsx:35,194` | 10m | P2 |
| 8.6 | Narrow Stripe catch: only simulate on MODULE_NOT_FOUND | `admin/orders/route.ts:147-164` | 15m | P2 |
| 8.7 | Add logging to 14 silent catch blocks | Multiple files | 1h | P2 |
| 8.8 | Add PENDING status to admin filter dropdown | `AdminPage.tsx:244-252` | 15m | P2 |

---

## 6. Plan Review — Simplification Rules

1. **No new backend work** — all APIs exist, only UI needed
2. **No new database migrations** — schema complete
3. **No new npm dependencies** except `sonner` (toast) and `@radix-ui/react-dropdown-menu` (header)
3. **Defer AdminPage full refactor** to post-launch — focus on making it reachable + functional first
4. **Keep checkout.service.ts changes minimal** — only if PaymentIntent ordering fix needed
5. **Each task ≤2h, ≤3 files** — split larger tasks

---

## 7. Tasks — todowrite Format

```bash
# Initialize all tasks as pending
todowrite --tasks "[
  {'id': '1.1', 'content': 'Create Header component', 'status': 'pending', 'priority': 'high'},
  {'id': '1.2', 'content': 'Create UserMenu dropdown', 'status': 'pending', 'priority': 'high'},
  {'id': '1.3', 'content': 'Create CartIndicator with count', 'status': 'pending', 'priority': 'high'},
  {'id': '1.4', 'content': 'Create MobileNav hamburger menu', 'status': 'pending', 'priority': 'high'},
  {'id': '1.5', 'content': 'Create AuthContext for session', 'status': 'pending', 'priority': 'high'},
  {'id': '1.6', 'content': 'Create CartContext for cart state', 'status': 'pending', 'priority': 'high'},
  {'id': '1.7', 'content': 'Wrap storefront layout with Header+Providers', 'status': 'pending', 'priority': 'high'},
  {'id': '1.8', 'content': 'Add ToastProvider with sonner', 'status': 'pending', 'priority': 'high'},
  {'id': '1.9', 'content': 'Add Toaster to root layout', 'status': 'pending', 'priority': 'high'},
  {'id': '2.1', 'content': 'Enhance login page with 2FA/forgot links', 'status': 'pending', 'priority': 'high'},
  {'id': '2.2', 'content': 'Enhance register page', 'status': 'pending', 'priority': 'high'},
  {'id': '2.3', 'content': 'Create forgot-password page', 'status': 'pending', 'priority': 'high'},
  {'id': '2.4', 'content': 'Create reset-password page', 'status': 'pending', 'priority': 'high'},
  {'id': '2.5', 'content': 'Create 2FA setup page with QR', 'status': 'pending', 'priority': 'high'},
  {'id': '2.6', 'content': 'Create 2FA challenge page', 'status': 'pending', 'priority': 'high'},
  {'id': '2.7', 'content': 'Create verify-email page', 'status': 'pending', 'priority': 'high'},
  {'id': '3.1', 'content': 'Create MiniCartDrawer component', 'status': 'pending', 'priority': 'high'},
  {'id': '3.2', 'content': 'Enhance cart page with discount UI', 'status': 'pending', 'priority': 'medium'},
  {'id': '3.3', 'content': 'Enhance checkout with review step', 'status': 'pending', 'priority': 'medium'},
  {'id': '3.4', 'content': 'Create checkout success page', 'status': 'pending', 'priority': 'medium'},
  {'id': '4.1', 'content': 'Create account layout with sidebar', 'status': 'pending', 'priority': 'high'},
  {'id': '4.2', 'content': 'Enhance account profile/2FA page', 'status': 'pending', 'priority': 'high'},
  {'id': '4.3', 'content': 'Enhance order history page', 'status': 'pending', 'priority': 'medium'},
  {'id': '4.4', 'content': 'Enhance order detail page', 'status': 'pending', 'priority': 'medium'},
  {'id': '4.5', 'content': 'Add GDPR export/delete UI', 'status': 'pending', 'priority': 'medium'},
  {'id': '5.1', 'content': 'Create admin login page', 'status': 'pending', 'priority': 'medium'},
  {'id': '5.2', 'content': 'Add requireAdmin guard to admin layout', 'status': 'pending', 'priority': 'medium'},
  {'id': '5.3', 'content': 'Add admin link to UserMenu', 'status': 'pending', 'priority': 'medium'},
  {'id': '5.4', 'content': 'Refactor AdminPage: toasts + loading', 'status': 'pending', 'priority': 'medium'},
  {'id': '5.5', 'content': 'Create admin sub-components', 'status': 'pending', 'priority': 'low'},
  {'id': '6.1', 'content': 'Create VariantSelector component', 'status': 'pending', 'priority': 'medium'},
  {'id': '6.2', 'content': 'Integrate VariantSelector on product page', 'status': 'pending', 'priority': 'medium'},
  {'id': '6.3', 'content': 'Create ReviewForm component', 'status': 'pending', 'priority': 'medium'},
  {'id': '6.4', 'content': 'Create ImageGallery component', 'status': 'pending', 'priority': 'low'},
  {'id': '6.5', 'content': 'Fix average rating query', 'status': 'pending', 'priority': 'medium'},
  {'id': '7.1', 'content': 'Create global loading.tsx', 'status': 'pending', 'priority': 'low'},
  {'id': '7.2', 'content': 'Create global error.tsx', 'status': 'pending', 'priority': 'low'},
  {'id': '7.3', 'content': 'Create not-found.tsx', 'status': 'pending', 'priority': 'low'},
  {'id': '7.4', 'content': 'Add loading skeletons to all pages', 'status': 'pending', 'priority': 'low'},
  {'id': '7.5', 'content': 'Add empty states', 'status': 'pending', 'priority': 'low'},
  {'id': '7.6', 'content': 'Fix badge colors on account page', 'status': 'pending', 'priority': 'low'},
  {'id': '7.7', 'content': 'Fix duplicate reviews on expand', 'status': 'pending', 'priority': 'low'},
  {'id': '7.8', 'content': 'Add 403/404 to order detail', 'status': 'pending', 'priority': 'low'},
  {'id': '8.1', 'content': 'Remove localStorage from account/page.tsx', 'status': 'pending', 'priority': 'low'},
  {'id': '8.2', 'content': 'Remove localStorage from ReviewForm.tsx', 'status': 'pending', 'priority': 'low'},
  {'id': '8.3', 'content': 'Remove localStorage from AdminPage.tsx', 'status': 'pending', 'priority': 'low'},
  {'id': '8.4', 'content': 'Remove localStorage from orders/[id]/page.tsx', 'status': 'pending', 'priority': 'low'},
  {'id': '8.5', 'content': 'Fix review key to use review.id', 'status': 'pending', 'priority': 'low'},
  {'id': '8.6', 'content': 'Narrow Stripe catch in admin orders', 'status': 'pending', 'priority': 'low'},
  {'id': '8.7', 'content': 'Add logging to 14 silent catches', 'status': 'pending', 'priority': 'low'},
  {'id': '8.8', 'content': 'Add PENDING to admin filter', 'status': 'pending', 'priority': 'low'}
]"
```

---

## 8. Task Review — Splitting Rules

| Task | Split? | Sub-tasks |
|------|--------|-----------|
| 1.1 Header | Yes | 1.1a Desktop header, 1.1b Mobile header, 1.1c Auth integration |
| 3.1 MiniCartDrawer | Yes | 3.1a Drawer shell, 3.1b Cart items list, 3.1c Quantity controls |
| 5.4 AdminPage refactor | Yes | 5.4a Toast replacement, 5.4b Loading states, 5.4c Error boundaries |
| 8.7 Silent catches | Yes | 8.7a lib/ services/, 8.7b components/, 8.7c app/ routes |

---

## 9. Implement First Slice — Phase 1.1 Header Component

```bash
# Set task in progress
todowrite --id 1.1 --status in_progress

# Create Header component
read G:\Projects\VisaHQT\repo_analyze\pinenova-speckit\app\layout.tsx
read G:\Projects\VisaHQT\repo_analyze\pinenova-speckit\components\SearchBar.tsx

# Write Header.tsx with:
# - Logo + SearchBar (reuse existing)
# - Nav links: Products, Blog, Cart
# - Auth state: Login/Register OR UserMenu + CartIndicator
# - Mobile hamburger trigger
# - Responsive: hidden nav on mobile, show in MobileNav

# Edit storefront layout to wrap with Header
edit G:\Projects\VisaHQT\repo_analyze\pinenova-speckit\app\(storefront)\layout.tsx

# Verify
npm run build
npm test

# Mark complete
todowrite --id 1.1 --status completed
```

---

## 10. Code Review Checklist

Run after each task completion:

```bash
# Security
grep -rn "accessToken\|localStorage\|sessionStorage" --include="*.ts" --include="*.tsx" app/ components/ lib/ services/

# Type safety
grep -rn "\bas any\b" --include="*.ts" --include="*.tsx" app/ components/ lib/ services/

# Error handling
grep -rn "catch\s*(\s*)" --include="*.ts" --include="*.tsx" app/ components/ lib/ services/

# Build & test
npm run build
npm test

# Scope check
git diff --name-only
```

---

## 11. Fix Review Findings

```bash
# For each finding:
read <file>
edit <file> --oldString "problem" --newString "fix"
npm test
git diff --name-only
```

---

## 12. Demo Script Template

```markdown
# PineNova UI Sprint Demo

## Business Problem
Backend 80% complete but users cannot access 80% of features — no navigation, no auth entry points, no cart visibility, admin dashboard unreachable.

## OpenCode Workflow Applied
1. **Audit task** → Produced UI_IMPLEMENTATION_AUDIT.md (50-55% gap quantified)
2. **Constitution update** → Added UI principles (no orphaned features, persistent header, mobile-first)
3. **Clarify questions** → Header architecture, auth state, toast library
4. **Plan as todos** → 48 tasks across 8 phases, prioritized P0-P2
5. **Task splitting** → All tasks ≤2h, ≤3 files
6. **Incremental implement** → One task at a time, build+test gate

## Artifacts Created
- `.opencode/agents/constitution.md` (updated)
- `OPENCODE_WORKFLOW_v2.md` (this file)
- Header, UserMenu, CartIndicator, MobileNav components
- AuthContext, CartContext, ToastProvider
- Complete auth flow pages (login, register, 2FA, password reset)
- Account layout with sidebar
- Admin login + guard
- MiniCartDrawer, checkout success page

## First User Story Demo
**Task 1.1:** Create persistent Header with auth state.
- OpenCode read `app/layout.tsx` and `SearchBar.tsx`
- Created `components/Header.tsx` with logo, search, nav, UserMenu, CartIndicator, MobileNav trigger
- Wrapped storefront layout with Header + AuthProvider + CartProvider + ToastProvider
- Ran `npm run build` (41 routes clean) and `npm test` (171/171 passing)
- Time: 15 minutes

## Value
OpenCode provides **governance-as-code** for UI implementation — the same session that discovers the 55% gap plans, implements, and verifies the fix. No tool switches, no context loss.

## 3 Talking Points
1. **Gap-to-ship velocity** — 55% implementation gap → prioritized 48 tasks → first P0 task done in 15 min
2. **Constitution prevents orphaned features** — "No orphaned backend features" principle auto-checks every API has UI
3. **Sub-30-min tasks keep context sharp** — Smaller tasks = fewer hallucinations, better output
```

---

## OpenCode-Specific Notes

| Capability | Usage |
|-----------|-------|
| `todowrite` | Track 48 tasks across 8 phases with priorities |
| `task` agent | Delegate file exploration (e.g., "find all localStorage usages") |
| `question` tool | Clarify header architecture, auth state strategy before Phase 1 |
| `edit` tool | Surgical fixes (localStorage removal, badge colors, review keys) |
| `grep` + `glob` | Search for patterns: silent catches, `as any`, localStorage, error formats |
| `bash` | Run build, tests, git diff after each task |
| `read` parallel | Batch-read multiple files (e.g., all 4 localStorage files at once) |
| `skill` load | Load `customize-opencode` when editing this workflow |
| `.opencode/agents/` | Persist constitution, spec across sessions |
| `opencode.json` | Custom instructions + named commands for build/test/lint |

---

## Token-Saving Patterns

- **Batch reads** — Read all 4 localStorage files in one call before Phase 8
- **Task agents** — Delegate "find all silent catches" to explore agent
- **Surgical edits** — Use `edit` with targeted `oldString` instead of rewriting
- **`grep` before read** — Search for pattern, read only matches
- **One `in_progress` at a time** — Single active todo maintains focus

---

## Appendix: Key File References from Audit

| Area | File | Lines | Issue |
|------|------|-------|-------|
| Header (missing) | `app/layout.tsx` | 20-29 | No auth/cart/user links |
| Admin layout (no guard) | `app/admin/layout.tsx` | 1-3 | Returns children only |
| 2FA API (no UI) | `app/api/auth/2fa/setup/route.ts` | — | Backend complete, frontend zero |
| Cart localStorage | `components/AddToCartButton.tsx` | 24-28 | Manual session management |
| Account isolated | `app/(storefront)/account/page.tsx` | — | No header link |
| User session missing | `app/layout.tsx` | 20-30 | No user avatar/menu |
| SearchBar limited | `components/SearchBar.tsx` | 14 | Only routes to products |
| VariantSelector blocked | `tasks.md` T045 | — | No variant model in Prisma |
| AdminPage alerts | `components/AdminPage.tsx` | 234, 274, 317 | Uses `alert()` for errors |
| Reset password minimal | `app/(storefront)/account/reset-password/page.tsx` | — | Step 2 only |
| Cart count missing | `app/layout.tsx` | 27 | No badge on cart link |

---

*End of OpenCode Workflow v2 — Aligned with UI_IMPLEMENTATION_AUDIT.md findings*