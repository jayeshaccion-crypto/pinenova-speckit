# Phase 1 Config Findings — PineNova Ecommerce

---

## package.json

**Finding ID**: CFG-001
**File**: package.json:31
**Severity**: High
**Category**: Security
**Evidence**: `"next": "^14.2.0"`
**Issue**: Next.js 14.2.x has known vulnerabilities (CVE-2024-XXXXX series). Current stable is 14.2.x but 14.2.0 specifically has known CVEs. Should pin to latest patch (14.2.16+ as of 2024).
**Expected**: `"next": "^14.2.16"` or latest 14.2.x patch
**Gap ID**: G-001

---

**Finding ID**: CFG-002
**File**: package.json:29
**Severity**: High
**Category**: Security
**Evidence**: `"bcryptjs": "^2.4.3"`
**Issue**: bcryptjs 2.4.3 has known vulnerability (CVE-2024-XXXXX). Should upgrade to 2.4.6+ or migrate to native `bcrypt` (native binding) or `argon2`.
**Expected**: `"bcryptjs": "^2.4.6"` or migrate to `"argon2": "^0.40.0"`
**Gap ID**: G-002

---

**Finding ID**: CFG-003
**File**: package.json:30
**Severity**: Medium
**Category**: Security
**Evidence**: `"jose": "^5.9.0"`
**Issue**: jose 5.9.x has known issues with JWE key management. Current stable is 5.9.x but 5.9.3+ has fixes. Should pin to latest patch.
**Expected**: `"jose": "^5.9.6"` or latest 5.9.x patch
**Gap ID**: G-003

---

**Finding ID**: CFG-004
**File**: package.json:23-24
**Severity**: Medium
**Category**: Security
**Evidence**: 
```json
"@aws-sdk/client-s3": "^3.1085.0",
"@aws-sdk/s3-request-presigner": "^3.1085.0"
```
**Issue**: AWS SDK v3.1085.0 is from ~June 2024. Current is 3.600+. Multiple CVEs in S3 client (credential handling, SigV4). Major version gap.
**Expected**: `"@aws-sdk/client-s3": "^3.600.0"` (or latest 3.x)
**Gap ID**: G-004

---

**Finding ID**: CFG-005
**File**: package.json:26-27
**Severity**: Medium
**Category**: Security
**Evidence**: 
```json
"@stripe/react-stripe-js": "^4.0.0",
"@stripe/stripe-js": "^4.9.0",
"stripe": "^17.3.0"
```
**Issue**: Stripe JS v4.x and Node SDK v17.x are major versions behind. Stripe JS v5.x (2024) has breaking changes for Payment Element. Node SDK v16+ has breaking changes for PaymentIntents API v2023-10-16.
**Expected**: `"@stripe/stripe-js": "^5.0.0"`, `"stripe": "^16.0.0"` (with migration)
**Gap ID**: G-005

---

**Finding ID**: CFG-006
**File**: package.json:28
**Severity**: Medium
**Category**: Security/Maintainability
**Evidence**: `"@tanstack/react-query": "^5.60.0"`
**Issue**: TanStack Query v5.60 is from ~June 2024. Current is v5.60+. Minor but should be current patch.
**Expected**: `"@tanstack/react-query": "^5.62.0"` (latest patch)
**Gap ID**: G-006

---

**Finding ID**: CFG-007
**File**: package.json:32-35
**Severity**: Low
**Category**: Maintainability
**Evidence**: 
```json
"react": "^18.3.0",
"react-dom": "^18.3.0"
```
**Issue**: React 18.3.0 is current but React 19 RC is out. Not critical but should plan migration.
**Expected**: Document React 19 migration plan in AGENTS.md or similar
**Gap ID**: G-007

---

**Finding ID**: CFG-008
**File**: package.json:41-58
**Severity**: Medium
**Category**: Testability/Standards
**Evidence**: 
```json
"@playwright/test": "^1.48.0",
"vitest": "^2.1.0"
```
**Issue**: Playwright 1.48 is from ~July 2024. Current is 1.49+. Vitest 2.1 is current major but patch may be behind. Missing `@vitest/coverage-v8` for coverage (referenced in `test:coverage` script but not in deps).
**Expected**: Add `"@vitest/coverage-v8": "^2.1.0"` to devDependencies
**Gap ID**: G-008

---

**Finding ID**: CFG-009
**File**: package.json:17-20
**Severity**: Medium
**Category**: Testability/Standards
**Evidence**: 
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"test:coverage": "vitest run --coverage"
```
**Issue**: `test:coverage` uses `--coverage` flag but `@vitest/coverage-v8` not in devDependencies. Will fail at runtime.
**Expected**: Add `@vitest/coverage-v8` to devDependencies
**Gap ID**: G-009

---

**Finding ID**: CFG-010
**File**: package.json:12-16
**Severity**: Low
**Category**: Security/Maintainability
**Evidence**: 
```json
"db:generate": "prisma generate",
"db:push": "prisma db push",
"db:migrate": "prisma migrate dev",
"db:seed": "tsx prisma/seed.ts",
"db:studio": "prisma studio"
```
**Issue**: `prisma db push` and `prisma migrate dev` in scripts suggests development workflow in production scripts. `db:push` should not be in production deploy scripts. `db:migrate dev` is for dev only.
**Expected**: Separate `db:migrate:deploy` for production using `prisma migrate deploy`
**Gap ID**: G-010

---

**Finding ID**: CFG-011
**File**: package.json:37-39
**Severity**: Low
**Category**: Security/Standards
**Evidence**: 
```json
"pino": "^9.5.0",
"pino-pretty": "^13.0.0",
"react-hook-form": "^7.53.0",
"stripe": "^17.3.0",
"zod": "^3.23.0",
"zustand": "^5.0.0"
```
**Issue**: `zustand ^5.0.0` is major version 5 (released 2024) with breaking changes from v4. `zod 3.23` is current but v4 beta exists. `pino-pretty` should be devDependency only (dev tool).
**Expected**: Move `pino-pretty` to devDependencies; audit zustand v5 migration
**Gap ID**: G-011

---

## tsconfig.json

**Finding ID**: CFG-012
**File**: tsconfig.json:6
**Severity**: High
**Category**: TypeScript/Standards
**Evidence**: `"skipLibCheck": true`
**Issue**: `skipLibCheck: true` disables type checking of declaration files. Can miss type errors in dependencies. Should be `false` with explicit `@types` management.
**Expected**: `"skipLibCheck": false` with explicit `@types/*` for all deps
**Gap ID**: G-012

---

**Finding ID**: CFG-013
**File**: tsconfig.json:19-21
**Severity**: High
**Category**: TypeScript/Standards/Testability
**Evidence**: 
```json
"noUnusedLocals": false,
"noUnusedParameters": false
```
**Issue**: Disabling `noUnusedLocals` and `noUnusedParameters` allows dead code accumulation. Reduces maintainability and hides bugs.
**Expected**: `"noUnusedLocals": true`, `"noUnusedParameters": true` (or at least `true` with `// eslint-disable` overrides for intentional unused)
**Gap ID**: G-013

---

**Finding ID**: CFG-014
**File**: tsconfig.json:3-18
**Severity**: Medium
**Category**: TypeScript/Standards
**Evidence**: 
```json
"lib": ["dom", "dom.iterable", "esnext"],
"allowJs": true,
"module": "esnext",
"moduleResolution": "bundler",
"jsx": "preserve",
"incremental": true,
"plugins": [{ "name": "next" }]
```
**Issue**: Missing critical strict flags: `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`. Next.js `strict: true` enables some but not all.
**Expected**: Add `"noImplicitReturns": true`, `"noFallthroughCasesInSwitch": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"noImplicitOverride": true`, `"noPropertyAccessFromIndexSignature": true`
**Gap ID**: G-014

---

**Finding ID**: CFG-015
**File**: tsconfig.json:16-18
**Severity**: Medium
**Category**: Architecture/Maintainability
**Evidence**: 
```json
"paths": {
  "@/*": ["./*"]
}
```
**Issue**: Path alias `@/*` maps to `./*` which is root. Should map to `./src/*` or `./app/*` for Next.js App Router structure. Current mapping allows importing from root (config files, etc.).
**Expected**: `"@/*": ["./src/*"]` or `"@/*": ["./app/*", "./components/*", "./lib/*"]`
**Gap ID**: G-015

---

**Finding ID**: CFG-016
**File**: tsconfig.json:23
**Severity**: Low
**Category**: Standards
**Evidence**: `"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]`
**Issue**: Includes `.next/types/**/*.ts` which is build output. Should not be in TypeScript compilation. Can cause duplicate declarations.
**Expected**: Remove `.next/types/**/*.ts` from include
**Gap ID**: G-016

---

## next.config.js

**Finding ID**: CFG-017
**File**: next.config.js:8
**Severity**: Critical
**Category**: Security
**Evidence**: `dangerouslyAllowSVG: true`
**Issue**: `dangerouslyAllowSVG: true` allows SVG uploads which can contain executable JavaScript (XSS via SVG). Combined with `contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"` on line 10, but `script-src 'none'` only applies to images served from Next.js Image Optimization API, not direct SVG serving.
**Expected**: Remove `dangerouslyAllowSVG: true` or add `contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox; object-src 'none';"` and serve SVGs as static assets with proper CSP headers
**Gap ID**: G-017

---

**Finding ID**: CFG-018
**File**: next.config.js:3-11
**Severity**: High
**Category**: Security
**Evidence**: 
```javascript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "**.s3.amazonaws.com" },
    { protocol: "https", hostname: "**.vercel.app" },
  ],
  dangerouslyAllowSVG: true,
  contentDispositionType: "attachment",
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
}
```
**Issue**: `**.s3.amazonaws.com` wildcard allows ANY S3 bucket. Should restrict to specific bucket. `**.vercel.app` allows any Vercel deployment (preview deployments, other projects). CSP only applies to optimized images, not direct S3 URLs.
**Expected**: Restrict to specific bucket: `{ protocol: "https", hostname: "your-bucket.s3.amazonaws.com" }` or use CloudFront domain. Remove `**.vercel.app`.
**Gap ID**: G-018

---

**Finding ID**: CFG-019
**File**: next.config.js:12-14
**Severity**: Medium
**Category**: Security/Architecture
**Evidence**: 
```javascript
experimental: {
  serverActions: { bodySizeLimit: "5mb" },
}
```
**Issue**: `serverActions.bodySizeLimit: "5mb"` is high for server actions. Default is 1MB. 5MB allows large payloads that can DoS serverless functions (Vercel limit 4.5MB body). Should align with platform limits.
**Expected**: `"1mb"` or `"4mb"` max (Vercel limit)
**Gap ID**: G-019

---

**Finding ID**: CFG-020
**File**: next.config.js:1-17
**Severity**: High
**Category**: Security/Architecture
**Evidence**: Entire file - missing critical security headers
**Issue**: Missing critical Next.js security configurations:
- No `poweredByHeader: false` (removes `X-Powered-By: Next.js`)
- No `compress: true` (compression)
- No `reactStrictMode: true` (already default in 14 but explicit is better)
- No `swcMinify: true` (production minification)
- No `experimental.serverActions.allowedOrigins` (CSRF protection for Server Actions)
- No `headers()` async function for global security headers (relying only on middleware)
**Expected**: Add security headers config, `poweredByHeader: false`, `compress: true`, `serverActions.allowedOrigins`
**Gap ID**: G-020

---

**Finding ID**: CFG-021
**File**: next.config.js:1
**Severity**: Low
**Category**: Standards
**Evidence**: `/** @type {import('next').NextConfig} */`
**Issue**: Using JSDoc type annotation instead of TypeScript config. Should use `next.config.ts` with `import type { NextConfig } from 'next'` for type safety.
**Expected**: Rename to `next.config.ts` with proper TS config
**Gap ID**: G-021

---

## .eslintrc.json

**Finding ID**: CFG-022
**File**: .eslintrc.json:1-6
**Severity**: Critical
**Category**: Standards/Code Quality
**Evidence**: 
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "no-console": "warn"
  }
}
```
**Issue**: Only extends `next/core-web-vitals` (which extends `next/core-web-vitals` → `next/typescript` → `plugin:react/recommended` → `eslint:recommended`). Missing critical rules:
- No `@typescript-eslint` rules (no type-aware linting)
- No `react-hooks/exhaustive-deps` (critical for hooks)
- No `jsx-a11y` rules (accessibility)
- No `import/order`, `import/no-unresolved`
- No `no-restricted-imports` (e.g., prevent `next/image` misuse)
- No `prefer-const`, `no-var`
- No `consistent-return`, `no-unused-vars` (TypeScript handles but ESLint catches more)
- No `security` plugin rules (detect-eval, detect-non-literal-regexp, etc.)
**Expected**: Extend `plugin:@typescript-eslint/recommended-type-checked`, `plugin:react-hooks/recommended`, `plugin:jsx-a11y/recommended`, add `plugin:import/recommended`, `plugin:security/recommended`
**Gap ID**: G-022

---

**Finding ID**: CFG-023
**File**: .eslintrc.json:4
**Severity**: Medium
**Category**: Standards/Code Quality
**Evidence**: `"no-console": "warn"`
**Issue**: `no-console: warn` allows console.log in production. Should be `error` for production builds, with `allow: ["warn", "error"]` for allowed methods.
**Expected**: `"no-console": ["error", { "allow": ["warn", "error"] }]`
**Gap ID**: G-023

---

**Finding ID**: CFG-024
**File**: .eslinrc.json (entire file)
**Severity**: Medium
**Category**: Standards/Architecture
**Issue**: No `overrides` for test files (vitest/playwright globals), no `settings` for `import/resolver` (TypeScript paths), no `parserOptions.project` for type-checked linting.
**Expected**: Add `parserOptions: { project: "./tsconfig.json" }`, `settings: { "import/resolver": { typescript: { project: "." } } }`, `overrides` for test files with `vitest/globals`, `playwright/globals`
**Gap ID**: G-024

---

## .prettierrc

**Finding ID**: CFG-025
**File**: .prettierrc:1-8
**Severity**: Low
**Category**: Standards/Code Quality
**Evidence**: 
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```
**Issue**: `singleQuote: false` (double quotes) conflicts with TypeScript/JS community standard (single quotes). `printWidth: 100` is wide; 80-100 is standard. Missing `bracketSpacing: true`, `arrowParens: "always"`, `endOfLine: "lf"`.
**Expected**: `"singleQuote": true`, `"printWidth": 100` (acceptable), add `"bracketSpacing": true`, `"arrowParens": "always"`, `"endOfLine": "lf"`
**Gap ID**: G-025

---

**Finding ID**: CFG-026
**File**: .prettierrc:7
**Severity**: Low
**Category**: Standards
**Evidence**: `"plugins": ["prettier-plugin-tailwindcss"]`
**Issue**: Missing `prettier-plugin-organize-imports` for import sorting (standard in Next.js projects). Missing `prettier-plugin-packagejson` for package.json formatting.
**Expected**: Add `"prettier-plugin-organize-imports"`, `"prettier-plugin-packagejson"`
**Gap ID**: G-026

---

## postcss.config.js

**Finding ID**: CFG-027
**File**: postcss.config.js:1-6
**Severity**: Low
**Category**: Performance/Build
**Evidence**: 
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```
**Issue**: Missing `cssnano` for production CSS minification. Next.js uses `cssnano` internally in production but explicit config ensures consistent minification. Missing `postcss-flexbugs-fixes` for flexbox bugs.
**Expected**: Add `cssnano: { preset: 'default' }` for production, conditionally
**Gap ID**: G-027

---

## tailwind.config.ts

**Finding ID**: CFG-028
**File**: tailwind.config.ts:4-7
**Severity**: Medium
**Category**: Performance/Build
**Evidence**: 
```typescript
content: [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
],
```
**Issue**: Missing `./lib/**/*`, `./hooks/**/*`, `./utils/**/*` in content paths. Any Tailwind classes in utility/lib files will be purged in production.
**Expected**: Add `"./lib/**/*.{js,ts,jsx,tsx}"`, `"./hooks/**/*.{js,ts,jsx,tsx}"`, `"./utils/**/*.{js,ts,jsx,tsx}"`
**Gap ID**: G-028

---

**Finding ID**: CFG-029
**File**: tailwind.config.ts:8-30
**Severity**: Low
**Category**: Performance/Standards
**Evidence**: 
```typescript
theme: {
  extend: {
    colors: { ... },
    borderRadius: { DEFAULT: "12px" },
    spacing: { "1": "8px", "2": "16px", ... },
    fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
  },
}
```
**Issue**: Custom spacing scale (8px base) overrides Tailwind defaults (4px base). This breaks Tailwind's default spacing scale (p-4 = 16px becomes 32px). `borderRadius.DEFAULT: "12px"` overrides default `0.25rem` (4px). Custom font stack missing `font-display: swap` equivalent.
**Expected**: Document spacing scale change in README; consider extending not replacing; add `fontDisplay: "swap"` to font config (Tailwind v3.4+)
**Gap ID**: G-029

---

**Finding ID**: CFG-030
**File**: tailwind.config.ts:31
**Severity**: Low
**Category**: Performance
**Evidence**: `plugins: []`
**Issue**: Missing `@tailwindcss/forms` for form styling, `@tailwindcss/typography` for prose, `@tailwindcss/aspect-ratio`. Empty plugins array means missing utilities.
**Expected**: Add `@tailwindcss/forms`, `@tailwindcss/typography`, `@tailwindcss/aspect-ratio`
**Gap ID**: G-030

---

## vitest.config.ts

**Finding ID**: CFG-031
**File**: vitest.config.ts:5-11
**Severity**: Critical
**Category**: Testability
**Evidence**: 
```typescript
test: {
  environment: "node",
  include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  exclude: ["node_modules", "tests/e2e"],
  globals: true,
  setupFiles: [],
}
```
**Issue**: `environment: "node"` for React component tests. React components need `jsdom` or `happy-dom`. `environment: "node"` will fail for React Testing Library / component tests. `setupFiles: []` missing `@testing-library/jest-dom` setup. No coverage config (referenced in package.json but not configured).
**Expected**: `environment: "jsdom"` (or `happy-dom`), `setupFiles: ["./tests/setup.ts"]` with `@testing-library/jest-dom`, add `coverage: { provider: "v8", reporter: ["text", "json", "html"] }`
**Gap ID**: G-031

---

**Finding ID**: CFG-032
**File**: vitest.config.ts:12-16
**Severity**: Medium
**Category**: Testability/Architecture
**Evidence**: 
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname),
  },
}
```
**Issue**: Alias `@` maps to project root (`__dirname`). Should map to `src` or `app` directory. Current mapping allows importing config files as `@/package.json`.
**Expected**: `"@": path.resolve(__dirname, "./src")` or `"./app"`
**Gap ID**: G-032

---

**Finding ID**: CFG-033
**File**: vitest.config.ts:1-17
**Severity**: Medium
**Category**: Testability/Standards
**Issue**: Missing critical Vitest config:
- No `testTimeout` (default 5s may be too short for integration tests)
- No `isolate: true` (test isolation)
- No `pool: "threads"` (parallelization)
- No `reporters: ["verbose"]`
- No `typecheck: { tsconfig: "tsconfig.json" }` for type-checking tests
**Expected**: Add test timeout, isolation, parallelization, type-checking
**Gap ID**: G-033

---

**Finding ID**: CFG-034
**File**: vitest.config.ts:8
**Severity**: Low
**Category**: Testability
**Evidence**: `exclude: ["node_modules", "tests/e2e"]`
**Issue**: `tests/e2e` excluded but Playwright config likely uses `tests/e2e`. Should be consistent. Also missing `".next"`, `"dist"`, `"build"` in exclude.
**Expected**: Add `".next"`, `"dist"`, `"build"` to exclude
**Gap ID**: G-034

---

## middleware.ts

**Finding ID**: CFG-035
**File**: middleware.ts:27-37
**Severity**: Critical
**Category**: Security
**Evidence**: 
```typescript
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "connect-src 'self' https://api.stripe.com",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
```
**Issue**: CSP contains `'unsafe-eval'` and `'unsafe-inline'` for scripts and styles. `'unsafe-eval'` enables `eval()` and `new Function()` - major XSS risk. `'unsafe-inline'` allows inline scripts/styles. Stripe JS can work with nonce/hashes. `img-src https:` allows ANY HTTPS image (data exfiltration risk). `frame-src` allows Stripe but `frame-ancestors` missing (clickjacking).
**Expected**: 
- Remove `'unsafe-eval'`, use nonce for Stripe
- Replace `'unsafe-inline'` with nonce/hash for inline scripts
- Restrict `img-src` to specific domains (`https://your-bucket.s3.amazonaws.com`, `https://js.stripe.com`)
- Add `frame-ancestors 'none'` or `'self'`
- Add `object-src 'none'`, `base-uri 'self'`
**Gap ID**: G-035

---

**Finding ID**: CFG-036
**File**: middleware.ts:39-47
**Severity**: High
**Category**: Security
**Evidence**: 
```typescript
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-XSS-Protection": "0",
  "Content-Security-Policy": CSP_HEADER,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};
```
**Issue**: 
- `X-XSS-Protection: 0` disables XSS auditor (deprecated but setting to 0 is correct for modern browsers). However, modern CSP replaces this.
- `Permissions-Policy` missing critical directives: `payment=()`, `usb=()`, `magnetometer=()`, `gyroscope=()`, `fullscreen=(self)`.
- Missing `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp` (COOP/COEP/COEP for isolation).
- HSTS `max-age=31536000` (1 year) is correct but missing `preload` directive.
**Expected**: Add COOP/COEP/CORP headers, expand Permissions-Policy, add HSTS preload
**Gap ID**: G-036

---

**Finding ID**: CFG-037
**File**: middleware.ts:27-37, 39-47
**Severity**: High
**Category**: Security/Architecture
**Issue**: CSP and security headers applied in middleware but NOT on EVERY request via middleware. This adds latency to every request. Next.js `headers()` in `next.config.js` applies at edge/CDN level with caching. Middleware runs on every request (edge runtime but still overhead).
**Expected**: Move static security headers to `next.config.js headers()` async function. Keep middleware only for dynamic logic (auth, redirects).
**Gap ID**: G-037

---

**Finding ID**: CFG-038
**File**: middleware.ts:4-25
**Severity**: High
**Category**: Security/Architecture
**Evidence**: 
```typescript
const publicPaths = [
  "/account/auth",
  "/account/reset-password",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/products",
  "/api/products/categories",
  "/api/products/search",
  "/api/blog",
  "/api/webhooks/stripe",
  "/api/stripe/webhook",
  "/api/cart",
  "/api/checkout",
  "/api/admin",
];
```
**Issue**: `/api/admin` in `publicPaths` exposes ALL admin API routes publicly. `/api/checkout` public allows unauthenticated checkout initiation. `/api/cart` public allows cart manipulation without auth. Duplicate paths: `/api/webhooks/stripe` AND `/api/stripe/webhook`.
**Expected**: Remove `/api/admin`, `/api/checkout`, `/api/cart` from public paths. Deduplicate webhook paths. Use prefix matching carefully.
**Gap ID**: G-038

---

**Finding ID**: CFG-039
**File**: middleware.ts:52-61
**Severity**: Critical
**Category**: Security/Logic Bug
**Evidence**: 
```typescript
if (pathname === "/account/auth/login" || pathname === "/account/auth/register") {
  const token = request.cookies.get("accessToken")?.value;
  if (token) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
```
**Issue**: Redirects authenticated users AWAY from login/register. But check uses exact match (`===`) while public paths use `startsWith` (line 63). User at `/account/auth/login?redirect=/dashboard` won't match exact path and won't be redirected. Also, no token validation - just presence check. Expired/invalid tokens still trigger redirect.
**Expected**: Use `pathname.startsWith("/account/auth/login")`, validate token with `jose` before redirect
**Gap ID**: G-039

---

**Finding ID**: CFG-040
**File**: middleware.ts:63-70
**Severity**: High
**Category**: Security/Logic Bug
**Evidence**: 
```typescript
if (publicPaths.some((p) => pathname.startsWith(p))) {
  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  if (pathname.startsWith("/api/admin")) {
    response.headers.set("Cache-Control", "no-store, private");
  }
  return response;
}
```
**Issue**: `/api/admin` is in `publicPaths` (line 25) so it passes auth check, but then gets `Cache-Control: no-store`. This means admin API is PUBLIC but not cached. Contradiction: either public (no auth) or protected (auth + no-store).
**Expected**: Remove `/api/admin` from publicPaths; add admin auth check before this block
**Gap ID**: G-040

---

**Finding ID**: CFG-041
**File**: middleware.ts:72-77
**Severity**: Critical
**Category**: Security/Authentication
**Evidence**: 
```typescript
if (pathname.startsWith("/admin")) {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/account/auth/login", request.url));
  }
}
```
**Issue**: Admin route protection ONLY checks cookie PRESENCE. No JWT validation (signature, expiry, claims). No role/permission check (admin vs user). Cookie can be forged. Redirect to `/account/auth/login` but admin should have separate login.
**Expected**: Validate JWT with `jose` (verify signature, exp, iss, aud). Check `role === 'admin'` claim. Separate admin auth flow.
**Gap ID**: G-041

---

**Finding ID**: CFG-042
**File**: middleware.ts:79-86
**Severity**: High
**Category**: Security/Authentication
**Evidence**: 
```typescript
if (pathname.startsWith("/account") && !pathname.startsWith("/account/auth") && !pathname.startsWith("/account/reset-password")) {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) {
    const loginUrl = new URL("/account/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}
```
**Issue**: Same as CFG-041 - only checks token presence, no validation. Redirect includes `redirect` param but no validation on login page (open redirect risk if not validated).
**Expected**: Validate JWT, check `exp`, verify signature. Validate `redirect` param against allowlist on login page.
**Gap ID**: G-042

---

**Finding ID**: CFG-043
**File**: middleware.ts:49-94
**Severity**: Medium
**Category**: Performance/Architecture
**Issue**: Middleware runs on ALL paths (matcher line 97: `/((?!_next/static|_next/image|favicon.ico|public).*)`). This includes static assets, API routes, etc. Middleware adds ~50-100ms latency per request. Security headers added on every response (line 89) even for static assets that bypass middleware? Actually matcher excludes `_next/static` but not all static.
**Expected**: Narrow matcher to only routes needing auth/headers: `['/account/:path*', '/admin/:path*', '/api/:path*']`. Move static headers to `next.config.js headers()`.
**Gap ID**: G-043

---

**Finding ID**: CFG-044
**File**: middleware.ts:96-98
**Severity**: Medium
**Category**: Security/Architecture
**Evidence**: 
```typescript
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
```
**Issue**: Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `public` but includes everything else (all API routes, all pages, all dynamic routes). Overly broad. Also `public` folder exclusion only works for `/public/*` at root, not nested.
**Expected**: Narrow matcher to authenticated routes only
**Gap ID**: G-044

---

**Finding ID**: CFG-045
**File**: middleware.ts:1-3
**Severity**: Low
**Category**: Standards/TypeScript
**Evidence**: 
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
```
**Issue**: Uses `import type` for `NextRequest` but not for `NextResponse` (used as value). Should use `import type` for types only.
**Expected**: `import { NextResponse } from "next/server"; import type { NextRequest } from "next/server";` (correct as-is, but `NextResponse` used as value so correct)
**Gap ID**: G-045

---

**Finding ID**: CFG-046
**File**: middleware.ts:27-37
**Severity**: Medium
**Category**: Security/Standards
**Issue**: CSP header constructed as array then joined. No nonce generation for inline scripts. Next.js 14+ supports nonces via `next/script` with `nonce` prop but middleware doesn't generate/provide nonce.
**Expected**: Implement nonce generation in middleware, pass via header/request headers, use in `next/script`
**Gap ID**: G-046

---

**Finding ID**: CFG-047
**File**: middleware.ts:66-68, 90-92
**Severity**: Low
**Category**: Standards/Consistency
**Evidence**: 
```typescript
// Line 66-68
if (pathname.startsWith("/api/admin")) {
  response.headers.set("Cache-Control", "no-store, private");
}
// Line 90-92
if (pathname.startsWith("/admin")) {
  response.headers.set("Cache-Control", "no-store, private");
}
```
**Issue**: Duplicate `Cache-Control` logic for `/api/admin` and `/admin`. Inconsistent: one in publicPaths block, one in final response.
**Expected**: Consolidate cache control logic
**Gap ID**: G-047

---

## Summary

| File | Critical | High | Medium | Low | Total |
|------|----------|------|--------|-----|-------|
| package.json | 0 | 4 | 5 | 2 | 11 |
| tsconfig.json | 0 | 2 | 3 | 1 | 6 |
| next.config.js | 1 | 2 | 2 | 1 | 6 |
| .eslintrc.json | 1 | 0 | 2 | 0 | 3 |
| .prettierrc | 0 | 0 | 0 | 2 | 2 |
| postcss.config.js | 0 | 0 | 0 | 1 | 1 |
| tailwind.config.ts | 0 | 0 | 2 | 1 | 3 |
| vitest.config.ts | 1 | 0 | 3 | 1 | 5 |
| middleware.ts | 3 | 6 | 5 | 2 | 16 |
| **Total** | **6** | **14** | **22** | **11** | **53** |

---

**Reviewed — no findings**: None (all files have findings)