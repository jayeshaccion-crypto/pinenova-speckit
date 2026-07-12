import type { Metadata } from "next";
import { AdminPage } from "@/components/AdminPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | PineNova",
  robots: { index: false, follow: false },
};

export default function AdminDashboard() {
  return <AdminPage />;
}
