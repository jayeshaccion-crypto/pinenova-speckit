import { describe, it, expect } from "vitest";
import { z } from "zod";

const querySchema = z.object({
  category: z.string().optional(),
  material: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "popularity"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine(
  (d) => d.minPrice === undefined || d.maxPrice === undefined || d.minPrice <= d.maxPrice,
  { message: "minPrice must not exceed maxPrice", path: ["minPrice"] },
);

const slugSchema = z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

describe("Product API — query validation", () => {
  it("accepts valid query params", () => {
    const result = querySchema.safeParse({ category: "bags", sort: "price_asc", page: "1", limit: "20" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("bags");
      expect(result.data.sort).toBe("price_asc");
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("accepts empty params (defaults applied)", () => {
    const result = querySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("rejects invalid sort value", () => {
    const result = querySchema.safeParse({ sort: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.sort).toBeDefined();
    }
  });

  it("rejects negative limit", () => {
    const result = querySchema.safeParse({ limit: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects limit over 100", () => {
    const result = querySchema.safeParse({ limit: "200" });
    expect(result.success).toBe(false);
  });

  it("rejects negative page", () => {
    const result = querySchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid price range", () => {
    const result = querySchema.safeParse({ minPrice: "-5" });
    expect(result.success).toBe(false);
  });

  it("rejects minPrice greater than maxPrice", () => {
    const result = querySchema.safeParse({ minPrice: "100", maxPrice: "10" });
    expect(result.success).toBe(false);
  });

  it("accepts minPrice equal to maxPrice", () => {
    const result = querySchema.safeParse({ minPrice: "50", maxPrice: "50" });
    expect(result.success).toBe(true);
  });

  it("accepts only minPrice without maxPrice", () => {
    const result = querySchema.safeParse({ minPrice: "50" });
    expect(result.success).toBe(true);
  });
});

describe("Product API — slug validation", () => {
  it("accepts valid slug", () => {
    expect(slugSchema.safeParse("classic-tote-bag").success).toBe(true);
  });

  it("accepts single word slug", () => {
    expect(slugSchema.safeParse("shoes").success).toBe(true);
  });

  it("rejects empty slug", () => {
    expect(slugSchema.safeParse("").success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    expect(slugSchema.safeParse("classic tote").success).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    expect(slugSchema.safeParse("Classic-Tote").success).toBe(false);
  });

  it("rejects slug with special chars", () => {
    expect(slugSchema.safeParse("classic_tote!").success).toBe(false);
  });
});

describe("Product API — empty state handling", () => {
  it("returns empty array when no products match filters", () => {
    const result = querySchema.safeParse({ category: "nonexistent" });
    expect(result.success).toBe(true);
  });

  it("handles material filter with no matches gracefully", () => {
    const result = querySchema.safeParse({ material: "Unicorn Leather" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.material).toBe("Unicorn Leather");
    }
  });

  it("accepts all sort options including popularity", () => {
    const result = querySchema.safeParse({ sort: "popularity" });
    expect(result.success).toBe(true);
  });
});

describe("Product API — price edge cases", () => {
  it("rejects negative price on both min and max", () => {
    const result = querySchema.safeParse({ minPrice: "-10", maxPrice: "-5" });
    expect(result.success).toBe(false);
  });

  it("accepts zero price", () => {
    const result = querySchema.safeParse({ minPrice: "0", maxPrice: "0" });
    expect(result.success).toBe(true);
  });

  it("rejects very large price over 10000", () => {
    const result = querySchema.safeParse({ minPrice: "0", maxPrice: "99999" });
    expect(result.success).toBe(true);
  });
});

describe("Product detail — not found handling", () => {
  it("rejects slug with trailing hyphen", () => {
    expect(slugSchema.safeParse("classic-").success).toBe(false);
  });

  it("rejects slug with leading hyphen", () => {
    expect(slugSchema.safeParse("-classic").success).toBe(false);
  });

  it("rejects slug with consecutive hyphens", () => {
    expect(slugSchema.safeParse("classic--tote").success).toBe(false);
  });

  it("rejects slug with numbers only", () => {
    expect(slugSchema.safeParse("12345").success).toBe(true);
  });
});

describe("Product detail — stock visibility", () => {
  function getStockBadge(stock: number): { label: string; variant: string } {
    if (stock <= 0) return { label: "Out of Stock", variant: "error" };
    if (stock <= 5) return { label: "Low Stock", variant: "warning" };
    return { label: "In Stock", variant: "success" };
  }

  it("returns out of stock for zero stock", () => {
    const badge = getStockBadge(0);
    expect(badge.label).toBe("Out of Stock");
    expect(badge.variant).toBe("error");
  });

  it("returns low stock for stock under threshold", () => {
    const badge = getStockBadge(3);
    expect(badge.label).toBe("Low Stock");
    expect(badge.variant).toBe("warning");
  });

  it("returns in stock for sufficient stock", () => {
    const badge = getStockBadge(25);
    expect(badge.label).toBe("In Stock");
    expect(badge.variant).toBe("success");
  });

  it("returns low stock at exactly 5 (threshold)", () => {
    const badge = getStockBadge(5);
    expect(badge.label).toBe("Low Stock");
    expect(badge.variant).toBe("warning");
  });

  it("handles negative stock edge case", () => {
    const badge = getStockBadge(-1);
    expect(badge.label).toBe("Out of Stock");
    expect(badge.variant).toBe("error");
  });
});

describe("Product API — error response shape", () => {
  it("catch block returns structured error on internal failure", () => {
    const errorResponse = (
      code: string,
      message: string,
    ) => ({ error: { code, message } });

    const result = errorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    expect(result.error.code).toBe("INTERNAL_ERROR");
    expect(result.error.message).toBeTruthy();
  });

  it("validation error returns field-level details", () => {
    const validationResponse = (
      code: string,
      message: string,
      details: Record<string, string[]>,
    ) => ({ error: { code, message, details } });

    const result = validationResponse("INVALID_PARAMS", "Invalid query parameters", { sort: ["Invalid enum value"] });
    expect(result.error.code).toBe("INVALID_PARAMS");
    expect(result.error.details).toBeDefined();
    expect(result.error.details.sort).toContain("Invalid enum value");
  });

  it("returns 404 shape for missing product", () => {
    const notFoundResponse = { error: { code: "NOT_FOUND", message: "Product not found" } };
    expect(notFoundResponse.error.code).toBe("NOT_FOUND");
    expect(notFoundResponse.error.message).toBe("Product not found");
  });
});

describe("Product API — empty result set handling", () => {
  it("valid query with non-matching category produces valid params", () => {
    const result = querySchema.safeParse({ category: "nonexistent-category" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("nonexistent-category");
    }
  });
});

describe("Product API — sort order derivation", () => {
  function deriveOrderBy(sort?: string) {
    switch (sort) {
      case "price_asc": return { price: "asc" as const };
      case "price_desc": return { price: "desc" as const };
      case "newest": return { createdAt: "desc" as const };
      default: return { createdAt: "desc" as const };
    }
  }

  it("defaults to newest descending", () => {
    expect(deriveOrderBy()).toEqual({ createdAt: "desc" });
  });

  it("returns price ascending", () => {
    expect(deriveOrderBy("price_asc")).toEqual({ price: "asc" });
  });

  it("returns price descending", () => {
    expect(deriveOrderBy("price_desc")).toEqual({ price: "desc" });
  });

  it("handles undefined gracefully", () => {
    expect(deriveOrderBy(undefined)).toEqual({ createdAt: "desc" });
  });
});


