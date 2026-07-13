import type { Metadata } from "next";
import "@/styles/globals.css";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/AuthContext";
import { CartProvider } from "@/components/CartContext";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "PineNova — Vegan Leather Goods", template: "%s | PineNova" },
  description: "Sustainable, cruelty-free accessories crafted from pineapple fiber. Shop bags, wallets, belts, and footwear.",
  openGraph: {
    title: "PineNova — Vegan Leather Goods",
    description: "Sustainable, cruelty-free accessories crafted from pineapple fiber.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <footer className="border-t border-primary/10">
                <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-foreground/40 sm:px-6 lg:px-8">
                  &copy; {new Date().getFullYear()} PineNova. All rights reserved. Crafted with care from sustainable materials.
                </div>
              </footer>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}