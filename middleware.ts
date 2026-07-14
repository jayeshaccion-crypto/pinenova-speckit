import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicPaths = [
  "/account/auth",
  "/account/reset-password",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/admin/login",
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
];

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let binary = "";
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "https://js.stripe.com",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");
  const styleSrc = [
    "'self'",
    ...(isDev ? ["'unsafe-inline'"] : [`'nonce-${nonce}'`]),
    "https://fonts.googleapis.com",
  ].join(" ");
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    "img-src 'self' data: https://pinenova-assets.s3.amazonaws.com https://js.stripe.com",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "connect-src 'self' https://api.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const SECURITY_HEADERS_BASE: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-XSS-Protection": "0",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();
  const csp = buildCSP(nonce);

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname === "/favicon.ico") {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("X-Content-Security-Policy", csp);
    response.headers.set("X-WebKit-CSP", csp);
    response.headers.set("x-pathname", pathname);
    return response;
  }

  if (pathname === "/account/auth/login" || pathname === "/account/auth/register") {
    const token = request.cookies.get("accessToken")?.value;
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("x-pathname", pathname);
    Object.entries(SECURITY_HEADERS_BASE).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const secretKey = process.env.JWT_SECRET;
      if (!secretKey) {
        return NextResponse.redirect(new URL("/?error=misconfigured", request.url));
      }
      const secret = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(token, secret);
      if ((payload as any).role !== "ADMIN") {
        return NextResponse.redirect(new URL("/?error=forbidden", request.url));
      }
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/account") && !pathname.startsWith("/account/auth") && !pathname.startsWith("/account/reset-password")) {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) {
      const loginUrl = new URL("/account/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Security-Policy", csp);
  response.headers.set("X-WebKit-CSP", csp);
  response.headers.set("x-nonce", nonce);
  response.headers.set("x-pathname", pathname);
  Object.entries(SECURITY_HEADERS_BASE).forEach(([key, value]) => response.headers.set(key, value));
  if (pathname.startsWith("/admin")) {
    response.headers.set("Cache-Control", "no-store, private");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
