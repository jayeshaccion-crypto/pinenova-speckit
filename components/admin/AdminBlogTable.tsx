"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import { AdminSkeleton } from "./AdminSkeleton";

function BlogForm({ onSave }: { onSave: (data: any) => void }) {
  const [form, setForm] = useState({ title: "", body: "", metaDescription: "", featuredImage: "", status: "DRAFT" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-primary/10 p-4 space-y-3">
      <div><label className="mb-1 block text-xs text-foreground/50">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field w-full text-sm" required /></div>
      <div><label className="mb-1 block text-xs text-foreground/50">Meta Description</label><input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} className="input-field w-full text-sm" /></div>
      <div><label className="mb-1 block text-xs text-foreground/50">Featured Image URL</label><input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} className="input-field w-full text-sm" /></div>
      <div><label className="mb-1 block text-xs text-foreground/50">Body (HTML/Markdown)</label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="input-field w-full text-sm" rows={6} required /></div>
      <div><label className="mb-1 block text-xs text-foreground/50">Status</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field text-sm">
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>
      <button type="submit" disabled={saving} className="btn-primary px-4 py-1.5 text-sm">{saving ? "Saving..." : "Create Article"}</button>
    </form>
  );
}

export function AdminBlogTable({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/api/blog?limit=50");
      if (!res) return;
      const data = await res.json();
      setArticles(data.data || []);
    } catch { showToast("Failed to load articles", "error"); } finally { setLoading(false); }
  }, [api, showToast]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  async function createArticle(form: any) {
    const res = await api("/api/blog", { method: "POST", body: JSON.stringify(form) });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); showToast(d.error?.message || "Failed", "error"); return; }
    setShowForm(false);
    showToast("Article created", "success");
    fetchArticles();
  }

  if (loading) return <AdminSkeleton />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-foreground/50">{articles.length} articles</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-1.5 text-sm">
          {showForm ? "Cancel" : "New Article"}
        </button>
      </div>
      {showForm && <BlogForm onSave={createArticle} />}
      <div className="overflow-x-auto rounded-lg border border-primary/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-primary/10 bg-primary/5">
            <tr><th className="p-3 font-medium">Title</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Published</th></tr>
          </thead>
          <tbody>
            {articles.map((a: any) => (
              <tr key={a.id} className="border-b border-primary/5 last:border-0">
                <td className="p-3 text-foreground">{a.title}</td>
                <td className="p-3"><span className={`text-xs ${a.status === "PUBLISHED" ? "text-green-600" : "badge-yellow"}`}>{a.status}</span></td>
                <td className="p-3 text-foreground/50">{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
