import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";

export const metadata: Metadata = {
  description: "Sustainable, cruelty-free accessories crafted from pineapple fiber. Shop bags, wallets, belts, and footwear.",
  alternates: { canonical: "/" },
};

async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: { select: { slug: true } },
    },
  });
  return products.map((p) => ({ ...p, price: Number(p.price) }));
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="py-16 sm:py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Pineapple Vegan Leather
          </h1>
          <p className="mt-4 text-lg text-foreground/60 max-w-2xl mx-auto">
            Sustainable, cruelty-free accessories crafted from pineapple fiber. Every purchase supports a greener planet.
          </p>
          <Link
            href="/products"
            className="btn-primary mt-8 inline-block"
          >
            Shop All Products
          </Link>
        </div>
      </section>

      <section className="py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Categories</h2>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="rounded-xl border border-primary/10 p-6 text-center transition-colors hover:border-primary"
            >
              <h3 className="font-medium text-foreground">{cat.name}</h3>
              {cat.description && <p className="mt-1 text-xs text-foreground/50 line-clamp-2">{cat.description}</p>}
            </Link>
          ))}
        </div>
      </section>

      <section className="py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">New Arrivals</h2>
          <Link href="/products" className="text-sm text-foreground/60 hover:text-foreground">View All</Link>
        </div>
        <div className="mt-6">
          <ProductGrid products={products} />
        </div>
      </section>
    </div>
  );
}
