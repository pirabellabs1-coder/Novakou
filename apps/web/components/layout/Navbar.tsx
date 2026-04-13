"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useCurrencyStore, CURRENCIES, type Currency } from "@/store/currency";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const ROLE_DASHBOARDS: Record<string, { href: string; label: string; icon: string }> = {
  freelance: { href: "/dashboard", label: "Mon Dashboard", icon: "dashboard" },
  client: { href: "/client", label: "Espace Client", icon: "storefront" },
  agence: { href: "/agence", label: "Espace Agence", icon: "business" },
  admin: { href: "/admin", label: "Administration", icon: "admin_panel_settings" },
};

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { currency, setCurrency } = useCurrencyStore();
  const t = useTranslations("navbar");
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userRole = (session?.user as Record<string, unknown>)?.role as string || "freelance";
  const dashboardInfo = ROLE_DASHBOARDS[userRole] || ROLE_DASHBOARDS.freelance;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-primary flex-shrink-0">
          <span className="material-symbols-outlined text-2xl sm:text-3xl font-bold">public</span>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight dark:text-slate-100">FreelanceHigh</h2>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex flex-1 justify-center gap-8">
          <Link href="/explorer" className="text-sm font-semibold hover:text-primary transition-colors">{t("explorer")}</Link>
          {!isLoggedIn && (
            <Link href="/inscription" className="text-sm font-semibold hover:text-primary transition-colors">{t("devenir_freelance")}</Link>
          )}

          <Link href="/offres-projets" className="text-sm font-semibold hover:text-primary transition-colors">{t("projets")}</Link>
          <Link href="/tarifs" className="text-sm font-semibold hover:text-primary transition-colors">{t("tarifs")}</Link>
        </nav>

        {/* Actions desktop */}
        <div className="flex items-center gap-3 lg:gap-6">
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
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
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

          {/* Auth section — adapts to login state */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href={dashboardInfo.href}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-all">
                  <span className="material-symbols-outlined text-lg">{dashboardInfo.icon}</span>
                  {dashboardInfo.label}
                </Link>
                <div className="relative">
                  <button onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary text-xs font-bold">
                      {(session.user.name || session.user.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="material-symbols-outlined text-sm text-slate-400">expand_more</span>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 p-2"
                      onMouseLeave={() => setProfileOpen(false)}>
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                        <p className="text-sm font-bold truncate">{session.user.name || "Utilisateur"}</p>
                        <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                      </div>
                      <Link href={dashboardInfo.href} onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-primary/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg">{dashboardInfo.icon}</span>
                        {dashboardInfo.label}
                      </Link>
                      <Link href="/dashboard/parametres" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-primary/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg">settings</span>
                        Parametres
                      </Link>
                      <button onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Deconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/connexion"
                  className="text-sm font-bold hover:text-primary transition-colors px-2 py-2">
                  {t("connexion")}
                </Link>
                <Link href="/inscription"
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-2.5 text-sm font-bold shadow-lg shadow-primary/20 transition-all">
                  {t("inscription")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-primary/20 mt-3 pt-3 pb-4 space-y-3">
          <nav className="flex flex-col gap-1">
            <Link href="/explorer" className="px-3 py-2.5 text-sm font-semibold hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>{t("explorer")}</Link>
            {!isLoggedIn && (
              <Link href="/inscription" className="px-3 py-2.5 text-sm font-semibold hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>{t("devenir_freelance")}</Link>
            )}

            <Link href="/offres-projets" className="px-3 py-2.5 text-sm font-semibold hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>{t("projets")}</Link>
            <Link href="/tarifs" className="px-3 py-2.5 text-sm font-semibold hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>{t("tarifs")}</Link>
          </nav>

          {/* Theme + Locale mobile */}
          <div className="pt-3 border-t border-primary/20">
            <div className="flex items-center justify-between px-3 mb-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">{t("langue") ?? "Langue"}</p>
                <LocaleSwitcher />
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Currency selector mobile */}
          <div className="pt-3 border-t border-primary/20">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 px-3">{t("devise")}</p>
            <div className="flex flex-wrap gap-2 px-3">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setCurrency(c.code as Currency); setMobileOpen(false); }}
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

          <div className="flex flex-col gap-2 pt-3 border-t border-primary/20">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                    {(session.user.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{session.user.name || "Utilisateur"}</p>
                    <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                  </div>
                </div>
                <Link href={dashboardInfo.href}
                  className="flex items-center gap-2 px-3 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-bold"
                  onClick={() => setMobileOpen(false)}>
                  <span className="material-symbols-outlined text-lg">{dashboardInfo.icon}</span>
                  {dashboardInfo.label}
                </Link>
                <button onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                  className="flex items-center justify-center gap-2 text-sm font-bold text-red-500 py-2">
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Deconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/connexion" className="block text-center text-sm font-bold hover:text-primary py-2.5" onClick={() => setMobileOpen(false)}>{t("connexion")}</Link>
                <Link href="/inscription" className="block text-center bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-2.5 text-sm font-bold transition-all" onClick={() => setMobileOpen(false)}>{t("inscription")}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
