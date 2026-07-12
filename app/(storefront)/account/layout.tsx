import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your PineNova account, view orders, and update settings.",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
