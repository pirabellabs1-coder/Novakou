"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useCurrencyStore, CURRENCIES, type Currency } from "@/store/currency";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/formations/explorer", labelKey: "explore" },
  { href: "/formations/categories", labelKey: "categories" },
  { href: "/formations/produits", labelKey: "digital_products" },
  { href: "/formations/inscription?role=instructeur", labelKey: "become_instructor" },
] as const;

export function FormationsHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currency, setCurrency } = useCurrencyStore();
  const t = useTranslations("formations_nav");
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/formations" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-3xl font-bold">school</span>
          <div className="flex flex-col">
            <h2 className="text-xl font-extrabold tracking-tight dark:text-slate-100 leading-tight">
              FreelanceHigh
            </h2>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest -mt-0.5">
              Formations
            </span>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap",
                isActive(link.href)
                  ? "text-primary bg-primary/5"
                  : "text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/5"
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="flex items-center gap-6">
          {/* Theme toggle */}
          <ThemeToggle className="hidden lg:block" />

          {/* Locale switcher */}
          <LocaleSwitcher className="hidden lg:flex" />

          {/* Currency selector */}
          <div className="relative group hidden lg:block">
            <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-primary transition-all">
              <span className="material-symbols-outlined text-sm">payments</span>
              {currency} ({CURRENCIES.find((c) => c.code === currency)?.symbol})
              <span className="material-symbols-outlined text-xs">expand_more</span>
            </button>
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code as Currency)}
                  className={cn(
                    "block w-full text-left px-3 py-2 text-xs font-bold hover:bg-primary/10 rounded-lg transition-colors",
                    currency === c.code && "text-primary"
                  )}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>

          {/* Auth / User buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {session?.user ? (
              <>
                {userRole === "admin" && (
                  <Link
                    href="/formations/admin"
                    className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                    Admin
                  </Link>
                )}
                <Link
                  href="/formations/mes-formations"
                  className="text-sm font-bold hover:text-primary transition-colors px-2 py-2"
                >
                  {t("my_courses")}
                </Link>
                <Link
                  href="/formations/panier"
                  className="relative p-2 text-slate-600 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">shopping_cart</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/formations/connexion"
                  className="text-sm font-bold hover:text-primary transition-colors px-2 py-2"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/formations/inscription"
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-2.5 text-sm font-bold shadow-lg shadow-primary/20 transition-all"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-primary/20 mt-4 pt-4 pb-4 px-4 space-y-4">
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 text-sm font-semibold hover:bg-primary/5 rounded-lg transition-colors",
                  isActive(link.href) ? "text-primary bg-primary/5" : "hover:text-primary"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          {/* Theme + Locale mobile */}
          <div className="pt-2 border-t border-primary/20">
            <div className="flex items-center justify-between px-3 mb-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">{t("language")}</p>
                <LocaleSwitcher />
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Currency selector mobile */}
          <div className="pt-2 border-t border-primary/20">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 px-3">{t("currency")}</p>
            <div className="flex flex-wrap gap-2 px-3">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code as Currency)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors",
                    currency === c.code
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-slate-200 dark:border-slate-700 hover:border-primary"
                  )}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-primary/20">
            {session?.user ? (
              <>
                {userRole === "admin" && (
                  <Link href="/formations/admin" className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 rounded-lg px-6 py-2.5 transition-all" onClick={() => setMobileOpen(false)}>
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                    Admin Formations
                  </Link>
                )}
                <Link href="/formations/mes-formations" className="block text-center text-sm font-bold hover:text-primary py-2" onClick={() => setMobileOpen(false)}>
                  {t("my_courses")}
                </Link>
              </>
            ) : (
              <>
                <Link href="/formations/connexion" className="block text-center text-sm font-bold hover:text-primary py-2" onClick={() => setMobileOpen(false)}>
                  {t("login")}
                </Link>
                <Link href="/formations/inscription" className="block text-center bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-2.5 text-sm font-bold transition-all" onClick={() => setMobileOpen(false)}>
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
