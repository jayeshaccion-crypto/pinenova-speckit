import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {
  product: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  order: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
  discountCode: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  inventoryLog: { findMany: vi.fn(), create: vi.fn() },
  orderStatusLog: { create: vi.fn() },
  $queryRawUnsafe: vi.fn(),
  user: { findUnique: vi.fn() },
  category: { findMany: vi.fn(), findUnique: vi.fn() },
} }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/audit", () => ({ logAuditEvent: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(), rateLimitResponse: vi.fn() }));
vi.mock("@/lib/rate-limiter", () => ({ checkAuthRateLimit: vi.fn().mockReturnValue(true), checkRateLimit: vi.fn().mockReturnValue(true), rateLimitMiddleware: vi.fn() }));
vi.mock("@/lib/auth", () => ({ hashPassword: vi.fn(), verifyAccessToken: vi.fn(), comparePassword: vi.fn(), signAccessToken: vi.fn(), signRefreshToken: vi.fn(), clearUserRefreshTokens: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ stripe: { refunds: { create: vi.fn().mockResolvedValue({ id: "refund_1" }) } }, createRefund: vi.fn() }));

import { GET as getProducts, POST as createProduct, PATCH as updateProduct, DELETE as archiveProduct } from "@/app/api/admin/products/route";
import { GET as getOrders, PATCH as updateOrder, POST as refundOrder } from "@/app/api/admin/orders/route";
import { GET as getInventory, POST as adjustInventory } from "@/app/api/admin/inventory/route";
import { GET as getDiscounts, POST as createDiscount, DELETE as deactivateDiscount } from "@/app/api/admin/discounts/route";
import { AdminDiscountCreateSchema } from "@/types";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

function adminRequest(method: string = "GET", body?: any, query?: string): Request {
  const headers: Record<string, string> = {
    authorization: "Bearer admin-token",
    "content-type": "application/json",
    origin: "http://localhost:3000",
  };
  const init: RequestInit = { method, headers };
  if (body) init.body = JSON.stringify(body);
  return new Request(`http://localhost:3000/api/admin${query || ""}`, init);
}

function nonAdminRequest(method: string = "GET", body?: any): Request {
  const headers: Record<string, string> = {
    authorization: "Bearer customer-token",
    "content-type": "application/json",
    origin: "http://localhost:3000",
  };
  const init: RequestInit = { method, headers };
  if (body) init.body = JSON.stringify(body);
  return new Request("http://localhost:3000/api/admin/products", init);
}

const mockProduct = { id: "prod-1", name: "Test Product", slug: "test-product", sku: "TST-001", price: 29.99, stock: 10, description: "Test", materialTag: "Pineapple Fiber", published: false, isArchived: false, categoryId: "cat-1", createdAt: new Date(), updatedAt: new Date(), lowStockThreshold: 5, sustainabilityBadge: true, category: { id: "cat-1", name: "Bags" }, images: [] };

const mockOrder = { id: "ord-1", orderNumber: "ORD-001", status: "CONFIRMED", total: 50.00, subtotal: 50.00, tax: 0, shippingCost: 0, stripePaymentIntentId: "pi_123", createdAt: new Date(), updatedAt: new Date(), email: "test@example.com", items: [], user: { id: "user-1", email: "test@example.com", firstName: "Test", lastName: "User" } };

describe("Admin — Auth Guard", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(verifyAccessToken).mockResolvedValue({ sub: "user-1", role: "CUSTOMER" }); vi.mocked(rateLimit).mockReturnValue({ allowed: true, remaining: 59 }); });

  it("returns 403 for non-admin user", async () => {
    const res = await getProducts(nonAdminRequest());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 401 without auth token", async () => {
    const req = new Request("http://localhost:3000/api/admin/products");
    const res = await getProducts(req);
    expect(res.status).toBe(401);
  });
});

describe("Admin — Products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAccessToken).mockResolvedValue({ sub: "admin-1", role: "ADMIN" });
    vi.mocked(rateLimit).mockReturnValue({ allowed: true, remaining: 59 });
  });

  it("lists products", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(1);
    const res = await getProducts(adminRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("creates a product", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);
    const res = await createProduct(adminRequest("POST", { name: "Test Product", slug: "test-product", sku: "TST-001", price: 29.99, description: "Test product", categoryId: "cat-1" }));
    expect(res.status).toBe(201);
  });

  it("rejects duplicate slug/SKU", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);
    const res = await createProduct(adminRequest("POST", { name: "Test Product", slug: "test-product", sku: "TST-001", price: 29.99, description: "Test", categoryId: "cat-1" }));
    expect(res.status).toBe(409);
  });

  it("archives a product", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.product.update).mockResolvedValue({ ...mockProduct, isArchived: true } as any);
    const res = await archiveProduct(adminRequest("DELETE", undefined, "?id=prod-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("archived");
  });
});

describe("Admin — Orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAccessToken).mockResolvedValue({ sub: "admin-1", role: "ADMIN" });
    vi.mocked(rateLimit).mockReturnValue({ allowed: true, remaining: 59 });
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
  });

  it("lists orders", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder] as any);
    vi.mocked(prisma.order.count).mockResolvedValue(1);
    const res = await getOrders(adminRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("updates order status with valid transition", async () => {
    vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: "PROCESSING" } as any);
    const res = await updateOrder(adminRequest("PATCH", { orderId: "ord-1", status: "PROCESSING" }));
    expect(res.status).toBe(200);
  });

  it("rejects invalid transition (DELIVERED → SHIPPED)", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...mockOrder, status: "DELIVERED" } as any);
    const res = await updateOrder(adminRequest("PATCH", { orderId: "ord-1", status: "SHIPPED" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_TRANSITION");
  });

  it("processes refund", async () => {
    vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: "REFUNDED", refundId: "refund_1" } as any);
    const res = await refundOrder(adminRequest("POST", { orderId: "ord-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Refund");
  });

  it("is idempotent on duplicate refund (refundId exists)", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...mockOrder, refundId: "refund_1" } as any);
    const res = await refundOrder(adminRequest("POST", { orderId: "ord-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("already processed");
  });
});

describe("Admin — Inventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAccessToken).mockResolvedValue({ sub: "admin-1", role: "ADMIN" });
    vi.mocked(rateLimit).mockReturnValue({ allowed: true, remaining: 59 });
  });

  it("lists inventory", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
    vi.mocked(prisma.inventoryLog.findMany).mockResolvedValue([]);
    const res = await getInventory(adminRequest());
    expect(res.status).toBe(200);
  });

  it("adjusts stock with valid values", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.product.update).mockResolvedValue({ ...mockProduct, stock: 15 } as any);
    const res = await adjustInventory(adminRequest("POST", { productId: "prod-1", newStock: 15, reason: "Restock" }));
    expect(res.status).toBe(200);
  });

  it("rejects negative stock", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    const res = await adjustInventory(adminRequest("POST", { productId: "prod-1", newStock: -1, reason: "Error" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_STOCK");
  });
});

describe("Admin — Discounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAccessToken).mockResolvedValue({ sub: "admin-1", role: "ADMIN" });
    vi.mocked(rateLimit).mockReturnValue({ allowed: true, remaining: 59 });
  });

  it("lists discount codes", async () => {
    vi.mocked(prisma.discountCode.findMany).mockResolvedValue([{ id: "dc-1", code: "SAVE10", type: "PERCENTAGE", value: 10, usedCount: 0, maxUses: null, isActive: true }] as any);
    const res = await getDiscounts(adminRequest());
    expect(res.status).toBe(200);
  });

  it("creates a discount code", async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.discountCode.create).mockResolvedValue({ id: "dc-1", code: "SAVE10", type: "PERCENTAGE", value: 10 } as any);
    const res = await createDiscount(adminRequest("POST", { code: "SAVE10", type: "PERCENTAGE", value: 10 }));
    expect(res.status).toBe(201);
  });

  it("rejects duplicate discount code", async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue({ id: "dc-1", code: "SAVE10" } as any);
    const res = await createDiscount(adminRequest("POST", { code: "SAVE10", type: "PERCENTAGE", value: 10 }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("DUPLICATE_CODE");
  });

  it("rejects percentage discount over 100% at schema level", () => {
    const result = AdminDiscountCreateSchema.safeParse({ code: "TOOMUCH", type: "PERCENTAGE", value: 150 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("value");
    }
  });
});
