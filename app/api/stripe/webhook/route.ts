import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { constructWebhookEvent } from "@/lib/stripe";
import { handlePaymentSuccess, handlePaymentFailed } from "@/services/checkout.service";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: { code: "MISSING_SIGNATURE", message: "No Stripe signature header" } }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (error: any) {
      logger.error({ error: { message: error.message } }, "Webhook signature verification failed");
      return NextResponse.json({ error: { code: "INVALID_SIGNATURE", message: "Invalid webhook signature" } }, { status: 400 });
    }

    logger.info({ eventId: event.id, type: event.type }, "Webhook received");

    const existing = await prisma.webhookEvent.findUnique({ where: { eventId: event.id } });
    if (existing) {
      logger.info({ eventId: event.id }, "Duplicate webhook event, returning 200");
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    await prisma.webhookEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        status: "processing",
      },
    });

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const cartId = paymentIntent.metadata?.cartId;

          await prisma.webhookEvent.update({
            where: { eventId: event.id },
            data: {
              data: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                metadata: paymentIntent.metadata,
              }),
            },
          });
          if (!cartId) {
            logger.warn({ eventId: event.id, paymentIntentId: paymentIntent.id }, "No cartId in metadata, skipping");
            await prisma.webhookEvent.update({
              where: { eventId: event.id },
              data: { status: "skipped", processedAt: new Date() },
            });
            break;
          }

          const result = await handlePaymentSuccess(paymentIntent.id);
          if (result) {
            logger.info({ eventId: event.id, orderId: result.orderId, orderNumber: result.orderNumber }, "Order created from webhook");
          }
          await prisma.webhookEvent.update({
            where: { eventId: event.id },
            data: { status: "processed", processedAt: new Date() },
          });
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logger.warn({ eventId: event.id, paymentIntentId: paymentIntent.id, failureReason: paymentIntent.last_payment_error?.message }, "Payment failed");
          await handlePaymentFailed(paymentIntent.id);
          await prisma.webhookEvent.update({
            where: { eventId: event.id },
            data: {
              status: "processed",
              processedAt: new Date(),
              data: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                metadata: paymentIntent.metadata,
              }),
            },
          });
          break;
        }

        default:
          logger.info({ eventId: event.id, type: event.type }, "Unhandled webhook event type");
          await prisma.webhookEvent.update({
            where: { eventId: event.id },
            data: { status: "skipped", processedAt: new Date() },
          });
      }
    } catch (processingError: any) {
      logger.error({ eventId: event.id, type: event.type, error: { message: processingError.message } }, "Webhook processing failed");
      await prisma.webhookEvent.update({
        where: { eventId: event.id },
        data: { status: "failed", error: processingError.message },
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    logger.error({ error: { message: error.message } }, "Webhook handler error");
    return NextResponse.json({ error: { code: "WEBHOOK_ERROR", message: "Webhook processing failed" } }, { status: 500 });
  }
}

