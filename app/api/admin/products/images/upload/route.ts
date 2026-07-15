import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin, adminAudit } from "@/lib/admin-utils";
import { checkCSRF } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const csrf = checkCSRF(request);
    if (csrf) return csrf;

    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;

    if (!file || !productId) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "file and productId are required", requestId: crypto.randomUUID() } }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`, requestId: crypto.randomUUID() } }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "File too large. Maximum 5MB", requestId: crypto.randomUUID() } }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Product not found", requestId: crypto.randomUUID() } }, { status: 404 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${productId}_${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads", "products");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const sortOrder = await prisma.productImage.count({ where: { productId } });
    const image = await prisma.productImage.create({
      data: { productId, url: `/uploads/products/${fileName}`, altText: product.name, sortOrder },
    });

    logger.info({ productId, imageId: image.id, adminId: auth.sub }, "Product image uploaded");
    await adminAudit({ adminId: auth.sub, action: "PRODUCT_IMAGE_UPLOADED", entity: "ProductImage", entityId: image.id, after: { productId, url: image.url } });

    return Response.json({ data: image }, { status: 201 });
  } catch (error) {
    logger.error({ error, context: "admin.products.images.upload" }, "Failed to upload image");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Image upload failed", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}
