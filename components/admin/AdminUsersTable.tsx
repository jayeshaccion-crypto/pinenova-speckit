"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AdminSkeleton } from "./AdminSkeleton";

export function AdminUsersTable({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response | null> }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const params = search ? `?search=${encodeURIComponent(search)}` : "";
        const res = await api(`/api/admin/users${params}`);
        if (!res) return;
        const data = await res.json();
        setUsers(data.data?.data || []);
      } catch { showToast("Failed to load users", "error"); } finally { setLoading(false); }
    }
    fetchUsers();
  }, [api, search, showToast]);

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "ADMIN" ? "CUSTOMER" : "ADMIN";
    const res = await api("/api/admin/users", {
      method: "PATCH", body: JSON.stringify({ userId, role: newRole }),
    });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); showToast(d.error?.message || "Failed", "error"); return; }
    showToast(`Role changed to ${newRole}`, "success");
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  }

  async function toggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const res = await api("/api/admin/users", {
      method: "PATCH", body: JSON.stringify({ userId, status: newStatus }),
    });
    if (!res) return;
    if (!res.ok) { const d = await res.json(); showToast(d.error?.message || "Failed", "error"); return; }
    showToast(`User ${newStatus.toLowerCase()}`, "success");
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: newStatus } : u));
  }

  if (loading) return <AdminSkeleton />;

  return (
    <div>
      <div className="mb-4">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..." className="input-field w-64 text-sm" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-primary/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-primary/10 bg-primary/5">
            <tr><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Email</th><th className="p-3 font-medium">Role</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">2FA</th><th className="p-3 font-medium">Joined</th><th className="p-3 font-medium">Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-primary/5 last:border-0">
                <td className="p-3 text-foreground">{u.firstName} {u.lastName}</td>
                <td className="p-3 text-foreground/50">{u.email}</td>
                <td className="p-3"><span className={`text-xs ${u.role === "ADMIN" ? "badge-blue" : "badge-gray"}`}>{u.role}</span></td>
                <td className="p-3"><span className={`text-xs ${u.status === "ACTIVE" ? "text-green-600" : "text-red-600"}`}>{u.status}</span></td>
                <td className="p-3 text-foreground/50">{u.totpEnabled ? "Yes" : "No"}</td>
                <td className="p-3 text-foreground/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleRole(u.id, u.role)} className="text-xs text-primary hover:underline">
                      {u.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                    </button>
                    <button onClick={() => toggleStatus(u.id, u.status)} className={`text-xs hover:underline ${u.status === "ACTIVE" ? "text-red-500" : "text-green-600"}`}>
                      {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
