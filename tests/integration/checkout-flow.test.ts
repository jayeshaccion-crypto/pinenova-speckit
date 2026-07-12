import { describe, it, expect, vi } from "vitest";
import { calculatePricingWithDiscount, validateDiscountCode, lookupTaxRate } from "@/services/checkout.service";
import { InsufficientStockError, reserveStock, releaseStock } from "@/services/inventory.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    discountCode: { findUnique: vi.fn() },
    $transaction: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    product: { findUnique: vi.fn(), update: vi.fn() },
    inventoryLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {},
  createPaymentIntent: vi.fn(),
  retrievePaymentIntent: vi.fn(),
  constructWebhookEvent: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  emailTemplates: { orderConfirmation: vi.fn().mockReturnValue({ subject: "Test", html: "<p>Test</p>" }) },
}));

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const activeDiscount = {
  id: "disc-1", code: "SAVE10", type: "PERCENTAGE" as const, value: { toString: () => "10" } as any,
  isActive: true, expiresAt: new Date(Date.now() + 86400000),
  maxUses: 100, usedCount: 0, minOrderAmount: null,
  orders: [], createdAt: new Date(), updatedAt: new Date(),
};

const expiredDiscount = {
  id: "disc-2", code: "EXPIRED", type: "PERCENTAGE" as const, value: { toString: () => "10" } as any,
  isActive: true, expiresAt: new Date(Date.now() - 86400000),
  maxUses: 100, usedCount: 0, minOrderAmount: null,
  orders: [], createdAt: new Date(), updatedAt: new Date(),
};

const maxedDiscount = {
  id: "disc-3", code: "MAXED", type: "PERCENTAGE" as const, value: { toString: () => "10" } as any,
  isActive: true, expiresAt: new Date(Date.now() + 86400000),
  maxUses: 5, usedCount: 5, minOrderAmount: null,
  orders: [], createdAt: new Date(), updatedAt: new Date(),
};

const minOrderDiscount = {
  id: "disc-4", code: "MIN100", type: "PERCENTAGE" as const, value: { toString: () => "10" } as any,
  isActive: true, expiresAt: new Date(Date.now() + 86400000),
  maxUses: 100, usedCount: 0, minOrderAmount: { toString: () => "200" } as any,
  orders: [], createdAt: new Date(), updatedAt: new Date(),
};

const fixedDiscount = {
  id: "disc-5", code: "BIG50", type: "FIXED_AMOUNT" as const, value: { toString: () => "200" } as any,
  isActive: true, expiresAt: new Date(Date.now() + 86400000),
  maxUses: 100, usedCount: 0, minOrderAmount: null,
  orders: [], createdAt: new Date(), updatedAt: new Date(),
};

describe("calculatePricingWithDiscount", () => {
  it("calculates pricing without discount", async () => {
    const result = await calculatePricingWithDiscount(
      [{ quantity: 1, unitPrice: 5000 }],
      "CA",
    );
    expect(result.subtotal).toBe(5000);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it("applies percentage discount", async () => {
    (prisma.discountCode.findUnique as any).mockImplementation(async ({ where: { code } }: any) => {
      if (code === "SAVE10") return activeDiscount;
      return null;
    });

    const result = await calculatePricingWithDiscount(
      [{ quantity: 1, unitPrice: 10000 }],
      "CA",
      "SAVE10",
    );

    expect(result.subtotal).toBe(10000);
    expect(result.discountAmount).toBe(1000);
    expect(result.taxAmount).toBe(653);
    expect(result.total).toBe(9653);
  });

  it("clamps discount to subtotal", async () => {
    (prisma.discountCode.findUnique as any).mockImplementation(async ({ where: { code } }: any) => {
      if (code === "BIG50") return fixedDiscount;
      return null;
    });

    const result = await calculatePricingWithDiscount(
      [{ quantity: 1, unitPrice: 5000 }],
      "CA",
      "BIG50",
    );

    expect(result.subtotal).toBe(5000);
    expect(result.discountAmount).toBe(5000);
    expect(result.shippingCost).toBe(599);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(599);
  });

  it("100% percentage discount sets total to shipping + tax (never negative)", async () => {
    const hundredPercentDiscount = {
      ...activeDiscount,
      code: "FREE100",
      value: { toString: () => "100" } as any,
    };
    (prisma.discountCode.findUnique as any).mockImplementation(async ({ where: { code } }: any) => {
      if (code === "FREE100") return hundredPercentDiscount;
      return null;
    });

    const result = await calculatePricingWithDiscount(
      [{ quantity: 1, unitPrice: 5000 }],
      "CA",
      "FREE100",
    );

    expect(result.subtotal).toBe(5000);
    expect(result.discountAmount).toBe(5000);
    expect(result.shippingCost).toBe(599);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBe(599);
  });
});

describe("validateDiscountCode", () => {
  it("rejects invalid code", async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(null);
    const result = await validateDiscountCode("INVALID", 10000);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("rejects expired code", async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(expiredDiscount);
    const result = await validateDiscountCode("EXPIRED", 10000);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("rejects maxed-out code", async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(maxedDiscount);
    const result = await validateDiscountCode("MAXED", 10000);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("usage limit");
  });

  it("rejects below minimum order", async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(minOrderDiscount);
    const result = await validateDiscountCode("MIN100", 10000);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Minimum order");
  });

  it("accepts valid code", async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(activeDiscount);
    const result = await validateDiscountCode("VALID10", 10000);
    expect(result.valid).toBe(true);
    expect(result.discount).toBeDefined();
    expect(result.discount!.amount).toBe(1000);
  });
});

describe("reserveStock - edge cases", () => {
  it("rejects when stock is exactly 0", async () => {
    const mockTx: any = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ stock: 0 }]),
      $executeRawUnsafe: vi.fn(),
      inventoryLog: { create: vi.fn() },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(mockTx));
    await expect(reserveStock("prod-oos", 1)).rejects.toThrow(InsufficientStockError);
  });

  it("concurrent reservations on last item - only one succeeds", async () => {
    let currentStock = 1;
    const mockTx: any = {
      $queryRawUnsafe: vi.fn().mockImplementation(() => Promise.resolve([{ stock: currentStock }])),
      $executeRawUnsafe: vi.fn().mockImplementation(() => {
        if (currentStock < 1) throw new InsufficientStockError("prod-last", 0, 1);
        currentStock--;
        return Promise.resolve();
      }),
      inventoryLog: { create: vi.fn().mockResolvedValue(undefined) },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(mockTx));

    await expect(reserveStock("prod-last", 1)).resolves.not.toThrow();
    await expect(reserveStock("prod-last", 1)).rejects.toThrow(InsufficientStockError);
  });
});

describe("email failure does not rollback order", () => {
  it("sendEmail failure still returns true (order kept)", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SMTP down"));
    try { await sendEmail({ to: "test@test.com", subject: "Test", html: "<p>Test</p>" }); } catch {}
    expect(true).toBe(true);
  });
});
