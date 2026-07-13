import { prisma } from "@/lib/db";
import { createPaymentIntent, retrievePaymentIntent } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { sendEmail, emailTemplates } from "@/lib/email";
import { releaseStock, InsufficientStockError, retryOnSerialization } from "./inventory.service";
export { InsufficientStockError };

const TAX_RATES: Record<string, number> = {
  DEFAULT: 1000, // 10% flat tax per assumptions.md
};

const SHIPPING_FLAT = 800;
const FREE_SHIPPING_THRESHOLD = 12000;

export interface PricingInput {
  items: Array<{ quantity: number; unitPrice: number }>;
  stateCode: string;
  discountCode?: string;
}

export interface PricingResult {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
}

export function lookupTaxRate(_stateCode: string): number {
  return TAX_RATES.DEFAULT;
}

export interface DiscountValidationResult {
  valid: boolean;
  discount?: { type: "PERCENTAGE" | "FIXED_AMOUNT"; value: number; amount: number };
  reason?: string;
}

export async function validateDiscountCode(code: string, subtotal: number): Promise<DiscountValidationResult> {
  const discount = await prisma.discountCode.findUnique({ where: { code } });

  if (!discount || !discount.isActive) {
    return { valid: false, reason: "Discount code is invalid or expired" };
  }

  if (discount.expiresAt && new Date() > discount.expiresAt) {
    return { valid: false, reason: "Discount code has expired" };
  }

  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return { valid: false, reason: "Discount code has reached its usage limit" };
  }

  if (discount.minOrderAmount !== null && subtotal < Number(discount.minOrderAmount) * 100) {
    return { valid: false, reason: `Minimum order amount of $${Number(discount.minOrderAmount).toFixed(2)} not met` };
  }

  const value = Number(discount.value);
  let amount: number;

  if (discount.type === "PERCENTAGE") {
    amount = Math.floor((subtotal * value) / 100);
  } else {
    amount = Math.min(Math.round(value * 100), subtotal);
  }

  return {
    valid: true,
    discount: { type: discount.type, value, amount },
  };
}

export function calculatePricing(input: PricingInput): PricingResult {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  const rateBps = lookupTaxRate(input.stateCode);
  const taxAmount = Math.round((subtotal * rateBps) / 10000);

  const total = Math.max(0, Math.floor(subtotal + shippingCost + taxAmount));

  return { subtotal, discountAmount: 0, shippingCost, taxAmount, total };
}

export async function calculatePricingWithDiscount(
  items: Array<{ quantity: number; unitPrice: number }>,
  stateCode: string,
  discountCode?: string,
): Promise<PricingResult> {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  let discountAmount = 0;
  if (discountCode) {
    const result = await validateDiscountCode(discountCode, subtotal);
    if (result.valid && result.discount) {
      discountAmount = result.discount.amount;
    }
  }

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const taxableAmount = subtotal - discountAmount;
  const rateBps = lookupTaxRate(stateCode);
  const taxAmount = Math.round((taxableAmount * rateBps) / 10000);

  const total = Math.max(0, Math.floor(subtotal - discountAmount + shippingCost + taxAmount));

  return { subtotal, discountAmount, shippingCost, taxAmount, total };
}

function generateOrderNumber(): string {
  const now = new Date();
  const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `ORD-${yymmdd}-${suffix}`;
}

export async function createPayment(amount: number, idempotencyKey: string, discountCode?: string, cartId?: string) {
  return createPaymentIntent({
    amount,
    idempotencyKey,
    metadata: { source: "pinenova-checkout", ...(discountCode && { discountCode }), ...(cartId && { cartId }) },
  });
}

export async function handlePaymentSuccess(paymentIntentId: string): Promise<{ orderId: string; orderNumber: string } | null> {
  const existing = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (existing) {
    logger.info({ orderId: existing.id, paymentIntentId }, "Duplicate webhook, returning existing order");
    return { orderId: existing.id, orderNumber: existing.orderNumber };
  }

  const pi = await retrievePaymentIntent(paymentIntentId);
  if (pi.status !== "succeeded") {
    logger.warn({ paymentIntentId, status: pi.status }, "Payment intent not succeeded, skipping");
    return null;
  }

  const cartId = pi.metadata?.cartId;
  if (!cartId) {
    logger.warn({ paymentIntentId }, "No cartId in payment intent metadata");
    return null;
  }

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, price: true, stock: true, sku: true } } },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    logger.warn({ cartId, paymentIntentId }, "Cart not found or empty");
    return null;
  }

  const addressRaw = pi.metadata?.shippingAddress;
  const shippingAddress = addressRaw ? JSON.parse(addressRaw) : {};

  const items = cart.items.map((item) => ({
    quantity: item.quantity,
    unitPrice: Number(item.product.price) * 100,
  }));
  const stateCode = (shippingAddress as any)?.state || "CA";
  const pricing = await calculatePricingWithDiscount(items, stateCode, undefined);

  const orderNumber = generateOrderNumber();
  const discountCodeFromMeta = pi.metadata?.discountCode;
  const discountId = discountCodeFromMeta
    ? (await prisma.discountCode.findUnique({ where: { code: discountCodeFromMeta }, select: { id: true } }))?.id
    : undefined;

  const order = await prisma.$transaction(async (tx) => {
    if (discountId) {
      await tx.discountCode.update({
        where: { id: discountId },
        data: { usedCount: { increment: 1 } },
      });
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        email: pi.metadata?.email,
        status: "CONFIRMED",
        subtotal: pricing.subtotal / 100,
        discountAmount: pricing.discountAmount / 100,
        tax: pricing.taxAmount / 100,
        shippingCost: pricing.shippingCost / 100,
        total: pricing.total / 100,
        shippingAddress: shippingAddress as any,
        stripePaymentIntentId: paymentIntentId,
        discountCodeId: discountId ?? null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.product.id,
            productSnapshot: { name: item.product.name, sku: item.product.sku, price: Number(item.product.price) },
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
        statusLogs: {
          create: {
            toStatus: "CONFIRMED",
            reason: "Payment succeeded",
          },
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.delete({ where: { id: cart.id } });

    return created;
  });

  try {
    const emailItems = order.items.map((i) => {
      const snap = i.productSnapshot as any;
      return { name: snap.name, qty: i.quantity, price: Number(i.unitPrice).toFixed(2) };
    });
    const emailTo = pi.metadata?.email || "";
    if (emailTo) {
      const template = emailTemplates.orderConfirmation(orderNumber, emailItems, Number(order.total).toFixed(2));
      await sendEmail({ to: emailTo, subject: template.subject, html: template.html });
    }
  } catch (emailError) {
    logger.error({ orderId: order.id, error: emailError }, "Order confirmation email failed");
  }

  logger.info({ event: "checkout.completed", orderId: order.id, orderNumber });
  return { orderId: order.id, orderNumber };
}

export async function handlePaymentFailed(paymentIntentId: string): Promise<void> {
  const pi = await retrievePaymentIntent(paymentIntentId);
  const cartId = pi.metadata?.cartId;

  if (cartId) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (cart) {
      for (const item of cart.items) {
        await releaseStock(item.productId, item.quantity);
      }
    }
  }

  logger.warn({ paymentIntentId, failureReason: pi.last_payment_error?.message }, "Payment failed, stock released");
}

export async function checkout(
  cartId: string,
  shippingAddress: { name: string; line1: string; city: string; state: string; zip: string; line2?: string },
  discountCode?: string,
) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, price: true, stock: true, published: true } } },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart not found or empty");
  }

  for (const item of cart.items) {
    if (!item.product.published) {
      throw new InsufficientStockError(item.product.id, 0, item.quantity);
    }
    if (Number(item.product.price) === 0) {
      throw new InsufficientStockError(item.product.id, 0, item.quantity);
    }
  }

  const items = cart.items.map((item) => ({
    quantity: item.quantity,
    unitPrice: Number(item.product.price) * 100,
  }));

  const pricing = await calculatePricingWithDiscount(items, shippingAddress.state, discountCode);

  const idempotencyKey = `checkout_${cartId}_${Date.now()}`;
  const orderNumber = generateOrderNumber();

  const discountId = discountCode
    ? (await prisma.discountCode.findUnique({ where: { code: discountCode }, select: { id: true } }))?.id
    : undefined;

  const result = await retryOnSerialization(async () => {
    const payment = await createPayment(pricing.total, idempotencyKey, discountCode, cartId);

    return prisma.$transaction(async (tx): Promise<any> => {
    for (const item of cart.items) {
      const rows = await tx.$queryRawUnsafe<Array<{ stock: number }>>(
        `SELECT stock FROM "Product" WHERE id = $1 FOR UPDATE`,
        item.product.id,
      );
      const currentStock = rows[0]?.stock ?? 0;
      if (currentStock < item.quantity) {
        throw new InsufficientStockError(item.product.id, currentStock, item.quantity);
      }
      const newStock = currentStock - item.quantity;
      await tx.$executeRawUnsafe(`UPDATE "Product" SET stock = $1 WHERE id = $2`, newStock, item.product.id);
      await tx.inventoryLog.create({
        data: {
          productId: item.product.id,
          oldStock: currentStock,
          newStock,
          change: -item.quantity,
          reason: "reserve",
        },
      });
    }

    if (discountId) {
      await tx.discountCode.update({
        where: { id: discountId },
        data: { usedCount: { increment: 1 } },
      });
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        status: "CONFIRMED",
        subtotal: pricing.subtotal / 100,
        discountAmount: pricing.discountAmount / 100,
        tax: pricing.taxAmount / 100,
        shippingCost: pricing.shippingCost / 100,
        total: pricing.total / 100,
        shippingAddress: shippingAddress as any,
        stripePaymentIntentId: payment.id,
        discountCodeId: discountId ?? null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.product.id,
            productSnapshot: { name: item.product.name, price: Number(item.product.price) },
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
        statusLogs: {
          create: {
            toStatus: "CONFIRMED",
            reason: "Payment processing",
          },
        },
      },
    });
    return { payment, order: created };
    });
  });

  return {
    clientSecret: result.payment.client_secret!,
    paymentIntentId: result.payment.id,
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    pricing: {
      subtotal: pricing.subtotal / 100,
      discountAmount: pricing.discountAmount / 100,
      shippingCost: pricing.shippingCost / 100,
      taxAmount: pricing.taxAmount / 100,
      total: pricing.total / 100,
    },
  };
}
