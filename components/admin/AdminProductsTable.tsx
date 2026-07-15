"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import { AdminProductForm } from "./AdminProductForm";
import { AdminSkeleton } from "./AdminSkeleton";

export function AdminProductsTable({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/api/admin/products");
      if (!res) return;
      const data = await res.json();
      setProducts(data.data || []);
    } catch { showToast("Failed to load products", "error"); } finally { setLoading(false); }
  }, [api, showToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleCreate(form: any) {
    const res = await api("/api/admin/products", { method: "POST", body: JSON.stringify(form) });
    if (res?.ok) { setShowForm(false); fetchProducts(); showToast("Product created", "success"); }
    else showToast("Failed to create product", "error");
  }

  async function handleArchive(id: string) {
    const res = await api(`/api/admin/products?id=${id}`, { method: "DELETE" });
    if (res?.ok) { fetchProducts(); showToast("Product archived", "success"); }
    else showToast("Failed to archive product", "error");
  }

  async function handleImageUpload(productId: string, file: File) {
    setUploadingId(productId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);
    try {
      await fetch("/api/admin/products/images/upload", { method: "POST", body: formData, credentials: "include" });
      showToast("Image uploaded", "success");
    } catch { showToast("Failed to upload image", "error"); }
    setUploadingId(null);
    fetchProducts();
  }

  if (loading) return <AdminSkeleton />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-foreground/50">{products.length} products</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-1.5 text-sm">
          {showForm ? "Cancel" : "New Product"}
        </button>
      </div>
      {showForm && <AdminProductForm onSave={handleCreate} />}
      <div className="overflow-x-auto rounded-lg border border-primary/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-primary/10 bg-primary/5">
            <tr><th className="p-3 font-medium text-foreground">Image</th><th className="p-3 font-medium text-foreground">Name</th><th className="p-3 font-medium text-foreground">SKU</th><th className="p-3 font-medium text-foreground">Price</th><th className="p-3 font-medium text-foreground">Stock</th><th className="p-3 font-medium text-foreground">Published</th><th className="p-3 font-medium text-foreground">Actions</th></tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-b border-primary/5 last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="h-10 w-10 rounded object-cover border border-primary/10" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-primary/20 bg-primary/5">
                        <svg className="h-4 w-4 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <label className={`cursor-pointer text-xs text-primary hover:underline ${uploadingId === p.id ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingId === p.id ? "Uploading..." : "Upload"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(p.id, f); e.target.value = ""; }} />
                    </label>
                  </div>
                </td>
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
