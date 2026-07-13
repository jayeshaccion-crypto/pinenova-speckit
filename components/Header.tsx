"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";
import { MiniCartDrawer } from "./MiniCartDrawer";

export function Header() {
  const { user, loading: authLoading, logout } = useAuth();
  const { count: cartCount, loading: cartLoading } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cartAriaLabel = cartLoading
    ? "Loading cart..."
    : cartCount > 0
      ? `Cart, ${cartCount} items`
      : "Cart, empty";

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground shrink-0" aria-label="PineNova Home">
          PineNova
        </Link>

        <div className="hidden md:block flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm shrink-0" aria-label="Main navigation">
          <Link href="/products" className="text-foreground/60 hover:text-foreground transition-colors">
            Products
          </Link>
          <Link href="/blog" className="text-foreground/60 hover:text-foreground transition-colors">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setCartOpen(true)}
            className="relative text-foreground/60 hover:text-foreground transition-colors p-2 rounded-lg hover:bg-primary/5"
            aria-label={cartAriaLabel}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {!authLoading && !user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/account/auth/login"
                className="text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/account/auth/register"
                className="btn-primary text-sm px-4 py-2"
              >
                Create Account
              </Link>
            </div>
          ) : !authLoading && user ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <div className="w-10 h-10" aria-hidden="true" />
          )}

          <button
            className="md:hidden p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-primary/5 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} user={user} onLogout={logout} cartCount={cartCount} />
      <MiniCartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}