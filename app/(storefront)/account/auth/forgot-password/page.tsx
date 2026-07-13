"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

function ForgotPasswordForm() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Request failed");
        return;
      }

      setSubmitted(true);
      showToast("If the email exists, a reset link has been sent", "success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Check Your Email</h2>
<p className="text-sm text-muted-foreground mb-6">
            If an account exists for {email}, you&apos;ll receive a password reset link shortly.
          </p>
        <Link href="/account/auth/login" className="btn-primary inline-block">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Forgot Password</h2>
<p className="text-sm text-muted-foreground mt-1">
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field w-full"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-2 disabled:opacity-50">
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/account/auth/login" className="text-primary hover:underline">
          ← Back to Sign In
        </Link>
      </p>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense fallback={<p className="text-center text-muted-foreground">Loading...</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}