"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [loading, setLoading] = useState(false);
  const { product } = item;
  const image = product.images[0];

  async function handleQuantityChange(newQty: number) {
    if (newQty === item.quantity || newQty < 0 || newQty > 99) return;
    setLoading(true);
    try {
      await onUpdateQuantity(item.productId, newQty);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      await onRemove(item.productId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-4 py-4 sm:gap-6">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-primary/5 sm:h-32 sm:w-32">
        {image ? (
          <Image src={image.url} alt={image.altText ?? product.name} width={128} height={128} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-foreground/30">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between">
          <div>
            <Link href={`/products/${product.slug}`} className="text-sm font-medium text-foreground hover:text-foreground/60">
              {product.name}
            </Link>
            <p className="mt-1 text-sm text-foreground/50">${item.unitPrice.toFixed(2)} each</p>
          </div>
          <p className="text-sm font-semibold text-foreground">${item.lineTotal.toFixed(2)}</p>
        </div>

        <div className="mt-2 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground/50">
            Qty
            <select
              value={item.quantity}
              disabled={loading}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              className="input-field py-1 px-2 text-sm disabled:opacity-50"
            >
              {Array.from({ length: Math.min(product.stock, 99) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Remove
          </button>
          {loading && <span className="text-xs text-foreground/40">Updating...</span>}
        </div>
      </div>
    </div>
  );
}
