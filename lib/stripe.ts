import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export async function createCheckoutSession(params: {
  lineItems: Array<{ price: number; quantity: number; name: string }>;
  customerEmail: string;
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.customerEmail,
    line_items: params.lineItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    metadata: { orderId: params.orderId },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}

export async function createRefund(paymentIntentId: string, amount?: number) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  });
}

export function constructWebhookEvent(payload: Buffer | string, sig: string) {
  return stripe.webhooks.constructEvent(payload, sig, webhookSecret!);
}

export async function createPaymentIntent(params: {
  amount: number;
  currency?: string;
  customerId?: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}) {
  return stripe.paymentIntents.create(
    {
      amount: params.amount,
      currency: params.currency || "usd",
      customer: params.customerId,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey: params.idempotencyKey },
  );
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}
