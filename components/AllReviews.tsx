"use client";

import { useState, useEffect, useCallback } from "react";

interface Review {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  user: { firstName: string };
}

export function AllReviews({ productSlug }: { productSlug: string }) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productSlug}/reviews?page=${pageNum}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch");
      const d = await res.json();
      let data = d.data || [];
      if (pageNum === 1 && !append) {
        data = data.slice(3);
      }
      setReviews(append ? (prev) => [...prev, ...data] : data);
      setTotalPages(d.totalPages || 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    if (!open) {
      setPage(1);
      setReviews([]);
      return;
    }
    fetchReviews(1, false);
  }, [open, fetchReviews]);

  useEffect(() => {
    if (page > 1) {
      fetchReviews(page, false);
    }
  }, [page, fetchReviews]);

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-sm text-primary hover:underline">
        {open ? "Hide all reviews" : "View all reviews"}
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          {loading && reviews.length === 0 ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            </div>
          ) : reviews.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">No more reviews to show.</p>
          ) : (
            <>
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-primary/5 pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{r.user.firstName}</span>
                    <span className="text-xs text-foreground/30">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-1 text-sm text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <p className="mt-1 text-sm text-foreground/60">{r.body}</p>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 text-sm pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded border px-3 py-1 disabled:opacity-30 hover:bg-primary/5"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded border px-3 py-1 disabled:opacity-30 hover:bg-primary/5"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
