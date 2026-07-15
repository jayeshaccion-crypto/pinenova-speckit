"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AdminSkeleton } from "./AdminSkeleton";

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

export function AdminDiscountsTable({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchCodes() {
      try {
        const res = await api("/api/admin/discounts");
        if (!res) return;
        const data = await res.json();
        setCodes(data.data || []);
      } catch { showToast("Failed to load discount codes", "error"); } finally { setLoading(false); }
    }
    fetchCodes();
  }, [api, showToast]);

  async function createCode(form: any) {
    const res = await api("/api/admin/discounts", { method: "POST", body: JSON.stringify(form) });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); showToast(d.error?.message || "Failed", "error"); return; }
    setShowForm(false);
    showToast("Discount code created", "success");
    const created = await res.json();
    setCodes((prev) => [created.data || created, ...prev]);
  }

  async function deactivate(id: string) {
    await api(`/api/admin/discounts?id=${id}`, { method: "DELETE" });
    showToast("Discount code deactivated", "success");
    setCodes((prev) => prev.map((c) => c.id === id ? { ...c, isActive: false } : c));
  }

  if (loading) return <AdminSkeleton />;

  return (
    <div>
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
