"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";

function TwoFAVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const setupToken = searchParams.get("setup_token");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, secret: setupToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Verification failed");
        return;
      }

      showToast("Two-factor authentication enabled", "success");
      await refreshUser();
      router.push("/account?tab=security");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Verify 2FA Setup</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label htmlFor="token" className="mb-1 block text-sm font-medium text-foreground">
            6-Digit Code
          </label>
          <input
            id="token"
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="input-field w-full text-center text-2xl tracking-widest"
            placeholder="000000"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2 disabled:opacity-50">
          {loading ? "Verifying..." : "Verify & Enable"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/account/auth/2fa/setup" className="text-primary hover:underline">
            ← Back to Setup
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function TwoFAVerifyPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">Loading...</p>}>
      <TwoFAVerifyForm />
    </Suspense>
  );
}