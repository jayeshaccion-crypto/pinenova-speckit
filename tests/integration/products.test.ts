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


