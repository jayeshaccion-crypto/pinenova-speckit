import { prisma } from "@/lib/db";
import { ProductCard } from "./ProductCard";

interface RelatedProductsProps {
  currentProductId: string;
  categoryId: string;
}

export async function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) {
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      id: { not: currentProductId },
      published: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      materialTag: true,
      stock: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: { select: { slug: true } },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  if (products.length === 0) return null;

  return (
    <section className="border-t border-primary/10 pt-8 mt-8">
      <h2 className="text-xl font-bold text-foreground mb-6">Related Products</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={{ ...p, price: Number(p.price) }} />
        ))}
      </div>
    </section>
  );
}
