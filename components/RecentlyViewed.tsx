"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";

const STORAGE_KEY = "pinenova_recently_viewed";
const MAX_ITEMS = 8;

interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  price: number;
  materialTag: string;
  stock: number;
  images: Array<{ url: string; altText: string | null }>;
  category: { slug: string };
}

export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const slugs: string[] = raw ? JSON.parse(raw) : [];
      const filtered = slugs.filter((s) => s !== currentSlug).slice(0, MAX_ITEMS);
      if (filtered.length === 0) {
        setLoading(false);
        return;
      }
      fetch(`/api/products?slugs=${filtered.join(",")}&limit=${MAX_ITEMS}`)
        .then((r) => r.json())
        .then((d) => setProducts(d.products || d.data || []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    } catch {
      setLoading(false);
    }
  }, [currentSlug]);

  if (loading || products.length === 0) return null;

  return (
    <section className="border-t border-primary/10 pt-8 mt-8">
      <h2 className="text-xl font-bold text-foreground mb-6">Recently Viewed</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export function trackRecentlyViewed(slug: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const slugs: string[] = raw ? JSON.parse(raw) : [];
    const updated = [slug, ...slugs.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
