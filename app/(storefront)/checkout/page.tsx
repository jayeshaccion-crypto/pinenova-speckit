"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
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

function CheckoutForm({ clientSecret, onConfirm, submitting }: {
  clientSecret: string;
  onConfirm: () => Promise<void>;
  submitting: boolean;
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

interface PricingBreakdown {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
}

function estimateShipping(subtotal: number): number {
  return subtotal >= 120 ? 0 : 8;
}

function estimateTax(subtotal: number): number {
  return subtotal * 0.1;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);

  const shippingCost = cart ? estimateShipping(cart.subtotal) : 0;
  const taxAmount = cart ? estimateTax(cart.subtotal) : 0;
  const estimatedTotal = cart ? (cart.subtotal + shippingCost + taxAmount) : 0;

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

  function handleContinueToReview() {
    const v = validateAddress(shippingAddress);
    setAddressErrors(v);
    if (Object.keys(v).length > 0) return;
    setStep(2);
  }

  async function handlePlaceOrder() {
    const sid = getSessionId();
    if (!sid) { setError("Session expired. Please reload."); return; }
    if (!cart || cart.itemCount === 0) { setError("Your cart is empty."); return; }

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
      if (data.pricing) {
        setPricing(data.pricing);
      }
      setStep(3);
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

  function formatDollars(amount: number): string {
    return amount.toFixed(2);
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
      {error && (
        <div className="card mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 font-medium underline hover:no-underline">Dismiss</button>
        </div>
      )}

      <div className="mb-8 flex items-center gap-2 text-sm text-foreground/50">
        <span className={step >= 1 ? "text-primary font-medium" : ""}>Shipping</span>
        <span>/</span>
        <span className={step >= 2 ? "text-primary font-medium" : ""}>Review</span>
        <span>/</span>
        <span className={step >= 3 ? "text-primary font-medium" : ""}>Payment</span>
      </div>

      <h1 className="text-2xl font-bold text-foreground">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Step 1: Shipping Address */}
          {step === 1 && (
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
                  <p className="mt-1 text-xs text-foreground/50">Optional. Applied at checkout.</p>
                </div>
              </section>

              <button
                type="button"
                onClick={handleContinueToReview}
                className="btn-primary w-full text-center"
              >
                Continue to Review
              </button>
              <p className="text-xs text-foreground/50 text-center">Review your items and estimated totals before payment.</p>
            </>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <>
              <section className="card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Shipping Address</h2>
                  <button onClick={() => { setStep(1); setError(null); setAddressErrors({}); }} className="text-sm text-primary hover:underline">
                    Edit
                  </button>
                </div>
                <div className="mt-3 text-sm text-foreground/80">
                  <p>{shippingAddress.name}</p>
                  <p>{shippingAddress.line1}</p>
                  {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                  <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                </div>
              </section>

              <section className="card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Items ({cart.itemCount})</h2>
                  <Link href="/cart" className="text-sm text-primary hover:underline">Edit Cart</Link>
                </div>
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
              </section>

              {discountCode && (
                <section className="card p-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Discount Code</span>
                    <span className="text-green-700">{discountCode}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/50">Will be applied at checkout.</p>
                </section>
              )}

              <section className="card p-6">
                <h2 className="text-base font-semibold text-foreground">Pricing Summary</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-foreground/50">Subtotal</dt>
                    <dd className="text-foreground">${cart.subtotal.toFixed(2)}</dd>
                  </div>
                  {discountCode && (
                    <div className="flex justify-between text-green-700">
                      <dt>Discount</dt>
                      <dd>Applied at checkout</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-foreground/50">Shipping</dt>
                    <dd className="text-foreground">{shippingCost > 0 ? `$${formatDollars(shippingCost)}` : "Free"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/50">Tax (estimated)</dt>
                    <dd className="text-foreground">${formatDollars(taxAmount)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-primary/10 pt-3 text-base font-semibold">
                    <dt className="text-foreground">Total</dt>
                    <dd className="text-foreground">${formatDollars(estimatedTotal)}</dd>
                  </div>
                </dl>
              </section>

              <button
                type="button"
                disabled={submitting}
                onClick={handlePlaceOrder}
                className="btn-primary w-full text-center disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Place Order"}
              </button>
            </>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <section className="card p-6">
              <h2 className="text-base font-semibold text-foreground">Payment</h2>
              <div className="mt-4">
                {stripePromise && clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#2F6B3B", borderRadius: "12px" } } }}>
                    <CheckoutForm clientSecret={clientSecret} onConfirm={handleConfirmPayment} submitting={submitting} />
                  </Elements>
                ) : (
                  <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                    Payment system not configured.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Order Summary */}
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
              {pricing ? (
                <>
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <dt>Discount</dt>
                      <dd>-${pricing.discountAmount.toFixed(2)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-foreground/50">Shipping</dt>
                    <dd className="text-foreground">{pricing.shippingCost > 0 ? `$${pricing.shippingCost.toFixed(2)}` : "Free"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/50">Tax</dt>
                    <dd className="text-foreground">${pricing.taxAmount.toFixed(2)}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <dt className="text-foreground/50">Shipping</dt>
                    <dd className="text-foreground">{shippingCost > 0 ? `$${formatDollars(shippingCost)}` : "Free"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/50">Tax (estimated)</dt>
                    <dd className="text-foreground">${formatDollars(taxAmount)}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-primary/10 pt-3 text-base font-semibold">
                <dt className="text-foreground">Total</dt>
                <dd className="text-foreground">
                  {pricing ? `$${pricing.total.toFixed(2)}` : `$${formatDollars(estimatedTotal)}`}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}