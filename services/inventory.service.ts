import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export class InsufficientStockError extends Error {
  constructor(public productId: string, public available: number, public requested: number) {
    super(`Insufficient stock for product ${productId}: requested ${requested}, available ${available}`);
    this.name = "InsufficientStockError";
  }
}

export async function retryOnSerialization<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.code === "P2034" || error?.message?.includes("could not serialize access")) {
        if (attempt < maxRetries) {
          const delay = [100, 200, 400][attempt - 1] || 400;
          logger.warn({ attempt, maxRetries, delay }, "Serialization failure, retrying");
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function reserveStock(productId: string, quantity: number): Promise<void> {
  await retryOnSerialization(async () => {
    await prisma.$transaction(async (tx) => {
      const product = await tx.$queryRawUnsafe<Array<{ stock: number }>>(
        `SELECT stock FROM "Product" WHERE id = $1 FOR UPDATE`,
        productId,
      );

      const currentStock = product[0]?.stock ?? 0;

      if (currentStock < quantity) {
        throw new InsufficientStockError(productId, currentStock, quantity);
      }

      const newStock = currentStock - quantity;
      await tx.$executeRawUnsafe(`UPDATE "Product" SET stock = $1 WHERE id = $2`, newStock, productId);

      await tx.inventoryLog.create({
        data: {
          productId,
          oldStock: currentStock,
          newStock,
          change: -quantity,
          reason: "reserve",
        },
      });
    });
  });
}

export async function releaseStock(productId: string, quantity: number): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
  if (!product) return;

  const newStock = product.stock + quantity;
  await prisma.product.update({
    where: { id: productId },
    data: { stock: newStock },
  });

  await prisma.inventoryLog.create({
    data: {
      productId,
      oldStock: product.stock,
      newStock,
      change: quantity,
      reason: "release",
    },
  });
}
