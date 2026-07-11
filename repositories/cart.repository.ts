import { prisma } from "@/lib/db";

export const cartRepository = {
  async findByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { include: { images: { take: 1 } } } },
        },
      },
    });
  },

  async ensureCart(userId: string) {
    const existing = await prisma.cart.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId } });
  },

  async addItem(userId: string, productId: string, quantity: number) {
    const cart = await this.ensureCart(userId);
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: { product: { include: { images: { take: 1 } } } },
      });
    }

    return prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
      include: { product: { include: { images: { take: 1 } } } },
    });
  },

  async updateItemQuantity(itemId: string, userId: string, quantity: number) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== userId) return null;

    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  },

  async removeItem(itemId: string, userId: string) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== userId) return null;

    return prisma.cartItem.delete({ where: { id: itemId } });
  },

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  },

  async getCartTotal(userId: string) {
    const cart = await this.findByUserId(userId);
    if (!cart?.items.length) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const tax = Math.round(subtotal * 0.1 * 100) / 100;
    const shipping = subtotal >= 120 ? 0 : 8;
    const total = Math.round((subtotal + tax + shipping) * 100) / 100;

    return { subtotal, tax, shipping, total };
  },
};
