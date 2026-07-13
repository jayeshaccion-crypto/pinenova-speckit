import Link from "next/link";

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  metaDescription: string | null;
  featuredImage: string | null;
  publishedAt: string;
  createdAt: string;
}

async function getArticles(): Promise<{ data: BlogArticle[] }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/blog`, {
      cache: "no-store",
    });
    if (!res.ok) return { data: [] };
    return res.json();
  } catch {
    return { data: [] };
  }
}

export default async function BlogPage() {
  const { data: articles } = await getArticles();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-foreground">Blog</h1>
      <p className="mb-8 text-muted-foreground">Stories about sustainable fashion, pineapple fiber, and our journey.</p>

      {articles.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted-foreground">No articles yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <Link key={article.id} href={`/blog/${article.slug}`} className="card block p-6 transition-shadow hover:shadow-md">
              <article>
                <h2 className="mb-2 text-xl font-semibold text-foreground">{article.title}</h2>
                {article.metaDescription && <p className="mb-3 text-muted-foreground">{article.metaDescription}</p>}
                <time className="text-sm text-muted-foreground">
                  {new Date(article.publishedAt || article.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </time>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
