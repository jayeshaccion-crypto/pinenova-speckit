import type { Metadata } from "next";
import "@/styles/globals.css";

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
        <header className="border-b border-primary/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <a href="/" className="text-lg font-bold tracking-tight text-foreground">PineNova</a>
            <nav className="flex items-center gap-6 text-sm">
              <a href="/products" className="text-foreground/60 hover:text-foreground">Products</a>
              <a href="/cart" className="text-foreground/60 hover:text-foreground">Cart</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-primary/10">
          <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-foreground/40 sm:px-6 lg:px-8">
            &copy; {new Date().getFullYear()} PineNova. All rights reserved. Crafted with care from sustainable materials.
          </div>
        </footer>
      </body>
    </html>
  );
}
