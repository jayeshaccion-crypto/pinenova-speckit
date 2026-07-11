import type { Metadata } from "next";

export const metadata: Metadata = {
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
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <a href="/" className="text-lg font-bold tracking-tight text-neutral-900">PineNova</a>
            <nav className="flex items-center gap-6 text-sm">
              <a href="/products" className="text-neutral-600 hover:text-neutral-900">Products</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-neutral-400 sm:px-6 lg:px-8">
            &copy; {new Date().getFullYear()} PineNova. All rights reserved. Crafted with care from sustainable materials.
          </div>
        </footer>
      </body>
    </html>
  );
}
