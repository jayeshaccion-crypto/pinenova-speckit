import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSidebar } from "@/components/AccountSidebar";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your PineNova account, view orders, and update settings.",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row">
      <Suspense fallback={<div className="hidden md:block w-56 shrink-0" />}>
        <AccountSidebar />
      </Suspense>
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
