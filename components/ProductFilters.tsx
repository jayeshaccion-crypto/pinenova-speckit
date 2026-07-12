"use client";

const CATEGORIES = [
  { slug: "bags", name: "Bags" },
  { slug: "wallets", name: "Wallets" },
  { slug: "belts", name: "Belts" },
  { slug: "footwear", name: "Footwear" },
];

const MATERIALS = ["Pineapple Fiber", "Cactus Leather", "Apple Leather", "Recycled Materials"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

interface ProductFiltersProps {
  filters: { category: string; material: string; sort: string };
  onFilterChange: (filters: { category: string; material: string; sort: string }) => void;
}

export function ProductFilters({ filters, onFilterChange }: ProductFiltersProps) {
  const update = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Category</h3>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => update("category", "")}
              className="accent-primary"
            />
            All Categories
          </label>
          {CATEGORIES.map((cat) => (
            <label key={cat.slug} className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat.slug}
                onChange={() => update("category", cat.slug)}
                className="accent-primary"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Material</h3>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
            <input
              type="radio"
              name="material"
              checked={!filters.material}
              onChange={() => update("material", "")}
              className="accent-primary"
            />
            All Materials
          </label>
          {MATERIALS.map((mat) => (
            <label key={mat} className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
              <input
                type="radio"
                name="material"
                checked={filters.material === mat}
                onChange={() => update("material", mat)}
                className="accent-primary"
              />
              {mat}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Sort By</h3>
        <select
          value={filters.sort}
          onChange={(e) => update("sort", e.target.value)}
          className="input-field mt-2"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
