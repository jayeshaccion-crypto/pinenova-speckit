import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductGrid";
import Link from "next/link";

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { material?: string; sort?: string };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });
  if (!category) return { title: "Category Not Found" };
  return { title: category.name, description: category.description ?? `Browse our ${category.name.toLowerCase()} collection.` };
}

async function getCategoryProducts(slug: string, material?: string, sort?: string) {
  const where: any = { published: true, category: { slug } };

  if (material) where.materialTag = material;

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products.map((p) => ({ ...p, price: Number(p.price) })), total };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const data = await getCategoryProducts(params.slug, searchParams.material, searchParams.sort);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{category.name}</h1>
          {category.description && <p className="mt-1 text-sm text-neutral-500">{category.description}</p>}
          <p className="mt-1 text-sm text-neutral-500">{data.total} product{data.total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/products" className="text-sm text-neutral-600 hover:text-neutral-900">All Products</Link>
      </div>
      <ProductGrid products={data.products} />
    </div>
  );
}
