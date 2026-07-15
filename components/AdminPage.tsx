"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AdminProductsTable } from "./admin/AdminProductsTable";
import { AdminOrdersTable } from "./admin/AdminOrdersTable";
import { AdminInventoryTable } from "./admin/AdminInventoryTable";
import { AdminDiscountsTable } from "./admin/AdminDiscountsTable";
import { AdminMetricsCards } from "./admin/AdminMetricsCards";
import { AdminUsersTable } from "./admin/AdminUsersTable";
import { AdminBlogTable } from "./admin/AdminBlogTable";

const TAB_SECTIONS = ["products", "orders", "inventory", "discounts", "metrics", "users", "blog"] as const;

const TAB_LABELS: Record<string, string> = {
  products: "Products", orders: "Orders", inventory: "Inventory",
  discounts: "Discount Codes", metrics: "Dashboard", users: "Users", blog: "Blog Articles",
};

export function AdminPage() {
  const searchParams = useSearchParams();
  const tab = TAB_SECTIONS.includes((searchParams.get("tab") || "products") as any)
    ? (searchParams.get("tab") as typeof TAB_SECTIONS[number]) : "products";

  const api = useCallback(async (path: string, opts?: RequestInit): Promise<Response | null> => {
    const res = await fetch(path, { ...opts, credentials: "include", headers: { "Content-Type": "application/json", ...opts?.headers } });
    if (res.status === 401) { window.location.href = "/admin/login?redirect=/admin"; return null; }
    return res;
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{TAB_LABELS[tab] || "Admin"}</h1>
      </div>
      {tab === "products" && <AdminProductsTable api={api} />}
      {tab === "orders" && <AdminOrdersTable api={api} />}
      {tab === "inventory" && <AdminInventoryTable api={api} />}
      {tab === "discounts" && <AdminDiscountsTable api={api} />}
      {tab === "metrics" && <AdminMetricsCards api={api} />}
      {tab === "users" && <AdminUsersTable api={api} />}
      {tab === "blog" && <AdminBlogTable api={api} />}
    </div>
  );
}
