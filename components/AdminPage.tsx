"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const SESSION_KEY = "pinenova_cart_sid";

const TABS = [
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "inventory", label: "Inventory" },
  { key: "discounts", label: "Discounts" },
  { key: "metrics", label: "Metrics" },
];

export function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "products";

  async function api(path: string, opts?: RequestInit): Promise<Response | null> {
    const res = await fetch(path, { ...opts, credentials: "include", headers: { "Content-Type": "application/json", ...opts?.headers } });
    if (res.status === 401) { window.location.href = "/admin/login?redirect=/admin"; return null; }
    return res;
  }

  function switchTab(t: string) {
    router.push(`/admin?tab=${t}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <a href="/" className="text-sm text-primary hover:underline">View Store</a>
      </div>
      <div className="mb-6 flex gap-2 border-b border-primary/10 pb-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? "border-b-2 border-primary text-foreground" : "text-foreground/50 hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "products" && <AdminProductsTab api={api} />}
      {tab === "orders" && <AdminOrdersTab api={api} />}
      {tab === "inventory" && <AdminInventoryTab api={api} />}
      {tab === "discounts" && <AdminDiscountsTab api={api} />}
      {tab === "metrics" && <AdminMetricsTab api={api} />}
    </div>
  );
}

function AdminProductsTab({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/api/admin/products");
      if (!res) return;
      const data = await res.json();
      setProducts(data.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleCreate(form: any) {
    const res = await api("/api/admin/products", { method: "POST", body: JSON.stringify(form) });
    if (res?.ok) { setShowForm(false); fetchProducts(); }
  }

  async function handleArchive(id: string) {
    await api(`/api/admin/products?id=${id}`, { method: "DELETE" });
    fetchProducts();
  }

  if (loading) return <div className="text-sm text-foreground/50">Loading...</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-foreground/50">{products.length} products</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-1.5 text-sm">
          {showForm ? "Cancel" : "New Product"}
        </button>
      </div>
      {showForm && <ProductForm api={api} onSave={handleCreate} />}
      <div className="overflow-x-auto rounded-lg border border-primary/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-primary/10 bg-primary/5">
            <tr><th className="p-3 font-medium text-foreground">Name</th><th className="p-3 font-medium text-foreground">SKU</th><th className="p-3 font-medium text-foreground">Price</th><th className="p-3 font-medium text-foreground">Stock</th><th className="p-3 font-medium text-foreground">Published</th><th className="p-3 font-medium text-foreground">Actions</th></tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-b border-primary/5 last:border-0">
                <td className="p-3 text-foreground">{p.name}</td>
                <td className="p-3 text-foreground/50">{p.sku}</td>
                <td className="p-3 text-foreground">${Number(p.price).toFixed(2)}</td>
                <td className="p-3">{p.stock <= (p.lowStockThreshold || 5) ? <span className="badge-yellow text-xs">{p.stock}</span> : <span className="text-foreground/50">{p.stock}</span>}</td>
                <td className="p-3">{p.published ? <span className="text-xs text-green-600">Yes</span> : <span className="text-xs text-foreground/30">No</span>}</td>
                <td className="p-3">
                  <button onClick={() => handleArchive(p.id)} className="text-xs text-red-500 hover:underline">Archive</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductForm({ api, onSave, initial }: { api: (path: string, opts?: RequestInit) => Promise<Response | null>; onSave: (data: any) => void; initial?: any }) {
  const [form, setForm] = useState(initial || { name: "", slug: "", sku: "", price: "", stock: "0", description: "", materialTag: "Pineapple Fiber", published: false });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock) });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-primary/10 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-xs text-foreground/50">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field w-full text-sm" required /></div>
        <div><label className="mb-1 block text-xs text-foreground/50">Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field w-full text-sm" required /></div>
        <div><label className="mb-1 block text-xs text-foreground/50">SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field w-full text-sm" required /></div>
        <div><label className="mb-1 block text-xs text-foreground/50">Price ($)</label><input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field w-full text-sm" required /></div>
        <div><label className="mb-1 block text-xs text-foreground/50">Stock</label><input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field w-full text-sm" /></div>
        <div><label className="mb-1 block text-xs text-foreground/50">Material</label><input value={form.materialTag} onChange={(e) => setForm({ ...form, materialTag: e.target.value })} className="input-field w-full text-sm" /></div>
      </div>
      <div><label className="mb-1 block text-xs text-foreground/50">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field w-full text-sm" rows={3} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
      <button type="submit" disabled={saving} className="btn-primary px-4 py-1.5 text-sm">{saving ? "Saving..." : "Save Product"}</button>
    </form>
  );
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

function AdminOrdersTab({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

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

  async function fetchOrders(p: number) {
    try {
      const res = await api(buildUrl(p));
      if (!res) return;
      const data = await res.json();
      setOrders(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch { setError("Failed to load"); } finally { setLoading(false); }
  }

  useEffect(() => {
    setLoading(true);
    fetchOrders(page);
  }, [page, filterStatus, filterDateFrom, filterDateTo, filterCustomer]);

  function handleFilter() {
    setPage(1);
    setLoading(true);
    fetchOrders(1);
  }

  async function updateStatus(orderId: string, status: string, extra?: Record<string, string>) {
    setError("");
    const res = await api("/api/admin/orders", {
      method: "PATCH", body: JSON.stringify({ orderId, status, ...extra }),
    });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); setError(d.error?.message || "Failed"); return; }
    fetchOrders(page);
  }

  async function refund(orderId: string) {
    if (!window.confirm("Process a full refund for this order?")) return;
    setError("");
    const res = await api("/api/admin/orders", {
      method: "POST", body: JSON.stringify({ orderId, reason: "Admin initiated refund" }),
    });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); setError(d.error?.message || "Refund failed"); return; }
    fetchOrders(page);
  }

  if (loading) return <div className="text-sm text-foreground/50">Loading...</div>;

  return (
    <div>
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

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

      <div className="overflow-x-auto rounded-lg border border-primary/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-primary/10 bg-primary/5">
            <tr><th className="p-3 font-medium">Order #</th><th className="p-3 font-medium">Customer</th><th className="p-3 font-medium">Total</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id} className="border-b border-primary/5 last:border-0">
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
                    {["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status) && <button onClick={() => refund(o.id)} className="text-xs text-red-500 hover:underline">Refund</button>}
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
    </div>
  );
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

function AdminInventoryTab({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [products, setProducts] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await api("/api/admin/inventory");
        if (!res) return;
        const data = await res.json();
        setProducts(data.data || []);
        setAuditLog(data.auditLog || []);
      } catch { setError("Failed to load"); } finally { setLoading(false); }
    }
    fetchInventory();
  }, [api]);

  async function adjustStock(productId: string, newStock: number, reason: string) {
    setError("");
    const res = await api("/api/admin/inventory", {
      method: "POST", body: JSON.stringify({ productId, newStock, reason }),
    });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); setError(d.error?.message || "Adjustment failed"); return; }
    const res2 = await api("/api/admin/inventory");
    if (!res2) return;
    const data = await res2.json();
    setProducts(data.data || []);
    setAuditLog(data.auditLog || []);
  }

  if (loading) return <div className="text-sm text-foreground/50">Loading...</div>;

  return (
    <div>
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-x-auto rounded-lg border border-primary/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-primary/10 bg-primary/5">
            <tr><th className="p-3 font-medium">Product</th><th className="p-3 font-medium">SKU</th><th className="p-3 font-medium">Current Stock</th><th className="p-3 font-medium">Adjust</th></tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-b border-primary/5 last:border-0">
                <td className="p-3 text-foreground">{p.name}</td>
                <td className="p-3 text-foreground/50">{p.sku}</td>
                <td className="p-3">{p.stock <= (p.lowStockThreshold || 5) ? <span className="badge-yellow text-xs">{p.stock}</span> : <span className="text-foreground/50">{p.stock}</span>}</td>
                <td className="p-3">
                  <AdjustStockForm productId={p.id} currentStock={p.stock} onAdjust={adjustStock} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {auditLog.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Adjustments</h2>
          <div className="space-y-1 text-sm text-foreground/50">
            {auditLog.slice(0, 10).map((a: any) => (
              <div key={a.id} className="flex gap-4">
                <span className="w-32 shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
                <span>{a.reason}: {a.oldStock} → {a.newStock} ({a.change >= 0 ? "+" : ""}{a.change})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdjustStockForm({ productId, currentStock, onAdjust }: { productId: string; currentStock: number; onAdjust: (id: string, stock: number, reason: string) => void }) {
  const [newStock, setNewStock] = useState(String(currentStock));
  const [reason, setReason] = useState("Admin adjustment");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onAdjust(productId, parseInt(newStock), reason);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input type="number" min="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} className="input-field w-20 text-sm" />
      <input value={reason} onChange={(e) => setReason(e.target.value)} className="input-field w-40 text-sm" placeholder="Reason" />
      <button type="submit" disabled={saving} className="btn-primary px-3 py-1 text-xs">{saving ? "..." : "Update"}</button>
    </form>
  );
}

function AdminDiscountsTab({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function fetchCodes() {
      try {
        const res = await api("/api/admin/discounts");
        if (!res) return;
        const data = await res.json();
        setCodes(data.data || []);
      } catch { setError("Failed to load"); } finally { setLoading(false); }
    }
    fetchCodes();
  }, [api]);

  async function createCode(form: any) {
    setError("");
    const res = await api("/api/admin/discounts", { method: "POST", body: JSON.stringify(form) });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); setError(d.error?.message || "Failed"); return; }
    setShowForm(false);
    const res2 = await api("/api/admin/discounts");
    if (!res2) return;
    const data = await res2.json();
    setCodes(data.data || []);
  }

  async function deactivate(id: string) {
    await api(`/api/admin/discounts?id=${id}`, { method: "DELETE" });
    const res = await api("/api/admin/discounts");
    if (!res) return;
    const data = await res.json();
    setCodes(data.data || []);
  }

  if (loading) return <div className="text-sm text-foreground/50">Loading...</div>;

  return (
    <div>
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-foreground/50">{codes.length} codes</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-1.5 text-sm">{showForm ? "Cancel" : "New Code"}</button>
      </div>
      {showForm && <DiscountForm onSave={createCode} />}
      <div className="overflow-x-auto rounded-lg border border-primary/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-primary/10 bg-primary/5">
            <tr><th className="p-3 font-medium">Code</th><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Value</th><th className="p-3 font-medium">Used</th><th className="p-3 font-medium">Max Uses</th><th className="p-3 font-medium">Active</th><th className="p-3 font-medium"></th></tr>
          </thead>
          <tbody>
            {codes.map((c: any) => (
              <tr key={c.id} className="border-b border-primary/5 last:border-0">
                <td className="p-3 font-mono text-foreground">{c.code}</td>
                <td className="p-3 text-foreground/50">{c.type}</td>
                <td className="p-3 text-foreground">{c.type === "PERCENTAGE" ? `${c.value}%` : `$${Number(c.value).toFixed(2)}`}</td>
                <td className="p-3 text-foreground/50">{c.usedCount}</td>
                <td className="p-3 text-foreground/50">{c.maxUses || "∞"}</td>
                <td className="p-3">{c.isActive ? <span className="text-xs text-green-600">Yes</span> : <span className="text-xs text-foreground/30">No</span>}</td>
                <td className="p-3">{c.isActive && <button onClick={() => deactivate(c.id)} className="text-xs text-red-500 hover:underline">Deactivate</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiscountForm({ onSave }: { onSave: (data: any) => void }) {
  const [form, setForm] = useState({ code: "", type: "PERCENTAGE", value: "", maxUses: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, value: parseFloat(form.value), maxUses: form.maxUses ? parseInt(form.maxUses) : undefined });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-primary/10 p-4 space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div><label className="mb-1 block text-xs text-foreground/50">Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field w-full text-sm font-mono" required /></div>
        <div><label className="mb-1 block text-xs text-foreground/50">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field w-full text-sm"><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed</option></select></div>
        <div><label className="mb-1 block text-xs text-foreground/50">Value</label><input type="number" step="0.01" min="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field w-full text-sm" required /></div>
        <div><label className="mb-1 block text-xs text-foreground/50">Max Uses</label><input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="input-field w-full text-sm" /></div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary px-4 py-1.5 text-sm">{saving ? "Saving..." : "Create Code"}</button>
    </form>
  );
}

function AdminMetricsTab({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await api("/api/admin/metrics");
        if (!res) return;
        const data = await res.json();
        setMetrics(data);
      } catch { /* */ } finally { setLoading(false); }
    }
    fetchMetrics();
  }, [api]);

  async function downloadCSV() {
    const res = await api("/api/admin/metrics?format=csv");
    if (!res) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orders-export.csv";
    a.click();
  }

  if (loading) return <div className="text-sm text-foreground/50">Loading...</div>;

  return (
    <div className="space-y-6">
      {metrics && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4"><p className="text-xs text-foreground/50">Total Revenue</p><p className="text-xl font-bold text-foreground">${(metrics.totalRevenue / 100).toFixed(2)}</p></div>
          <div className="card p-4"><p className="text-xs text-foreground/50">Orders</p><p className="text-xl font-bold text-foreground">{metrics.orderCount}</p></div>
          <div className="card p-4"><p className="text-xs text-foreground/50">Avg Order Value</p><p className="text-xl font-bold text-foreground">${(metrics.averageOrderValue / 100).toFixed(2)}</p></div>
        </div>
      )}
      <button onClick={downloadCSV} className="btn-primary px-4 py-2 text-sm">Download Orders CSV</button>
    </div>
  );
}