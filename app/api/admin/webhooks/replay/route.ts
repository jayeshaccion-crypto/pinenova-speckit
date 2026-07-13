import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, adminAudit } from "@/lib/admin-utils";
import { handlePaymentSuccess, handlePaymentFailed } from "@/services/checkout.service";
import { logger } from "@/lib/logger";
import { AdminWebhookReplaySchema } from "@/types";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { webhookEventId } = AdminWebhookReplaySchema.parse(await request.json());

    const event = await prisma.webhookEvent.findUnique({ where: { id: webhookEventId } });
    if (!event) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Webhook event not found" } }, { status: 404 });
    }

    if (event.status !== "failed") {
      return NextResponse.json({ error: { code: "INVALID_STATUS", message: "Can only replay failed events" } }, { status: 400 });
    }

    if (!event.data) {
      return NextResponse.json({ error: { code: "NO_DATA", message: "Webhook event has no stored data for replay" } }, { status: 400 });
    }

    const eventData = JSON.parse(event.data);
    const paymentIntentId = eventData.paymentIntentId;

    if (!paymentIntentId) {
      return NextResponse.json({ error: { code: "NO_PAYMENT_INTENT", message: "No payment intent ID in event data" } }, { status: 400 });
    }

    let result: any = null;

    switch (event.type) {
      case "payment_intent.succeeded": {
        result = await handlePaymentSuccess(paymentIntentId);
        break;
      }
      case "payment_intent.payment_failed": {
        await handlePaymentFailed(paymentIntentId);
        result = { reprocessed: true };
        break;
      }
      default:
        return NextResponse.json({ error: { code: "UNHANDLED_TYPE", message: `Cannot replay event type: ${event.type}` } }, { status: 400 });
    }

    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { status: "replayed", processedAt: new Date(), error: null },
    });

    logger.info({ adminId: auth.sub, webhookEventId, type: event.type, paymentIntentId, result }, "Webhook event replayed by admin");
    await adminAudit({
      adminId: auth.sub,
      action: "REPLAY_WEBHOOK",
      entity: "webhook_event",
      entityId: webhookEventId,
      after: { type: event.type, paymentIntentId, result },
    });

    return NextResponse.json({ replayed: true, type: event.type, paymentIntentId, result });
  } catch (error: any) {
    logger.error({ adminId: auth.sub, error: { message: error.message } }, "Webhook replay failed");
    return NextResponse.json({ error: { code: "REPLAY_ERROR", message: "Webhook replay failed" } }, { status: 500 });
  }
}
