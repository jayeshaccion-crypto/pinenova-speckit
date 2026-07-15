"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  images: { url: string; altText: string | null }[];
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) { setResults([]); setOpen(false); setNoResults(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      setNoResults(false);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) { setResults([]); setNoResults(false); return; }
        const data = await res.json();
        const items: SearchResult[] = data.products || [];
        setResults(items);
        setOpen(true);
        setSelectedIndex(-1);
        setNoResults(items.length === 0);
      } catch {
        setResults([]);
        setNoResults(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const navigate = useCallback((slug: string) => {
    setOpen(false);
    setResults([]);
    setNoResults(false);
    router.push(`/products/${slug}`);
  }, [router]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter") {
        e.preventDefault();
        const q = query.trim();
        if (q) router.push(`/products?q=${encodeURIComponent(q)}`);
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) navigate(results[selectedIndex].slug);
      else { const q = query.trim(); if (q) router.push(`/products?q=${encodeURIComponent(q)}`); }
    }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  }

  function closeAndClear() {
    setOpen(false);
    setResults([]);
    setNoResults(false);
  }

  return (
    <div className="relative flex-1 max-w-md mx-auto">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0 || noResults) setOpen(true); }}
        aria-label="Search products"
        placeholder="Search products..."
        className="w-full rounded-full border border-primary/20 bg-background px-4 py-2 pl-10 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/40 focus:outline-none"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-results"
        aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
      />
      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      )}
      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          className="absolute top-full mt-1 w-full rounded-lg border border-primary/10 bg-background shadow-lg z-50 overflow-hidden"
        >
          {results.map((product, i) => (
            <button
              key={product.id}
              id={`search-result-${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              onPointerDown={(e) => { e.preventDefault(); navigate(product.slug); }}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${i === selectedIndex ? "bg-primary/10" : "hover:bg-primary/5"}`}
            >
              {product.images?.[0]?.url ? (
                <img src={product.images[0].url} alt={product.images[0].altText || product.name} className="h-10 w-10 rounded object-cover border border-primary/10 shrink-0" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-dashed border-primary/20 bg-primary/5">
                  <svg className="h-4 w-4 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-foreground font-medium">{product.name}</p>
                <p className="text-xs text-foreground/50">${Number(product.price).toFixed(2)}</p>
              </div>
            </button>
          ))}
          <Link
            href={`/products?q=${encodeURIComponent(query)}`}
            onClick={closeAndClear}
            className="block w-full border-t border-primary/10 px-4 py-2.5 text-center text-xs text-primary hover:bg-primary/5 transition-colors"
          >
            View all results
          </Link>
        </div>
      )}
      {open && noResults && !loading && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          className="absolute top-full mt-1 w-full rounded-lg border border-primary/10 bg-background shadow-lg z-50 overflow-hidden"
        >
          <div className="px-4 py-6 text-center text-sm text-foreground/50">
            No products found
          </div>
        </div>
      )}
    </div>
  );
}
