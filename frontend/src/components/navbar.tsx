"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { CartSummary } from "./cart-summary";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/#contacto", label: "Contacto" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount, openCart } = useCart();

  async function handleLogout() {
    await logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    toast.success("Sesión cerrada");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-black uppercase tracking-wide text-slate-900">
              Patagonia
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Sports
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={openCart}
            aria-label="Abrir carrito"
            className="relative rounded-full p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 py-1 pl-1 pr-2 transition hover:bg-slate-50"
                aria-label="Menú de usuario"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {user.email.charAt(0).toUpperCase()}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <p className="truncate px-3 py-2 text-xs text-slate-500">
                    {user.email}
                  </p>
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <UserIcon className="h-4 w-4" /> Mi perfil
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> Panel
                      admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 sm:px-4"
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Ingresar</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-full p-2.5 text-slate-600 transition hover:bg-slate-100 md:hidden"
            aria-label="Abrir menú"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
              >
                Panel admin
              </Link>
            )}
            {user && (
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Mi perfil
              </Link>
            )}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            ) : (
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-slate-900 px-3 py-2.5 text-center text-sm font-semibold text-white"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}

      </header>

      <CartSummary />
    </>
  );
}
