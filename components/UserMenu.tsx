"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  user: { firstName: string; lastName: string; email: string; role: string };
  onLogout: () => Promise<void>;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    await onLogout();
    router.push("/");
  };

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full bg-primary/10 p-1.5 text-foreground hover:bg-primary/20 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {initials}
        </span>
        <svg className="h-4 w-4 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-background py-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-slide-in"
          role="menu"
          aria-orientation="vertical"
          aria-label="User menu"
        >
          <div className="px-4 py-3 border-b border-primary/10">
            <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-foreground/50 truncate">{user.email}</p>
            {user.role === "ADMIN" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-1">
                Admin
              </span>
            )}
          </div>

          <Link
            href="/account"
            className="flex items-center gap-3 px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-primary/5 transition-colors"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <svg className="h-5 w-5 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Account
          </Link>

          <Link
            href="/account/orders"
            className="flex items-center gap-3 px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-primary/5 transition-colors"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <svg className="h-5 w-5 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            My Orders
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-3 px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-primary/5 transition-colors"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <svg className="h-5 w-5 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Cart
          </Link>

          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-primary/5 transition-colors"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <svg className="h-5 w-5 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Dashboard
            </Link>
          )}

          <div className="border-t border-primary/10 my-1" />

          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
            role="menuitem"
            onClick={handleLogout}
          >
<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
</svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}