"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { ShippingForm, type ShippingAddress } from "@/components/ShippingForm";

const SESSION_KEY = "pinenova_cart_sid";
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: { id: string; name: string; slug: string; price: number; stock: number; images: Array<{ url: string; altText: string | null }> };
}

interface CartData {
  id: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

function validateAddress(addr: ShippingAddress): Partial<Record<keyof ShippingAddress, string>> {
  const errors: Partial<Record<keyof ShippingAddress, string>> = {};
  if (!addr.name.trim()) errors.name = "Name is required";
  if (!addr.line1.trim()) errors.line1 = "Address is required";
  if (!addr.city.trim()) errors.city = "City is required";
  if (!addr.state) errors.state = "State is required";
  if (!/^\d{5}(-\d{4})?$/.test(addr.zip)) errors.zip = "Invalid ZIP code";
  return errors;
}

function CheckoutForm({ clientSecret, onConfirm, submitting, error }: {
  clientSecret: string;
  onConfirm: () => Promise<void>;
  submitting: boolean;
  error: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div className="space-y-4">
      <PaymentElement />
      <button
        type="button"
        disabled={!stripe || !elements || submitting}
        onClick={onConfirm}
        className="btn-primary w-full text-center disabled:opacity-50"
      >
        {submitting ? "Processing Payment..." : "Pay Now"}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
  });
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { setLoading(false); return; }
    fetch("/api/cart", { headers: { "x-session-id": sid } })
      .then((r) => r.json())
      .then((data) => {
        setCart(data);
        if (data.itemCount === 0) router.replace("/cart");
      })
      .catch(() => setError("Failed to load cart"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handlePlaceOrder() {
    const sid = getSessionId();
    if (!sid) { setError("Session expired. Please reload."); return; }
    if (!cart || cart.itemCount === 0) { setError("Your cart is empty."); return; }

    const v = validateAddress(shippingAddress);
    setAddressErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": sid },
        body: JSON.stringify({
          shippingAddress,
          ...(discountCode.trim() ? { discountCode: discountCode.trim() } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data.error?.code;
        if (code === "INSUFFICIENT_STOCK") {
          setError("Some items are no longer in stock. Please review your cart.");
        } else if (code === "PAYMENT_PROVIDER_ERROR") {
          setError("Payment service is temporarily unavailable.");
        } else if (code === "MAINTENANCE") {
          setError("Checkout is under maintenance. Please try again later.");
        } else if (code === "VALIDATION_ERROR") {
          setError(data.error?.details?.map((d: any) => d.message).join(", ") || "Invalid input");
        } else {
          setError(data.error?.message || "Checkout failed. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      setClientSecret(data.clientSecret);
    } catch {
      setError("Network error. Please check your connection.");
      setSubmitting(false);
    }
  }

  async function handleConfirmPayment() {
    const stripe = stripePromise ? await stripePromise : null;
    if (!stripe || !clientSecret) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements: undefined as any,
      clientSecret,
      confirmParams: { return_url: `${window.location.origin}/checkout/confirmation` },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      router.push(`/checkout/confirmation?payment_intent=${paymentIntent.id}`);
    } else {
      setError("Payment did not complete. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-sm text-foreground/50">Loading checkout...</p>
      </div>
    );
  }

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-foreground/50">Add some items before checking out.</p>
        <Link href="/products" className="btn-primary mt-6 inline-block">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground">Checkout</h1>

      {error && (
        <div className="card mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 font-medium underline hover:no-underline">Dismiss</button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {!clientSecret ? (
            <>
              <section className="card p-6">
                <h2 className="text-base font-semibold text-foreground">Shipping Address</h2>
                <div className="mt-4">
                  <ShippingForm value={shippingAddress} onChange={setShippingAddress} errors={addressErrors} />
                </div>
              </section>

              <section className="card p-6">
                <h2 className="text-base font-semibold text-foreground">Discount Code</h2>
                <div className="mt-4">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="SAVE10"
                    className="input-field w-full"
                    maxLength={20}
                  />
                  <p className="mt-1 text-xs text-foreground/50">Optional. Applied to your order total.</p>
                </div>
              </section>
            </>
          ) : null}

          <section className="card p-6">
            <h2 className="text-base font-semibold text-foreground">Payment</h2>
            <div className="mt-4">
              {!clientSecret ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handlePlaceOrder}
                  className="btn-primary w-full text-center disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Place Order"}
                </button>
              ) : stripePromise && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#2F6B3B", borderRadius: "12px" } } }}>
                  <CheckoutForm clientSecret={clientSecret} onConfirm={handleConfirmPayment} submitting={submitting} error={error} />
                </Elements>
              ) : (
                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                  Payment system not configured.
                </div>
              )}
            </div>
          </section>
        </div>

        <div>
          <div className="card p-6">
            <h2 className="text-base font-semibold text-foreground">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-foreground">{item.product.name}</p>
                    <p className="text-foreground/50">Qty: {item.quantity}</p>
                  </div>
                  <p className="ml-4 font-medium text-foreground">${item.lineTotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <dl className="mt-4 space-y-3 border-t border-primary/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground/50">Subtotal ({cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""})</dt>
                <dd className="font-medium text-foreground">${cart.subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/50">Shipping</dt>
                <dd className="text-foreground/50">Calculated at checkout</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/50">Tax</dt>
                <dd className="text-foreground/50">Calculated at checkout</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
