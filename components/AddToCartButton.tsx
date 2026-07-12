"use client";

import { useState } from "react";

const SESSION_KEY = "pinenova_cart_sid";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  stock: number;
  variant?: "primary" | "icon";
}

export function AddToCartButton({ productId, productName, stock, variant = "primary" }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "added" | "error">("idle");

  async function handleAdd() {
    if (loading || stock <= 0) return;
    setLoading(true);
    setFeedback("idle");

    try {
      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, sid);
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": sid },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!res.ok) {
        setFeedback("error");
        return;
      }

      setFeedback("added");
      setTimeout(() => setFeedback("idle"), 2000);
    } catch {
      setFeedback("error");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleAdd}
        disabled={loading || stock <= 0}
        className="rounded-md border border-primary/20 p-2 text-foreground/50 transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        title={stock <= 0 ? "Out of Stock" : `Add ${productName} to cart`}
      >
        {feedback === "added" ? (
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading || stock <= 0}
      className="btn-primary w-full py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Adding..." : feedback === "added" ? "Added to Cart!" : stock <= 0 ? "Out of Stock" : "Add to Cart"}
    </button>
  );
}
