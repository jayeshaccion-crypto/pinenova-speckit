"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

interface OrderItem {
  id: string;
  productId: string;
  productSnapshot: any;
  quantity: number;
  unitPrice: string;
}

interface StatusLog {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  reason: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  tax: string;
  shippingCost: string;
  total: string;
  shippingAddress: any;
  trackingNumber: string | null;
  carrier: string | null;
  cancelReason: string | null;
  refundAmount: string | null;
  createdAt: string;
  items: OrderItem[];
  statusLogs: StatusLog[];
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

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  async function api(path: string, opts?: RequestInit): Promise<Response | null> {
    const res = await fetch(path, { ...opts, credentials: "include", headers: { "Content-Type": "application/json", ...opts?.headers } });
    if (res.status === 401) { router.push("/account/auth/login"); return null; }
    if (res.status === 403 || res.status === 404) { router.push("/account"); return null; }
    return res;
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await api(`/api/account/orders/${params.id}`);
        if (!res) return;
        const data = await res.json();
        setOrder(data.data);
      } catch {
        router.push("/account");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  async function handleReorder() {
    if (!order) return;
    setReordering(true);
    try {
      for (const item of order.items) {
        const res = await api("/api/cart", {
          method: "POST",
          body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
        });
        if (!res?.ok) {
          showToast(`Failed to add ${item.productSnapshot?.name || "item"} to cart`, "error");
          setReordering(false);
          return;
        }
      }
      showToast("Items added to your cart", "success");
      router.push("/cart");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setReordering(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Loading...</div>;
  if (!order) return null;

  const address = typeof order.shippingAddress === "string" ? JSON.parse(order.shippingAddress) : order.shippingAddress;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/account" className="hover:text-foreground transition-colors">My Account</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Order {order.orderNumber.slice(-8).toUpperCase()}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order {order.orderNumber.slice(-8).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`${statusBadgeClass(order.status)} text-sm`}>{order.status}</span>
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {reordering ? "Adding..." : "Reorder"}
          </button>
        </div>
      </div>

      <div className="card mb-6 p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Items</h2>
        <div className="divide-y">
          {order.items.map((item) => {
            const snap = typeof item.productSnapshot === "string" ? JSON.parse(item.productSnapshot) : item.productSnapshot;
            return (
              <div key={item.id} className="flex items-center gap-4 py-3">
                {snap.image ? (
                  <img src={snap.image} alt={snap.name} className="h-16 w-16 rounded-lg bg-primary/5 object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/5 text-foreground/30 text-xs">No img</div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-foreground">{snap.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity} &times; ${Number(item.unitPrice).toFixed(2)}</p>
                </div>
                <p className="font-medium text-foreground">${(item.quantity * Number(item.unitPrice)).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-green-600"><span>Discount</span><span>-${Number(order.discountAmount).toFixed(2)}</span></div>
          )}
          <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>${Number(order.shippingCost).toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold text-foreground border-t pt-2"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
          {order.refundAmount && (
            <div className="flex justify-between text-red-600"><span>Refunded</span><span>-${Number(order.refundAmount).toFixed(2)}</span></div>
          )}
        </div>
      </div>

      {address && (
        <div className="card mb-6 p-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Shipping Address</h2>
          <p className="text-sm text-muted-foreground">
            {address.street}<br />
            {address.city}, {address.state} {address.zip}<br />
            {address.country}
          </p>
        </div>
      )}

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Status Timeline</h2>
        {order.statusLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No status updates yet.</p>
        ) : (
          <div className="space-y-4">
            {order.statusLogs.map((log) => (
              <div key={log.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <div className="h-full w-px bg-primary/20" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-foreground">
                    {log.fromStatus ? `${log.fromStatus} → ${log.toStatus}` : log.toStatus}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                  {log.reason && <p className="text-xs text-muted-foreground">Reason: {log.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        {order.trackingNumber && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-2m0 0l2 2m-2-2v10a1 1 0 001 1h14a1 1 0 001-1v-4" />
            </svg>
            <span>
              Tracking: <strong>{order.trackingNumber}</strong>
              {order.carrier ? ` (${order.carrier})` : ""}
            </span>
            {order.carrier && (
              <a
                href={order.carrier === "UPS" ? `https://www.ups.com/track?tracknum=${order.trackingNumber}` :
                      order.carrier === "FedEx" ? `https://www.fedex.com/fedextrack/?trknbr=${order.trackingNumber}` :
                      order.carrier === "USPS" ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.trackingNumber}` :
                      "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-blue-600 hover:underline"
              >
                Track Package
              </a>
            )}
          </div>
        )}
        {order.cancelReason && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Cancellation reason: {order.cancelReason}
          </div>
        )}
      </div>
    </div>
  );
}
