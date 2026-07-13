"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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

export default function AccountPage() {
  const router = useRouter();
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
  const [totpCode, setTotpCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [saveError, setSaveError] = useState("");

  async function api(path: string, opts?: RequestInit): Promise<Response | null> {
    const res = await fetch(path, { ...opts, credentials: "include", headers: { "Content-Type": "application/json", ...opts?.headers } });
    if (res.status === 401) { redirectLogin(); return null; }
    return res;
  }

  function redirectLogin() {
    document.cookie = "accessToken=; path=/; max-age=0";
    router.push("/account/auth/login");
  }

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, orderRes] = await Promise.all([
          api("/api/account/profile"),
          api(`/api/account/orders?page=${orderPage}&limit=10`),
        ]);

        if (profileRes?.ok) {
          const p = await profileRes.json();
          setProfile(p.data);
          setFirstName(p.data.firstName);
          setLastName(p.data.lastName);
        }

        if (orderRes?.ok) {
          const o = await orderRes.json();
          setOrders(o.data || []);
          setOrderTotal(o.total || 0);
          setOrderTotalPages(o.totalPages || 1);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, orderPage]);

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
    } else {
      setSaveError("Failed to save. Try again.");
    }
    setSaving(false);
  }

  async function handleBeginSetup() {
    if (!setupPwd) return;
    const res = await api("/api/auth/2fa/setup", { method: "POST", body: JSON.stringify({ password: setupPwd }) });
    if (res && res.ok) {
      const data = await res.json();
      setQrCode(data.qrCode);
      setTotpSecret(data.secret);
      setShow2faSetup(true);
    } else {
      alert("Failed to start 2FA setup. Check your password.");
    }
  }

  async function handleVerify2fa() {
    const res = await api("/api/auth/2fa/verify", { method: "POST", body: JSON.stringify({ token: totpCode, secret: totpSecret }) });
    if (res && res.ok) {
      setProfile((p) => p ? { ...p, totpEnabled: true } : p);
      setShow2faSetup(false);
      setTotpCode("");
      setQrCode("");
      setTotpSecret("");
    } else {
      alert("Invalid code. Try again.");
    }
  }

  async function handleDisable2fa() {
    const res = await api("/api/auth/2fa/disable", { method: "POST", body: JSON.stringify({ password, token: totpCode }) });
    if (res && res.ok) {
      setProfile((p) => p ? { ...p, totpEnabled: false } : p);
      setShow2faDisable(false);
      setPassword("");
      setTotpCode("");
    } else {
      alert("Failed to disable 2FA. Check your password and code.");
    }
  }

  async function handleDownloadData() {
    try {
      const res = await api("/api/account/data");
      if (!res?.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-pinenova-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await api("/api/account/data", {
        method: "DELETE",
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (res?.ok) {
        document.cookie = "accessToken=; path=/; max-age=0";
        document.cookie = "refreshToken=; path=/api/auth; max-age=0";
        router.push("/?deleted=1");
      } else {
        const data = await res?.json();
        alert(data?.error?.message || "Deletion failed");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  function handleLogout() {
    document.cookie = "accessToken=; path=/; max-age=0";
    document.cookie = "refreshToken=; path=/api/auth; max-age=0";
    router.push("/");
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Account</h1>
        <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Sign Out</button>
      </div>

      <p className="mb-6 text-muted-foreground">
        Welcome back{profile?.firstName ? `, ${profile.firstName}` : ""}!
      </p>

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

      <section className="card mb-8 p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
        {profile?.totpEnabled ? (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Two-factor authentication is enabled.</p>
            {show2faDisable ? (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">6-digit code</label>
                  <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} maxLength={6} className="rounded border px-3 py-2 text-sm w-24" />
                </div>
                <button onClick={handleDisable2fa} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Disable</button>
                <button onClick={() => { setShow2faDisable(false); setPassword(""); setTotpCode(""); }} className="text-sm text-muted-foreground hover:underline">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShow2faDisable(true)} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">Disable 2FA</button>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
            {show2faSetup ? (
              <div>
                {qrCode && (
                  <Image src={qrCode} alt="Scan this QR code with your authenticator app" width={160} height={160} className="mb-3" />
                )}
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">6-digit code</label>
                    <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} maxLength={6} className="rounded border px-3 py-2 text-sm w-24" />
                  </div>
                  <button onClick={handleVerify2fa} className="btn-primary px-4 py-2 text-sm">Verify & Enable</button>
                  <button onClick={() => { setShow2faSetup(false); setQrCode(""); setTotpSecret(""); setTotpCode(""); setSetupPwd(""); }} className="text-sm text-muted-foreground hover:underline">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Password</label>
                  <input type="password" value={setupPwd} onChange={(e) => setSetupPwd(e.target.value)} className="rounded border px-3 py-2 text-sm" />
                </div>
                <button onClick={handleBeginSetup} disabled={!setupPwd} className="btn-primary px-4 py-2 text-sm">Enable 2FA</button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Order History</h2>
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

      <section className="border-t pt-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Account Settings</h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleDownloadData} className="btn-primary px-4 py-2 text-sm">Download My Data</button>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete My Account</button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-600">Are you sure?</p>
              <button onClick={handleDeleteAccount} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">{deleting ? "Deleting..." : "Confirm Delete"}</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-sm text-muted-foreground hover:underline">Cancel</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
