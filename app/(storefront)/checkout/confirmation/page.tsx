import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: { index: false, follow: false },
};

interface ConfirmationPageProps {
  searchParams: { payment_intent?: string; orderId?: string; orderNumber?: string };
}

async function getOrder(paymentIntentId?: string): Promise<{
  orderNumber: string; total: number; subtotal: number; tax: number; shippingCost: number; discountAmount: number;
  status: string; email: string | null; createdAt: Date;
  items: Array<{ quantity: number; unitPrice: number; productSnapshot: any }>;
} | null> {
  if (!paymentIntentId) return null;
  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { items: true },
  });
  if (!order) return null;
  return {
    orderNumber: order.orderNumber, total: Number(order.total), subtotal: Number(order.subtotal),
    tax: Number(order.tax), shippingCost: Number(order.shippingCost), discountAmount: Number(order.discountAmount),
    status: order.status, email: order.email, createdAt: order.createdAt,
    items: order.items.map((i) => ({ quantity: i.quantity, unitPrice: Number(i.unitPrice), productSnapshot: i.productSnapshot })),
  };
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const order = await getOrder(searchParams.payment_intent);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Thank you for your order!</h1>
        <p className="mt-2 text-sm text-foreground/50">
          Order #{order.orderNumber} has been confirmed.
        </p>
      </div>

      <div className="card mt-8 p-6">
        <h2 className="text-base font-semibold text-foreground">Order Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/50">Status</dt>
            <dd className="font-medium text-green-700">{order.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/50">Order Number</dt>
            <dd className="font-medium text-foreground">{order.orderNumber}</dd>
          </div>
          {order.email && (
            <div className="flex justify-between">
              <dt className="text-foreground/50">Confirmation sent to</dt>
              <dd className="text-foreground">{order.email}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-foreground/50">Date</dt>
            <dd className="text-foreground">{order.createdAt.toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      <div className="card mt-4 p-6">
        <h2 className="text-base font-semibold text-foreground">Items Ordered</h2>
        <div className="mt-4 space-y-3 text-sm">
          {order.items.map((item, i) => {
            const snap = item.productSnapshot as any;
            return (
              <div key={i} className="flex items-center justify-between border-b border-primary/5 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-foreground">{snap.name}</p>
                  <p className="text-foreground/50">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                </div>
                <p className="font-medium text-foreground">${(item.quantity * item.unitPrice).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        <dl className="mt-4 space-y-2 border-t border-primary/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/50">Subtotal</dt>
            <dd className="text-foreground">${order.subtotal.toFixed(2)}</dd>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Discount</dt>
              <dd>-${order.discountAmount.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-foreground/50">Shipping</dt>
            <dd className="text-foreground">{order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : "Free"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/50">Tax</dt>
            <dd className="text-foreground">${order.tax.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between border-t border-primary/10 pt-3 text-base font-semibold">
            <dt className="text-foreground">Total</dt>
            <dd className="text-foreground">${order.total.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 text-center">
        <Link href="/products" className="btn-primary inline-block">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
