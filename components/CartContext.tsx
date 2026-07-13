"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  loading: boolean;
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE = "";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cart`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.items || []).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name ?? "Unknown",
          price: Number(item.unitPrice ?? item.product?.price ?? 0),
          quantity: item.quantity,
          image: item.product?.images?.[0]?.url,
        }));
        setItems(mapped);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (item: Omit<CartItem, "id">) => {
    const res = await fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
      credentials: "include",
    });
    if (res.ok) {
      await fetchCart();
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const res = await fetch(`${API_BASE}/api/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
      credentials: "include",
    });
    if (res.ok) {
      await fetchCart();
    }
  };

  const removeItem = async (itemId: string) => {
    const res = await fetch(`${API_BASE}/api/cart/${itemId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      await fetchCart();
    }
  };

  const clear = async () => {
    const res = await fetch(`${API_BASE}/api/cart/clear`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      await fetchCart();
    }
  };

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, loading, addItem, updateQuantity, removeItem, clear, refresh: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}