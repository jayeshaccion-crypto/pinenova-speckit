"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import { AdminSkeleton } from "./AdminSkeleton";

function statusBadgeClass(status: string) {
  if (status === "DELIVERED" || status === "REFUNDED") return "badge-green";
  if (status === "CANCELLED") return "badge-red";
  if (status === "SHIPPED") return "badge-green";
  if (status === "CONFIRMED") return "badge-blue";
  if (status === "PROCESSING") return "badge-yellow";
  if (status === "PENDING") return "badge-yellow";
  return "badge-gray";
}

function ShipButton({ orderId, onShip }: { orderId: string; onShip: (id: string, tracking: string, carrier: string) => void }) {
  const [show, setShow] = useState(false);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");

  if (!show) return <button onClick={() => setShow(true)} className="text-xs text-blue-600 hover:underline">Ship</button>;

  return (
    <div className="flex gap-1 items-center">
      <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking #" className="input-field w-28 text-xs" />
      <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Carrier" className="input-field w-20 text-xs" />
      <button onClick={() => { onShip(orderId, tracking, carrier); setShow(false); }} className="text-xs text-green-600 hover:underline">Confirm</button>
      <button onClick={() => setShow(false)} className="text-xs text-muted-foreground hover:underline">x</button>
    </div>
  );
}

function CancelButton({ orderId, onCancel }: { orderId: string; onCancel: (id: string, reason: string) => void }) {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState("");

  if (!show) return <button onClick={() => setShow(true)} className="text-xs text-red-500 hover:underline">Cancel</button>;

  return (
    <div className="flex gap-1 items-center">
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="input-field w-28 text-xs" />
      <button onClick={() => { onCancel(orderId, reason); setShow(false); }} className="text-xs text-red-600 hover:underline">Confirm</button>
      <button onClick={() => setShow(false)} className="text-xs text-muted-foreground hover:underline">x</button>
    </div>
  );
}

export function AdminOrdersTable({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);
  const { showToast } = useToast();

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", "20");
    if (filterStatus) params.set("status", filterStatus);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterDateTo) params.set("dateTo", filterDateTo);
    if (filterCustomer) params.set("customer", filterCustomer);
    return `/api/admin/orders?${params.toString()}`;
  }

  const fetchOrders = useCallback(async (p: number) => {
    try {
      const res = await api(buildUrl(p));
      if (!res) return;
      const data = await res.json();
      setOrders(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch { showToast("Failed to load orders", "error"); } finally { setLoading(false); }
  }, [api, showToast, filterStatus, filterDateFrom, filterDateTo, filterCustomer]);

  useEffect(() => {
    setLoading(true);
    fetchOrders(page);
  }, [page, filterStatus, filterDateFrom, filterDateTo, filterCustomer]);

  useEffect(() => { setSelectedIds(new Set()); }, [orders]);

  function handleFilter() {
    setPage(1);
    setLoading(true);
    fetchOrders(1);
  }

  async function updateStatus(orderId: string, status: string, extra?: Record<string, string>) {
    const res = await api("/api/admin/orders", {
      method: "PATCH", body: JSON.stringify({ orderId, status, ...extra }),
    });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); showToast(d.error?.message || "Failed", "error"); return; }
    showToast(`Order ${status.toLowerCase()}`, "success");
    fetchOrders(page);
  }

  async function handleRefund(orderId: string) {
    setConfirmRefundId(null);
    const res = await api("/api/admin/orders", {
      method: "POST", body: JSON.stringify({ orderId, reason: "Admin initiated refund" }),
    });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); showToast(d.error?.message || "Refund failed", "error"); return; }
    showToast("Refund processed", "success");
    fetchOrders(page);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  }

  async function handleBulkUpdate() {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkProcessing(true);
    const res = await api("/api/admin/orders/bulk", {
      method: "PATCH", body: JSON.stringify({ orderIds: Array.from(selectedIds), status: bulkStatus }),
    });
    if (!res) { setBulkProcessing(false); return; }
    if (!res.ok) { const d = await res.json(); showToast(d.error?.message || "Bulk update failed", "error"); setBulkProcessing(false); return; }
    setBulkProcessing(false);
    setSelectedIds(new Set());
    showToast("Bulk update applied", "success");
    fetchOrders(page);
  }

  if (loading) return <AdminSkeleton />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field text-sm">
            <option value="">All</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/50">From</label>
          <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/50">To</label>
          <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Customer/Order</label>
          <input type="search" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} placeholder="Name, email, or order #" className="input-field text-sm" />
        </div>
        <button onClick={handleFilter} className="btn-primary px-4 py-1.5 text-sm">Filter</button>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 p-3">
          <span className="text-sm text-foreground/70">{selectedIds.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="input-field text-sm">
            <option value="">Bulk status...</option>
            <option value="CONFIRMED">Confirm</option>
            <option value="PROCESSING">Process</option>
            <option value="SHIPPED">Ship</option>
            <option value="DELIVERED">Deliver</option>
            <option value="CANCELLED">Cancel</option>
          </select>
          <button onClick={handleBulkUpdate} disabled={!bulkStatus || bulkProcessing} className="btn-primary px-3 py-1 text-sm disabled:opacity-50">
            {bulkProcessing ? "Updating..." : "Apply"}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-foreground/50 hover:text-foreground">Clear</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-primary/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-primary/10 bg-primary/5">
            <tr>
              <th className="p-3">
                <input type="checkbox" checked={orders.length > 0 && selectedIds.size === orders.length}
                  onChange={toggleSelectAll} className="h-4 w-4 rounded border-primary/30" aria-label="Select all" />
              </th>
              <th className="p-3 font-medium">Order #</th><th className="p-3 font-medium">Customer</th><th className="p-3 font-medium">Total</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id} className={`border-b border-primary/5 last:border-0 ${selectedIds.has(o.id) ? "bg-primary/5" : ""}`}>
                <td className="p-3">
                  <input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleSelect(o.id)}
                    className="h-4 w-4 rounded border-primary/30" aria-label={`Select order ${o.orderNumber}`} />
                </td>
                <td className="p-3 text-foreground">{o.orderNumber}</td>
                <td className="p-3 text-foreground/50">{o.user ? `${o.user.firstName} ${o.user.lastName}` : o.email || "Guest"}</td>
                <td className="p-3 text-foreground">${Number(o.total).toFixed(2)}</td>
                <td className="p-3"><span className={`${statusBadgeClass(o.status)} text-xs`}>{o.status}</span></td>
                <td className="p-3 text-foreground/50">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {o.status === "PENDING" && <button onClick={() => updateStatus(o.id, "CONFIRMED")} className="text-xs text-green-600 hover:underline">Confirm</button>}
                    {o.status === "CONFIRMED" && <button onClick={() => updateStatus(o.id, "PROCESSING")} className="text-xs text-blue-600 hover:underline">Process</button>}
                    {o.status === "PROCESSING" && (
                      <ShipButton orderId={o.id} onShip={(id, tracking, carrier) => updateStatus(id, "SHIPPED", { ...(tracking ? { trackingNumber: tracking } : {}), ...(carrier ? { carrier } : {}) })} />
                    )}
                    {o.status === "SHIPPED" && <button onClick={() => updateStatus(o.id, "DELIVERED")} className="text-xs text-green-600 hover:underline">Deliver</button>}
                    {["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status) && <button onClick={() => setConfirmRefundId(o.id)} className="text-xs text-red-500 hover:underline">Refund</button>}
                    {["PENDING", "CONFIRMED", "PROCESSING"].includes(o.status) && (
                      <CancelButton orderId={o.id} onCancel={(id, reason) => updateStatus(id, "CANCELLED", { reason })} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border px-3 py-1 disabled:opacity-30 hover:bg-primary/5">Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`rounded px-3 py-1 ${p === page ? "bg-primary text-white" : "border hover:bg-primary/5"}`}>{p}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded border px-3 py-1 disabled:opacity-30 hover:bg-primary/5">Next</button>
        </div>
      )}

      {confirmRefundId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl max-w-sm">
            <p className="mb-4 text-sm text-gray-700">Process a full refund for this order?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmRefundId(null)} className="rounded border border-primary/20 px-4 py-1.5 text-sm text-foreground hover:bg-primary/5">Cancel</button>
              <button onClick={() => handleRefund(confirmRefundId)} className="rounded bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700">Refund</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
