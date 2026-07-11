import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  product: {
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
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-600">{product.name}</h3>
        <p className="text-sm text-neutral-500">{product.materialTag}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900">${price.toFixed(2)}</p>
          {!inStock && <span className="text-xs text-red-500">Out of Stock</span>}
          {lowStock && inStock && <span className="text-xs text-amber-600">Only {product.stock} left</span>}
        </div>
      </div>
    </Link>
  );
}
