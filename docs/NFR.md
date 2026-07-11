# Non-Functional Requirements — PineNova Ecommerce Platform

| Document Owner | Engineering & Product Team |
|---|---|
| Version | 1.0 |
| Status | Draft — Phase 0 |
| Base Documents | BRD.md v1.0, FRD.md v1.0, docs/00-assumptions.md |

---

## 1. Performance

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-PERF-01 | Page load time for customer-facing pages shall be under 2 seconds (LCP) on a production-grade connection | Lighthouse CI score ≥ 90 for LCP; validated in CI pipeline |
| NFR-PERF-02 | Time to First Byte (TTFB) for API responses shall be under 300ms for 95% of requests | APM monitoring; p95 TTFB < 300ms |
| NFR-PERF-03 | Product listing pages (category, search results) shall render within 1.5 seconds for catalogues of up to 12 products | Lighthouse CI; paginated load test |
| NFR-PERF-04 | Image loading shall use Next.js `<Image>` component with lazy loading, WebP format, and responsive srcsets | No CLS impact; Lighthouse image audit passes |
| NFR-PERF-05 | Static assets (CSS, JS, fonts) shall be cached with a CDN cache duration of ≥ 30 days with content-based cache busting | Vercel CDN config; cache headers verified |
| NFR-PERF-06 | Stripe Checkout Session creation shall complete in under 2 seconds from user click to redirect | Server-side timing logs; p95 < 2s |
| NFR-PERF-07 | Database queries on the orders and products tables shall execute in under 100ms for 99% of queries | Prisma query logging; p99 < 100ms |
| NFR-PERF-08 | Client-side JavaScript bundle shall be under 200 KB (gzipped) for initial page load | Bundle analyzer CI check fails if exceeded |
| NFR-PERF-09 | API rate limiter shall allow at least 100 requests per minute per IP for unauthenticated endpoints and 300/min for authenticated | Configuration verified; load tested |
| NFR-PERF-10 | Admin dashboard pages shall load in under 3 seconds | Lighthouse CI ≥ 75 perf score on admin routes |

---

## 2. Availability

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-AVAIL-01 | Customer-facing storefront shall achieve 99.9% uptime during peak shopping hours (8 AM – 11 PM ET) | Uptime monitor (Vercel status); monthly SLA report |
| NFR-AVAIL-02 | Admin dashboard shall achieve 99.5% uptime | Uptime monitor (Render); monthly SLA report |
| NFR-AVAIL-03 | Planned maintenance shall be communicated 72 hours in advance and scheduled outside peak hours (midnight–5 AM ET) | Maintenance window policy documented |
| NFR-AVAIL-04 | Database (Railway PostgreSQL) shall have automated failover with RTO < 15 minutes | Disaster recovery drill; documented runbook |
| NFR-AVAIL-05 | The platform shall gracefully display a branded maintenance page during downtime instead of a generic error | Maintenance page deployed and tested |

---

## 3. Reliability

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-RELY-01 | Stripe webhook processing shall have idempotency guarantees — duplicate events shall not create duplicate orders | Integration test with duplicate webhook events; no duplicate rows |
| NFR-RELY-02 | Inventory deduction shall be atomic — an order confirmation must decrement stock in the same database transaction | Prisma transaction test; concurrent order test |
| NFR-RELY-03 | Failed Stripe webhook deliveries shall be retried at least 3 times with exponential backoff | Express webhook handler logs; retry count verified |
| NFR-RELY-04 | Email delivery failures shall not block the order confirmation flow — the order is created regardless; email is queued for retry | Integration test; email failure does not prevent order creation |
| NFR-RELY-05 | Cart contents shall survive a server restart — cart data persisted in PostgreSQL | Restart test; cart contents verified post-restart |
| NFR-RELY-06 | The checkout flow shall validate stock availability at the moment of payment, not at the moment of cart addition | End-to-end test with concurrent purchase of last item |
| NFR-RELY-07 | Data consistency between Stripe and the local database shall be verifiable via a reconciliation report | Admin reconciliation query matches Stripe dashboard |

---

## 4. Security

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-SEC-01 | All HTTP traffic shall be redirected to HTTPS with HSTS header set to min-age 31536000 | SSL Labs grade ≥ A; HSTS header verified |
| NFR-SEC-02 | Helmet middleware shall be applied to all API routes with default security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.) | Integration test checks response headers |
| NFR-SEC-03 | API rate limiting shall be applied to all endpoints: 100 req/min for unauthenticated, 300 req/min for authenticated | Load test triggers 429; Retry-After header present |
| NFR-SEC-04 | Input validation via Zod schemas shall reject malformed payloads with a 422 status before any business logic executes | Fuzz test; malformed data returns 422 |
| NFR-SEC-05 | SQL injection attempts shall be prevented by Prisma ORM parameterized queries | Penetration test; OWASP top-10 scan |
| NFR-SEC-06 | XSS prevention shall be enforced via React's automatic escaping and CSP headers | CSP violation report; no reflected XSS vectors |
| NFR-SEC-07 | CSRF protection shall be implemented for all state-changing API routes (double-submit cookie pattern or SameSite=Strict) | CSRF test; forged request rejected |
| NFR-SEC-08 | All secrets (Stripe keys, JWT secrets, database URLs) shall be stored in environment variables, never in source code | Repository scan for hardcoded secrets; zero matches |
| NFR-SEC-09 | npm dependencies shall be audited in CI; builds with critical or high-severity vulnerabilities shall fail | `npm audit` in CI pipeline; zero critical/high |
| NFR-SEC-10 | File uploads (product images) shall validate file type (JPEG/PNG), size (max 5 MB), and scan for malware | Upload test; invalid types rejected |
| NFR-SEC-11 | Stripe webhook endpoint shall verify the Stripe-Signature header before processing | Test with forged signature returns 400 |

---

## 5. Authentication

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-AUTH-01 | Access tokens shall expire in 15 minutes; refresh tokens shall expire in 7 days | Token expiry configuration verified |
| NFR-AUTH-02 | Refresh token rotation shall invalidate the previous refresh token on each use | Rotation test; old refresh token returns 401 |
| NFR-AUTH-03 | Passwords shall be hashed with bcrypt using a cost factor of ≥ 12 | Source code review; config verified |
| NFR-AUTH-04 | Password reset tokens shall expire in 1 hour and be single-use | Reset token test; double-use returns 410 |
| NFR-AUTH-05 | Failed login attempts shall be rate-limited to 5 attempts per email per 15 minutes | Brute-force test; account locked temporarily |
| NFR-AUTH-06 | OAuth social login shall validate the ID token signature and nonce before accepting | Token validation test; forged token rejected |
| NFR-AUTH-07 | Session tokens shall be transmitted only via `Authorization: Bearer` header over HTTPS | Code review; no cookie-based access token transport |

---

## 6. Authorization

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-AUTHZ-01 | All API endpoints shall enforce role-based access control — CUSTOMER and ADMIN roles only | Integration test matrix; each endpoint with each role |
| NFR-AUTHZ-02 | Customers shall only access their own orders, cart, and profile data | Data isolation test; customer A cannot access customer B's data |
| NFR-AUTHZ-03 | Admin endpoints shall reject non-ADMIN tokens with 403 Forbidden | Test with CUSTOMER token on admin endpoints |
| NFR-AUTHZ-04 | Unauthenticated requests to protected endpoints shall return 401 Unauthorized | Test with no token or expired token |
| NFR-AUTHZ-05 | Authorization checks shall be performed at the API route handler level, not solely in the frontend | Code review; no client-only auth gates for protected data |
| NFR-AUTHZ-06 | Public endpoints (product listing, blog) shall not leak authenticated-only data (e.g., pricing tiers, stock thresholds) | Response inspection; stock quantity hidden from unauthenticated users |

---

## 7. Scalability

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-SCAL-01 | The platform shall handle 500 concurrent users browsing the catalogue without degradation | Load test: 500 virtual users; p95 response time < 2s |
| NFR-SCAL-02 | The platform shall handle 50 concurrent checkout sessions without failure | Load test: 50 concurrent Stripe redirects; all succeed |
| NFR-SCAL-03 | The PostgreSQL database connection pool shall support at least 20 concurrent connections with Prisma connection pooling | Connection pool test; pool size ≥ 20 |
| NFR-SCAL-04 | Static assets (images, fonts) shall be served via CDN (Vercel Edge Network) to reduce origin load | CDN cache hit ratio ≥ 90% |
| NFR-SCAL-05 | Serverless functions (Vercel) shall have cold start times under 500ms for API routes | Cold start test; p95 < 500ms |
| NFR-SCAL-06 | The database shall handle catalogue queries at 1000 QPS with index-only scans | Index analysis; `EXPLAIN ANALYZE` on key queries |

---

## 8. Maintainability

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-MAIN-01 | The codebase shall maintain strict TypeScript with no `any` types | `tsconfig.json` `noImplicitAny: true`; CI type check passes |
| NFR-MAIN-02 | Data access shall follow the repository pattern — no direct Prisma calls in route handlers | Code review; PR gate enforces pattern |
| NFR-MAIN-03 | Shared validation logic (Zod schemas) shall be defined once in `/types` and imported by both client and server | Import analysis; no duplicate schema definitions |
| NFR-MAIN-04 | ESLint and Prettier shall be enforced in CI with a pre-commit hook via Husky | CI lint step fails on violations; Husky config verified |
| NFR-MAIN-05 | All generated code files shall contain zero TODO comments or pseudocode | Repository grep for `TODO`, `FIXME`, `implement later` — zero matches |
| NFR-MAIN-06 | Environment variables shall be documented in a `.env.example` file with descriptions | File exists; matches all env vars used in code |
| NFR-MAIN-07 | The repository tree shall match the documented folder structure in `docs/01-repository-tree.md` | Automated tree comparison in CI |
| NFR-MAIN-08 | Unit/integration test coverage shall be ≥ 80% measured by line coverage | Vitest coverage report; CI gate fails below threshold |

---

## 9. Compliance

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-COMP-01 | Customer-facing pages shall meet WCAG 2.1 AA accessibility standards | axe-core scan; zero violations on all customer routes |
| NFR-COMP-02 | The platform shall comply with PCI DSS Level 4 requirements by using Stripe Checkout (card data never touches the server) | SAQ A self-assessment completed; Stripe integration verified |
| NFR-COMP-03 | Privacy policy and terms of service pages shall be accessible from the footer | Footer links verified |
| NFR-COMP-04 | The platform shall not store raw credit card numbers, CVV, or magnetic stripe data | Code review; payment fields exist only in Stripe iframe |
| NFR-COMP-05 | User data export (GDPR right of access) shall be available via admin request | Admin can export all user data in JSON format |
| NFR-COMP-06 | User account deletion shall be available upon request, anonymizing personal data | Account deletion test; PII removed from database |
| NFR-COMP-07 | CAN-SPAM compliance shall be observed — transactional emails do not require unsubscribe; marketing emails include an unsubscribe link | Email template review |
| NFR-COMP-08 | Cookie consent notice shall be displayed on first visit with options to manage preferences | Cookie banner implemented and verified |

---

## 10. Logging

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-LOG-01 | All API requests shall be logged via Pino with structured JSON format including method, path, status code, duration, and request ID | Log output verified in development and production |
| NFR-LOG-02 | Error logs shall include full stack traces and contextual metadata (user ID, request ID, request body) | Error simulation; log entry verified |
| NFR-LOG-03 | Pino logger shall output to stdout in production (not to files) for consumption by Render/Vercel log pipelines | Logger config verified |
| NFR-LOG-04 | Database query logs shall be captured via Prisma middleware with query duration | Prisma `$on('query')` handler logs verified |
| NFR-LOG-05 | Security-relevant events (failed login, 403, 429) shall be logged at `warn` level | Event simulation; log level verified |
| NFR-LOG-06 | Logs shall never contain secrets, tokens, or PII — sensitive fields redacted by the logger | Redaction configuration verified |
| NFR-LOG-07 | Each log entry shall include a unique correlation/request ID propagated across async boundaries | Correlation ID present in API logs and downstream calls |

---

## 11. Monitoring

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-MON-01 | Uptime monitoring shall be configured for the production domain with 1-minute check intervals | Monitoring dashboard active; alert configured |
| NFR-MON-02 | Synthetic transaction monitoring shall verify the purchase flow (browse → add to cart → checkout) every 15 minutes | Playwright synthetic test passes on schedule |
| NFR-MON-03 | Error rate alert shall trigger when 5xx responses exceed 1% of total requests in a 5-minute window | Alert rule configured in monitoring platform |
| NFR-MON-04 | P95 API response time alert shall trigger when exceeding 1 second for any endpoint over 5 minutes | Alert rule configured |
| NFR-MON-05 | Database connection pool utilization alert shall trigger when usage exceeds 80% | Alert rule configured |
| NFR-MON-06 | Stripe webhook failure alert shall trigger if any webhook event returns a non-200 status | Webhook failure metric monitored; alert configured |
| NFR-MON-07 | Disk usage on the database instance shall be monitored with an alert at 80% capacity | Railway monitoring configured; alert rule set |
| NFR-MON-08 | A dashboard shall display key metrics: request rate, error rate, P50/P95/P99 latency, active users, order count, revenue | Dashboard created and accessible to the engineering team |

---

## 12. Backup & Recovery

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-BACKUP-01 | PostgreSQL database shall be backed up automatically every 24 hours | Railway automated backup verified; backup exists |
| NFR-BACKUP-02 | Backup retention shall be a minimum of 30 days | Retention policy configured |
| NFR-BACKUP-03 | A point-in-time recovery (PITR) capability shall be enabled with a recovery window of at least 7 days | Railway PITR configuration verified |
| NFR-BACKUP-04 | A documented disaster recovery runbook shall exist and be tested quarterly | Runbook in repository; quarterly drill log |
| NFR-BACKUP-05 | Recovery Time Objective (RTO) shall be ≤ 1 hour for full database restoration | Restore drill timed; meets threshold |
| NFR-BACKUP-06 | Recovery Point Objective (RPO) shall be ≤ 24 hours (≤ 5 minutes with PITR) | Backup frequency + PITR window verified |
| NFR-BACKUP-07 | Product images stored in AWS S3 shall have versioning enabled to recover from accidental deletion | S3 bucket versioning configuration verified |
| NFR-BACKUP-08 | Environment variables and deployment configurations shall be documented and reproducible outside of production | `.env.example` + Docker Compose + deployment scripts exist |
| NFR-BACKUP-09 | A staging environment shall mirror production configuration for pre-deployment verification | Staging deployment exists; parity verified quarterly |

---

## 13. Database Indexing

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-DBIDX-01 | Product queries by category, published status, and price range shall use a compound index on `(categoryId, published, price)` | `EXPLAIN ANALYZE` confirms index-only scan on listing queries |
| NFR-DBIDX-02 | Order queries by user and creation date shall use a compound index on `(userId, createdAt)` | `EXPLAIN ANALYZE` confirms index scan on order history queries |
| NFR-DBIDX-03 | Review queries by product and approval status shall use a compound index on `(productId, status)` | `EXPLAIN ANALYZE` confirms index scan on PDP review queries |
| NFR-DBIDX-04 | Audit log queries by entity and action shall use compound indexes on `(entity, entityId)` and `(action, createdAt)` | `EXPLAIN ANALYZE` confirms index scan on audit queries |
| NFR-DBIDX-05 | All foreign key columns shall have single-column indexes | Schema review confirms all FK columns indexed |

---

## 14. Error Tracking

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-ERRTRK-01 | Production errors shall be captured by an error tracking service (e.g. Sentry) with stack traces, request context, and user ID (if authenticated) | Error tracking dashboard active; alert on new errors |
| NFR-ERRTRK-02 | Client-side JavaScript errors shall be reported to the error tracking service | Error tracking captures unhandled client exceptions |
| NFR-ERRTRK-03 | Error tracking shall group duplicate errors and provide frequency counts | Error grouping verified; frequency trend visible |
| NFR-ERRTRK-04 | Error tracking shall not capture PII or secrets in error context | Redaction rules configured; verified via test error |

---

## 15. Mobile Responsiveness

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-MOBILE-01 | Customer-facing pages shall be fully responsive at viewport widths ≥ 320px with no horizontal scrolling | Responsive design QA on iPhone SE, iPhone 14, iPad, desktop |
| NFR-MOBILE-02 | Touch targets (buttons, links, form controls) shall be at least 44×44px on touch devices | Browser DevTools element inspection; no target below 44px |
| NFR-MOBILE-03 | Mobile LCP shall be under 3 seconds on a 4G connection | Lighthouse mobile audit; LCP < 3s |
| NFR-MOBILE-04 | Filter and sort controls shall collapse into a slide-out drawer on screens < 768px | Responsive test; drawer opens/closes correctly |

---

## 16. Dependency Management

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-DEP-01 | Automated dependency update PRs (Renovate or Dependabot) shall be configured for the repository | Automated PR created within 7 days of a new dependency version |
| NFR-DEP-02 | Critical or high-severity CVEs shall be patched within 7 days of disclosure | CI fails on `npm audit` critical/high; SLA tracked |
| NFR-DEP-03 | Dependency updates shall be reviewed and merged quarterly at minimum | Dependency review log; quarter-over-quarter comparison |
| NFR-DEP-04 | Production deployments shall be blocked if any dependency has an unpatched critical CVE | CI pipeline gate; block on `npm audit` critical |

---

## 17. CDN Caching Strategy

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-CDN-01 | Product listing API responses (`GET /api/products`, `/api/products/categories`) shall be cacheable with a `stale-while-revalidate` strategy | Cache headers verified; revalidated on product publish/unpublish |
| NFR-CDN-02 | Blog article API responses shall be cacheable with CDN TTL of at least 5 minutes | Cache headers verified; invalidated on article publish |
| NFR-CDN-03 | Static assets (CSS, JS, fonts, images) shall have a CDN cache duration of ≥ 30 days with content-based cache busting | Vercel CDN config; cache headers verified |

---

## 18. Cold-Start Mitigation

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-COLD-01 | API Route Handler cold start time shall be under 500ms for 95% of requests | Cold start test; p95 < 500ms |
| NFR-COLD-02 | Admin dashboard server components shall include streaming or skeleton loading to mitigate cold-start rendering delay | Skeleton loaders visible on admin pages during initial load |
| NFR-COLD-03 | Frequently accessed queries (category listing, product detail) shall use Next.js Data Cache or React `cache()` to reduce cold-start database round-trips | Caching implementation verified; cold query time reduced |
