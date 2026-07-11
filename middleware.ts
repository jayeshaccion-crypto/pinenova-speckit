import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
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
];

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

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-XSS-Protection": "0",
  "Content-Security-Policy": CSP_HEADER,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next();
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        const response = NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
        return response;
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/account") || pathname.startsWith("/cart") || pathname.startsWith("/checkout")) {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/login" || pathname === "/register") {
    const token = request.cookies.get("accessToken")?.value;
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
