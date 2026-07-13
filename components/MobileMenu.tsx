"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: { firstName: string; lastName: string; email: string; role: string } | null;
  onLogout: () => Promise<void>;
  cartCount: number;
}

export function MobileMenu({ isOpen, onClose, user, onLogout, cartCount }: MobileMenuProps) {
  const router = useRouter();
  const { logout } = useAuth();

  if (!isOpen) return null;

  const handleLogout = async () => {
    await onLogout();
    await logout();
    router.push("/");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl animate-slide-in">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <span className="text-lg font-bold tracking-tight text-foreground">PineNova</span>
          <button
            type="button"
            className="p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-primary/5 transition-colors"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="px-4 py-4 space-y-2" aria-label="Main navigation">
          <Link
            href="/products"
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground/70 hover:text-foreground hover:bg-primary/5"
            onClick={onClose}
          >
            Products
          </Link>
          <Link
            href="/blog"
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground/70 hover:text-foreground hover:bg-primary/5"
            onClick={onClose}
          >
            Blog
          </Link>
          <Link
            href="/cart"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium text-foreground/70 hover:text-foreground hover:bg-primary/5"
            onClick={onClose}
          >
            Cart
            {cartCount > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="border-t border-gray-100 px-4 py-4 space-y-3">
          {!user ? (
            <div className="space-y-2">
              <Link
                href="/account/auth/login"
                className="block w-full text-center px-4 py-2.5 rounded-lg text-base font-medium text-foreground hover:bg-primary/5"
                onClick={onClose}
              >
                Sign In
              </Link>
              <Link
                href="/account/auth/register"
                className="block w-full text-center btn-primary"
                onClick={onClose}
              >
                Create Account
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                <p className="text-foreground/50 truncate">{user.email}</p>
              </div>
              <Link
                href="/account"
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground/70 hover:text-foreground hover:bg-primary/5"
                onClick={onClose}
              >
                My Account
              </Link>
              <Link
                href="/account/orders"
                className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground/70 hover:text-foreground hover:bg-primary/5"
                onClick={onClose}
              >
                Orders
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="block px-3 py-2.5 rounded-lg text-base font-medium text-primary hover:text-primary/80 hover:bg-primary/5"
                  onClick={onClose}
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}