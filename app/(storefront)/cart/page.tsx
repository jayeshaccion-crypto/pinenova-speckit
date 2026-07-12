"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CartItem } from "@/components/CartItem";
import { CartSummary } from "@/components/CartSummary";

interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: Array<{ url: string; altText: string | null }>;
}

interface CartItemData {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: CartItemProduct;
}

interface CartResponse {
  id: string | null;
  items: CartItemData[];
  itemCount: number;
  subtotal: number;
}

const SESSION_KEY = "pinenova_cart_sid";

function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

async function fetchCart(): Promise<CartResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const sid = localStorage.getItem(SESSION_KEY);
  if (sid) headers["x-session-id"] = sid;

  const res = await fetch("/api/cart", { headers });
  if (!res.ok) throw new Error("Failed to load cart");
  return res.json();
}

async function updateItem(productId: string, quantity: number): Promise<CartResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const sid = localStorage.getItem(SESSION_KEY);
  if (sid) headers["x-session-id"] = sid;

  const res = await fetch("/api/cart", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || "Failed to update item");
  }
  return res.json();
}

async function removeItem(productId: string): Promise<CartResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const sid = localStorage.getItem(SESSION_KEY);
  if (sid) headers["x-session-id"] = sid;

  const res = await fetch("/api/cart", {
    method: "DELETE",
    headers,
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) throw new Error("Failed to remove item");
  return res.json();
}

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse>({ id: null, items: [], itemCount: 0, subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCart();
      setCart(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  async function handleUpdateQuantity(productId: string, quantity: number) {
    try {
      setError(null);
      const updated = await updateItem(productId, quantity);
      setCart(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  }

  async function handleRemove(productId: string) {
    try {
      setError(null);
      const updated = await removeItem(productId);
      setCart(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-sm text-foreground/50">Loading cart...</p>
      </div>
    );
  }

  if (cart.itemCount === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-foreground/50">Looks like you have not added anything yet.</p>
        <Link
          href="/products"
          className="btn-primary mt-6 inline-block"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>

      {error && (
        <div className="card mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button type="button" onClick={loadCart} className="ml-2 font-medium underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="divide-y divide-primary/10 lg:col-span-2">
          {cart.items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
            />
          ))}
        </div>
        <div>
          <CartSummary subtotal={cart.subtotal} itemCount={cart.itemCount} />
        </div>
      </div>
    </div>
  );
}
