import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (pathname !== "/admin/login") {
    if (!token) {
      redirect("/admin/login?redirect=/admin");
    }

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") {
      redirect("/admin/login?redirect=/admin");
    }
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}