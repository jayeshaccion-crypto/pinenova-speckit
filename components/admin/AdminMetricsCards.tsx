"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AdminMetricsSkeleton } from "./AdminMetricsSkeleton";

export function AdminMetricsCards({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await api("/api/admin/metrics");
        if (!res) return;
        const data = await res.json();
        setMetrics(data);
      } catch { showToast("Failed to load metrics", "error"); } finally { setLoading(false); }
    }
    fetchMetrics();
  }, [api, showToast]);

  async function downloadCSV() {
    try {
      const res = await api("/api/admin/metrics?format=csv");
      if (!res) return;
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "orders-export.csv";
      a.click();
      showToast("CSV download started", "info");
    } catch { showToast("Failed to download CSV", "error"); }
  }

  if (loading) return <AdminMetricsSkeleton />;

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
