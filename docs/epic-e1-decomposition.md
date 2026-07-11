# Requirement Decomposition — Epic E1: Product Catalogue

| Document Owner | Product Team |
|---|---|
| Version | 1.0 |
| Base | epics-and-stories.md v2.0, FRD.md v1.0, NFR.md v1.0 |

---

## Feature F1.1 — Category Browsing (US-E1-01)

**Story:** As a customer, I want to browse products by category (Bags, Wallets, Belts, Footwear) so that I can quickly find items I'm interested in.

### Tasks

| ID | Task | Type | Subtasks |
|---|---|---|---|
| T1.1.1 | Create Prisma schema for Category and Product models | Technical | Define `Category` model (id, name, slug, description, image, sortOrder, createdAt); define `Product` model (id, name, slug, description, price, categoryId, images[], stock, sku, materialTag, sustainabilityBadge, published, createdAt, updatedAt); define relations; run initial migration; generate seed script with 4 categories and 12 products |
| T1.1.2 | Implement Repository layer for products | Technical | Create `ProductRepository` class with `findByCategory(slug)`, `findBySlug(slug)`, `findAll(filters)`, `findCategories()`; all methods return typed DTOs; Prisma client injected via dependency injection |
| T1.1.3 | Build category listing API endpoint | Technical | Implement `GET /api/products?category=:slug` with pagination (limit/offset); validation via Zod for query params; response includes product cards limited to published products |
| T1.1.4 | Build home page category cards component | Technical | Create server component `CategoryCardGrid` fetching categories from repository; each card shows image, category name, product count; links to `/category/[slug]`; sorted by `sortOrder` |
| T1.1.5 | Build category listing page at `/category/[slug]` | Technical | Create App Router page with dynamic param `slug`; server-side fetch products via repository; render `ProductCardGrid`; handle empty state "No products in this category yet"; include breadcrumb |
| T1.1.6 | Build ProductCard component | Technical | Create reusable `ProductCard` (image, name, price, out-of-stock overlay); responsive grid layout with Tailwind; click navigates to `/products/[slug]` |
| T1.1.7 | Build Breadcrumbs component | Technical | Create reusable `Breadcrumbs` component reading path segments; render `Home > Category Name` on listing pages and `Home > Category > Product Name` on PDP |
| T1.1.8 | Add sitemap entry for category pages | Technical | Add dynamic sitemap entries for each category route |
| T1.1.9 | Unit test: repository layer | Testing | Mock Prisma; test `findByCategory` returns correct products; test `findCategories` returns 4 categories; test unpublished products excluded |
| T1.1.10 | Integration test: category listing API | Testing | Seed test DB with categories + products; hit `GET /api/products?category=bags`; assert 200, correct product count, correct shape |
| T1.1.11 | Integration test: categories list API | Testing | `GET /api/products/categories` returns array of 4 category objects with id, name, slug |
| T1.1.12 | Component test: CategoryCardGrid | Testing | Renders 4 cards with correct links and images; handles zero categories gracefully |
| T1.1.13 | Component test: ProductCard | Testing | Renders image, name, price; shows "Out of Stock" overlay when stock = 0; click calls router.push |
| T1.1.14 | Component test: Breadcrumbs | Testing | Renders correct segments; last item is non-clickable; handles single segment path |
| T1.1.15 | E2E: browse categories | Testing | Playwright: navigate home → click Bags card → assert URL `/category/bags` → assert 3 product cards visible |
| T1.1.16 | E2E: invalid category slug | Testing | Navigate to `/category/xyz` → assert 404 page |
| T1.1.17 | E2E: empty category state | Testing | Navigate to a category with no published products → assert empty state message |
| T1.1.18 | E2E: breadcrumb navigation | Testing | Click breadcrumb "Home" from category page → assert navigates to home |
| T1.1.19 | Write API documentation | Documentation | Document `GET /api/products` and `GET /api/products/categories` in API reference; include request/response examples |
| T1.1.20 | Write seed script documentation | Documentation | Document how to run seed, what data it creates, how to modify |

---

## Feature F1.2 — Product Detail Page (US-E1-02)

**Story:** As a customer, I want to view a detailed product page with images, description, price, and stock status so that I can make an informed purchase decision.

### Tasks

| ID | Task | Type | Subtasks |
|---|---|---|---|
| T1.2.1 | Implement `findBySlug` in repository | Technical | Add method to ProductRepository returning full product with all fields; include related data (category name, review count, average rating placeholder) |
| T1.2.2 | Build product detail API endpoint | Technical | Implement `GET /api/products/:slug` with Zod validation; 404 handling for missing/unpublished; includes image array, material tag, SKU, sustainability badge |
| T1.2.3 | Build PDP page at `/products/[slug]` | Technical | Create App Router page; server-side fetch; render image gallery (main image + thumbnails, lightbox), product info section (name, price, SKU, material badge, stock status, description), sustainability badge, breadcrumb |
| T1.2.4 | Build ImageGallery component | Technical | Client component with thumbnail strip; click switches main image; lightbox modal overlay; keyboard navigation; lazy loading via Next.js Image; mobile swipe support |
| T1.2.5 | Build StockBadge component | Technical | Conditional rendering: green "In Stock"/red "Out of Stock"; uses stock field from product |
| T1.2.6 | Build MaterialBadge and SustainabilityBadge | Technical | `MaterialBadge` — static "Pineapple Fiber" chip with leaf icon; `SustainabilityBadge` — icon + "Eco-Friendly" label; colored per design system |
| T1.2.7 | Build ShareButton component | Technical | Web Share API button with clipboard fallback; shares product URL, name, and description |
| T1.2.8 | Handle missing image fallback | Technical | Display placeholder SVG when `images` array is empty |
| T1.2.9 | Handle long description truncation | Technical | Truncate at 5000 chars; "Read more" expand via client island |
| T1.2.10 | Add recently viewed tracking | Technical | Store product slugs in localStorage on PDP visit; display "Recently Viewed" section on home page |
| T1.2.11 | Add sitemap entry for product pages | Technical | Add dynamic sitemap entry for each published product |
| T1.2.12 | Unit test: `findBySlug` | Testing | Returns full product; null for unpublished; null for non-existent slug |
| T1.2.13 | Integration test: product detail API | Testing | Seed product; GET `/api/products/classic-brown-belt` → 200 with full shape; GET non-existent → 404 |
| T1.2.14 | Component test: ImageGallery | Testing | Click thumbnail changes main image; lightbox toggles; keyboard navigation works |
| T1.2.15 | Component test: StockBadge | Testing | "In Stock" when stock > 0; "Out of Stock" when stock = 0 |
| T1.2.16 | Component test: ShareButton | Testing | Click triggers Web Share API or clipboard fallback |
| T1.2.17 | Component test: long description truncation | Testing | Text > 5000 chars truncated with "Read more"; expand shows full text |
| T1.2.18 | E2E: view product detail | Testing | Playwright: navigate category → click product card → assert PDP loads with name, price, image, stock, SKU, breadcrumb |
| T1.2.19 | E2E: out-of-stock display | Testing | Set product stock to 0 via seed; assert PDP shows "Out of Stock", add-to-cart disabled |
| T1.2.20 | E2E: 404 for invalid slug | Testing | Navigate to `/products/non-existent` → 404 page |
| T1.2.21 | E2E: image gallery interaction | Testing | Click thumbnail → main image changes; click main image → lightbox opens; close lightbox |
| T1.2.22 | E2E: share button | Testing | Click Share → navigator.share called or clipboard populated |
| T1.2.23 | Write PDP component documentation | Documentation | Document ImageGallery, StockBadge, MaterialBadge, ShareButton props and usage |

---

## Feature F1.3 — Product Search (US-E1-03)

**Story:** As a customer, I want to search products by name or keyword so that I can find specific items without navigating the full catalogue.

### Tasks

| ID | Task | Type | Subtasks |
|---|---|---|---|
| T1.3.1 | Implement search method in repository | Technical | Add `search(query: string, options: SearchOptions)` to ProductRepository; use Prisma `contains` (case-insensitive) on `name`, `description`, and `materialTag`; min 2 chars; sanitize input; paginated results |
| T1.3.2 | Build search API endpoint | Technical | Implement `GET /api/products/search?q=:query`; validate query min 2 chars → 400 if violated; return empty array with message for no matches |
| T1.3.3 | Build SearchBar component | Technical | Client component with input field, submit on Enter, search icon; debounce at 300ms for future autocomplete; navigates to `/search?q=:query` on submit; prevents empty/whitespace submission |
| T1.3.4 | Build search results page at `/search` | Technical | App Router page reads `q` query param; server-side fetch via search API; render `ProductCardGrid`; include sort dropdown (reuse SortDropdown) and filter controls; handle empty state with "Browse categories" link |
| T1.3.5 | Add search results to sitemap | Technical | No-index search results page via `noindex` meta tag to prevent duplicate content issues |
| T1.3.6 | Log search queries | Technical | Write anonymized search queries to audit log for analytics; exclude PII |
| T1.3.7 | Unit test: search repository | Testing | Mock Prisma; assert search returns matching products by name and description; assert partial word matching ("wal" → "Wallet"); assert min 2 chars enforced; assert special chars escaped |
| T1.3.8 | Integration test: search API | Testing | Seed products; "wal" → returns wallet products; "xyzzy" → empty array; "" → 400; "a" → 400 (too short) |
| T1.3.9 | Component test: SearchBar | Testing | Renders input; submits on Enter; prevents empty submission; shows clear button when text present |
| T1.3.10 | E2E: search flow | Testing | Playwright: type "wallet" → submit → assert results page shows wallet products |
| T1.3.11 | E2E: search no results | Testing | Type "xyzzy" → assert empty state with "Browse categories" link |
| T1.3.12 | E2E: search with filters | Testing | Search "belt" → apply price filter → assert results filtered |
| T1.3.13 | E2E: empty search prevention | Testing | Submit empty → URL unchanged; submit whitespace → URL unchanged |
| T1.3.14 | Document search API | Documentation | Document `GET /api/products/search` with query param, response shape, error codes |

---

## Feature F1.4 — Product Filtering & Sorting (US-E1-04)

**Story:** As a customer, I want to filter products by price range and sort by price or name so that I can narrow down choices to match my budget and preference.

### Tasks

| ID | Task | Type | Subtasks |
|---|---|---|---|
| T1.4.1 | Extend repository with filter/sort | Technical | Add `findAllWithFilters(filters: { categorySlug?, minPrice?, maxPrice?, sortBy?, sortOrder? }, pagination)` to repository; construct Prisma `where` and `orderBy` dynamically |
| T1.4.2 | Build filter API endpoint | Technical | Extend `GET /api/products` to accept optional query params: `minPrice`, `maxPrice`, `sortBy`, `sortOrder`; validate via Zod; combine with `category` param |
| T1.4.3 | Build PriceRangeFilter component | Technical | Client component with min/max input fields and dual-handle slider; validate min ≤ max; sync with URL query params; auto-apply on change (with debounce) |
| T1.4.4 | Build SortDropdown component | Technical | Client component: dropdown with options "Price: Low to High" (sortBy=price, sortOrder=asc), "Price: High to Low" (sortBy=price, sortOrder=desc), "Name: A–Z" (sortBy=name, sortOrder=asc), "Name: Z–A" (sortBy=name, sortOrder=desc), "Newest" (sortBy=newest); default "Newest"; syncs with URL |
| T1.4.5 | Build ActiveFilterChips component | Technical | Shows removable chips for each active filter (e.g. "Bags ×", "$50–$100 ×"); click × removes that filter and updates URL |
| T1.4.6 | Build mobile filter drawer | Technical | On screens < 768px, filter controls slide in from left as a drawer overlay; backdrop click closes; "Apply" button commits changes |
| T1.4.7 | Wire filters to category and search pages | Technical | Category page and search results page read filter/sort from URL query params; pass to API; preserve filters on page navigation; update URL on filter change |
| T1.4.8 | Handle no-results after filtering | Technical | Show "No products match your filters" with "Clear filters" button; button resets all query params |
| T1.4.9 | Unit test: filter repository logic | Testing | Mock Prisma; test price range boundary values ($49, $289); test sort by price asc/desc; test combined category + price filter; test minPrice > maxPrice |
| T1.4.10 | Integration test: filter API | Testing | Seed products at various prices; GET `minPrice=50&maxPrice=100` → correct subset; GET `minPrice=300` → empty array; GET `sortBy=price&sortOrder=asc` → ascending; invalid params → 422 |
| T1.4.11 | Component test: PriceRangeFilter | Testing | Renders min/max inputs; validates min ≤ max; updates URL on change; slider syncs with inputs |
| T1.4.12 | Component test: SortDropdown | Testing | Renders all options; selection updates URL; default is "Newest" |
| T1.4.13 | Component test: ActiveFilterChips | Testing | Renders chip for each active filter; click × removes filter; "Clear all" removes all |
| T1.4.14 | E2E: filter by price | Testing | Playwright: apply min price $100 → assert products < $100 hidden |
| T1.4.15 | E2E: sort products | Testing | Select "Price: High to Low" → assert first product is most expensive |
| T1.4.16 | E2E: combined filter + sort | Testing | Apply price filter + change sort → results filtered AND sorted |
| T1.4.17 | E2E: clear filters | Testing | Apply filters → click "Clear all" → full product list restored |
| T1.4.18 | E2E: mobile filter drawer | Testing | Resize to mobile → filter drawer opens/closes correctly |
| T1.4.19 | E2E: no results state | Testing | Filter $0–$10 → empty state with "Clear filters" button |
| T1.4.20 | Document filter/sort API | Documentation | Document query params for `GET /api/products` in API reference with examples |

---

## Feature F1.5 — Admin Product CRUD (US-E1-05)

**Story:** As an admin, I want to create, read, update, and delete products so that I can manage the catalogue without engineering involvement.

### Tasks

| ID | Task | Type | Subtasks |
|---|---|---|---|
| T1.5.1 | Implement admin auth middleware | Technical | Create `requireAdmin` middleware; verify JWT + ADMIN role; return 403 for non-admin; apply to all `/api/admin/products/*` routes |
| T1.5.2 | Implement product CRUD repository methods | Technical | Add `create(data)`, `update(id, data)`, `delete(id)`, `findById(id)` to repository; auto-generate slug from name; enforce globally unique name; check for active orders before delete |
| T1.5.3 | Build admin product API endpoints | Technical | `GET /api/admin/products` — list all (including unpublished, with stock info); `POST /api/admin/products` — create; `PUT /api/admin/products/:id` — update; `DELETE /api/admin/products/:id` — delete (409 if active orders exist); all with Zod validation |
| T1.5.4 | Build S3 image upload service | Technical | Create `ImageUploadService` in `/lib`; upload to S3 bucket; return public URL; accept JPEG/PNG/WebP; max 5 MB; resize to standard dimensions; validate file type via magic bytes |
| T1.5.5 | Build admin product list page | Technical | Server component rendering table: thumbnail, name, category, price, stock, status (published/draft), actions (edit/delete); sortable columns; search by name |
| T1.5.6 | Build admin product form | Technical | Client component with react-hook-form + Zod validation; fields: name, description (rich text via Tiptap), price, category (select), stock, images (multi-upload with drag-and-drop preview), material tag, sustainability badge toggle, published toggle |
| T1.5.7 | Build image upload UI | Technical | Drag-and-drop zone; preview thumbnails with remove button; upload progress bar; error state for invalid files; max 5 images enforced |
| T1.5.8 | Build delete confirmation dialog | Technical | Modal: "Delete [product name]?"; if orders exist, show "Cannot delete — X active orders. Disable instead."; confirm button; cancel button |
| T1.5.9 | Handle network failure on save | Technical | Client-side form state preserved on error; "Save failed. Retry?" banner with retry button |
| T1.5.10 | Add product change history tab (admin) | Technical | Read-only timeline showing changes from audit log: field changed, old value, new value, admin name, timestamp |
| T1.5.11 | Unit test: CRUD repository methods | Testing | Mock Prisma; test create returns product with auto-slug; test update merges; test delete removes; test delete with orders throws |
| T1.5.12 | Integration test: admin product API | Testing | Admin → CRUD succeeds (201/200/200/204); customer → all 403; unauthenticated → 401; invalid data → 422 |
| T1.5.13 | Integration test: delete with orders | Testing | Create product, create order referencing product, attempt delete → 409 |
| T1.5.14 | Integration test: image upload | Testing | Upload valid JPEG → 200 with URL; upload .exe → 400; upload > 5 MB → 400 |
| T1.5.15 | Component test: product form | Testing | Renders all fields; submits valid data; shows errors for invalid; autosaves on blur |
| T1.5.16 | Component test: image upload UI | Testing | Drag file → preview; click remove → removed; invalid file → error |
| T1.5.17 | Component test: delete dialog | Testing | Shows warning; confirms on "Delete"; cancels on "Cancel" |
| T1.5.18 | E2E: admin create product | Testing | Login as admin → create product → verify in list → verify on frontend |
| T1.5.19 | E2E: admin edit product | Testing | Edit name, price, stock → verify updated on PDP |
| T1.5.20 | E2E: admin delete product | Testing | Delete product → verify removed from listing and PDP returns 404 |
| T1.5.21 | E2E: admin delete with orders | Testing | Create order → attempt delete → error message shown |
| T1.5.22 | E2E: image upload flow | Testing | Upload valid image → preview shown; upload invalid → error; upload > 5 MB → error |
| T1.5.23 | E2E: auth enforcement | Testing | Non-admin → 403 page; unauthenticated → redirected to login |
| T1.5.24 | Write admin guide | Documentation | Document: how to add/edit/delete products, upload images, manage stock, publish/unpublish, view change history |

---

## Summary — Missing Requirements Identified

| # | Gap | Impact | Recommendation |
|---|---|---|---|
| M1 | No category sort order on home page | Categories appear in arbitrary order | Add `sortOrder` integer to Category model (included in decomposition) |
| M2 | No breadcrumb navigation | Poor UX on deep pages, weaker SEO | Added `Breadcrumbs` component (included in decomposition) |
| M3 | No SKU display on PDP | Support cannot reference products easily | Added SKU display (included in decomposition) |
| M4 | No search analytics | Blind to what customers search for | Added anonymized search logging (included in decomposition) |
| M5 | No autocomplete/suggestions during search | Slower search UX | Not included — recommend as P2 enhancement post-MVP |
| M6 | No mobile filter drawer | Poor mobile UX for filtering | Added mobile filter drawer (included in decomposition) |
| M7 | No active filter chips | User cannot see active filters at a glance | Added `ActiveFilterChips` component (included in decomposition) |
| M8 | No rich text editor for product description | Plain text limits admin formatting | Added Tiptap editor (included in decomposition) |
| M9 | No bulk product operations (CSV import/export) | Admin overhead if catalogue grows | Not included — low priority for 12 products |
| M10 | No product variant model (size, color) | Schema change needed if expanded later | Recommend designing variant-aware schema upfront even if unused |
| M11 | No product change history UI in admin | Audit logs exist but admin cannot see them | Added "History" tab (included in decomposition) |
| M12 | No sharing on PDP | Missed organic word-of-mouth | Added ShareButton with Web Share API (included in decomposition) |
| M13 | No "recently viewed" tracking | No cross-session browsing history | Added localStorage tracking (included in decomposition) |
| M14 | No sitemap for products and categories | Weaker SEO | Added dynamic sitemap entries (included in decomposition) |

---

## Task Summary

| Feature | Technical Tasks | Testing Tasks | Documentation Tasks | Total |
|---|---|---|---|---|
| F1.1 — Category Browsing | 8 | 9 | 2 | 19 |
| F1.2 — Product Detail Page | 11 | 10 | 1 | 22 |
| F1.3 — Product Search | 6 | 7 | 1 | 14 |
| F1.4 — Filtering & Sorting | 8 | 10 | 1 | 19 |
| F1.5 — Admin Product CRUD | 10 | 11 | 1 | 22 |
| **Total** | **43** | **47** | **6** | **96** |
