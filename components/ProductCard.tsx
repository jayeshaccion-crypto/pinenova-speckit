import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "./AddToCartButton";

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number | { toString: () => string };
    materialTag: string;
    stock: number;
    images: Array<{ url: string; altText: string | null }>;
    category: { slug: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const price = typeof product.price === "number" ? product.price : Number(product.price);
  const image = product.images[0];
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="card group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-square overflow-hidden bg-primary/5">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              width={400}
              height={400}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-foreground/30">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </Link>
      <div className="absolute right-2 top-2 z-10">
        <AddToCartButton productId={product.id} productName={product.name} stock={product.stock} variant="icon" />
      </div>
      <Link href={`/products/${product.slug}`} className="block p-4">
        <h3 className="text-sm font-medium text-foreground group-hover:text-foreground/60">{product.name}</h3>
        <p className="mt-1 text-sm text-foreground/50">{product.materialTag}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">${price.toFixed(2)}</p>
          {!inStock && <span className="badge-red text-xs">Out of Stock</span>}
          {lowStock && inStock && <span className="badge-yellow text-xs">Only {product.stock} left</span>}
        </div>
      </Link>
    </div>
  );
}
