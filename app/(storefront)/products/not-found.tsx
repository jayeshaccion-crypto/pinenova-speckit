import Link from "next/link";

export default function ProductsNotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">No products found</h1>
      <p className="mt-2 text-sm text-neutral-500">
        We could not find any products matching your criteria. Try adjusting your filters or browse all products.
      </p>
      <Link
        href="/products"
        className="mt-6 inline-block rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Browse all products
      </Link>
    </div>
  );
}
