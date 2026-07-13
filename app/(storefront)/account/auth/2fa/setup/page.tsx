"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";

function TwoFASetupForm() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  async function handleSetup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Setup failed");
        return;
      }

      setSecret(data.secret);
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes || []);
      setStep("verify");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, secret }),
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

  const formattedSecret = secret.match(/.{1,4}/g)?.join(" ") || secret;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold text-foreground">
        {step === "setup" ? "Enable Two-Factor Authentication" : "Verify Authentication Code"}
      </h1>

      {step === "setup" ? (
        <form onSubmit={handleSetup} className="space-y-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">
              Enter your password to set up 2FA using an authenticator app
            </p>
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              placeholder="Your account password"
              autoComplete="current-password"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2 disabled:opacity-50">
            {loading ? "Setting up..." : "Continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
              and enter the 6-digit code below.
            </p>

            <div className="text-center">
              {qrCode && (
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className="mx-auto max-w-[200px] rounded-lg border border-gray-200 p-4 bg-white"
                />
              )}
              <p className="mt-2 text-sm font-mono text-foreground/70 break-all">
                Secret: <span className="font-mono text-primary">{formattedSecret}</span>
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-foreground mb-2">Backup Codes</p>
              <p className="text-xs text-muted-foreground mb-3">
                Save these codes in a safe place. Each can be used once if you lose access to your
                authenticator app.
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {backupCodes.map((code, i) => (
                  <code key={i} className="p-2 rounded bg-white border border-gray-200 font-mono">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          </div>

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
            {loading ? "Verifying..." : "Enable 2FA"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/account?tab=security" className="text-primary hover:underline">
              ← Cancel
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default function TwoFASetupPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">Loading...</p>}>
      <TwoFASetupForm />
    </Suspense>
  );
}