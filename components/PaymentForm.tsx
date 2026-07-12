"use client";

import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface PaymentFormWrapperProps {
  clientSecret: string | null;
  onConfirm: () => Promise<void>;
  submitting: boolean;
  error: string | null;
}

function PaymentFormInner({ onConfirm, submitting, error }: { onConfirm: () => Promise<void>; submitting: boolean; error: string | null }) {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <button
        type="button"
        disabled={!stripe || !elements || submitting}
        onClick={onConfirm}
        className="btn-primary w-full text-center disabled:opacity-50"
      >
        {submitting ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}

export function PaymentForm({ clientSecret, onConfirm, submitting, error }: PaymentFormWrapperProps) {
  if (!stripePromise) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
        Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments.
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-lg bg-primary/5" />
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#2F6B3B",
        colorBackground: "#ffffff",
        colorText: "#1a1a1a",
        fontFamily: "Inter, system-ui, sans-serif",
        borderRadius: "12px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner onConfirm={onConfirm} submitting={submitting} error={error} />
    </Elements>
  );
}
