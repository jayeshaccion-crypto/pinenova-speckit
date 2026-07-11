# Functional Requirements Document — PineNova Ecommerce Platform

| Document Owner | Engineering & Product Team |
|---|---|
| Version | 1.0 |
| Status | Draft — Phase 0 |
| Base Document | BRD.md v1.0 |

---

## 1. Functional Modules

### FM1 — Product Catalogue

| ID | Requirement |
|---|---|
| FM1.1 | The system shall maintain a catalogue of exactly 12 products across 4 categories (Bags, Wallets, Belts, Footwear) with 3 products per category |
| FM1.2 | Each product shall have a name, description, price ($49–$289), category, images (multiple), SKU, stock quantity, material tag, and sustainability badge |
| FM1.3 | Customers shall be able to browse products by category and view paginated category listing pages |
| FM1.4 | Customers shall be able to search products by name or keyword |
| FM1.5 | Customers shall be able to sort products by price (asc/desc), name, and newest |
| FM1.6 | Customers shall be able to filter products by price range and category |
| FM1.7 | Each product shall have a dedicated product detail page (PDP) with full description, image gallery, price, stock indicator, and add-to-cart button |
| FM1.8 | Admins shall be able to create, read, update, and delete products via the admin dashboard |

### FM2 — User Accounts & Authentication

| ID | Requirement |
|---|---|
| FM2.1 | The system shall support user registration with email, password, first name, and last name |
| FM2.2 | The system shall authenticate users via JWT access tokens (short-lived) and refresh tokens (long-lived) |
| FM2.3 | Passwords shall be hashed using bcrypt before storage |
| FM2.4 | The system shall support two roles: CUSTOMER and ADMIN |
| FM2.5 | Users shall be able to log in using email + password or via OAuth social login providers (Google, Apple) |
| FM2.6 | Users shall be able to request a password reset via email |
| FM2.7 | Users shall be able to update their profile (name, email, shipping addresses) |
| FM2.8 | The system shall persist user session via refresh token rotation |

### FM3 — Shopping Cart

| ID | Requirement |
|---|---|
| FM3.1 | Authenticated users shall have a persistent cart stored server-side |
| FM3.2 | Users shall be able to add products to cart with a selected quantity |
| FM3.3 | Users shall be able to remove items from cart |
| FM3.4 | Users shall be able to update item quantities in cart |
| FM3.5 | The cart shall display subtotal, estimated tax (10%), shipping cost, and total |
| FM3.6 | Stock availability shall be validated when adding to cart and at checkout |

### FM4 — Checkout & Payments

| ID | Requirement |
|---|---|
| FM4.1 | Checkout shall require an authenticated session (guest checkout disabled) |
| FM4.2 | Checkout shall collect or confirm a shipping address before proceeding to payment |
| FM4.3 | The system shall calculate and display: subtotal, 10% tax, flat $8 shipping (free if subtotal ≥ $120), and total |
| FM4.4 | The system shall redirect the user to Stripe Checkout Session for payment |
| FM4.5 | The system shall use Stripe as the sole payment gateway for MVP; a payment gateway abstraction layer shall exist for future providers |
| FM4.6 | Upon successful Stripe payment, the Stripe webhook shall confirm the order |
| FM4.7 | The system shall handle webhook idempotency to prevent duplicate order creation |
| FM4.8 | Stock availability shall be validated before creating the Stripe Checkout Session (not only at webhook time) |
| FM4.9 | An order confirmation email shall be sent to the customer on successful order creation |

### FM5 — Order Management

| ID | Requirement |
|---|---|
| FM5.1 | Orders shall be created upon Stripe webhook confirmation with status `confirmed` |
| FM5.2 | Orders shall track: order ID (UUID), user, items, quantities, prices, tax, shipping, total, status, timestamps |
| FM5.3 | Order statuses shall include: `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded` |
| FM5.4 | Customers shall be able to view their order history and individual order details |
| FM5.5 | Customers may cancel their own orders if status is `confirmed` or `processing` (pre-shipment) |
| FM5.6 | Admins shall be able to view all orders, update order status, and cancel/refund orders |
| FM5.7 | Inventory shall be decremented atomically when an order is confirmed |

### FM6 — Inventory Tracking

| ID | Requirement |
|---|---|
| FM6.1 | Each product variant shall have a stock quantity field |
| FM6.2 | Stock shall be decremented on order confirmation (not on cart add) |
| FM6.3 | Out-of-stock products shall display "Out of Stock" on the product page and shall not be addable to cart |
| FM6.4 | Admins shall be able to manually adjust stock quantities |
| FM6.5 | The system shall alert admins when stock falls below a configurable threshold (default: 5 units) |

### FM7 — Product Reviews

| ID | Requirement |
|---|---|
| FM7.1 | Authenticated customers shall be able to submit a review with a rating (1–5 stars) and text body |
| FM7.2 | Customers may edit their own review within 30 days of submission |
| FM7.3 | Reviews shall be displayed on the product detail page sorted by newest first |
| FM7.4 | Admins shall be able to approve, reject, or delete reviews |
| FM7.5 | Only approved reviews shall be visible to other customers |

### FM8 — Admin Dashboard

| ID | Requirement |
|---|---|
| FM8.1 | The admin dashboard shall require ADMIN role authentication |
| FM8.2 | The admin dashboard shall provide a product manager (CRUD, stock adjustment, image upload) |
| FM8.3 | The admin dashboard shall provide an order manager (list, filter, status update, cancel, refund) |
| FM8.4 | The admin dashboard shall provide a user manager (list, view, disable accounts) |
| FM8.5 | The admin dashboard shall provide a review moderation interface (approve/reject/delete) |
| FM8.6 | The admin dashboard shall display key metrics (total orders, revenue, low-stock items) |

### FM9 — Content Marketing & Blog

| ID | Requirement |
|---|---|
| FM9.1 | The system shall include a blog with a listing page and individual article pages |
| FM9.2 | Exactly 5 SEO-optimized blog articles shall be published at launch |
| FM9.3 | Blog articles shall support title, body content, featured image, meta description, and publish date |
| FM9.4 | Admins shall be able to create, edit, publish, and unpublish blog articles |

### FM10 — Transactional Emails

| ID | Requirement |
|---|---|
| FM10.1 | Order confirmation email shall be sent on successful order creation |
| FM10.2 | Shipping notification email shall be sent when admin updates order status to `shipped` |
| FM10.3 | Password reset email shall be sent on password reset request |
| FM10.4 | Welcome email shall be sent on successful user registration |

### FM11 — Multi-Currency (USD & INR)

| ID | Requirement |
|---|---|
| FM11.1 | The system shall display prices in USD (default) with an optional INR view |
| FM11.2 | Currency selection shall persist per session; checkout always processes in USD |
| FM11.3 | Exchange rate shall use a fixed rate defined in configuration (updated periodically) |

### FM12 — Custom Payment Methods (Future)

| ID | Requirement |
|---|---|
| FM12.1 | The system shall define a `PaymentGateway` interface in `/lib/payment` for future extensibility |
| FM12.2 | StripeGateway shall implement the interface as the sole production gateway |
| FM12.3 | Adding a new gateway shall require only a new class implementing the interface; no core checkout modification |

---

## 2. Screen Specifications

### S1 — Home Page (`/`)

| Element | Description |
|---|---|
| Hero Section | Brand banner with tagline, CTA to shop |
| INR Toggle | Currency selector (USD / INR) in header |
| Category Cards | 4 clickable cards linking to each category listing |
| Featured Products | Grid of up to 4 featured products with image, name, price |
| Sustainability Banner | Section highlighting pineapple-fiber material story |
| Footer | Links, contact, social, newsletter signup |

### S2 — Category Listing Page (`/category/[slug]`)

| Element | Description |
|---|---|
| Header | Category name and product count |
| Filters | Price range slider, optional attribute filters |
| Sort Dropdown | Price asc/desc, name, newest |
| Product Grid | Responsive grid of product cards (image, name, price) |
| Empty State | Message when no products match filters |
| Pagination | Page navigation for results beyond first page |

### S3 — Product Detail Page (`/products/[slug]`)

| Element | Description |
|---|---|
| Image Gallery | Main image + thumbnail strip; lightbox on click |
| Product Info | Name, price, material badge, stock status, description |
| Quantity Selector | +/- input with stock validation |
| Add to Cart Button | CTA; disabled if out of stock |
| Reviews Section | List of approved reviews with rating stars and text |
| Review Form | Star rating + text area (authenticated users only) |
| Related Products | Grid of up to 4 products from same category |

### S4 — Authentication Pages

| Page | Elements |
|---|---|
| Login (`/login`) | Email field, password field, submit button, "Forgot Password?" link, OAuth buttons (Google, Apple), link to register |
| Register (`/register`) | First name, last name, email, password, confirm password, submit button, OAuth buttons, link to login |
| Forgot Password (`/forgot-password`) | Email field, submit button, success message |
| Reset Password (`/reset-password/[token]`) | New password, confirm password, submit button |

### S5 — Cart Page (`/cart`)

| Element | Description |
|---|---|
| Cart Item List | Each item: image, name, unit price, quantity selector, line total, remove button |
| Order Summary | Subtotal, estimated tax, shipping cost, total |
| Checkout Button | CTA to proceed to checkout; disabled if cart empty |
| Empty Cart State | Message + link to continue shopping |

### S6 — Checkout Page (`/checkout`)

| Element | Description |
|---|---|
| Shipping Address Form | Name, street, city, state, zip, country fields |
| Order Summary | Read-only list of items, quantities, prices |
| Price Breakdown | Subtotal, tax, shipping, total |
| Payment Button | "Pay with Stripe" — redirects to Stripe Checkout Session |

### S7 — Order History (`/account/orders`)

| Element | Description |
|---|---|
| Order List | Table of orders: order ID, date, status, total, link to details |
| Empty State | Message if no orders exist |
| Pagination | Page navigation |

### S8 — Order Detail (`/account/orders/[id]`)

| Element | Description |
|---|---|
| Order Header | Order ID, date, status badge |
| Item List | Product image, name, quantity, unit price, line total |
| Shipping Address | Read-only display of shipping address |
| Price Breakdown | Subtotal, tax, shipping, total |
| Status Timeline | Visual timeline of status changes |

### S9 — Admin Dashboard (`/admin`)

| Page | Elements |
|---|---|
| Overview (`/admin`) | Metric cards (total orders, revenue, low-stock count, new users), recent orders table |
| Product Manager (`/admin/products`) | Table with search, filter, sort, create button, edit/delete actions |
| Product Form (`/admin/products/new`, `/admin/products/[id]/edit`) | All product fields, image upload, stock field |
| Order Manager (`/admin/orders`) | Filterable table with status dropdown, detail view |
| Review Moderation (`/admin/reviews`) | Pending/approved/rejected tabs, approve/reject/delete actions |
| User Manager (`/admin/users`) | Table of users, disable/enable toggle |
| Blog Manager (`/admin/blog`) | Article list, create/edit form, publish/unpublish toggle |

### S10 — Blog Pages

| Page | Elements |
|---|---|
| Blog Listing (`/blog`) | Article cards (image, title, excerpt, date), pagination |
| Blog Article (`/blog/[slug]`) | Full article content, featured image, publish date, share buttons |

---

## 3. Business Workflows

### W1 — Customer Registration & Login

```
[Customer] → Register / Social Login → JWT issued (access + refresh)
    → Email verification (optional based on config)
    → Welcome email sent
    → Redirect to home page
```

### W2 — Product Discovery to Purchase

```
[Customer] → Browse categories / Search / Filter
    → View product detail page
    → Select quantity → Add to cart
    → Continue shopping OR proceed to cart
    → Review cart → Proceed to checkout
    → Enter / confirm shipping address
    → Review order summary → Pay via Stripe
    → [Server] Validate stock availability for all items
    → Redirect to Stripe Checkout Session
    → [Stripe] Payment success → Webhook sent
    → [Server] Webhook received → Validate idempotency
    → Create order (status: confirmed)
    → Deduct inventory
    → Send order confirmation email
    → Redirect customer to order confirmation page
```

### W3 — Order Fulfillment (Admin)

```
[Admin] → Login → Admin Dashboard → Order Manager
    → View new orders (status: confirmed)
    → Update status to processing
    → Pick & pack items
    → Update status to shipped (triggers shipping notification email)
    → [Customer] Receives shipping email with tracking
    → [Admin] Update status to delivered
```

### W4 — Order Cancellation / Refund

```
[Customer or Admin] → View order detail → Cancel order
    → [Customer] Only if status is `confirmed` or `processing` (pre-shipment)
    → [Admin] Any pre-shipment status; if shipped initiate return process
    → If cancelled: restore full inventory, issue refund via Stripe
    → If partial refund: do not auto-restore stock (admin adjusts manually)
    → Update order status to `cancelled` / `refunded` / `partially_refunded`
    → Send cancellation / refund notification email
```

### W5 — Product Review

```
[Customer] → View product detail page → Write review
    → Submit rating + text → Status: pending
    → [Admin] Review moderation → Approve / Reject
    → If approved → Visible on PDP
    → [Customer] Can edit within 30 days
```

### W6 — Inventory Low-Stock Alert

```
[System] → On order confirmation → Decrement stock
    → If stock ≤ threshold (5) → Create low-stock alert
    → [Admin] Dashboard shows low-stock badge
    → [Admin] Navigate to product → Adjust stock via purchase order
```

---

## 4. API Requirements

### AR1 — Authentication API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | None | Register new user |
| `/api/auth/login` | POST | None | Login with email/password, returns JWT pair |
| `/api/auth/social-login` | POST | None | Login/register via OAuth provider token |
| `/api/auth/refresh` | POST | Refresh Token | Issue new access token |
| `/api/auth/logout` | POST | Access Token | Invalidate refresh token |
| `/api/auth/forgot-password` | POST | None | Send password reset email |
| `/api/auth/reset-password` | POST | Reset Token | Reset password |

### AR2 — Product API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/products` | GET | None | List products (filter, sort, paginate) |
| `/api/products/[slug]` | GET | None | Get product detail |
| `/api/products/categories` | GET | None | List categories |
| `/api/admin/products` | GET | ADMIN | List all products (admin view) |
| `/api/admin/products` | POST | ADMIN | Create product |
| `/api/admin/products/[id]` | PUT | ADMIN | Update product |
| `/api/admin/products/[id]` | DELETE | ADMIN | Delete product |

### AR3 — Cart API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/cart` | GET | CUSTOMER | Get current user's cart |
| `/api/cart/items` | POST | CUSTOMER | Add item to cart |
| `/api/cart/items/[id]` | PUT | CUSTOMER | Update item quantity |
| `/api/cart/items/[id]` | DELETE | CUSTOMER | Remove item from cart |

### AR4 — Checkout & Order API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/checkout` | POST | CUSTOMER | Validate stock + create Stripe Checkout Session |
| `/api/checkout/validate-stock` | POST | CUSTOMER | Check stock availability without creating session |
| `/api/webhooks/stripe` | POST | Stripe Signature | Stripe webhook receiver |
| `/api/orders` | GET | CUSTOMER | Get current user's orders |
| `/api/orders/[id]` | GET | CUSTOMER | Get order detail |
| `/api/orders/[id]/cancel` | POST | CUSTOMER | Cancel own order (pre-shipment only) |
| `/api/admin/orders` | GET | ADMIN | List all orders |
| `/api/admin/orders/[id]` | GET | ADMIN | Get order detail |
| `/api/admin/orders/[id]/status` | PUT | ADMIN | Update order status |

### AR5 — Review API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/products/[slug]/reviews` | GET | None | List approved reviews |
| `/api/products/[slug]/reviews` | POST | CUSTOMER | Submit review |
| `/api/reviews/[id]` | PUT | CUSTOMER | Edit own review |
| `/api/admin/reviews` | GET | ADMIN | List all reviews (pending) |
| `/api/admin/reviews/[id]/approve` | POST | ADMIN | Approve review |
| `/api/admin/reviews/[id]/reject` | POST | ADMIN | Reject review |
| `/api/admin/reviews/[id]` | DELETE | ADMIN | Delete review |

### AR6 — Admin API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/admin/users` | GET | ADMIN | List users |
| `/api/admin/users/[id]` | GET | ADMIN | Get user detail |
| `/api/admin/users/[id]/status` | PUT | ADMIN | Enable/disable user |
| `/api/admin/dashboard` | GET | ADMIN | Get dashboard metrics |

### AR7 — Blog API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/blog` | GET | None | List published articles |
| `/api/blog/[slug]` | GET | None | Get article |
| `/api/admin/blog` | GET | ADMIN | List all articles |
| `/api/admin/blog` | POST | ADMIN | Create article |
| `/api/admin/blog/[id]` | PUT | ADMIN | Update article |
| `/api/admin/blog/[id]` | DELETE | ADMIN | Delete article |

---

## 5. Data Validation Rules

### User Validation

| Field | Rules |
|---|---|
| email | Required; valid email format; unique; max 255 chars |
| password | Required; min 8 chars; must contain uppercase, lowercase, number |
| confirmPassword | Required; must match password (validated server-side via Zod `.refine()`) |
| firstName | Required; max 100 chars; alphabetic only |
| lastName | Required; max 100 chars; alphabetic only |

### Product Validation

| Field | Rules |
|---|---|
| name | Required; max 200 chars; globally unique (enforced at database level) |
| slug | Auto-generated from name; unique; URL-safe |
| description | Required; max 5000 chars |
| price | Required; decimal; min $49.00; max $289.00 |
| category | Must be one of: Bags, Wallets, Belts, Footwear |
| stock | Required; integer ≥ 0 |
| images | Array of valid URLs; max 5 images per product |

### Order Validation

| Field | Rules |
|---|---|
| items | At least 1 item; each item must reference a valid product |
| quantities | Must not exceed available stock at time of checkout |
| shippingAddress | All required fields: street, city, state, zip, country |
| total | Must equal sum of (item price × qty) + tax + shipping |
| tax | Must equal 10% of subtotal |
| shipping | $8 flat; $0 if subtotal ≥ $120 |

### Review Validation

| Field | Rules |
|---|---|
| rating | Required; integer 1–5 |
| body | Required; max 2000 chars |
| productId | Must reference an existing product |
| userId | Must reference an existing user; one review per product per user |
| orderId | Must reference a confirmed order containing the product (purchase verification) |

### Blog Validation

| Field | Rules |
|---|---|
| title | Required; max 200 chars |
| slug | Auto-generated from title; unique; URL-safe |
| body | Required; max 50000 chars |
| metaDescription | Required; max 160 chars |

---

## 6. Integration Requirements

| Integration | Direction | Protocol | Trigger | Data |
|---|---|---|---|---|
| **Stripe Checkout Session** | Outbound | HTTPS (REST) | User clicks "Pay" (after stock validation) | Line items, prices, success/cancel URLs, customer email |
| **Stripe Webhook** | Inbound | HTTPS (POST) | Payment success/failure | Session ID, payment status, customer details |
| **Stripe Refund** | Outbound | HTTPS (REST) | Admin initiates refund | Payment intent ID, amount |
| **Social Login (Google, Apple)** | Outbound/Inbound | OAuth 2.0 / OIDC | User clicks social login button | ID token, access token, user profile |
| **Email Service Provider** | Outbound | SMTP / API | Order confirm, ship, password reset | Recipient, template, dynamic data |
| **AWS S3 / Object Storage** | Outbound | S3 API | Image upload (admin) | File buffer, content type, bucket path |
| **Additional Payment Gateways** | Outbound/Inbound | HTTPS (REST) | User selects alternate payment | Gateway-specific payload |

### Stripe Webhook Events Consumed

| Event | Action |
|---|---|
| `checkout.session.completed` | Create order, deduct inventory, send confirmation email |
| `checkout.session.expired` | Log and clean up abandoned sessions |
| `charge.refunded` | Update order status to refunded |

### Retry & Resilience

| Integration | Retry Strategy | Timeout | Fallback |
|---|---|---|---|
| Stripe Webhook | 3 retries with exponential backoff (Express handler) | 30s | Manual reconciliation via admin dashboard |
| Email Service | 3 retries with linear backoff | 10s | Log failure; queued retry |
| S3 Upload | 2 retries | 15s | Local fallback storage + alert |

---

## 7. Error Handling

### Customer-Facing Errors

| Scenario | HTTP Status | User Message | Action |
|---|---|---|---|
| Invalid credentials | 401 | "Invalid email or password." | Clear form fields |
| Email already registered | 409 | "An account with this email already exists." | Link to login |
| Out of stock at checkout | 409 | "One or more items in your cart are no longer available." | Redirect to cart with updated stock |
| Invalid product ID | 404 | "Product not found." | Show 404 page |
| Validation failure | 422 | Field-specific error messages | Highlight invalid fields |
| Session expired | 401 | "Your session has expired. Please log in again." | Redirect to login |
| Insufficient permissions | 403 | "You do not have permission to perform this action." | Redirect to home |
| Stripe payment declined | 402 | "Your payment was declined. Please try a different payment method." | Show error on checkout |
| Rate limit exceeded | 429 | "Too many requests. Please try again later." | Retry-After header |

### Admin-Facing Errors

| Scenario | HTTP Status | User Message |
|---|---|---|
| Product not found for edit | 404 | "Product not found." |
| Attempting to delete product with active orders | 409 | "Cannot delete product with active orders." |
| Invalid image upload | 400 | "Image must be JPEG or PNG, max 5MB." |
| Email send failure | 500 | "Failed to send email. Please try again." |

### System Errors

| Scenario | Log Level | Handling |
|---|---|---|
| Database connection failure | ERROR | Return 503; alert engineering team |
| Stripe API timeout | ERROR | Log full context; retry with backoff |
| Webhook signature mismatch | WARN | Log payload; return 400; audit trail |
| Unhandled exception | ERROR | Global error middleware; return 500; log stack trace with Pino |
| S3 upload failure | ERROR | Log; return 500; trigger fallback mechanism |

---

## 8. Audit Requirements

| Event | Data Captured | Retention |
|---|---|---|
| User login (success/failure) | User ID, IP, timestamp, user agent | 90 days |
| Order creation | Full order snapshot (items, prices, addresses) | 7 years |
| Order status change | Previous status, new status, admin ID, timestamp | 7 years |
| Product CRUD (admin) | Admin ID, action, before/after diff, timestamp | 1 year |
| Inventory adjustment | Admin ID, product ID, previous qty, new qty, reason | 1 year |
| Review moderation | Admin ID, review ID, action (approve/reject/delete), timestamp | 1 year |
| Payment events | Stripe session ID, event type, raw webhook payload | 90 days |
| Password reset | User ID, IP, timestamp, success/failure | 30 days |
| Email sent | Recipient, template type, timestamp, delivery status | 30 days |
| API rate limit breaches | IP, endpoint, timestamp, user ID (if authenticated) | 30 days |

### Audit Implementation

- All audit logs shall be written to a dedicated `audit_log` table in PostgreSQL
- Audit entries shall be immutable (append-only)
- Admin dashboard shall expose a read-only audit log view
- Logs shall use Pino logger with structured JSON output

---

## 9. Reporting

### Customer Reports

| Report | Description | Access |
|---|---|---|
| Order History | List of past orders with status, date, total | Customer account page |
| Order Detail | Full breakdown of a single order | Customer account page |

### Admin Reports

| Report | Description | Refresh | Access |
|---|---|---|---|
| Dashboard Metrics | Total orders, revenue (today/week/month), low-stock count | Real-time | Admin dashboard |
| Order Report | Filterable list of all orders with export (CSV) | Real-time | Admin order manager |
| Revenue Report | Revenue by day/week/month with tax and shipping breakdown | Daily | Admin dashboard |
| Inventory Report | All products with current stock, low-stock flag | Real-time | Admin product manager |
| Product Performance | Top-selling products by quantity and revenue | Daily | Admin dashboard |
| Review Report | Reviews by product, average rating, pending count | Real-time | Admin review manager |
| User Report | New registrations, total users, active users | Daily | Admin user manager |
| Audit Log | Chronological event log with filters (event type, date range) | Real-time | Admin audit view |

### Report Format

- All admin reports shall be viewable in-browser as tables
- CSV export shall be available for order and inventory reports
- Dashboard metrics shall use server-side aggregation queries

---

## 10. Notifications

### Push (In-App)

| Notification | Trigger | Audience | Display |
|---|---|---|---|
| Low-stock alert | Stock ≤ threshold after order | Admin | Dashboard badge + admin notification bar |
| New order alert | Order created via webhook | Admin | Dashboard notification + optional toast |
| Review pending | Customer submits review | Admin | Dashboard moderation badge |

### Email

| Email | Trigger | Recipient | Template Data |
|---|---|---|---|
| Welcome email | Registration complete | Customer | Name, login link |
| Order confirmation | Order created (webhook) | Customer | Order ID, items, total, shipping address, estimated delivery |
| Shipping notification | Admin updates status to `shipped` | Customer | Order ID, tracking number (if available), carrier |
| Password reset | User requests reset | Customer | Reset link (expires in 1 hour) |
| Order cancellation | Admin cancels order | Customer | Order ID, reason, refund info |
| Refund processed | Stripe refund completed | Customer | Order ID, refund amount |
| Low-stock alert | Stock ≤ threshold | Admin | Product name, current stock, link to product |

### Email Design Requirements

- All emails shall use responsive HTML templates in `emails/`
- Brand colors and logo shall be applied per the design system
- Unsubscribe link shall be included in all marketing-related emails
- Transactional emails (order, shipping) shall not include unsubscribe per CAN-SPAM
