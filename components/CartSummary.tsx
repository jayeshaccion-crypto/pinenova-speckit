"use client";

import Link from "next/link";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  discountCode?: string;
}

export function CartSummary({ subtotal, itemCount, discountCode }: CartSummaryProps) {
  const isEmpty = itemCount === 0;

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-foreground">Order Summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-foreground/50">Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</dt>
          <dd className="font-medium text-foreground">${subtotal.toFixed(2)}</dd>
        </div>
        {discountCode && (
          <div className="flex justify-between text-green-700">
            <dt>Discount <span className="text-foreground/50">({discountCode})</span></dt>
            <dd>Applied at checkout</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-foreground/50">Shipping</dt>
          <dd className="text-foreground/50">Calculated at checkout</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-foreground/50">Tax</dt>
          <dd className="text-foreground/50">Calculated at checkout</dd>
        </div>
        <div className="border-t border-primary/10 pt-3">
          <div className="flex justify-between">
            <dt className="text-base font-semibold text-foreground">Total</dt>
            <dd className="text-base font-semibold text-foreground">${subtotal.toFixed(2)}</dd>
          </div>
        </div>
      </dl>
      <Link
        href={isEmpty ? "#" : "/checkout"}
        className={`btn-primary mt-6 block w-full text-center ${isEmpty ? "pointer-events-none opacity-50" : ""}`}
      >
        {isEmpty ? "Cart is empty" : "Proceed to Checkout"}
      </Link>
    </div>
  );
}
