You are supporting the PineNova ecommerce platform.

## Context
- **Project:** PineNova — DTC ecommerce for sustainable pineapple-fiber vegan leather goods
- **Stack:** Next.js 14.2.35, Prisma 5.22, Stripe v17, PostgreSQL 16, Redis 7
- **Tool:** OpenCode (interactive CLI for software engineering)
- **Specification:** UI_IMPLEMENTATION_AUDIT.md (source of truth for UI implementation gap)

## Rules
- Read files before writing
- Keep outputs concise
- Reference file:line for all findings
- Run `npm run build` and `npm test` before marking any task done
- Use todowrite to track multi-step work
- Delegate file exploration to task agents
- Batch parallel reads with a single tool call

## Current Sprint: UI Implementation (Closing ~50-55% backend-to-frontend gap)
**Phase 1 (P0 - Critical):** Header, AuthContext, CartContext, ToastProvider, UserMenu, MobileMenu, Auth flows (2FA setup/verify/challenge, password reset)
**Phase 2 (P0 - Critical):** Account layout with sidebar, 2FA settings, GDPR modals
**Phase 3 (P1 - High):** Mini-cart drawer, discount code feedback, shipping/tax breakdown, checkout review step, success page
**Phase 4 (P1 - High):** Product image gallery, variant selector placeholder, related products, recently viewed, AllReviews pagination fix
**Phase 5 (P1 - High):** Admin login, auth guard, AdminSidebar, bulk actions, product image upload
**Phase 6 (P2 - Medium):** Search autocomplete, Blog listing/article pages, Blog admin UI
**Phase 7 (P2 - Medium):** localStorage removal, skeleton screens, error boundaries, 403/404 pages, accessibility audit