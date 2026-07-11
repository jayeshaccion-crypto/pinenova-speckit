import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, published: true },
    select: { name: true, description: true },
  });
  if (!product) return { title: "Product Not Found" };
  return { title: product.name, description: product.description };
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, published: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        select: { rating: true, body: true, createdAt: true, user: { select: { firstName: true } } },
        take: 3,
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!product) return null;
  return { ...product, price: Number(product.price) };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const inStock = product.stock > 0;
  const avgRating = product.reviews.length > 0
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.sku,
    brand: { "@type": "Brand", name: "PineNova" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `/products/${product.slug}`,
    },
    ...(avgRating ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: product.reviews.length,
      },
    } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-neutral-900">Products</Link>
          <span className="mx-2">/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:text-neutral-900">
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {product.images.map((image) => (
              <div key={image.id} className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={image.url}
                  alt={image.altText ?? product.name}
                  width={600}
                  height={600}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            {product.images.length === 0 && (
              <div className="flex aspect-square items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{product.name}</h1>
              <p className="mt-2 text-sm text-neutral-500">{product.materialTag}</p>
              <p className="mt-4 text-2xl font-semibold text-neutral-900">${product.price.toFixed(2)}</p>
              <div className="mt-2">
                {inStock ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    In Stock{product.stock <= 5 ? ` (only ${product.stock} left)` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Description</h2>
              <p className="mt-1 text-sm text-neutral-600 leading-relaxed">{product.description}</p>
            </div>

            {product.sustainabilityBadge && (
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">Sustainable & Vegan</p>
                <p className="mt-1 text-xs text-green-600">Made from eco-friendly, vegan materials. No animal products used.</p>
              </div>
            )}

            <div className="border-t border-neutral-200 pt-6">
              <h2 className="text-sm font-semibold text-neutral-900">Product Details</h2>
              <dl className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">SKU</dt>
                  <dd className="text-neutral-900">{product.sku}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Material</dt>
                  <dd className="text-neutral-900">{product.materialTag}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Category</dt>
                  <dd className="text-neutral-900">
                    <Link href={`/categories/${product.category.slug}`} className="hover:underline">
                      {product.category.name}
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>

            {product.reviews.length > 0 && (
              <div className="border-t border-neutral-200 pt-6">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold text-neutral-900">Reviews</h2>
                  {avgRating && <span className="text-sm text-neutral-500">({avgRating} avg, {product.reviews.length} review{product.reviews.length !== 1 ? "s" : ""})</span>}
                </div>
                <div className="mt-4 space-y-4">
                  {product.reviews.map((review, i) => (
                    <div key={i} className="border-b border-neutral-100 pb-3 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{review.user.firstName}</span>
                        <span className="text-xs text-neutral-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1 text-sm text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                      <p className="mt-1 text-sm text-neutral-600">{review.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!inStock && (
              <div className="rounded-lg border border-neutral-200 p-4 text-center">
                <p className="text-sm font-medium text-neutral-900">Out of Stock</p>
                <p className="mt-1 text-xs text-neutral-500">This product is currently unavailable. Check back later or browse similar items.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
