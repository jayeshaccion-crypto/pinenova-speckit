import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, adminAudit } from "@/lib/admin-utils";
import { CreateBlogSchema } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const where = { status: "PUBLISHED" as const };

    const [articles, total] = await Promise.all([
      prisma.blogArticle.findMany({
        where,
        select: { id: true, title: true, slug: true, metaDescription: true, featuredImage: true, publishedAt: true, createdAt: true },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogArticle.count({ where }),
    ]);

    return NextResponse.json({ data: articles, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    logger.error({ error: { message: error.message } }, "Failed to list blog articles");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to list articles" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = CreateBlogSchema.parse(body);

    let slug = parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await prisma.blogArticle.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const article = await prisma.blogArticle.create({
      data: {
        title: parsed.title,
        slug,
        body: parsed.body,
        metaDescription: parsed.metaDescription,
        featuredImage: parsed.featuredImage,
        status: parsed.status,
        publishedAt: parsed.status === "PUBLISHED" ? new Date() : null,
      },
    });

    logger.info({ adminId: auth.sub, articleId: article.id, slug }, "Blog article created");
    await adminAudit({ adminId: auth.sub, action: "CREATE_BLOG", entity: "BlogArticle", entityId: article.id });

    return NextResponse.json({ data: article }, { status: 201 });
  } catch (error: any) {
    logger.error({ error: { message: error.message } }, "Failed to create blog article");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create article" } }, { status: 500 });
  }
}
