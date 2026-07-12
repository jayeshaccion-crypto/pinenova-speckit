import { describe, it, expect, vi } from "vitest";
import { reserveStock, releaseStock, InsufficientStockError } from "@/services/inventory.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    inventoryLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("reserveStock", () => {
  it("rejects with InsufficientStockError when stock is insufficient", async () => {
    const mockTx: any = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ stock: 2 }]),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      inventoryLog: { create: vi.fn().mockResolvedValue(undefined) },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(mockTx));

    await expect(reserveStock("prod-1", 5)).rejects.toThrow(InsufficientStockError);
  });

  it("succeeds when stock is sufficient", async () => {
    const mockTx: any = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ stock: 10 }]),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      inventoryLog: { create: vi.fn().mockResolvedValue(undefined) },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(mockTx));

    await expect(reserveStock("prod-1", 5)).resolves.not.toThrow();
    expect(mockTx.$executeRawUnsafe).toHaveBeenCalled();
    expect(mockTx.inventoryLog.create).toHaveBeenCalled();
  });

  it("retries on serialization failure", async () => {
    let attempts = 0;
    const mockTx: any = {
      $queryRawUnsafe: vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          const error: any = new Error("could not serialize access");
          error.code = "P2034";
          throw error;
        }
        return Promise.resolve([{ stock: 10 }]);
      }),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      inventoryLog: { create: vi.fn().mockResolvedValue(undefined) },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(mockTx));

    await expect(reserveStock("prod-1", 5)).resolves.not.toThrow();
    expect(attempts).toBe(3);
  });
});

describe("releaseStock", () => {
  it("restores stock and creates audit log", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({ stock: 5 } as any);
    vi.mocked(prisma.product.update).mockResolvedValue({} as any);
    vi.mocked(prisma.inventoryLog.create).mockResolvedValue({} as any);

    await releaseStock("prod-1", 3);

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-1" },
        data: { stock: 8 },
      }),
    );
    expect(prisma.inventoryLog.create).toHaveBeenCalled();
  });
});
