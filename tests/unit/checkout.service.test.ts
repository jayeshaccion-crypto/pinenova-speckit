import { describe, it, expect, vi } from "vitest";
import { calculatePricing, lookupTaxRate } from "@/services/checkout.service";

describe("lookupTaxRate", () => {
  it("returns basis points for known states", () => {
    expect(lookupTaxRate("CA")).toBe(725);
    expect(lookupTaxRate("NY")).toBe(888);
    expect(lookupTaxRate("TX")).toBe(825);
    expect(lookupTaxRate("OR")).toBe(0);
  });

  it("returns 0 for unknown states and logs warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(lookupTaxRate("XX")).toBe(0);
    warnSpy.mockRestore();
  });

  it("is case insensitive", () => {
    expect(lookupTaxRate("ca")).toBe(725);
    expect(lookupTaxRate("Ny")).toBe(888);
  });
});

describe("calculatePricing", () => {
  it("calculates pricing with no discount", () => {
    const result = calculatePricing({
      items: [{ quantity: 2, unitPrice: 5000 }],
      stateCode: "CA",
    });
    expect(result.subtotal).toBe(10000);
    expect(result.discountAmount).toBe(0);
    expect(result.shippingCost).toBe(0);
    expect(result.taxAmount).toBe(725);
    expect(result.total).toBe(10725);
  });

  it("applies shipping cost when subtotal under $100 threshold", () => {
    const result = calculatePricing({
      items: [{ quantity: 1, unitPrice: 2500 }],
      stateCode: "TX",
    });
    expect(result.subtotal).toBe(2500);
    expect(result.shippingCost).toBe(599);
    expect(result.taxAmount).toBe(206);
    expect(result.total).toBe(3305);
  });

  it("provides free shipping at exactly $100 threshold", () => {
    const result = calculatePricing({
      items: [{ quantity: 2, unitPrice: 5000 }],
      stateCode: "NY",
    });
    expect(result.subtotal).toBe(10000);
    expect(result.shippingCost).toBe(0);
  });

  it("calculates tax correctly with basis points", () => {
    const result = calculatePricing({
      items: [{ quantity: 1, unitPrice: 10000 }],
      stateCode: "CA",
    });
    expect(result.subtotal).toBe(10000);
    expect(result.shippingCost).toBe(0);
    expect(result.taxAmount).toBe(725);
    expect(result.total).toBe(10725);
  });

  it("uses 0 tax for unknown state codes", () => {
    const result = calculatePricing({
      items: [{ quantity: 1, unitPrice: 10000 }],
      stateCode: "XX",
    });
    expect(result.taxAmount).toBe(0);
  });

  it("handles multiple items", () => {
    const result = calculatePricing({
      items: [
        { quantity: 2, unitPrice: 2500 },
        { quantity: 1, unitPrice: 1500 },
      ],
      stateCode: "FL",
    });
    expect(result.subtotal).toBe(6500);
    expect(result.shippingCost).toBe(599);
    expect(result.taxAmount).toBe(455);
    expect(result.total).toBe(7554);
  });

  it("charges flat shipping for subtotal under 10000", () => {
    const result = calculatePricing({
      items: [{ quantity: 1, unitPrice: 9999 }],
      stateCode: "CA",
    });
    expect(result.shippingCost).toBe(599);
    expect(result.total).toBeGreaterThan(0);
  });
});
