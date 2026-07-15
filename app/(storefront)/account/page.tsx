"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/components/AuthContext";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
}

interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  totpEnabled: boolean;
}

function statusBadgeClass(status: string) {
  if (status === "DELIVERED" || status === "REFUNDED") return "badge-green";
  if (status === "CANCELLED") return "badge-red";
  if (status === "SHIPPED") return "badge-green";
  if (status === "CONFIRMED") return "badge-blue";
  if (status === "PROCESSING") return "badge-yellow";
  if (status === "PENDING") return "badge-yellow";
  return "badge-gray";
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { logout, refreshUser } = useAuth();
  const tab = searchParams.get("tab") || "profile";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  const [show2faSetup, setShow2faSetup] = useState(false);
  const [show2faDisable, setShow2faDisable] = useState(false);
  const [password, setPassword] = useState("");
  const [setupPwd, setSetupPwd] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [saveError, setSaveError] = useState("");

  function setTab(newTab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const qs = params.toString();
    router.push(qs ? `/account?${qs}` : "/account");
  }

  async function api(path: string, opts?: RequestInit): Promise<Response | null> {
    const res = await fetch(path, { ...opts, credentials: "include", headers: { "Content-Type": "application/json", ...opts?.headers } });
    if (res.status === 401) { logout(); router.push("/account/auth/login"); return null; }
    return res;
  }

  useEffect(() => {
    async function load() {
      try {
        const profileRes = await api("/api/account/profile");
        if (profileRes?.ok) {
          const p = await profileRes.json();
          setProfile(p.data);
          setFirstName(p.data.firstName);
          setLastName(p.data.lastName);
        }
      } catch {
        // Profile fetch failed silently
      }

      if (tab === "orders") {
        try {
          const orderRes = await api(`/api/account/orders?page=${orderPage}&limit=10`);
          if (orderRes?.ok) {
            const o = await orderRes.json();
            setOrders(o.data || []);
            setOrderTotal(o.total || 0);
            setOrderTotalPages(o.totalPages || 1);
          }
        } catch {
          setOrders([]);
        }
      }

      setLoading(false);
    }

    load();
  }, [orderPage, tab]);

  const sectionTabs = [
    { key: "profile", label: "Profile" },
    { key: "orders", label: "Orders" },
    { key: "security", label: "Security" },
    { key: "privacy", label: "Privacy" },
  ];

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">My Account</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Account</h1>
        {profile?.firstName && (
          <p className="mt-1 text-sm text-muted-foreground">Welcome back, {profile.firstName}</p>
        )}
      </div>

      <div className="mb-6 border-b border-primary/10">
        <nav className="flex gap-6" aria-label="Account sections">
          {sectionTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              aria-current={tab === t.key ? "page" : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "profile" && (
        <section className="card mb-8 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
            {!editingName && (
              <button onClick={() => setEditingName(true)} className="text-sm text-primary hover:underline">Edit</button>
            )}
          </div>
          {editingName ? (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded border px-3 py-2 text-sm" />
              </div>
              <button onClick={handleSaveName} disabled={saving} className="btn-primary px-4 py-2 text-sm">{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setEditingName(false)} className="px-4 py-2 text-sm text-muted-foreground hover:underline">Cancel</button>
              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            </div>
          ) : (
            <p className="text-muted-foreground">{profile?.firstName} {profile?.lastName} &mdash; {profile?.email}</p>
          )}
        </section>
      )}

      {tab === "orders" && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Order History</h2>
            {orderTotal > 0 && (
              <p className="text-sm text-muted-foreground">{orderTotal} order{orderTotal !== 1 ? "s" : ""}</p>
            )}
          </div>
          {orders.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="mb-4 text-muted-foreground">You haven&apos;t placed any orders yet.</p>
              <Link href="/products" className="btn-primary inline-block px-6 py-2">Start Shopping</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Order</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-primary/5">
                      <td className="py-3 pr-4">
                        <Link href={`/account/orders/${order.id}`} className="font-medium text-primary hover:underline" title={order.orderNumber}>
                          {order.orderNumber.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">
                        <span className={`${statusBadgeClass(order.status)} text-xs`}>{order.status}</span>
                      </td>
                      <td className="py-3 text-right font-medium">${Number(order.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orderTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                  <button onClick={() => setOrderPage((p) => Math.max(1, p - 1))} disabled={orderPage <= 1} className="rounded border px-3 py-1 disabled:opacity-30 hover:bg-primary/5">Previous</button>
                  {Array.from({ length: orderTotalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setOrderPage(p)} className={`rounded px-3 py-1 ${p === orderPage ? "bg-primary text-white" : "border hover:bg-primary/5"}`}>{p}</button>
                  ))}
                  <button onClick={() => setOrderPage((p) => Math.min(orderTotalPages, p + 1))} disabled={orderPage >= orderTotalPages} className="rounded border px-3 py-1 disabled:opacity-30 hover:bg-primary/5">Next</button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {tab === "security" && (
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
          {profile?.totpEnabled ? (
            <div>
              <p className="mb-3 text-sm text-green-700 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Two-factor authentication is enabled
              </p>
              {show2faDisable ? (
                <div className="flex flex-wrap items-end gap-3 mt-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">6-digit code</label>
                    <input value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="rounded border px-3 py-2 text-sm w-24" />
                  </div>
                  <button onClick={handleDisable2fa} disabled={disableLoading} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">{disableLoading ? "Disabling..." : "Disable"}</button>
                  <button onClick={() => { setShow2faDisable(false); setPassword(""); setTotpCode(""); }} className="text-sm text-muted-foreground hover:underline">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setShow2faDisable(true)} className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">Disable 2FA</button>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">Add an extra layer of security to your account using an authenticator app.</p>
              {show2faSetup ? (
                <div className="space-y-4">
                  {qrCode && (
                    <div className="text-center">
                      <Image src={qrCode} alt="Scan this QR code with your authenticator app" width={180} height={180} className="mx-auto rounded-lg border p-2 bg-white" />
                    </div>
                  )}
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">6-digit code</label>
                      <input value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="rounded border px-3 py-2 text-sm w-24" />
                    </div>
                    <button onClick={handleVerify2fa} disabled={verifyLoading} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{verifyLoading ? "Verifying..." : "Verify & Enable"}</button>
                    <button onClick={() => { setShow2faSetup(false); setQrCode(""); setTotpSecret(""); setTotpCode(""); setSetupPwd(""); }} className="text-sm text-muted-foreground hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-3 mt-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Enter password to start setup</label>
                    <input type="password" value={setupPwd} onChange={(e) => setSetupPwd(e.target.value)} className="rounded border px-3 py-2 text-sm" />
                  </div>
                  <button onClick={handleBeginSetup} disabled={!setupPwd || setupLoading} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{setupLoading ? "Starting..." : "Enable 2FA"}</button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {tab === "privacy" && (
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Privacy & Data</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Manage your personal data. You can download a copy of all your data or delete your account permanently.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={handleDownloadData} className="btn-primary px-4 py-2 text-sm">Download My Data</button>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete My Account</button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-red-800">Are you sure?</p>
                  <p className="text-xs text-red-600">This action is permanent and cannot be undone.</p>
                </div>
                <button onClick={handleDeleteAccount} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">{deleting ? "Deleting..." : "Confirm Delete"}</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-sm text-red-700 hover:underline">Cancel</button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );

  async function handleSaveName() {
    setSaving(true);
    setSaveError("");
    const res = await api("/api/account/profile", {
      method: "PATCH",
      body: JSON.stringify({ firstName, lastName }),
    });
    if (res && res.ok) {
      const p = await res.json();
      setProfile(p.data);
      setEditingName(false);
      showToast("Profile updated", "success");
    } else {
      setSaveError("Failed to save. Try again.");
    }
    setSaving(false);
  }

  async function handleBeginSetup() {
    if (!setupPwd || setupLoading) return;
    setSetupLoading(true);
    const res = await api("/api/auth/2fa/setup", { method: "POST", body: JSON.stringify({ password: setupPwd }) });
    if (res && res.ok) {
      const data = await res.json();
      setQrCode(data.qrCode);
      setTotpSecret(data.secret);
      setShow2faSetup(true);
    } else {
      showToast("Failed to start 2FA setup. Check your password.", "error");
    }
    setSetupLoading(false);
  }

  async function handleVerify2fa() {
    if (verifyLoading) return;
    setVerifyLoading(true);
    const res = await api("/api/auth/2fa/verify", { method: "POST", body: JSON.stringify({ token: totpCode, secret: totpSecret }) });
    if (res && res.ok) {
      setProfile((p) => p ? { ...p, totpEnabled: true } : p);
      setShow2faSetup(false);
      setTotpCode("");
      setQrCode("");
      setTotpSecret("");
      showToast("Two-factor authentication enabled", "success");
      await refreshUser();
    } else {
      showToast("Invalid code. Try again.", "error");
    }
    setVerifyLoading(false);
  }

  async function handleDisable2fa() {
    if (disableLoading) return;
    setDisableLoading(true);
    const res = await api("/api/auth/2fa/disable", { method: "POST", body: JSON.stringify({ password, token: totpCode }) });
    if (res && res.ok) {
      setProfile((p) => p ? { ...p, totpEnabled: false } : p);
      setShow2faDisable(false);
      setPassword("");
      setTotpCode("");
      showToast("Two-factor authentication disabled", "success");
      await refreshUser();
    } else {
      showToast("Failed to disable 2FA. Check your password and code.", "error");
    }
    setDisableLoading(false);
  }

  async function handleDownloadData() {
    try {
      const res = await api("/api/account/data");
      if (!res?.ok) {
        showToast("Failed to download data", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-pinenova-data.json";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Data download started", "success");
    } catch {
      showToast("Network error. Please try again.", "error");
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await api("/api/account/data", {
        method: "DELETE",
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (res?.ok) {
        await logout();
        router.push("/?deleted=1");
      } else {
        const data = await res?.json();
        showToast(data?.error?.message || "Deletion failed", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">Loading...</div>}>
      <AccountContent />
    </Suspense>
  );
}
