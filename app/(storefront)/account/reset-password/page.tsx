"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const passwordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (!pwd) return { label: "", color: "", width: "0%" };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    if (pwd.length < 8) return { label: "Too short", color: "bg-red-500", width: "25%" };
    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (score === 2) return { label: "Fair", color: "bg-yellow-500", width: "50%" };
    if (score === 3) return { label: "Good", color: "bg-blue-500", width: "75%" };
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  };

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

      setResetDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (resetDone) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Password Reset Complete</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your password has been updated successfully.
        </p>
        <Link href="/account/auth/login" className="btn-primary inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  if (token) {
    const strength = passwordStrength(password);
    return (
      <form onSubmit={handleReset} className="space-y-4">
        <div className="text-center mb-2">
          <h2 className="text-xl font-semibold text-foreground">Set New Password</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">New Password</label>
          <input id="password" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full" placeholder="Min 8 chars, upper + lower + number" autoFocus />
          {password && (
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div className={`h-1.5 rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{strength.label}</p>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-foreground">Confirm New Password</label>
          <input id="confirmPassword" type="password" required value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field w-full" />
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
          )}
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
      <p className="text-sm text-muted-foreground text-center mb-4">Enter your email address and we&apos;ll send you a reset link.</p>
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
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/account/auth/login" className="text-primary hover:underline">
            ← Back to Sign In
          </Link>
        </p>
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
