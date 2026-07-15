"use client";

import { useState } from "react";
import { useAuth } from "./AuthContext";
import Link from "next/link";

interface ReviewFormProps {
  productSlug: string;
}

export function ReviewForm({ productSlug }: ReviewFormProps) {
  const { user, loading: authLoading } = useAuth();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error?.message || "Failed to submit review.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-6 text-center"><p className="text-sm text-foreground/40">Loading...</p></div>;
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-6 text-center">
        <p className="text-sm text-foreground/60">
          <Link href={`/account/auth/login?redirect=/products/${productSlug}`} className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
        Review submitted! It will appear after approval.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} className="text-lg" aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}>
              <span className={star <= rating ? "text-amber-500" : "text-foreground/20"}>{star <= rating ? "★" : "☆"}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Review</label>
        <textarea
          value={body}
          onChange={(e) => { setBody(e.target.value); setError(""); }}
          rows={4}
          maxLength={1000}
          placeholder="Share your experience with this product..."
          className="w-full rounded-lg border border-primary/20 bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/40 focus:outline-none"
          required
        />
        <p className="mt-1 text-xs text-foreground/40">{body.length}/1000</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting || !body.trim()} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}