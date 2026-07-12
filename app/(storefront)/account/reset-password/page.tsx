"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || "Check your email for the reset link.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.details?.[0]?.message || data.error?.message || "Reset failed");
        return;
      }

      setMessage("Password has been updated. You can now sign in.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (token) {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">New Password</label>
          <input id="password" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full" placeholder="Min 8 chars, upper + lower + number" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-foreground">Confirm New Password</label>
          <input id="confirmPassword" type="password" required value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field w-full" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button type="submit" disabled={loading}
          className="btn-primary w-full py-2 disabled:opacity-50">
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestReset} className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter your email address and we&apos;ll send you a reset link.</p>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">Email</label>
        <input id="email" type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field w-full" placeholder="you@example.com" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <button type="submit" disabled={loading}
        className="btn-primary w-full py-2 disabled:opacity-50">
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold text-foreground">Reset Password</h1>
      <Suspense fallback={<p className="text-center text-muted-foreground">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
