# Business Requirements Document — PineNova Ecommerce Platform

| Document Owner | Engineering & Product Team |
|---|---|
| Version | 1.0 |
| Status | Draft — Phase 0 |
| Last Updated | 2026-07-10 |

---

## 1. Executive Summary

PineNova is a direct-to-consumer ecommerce platform that sells premium accessories — bags, wallets, belts, and footwear — crafted from pineapple-fiber vegan leather. The platform targets environmentally conscious consumers in the United States.

As of Phase 0, the project scaffold is complete: Prisma schema (13 models), shared Zod types, repository layer, authentication/email/S3/Stripe/logger/rate-limiter/audit libraries, middleware (route protection + security headers), and design system (Tailwind + globals.css) are in place. The build-out is organized into nine delivery phases that progressively produce a production-grade platform spanning product catalogue management, account-based checkout (guest checkout disabled), Stripe payment processing, inventory tracking, an admin dashboard, content marketing, CI/CD, and a full testing suite.

All deterministic decisions (brand, product catalogue, pricing, technology stack, design tokens) are fixed in `docs/00-assumptions.md`, which serves as the single source of truth for every subsequent phase.

---

## 2. Business Objectives

| # | Objective | Strategic Rationale |
|---|---|---|
| BO1 | Launch a fully functional ecommerce platform in the US market | Establish PineNova as a recognizable sustainable accessories brand |
| BO2 | Deliver all nine phases on schedule and within scope | Maintain investor confidence and predictable go-to-market timing |
| BO3 | Enable a seamless, secure account-based purchase experience | Maximize conversion while maintaining order traceability |
| BO4 | Drive organic traffic through SEO and content marketing | Reduce customer acquisition cost vs. paid advertising |
| BO5 | Provide administrative tooling for catalogue, inventory, and order management | Empower the operations team without engineering dependency |
| BO6 | Ensure platform security, accessibility, and performance from day one | Meet WCAG 2.1 AA, <2s LCP, and zero-critical-vulnerability targets |

---

## 3. Stakeholders

| Stakeholder | Role / Interest | Key Concern |
|---|---|---|
| **Founder / Business Owner** | Brand vision, revenue targets, go-to-market | Platform launch timeline, brand consistency |
| **Engineering Team** | Build, test, deploy, maintain | Clear requirements, stable assumptions, minimal rework |
| **Customers (US-based)** | Browse, purchase, review products | Intuitive UX, secure payments, reliable delivery |
| **Admin / Operations Team** | Product catalogue, order fulfillment, customer support | Efficient dashboard, inventory accuracy |
| **Investors** | Milestone tracking, unit economics | Predictable delivery, cost control |
| **Stripe (Payment Partner)** | Payment processing, fraud detection | Webhook reliability, PCI compliance |
| **Vercel, Render, Railway, AWS S3** | Infrastructure providers | Deployment automation, uptime SLAs |

---

## 4. Current State

- **Phase 0 complete** — scaffold exists with folder structure, Prisma schema, shared types, repository layer, core libraries, middleware, and Tailwind design system.
- **Application code base** — auth/email/S3/Stripe/logger/rate-limiter/audit libs, repository files (product, user, cart, order, review, blog), and shared Zod validation are implemented.
- **No product data** — catalogue is defined in prose in `docs/00-assumptions.md` only; seed script not yet created.
- **No infrastructure** — no deployed environments, CI/CD pipeline, or database.
- **No brand assets** — logo, imagery, and static files are absent from `/public`.
- **No customer base or historical data** — greenfield project.

---

## 5. Future State

After all nine phases, PineNova will be a production-deployed platform delivering:

- A responsive Next.js 14 (App Router) storefront with Tailwind CSS and the defined design system (USD + INR currency toggle).
- A PostgreSQL database (Railway) housing products, users, orders, reviews, and inventory.
- Product catalogue of 12 items across 4 categories (Bags, Wallets, Belts, Footwear).
- JWT-based authentication (access + refresh tokens) with CUSTOMER and ADMIN roles.
- Confirm-password validation enforced server-side via Zod schemas.
- Customer self-cancellation enabled for unshipped orders.
- Stripe Checkout Session payment flow with webhook-based order confirmation.
- Flat-rate shipping ($8, free above $120) and 10% tax.
- Full admin dashboard for product CRUD, inventory, and order management.
- Transactional emails (order confirmation, welcome, password reset, shipping notification).
- SEO-optimized pages and 5 content-marketing blog articles.
- WCAG 2.1 AA accessibility, security headers via Next.js middleware, rate-limited endpoints (auth-specific 5/15min per email, general 100/300 per IP).
- CI/CD pipeline (Docker, Vercel/Render/Railway deployment scripts).
- Vitest (unit/integration) and Playwright (e2e) test suites.
- Shared Zod schemas for client + server validation.
- Currency support: USD and INR (Rupees).

---

## 6. Functional Scope

### In Scope

| Area | Capabilities |
|---|---|
| **Product Catalogue** | 12 products across 4 categories; product detail pages; category listing; search/filter/sort |
| **User Accounts** | Registration, login, JWT auth (access + refresh tokens), password hashing (bcrypt), roles (CUSTOMER, ADMIN) |
| **Shopping Cart** | Add/remove items, quantity updates, persisted per user |
| **Checkout** | Account required; Stripe Checkout Session; 10% tax calculation; $8 flat shipping; free shipping ≥ $120 |
| **Order Management** | Order creation on webhook confirmation; order history for customers; full CRUD for admins |
| **Inventory Tracking** | Real-time stock deduction on confirmed orders; low-stock alerts |
| **Product Reviews** | Authenticated customers can submit and edit reviews; admin moderation |
| **Admin Dashboard** | Product manager, inventory manager, order manager, user manager |
| **Content Marketing** | 5 SEO-optimized blog articles; blog listing page |
| **SEO** | Semantic HTML, meta tags, Open Graph, structured data, sitemap, robots.txt |
| **Performance** | <2s LCP, image optimization, caching strategy |
| **Security** | Security headers (CSP, HSTS, X-Frame-Options) via middleware, rate limiting (auth-specific 5/15min per email, general 100/300 per IP), bcrypt, strict TypeScript, input validation (Zod) |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Transactional Emails** | Order confirmation, shipping notification |
| **CI/CD** | Dockerfile, Docker Compose, GitHub Actions (or equivalent) |
| **Testing** | Vitest for unit/integration; Playwright for e2e |
| **Multi-Currency (USD & INR)** | Display in USD (default) and INR; checkout always in USD |
| **International Shipping** | US default; select international markets with configurable rates |
| **Social Login** | OAuth-based login via third-party providers (Google, Apple, etc.) |
| **Custom Payment Methods** | Extensible payment gateway abstraction for future providers beyond Stripe |
| **Deployment** | Vercel (frontend), Render (backend processes), Railway (PostgreSQL), AWS S3 (assets) |

### Out of Scope

- Guest checkout (explicitly prohibited by business rule)
- Mobile native applications (responsive web only)
- Third-party marketplace integration (Amazon, eBay, Etsy)
- Subscription or recurring billing models
- Loyalty programs, gift cards, or store credit
- Multi-language or i18n support (English only)
- Additional currencies beyond USD and INR
- Real-time inventory sync with external ERP/WMS
- PWA or offline mode

---

## 7. Business Rules

| ID | Rule | Rationale |
|---|---|---|---|
| BR01 | Prices are in USD (default) and INR; range $49–$289 / ₹4,084–₹24,116 | Premium sustainable brand positioning + Indian market support |
| BR02 | Tax is 10% of subtotal | Fixed rate applied to all orders |
| BR03 | Shipping is flat $8; free for orders ≥ $120 | Standardized fulfillment cost model |
| BR04 | Guest checkout is disabled; account creation is mandatory | Order traceability, customer communication, repeat purchase enablement |
| BR05 | Inventory tracking is enabled; stock deducted on confirmed payment | Prevent overselling |
| BR06 | Product reviews are enabled for authenticated customers | Social proof for conversion |
| BR07 | Primary keys are UUIDs | Distributed-friendly, no sequential enumeration |
| BR08 | Roles are CUSTOMER and ADMIN only | Simple, least-privilege model |
| BR09 | JWT access tokens + refresh tokens for auth | Stateless sessions, secure rotation |
| BR10 | Only Stripe Checkout Session API is used; webhook confirms orders | PCI scope reduction, reliable payment confirmation |
| BR11 | The product catalogue (12 items, 4 categories, names) is immutable per the assumptions doc | Single source of truth; no deviation between phases |
| BR12 | Stripe webhook is the sole mechanism for order confirmation | Prevent double-charge / order mismatch |
| BR13 | Express is only permitted for long-running webhook retries | Architectural consistency; exception pre-approved in assumptions |
| BR14 | Customers may cancel their own unshipped orders | Self-service reduces support tickets |
| BR15 | Confirm-password validation enforced server-side via Zod | Prevents client bypass of password match check |
| BR16 | Product names are globally unique | Prevents confusion in search and admin listings |
| BR17 | Reviews require a valid purchase (verified via orderId) | Prevents fake reviews from non-customers |
| BR18 | Partial refunds do not automatically restore stock; admin adjusts manually via inventory management | Prevents overselling when specific returned items are unknown |
| BR19 | Rate limiting: 5 failed login attempts per email per 15 minutes for auth endpoints; 100 req/min unauthenticated, 300/min authenticated for general endpoints | Prevents brute-force without impacting legitimate users |
| BR20 | Cart items expire after 30 days of inactivity | Prevents stale cart data accumulation |
| BR21 | Stock validated before Stripe session creation (not only at webhook) | Reduces payment-then-failure scenarios |
| BR22 | Search covers product name, description, and material tag | Maximizes discoverability for goal-oriented shoppers |

---

## 8. Constraints

| ID | Constraint | Impact |
|---|---|---|---|
| C01 | Assumptions doc (`docs/00-assumptions.md`) is fixed and cannot change between phases | Zero flexibility during implementation; any business change requires a formal doc revision and re-alignment of all phases |
| C02 | No `any` types — strict TypeScript enforced | Increased type-safety; slower initial dev velocity |
| C03 | Repository pattern required for data access; no direct Prisma in route handlers | Consistent data layer; additional abstraction boilerplate |
| C04 | No pseudocode, TODO comments, or "implement later" stubs | Every generated file must be complete |
| C05 | Guest checkout is permanently disabled | May reduce conversion rate vs. industry averages |
| C06 | English-only; USD and INR currencies supported; US shipping default with select international markets | Additional currencies/languages require future investment |
| C07 | Fixed design tokens (colors, spacing, typography, radius) | No visual experimentation during build; brand consistency enforced |
| C08 | Express permitted only for Stripe webhook retry logic (one exception) | Avoids framework sprawl but creates one architectural outlier |
| C09 | Security headers (Helmet-equivalent) applied via Next.js middleware.ts, not Express middleware | Next.js Route Handlers do not support Express middleware natively |
| C10 | JWT_SECRET and STRIPE_SECRET_KEY throw at module load if missing — no silent fallback | Prevents production deployment with insecure defaults |

---

## 9. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Assumptions doc becomes outdated vs. real business needs | Medium | High — rework across all phases | Schedule formal assumptions review before each phase kickoff |
| R2 | Stripe webhook delivery failure causes lost or duplicated orders | Medium | High — revenue loss, customer trust | Idempotency keys, retry logic, admin reconciliation dashboard |
| R3 | No guest checkout depresses conversion rate | Medium | Medium — reduced revenue | Monitor analytics post-launch; prioritize guest checkout as post-MVP enhancement |
| R4 | Single-region PostgreSQL (Railway) with no built-in failover | Low | High — data loss during outage | Automated daily backups; documented RTO/RPO |
| R5 | Inventory tracking enabled but no external ERP sync | Medium | Medium — overselling risk with manual entry errors | Admin low-stock alerts; seeded initial quantities |
| R6 | Express-for-webhooks exception creates future architectural inconsistency | Low | Low — manageable | Confine to one file; add inline architectural decision record |
| R7 | No mobile apps limits reach | Medium | Medium — missed mobile-native segment | Invest in responsive polish; evaluate PWA as lighter alternative |
| R8 | Key-person dependency during 9-phase delivery | Medium | Medium — schedule slip | Cross-train; document all decisions explicitly in phases |

---

## 10. KPIs

| KPI | Target | Measurement Method |
|---|---|---|
| **Platform Launch** | All 9 phases delivered to production | Phase-completion checklist |
| **Page Load Performance** | LCP < 2s | Lighthouse CI in CI pipeline |
| **Checkout Conversion Rate** | ≥ 2% of cart-adds to completed purchase | Analytics / database funnel |
| **Order Accuracy** | 100% — every paid Stripe session matches a confirmed order | Stripe reconciliation query |
| **Admin Dashboard Uptime** | > 99.5% | Uptime monitoring |
| **SEO Rankings** | Top-10 Google for 3+ target keywords within 6 months of content launch | Rank tracker tool |
| **Test Coverage** | ≥ 80% unit/integration; all critical e2e paths green | Vitest + Playwright reports |
| **Security Posture** | Zero critical vulnerabilities | npm audit + dependency scan |
| **Accessibility** | WCAG 2.1 AA across all customer-facing pages | axe-core / Lighthouse a11y audit |

---

## 11. Dependencies

| # | Dependency | Type | Owned By |
|---|---|---|---|
| D1 | Stripe account (production + test mode keys) | External partner | Business Owner |
| D2 | Vercel account with custom domain | Infrastructure | Engineering |
| D3 | Render account for backend services | Infrastructure | Engineering |
| D4 | Railway account for PostgreSQL | Infrastructure | Engineering |
| F5 | AWS S3-compatible bucket for static assets | Infrastructure | Engineering |
| D6 | Domain registration + DNS configuration | External | Business Owner |
| D7 | Brand assets (logo, product photography, hero images) | Creative | Business Owner / Design |
| D8 | Stripe webhook endpoint registration (post-deployment) | External | Engineering |
| D9 | Email service provider (SendGrid / SES / etc.) for transactional emails | External partner | Engineering |
| D10 | Content marketing copy (5 SEO blog articles) | Content | Business Owner / Marketing |

---

## 12. Success Criteria

All of the following must be true for the project to be considered successful:

| # | Criterion | Verification |
|---|---|---|
| S1 | The platform is deployed to production on Vercel, Render, and Railway | URL accessible; admin can log in |
| S2 | All 12 products are visible, purchasable, and correctly priced ($49–$289) | End-to-end purchase test |
| S3 | A new user can register, add items to cart, and complete checkout via Stripe | Playwright e2e flow passes |
| S4 | The Stripe webhook creates a confirmed order in the database | Webhook simulator test + DB query |
| S5 | Tax (10%) and shipping ($8, free ≥ $120) are calculated correctly at checkout | Automated calculation tests |
| S6 | Admin dashboard allows product, inventory, and order management | Manual QA of each CRUD action |
| S7 | LCP is under 2 seconds on a production-grade connection | Lighthouse CI in CI pipeline |
| S8 | All customer-facing pages pass WCAG 2.1 AA audit | axe-core scan (0 violations) |
| S9 | Unit/integration test coverage ≥ 80%; critical e2e flows pass | CI pipeline gates on thresholds |
| S10 | Zero critical or high-severity security vulnerabilities | npm audit and dependency scan pass |
| S11 | A sitemap, robots.txt, Open Graph tags, and structured data are present | SEO audit checklist |
| S12 | 5 blog articles are published on the platform | Content listing page verified |
