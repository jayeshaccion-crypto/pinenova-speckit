"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Loading...</div>;
  if (!order) return null;

  const address = typeof order.shippingAddress === "string" ? JSON.parse(order.shippingAddress) : order.shippingAddress;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/account" className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline">
        &larr; Back to Account
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order {order.orderNumber.slice(-8).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()} &middot; Full ID: {order.orderNumber}</p>
        </div>
        <span className={`${statusBadgeClass(order.status)} text-sm`}>{order.status}</span>
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
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            Tracking: {order.trackingNumber}{order.carrier ? ` (${order.carrier})` : ""}
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
