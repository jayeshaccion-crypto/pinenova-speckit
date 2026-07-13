"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

function TwoFAChallengeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tempToken = searchParams.get("tempToken");
  const redirect = searchParams.get("redirect") || "/account";

  const handleChallenge = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!tempToken) {
      setError("Invalid session. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, tempToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Invalid code");
        return;
      }

      showToast("Two-factor authentication successful!", "success");
      router.push(redirect);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChallenge} className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div>
        <label htmlFor="token" className="mb-1 block text-sm font-medium text-foreground">
          6-Digit Code
        </label>
        <input
          id="token"
          type="text"
          required
          maxLength={6}
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
          className="input-field w-full text-center text-2xl tracking-widest font-mono"
          placeholder="000000"
          autoComplete="one-time-code"
          autoFocus
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-2 disabled:opacity-50">
        {loading ? "Verifying..." : "Continue"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/account/auth/login" className="text-primary hover:underline">
          ← Back to Login
        </Link>
      </p>
    </form>
  );
}

export default function TwoFAChallengePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense fallback={<p className="text-center text-muted-foreground">Loading...</p>}>
        <TwoFAChallengeForm />
      </Suspense>
    </div>
  );
}