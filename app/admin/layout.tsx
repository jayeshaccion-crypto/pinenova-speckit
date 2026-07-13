import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/admin/login?redirect=/admin");
  }

  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") {
    redirect("/admin/login?redirect=/admin");
  }

  return <>{children}</>;
}