import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ReviewForm } from "@/components/ReviewForm";
import { AllReviews } from "@/components/AllReviews";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { VariantSelector } from "@/components/VariantSelector";
import { RelatedProducts } from "@/components/RelatedProducts";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { TrackRecentlyViewed } from "@/components/TrackRecentlyViewed";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, published: true },
    select: { name: true, description: true },
  });
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${params.slug}` },
  };
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, published: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        select: { id: true, rating: true, body: true, createdAt: true, user: { select: { firstName: true } } },
        take: 3,
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { reviews: { where: { status: "APPROVED" } } } },
    },
  });
  if (!product) return null;

  const avgRating = await prisma.review.aggregate({
    where: { productId: product.id, status: "APPROVED" },
    _avg: { rating: true },
  });

  return { ...product, price: Number(product.price), reviewCount: product._count.reviews, avgRating: avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(1)) : null };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const inStock = product.stock > 0;
  const { avgRating, reviewCount } = product;

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
        reviewCount: reviewCount,
      },
    } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${process.env.NEXT_PUBLIC_APP_URL || ""}/` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${process.env.NEXT_PUBLIC_APP_URL || ""}/products` },
      { "@type": "ListItem", position: 3, name: product.category.name, item: `${process.env.NEXT_PUBLIC_APP_URL || ""}/categories/${product.category.slug}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${process.env.NEXT_PUBLIC_APP_URL || ""}/products/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-foreground/50">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <span className="mx-2">/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <ProductImageGallery images={product.images} productName={product.name} />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{product.name}</h1>
              <p className="mt-2 text-sm text-foreground/50">{product.materialTag}</p>
              <p className="mt-4 text-2xl font-semibold text-foreground">${product.price.toFixed(2)}</p>
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
              <h2 className="text-sm font-semibold text-foreground">Description</h2>
              <p className="mt-1 text-sm text-foreground/60 leading-relaxed">{product.description}</p>
            </div>

            <VariantSelector />
            <div className="space-y-3 pt-2">
              <AddToCartButton productId={product.id} productName={product.name} stock={product.stock} />
            </div>

            {product.sustainabilityBadge && (
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">Sustainable & Vegan</p>
                <p className="mt-1 text-xs text-green-600">Made from eco-friendly, vegan materials. No animal products used.</p>
              </div>
            )}

            <div className="border-t border-primary/10 pt-6">
              <h2 className="text-sm font-semibold text-foreground">Product Details</h2>
              <dl className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-foreground/50">SKU</dt>
                  <dd className="text-foreground">{product.sku}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground/50">Material</dt>
                  <dd className="text-foreground">{product.materialTag}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground/50">Category</dt>
                  <dd className="text-foreground">
                    <Link href={`/categories/${product.category.slug}`} className="hover:underline">
                      {product.category.name}
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-primary/10 pt-6">
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-foreground">Reviews</h2>
                {avgRating && <span className="text-sm text-foreground/50">({avgRating} avg, {reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>}
              </div>
              {reviewCount > 0 ? (
                <div className="mt-4 space-y-4">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="border-b border-primary/5 pb-3 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{review.user.firstName}</span>
                        <span className="text-xs text-foreground/30">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1 text-sm text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                      <p className="mt-1 text-sm text-foreground/60">{review.body}</p>
                    </div>
                  ))}
                  <AllReviews productSlug={product.slug} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-foreground/50">No reviews yet. Be the first to review this product!</p>
              )}
              <div className="mt-6 border-t border-primary/5 pt-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Write a Review</h3>
                <ReviewForm productSlug={product.slug} />
              </div>
            </div>

            {!inStock && (
              <div className="rounded-lg border border-primary/10 p-4 text-center">
                <p className="text-sm font-medium text-foreground">Out of Stock</p>
                <p className="mt-1 text-xs text-foreground/50">This product is currently unavailable. Check back later or browse similar items.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <RelatedProducts currentProductId={product.id} categoryId={product.category.id} />
      <TrackRecentlyViewed slug={product.slug} />
      <RecentlyViewed currentSlug={product.slug} />
    </>
  );
}
