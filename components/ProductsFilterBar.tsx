"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ProductFilters } from "./ProductFilters";

export function ProductsFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = {
    category: searchParams.get("category") || "",
    material: searchParams.get("material") || "",
    sort: searchParams.get("sort") || "newest",
  };

  const onFilterChange = useCallback(
    (newFilters: { category: string; material: string; sort: string }) => {
      const params = new URLSearchParams();
      if (newFilters.category) params.set("category", newFilters.category);
      if (newFilters.material) params.set("material", newFilters.material);
      if (newFilters.sort && newFilters.sort !== "newest") params.set("sort", newFilters.sort);
      const qs = params.toString();
      router.push(qs ? `/products?${qs}` : "/products");
    },
    [router],
  );

  return <ProductFilters filters={filters} onFilterChange={onFilterChange} />;
}
