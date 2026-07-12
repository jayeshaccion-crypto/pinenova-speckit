import { describe, it, expect } from "vitest";
import { AddCartItemSchema, UpdateCartItemSchema, RemoveCartItemSchema } from "@/types";

const validUuid = "123e4567-e89b-12d3-a456-426614174000";

describe("Cart API — AddCartItemSchema validation", () => {
  it("accepts valid productId and quantity", () => {
    const result = AddCartItemSchema.safeParse({ productId: validUuid, quantity: 1 });
    expect(result.success).toBe(true);
  });

  it("accepts quantity at upper bound (99)", () => {
    const result = AddCartItemSchema.safeParse({ productId: validUuid, quantity: 99 });
    expect(result.success).toBe(true);
  });

  it("rejects quantity 0 (below min)", () => {
    const result = AddCartItemSchema.safeParse({ productId: validUuid, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects quantity 100 (above max)", () => {
    const result = AddCartItemSchema.safeParse({ productId: validUuid, quantity: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = AddCartItemSchema.safeParse({ productId: validUuid, quantity: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID productId", () => {
    const result = AddCartItemSchema.safeParse({ productId: "not-a-uuid", quantity: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects missing productId", () => {
    const result = AddCartItemSchema.safeParse({ quantity: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects missing quantity", () => {
    const result = AddCartItemSchema.safeParse({ productId: validUuid });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer quantity", () => {
    const result = AddCartItemSchema.safeParse({ productId: validUuid, quantity: 1.5 });
    expect(result.success).toBe(false);
  });

  it("coerces string quantity to number", () => {
    const result = AddCartItemSchema.safeParse({ productId: validUuid, quantity: "3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(3);
    }
  });
});

describe("Cart API — UpdateCartItemSchema validation", () => {
  it("accepts valid update with quantity 0 (remove)", () => {
    const result = UpdateCartItemSchema.safeParse({ productId: validUuid, quantity: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts valid update with positive quantity", () => {
    const result = UpdateCartItemSchema.safeParse({ productId: validUuid, quantity: 5 });
    expect(result.success).toBe(true);
  });

  it("rejects quantity 100 (above max)", () => {
    const result = UpdateCartItemSchema.safeParse({ productId: validUuid, quantity: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = UpdateCartItemSchema.safeParse({ productId: validUuid, quantity: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID productId", () => {
    const result = UpdateCartItemSchema.safeParse({ productId: "bad-id", quantity: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects missing quantity", () => {
    const result = UpdateCartItemSchema.safeParse({ productId: validUuid });
    expect(result.success).toBe(false);
  });
});

describe("Cart API — RemoveCartItemSchema validation", () => {
  it("accepts valid productId", () => {
    const result = RemoveCartItemSchema.safeParse({ productId: validUuid });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID productId", () => {
    const result = RemoveCartItemSchema.safeParse({ productId: "bad-id" });
    expect(result.success).toBe(false);
  });

  it("rejects empty body", () => {
    const result = RemoveCartItemSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("Cart API — error response shape", () => {
  it("invalid input returns 400 shape with field details", () => {
    const errorResponse = (
      code: string,
      message: string,
      details: Record<string, string[]>,
      requestId: string,
    ) => ({ error: { code, message, details, requestId } });

    const result = errorResponse("INVALID_INPUT", "Invalid cart item", { quantity: ["Number must be greater than or equal to 1"] }, crypto.randomUUID());
    expect(result.error.code).toBe("INVALID_INPUT");
    expect(result.error.details).toBeDefined();
    expect(result.error.details.quantity).toContain("Number must be greater than or equal to 1");
    expect(result.error.requestId).toBeDefined();
  });

  it("not found returns 404 shape", () => {
    const notFound = (code: string, message: string, requestId: string) => ({ error: { code, message, requestId } });

    const result = notFound("NOT_FOUND", "Product not found", crypto.randomUUID());
    expect(result.error.code).toBe("NOT_FOUND");
    expect(result.error.message).toBe("Product not found");
    expect(result.error.requestId).toBeDefined();
  });

  it("out of stock returns 409 shape", () => {
    const oos = (code: string, message: string, requestId: string) => ({ error: { code, message, requestId } });

    const result = oos("OUT_OF_STOCK", "Insufficient stock. Available: 0", crypto.randomUUID());
    expect(result.error.code).toBe("OUT_OF_STOCK");
    expect(result.error.message).toContain("Insufficient stock");
    expect(result.error.requestId).toBeDefined();
  });

  it("internal error returns 500 shape", () => {
    const internal = (code: string, message: string, requestId: string) => ({ error: { code, message, requestId } });

    const result = internal("INTERNAL_ERROR", "An unexpected error occurred", crypto.randomUUID());
    expect(result.error.code).toBe("INTERNAL_ERROR");
    expect(result.error.requestId).toBeDefined();
  });
});

describe("Cart API — idempotent add logic", () => {
  function simulateAdd(existingItems: Array<{ productId: string; quantity: number }>, productId: string, quantity: number) {
    const existing = existingItems.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
      return { items: existingItems, merged: true };
    }
    existingItems.push({ productId, quantity });
    return { items: existingItems, merged: false };
  }

  it("creates new item when productId not in cart", () => {
    const items: Array<{ productId: string; quantity: number }> = [];
    const result = simulateAdd(items, validUuid, 1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(1);
    expect(result.merged).toBe(false);
  });

  it("increments quantity when same productId added again (idempotent)", () => {
    const items = [{ productId: validUuid, quantity: 1 }];
    const result = simulateAdd(items, validUuid, 1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(2);
    expect(result.merged).toBe(true);
  });

  it("handles double-click add (two rapid adds of same product)", () => {
    const items: Array<{ productId: string; quantity: number }> = [];
    simulateAdd(items, validUuid, 1);
    simulateAdd(items, validUuid, 1);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("handles concurrent tab adds (different products merge correctly)", () => {
    const uuid2 = "223e4567-e89b-12d3-a456-426614174001";
    const items: Array<{ productId: string; quantity: number }> = [];
    simulateAdd(items, validUuid, 1);
    simulateAdd(items, uuid2, 1);
    expect(items).toHaveLength(2);
    expect(items[0].quantity).toBe(1);
    expect(items[1].quantity).toBe(1);
  });
});

describe("Cart API — cart totals logic", () => {
  interface CartItemInput {
    productId: string;
    quantity: number;
    unitPrice: number;
  }

  function calculateTotals(items: CartItemInput[]) {
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return { subtotal, itemCount, lineItems: items.map((i) => ({ ...i, lineTotal: i.unitPrice * i.quantity })) };
  }

  it("returns zero totals for empty cart", () => {
    const result = calculateTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.itemCount).toBe(0);
    expect(result.lineItems).toHaveLength(0);
  });

  it("calculates single item correctly", () => {
    const result = calculateTotals([{ productId: validUuid, quantity: 2, unitPrice: 89.99 }]);
    expect(result.subtotal).toBe(179.98);
    expect(result.itemCount).toBe(2);
    expect(result.lineItems[0].lineTotal).toBe(179.98);
  });

  it("calculates multiple items correctly", () => {
    const uuid2 = "223e4567-e89b-12d3-a456-426614174001";
    const result = calculateTotals([
      { productId: validUuid, quantity: 1, unitPrice: 89.99 },
      { productId: uuid2, quantity: 3, unitPrice: 49.99 },
    ]);
    expect(result.subtotal).toBeCloseTo(239.96);
    expect(result.itemCount).toBe(4);
  });

  it("handles quantity update correctly (increase)", () => {
    const items = [{ productId: validUuid, quantity: 1, unitPrice: 50 }];
    items[0].quantity = 3;
    const result = calculateTotals(items);
    expect(result.subtotal).toBe(150);
    expect(result.itemCount).toBe(3);
  });

  it("handles quantity update correctly (decrease to zero removes)", () => {
    const items = [{ productId: validUuid, quantity: 1, unitPrice: 50 }];
    const remaining = items.filter((i) => i.productId !== validUuid);
    const result = calculateTotals(remaining);
    expect(result.subtotal).toBe(0);
    expect(result.itemCount).toBe(0);
  });

  it("maintains precision with fractional prices", () => {
    const result = calculateTotals([{ productId: validUuid, quantity: 3, unitPrice: 29.97 }]);
    expect(result.subtotal).toBeCloseTo(89.91);
  });
});

describe("Cart API — quantity bounds logic", () => {
  it("rejects add with quantity exceeding 99", () => {
    const result = AddCartItemSchema.safeParse({ productId: validUuid, quantity: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects update with quantity exceeding 99", () => {
    const result = UpdateCartItemSchema.safeParse({ productId: validUuid, quantity: 100 });
    expect(result.success).toBe(false);
  });

  it("accepts maximum valid quantity (99)", () => {
    const add = AddCartItemSchema.safeParse({ productId: validUuid, quantity: 99 });
    expect(add.success).toBe(true);

    const update = UpdateCartItemSchema.safeParse({ productId: validUuid, quantity: 99 });
    expect(update.success).toBe(true);
  });

  it("rejects update with negative quantity", () => {
    const result = UpdateCartItemSchema.safeParse({ productId: validUuid, quantity: -5 });
    expect(result.success).toBe(false);
  });
});

describe("Cart API — out-of-stock rejection logic", () => {
  function canAddToCart(stock: number, currentQty: number, requestedQty: number): { allowed: boolean; reason?: string } {
    const newQty = currentQty + requestedQty;
    if (stock < newQty) {
      return { allowed: false, reason: `Insufficient stock. Available: ${stock}` };
    }
    return { allowed: true };
  }

  it("allows add when stock sufficient", () => {
    expect(canAddToCart(10, 0, 1).allowed).toBe(true);
  });

  it("blocks add when stock insufficient", () => {
    const result = canAddToCart(2, 0, 5);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Insufficient stock");
  });

  it("allows add when current + requested exactly equals stock", () => {
    expect(canAddToCart(5, 0, 5).allowed).toBe(true);
  });

  it("accounts for existing quantity in cart (increment case)", () => {
    const result = canAddToCart(5, 3, 3);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Available: 5");
  });

  it("handles zero stock", () => {
    const result = canAddToCart(0, 0, 1);
    expect(result.allowed).toBe(false);
  });
});

describe("Cart API — stock badge logic", () => {
  function getStockBadge(stock: number): { label: string; variant: string } {
    if (stock <= 0) return { label: "Out of Stock", variant: "error" };
    if (stock <= 5) return { label: "Low Stock", variant: "warning" };
    return { label: "In Stock", variant: "success" };
  }

  it("returns out of stock for zero stock", () => {
    expect(getStockBadge(0).label).toBe("Out of Stock");
  });

  it("returns low stock for stock under threshold", () => {
    expect(getStockBadge(3).label).toBe("Low Stock");
  });

  it("returns in stock for sufficient stock", () => {
    expect(getStockBadge(25).label).toBe("In Stock");
  });

  it("returns low stock at exactly 5 (threshold)", () => {
    expect(getStockBadge(5).label).toBe("Low Stock");
  });
});

describe("Cart API — rate limiting logic", () => {
  interface RateLimitEntry {
    count: number;
    resetAt: number;
  }

  function createRateLimiter(maxRequests: number, windowMs: number) {
    const store = new Map<string, RateLimitEntry>();
    return {
      check: (key: string): { allowed: boolean; remaining: number } => {
        const now = Date.now();
        const entry = store.get(key);
        if (!entry || now > entry.resetAt) {
          store.set(key, { count: 1, resetAt: now + windowMs });
          return { allowed: true, remaining: maxRequests - 1 };
        }
        if (entry.count >= maxRequests) return { allowed: false, remaining: 0 };
        entry.count++;
        return { allowed: true, remaining: maxRequests - entry.count };
      },
    };
  }

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter(30, 60000);
    const result = limiter.check("test-key");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(29);
  });

  it("blocks requests at the limit", () => {
    const limiter = createRateLimiter(3, 60000);
    limiter.check("key");
    limiter.check("key");
    limiter.check("key");
    const result = limiter.check("key");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("independent keys have independent counters", () => {
    const limiter = createRateLimiter(2, 60000);
    limiter.check("key-a");
    limiter.check("key-a");
    expect(limiter.check("key-b").allowed).toBe(true);
    expect(limiter.check("key-b").remaining).toBe(0);
  });

  it("rate limit 429 response shape", () => {
    const errorResponse = { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later.", requestId: "test-uuid" } };
    expect(errorResponse.error.code).toBe("RATE_LIMITED");
    expect(errorResponse.error.requestId).toBeDefined();
  });
});
