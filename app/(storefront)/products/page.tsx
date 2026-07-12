import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductsFilterBar } from "@/components/ProductsFilterBar";
import { Suspense } from "react";

interface ProductsPageProps {
  searchParams: { category?: string; material?: string; sort?: string; page?: string };
}

export const revalidate = 60;

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const title = searchParams.category
    ? `${searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1)}`
    : "All Products";
  return {
    title,
    description: `Browse our ${title.toLowerCase()} — sustainable vegan leather accessories from PineNova.`,
    alternates: { canonical: "/products" },
  };
}

async function getProducts(params: Record<string, string | undefined>) {
  const where: any = { published: true };
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const limit = 20;

  if (params.category) where.category = { slug: params.category };
  if (params.material) where.materialTag = params.material;

  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "price_asc") orderBy = { price: "asc" };
  else if (params.sort === "price_desc") orderBy = { price: "desc" };
  else if (params.sort === "newest") orderBy = { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { slug: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products.map((p) => ({ ...p, price: Number(p.price) })), total, page, limit };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, material, sort = "newest", page } = searchParams;
  const data = await getProducts({ category, material, sort, page });

  const title = searchParams.category
    ? `${searchParams.category.charAt(0).toUpperCase() + searchParams.category.slice(1)}`
    : "All Products";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between border-b border-primary/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-foreground/50">{data.total} product{data.total !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <Suspense fallback={<div className="text-sm text-neutral-500">Loading filters...</div>}>
            <ProductsFilterBar />
          </Suspense>
        </aside>
        <div className="lg:col-span-3">
          <ProductGrid products={data.products} />
        </div>
      </div>
    </div>
  );
}
