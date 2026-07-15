"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("You must agree to the Terms & Conditions");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.details?.[0]?.message || data.error?.message || "Registration failed");
        return;
      }

      router.push("/account/auth/login?registered=1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold text-foreground">Create Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-foreground">First Name</label>
            <input id="firstName" required value={form.firstName} onChange={(e) => update("firstName", e.target.value)}
              className="input-field w-full" />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-foreground">Last Name</label>
            <input id="lastName" required value={form.lastName} onChange={(e) => update("lastName", e.target.value)}
              className="input-field w-full" />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">Email</label>
          <input id="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
            className="input-field w-full" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">Password</label>
          <input id="password" type="password" required value={form.password} onChange={(e) => update("password", e.target.value)}
            className="input-field w-full" placeholder="Min 8 chars, upper + lower + number" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-foreground">Confirm Password</label>
          <input id="confirmPassword" type="password" required value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)}
            className="input-field w-full" />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="agreeTerms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="agreeTerms" className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading}
          className="btn-primary w-full py-2 disabled:opacity-50">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/account/auth/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
