# Epics & User Stories — PineNova Ecommerce Platform

| Document Owner | Product Team |
|---|---|
| Version | 2.0 |
| Base Documents | BRD.md, FRD.md, NFR.md |

---

## Epic E1 — Product Catalogue

**Description:** As a customer, I want to browse, search, filter, and view products so that I can discover and evaluate items to purchase.

**Business Value:** Core revenue driver — the catalogue is the primary customer touchpoint for product discovery.

---

### US-E1-01 — Browse Products by Category

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to browse products by category (Bags, Wallets, Belts, Footwear) so that I can quickly find items I'm interested in. |
| **Business Value** | Enables intuitive navigation; reduces time-to-product-discovery, increasing conversion likelihood |
| **Priority** | P0 — Must Have |
| **Story Points** | 5 |
| **Dependencies** | None |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Happy path | I am on the home page | I click a category card (e.g. "Bags") | I see a listing page showing exactly the 3 products in that category with name, image, and price |
| Empty category | A category exists with no published products | I navigate to that category via URL | I see an empty state message "No products in this category yet" |

**Negative Scenarios**

- An invalid category slug in the URL returns a 404 page
- A deactivated/deleted category returns a 404 page

**Validation Rules**

- Category slug must be one of: `bags`, `wallets`, `belts`, `footwear`
- Products must have `published: true` to appear in category listing

**Edge Cases**

- Category with only out-of-stock products — products still appear with "Out of Stock" badge
- URL case sensitivity — `/category/Bags` and `/category/bags` resolve to the same page

---

### US-E1-02 — View Product Detail Page

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to view a detailed product page with images, description, price, and stock status so that I can make an informed purchase decision. |
| **Business Value** | Provides the information needed to convert browsing into a cart add |
| **Priority** | P0 — Must Have |
| **Story Points** | 5 |
| **Dependencies** | US-E1-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Happy path | I am on a product detail page for an in-stock item | The page loads | I see product name, description, price ($49–$289), at least one image, stock status "In Stock", material badge, and add-to-cart button |
| Out-of-stock product | The product has zero inventory | I view the product page | I see "Out of Stock" label, the add-to-cart button is disabled, and no quantity selector is shown |

**Negative Scenarios**

- A non-existent slug returns a 404 page
- A product with `published: false` is not accessible via URL (redirect or 404)

**Validation Rules**

- Price must be displayed with 2 decimal places and USD symbol
- Stock quantity 0 = "Out of Stock"; stock ≥ 1 = "In Stock"
- Slug must be URL-safe and unique

**Edge Cases**

- Product with no images — show a placeholder image
- Product with a very long description (> 5000 chars) — text truncates with "Read more" expand
- Price at boundary values ($49.00 and $289.00) display correctly

---

### US-E1-03 — Search Products

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to search products by name or keyword so that I can find specific items without navigating the full catalogue. |
| **Business Value** | Improves UX for goal-oriented shoppers; reduces bounce rate |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E1-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Match found | Products exist with names containing the search term | I type "wallet" in the search bar and submit | I see search results showing all products whose name or description contains "wallet" |
| No match | No products match the search term | I search for "xyzzy" | I see an empty state message "No products found for 'xyzzy'" with a suggestion to browse categories |

**Negative Scenarios**

- Empty search string — no search is performed; the user stays on the current page
- Search string with only whitespace — treated as empty; no search performed
- SQL injection attempt via search field — returns zero results (safe due to Prisma parameterization)

**Validation Rules**

- Search term max 200 characters
- Search term is trimmed and sanitized
- Search is case-insensitive
- Minimum search term length: 2 characters

**Edge Cases**

- Search matches partial words (e.g. "wal" should match "Wallet")
- Search with special characters (e.g. "belt — brown") — special chars escaped
- Search across both name and description fields
- Rapid successive searches debounced at 300ms

---

### US-E1-04 — Filter and Sort Products

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to filter products by price range and sort by price or name so that I can narrow down choices to match my budget and preference. |
| **Business Value** | Reduces cognitive load on category pages; improves discovery efficiency |
| **Priority** | P1 — Should Have |
| **Story Points** | 5 |
| **Dependencies** | US-E1-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Filter by price range | I am on a category page | I set a price filter from $50 to $100 and apply | I see only products whose price falls within $50–$100 |
| Sort by price ascending | I am on a category page with multiple products | I select "Price: Low to High" from sort dropdown | Products are displayed from lowest to highest price |
| Combined filter + sort | I apply a price filter and select a sort order | Both controls are active | Results are filtered AND sorted according to both selections |

**Negative Scenarios**

- Min price > max price — filter returns zero results with a message
- Price filter outside product range (e.g. $0–$10) — returns zero results

**Validation Rules**

- Min price: decimal ≥ 0; Max price: decimal ≤ 10000
- Min price must be ≤ max price
- Sort options: `price_asc`, `price_desc`, `name_asc`, `name_desc`, `newest`

**Edge Cases**

- Only one product in the category — sorting has no visible effect but does not error
- Price filter boundary values — $49.00 and $289.00 inclusive
- All products out of stock — they still appear in filtered results with "Out of Stock" label
- Filter applied then removed — returns to unfiltered full category

---

### US-E1-05 — Admin Product CRUD

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to create, read, update, and delete products so that I can manage the catalogue without engineering involvement. |
| **Business Value** | Enables self-service catalogue management; reduces operational dependency on engineering |
| **Priority** | P0 — Must Have |
| **Story Points** | 8 |
| **Dependencies** | US-E1-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Create product | I am on the admin product manager page | I click "Add Product", fill all required fields, and submit | The new product appears in the product list; slug auto-generated; stock defaults to 0 |
| Update product | A product exists | I click "Edit", change the price and description, and save | The product detail page reflects the updated values |
| Delete product | A product has zero associated orders | I click "Delete" and confirm | The product is removed from the catalogue and no longer appears on any listing page |
| View product list | I am an authenticated admin | I navigate to the admin product manager | I see a table of all products with columns: name, category, price, stock, status, actions |

**Negative Scenarios**

- Create with missing required fields — form does not submit; validation errors shown inline
- Create with price outside $49–$289 — validation error; form not submitted
- Update with invalid data — changes rejected; previous values preserved
- Delete product with active orders — conflict error: "Cannot delete product with active orders. Disable it instead."
- Non-admin user attempts to access `/admin/products` — 403 Forbidden

**Validation Rules**

- Name: required, max 200 chars, globally unique
- Price: required, decimal, $49.00 ≤ price ≤ $289.00
- Stock: integer ≥ 0
- Description: max 5000 chars
- Images: max 5, each JPEG or PNG, max 5 MB each
- Category: must be one of the 4 defined categories

**Edge Cases**

- Create product with same name as an existing product in a different category — allowed
- Update product to set stock to 0 — shows as out of stock on frontend
- Upload non-image file — rejected with file type error
- Upload image larger than 5 MB — rejected with size error
- Network failure during save — show error toast; data preserved in form

---

## Epic E2 — User Authentication & Accounts

**Description:** As a customer, I want to register, log in, and manage my account so that I can securely access the platform and complete purchases.

**Business Value:** Mandatory account requirement (guest checkout disabled) makes this the gateway to all purchase activity.

---

### US-E2-01 — Register with Email & Password

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a new customer, I want to create an account with my email and password so that I can log in and make purchases. |
| **Business Value** | First step in the purchase funnel; enables order traceability and repeat business |
| **Priority** | P0 — Must Have |
| **Story Points** | 5 |
| **Dependencies** | None |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Successful registration | I am a new user on the registration page | I enter valid first name, last name, email, password, confirm password, and submit | My account is created; I receive a welcome email; I am logged in and redirected to the home page |
| Duplicate email | An account with my email already exists | I attempt to register with the same email | I see an error "An account with this email already exists." with a link to log in |

**Negative Scenarios**

- Password does not meet complexity requirements — inline validation error shown
- Confirm password does not match password — inline validation error shown
- Email format is invalid (e.g. "notanemail") — validation error shown
- All fields empty — form does not submit; each field shows "Required" error
- Email with trailing whitespace — trimmed before validation

**Validation Rules**

- Email: required, valid format (RFC 5322), max 255 chars, unique in database
- Password: required, min 8 chars, must contain uppercase, lowercase, and digit
- First name: required, max 100 chars, alphabetic + hyphens + apostrophes
- Last name: required, max 100 chars, alphabetic + hyphens + apostrophes
- Confirm password: must match password

**Edge Cases**

- Email with plus-addressing (e.g. `user+test@example.com`) — treated as unique; stored as-is
- Very long first/last name (exactly 100 chars) — accepted
- Password exactly 8 characters meeting all requirements — accepted
- Rate limit: max 3 registration attempts per IP per hour — exceeded returns 429

---

### US-E2-02 — Log In with Email & Password

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a returning customer, I want to log in with my email and password so that I can access my account and place orders. |
| **Business Value** | Enables returning customer conversion; required for all checkout flows |
| **Priority** | P0 — Must Have |
| **Story Points** | 5 |
| **Dependencies** | US-E2-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Successful login | I have a registered account | I enter correct email and password and submit | I receive a JWT access token and refresh token; I am redirected to my previous page or home |
| Invalid credentials | I have a registered account | I enter an incorrect password | I see "Invalid email or password." No indication of which field is wrong |
| Account disabled | My account has been disabled by an admin | I attempt to log in | I see "Your account has been disabled. Please contact support." |

**Negative Scenarios**

- Non-existent email — "Invalid email or password." (same message as wrong password, no user enumeration)
- Empty fields — form does not submit; inline validation errors
- 5 failed attempts within 15 minutes — account temporarily locked; "Too many failed attempts. Try again later." shown
- Expired access token used for subsequent API call — 401; client uses refresh token

**Validation Rules**

- Email: required, valid format
- Password: required
- Failed login counter: increments on 401, resets on successful login or after 15 minutes
- Rate limit: 5 attempts per email per 15 minutes

**Edge Cases**

- Login immediately after registration — works; session established
- User logged in on multiple devices — both sessions valid; each has independent token pair
- Token expiry during checkout — refresh token rotates seamlessly
- Login with leading/trailing whitespace in email — trimmed before lookup

---

### US-E2-03 — Social Login via OAuth

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to log in using my Google or Apple account so that I can skip password creation and sign up faster. |
| **Business Value** | Reduces registration friction; improves conversion rate for social-first users |
| **Priority** | P2 — Nice to Have |
| **Story Points** | 8 |
| **Dependencies** | US-E2-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| First-time social login | I have a Google account but no PineNova account | I click "Continue with Google" and complete the OAuth flow | A new account is created using my Google profile data; I am logged in and redirected home |
| Returning social login | I previously registered via Google | I click "Continue with Google" | I am logged in immediately without any additional prompts |
| Email conflict | I already have a PineNova account with email X | I attempt social login with a different provider that also uses email X | The accounts are linked; I am logged in |

**Negative Scenarios**

- OAuth provider returns an error or user denies permissions — error displayed; user returned to login page
- OAuth token expired or invalid — re-prompt for authentication
- OAuth provider is unavailable — login page shows "Provider temporarily unavailable" on the button
- User revokes app access in provider settings — next login attempt re-prompts for consent

**Validation Rules**

- ID token must have valid signature, nonce, and issuer
- Email from provider must be verified (Google/Apple provides `email_verified: true`)
- Provider `sub` (subject) + provider name uniquely identifies the social account

**Edge Cases**

- Social login with the same provider but different email than existing account — creates separate account
- User registered via email+password first, then uses social login with same email — accounts merged
- Apple's private relay email — treated as a valid unique email

---

### US-E2-04 — Password Reset

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to reset my password via email so that I can regain access to my account if I forget my credentials. |
| **Business Value** | Self-service account recovery reduces support tickets |
| **Priority** | P1 — Should Have |
| **Story Points** | 5 |
| **Dependencies** | US-E2-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Request reset | I have a registered account | I enter my email on the forgot-password page and submit | A password reset email is sent to that address with a secure link |
| Complete reset | I click the reset link from my email | I enter a new valid password and confirm | My password is updated; I am redirected to login with a success message |
| Non-existent email | I enter an email not associated with any account | I submit the forgot-password form | I see "If an account with that email exists, a reset link has been sent." (no user enumeration) |

**Negative Scenarios**

- Expired reset token (older than 1 hour) — "This reset link has expired. Please request a new one."
- Used reset token (already consumed) — "This reset link has already been used. Please request a new one."
- Weak new password — validation error; password not updated
- Rate limit: max 1 reset request per email per 5 minutes — excess requests ignored

**Validation Rules**

- Reset token: cryptographically random, single-use, expires in 1 hour
- New password: same rules as registration (min 8 chars, uppercase, lowercase, digit)
- Email: required, valid format

**Edge Cases**

- User requests multiple resets — only the latest token is valid; previous ones invalidated
- User closes the reset page without completing — token remains valid until expiry
- Reset link clicked on a different device/browser — works as long as token is valid

---

### US-E2-05 — Manage Profile (Including Saved Addresses)

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to update my profile (name, email, shipping addresses) so that my information stays current for orders and checkout is faster. |
| **Business Value** | Reduces failed deliveries due to stale address data; saved addresses speed up checkout; improves customer satisfaction |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E2-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Update name | I am on my profile page | I change my first or last name and save | The profile displays the updated name; order history still shows previous name on past orders |
| Add shipping address | I have no saved addresses | I add a new address with all required fields | The address appears in my saved addresses list and is selectable at checkout |
| Change email | I am on my profile page | I enter a new email and submit my current password for verification | The email is updated; a confirmation email is sent to the new address |
| Saved address at checkout | I have a saved address in my profile | I reach the checkout shipping step | My saved address is pre-selected; I can confirm or choose a different saved address |

**Negative Scenarios**

- New email already in use by another account — "This email is already in use."
- Invalid address fields — inline validation errors shown
- Incorrect current password when changing email — "Current password is incorrect."

**Validation Rules**

- Name fields: max 100 chars, alphabetic + hyphens + apostrophes
- Email: valid format, max 255 chars, unique
- Shipping address: street (required, max 200), city (required, max 100), state (required, max 100), zip (required, valid format), country (required)
- Current password required for email change

**Edge Cases**

- User has 10 saved addresses — UI shows scrollable list; no hard limit enforced
- User updates email to the same email — no change; success message "No changes detected"
- User changes name immediately after placing an order — order retains the name at time of purchase (snapshot)

---

### US-E2-06 — JWT Token Refresh

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want my session to stay active without repeatedly logging in so that I have a seamless browsing and checkout experience. |
| **Business Value** | Reduces friction during longer shopping sessions; improves conversion |
| **Priority** | P0 — Must Have |
| **Story Points** | 3 |
| **Dependencies** | US-E2-02 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Token refresh before expiry | I have a valid access token nearing expiry (last 2 minutes) | My client calls the refresh endpoint with my refresh token | A new access token and a new refresh token are issued; the old refresh token is invalidated |
| Refresh after expiry | My access token has expired | My client automatically calls the refresh endpoint | I continue my session without interruption; a new token pair is issued |
| Refresh token expired | Both access and refresh tokens have expired | My client attempts to refresh | The refresh fails with 401; the user is redirected to login |

**Negative Scenarios**

- Reusing an old refresh token after rotation — both the old and new refresh tokens are invalidated (token theft detection)
- Invalid refresh token format — 401 Unauthorized
- Refresh token from a different user — 401 Unauthorized

**Validation Rules**

- Access token TTL: 15 minutes
- Refresh token TTL: 7 days
- Refresh token: cryptographically random, stored as hash in database
- Rotation: each refresh invalidates the previous refresh token

**Edge Cases**

- User stays on the site for 8 hours — refresh token rotates multiple times seamlessly; session persists up to 7 days
- User logs out — refresh token explicitly invalidated; access token remains valid until natural expiry
- Clock skew between server and client — handled via `leeway` of 30 seconds on JWT validation

---

## Epic E3 — Shopping Cart

**Description:** As a customer, I want to add products to a cart and manage quantities so that I can prepare an order for checkout.

**Business Value:** Cart is the intermediate step between product discovery and purchase; a reliable cart directly impacts conversion rate.

---

### US-E3-01 — Add Items to Cart

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to add a product to my cart with a selected quantity so that I can collect items I intend to purchase. |
| **Business Value** | Core conversion step; without cart functionality no orders can be placed |
| **Priority** | P0 — Must Have |
| **Story Points** | 5 |
| **Dependencies** | US-E1-02, US-E2-02 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Add single item | I am on a product detail page for an in-stock item | I select quantity 1 and click "Add to Cart" | The item is added to my cart; a confirmation toast appears; the cart badge increments |
| Add multiple quantities | I am on a product detail page | I select quantity 3 and click "Add to Cart" | 3 units of the product are added to my cart |
| Add same item twice | The product is already in my cart | I add it again with quantity 2 | The cart quantity updates to previous qty + 2 |

**Negative Scenarios**

- Add item when not logged in — redirected to login page; redirected back to PDP after login
- Add item with quantity 0 or negative — quantity selector prevents this (min 1)
- Add item that is out of stock — "Add to Cart" button is disabled; action not possible
- Add quantity exceeding available stock — limited to available stock; user notified "Only X available"

**Validation Rules**

- Quantity: integer ≥ 1
- Quantity must not exceed available stock at time of addition
- User must be authenticated (CUSTOMER role)
- Product must be published and not deleted

**Edge Cases**

- Add item to cart that was previously in stock but sold out between page load and add — stock checked server-side; rejected with message
- Network failure during add — optimistic UI shows the add; on error, toast shows "Failed to add item"; cart reverts
- Very large quantity (e.g. 999) — capped by stock; if stock is high enough, allowed
- Adding item while cart has items from a previous session — merged correctly

---

### US-E3-02 — Update Cart Quantities

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to increase or decrease item quantities in my cart so that I can adjust my order before checkout. |
| **Business Value** | Provides order flexibility; reduces cart abandonment from quantity errors |
| **Priority** | P0 — Must Have |
| **Story Points** | 3 |
| **Dependencies** | US-E3-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Increase quantity | A product is in my cart with quantity 1 | I click "+" to increase | Quantity updates to 2; line total recalculates; cart summary updates |
| Decrease quantity | A product is in my cart with quantity 3 | I click "−" to decrease | Quantity updates to 2; line total recalculates |
| Decrease to zero | A product is in my cart with quantity 1 | I click "−" | The item is removed from the cart (decrease below 1 = remove) |

**Negative Scenarios**

- Increase quantity beyond available stock — quantity capped at stock level; tooltip "Only X available"
- Update quantity on an item that was removed by admin or became unpublished — item shows as unavailable; option to remove

**Validation Rules**

- New quantity: integer ≥ 1 (decrementing from 1 removes the item)
- New quantity must not exceed current stock
- Stock re-checked server-side on each update

**Edge Cases**

- Rapid quantity clicks — debounced; only the final value sent to server
- Two browser tabs open with same cart — last write wins; no merge conflicts
- Quantity update during checkout — prevented; cart is locked during active checkout session

---

### US-E3-03 — Remove Items from Cart

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to remove items from my cart so that I can remove products I no longer wish to purchase. |
| **Business Value** | Standard cart functionality; without it users may abandon the entire cart |
| **Priority** | P0 — Must Have |
| **Story Points** | 2 |
| **Dependencies** | US-E3-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Remove single item | My cart has 2+ items | I click the trash/remove icon on one item | The item is removed; the cart summary updates; a confirmation toast "Item removed" appears with an "Undo" option |
| Remove last item | My cart has exactly 1 item | I remove it | The cart is now empty; the empty cart state is displayed |
| Bulk remove | My cart has multiple items | I click "Clear Cart" | All items are removed; confirmation dialog shown first |

**Negative Scenarios**

- Remove item from empty cart — no action; button disabled
- Remove item that was already removed (double-click) — idempotent; second click has no effect

**Validation Rules**

- Item must belong to the authenticated user's cart
- Item must exist in the cart

**Edge Cases**

- Undo removal — item restored with previous quantity; timeout of 5 seconds for undo action
- Remove item that was marked unavailable by admin — removed with message "This item is no longer available"
- Network failure during remove — optimistic removal; on error, item reappears with error toast

---

### US-E3-04 — Cart Expiry & Cleanup

| Field | Value |
|---|---|
| **Persona** | System |
| **User Story** | As the system, I want to expire abandoned carts after 30 days of inactivity so that stale cart data does not accumulate in the database. |
| **Business Value** | Prevents database bloat; avoids confusion when users return to an unchanged cart after weeks |
| **Priority** | P2 — Nice to Have |
| **Story Points** | 2 |
| **Dependencies** | US-E3-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Cart expires | A cart has had no activity for 30 days | A scheduled cleanup runs | The cart and all its items are deleted; the user sees an empty cart on next login |
| Active cart preserved | A cart had activity 15 days ago | The cleanup runs | The cart and all its items are preserved |
| Notification on expired cart | My cart was cleaned up while I was logged out | I log in again | I see a toast or banner "Your previous shopping cart has expired. Start fresh!" |

**Negative Scenarios**

- Cleanup runs while user has the cart open in a browser tab — the next API call will return empty cart; gracefully handled

**Validation Rules**

- Cart expiry: 30 days from `updatedAt` timestamp
- Cleanup runs daily via a scheduled job or serverless cron
- Expired cart deletion is permanent; no undo

**Edge Cases**

- Cart with items that are now out of stock or deleted — cleanup runs regardless; items would be unavailable anyway
- User has a cart and is mid-checkout (Stripe session created) — cart not expired until 30 days after last activity, which includes the checkout session creation timestamp

---

### US-E3-05 — View Cart Summary

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to view my cart with subtotal, tax, shipping, and total so that I understand the full cost before checkout. |
| **Business Value** | Price transparency reduces checkout surprises and abandonment |
| **Priority** | P0 — Must Have |
| **Story Points** | 3 |
| **Dependencies** | US-E3-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Cart below free shipping threshold | My cart subtotal is $80 | I view the cart page | I see: subtotal $80.00, tax (10%) $8.00, shipping $8.00, total $96.00; free shipping threshold message "Add $40 more for free shipping" |
| Cart at or above free shipping threshold | My cart subtotal is $130 | I view the cart page | I see: subtotal $130.00, tax (10%) $13.00, shipping $0.00 (Free), total $143.00 |
| Empty cart | My cart has no items | I navigate to the cart page | I see an empty cart illustration and message "Your cart is empty" with a "Continue Shopping" link |

**Negative Scenarios**

- Cart with item that has been deleted by admin — item shown as "Unavailable" with option to remove; not included in totals
- Cart with price that has changed since addition — item shows current price with a note "Price has changed since added"

**Validation Rules**

- Subtotal: sum of (unit price × quantity) for each available item
- Tax: 10% of subtotal, rounded to 2 decimal places
- Shipping: $0.00 if subtotal ≥ $120.00; $8.00 otherwise
- Total: subtotal + tax + shipping

**Edge Cases**

- Cart with 0 items after removing unavailable items — empty cart state shown
- Very large cart (e.g. 10 items) — scrollable list; summary always visible in sidebar/sticky footer
- Subtotal exactly $120.00 — qualifies for free shipping (boundary: ≥ $120)
- Tax on $120.00 subtotal = $12.00; shipping = $0.00; total = $132.00

---

## Epic E4 — Checkout & Payments

**Description:** As a customer, I want to complete my purchase by providing a shipping address and paying via Stripe so that my order is processed.

**Business Value:** The final conversion step; directly generates revenue.

---

### US-E4-01 — Enter Shipping Address

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to enter my shipping address during checkout so that my order is delivered to the correct location. |
| **Business Value** | Required data for order fulfillment; incomplete addresses cause failed deliveries |
| **Priority** | P0 — Must Have |
| **Story Points** | 3 |
| **Dependencies** | US-E2-02, US-E3-04 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Enter new address | I have no saved addresses | I fill in all required address fields and submit | The address is saved to my profile; I proceed to the payment step |
| Select saved address | I have a saved address from my profile | I select it from a dropdown or list | The address is auto-filled; I can confirm or edit; I proceed to payment |
| Edit address during checkout | I selected a saved address | I click "Edit" on a field | The field becomes editable; changes apply to this order only (not saved to profile unless explicitly saved) |

**Negative Scenarios**

- Required field missing — inline validation error; form not submitted
- Invalid zip code format — validation error "Please enter a valid ZIP code"
- Address too long — character limit enforced per field

**Validation Rules**

- Street: required, max 200 chars
- City: required, max 100 chars
- State: required, must be a valid US state or province (for international)
- Zip: required, valid format for selected country
- Country: required; defaults to "United States"
- Phone: optional, valid format if provided

**Edge Cases**

- International address with non-US format — fields adjust based on selected country
- Address with apartment/unit number — accommodated in street field
- P.O. Box address — allowed; shipping carrier limitations noted in a tooltip
- User navigates back from payment to change address — previously entered values pre-filled

---

### US-E4-02 — Review Order Summary

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to review my order summary (items, quantities, prices, tax, shipping, total) before paying so that I can confirm everything is correct. |
| **Business Value** | Reduces post-purchase disputes and return requests |
| **Priority** | P0 — Must Have |
| **Story Points** | 3 |
| **Dependencies** | US-E4-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Review before payment | I have entered my shipping address | I land on the order review step | I see a read-only summary: item list with quantities and prices, subtotal, tax, shipping, total, and shipping address; a "Pay Now" button is visible |
| Items changed from cart | An item in my cart became unavailable between cart and review | The review page loads | The unavailable item is flagged as "No longer available" and is excluded from the summary; a message explains the change |

**Negative Scenarios**

- No items available to purchase (all removed) — redirected to cart with message
- Cart total changed due to price update — updated prices shown with note "Prices have been updated since you added them"

**Validation Rules**

- All line items must be currently available and in stock
- Prices and calculations are computed server-side at the time of review (not from cart snapshot)
- The order summary is read-only; user must go back to cart to make changes

**Edge Cases**

- User stays on review page for 15+ minutes — stock re-validated on page load or on "Pay Now" click
- Browser refresh during review — page reloads with current cart state; no data loss
- Item price decreased — customer gets the lower price (advantageous)

---

### US-E4-03 — Pay via Stripe Checkout Session

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to pay securely using a credit card via Stripe so that my payment is processed safely and my card data is never exposed to the merchant. |
| **Business Value** | PCI scope reduction via Stripe Checkout; trusted payment UX improves conversion |
| **Priority** | P0 — Must Have |
| **Story Points** | 8 |
| **Dependencies** | US-E4-02 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Successful payment | I am on the order review page | I click "Pay Now" | I am redirected to Stripe Checkout; I complete payment on Stripe's hosted page; I am redirected back to the order confirmation page |
| Payment cancelled | I am redirected to Stripe Checkout | I decide not to pay and click "Cancel" | I am redirected back to the order review page with a message "Payment was cancelled" |
| Payment failed | I am on Stripe Checkout | I enter card details that trigger a decline | Stripe shows the decline message; I can try a different card; my cart is preserved |

**Negative Scenarios**

- Stripe Checkout fails to load (JS error, network) — error message "Unable to load payment form. Please try again."
- Stock changed between review and payment — Stripe session creation fails; user redirected to cart with explanation
- User closes browser during Stripe redirect — no order created; cart preserved for next login

**Validation Rules**

- Stripe Checkout Session created with: line items, customer email, success URL, cancel URL
- Session `mode: "payment"`; `line_items` prices from Stripe Price objects
- Stock re-validated before session creation
- Idempotency key used for session creation to prevent duplicate charges

**Edge Cases**

- Stripe Checkout in test mode — uses test card numbers; no real charges
- User has ad blocker — Stripe iframe may be blocked; fallback messaging
- Very slow Stripe response — loading spinner with 30-second timeout; error if exceeded
- User pays with a currency not supported — Stripe handles conversion

---

### US-E4-04 — Receive Order Confirmation

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to see an order confirmation page and receive a confirmation email after successful payment so that I know my order was placed successfully. |
| **Business Value** | Builds trust; provides order reference for customer support inquiries |
| **Priority** | P0 — Must Have |
| **Story Points** | 3 |
| **Dependencies** | US-E4-03 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Successful payment | Payment was completed on Stripe | I am redirected back from Stripe | I see an order confirmation page with: order ID, item list, total, shipping address, and a "Thank you" message; a confirmation email is sent to my registered email |
| Email delivery delay | The order is confirmed | The email service is temporarily slow | The order confirmation page is shown immediately; the email is queued and sent when the service recovers |

**Negative Scenarios**

- User navigates away from confirmation page before it loads — order is still created; user can find it in Order History
- Confirmation page fails to load (server error) — order is still created; email sent; user can access order via Order History
- Email bounces (invalid email) — order still confirmed; admin can see email delivery failure in logs

**Validation Rules**

- Order ID is a UUID — displayed on confirmation page
- Confirmation page content is generated server-side (not client-side rendering of API data)
- Email sending is asynchronous — does not block the confirmation page response

**Edge Cases**

- User refreshes the confirmation page — page reloads with same order data; no duplicate order created
- User bookmarks the confirmation URL — accessible as long as the order belongs to the user
- Confirmation page accessed by a different user — 403 Forbidden

---

### US-E4-05 — Stripe Webhook Order Processing

| Field | Value |
|---|---|
| **Persona** | System |
| **User Story** | As the system, I want to listen for Stripe `checkout.session.completed` webhooks so that orders are created and inventory is deducted only when payment is confirmed. |
| **Business Value** | Ensures order-payment integrity; prevents double-charge and ghost orders |
| **Priority** | P0 — Must Have |
| **Story Points** | 8 |
| **Dependencies** | US-E4-03 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Successful webhook | Stripe sends a `checkout.session.completed` event | The webhook endpoint receives it with a valid signature | An order is created with status `confirmed`; inventory is decremented atomically; a confirmation email is sent; 200 is returned to Stripe |
| Single item deduction | A confirmed order contains 1 item with quantity 2 | The webhook handler processes the order | The product stock is reduced by exactly 2 |
| Multi-item deduction | A confirmed order contains 3 different items | The webhook handler processes the order | Each product's stock is reduced by its respective quantity |
| Duplicate event | Stripe sends the same `checkout.session.completed` event twice | The webhook endpoint receives both | The first event creates the order; the second event is detected as a duplicate via idempotency key and returns 200 without any side effects |
| Expired session | Stripe sends a `checkout.session.expired` event | The webhook endpoint receives it | The associated cart session is cleaned up; no order is created |
| Concurrent orders for last unit | Two customers order the last unit simultaneously | Both webhooks arrive near-simultaneously | One order succeeds (stock 0); the other fails the stock check and the entire transaction rolls back; the failed order is flagged for admin review |

**Negative Scenarios**

- Invalid Stripe signature — webhook returns 400; event is not processed
- Database write fails after receiving valid webhook — error logged; Stripe will retry (up to 3 times with exponential backoff)
- Webhook received for a session that was already fully processed — idempotency check returns 200; no duplicate
- Stock goes negative due to a bug — prevented by `CHECK (stock >= 0)` constraint at database level
- Deduction attempted for a deleted product — error logged; admin alerted; order still created (product snapshot preserved)

**Validation Rules**

- Stripe signature verified via `stripe.webhooks.constructEvent()` using the webhook secret
- Idempotency key stored in database; duplicate keys rejected
- Order creation and inventory deduction in the SAME database transaction (`prisma.$transaction`)
- `stock >= 0` constraint enforced at database level
- If any line item has insufficient stock, the entire transaction rolls back
- Webhook handler runs in Express (the only permitted Express exception) for retry middleware

**Edge Cases**

- Webhook received but the corresponding user was deleted — order still created (order is independent of user existence); admin handles
- Webhook received but the product was deleted — order created with a snapshot of product data; admin notified
- Webhook timeout — Stripe retries after 1 hour, then 6 hours, then 24 hours
- Multiple webhooks for the same session arrive out of order — idempotency handles correctly
- Order with quantity greater than available stock — transaction fails; order not created; Stripe charge reversed
- Product has very high stock (e.g. 10000) — deduction works without precision issues
- Refund restores stock — stock incremented by the refunded quantities

---

## Epic E5 — Order Management

**Description:** As a customer and admin, I want to view, track, and manage orders so that orders are fulfilled correctly and transparently.

**Business Value:** Order transparency reduces support tickets; admin fulfillment tools ensure timely delivery.

---

### US-E5-01 — View Order History

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to view a list of my past orders with status and total so that I can track my purchase history. |
| **Business Value** | Improves customer experience; reduces "where is my order" support tickets |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E4-05 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Orders exist | I have placed 3 orders in the past | I navigate to "My Orders" | I see a chronological list (newest first) of my orders showing: order ID (last 8 chars), date, status badge, total amount; each row links to order detail |
| No orders | I am a new customer with no orders | I navigate to "My Orders" | I see an empty state "You haven't placed any orders yet" with a "Start Shopping" link |
| Mixed statuses | I have orders in various statuses | I view the order list | Each order shows its current status with a color-coded badge (confirmed=blue, shipped=green, cancelled=red, etc.) |

**Negative Scenarios**

- Unauthenticated user navigates to `/account/orders` — redirected to login
- User tries to access another user's order history via URL manipulation — 403 Forbidden

**Validation Rules**

- Only orders belonging to the authenticated user are returned
- Pagination: 10 orders per page
- Orders sorted by `createdAt` descending

**Edge Cases**

- User has 50+ orders — pagination controls shown
- An order with a deleted product — product name preserved as snapshot; "(Archived)" note shown
- Very long order ID displayed as truncated UUID with full UUID in tooltip

---

### US-E5-02 — View Order Detail

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to view the full details of a specific order (items, prices, shipping address, status timeline) so that I can track its progress. |
| **Business Value** | Provides transparency; answers common post-purchase questions without contacting support |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E5-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Happy path | I have a confirmed order | I click on it from my order history | I see: full order ID, date placed, status badge, item list with images/names/quantities/prices, subtotal, tax, shipping, total, shipping address, and a status timeline |
| Shipped order | My order status is "shipped" | I view the order detail | The timeline shows all status changes: Confirmed → Processing → Shipped, with timestamps; tracking number displayed if available |
| Cancelled order | My order was cancelled | I view the order detail | The timeline shows the cancellation point; refund info displayed if applicable |

**Negative Scenarios**

- Order ID not found — 404 page
- Order belongs to a different user — 403 Forbidden

**Validation Rules**

- Order detail is read-only for customers
- Timeline entries include: status name, timestamp, and (for admin actions) actor name

**Edge Cases**

- Order status timeline with only one entry ("Confirmed") for very recent orders — shows single point
- Order with refund — refund amount and date shown separately
- Product image no longer exists — placeholder image used

---

### US-E5-03 — Admin Order List & Filter

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to view all orders with filters (status, date, customer) so that I can manage the fulfillment queue. |
| **Business Value** | Core ops tool; without it the team cannot process orders systematically |
| **Priority** | P0 — Must Have |
| **Story Points** | 5 |
| **Dependencies** | US-E4-05 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| View all orders | I am an admin | I navigate to the order manager | I see a table of ALL orders across all customers with columns: order ID, customer name/email, date, status, total; I can sort by each column |
| Filter by status | I want to see only new orders | I select "Confirmed" from the status filter | Only orders with status "confirmed" are displayed |
| Filter by date range | I want to see last week's orders | I enter a date range | Only orders within that date range are displayed |
| Filter by customer | I want to see a specific customer's orders | I type a customer name or email in the search field | Orders matching that customer are displayed |

**Negative Scenarios**

- No orders match filters — "No orders found matching your filters" with a clear-filter button
- Non-admin accesses `/admin/orders` — 403 Forbidden

**Validation Rules**

- Admin role required on the session
- Date range: start date must be before end date
- Pagination: 20 orders per page

**Edge Cases**

- Applying multiple filters simultaneously — AND logic
- CSV export works with filters applied (exports only the filtered set)
- Very large dataset — server-side pagination; no client-side loading of all orders

---

### US-E5-04 — Update Order Status

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to update order status (processing, shipped, delivered, cancelled) so that customers see accurate order progress. |
| **Business Value** | Enables fulfillment workflow; status changes trigger customer notifications |
| **Priority** | P0 — Must Have |
| **Story Points** | 3 |
| **Dependencies** | US-E5-03 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Mark as processing | A confirmed order is ready to fulfill | I select "Processing" from the status dropdown | Order status updates to "processing"; no email sent (internal status) |
| Mark as shipped | The order has been dispatched | I select "Shipped" and optionally enter a tracking number | Order status updates to "shipped"; a shipping notification email is sent to the customer with tracking info |
| Mark as delivered | The customer has received the order | I select "Delivered" | Order status updates to "delivered"; no email sent |
| Cancel order | An order needs to be cancelled before shipping | I select "Cancelled" and enter a reason | Order status updates to "cancelled"; stock is restored; customer receives cancellation email |

**Negative Scenarios**

- Attempt to ship an already-cancelled order — transition disallowed; error "Cannot ship a cancelled order"
- Attempt to cancel a delivered order — transition disallowed; refund must be processed instead
- Tracking number exceeds max length — validation error

**Validation Rules**

- Valid status transitions: `confirmed → processing → shipped → delivered`; any status → `cancelled` (with restrictions); `shipped/delivered` → `refunded` (via refund flow)
- Cancellation reason required when cancelling
- Tracking number: max 100 chars, optional
- Status change logged in audit trail with admin ID and timestamp

**Edge Cases**

- Admin accidentally clicks wrong status — no confirmation dialog for non-destructive transitions; undo not supported (audit logged)
- Status update during webhook processing — race condition prevented by database transaction isolation
- Notification email fails — status still updated; email retry queued

---

### US-E5-05 — Process Refund

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to process a refund via Stripe and update the order status to refunded so that customers are reimbursed for cancelled or returned orders. |
| **Business Value** | Enables customer service resolution; protects merchant reputation |
| **Priority** | P1 — Should Have |
| **Story Points** | 5 |
| **Dependencies** | US-E5-04, US-E12-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Full refund | A shipped order needs a full refund | I click "Refund", select "Full Refund", and confirm | Stripe processes the refund; order status updates to "refunded"; stock is restored; customer receives refund notification email |
| Partial refund | A customer returned only one item from a multi-item order | I select "Partial Refund", enter the amount, and confirm | Stripe processes the partial refund; order status remains "shipped" (or "partially_refunded"); note added to order |

**Negative Scenarios**

- Stripe refund API fails — error displayed; order status unchanged; retry available
- Refund amount exceeds charge amount — validation error
- Attempt to refund an already-refunded order — "This order has already been fully refunded"

**Validation Rules**

- Refund amount must be > 0 and ≤ total charge amount
- Stripe Payment Intent ID must exist on the order
- Reason for refund recorded in audit log
- Stock restored only on full refund; partial refund does not restore stock

**Edge Cases**

- Refund processed but Stripe webhook delayed — order status updated immediately; webhook updates status if needed
- Refund for an order paid via non-Stripe method (future custom payment) — abstracted via payment gateway interface
- Network timeout during Stripe refund call — retry with caution; manual check recommended

---

## Epic E6 — Inventory Tracking

**Description:** As the system and admin, I want to track product stock levels so that customers never order out-of-stock items.

**Business Value:** Prevents overselling, reduces cancellations, and maintains customer trust.

---

### US-E6-02 — Out-of-Stock Display (Category & Cart)

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want out-of-stock products in category listings and my cart to be clearly marked so that I know which items are unavailable. |
| **Business Value** | Eliminates order cancellations due to stock unavailability |
| **Priority** | P0 — Must Have |
| **Story Points** | 2 |
| **Dependencies** | US-E4-05 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Category listing overlay | A product in a category list has stock = 0 | I browse the category | The product still appears in the grid but shows "Out of Stock" overlay/badge; clicking navigates to PDP where full "Out of Stock" display is shown (per PDP story) |
| Cart unavailability | A product in my cart goes out of stock | I view my cart | The item shows as "Unavailable" with option to remove; not included in totals |

**Negative Scenarios**

- All items in a category are out of stock — products still display; grid shows all with "Out of Stock" badges

**Validation Rules**

- Category listing: stock = 0 → "Out of Stock" overlay; stock > 0 → no overlay
- Cart: stock checked server-side on page load; unavailable items flagged
- Stock status not cached for longer than 60 seconds

**Edge Cases**

- Product with stock = 0 but pending restock — still shows "Out of Stock"; no "Back in Stock" notification (future feature)
- Product with stock = 0 in a user's saved-for-later list — shown as out of stock

---

### US-E6-03 — Admin Stock Adjustment

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to manually adjust stock quantities so that I can correct inventory after physical stock counts or inbound shipments. |
| **Business Value** | Enables warehouse ops to keep inventory accurate without database access |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E1-05 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Increase stock | A new shipment arrives | I edit the product and increase stock from 0 to 25 | The product now shows as "In Stock" on the frontend with the updated quantity |
| Decrease stock | A physical count reveals 3 units were damaged | I decrease stock from 20 to 17 | Stock is updated; if the new value is ≤ threshold, low-stock alert triggers |
| Set exact stock | After a physical count, the actual stock is 12 (system shows 10) | I set stock to exactly 12 | Stock is updated to 12 |

**Negative Scenarios**

- Attempt to set stock below 0 — validation error; minimum is 0
- Attempt to set stock for a deleted product — product not found

**Validation Rules**

- Stock: integer ≥ 0
- Reason field required for all manual adjustments (logged in audit trail)
- Previous quantity and new quantity recorded in audit log

**Edge Cases**

- Admin sets stock to 0 — product becomes out of stock on frontend
- Admin increases stock of an out-of-stock product — immediately becomes purchasable
- Two admins adjusting stock simultaneously — last write wins; no merge

---

### US-E6-04 — Low-Stock Alert

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to receive a dashboard notification when stock falls below a configurable threshold so that I can reorder before items go out of stock. |
| **Business Value** | Prevents lost sales from stockouts; enables proactive replenishment |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E6-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Stock drops below threshold | A product's stock falls from 8 to 3 after an order (threshold = 5) | The order is confirmed | A low-stock alert is created; the admin dashboard shows a badge "3 low-stock items" |
| Threshold configured | The threshold is set to 10 | Any product with stock ≤ 10 | Each such product triggers a low-stock alert |
| Stock replenished | A low-stock product is restocked above threshold | An admin increases stock from 3 to 15 | The low-stock alert is automatically resolved and removed from the dashboard |

**Negative Scenarios**

- Threshold set to 0 — effectively disables alerts (only triggers at stock = 0, but out-of-stock handling already covers that)
- Multiple products hit low stock simultaneously — all shown in aggregated dashboard view

**Validation Rules**

- Default threshold: 5 units (configurable per product)
- Alert state: active or resolved
- Alerts are re-evaluated on every stock change (deduction or adjustment)

**Edge Cases**

- Product already low-stock when created (stock = 3, threshold = 5) — alert triggers on creation
- Admin adjusts threshold from 5 to 10 — re-evaluates all products; new alerts created for those between 6–10
- Product deleted while alert is active — alert auto-resolved

---

## Epic E7 — Product Reviews

**Description:** As a customer, I want to read and write product reviews so that I can benefit from other buyers' experiences and share my own.

**Business Value:** Social proof drives purchase confidence and conversion; user-generated content improves SEO.

---

### US-E7-01 — Read Reviews on Product Page

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to read approved reviews with ratings and text on a product page so that I can evaluate others' experience before purchasing. |
| **Business Value** | Social proof increases conversion by 15–30% for products with reviews |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E1-02 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Reviews exist | A product has 5 approved reviews | I scroll to the reviews section on the PDP | I see all 5 reviews sorted newest first; each shows: customer name (first + last initial), rating stars, date, review text |
| No reviews yet | A product has zero approved reviews | I scroll to the reviews section | I see "No reviews yet. Be the first to review this product!" with a CTA to write one (if authenticated) |
| Average rating | A product has multiple reviews | The PDP loads | The average rating (e.g. 4.2/5) and total review count (e.g. "12 reviews") are displayed near the product title |

**Negative Scenarios**

- Unauthenticated user sees reviews but cannot see the write-review form — CTA shows "Log in to write a review"
- Review contains profanity — filtered by admin moderation; not shown until approved

**Validation Rules**

- Only reviews with `status: "approved"` are visible to customers
- Reviews sorted by `createdAt` descending
- Pagination: 10 reviews per page (if > 10 reviews)
- Average rating rounded to 1 decimal place

**Edge Cases**

- Product with 100+ reviews — paginated; oldest reviews eventually hidden behind page 2+
- Review written by a deleted user — shown as "Former customer"
- Very long review text (> 2000 chars) — truncated with "Read more" expand

---

### US-E7-02 — Submit a Review

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As an authenticated customer who has purchased a product, I want to submit a review with a star rating and text so that I can share my experience with other shoppers. |
| **Business Value** | Generates UGC; builds community trust; improves product page SEO |
| **Priority** | P1 — Should Have |
| **Story Points** | 5 |
| **Dependencies** | US-E7-01, US-E2-02 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Submit review | I purchased the product and am logged in | I select 4 stars, write a review, and submit | The review is created with status "pending" (awaiting moderation); a success message "Thank you for your review!" is shown |
| Edit review | I submitted a review less than 30 days ago | I click "Edit" on my review | The form pre-fills with my existing rating and text; I update and save; the review returns to "pending" for re-moderation |
| Delete my review | I submitted a review | I click "Delete" on my review | The review is removed after confirmation; it no longer appears anywhere |

**Negative Scenarios**

- Submit without purchasing — the review form is not available; message "You can only review products you've purchased"
- Submit duplicate review for the same product — "You have already reviewed this product. You can edit your existing review."
- Empty review text — validation error; rating alone is not sufficient
- Rating of 0 — not allowed; minimum 1 star

**Validation Rules**

- Rating: integer 1–5 (required)
- Body: max 2000 chars (required)
- One review per product per user (enforced at database level)
- Only customers with a confirmed order containing the product may review
- Edit window: 30 days from submission

**Edge Cases**

- User purchases the same product twice — still only one review allowed
- User submits review immediately after purchase — allowed (no waiting period)
- Very short review (e.g. "Great!") — accepted (min length 1 char)
- Review with only emojis — accepted; stored as text

---

### US-E7-03 — Moderate Reviews (Admin)

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to approve, reject, or delete customer reviews so that inappropriate or fraudulent content does not appear on the platform. |
| **Business Value** | Protects brand reputation; ensures review authenticity |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E7-02 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Approve review | A pending review is appropriate | I click "Approve" | The review status changes to "approved"; it immediately appears on the PDP |
| Reject review | A pending review contains spam | I click "Reject" | The review status changes to "rejected"; it is never shown publicly; the customer is not notified |
| Delete review | An approved review is found to be fraudulent later | I click "Delete" | The review is permanently removed from the database; no longer visible anywhere |

**Negative Scenarios**

- Approve an already-approved review — idempotent; no change
- Delete a non-existent review — not found error
- Non-admin tries to access the moderation interface — 403 Forbidden

**Validation Rules**

- Reviews tabulated by status: pending, approved, rejected
- Review moderation actions logged in audit trail with admin ID
- Report reason field available when rejecting (internal note)

**Edge Cases**

- Admin accidentally approves a review they meant to reject — only option is to delete and ask customer to resubmit
- Bulk approve/reject available for multiple reviews at once
- Customer whose review was rejected can submit a new review for the same product

---

## Epic E8 — Admin Dashboard

**Description:** As an admin, I want a centralized dashboard to manage products, orders, users, and reviews so that I can operate the platform efficiently.

**Business Value:** Reduces operational overhead; enables the business team to run day-to-day ops without engineering support.

---

### US-E8-01 — Dashboard Overview Metrics

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to see key metrics (total orders, revenue, low-stock items, new users) on a dashboard so that I can quickly assess platform health. |
| **Business Value** | Provides at-a-glance business intelligence for daily operations |
| **Priority** | P1 — Should Have |
| **Story Points** | 5 |
| **Dependencies** | US-E1-05, US-E5-03 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| View dashboard | I am an admin | I navigate to `/admin` | I see metric cards: Total Orders (all time), Revenue (today / this week / this month), Low-Stock Items count, New Users (this week); each card shows the number with a trend indicator |
| Low-stock section | One or more products are below threshold | The dashboard loads | A "Low Stock Alerts" section lists affected products with name, current stock, and a link to the product edit page |
| Recent orders | New orders exist | The dashboard loads | A "Recent Orders" table shows the 5 most recent orders with status, total, and a link to order detail |

**Negative Scenarios**

- No orders yet — metrics show $0.00 revenue, 0 orders; empty state for recent orders
- No low-stock items — low-stock section shows "All items are well-stocked ✓"

**Validation Rules**

- Revenue calculated from orders with status `confirmed`, `processing`, `shipped`, or `delivered`
- Metrics computed server-side via aggregated queries
- Dashboard data refreshes on page load (no auto-refresh)

**Edge Cases**

- Revenue includes tax and shipping — shown as separate metric lines or noted
- Very high revenue numbers — formatted with commas (e.g. $12,345.67)
- Timezone for "today" uses UTC (per assumptions)

---

### US-E8-02 — User Management

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to view and manage registered users (disable accounts, view details) so that I can handle account issues and enforce platform policies. |
| **Business Value** | Enables customer support to handle account-related issues directly |
| **Priority** | P1 — Should Have |
| **Story Points** | 5 |
| **Dependencies** | US-E2-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| View users | I am an admin | I navigate to the user manager | I see a table of all users with columns: name, email, role, signup date, order count, status (active/disabled) |
| Disable user | A user is violating platform policies | I click "Disable" on their account and confirm | The user cannot log in; a banner on the login page says "Your account has been disabled"; existing orders remain visible |
| Enable user | A disabled user's issue is resolved | I click "Enable" | The user can log in again normally |
| View user details | I want to investigate a user | I click on a user row | I see full profile, order history, reviews submitted, and account activity log |

**Negative Scenarios**

- Admin tries to disable their own account — prevented; "You cannot disable your own account"
- Disable an already-disabled user — idempotent; no change
- Non-admin accesses user management — 403 Forbidden

**Validation Rules**

- Admin users are visible in the list but cannot be disabled via this interface
- User status: `active` or `disabled`
- User disable/enable logged in audit trail

**Edge Cases**

- User is disabled while logged in — their current session remains valid until token expiry; subsequent API calls rejected
- User has pending orders when disabled — orders remain; admin can still process them
- User with deleted data — anonymized record shown as "Deleted User" with original order data preserved

---

## Epic E9 — Content Marketing & Blog

**Description:** As a customer, I want to read blog articles about sustainable fashion so that I can learn about the brand and products. As an admin, I want to publish content so that we drive organic traffic.

**Business Value:** SEO-driven organic acquisition reduces customer acquisition cost.

---

### US-E9-01 — Browse Blog Articles

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to browse a blog listing page with article cards so that I can find content related to sustainable fashion and the brand. |
| **Business Value** | Drives organic traffic; improves SEO authority |
| **Priority** | P2 — Nice to Have |
| **Story Points** | 3 |
| **Dependencies** | None |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Articles exist | 5 published blog articles exist | I navigate to `/blog` | I see a grid of article cards: each shows featured image, title, excerpt (first 150 chars), publish date, and read time; sorted newest first |
| No articles | No articles are published yet | I navigate to `/blog` | I see an empty state "Blog coming soon!" |
| Pagination | 15 articles exist | I scroll to the bottom of the page | I see pagination controls; 10 articles per page |

**Negative Scenarios**

- Direct URL access to an unpublished article — 404
- Draft articles do not appear in the listing

**Validation Rules**

- Only `published` articles appear in the listing
- Articles sorted by `publishedAt` descending
- Pagination: 10 per page
- Each article card truncated to 150 chars for excerpt

**Edge Cases**

- Article with no featured image — shows a default brand placeholder
- Article with very long title — truncated with ellipsis at 100 chars
- Article published in the future — not shown until `publishedAt` timestamp is reached

---

### US-E9-02 — Read Blog Article

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to read a full blog article with images and formatted text so that I can engage with the brand story and product education content. |
| **Business Value** | Builds brand affinity; increases time-on-site for SEO ranking signals |
| **Priority** | P2 — Nice to Have |
| **Story Points** | 3 |
| **Dependencies** | US-E9-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Happy path | A published article exists | I click on it from the blog listing | I see the full article with: featured image, title, publish date, author, body content (formatted text with images), and social share buttons |
| Loading | The article page is fetching data | I navigate to the article | A skeleton loader is shown while content loads |

**Negative Scenarios**

- Article slug not found — 404 page with link to blog listing
- Article accessed by URL but is a draft — 404 (not accessible)

**Validation Rules**

- Slug: URL-safe, unique
- Meta description: max 160 chars (for SEO)
- Open Graph tags rendered server-side for social sharing

**Edge Cases**

- Article with embedded images that fail to load — alt text displayed; broken image placeholder
- Article with very long body content — scrollable with reading progress indicator
- Share button copies URL; fallback for clipboard API failure

---

### US-E9-03 — Admin Blog CRUD

| Field | Value |
|---|---|
| **Persona** | Admin |
| **User Story** | As an admin, I want to create, edit, publish, and unpublish blog articles so that I can manage the content calendar without engineering involvement. |
| **Business Value** | Enables the marketing team to iterate on content strategy independently |
| **Priority** | P2 — Nice to Have |
| **Story Points** | 5 |
| **Dependencies** | US-E9-01 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Create article | I am an admin | I fill in title, body, meta description, upload a featured image, and click "Save as Draft" | The article is created with status "draft"; it does not appear on the public blog |
| Publish article | A draft article is ready | I click "Publish" | The article status changes to "published"; the `publishedAt` timestamp is set; it appears on the public blog |
| Unpublish article | A published article needs to be taken down | I click "Unpublish" | The article status changes back to "draft"; it is removed from the public blog |
| Edit article | A published article has a typo | I edit the body and save | The public blog reflects the updated content immediately |

**Negative Scenarios**

- Create with empty title — validation error
- Publish with missing featured image — warning "Consider adding a featured image" but allowed
- Delete a published article — confirmation required; article permanently removed

**Validation Rules**

- Title: required, max 200 chars
- Slug: auto-generated from title; unique; editable by admin
- Body: max 50000 chars
- Meta description: max 160 chars (recommended for SEO)
- Status: `draft` or `published`
- Featured image: optional, JPEG/PNG, max 5 MB

**Edge Cases**

- Admin schedules an article for future publication — manual publish only (no scheduled publishing in scope)
- Article with same slug as an existing article — slug auto-appended with a suffix
- Rich text formatting (bold, italic, lists, links) — stored as HTML or Markdown

---

## Epic E10 — Transactional Emails

**Description:** As the system, I want to send transactional emails for order confirmation, shipping updates, and password resets so that customers stay informed.

**Business Value:** Reduces support inquiries; improves customer trust and post-purchase experience.

---

### US-E10-01 — Order Confirmation Email

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to receive an order confirmation email with my order ID, items, and total after purchase so that I have a receipt for my records. |
| **Business Value** | Builds post-purchase trust; provides order reference for support |
| **Priority** | P0 — Must Have |
| **Story Points** | 3 |
| **Dependencies** | US-E4-05 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Email sent | An order is confirmed via webhook | The webhook successfully creates the order | A confirmation email is sent to the customer's registered email within 60 seconds containing: order ID, item list with names/quantities/prices, subtotal, tax, shipping, total, shipping address, and "Thank you" message |
| Email delivery delayed | The email service is experiencing delays | The order is confirmed | The order is still created successfully; the email is queued and retried; the customer can still see the confirmation on the website immediately |

**Negative Scenarios**

- Customer email is invalid — email bounces; order still confirmed; admin sees delivery failure log
- Email template renders incorrectly — validation in CI; preview tool used before deployment

**Validation Rules**

- Email sent asynchronously (does not block webhook response)
- HTML and plain-text versions included
- Brand colors and logo applied per design system

**Edge Cases**

- Customer changes email shortly after ordering — email sent to the email at time of order (snapshot)
- Very long order with 10+ items — all items listed in a scrollable table
- Email viewed on mobile — responsive template

---

### US-E10-02 — Shipping Notification Email

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to receive an email when my order is shipped so that I know it's on its way and can anticipate delivery. |
| **Business Value** | Reduces "where is my order" inquiries; improves satisfaction |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E5-04 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Ship with tracking | An admin sets status to "shipped" and enters a tracking number | The status is saved | A shipping notification email is sent containing: order ID, item names, shipping address, tracking number, carrier name, and link to tracking portal |
| Ship without tracking | An admin sets status to "shipped" without a tracking number | The status is saved | A shipping notification email is sent without tracking details but with an estimated delivery window |

**Negative Scenarios**

- Email fails to send — status still updated; email retry queued; admin notified in dashboard
- Tracking number invalid format — still accepted (admin can enter any format)

**Validation Rules**

- Triggered only on `confirmed → shipped` transition
- Tracking number: max 100 chars, optional
- Carrier name: optional unless tracking number is provided

**Edge Cases**

- Admin corrects a wrong tracking number after email sent — admin can manually re-trigger email
- Order with multiple shipments — not supported in initial scope; single tracking number
- International shipping tracking — carrier links work with international numbers

---

### US-E10-03 — Password Reset Email

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As a customer, I want to receive a password reset email with a secure link so that I can regain access to my account if I forget my password. |
| **Business Value** | Self-service account recovery reduces support tickets |
| **Priority** | P1 — Should Have |
| **Story Points** | 3 |
| **Dependencies** | US-E2-04 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Reset requested | I forgot my password and entered my email | The request is submitted | An email is sent containing a single-use reset link that expires in 1 hour; the link directs to the reset password page with a valid token |
| Link clicked | I open the email and click the link | The token is verified as valid | I see the password reset form where I can enter a new password |

**Negative Scenarios**

- Email not found — no email sent; no indication of whether the email exists (prevents enumeration)
- Token expired — "This reset link has expired. Please request a new one."
- Token already used — "This link has already been used. Please request a new one."

**Validation Rules**

- Token: cryptographically random, minimum 32 bytes
- Token TTL: 1 hour
- Token stored as hash; single-use
- Rate limit: 1 reset request per email per 5 minutes

**Edge Cases**

- User requests multiple resets — only the most recent token is valid
- Reset link opened on a different device/browser — works; no device binding
- User closes the reset page — token remains valid until expiry

---

## Epic E11 — Multi-Currency (USD & INR) & International Shipping

**Description:** As a customer in India, I want to view prices in INR so that I can understand the cost. International shipping is supported to select markets.

**Business Value:** Expands addressable market to India while maintaining US focus.

---

### US-E11-01 — INR Price Display

| Field | Value |
|---|---|
| **Persona** | Customer |
| **User Story** | As an Indian customer, I want to see product prices in INR so that I can understand the cost without manual conversion. |
| **Business Value** | Reduces friction for Indian buyers; opens the Indian market |
| **Priority** | P2 — Nice to Have |
| **Story Points** | 3 |
| **Dependencies** | US-E1-02 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Default USD | I browse without changing currency | I view any product page | Prices are displayed in USD ($) |
| INR selector | I want to see prices in INR | I select "INR" from a currency dropdown in the header | All prices on the page update to INR (₹); my preference is remembered for the session |
| Checkout reverts | I have INR selected | I proceed to checkout | Prices are displayed in USD for payment; a note shows the INR equivalent |

**Negative Scenarios**

- Exchange rate data unavailable — prices remain in USD; a banner "INR rates temporarily unavailable" is shown

**Validation Rules**

- Supported currencies: USD, INR
- INR rate: fixed conversion rate defined in configuration (e.g. ₹83.5 per $1); updated periodically
- Price displayed in INR for reference; checkout always processes in USD
- INR display: "₹" prefix, 2 decimal places, formatted with Indian number grouping

**Edge Cases**

- Customer switches currency at checkout step — reverted to USD for payment
- Browser locale detection overridden by user's currency selector preference
- Session-only preference (not persisted to profile)

---

### US-E11-02 — International Shipping Address

---

## Epic E12 — Custom Payment Methods (Future)

**Description:** As a developer, I want a standard payment gateway interface so that new payment providers can be integrated without modifying core checkout logic.

**Business Value:** Reduces integration cost for future payment methods; improves maintainability.

---

### US-E12-01 — Extensible Payment Gateway Abstraction

| Field | Value |
|---|---|
| **Persona** | Developer |
| **User Story** | As a developer, I want a standard payment gateway interface so that new payment providers can be integrated without modifying core checkout logic. |
| **Business Value** | Reduces integration cost for future payment methods; improves maintainability |
| **Priority** | P2 — Nice to Have |
| **Story Points** | 8 |
| **Dependencies** | US-E4-03 |

**Acceptance Criteria**

| Scenario | Given | When | Then |
|---|---|---|---|
| Gateway interface defined | The payment module exists | I review the abstraction layer | A `PaymentGateway` interface (or abstract class) defines methods: `createCheckoutSession`, `handleWebhook`, `processRefund`, `getPaymentStatus` |
| Stripe implements interface | Stripe is the primary gateway | I review the Stripe implementation | The `StripeGateway` class implements all interface methods using Stripe SDK |
| New gateway added | A new provider needs integration | I create a new class implementing the interface | The new gateway works with the existing checkout flow without modifying any controller or service code |

**Negative Scenarios**

- Gateway fails on `createCheckoutSession` — error propagated to the checkout controller; appropriate user-facing error shown
- Gateway not configured — admin sees "Payment method not available" in checkout

**Validation Rules**

- Interface must be defined in `/lib/payment` with TypeScript types
- Each gateway must be configurable via environment variables
- Gateway selection determined by a strategy pattern or configuration

**Edge Cases**

- No gateways configured — checkout unavailable; admin alerted
- Multiple gateways active — customer can choose at checkout
- Gateway returns unexpected response format — error logged; order not created; admin notified

---

## Summary

| Epic | Stories | P0 | P1 | P2 | Total Points |
|---|---|---|---|---|---|
| E1 — Product Catalogue | 5 | 3 | 2 | 0 | 26 |
| E2 — User Auth & Accounts | 6 | 3 | 2 | 1 | 29 |
| E3 — Shopping Cart | 5 | 4 | 0 | 1 | 15 |
| E4 — Checkout & Payments | 5 | 5 | 0 | 0 | 25 |
| E5 — Order Management | 5 | 2 | 3 | 0 | 19 |
| E6 — Inventory Tracking | 3 | 1 | 2 | 0 | 8 |
| E7 — Product Reviews | 3 | 0 | 3 | 0 | 11 |
| E8 — Admin Dashboard | 2 | 0 | 2 | 0 | 10 |
| E9 — Content Marketing & Blog | 3 | 0 | 0 | 3 | 11 |
| E10 — Transactional Emails | 3 | 1 | 2 | 0 | 9 |
| E11 — Multi-Currency (USD & INR) & International | 2 | 0 | 0 | 2 | 8 |
| E12 — Custom Payment Methods (Future) | 1 | 0 | 0 | 1 | 8 |
| **Total** | **43** | **19** | **16** | **8** | **179** |
