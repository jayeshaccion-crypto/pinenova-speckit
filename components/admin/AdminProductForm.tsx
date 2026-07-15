"use client";

import { useState } from "react";

export function AdminProductForm({ onSave, initial }: { onSave: (data: any) => void; initial?: any }) {
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
