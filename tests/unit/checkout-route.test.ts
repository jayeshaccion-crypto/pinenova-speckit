import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/feature-flags", () => ({ isEnabled: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(), rateLimitResponse: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { cart: { findUnique: vi.fn() } } }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/stripe", () => ({}));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), emailTemplates: {} }));
vi.mock("@/services/inventory.service", () => ({ reserveStock: vi.fn(), releaseStock: vi.fn(), InsufficientStockError: class extends Error {}, retryOnSerialization: vi.fn((fn: any) => fn()) }));
vi.mock("@/services/checkout.service", () => ({ checkout: vi.fn(), InsufficientStockError: class extends Error {} }));

import { POST } from "@/app/api/checkout/route";
import { isEnabled } from "@/lib/feature-flags";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

const validBody = {
  shippingAddress: { name: "Test User", line1: "123 Main St", city: "Testville", state: "CA", zip: "90210" },
};

function makeRequest(overrides?: { headers?: Record<string, string>; body?: any }): Request {
  const headers: Record<string, string> = {
    "x-session-id": "test-session-1",
    origin: "http://localhost:3000",
    referer: "http://localhost:3000/checkout",
    "content-type": "application/json",
    ...(overrides?.headers || {}),
  };
  return new Request("http://localhost:3000/api/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify(overrides?.body ?? validBody),
  });
}

describe("POST /api/checkout — route-level guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isEnabled).mockReturnValue(true);
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    vi.mocked(rateLimitResponse).mockReturnValue(new Response(null, { status: 429 }) as any);
    vi.mocked(prisma.cart.findUnique).mockResolvedValue({
      id: "cart-1",
      sessionId: "test-session-1",
      items: [{ productId: "prod-1", quantity: 1 }],
    } as any);
  });

  it("returns 503 MAINTENANCE when FLAG_checkout is false", async () => {
    vi.mocked(isEnabled).mockReturnValue(false);
    const res = await POST(makeRequest());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error.code).toBe("MAINTENANCE");
  });

  it("returns 400 when x-session-id is missing", async () => {
    const res = await POST(makeRequest({ headers: { "x-session-id": "" } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("SESSION_REQUIRED");
  });

  it("returns 403 CSRF_REJECTED when origin and referer are both absent", async () => {
    const res = await POST(makeRequest({ headers: { origin: "", referer: "" } }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("CSRF_REJECTED");
  });

  it("returns 403 CSRF_REJECTED when origin does not match app URL", async () => {
    const res = await POST(makeRequest({ headers: { origin: "https://evil.com" } }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("CSRF_REJECTED");
  });

  it("returns 429 when rate limit exceeded", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });
    const res = await POST(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns 400 VALIDATION_ERROR for invalid shipping address", async () => {
    const res = await POST(makeRequest({ body: { shippingAddress: { name: "" } } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });

  it("returns 400 CART_EMPTY when cart has no items", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue({ id: "cart-1", items: [] } as any);
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("CART_EMPTY");
  });

  it("returns 400 PRICE_REJECTED when client supplies amount", async () => {
    const res = await POST(makeRequest({ body: { ...validBody, amount: 5000 } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("PRICE_REJECTED");
  });

  it("returns 400 PRICE_REJECTED when client supplies price", async () => {
    const res = await POST(makeRequest({ body: { ...validBody, price: 5000 } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("PRICE_REJECTED");
  });

  it("includes requestId in error responses", async () => {
    const res = await POST(makeRequest({ headers: { "x-session-id": "" } }));
    const body = await res.json();
    expect(body.requestId).toBeDefined();
    expect(body.requestId.length).toBeGreaterThan(0);
  });
});
