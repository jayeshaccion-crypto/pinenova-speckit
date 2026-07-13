import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isEnabled } from "@/lib/feature-flags";
import { checkout, InsufficientStockError } from "@/services/checkout.service";

const shippingAddressSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  line1: z.string().min(1, "Address line 1 is required").max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().length(2, "State must be a 2-letter code"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format"),
});

const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  discountCode: z.string().min(3).max(20).regex(/^[a-zA-Z0-9]+$/).optional(),
});

function getSessionId(request: Request): string | null {
  return request.headers.get("x-session-id");
}

export async function POST(request: Request) {
  try {
    if (!isEnabled("checkout")) {
      return NextResponse.json(
        { error: { code: "MAINTENANCE", message: "Checkout is currently under maintenance. Please try again later." } },
        { status: 503 },
      );
    }

    const sessionId = getSessionId(request);
    if (!sessionId) {
      return NextResponse.json(
        { error: { code: "SESSION_REQUIRED", message: "Session ID is required" }, requestId: crypto.randomUUID() },
        { status: 400 },
      );
    }

    const rl = await rateLimit(`checkout:${sessionId}`, { max: 10, windowMs: 60000 });
    if (!rl.allowed) return rateLimitResponse(rl.remaining);

    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const allowedOrigin = new URL(appUrl).origin;
    if (!origin && !referer) {
      return NextResponse.json({ error: { code: "CSRF_REJECTED", message: "Request origin or referer required" } }, { status: 403 });
    }
    if (origin && origin !== allowedOrigin) {
      return NextResponse.json({ error: { code: "CSRF_REJECTED", message: "Invalid request origin" } }, { status: 403 });
    }
    if (!origin && referer) {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== allowedOrigin) {
        return NextResponse.json({ error: { code: "CSRF_REJECTED", message: "Invalid request referer" } }, { status: 403 });
      }
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
          },
          requestId: crypto.randomUUID(),
        },
        { status: 400 },
      );
    }

    const { shippingAddress, discountCode } = parsed.data;

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: { take: 1 } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: { code: "CART_EMPTY", message: "Your cart is empty" }, requestId: crypto.randomUUID() },
        { status: 400 },
      );
    }

    logger.info({ event: "checkout.started", cartId: cart.id, sessionId: sessionId.slice(0, 8) });

    if (body.amount !== undefined || body.price !== undefined) {
      return NextResponse.json(
        { error: { code: "PRICE_REJECTED", message: "Pricing is calculated server-side" }, requestId: crypto.randomUUID() },
        { status: 400 },
      );
    }

    const result = await checkout(cart.id, shippingAddress, discountCode);

    logger.info({ event: "checkout.completed", orderId: result.orderId, orderNumber: result.orderNumber });

    return NextResponse.json(
      {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        pricing: result.pricing,
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          error: {
            code: "INSUFFICIENT_STOCK",
            message: "Not enough stock available",
            details: { productId: error.productId, available: error.available },
          },
          requestId: crypto.randomUUID(),
        },
        { status: 409 },
      );
    }

    if (error?.code === "P2024") {
      logger.error({ error: { message: error.message } }, "Database pool exhausted during checkout");
      return NextResponse.json(
        { error: { code: "SERVICE_UNAVAILABLE", message: "Checkout is temporarily unavailable. Please try again." }, requestId: crypto.randomUUID() },
        { status: 503 },
      );
    }

    if (error?.type === "StripeError" || error?.code?.startsWith("stripe_")) {
      logger.error({ error: { message: error.message, code: error.code } }, "Stripe error during checkout");
      return NextResponse.json(
        { error: { code: "PAYMENT_PROVIDER_ERROR", message: "Payment service unavailable. Please try again." }, requestId: crypto.randomUUID() },
        { status: 502 },
      );
    }

    logger.error({ error: { message: error.message, stack: error.stack } }, "Checkout failed");
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" }, requestId: crypto.randomUUID() },
      { status: 500 },
    );
  }
}
