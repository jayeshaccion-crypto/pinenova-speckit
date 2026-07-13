"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { useToast } from "./ToastProvider";

interface MiniCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCartDrawer({ isOpen, onClose }: MiniCartDrawerProps) {
  const { items, count, loading, updateQuantity, removeItem } = useCart();
  const { showToast } = useToast();
  const [discountCode, setDiscountCode] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleUpdateQuantity(itemId: string, newQty: number) {
    if (newQty < 1 || newQty > 99) return;
    try {
      await updateQuantity(itemId, newQty);
      showToast("Cart updated", "success");
    } catch {
      showToast("Failed to update quantity", "error");
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await removeItem(itemId);
      showToast("Item removed", "info");
    } catch {
      showToast("Failed to remove item", "error");
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl animate-slide-in"
      >
        <div className="flex items-center justify-between border-b border-primary/10 bg-background px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">
            Cart {count > 0 && <span className="text-foreground/50">({count})</span>}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-foreground/60 hover:text-foreground hover:bg-primary/5 transition-colors"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-background px-4 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center bg-background py-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <p className="mt-4 text-sm text-foreground/50">Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-background py-16 text-center">
              <svg className="h-12 w-12 text-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="mt-4 text-sm text-foreground/50">Your cart is empty</p>
              <Link
                href="/products"
                onClick={onClose}
                className="btn-primary mt-4 px-6 py-2 text-sm"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-primary/5" role="list">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  {item.image && (
                    <div
                      className="h-16 w-16 flex-shrink-0 rounded-lg bg-primary/5 bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.image})` }}
                      role="img"
                      aria-label={item.name}
                    />
                  )}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="shrink-0 text-sm font-semibold text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-foreground/50">${item.price.toFixed(2)} each</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-primary/10">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 text-foreground/60 hover:text-foreground disabled:opacity-30 transition-colors"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-xs font-medium text-foreground" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 99}
                          className="px-2 py-1 text-foreground/60 hover:text-foreground disabled:opacity-30 transition-colors"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-primary/10 bg-background px-4 py-4">
            <div className="flex justify-between text-sm font-semibold text-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <p className="mt-1 text-xs text-foreground/50">Shipping and taxes calculated at checkout</p>

            {discountCode ? (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">{discountCode}</span>
                </div>
                <button onClick={() => setDiscountCode("")} className="text-xs text-red-500 hover:text-red-700" aria-label="Remove discount">Remove</button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Discount code"
                  className="input-field flex-1 text-sm"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = discountCode.trim();
                    if (trimmed) setDiscountCode(trimmed);
                  }}
                  className="btn-primary shrink-0 px-3 py-2 text-sm"
                >
                  Apply
                </button>
              </div>
            )}

            <Link
              href="/cart"
              onClick={onClose}
              className="btn-primary mt-3 block w-full text-center text-sm py-2.5"
            >
              View Full Cart
            </Link>
            <Link
              href={`/checkout${discountCode ? `?discount=${discountCode}` : ""}`}
              onClick={onClose}
              className="mt-2 block w-full rounded-lg border border-primary/20 py-2.5 text-center text-sm font-medium text-foreground hover:bg-primary/5 transition-colors"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
