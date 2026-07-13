import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getAuthUser } from "@/lib/api-utils";
import { AddCartItemSchema, UpdateCartItemSchema, RemoveCartItemSchema } from "@/types";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function rateLimitKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

const SESSION_COOKIE = "cart_session_id";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getSessionId(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value ?? request.headers.get("x-session-id") ?? null;
}

function setSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

async function getOrCreateCartId(userId: string | null, sessionId: string | null): Promise<{ cartId: string; isNew: boolean; sessionId: string }> {
  let resolvedSessionId = sessionId;

  if (userId) {
    const existing = await prisma.cart.findUnique({ where: { userId } });
    if (existing) return { cartId: existing.id, isNew: false, sessionId: resolvedSessionId ?? "" };
    const cart = await prisma.cart.create({ data: { userId } });
    return { cartId: cart.id, isNew: true, sessionId: resolvedSessionId ?? "" };
  }

  if (!resolvedSessionId) {
    resolvedSessionId = crypto.randomUUID();
  }

  const existing = resolvedSessionId ? await prisma.cart.findUnique({ where: { sessionId: resolvedSessionId } }) : null;
  if (existing) return { cartId: existing.id, isNew: false, sessionId: resolvedSessionId! };

  const cart = await prisma.cart.create({ data: { sessionId: resolvedSessionId } });
  return { cartId: cart.id, isNew: true, sessionId: resolvedSessionId! };
}

function formatCartResponse(cart: any) {
  const items = (cart.items ?? []).map((item: any) => {
    const product = item.product ?? {};
    const unitPrice = Number(product.price) || 0;
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      product: {
        id: product.id,
        name: product.name ?? "Unknown",
        slug: product.slug ?? "",
        price: unitPrice,
        stock: product.stock ?? 0,
        images: (product.images ?? []).slice(0, 1).map((img: any) => ({
          url: img.url,
          altText: img.altText,
        })),
      },
    };
  });

  const subtotal = items.reduce((sum: number, i: any) => sum + i.lineTotal, 0);

  return { id: cart.id, items, itemCount: items.reduce((s: number, i: any) => s + i.quantity, 0), subtotal };
}

async function loadCart(cartId: string) {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
        },
      },
    },
  });
}

async function verifyProductExists(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId, published: true },
    select: { id: true, stock: true, price: true },
  });
  return product;
}

export async function GET(request: NextRequest) {
  try {
    const rl = await rateLimit(rateLimitKey(request));
    if (!rl.allowed) return rateLimitResponse(rl.remaining);

    const authUser = await getAuthUser(request);
    const sessionId = getSessionId(request);
    const userId = authUser?.sub ?? null;

    let cart: any = null;

    if (userId) {
      cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          },
        },
      });
    } else if (sessionId) {
      cart = await prisma.cart.findUnique({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: {
                include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          },
        },
      });
    }

    if (!cart) {
      return NextResponse.json({ id: null, items: [], itemCount: 0, subtotal: 0 });
    }

    logger.info({ event: "cart.get.success", cartId: cart.id, itemCount: cart.items.length });
    return NextResponse.json(formatCartResponse(cart));
  } catch (error) {
    logger.error({ error, context: "cart.get" }, "Failed to get cart");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(rateLimitKey(request));
    if (!rl.allowed) return rateLimitResponse(rl.remaining);

    const body = await request.json();
    const parsed = AddCartItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Invalid cart item", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } },
        { status: 400 },
      );
    }

    const { productId, quantity } = parsed.data;
    const product = await verifyProductExists(productId);

    if (!product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found", requestId: crypto.randomUUID() } },
        { status: 404 },
      );
    }

    const authUser = await getAuthUser(request);
    const existingSessionId = getSessionId(request);
    const userId = authUser?.sub ?? null;

    const { cartId, isNew, sessionId: resolvedSessionId } = await getOrCreateCartId(userId, existingSessionId);

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId, productId },
    });

    const currentQty = existingItem ? existingItem.quantity : 0;
    const newQty = currentQty + quantity;

    if (product.stock < newQty) {
      return NextResponse.json(
        { error: { code: "OUT_OF_STOCK", message: `Insufficient stock. Available: ${product.stock}`, requestId: crypto.randomUUID() } },
        { status: 409 },
      );
    }

    if (existingItem) {
      await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity: newQty } });
    } else {
      await prisma.cartItem.create({ data: { cartId, productId, quantity } });
    }

    const cart = await loadCart(cartId);
    const response = NextResponse.json(formatCartResponse(cart), { status: isNew ? 201 : 200 });

    if (!userId) {
      setSessionCookie(response, resolvedSessionId);
    }

    logger.info({ event: "cart.add.success", cartId, productId, quantity, newQty });
    return response;
  } catch (error) {
    logger.error({ error, context: "cart.add" }, "Failed to add cart item");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = await rateLimit(rateLimitKey(request));
    if (!rl.allowed) return rateLimitResponse(rl.remaining);

    const body = await request.json();
    const parsed = UpdateCartItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Invalid cart update", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } },
        { status: 400 },
      );
    }

    const { productId, quantity } = parsed.data;

    const authUser = await getAuthUser(request);
    const sessionId = getSessionId(request);
    const userId = authUser?.sub ?? null;
    const cart = userId
      ? await prisma.cart.findUnique({ where: { userId } })
      : sessionId
        ? await prisma.cart.findUnique({ where: { sessionId } })
        : null;

    if (!cart) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Cart not found", requestId: crypto.randomUUID() } },
        { status: 404 },
      );
    }

    const item = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (!item) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Item not found in cart", requestId: crypto.randomUUID() } },
        { status: 404 },
      );
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
      logger.info({ event: "cart.remove.success", cartId: cart.id, productId });
    } else {
      const product = await verifyProductExists(productId);
      if (!product) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Product not found", requestId: crypto.randomUUID() } },
          { status: 404 },
        );
      }
      if (product.stock < quantity) {
        return NextResponse.json(
          { error: { code: "OUT_OF_STOCK", message: `Insufficient stock. Available: ${product.stock}`, requestId: crypto.randomUUID() } },
          { status: 409 },
        );
      }
      await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
      logger.info({ event: "cart.update.success", cartId: cart.id, productId, quantity });
    }

    const updatedCart = await loadCart(cart.id);
    const patchResponse = NextResponse.json(formatCartResponse(updatedCart));
    if (!userId && sessionId) {
      setSessionCookie(patchResponse, sessionId);
    }
    return patchResponse;
  } catch (error) {
    logger.error({ error, context: "cart.update" }, "Failed to update cart item");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rl = await rateLimit(rateLimitKey(request));
    if (!rl.allowed) return rateLimitResponse(rl.remaining);

    const body = await request.json();
    const parsed = RemoveCartItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Invalid cart item removal", details: parsed.error.flatten().fieldErrors, requestId: crypto.randomUUID() } },
        { status: 400 },
      );
    }

    const { productId } = parsed.data;

    const authUser = await getAuthUser(request);
    const sessionId = getSessionId(request);
    const userId = authUser?.sub ?? null;
    const cart = userId
      ? await prisma.cart.findUnique({ where: { userId } })
      : sessionId
        ? await prisma.cart.findUnique({ where: { sessionId } })
        : null;

    if (!cart) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Cart not found", requestId: crypto.randomUUID() } },
        { status: 404 },
      );
    }

    const item = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (!item) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Item not found in cart", requestId: crypto.randomUUID() } },
        { status: 404 },
      );
    }

    await prisma.cartItem.delete({ where: { id: item.id } });
    logger.info({ event: "cart.delete.success", cartId: cart.id, productId });

    const updatedCart = await loadCart(cart.id);
    const deleteResponse = NextResponse.json(formatCartResponse(updatedCart));
    if (!userId && sessionId) {
      setSessionCookie(deleteResponse, sessionId);
    }
    return deleteResponse;
  } catch (error) {
    logger.error({ error, context: "cart.delete" }, "Failed to delete cart item");
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: crypto.randomUUID() } }, { status: 500 });
  }
}
