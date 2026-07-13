import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, adminAudit } from "@/lib/admin-utils";
import { UpdateBlogSchema } from "@/types";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const article = await prisma.blogArticle.findUnique({
      where: { slug: params.slug },
    });

    if (!article || article.status !== "PUBLISHED") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: article });
  } catch (error: any) {
    logger.error({ error: { message: error.message }, slug: params.slug }, "Failed to get blog article");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to get article" } }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = UpdateBlogSchema.parse(body);

    const updateData: any = { ...parsed };
    if (parsed.title) {
      updateData.slug = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    if (parsed.status === "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    const article = await prisma.blogArticle.update({
      where: { slug: params.slug },
      data: updateData,
    });

    logger.info({ adminId: auth.sub, articleId: article.id, slug: params.slug }, "Blog article updated");
    await adminAudit({ adminId: auth.sub, action: "UPDATE_BLOG", entity: "BlogArticle", entityId: article.id });

    return NextResponse.json({ data: article });
  } catch (error: any) {
    logger.error({ error: { message: error.message }, slug: params.slug }, "Failed to update blog article");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update article" } }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { slug: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const existing = await prisma.blogArticle.findUnique({ where: { slug: params.slug } });
    if (!existing) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found" } }, { status: 404 });
    }

    await prisma.blogArticle.delete({ where: { slug: params.slug } });

    logger.info({ adminId: auth.sub, slug: params.slug }, "Blog article deleted");
    await adminAudit({ adminId: auth.sub, action: "DELETE_BLOG", entity: "BlogArticle", entityId: params.slug });

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    logger.error({ error: { message: error.message }, slug: params.slug }, "Failed to delete blog article");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete article" } }, { status: 500 });
  }
}
