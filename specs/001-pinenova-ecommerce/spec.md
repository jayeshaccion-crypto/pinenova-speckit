# Feature Specification: PineNova E-Commerce Platform

**Feature Branch**: `001-pinenova-ecommerce`

**Created**: 2026-07-11

**Status**: Draft

**Input**: Build a production e-commerce site for a pineapple vegan leather goods brand.

## User Scenarios & Testing

### User Story 1 - Browse & Filter Products (Priority: P1)

A customer visits the site and browses products by category (bags, wallets, belts, footwear). They filter by price range, material, color, and size, and sort results by relevance, price, or popularity.

**Why this priority**: Product browsing is the entry point to every customer journey without which no purchase can occur.

**Independent Test**: Can be fully tested by navigating to each category page, applying every filter/sort combination, and confirming results match criteria.

**Acceptance Scenarios**:
1. **Given** the customer is on the homepage, **When** they click a category (e.g. "Bags"), **Then** they see only products in that category
2. **Given** the customer is on a category page, **When** they apply a price filter, **Then** only products within that price range are shown
3. **Given** the customer has applied filters, **When** they select a sort option, **Then** results reorder accordingly without losing filters
4. **Given** no products match the current filters, **When** filtering, **Then** a clear empty state message is displayed with suggested actions

---

### User Story 2 - Product Detail & Stock Visibility (Priority: P1)

A customer clicks a product to view its detail page showing high-res images, materials description, care instructions, price, available sizes/colors, and real-time stock status.

**Why this priority**: Customers need complete product information to make purchasing decisions; stock visibility prevents frustration from out-of-stock adds to cart.

**Independent Test**: Can be fully tested by visiting any product URL and confirming all sections render with correct data.

**Acceptance Scenarios**:
1. **Given** the customer is on a product detail page, **When** the page loads, **Then** they see product name, price, images, materials, care instructions, and available variants
2. **Given** a product has multiple variants, **When** the customer selects a different size/color, **Then** stock status updates in real-time
3. **Given** a product is out of stock, **When** the customer views the page, **Then** they see "Out of Stock" with an option to be notified when back in stock
4. **Given** the product page is loaded on mobile, **When** rendering, **Then** images load with LCP under 2.5s and full Core Web Vitals pass

---

### User Story 3 - Cart & Checkout (Priority: P1)

A customer adds items to cart, reviews quantities, and completes checkout securely via Stripe without storing any payment data on the server.

**Why this priority**: The checkout flow is the revenue-generating path; a broken checkout is a P0 incident as stated in the constitution.

**Independent Test**: Can be fully tested by adding items to cart, proceeding through checkout with a test Stripe card, and confirming order confirmation displays.

**Acceptance Scenarios**:
1. **Given** the customer is browsing, **When** they click "Add to Cart", **Then** the item appears in their cart with correct quantity and price
2. **Given** the customer is on the cart page, **When** they update quantities or remove items, **Then** totals recalculate correctly
3. **Given** the customer proceeds to checkout, **When** they complete payment via Stripe, **Then** they see a confirmation page and receive an order confirmation email
4. **Given** a customer completes checkout from landing page, **When** counting clicks, **Then** the total is under 5 clicks
5. **Given** two customers attempt to buy the last item simultaneously, **When** both reach checkout, **Then** only one succeeds and inventory is not oversold
6. **Given** a non-critical service (e.g. recommendations) is down, **When** the customer checks out, **Then** the checkout still completes successfully
7. **Given** the checkout error rate spikes, **When** monitoring detects it, **Then** alerts fire automatically

---

### User Story 4 - Account Creation & Order History (Priority: P2)

A customer creates an account, views past orders, tracks current order status, and manages account details including password reset.

**Why this priority**: Account features drive retention and repeat purchases but are not required for first-time checkout.

**Independent Test**: Can be fully tested by creating an account, placing an order, then logging in to view order history and status.

**Acceptance Scenarios**:
1. **Given** a new customer, **When** they create an account, **Then** they can log in immediately with their chosen credentials
2. **Given** an authenticated customer, **When** they visit their account, **Then** they see their order history with status for each order
3. **Given** a customer has forgotten their password, **When** they request a reset, **Then** they receive a secure reset link and can set a new password
4. **Given** a customer wants to update their details, **When** they edit their profile, **Then** changes are saved and reflected immediately
5. **Given** a customer attempts to access another user's order data, **When** they manipulate URLs, **Then** they are denied access

---

### User Story 5 - Admin Product Management (Priority: P2)

A store admin adds, edits, and archives products and variants, manages inventory with audit history, and organizes products by category.

**Why this priority**: Admins need product management before the store can be populated; placed at P2 because a basic store can launch with pre-seeded data.

**Independent Test**: Can be fully tested by logging in as admin, creating a product with variants, editing it, and archiving it while confirming each change is reflected on the storefront.

**Acceptance Scenarios**:
1. **Given** an admin is logged in, **When** they add a new product, **Then** it appears on the storefront with all entered details
2. **Given** an admin edits a product, **When** they change price/description/images, **Then** the storefront reflects changes immediately
3. **Given** an admin archives a product, **When** customers browse, **Then** it no longer appears on the storefront
4. **Given** inventory changes, **When** any modification is made, **Then** an audit trail is recorded with timestamp and admin identity

---

### User Story 6 - Order Management & Refunds (Priority: P2)

An admin views incoming orders, updates their status (processing, shipped, delivered), processes refunds, views sales metrics, and exports order data.

**Why this priority**: Order management is essential for operations; placed at P2 because initial orders can be managed manually if needed.

**Independent Test**: Can be fully tested by placing test orders, updating their status, processing a refund, and verifying the order data export.

**Acceptance Scenarios**:
1. **Given** an admin views the orders dashboard, **When** they filter by status, **Then** only matching orders appear
2. **Given** an admin processes an order, **When** they update it to "Shipped", **Then** the customer sees the updated status in their account
3. **Given** a refund is issued, **When** processed through the admin panel, **Then** the payment is reversed via Stripe and the order status reflects the refund
4. **Given** an admin wants to analyze sales, **When** they view metrics, **Then** they see total revenue, order count, and average order value for a date range
5. **Given** an admin needs data offline, **When** they export orders, **Then** a CSV file is generated with all relevant order fields

---

### User Story 7 - Discount Codes & Promotions (Priority: P3)

An admin creates discount codes with percentage or fixed-amount discounts, sets usage limits and expiry dates, and customers apply codes at checkout.

**Why this priority**: Promotions drive sales but are not required for MVP launch.

**Independent Test**: Can be fully tested by creating a discount code with specific rules, applying it at checkout, and confirming the correct discount is applied.

**Acceptance Scenarios**:
1. **Given** an admin creates a discount code, **When** they set a percentage discount and expiration date, **Then** the code is saved and available for use
2. **Given** a customer has a valid discount code, **When** they enter it at checkout, **Then** the total adjusts correctly
3. **Given** a discount code has exceeded its usage limit, **When** a customer applies it, **Then** they see an error message indicating the code is no longer valid
4. **Given** an expired discount code is entered, **When** the customer applies it, **Then** they are informed the code has expired

---

### User Story 8 - SEO Content & Blog (Priority: P3)

Customers read SEO-optimised blog posts and guides on sustainable/vegan leather topics. Each product page includes complete SEO metadata and schema.org markup.

**Why this priority**: Content marketing drives organic traffic but is not required for the store to function.

**Independent Test**: Can be fully tested by publishing a blog post, confirming it renders with correct metadata, and verifying schema.org markup passes structured data testing.

**Acceptance Scenarios**:
1. **Given** a blog post is published, **When** a customer visits the article, **Then** it includes SEO title, meta description, and Open Graph tags
2. **Given** a product page, **When** rendered, **Then** it includes schema.org Product markup with name, description, price, availability, and image
3. **Given** a pre-launch crawl is run, **When** checking every product page, **Then** all pages have complete SEO metadata and valid schema.org markup
4. **Given** a customer searches for sustainable leather topics, **When** the blog article appears in search results, **Then** the snippet includes accurate meta description

---

### Edge Cases

- What happens when a customer adds an item to cart and the inventory sells out before they complete checkout? Stock is validated at checkout submission with pessimistic locking; customer is notified if stock changed and cart is adjusted.
- How does the system handle duplicate payment attempts? Stripe idempotency keys prevent duplicate charges; the system generates unique idempotency keys per checkout attempt.
- What happens when the Stripe API is unreachable during checkout? Checkout displays a friendly error, logs the failure, and avoids partial state. Feature flag can disable checkout instantly.
- How are concurrent inventory updates handled when multiple admins manage stock simultaneously? Last-write-wins with full audit trail; warning shown if stock was modified by another admin since page load.
- What happens when a customer's session expires mid-checkout? Cart is persisted and available on re-authentication; guest carts are session-based and lost on session expiry (customer warned).
- How does the system handle webhook replay or duplicate Stripe events? Webhook handlers are idempotent via Stripe event IDs; duplicate events are safely ignored.
- What happens when a customer requests GDPR data deletion? Profile data anonymized; order records retained for 7-year legal hold; confirmation email sent.
- How are guest checkout carts handled for order tracking? Guest receives order confirmation with a lookup link; they can create an account post-purchase to claim the order.

## Requirements

### Functional Requirements

- **FR-001**: Customers MUST be able to browse products by category (bags, wallets, belts, footwear)
- **FR-002**: Customers MUST be able to filter products by price, material, color, and size
- **FR-003**: Customers MUST be able to sort products by price (asc/desc), newest, and popularity
- **FR-004**: Product detail pages MUST display name, price, high-res images, materials, care instructions, available variants, and real-time stock status
- **FR-005**: Customers MUST be able to add items to a cart and manage quantities
- **FR-006**: Checkout MUST be processed securely via Stripe with no raw card data stored on the server
- **FR-007**: Customers MUST be able to create an account with email and password
- **FR-008**: Authenticated customers MUST be able to view order history and track order status
- **FR-009**: Customers MUST be able to reset their password via email
- **FR-010**: Admins MUST be able to add, edit, and archive products and variants
- **FR-011**: Inventory changes MUST be recorded with audit history (timestamp, admin identity, before/after values)
- **FR-012**: Admins MUST be able to view and update order status and issue refunds
- **FR-013**: Admins MUST be able to view sales metrics and export order data as CSV
- **FR-014**: Admins MUST be able to create and manage discount codes with usage limits and expiry dates
- **FR-015**: Customers MUST be able to apply valid discount codes at checkout
- **FR-016**: All state-changing operations (orders, inventory, payments) MUST be idempotent and safe to retry
- **FR-017**: Blog posts MUST include SEO metadata (title, description, Open Graph tags)
- **FR-018**: Product pages MUST include schema.org Product markup
- **FR-019**: The system MUST support graceful degradation — if a non-critical service fails, checkout must still work
- **FR-020**: Structured logging and error tracking MUST be in place for checkout and payment flows
- **FR-021**: Inventory MUST be locked via pessimistic locking during checkout to prevent oversell
- **FR-022**: Guest checkout MUST be supported; account creation is optional during checkout
- **FR-023**: Shipping MUST use flat-rate rules with free shipping above a configurable threshold
- **FR-024**: Tax MUST use static rates per state managed via an admin-configurable table
- **FR-025**: Product URLs MUST follow `/products/{product-slug}` format with auto-generated XML sitemap
- **FR-026**: Customer data MUST be deletable on request with order records retained per legal requirements
- **FR-027**: All database migrations MUST be backward-compatible or include a tested rollback script
- **FR-028**: Feature flags MUST gate checkout and payment flows for instant disable capability

### Key Entities

- **Product**: The core entity representing an item for sale with attributes name, description, price, images, materials, care instructions, category, and SEO metadata
- **ProductVariant**: A specific version of a product defined by size, color, or other options with its own SKU, price, and stock level
- **Category**: A grouping of products (bags, wallets, belts, footwear) that can have a parent-child hierarchy
- **Customer**: A registered user with account details, order history, and authentication credentials
- **Order**: A completed purchase containing line items, totals, shipping info, payment status, and fulfillment status
- **OrderLineItem**: An individual product/variant within an order with quantity and price at time of purchase
- **Cart**: A temporary collection of items for a customer or session before checkout
- **InventoryLog**: An audit record of inventory changes with timestamp, admin identity, product/variant, old quantity, new quantity, and reason
- **DiscountCode**: A promotional code with type (percentage/flat), value, usage limit, expiry date, and redemption tracking
- **BlogPost**: An SEO-optimised article with title, body, author, publish date, categories, and metadata tags

## Success Criteria

### Measurable Outcomes

- **SC-001**: Customers can go from landing page to completed checkout in under 5 clicks
- **SC-002**: Product pages load with LCP under 2.5s and pass all Core Web Vitals thresholds
- **SC-003**: Every product page has complete SEO metadata and schema.org markup, verified in a crawl before launch
- **SC-004**: No payment data is stored directly on our servers (delegated to Stripe), confirmed via security review
- **SC-005**: Inventory never oversells; concurrent checkouts are handled safely (verified with load test)
- **SC-006**: Zero checkout downtime during launch window
- **SC-007**: Checkout error rate stays under 0.1% post-launch; alerts fire if threshold exceeded
- **SC-008**: Security review (SAST, dependency scan, Stripe webhook review, PCI SAQ A) completed and signed off before production traffic
- **SC-009**: Rollback drill executed successfully before launch; full rollback completed in under 30 minutes
- **SC-010**: All product pages pass structured data testing (schema.org Product, BreadcrumbList) in pre-launch crawl
- **SC-011**: Guest checkout path completes in under 5 clicks without requiring account creation

## Clarifications

### Clarification 1: Payment & PCI Handling

**Decision**: Stripe Elements / Payment Intents API handles all card data collection. No raw PAN, CVV, or card data ever reaches our servers or logs. Stripe returns a `pi_` or `pm_` token; we store only the Stripe PaymentIntent ID and last 4 digits for reference.

**Pre-go-live Security Review**:
- SAST scan on all checkout-related code paths
- Dependency vulnerability scan (critical/high must be fixed)
- Manual review of Stripe webhook handlers (idempotency, replay protection)
- PCI SAQ A validation (since card data never touches our servers)
- Penetration test focused on: payment confirmation tampering, price manipulation, order篡改

### Clarification 2: Inventory & Stock Concurrency

**Decision**: 
- **Oversell prevention**: Database-level pessimistic locking (`SELECT ... FOR UPDATE`) on the inventory row during checkout. If stock is insufficient at charge time, the transaction is rejected and the customer is notified.
- **Cart reservations**: Not implemented in v1. Stock is checked at checkout submission only, not at add-to-cart. A product may go out of stock between add-to-cart and checkout; the customer is informed at checkout.
- **Backorders**: Not supported in v1. Out-of-stock products show "Out of Stock" with a "Notify me when back" option (email capture only; no automatic fulfillment).
- **Concurrent admin updates**: Last-write-wins with full audit trail. Admins see a warning when stock was modified by another admin since they loaded the page.

### Clarification 3: Product Variant Model

**Decision**: Products use a flat variant model — each size/color combination is a separate `ProductVariant` record with its own SKU, price (can override product base price), stock level, and image(s). A product has many variants. Inventory is tracked at the variant level. Filtering by size/color queries variants and groups by product.

Example structure:
- Product: "Classic Tote Bag"
  - Variant: Black / Small (SKU: TOTE-BLK-SM, stock: 15)
  - Variant: Black / Large (SKU: TOTE-BLK-LG, stock: 8)
  - Variant: Brown / Small (SKU: TOTE-BRN-SM, stock: 0)

### Clarification 4: SEO Requirements

**Decision**:
- **URL structure**: `/products/{product-slug}` for products, `/categories/{category-slug}` for categories, `/blog/{post-slug}` for articles
- **Metadata**: Title (50-60 chars), meta description (150-160 chars), Open Graph tags, Twitter cards — all managed via CMS fields per page
- **Sitemap**: Auto-generated XML sitemap at `/sitemap.xml` covering all products, categories, and blog posts; submitted via `robots.txt`
- **Structured data**: schema.org `Product` (with `offers`, `aggregateRating`, `review`), `BreadcrumbList`, `Article` for blog posts
- **Redirect strategy**: No existing site to migrate from (greenfield project); 301 redirects managed via a redirects table if needed later
- **Crawl validation**: Full site crawl via Screaming Frog or equivalent before launch; all pages must return 200, have unique titles, and valid schema

### Clarification 5: Guest Checkout vs. Required Account

**Decision**: Guest checkout is allowed. Customers can check out without creating an account. Post-purchase, they are offered the option to create an account to "claim" their order for order history and tracking. Account creation during checkout is optional and does not add clicks to the critical path.

### Clarification 6: Shipping & Tax Calculation

**Decision (v1 — post-launch upgrade path noted)**:
- **Shipping**: Flat-rate shipping based on order value thresholds. Free shipping on orders over $100. Otherwise a single flat rate. Single-country shipping only (US) for v1.
- **Tax**: Static tax rate based on customer shipping address state. Rates maintained in a config table updated manually. No third-party tax engine in v1.
- **Post-launch upgrade**: Avalara or TaxJar integration scoped for v2 when multi-state/country complexity warrants it.

### Clarification 7: Data Retention & Compliance

**Decision**:
- **Target markets**: US and EU (launch); additional regions deferred
- **GDPR compliance**: Right to deletion (anonymize personal data, retain order records for legal hold), right to data portability (export user data as JSON), consent records for marketing emails
- **CCPA compliance**: Opt-out mechanism for data sale (not applicable — we do not sell data), right to know what data is collected
- **Retention schedule**: Order records retained 7 years (tax/legal obligation); customer profile data retained until deletion request or 2 years of account inactivity; session/cart data purged after 30 days; audit logs retained 1 year
- **Data deletion**: Automated deletion job runs weekly; deletion is soft-delete with 30-day restore window via admin

### Clarification 8: Launch Environments & Deployment

**Decision**:
- **Environments**:
  - **Development**: Local machines, each developer runs full stack
  - **Staging**: Full mirror of production (separate DB, Stripe test mode, same hosting); deployed from `main` branch on every merge. Used for UAT and load testing
  - **Production**: Live environment; deployed from release tag
- **CI pipeline**: Every PR runs tests (unit + integration) and linting. Merge blocked on failure. PR must include test evidence in description.
- **Deployment strategy**: Blue-green or rolling (per platform capability). Feature flags gate high-risk paths (checkout, payment) so they can be disabled without rollback.
- **Rollback plan**:
  1. Database migrations must be backward-compatible (no destructive column drops; additive only) or have a tested rollback script
  2. Deploy rollback reverts the artifact to the previous stable version
  3. Feature flags disable problematic paths instantly without deploy
  4. Rollback drill executed before launch
- **Monitoring & alerting**: Checkout error rate (alert if > 1% in 5-min window), payment failure rate, Stripe API latency p99, overall uptime. Alerts to PagerDuty/Opsgenie equivalent.
