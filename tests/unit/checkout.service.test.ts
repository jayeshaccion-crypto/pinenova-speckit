import { describe, it, expect, vi } from "vitest";
import { calculatePricing, lookupTaxRate } from "@/services/checkout.service";

describe("lookupTaxRate", () => {
  it("returns 1000 basis points (10%) for all states", () => {
    expect(lookupTaxRate("CA")).toBe(1000);
    expect(lookupTaxRate("NY")).toBe(1000);
    expect(lookupTaxRate("TX")).toBe(1000);
    expect(lookupTaxRate("OR")).toBe(1000);
    expect(lookupTaxRate("XX")).toBe(1000);
  });

  it("is case insensitive", () => {
    expect(lookupTaxRate("ca")).toBe(1000);
    expect(lookupTaxRate("Ny")).toBe(1000);
    expect(lookupTaxRate("tx")).toBe(1000);
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
    expect(result.shippingCost).toBe(800);
    expect(result.taxAmount).toBe(1000);
    expect(result.total).toBe(11800);
  });

  it("applies shipping cost when subtotal under $120 threshold", () => {
    const result = calculatePricing({
      items: [{ quantity: 1, unitPrice: 2500 }],
      stateCode: "TX",
    });
    expect(result.subtotal).toBe(2500);
    expect(result.shippingCost).toBe(800);
    expect(result.taxAmount).toBe(250);
    expect(result.total).toBe(3550);
  });

  it("provides free shipping at exactly $120 threshold", () => {
    const result = calculatePricing({
      items: [{ quantity: 2, unitPrice: 6000 }],
      stateCode: "NY",
    });
    expect(result.subtotal).toBe(12000);
    expect(result.shippingCost).toBe(0);
    expect(result.taxAmount).toBe(1200);
    expect(result.total).toBe(13200);
  });

  it("calculates tax correctly with flat 10%", () => {
    const result = calculatePricing({
      items: [{ quantity: 1, unitPrice: 10000 }],
      stateCode: "CA",
    });
    expect(result.subtotal).toBe(10000);
    expect(result.shippingCost).toBe(800);
    expect(result.taxAmount).toBe(1000);
    expect(result.total).toBe(11800);
  });

  it("uses 10% tax for all state codes", () => {
    const result = calculatePricing({
      items: [{ quantity: 1, unitPrice: 10000 }],
      stateCode: "XX",
    });
    expect(result.taxAmount).toBe(1000);
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
    expect(result.shippingCost).toBe(800);
    expect(result.taxAmount).toBe(650);
    expect(result.total).toBe(7950);
  });

  it("charges flat shipping for subtotal under 12000", () => {
    const result = calculatePricing({
      items: [{ quantity: 1, unitPrice: 9999 }],
      stateCode: "CA",
    });
    expect(result.shippingCost).toBe(800);
    expect(result.total).toBeGreaterThan(0);
  });
});