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

## UI Implementation Specification (Source of Truth: UI_IMPLEMENTATION_AUDIT.md):

**Primary Goal:** Close the ~50-55% implementation gap by building missing UI for existing backend APIs.

**Success Criteria:**
1. User can navigate entire storefront without direct URL entry
2. All auth flows accessible from header (login, register, 2FA, password reset, logout)
3. Cart visible in header with count, mini-cart drawer accessible
4. Admin dashboard reachable via header for admin users
5. Account page reachable from user menu
6. Mobile navigation fully functional
7. Every page has loading/error/empty states