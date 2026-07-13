import Link from "next/link";
import { notFound } from "next/navigation";

interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  metaDescription: string | null;
  featuredImage: string | null;
  publishedAt: string;
  createdAt: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/blog/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/blog" className="mb-6 inline-block text-sm text-primary hover:underline">&larr; Back to Blog</Link>
      <article>
        <header className="mb-8">
          <h1 className="mb-3 text-3xl font-bold text-foreground">{article.title}</h1>
          <time className="text-sm text-muted-foreground">
            {new Date(article.publishedAt || article.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </time>
          {article.metaDescription && (
            <p className="mt-3 text-lg text-muted-foreground">{article.metaDescription}</p>
          )}
        </header>
        <div className="prose prose-gray max-w-none">
          {article.body.split("\n").map((p, i) => p ? <p key={i} className="mb-4 leading-relaxed">{p}</p> : null)}
        </div>
      </article>
    </div>
  );
}
