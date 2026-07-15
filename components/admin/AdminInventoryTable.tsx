"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AdminSkeleton } from "./AdminSkeleton";

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

export function AdminInventoryTable({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [products, setProducts] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await api("/api/admin/inventory");
        if (!res) return;
        const data = await res.json();
        setProducts(data.data || []);
        setAuditLog(data.auditLog || []);
      } catch { showToast("Failed to load inventory", "error"); } finally { setLoading(false); }
    }
    fetchInventory();
  }, [api, showToast]);

  async function adjustStock(productId: string, newStock: number, reason: string) {
    const res = await api("/api/admin/inventory", {
      method: "POST", body: JSON.stringify({ productId, newStock, reason }),
    });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); showToast(d.error?.message || "Adjustment failed", "error"); return; }
    showToast("Stock updated", "success");
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, stock: newStock } : p));
  }

  if (loading) return <AdminSkeleton />;

  return (
    <div>
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
