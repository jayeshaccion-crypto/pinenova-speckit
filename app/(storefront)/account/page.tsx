"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/account/auth/login");
      return;
    }

    async function load() {
      try {
        const [orderRes] = await Promise.all([
          fetch("/api/account/orders", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (orderRes.status === 401) {
          localStorage.removeItem("accessToken");
          router.push("/account/auth/login");
          return;
        }

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrders(orderData.data || []);
        }

        const payload = JSON.parse(atob(token!.split(".")[1]));
        setUser({ firstName: "", lastName: "", email: payload.sub || "" });
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function handleDownloadData() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch("/api/account/data", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;

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
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/account/data", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem("accessToken");
        document.cookie = "accessToken=; path=/; max-age=0";
        document.cookie = "refreshToken=; path=/api/auth; max-age=0";
        router.push("/?deleted=1");
      } else {
        alert(data.error?.message || "Deletion failed");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleLogout() {
    localStorage.removeItem("accessToken");
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

      {user && (
        <p className="mb-6 text-muted-foreground">
          Welcome back{user.firstName ? `, ${user.firstName}` : ""}!
        </p>
      )}

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
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium text-primary">{order.orderNumber}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge-${order.status === "CONFIRMED" ? "active" : "neutral"}`}>{order.status}</span>
                    </td>
                    <td className="py-3 text-right font-medium">${Number(order.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border-t pt-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Account Settings</h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleDownloadData}
            className="btn-primary px-4 py-2 text-sm">
            Download My Data
          </button>

          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Delete My Account
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-600">Are you sure?</p>
              <button onClick={handleDeleteAccount} disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="text-sm text-muted-foreground hover:underline">
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
