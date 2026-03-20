"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const APPRENANT_LINKS = [
  { href: "/formations/mes-formations", icon: "menu_book", labelKey: "my_courses" },
  { href: "/formations/mes-cohorts", icon: "groups", labelKey: "my_cohorts" },
  { href: "/formations/mes-produits", icon: "inventory_2", labelKey: "my_products" },
  { href: "/formations/certificats", icon: "workspace_premium", labelKey: "certificates" },
  { href: "/formations/mes-discussions", icon: "forum", labelKey: "my_discussions" },
  { href: "/formations/mes-avis", icon: "rate_review", labelKey: "my_reviews" },
  { href: "/formations/favoris", icon: "favorite", labelKey: "favorites" },
  { href: "/formations/mes-achats", icon: "receipt_long", labelKey: "my_purchases" },
  { href: "/formations/panier", icon: "shopping_cart", labelKey: "cart" },
  { href: "/formations/parametres", icon: "settings", labelKey: "settings" },
] as const;

export default function ApprenantLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("formations_nav");

  function isActive(href: string) {
    if (href === "/formations/mes-formations") {
      return pathname === "/formations/mes-formations" || pathname.startsWith("/formations/apprendre");
    }
    if (href === "/formations/mes-cohorts") {
      return pathname.startsWith("/formations/mes-cohorts");
    }
    return pathname.startsWith(href);
  }

  // Breadcrumb
  const breadcrumbSegments = pathname
    .replace("/formations/", "")
    .split("/")
    .filter(Boolean);

  return (
    <div className="flex min-h-0 flex-1">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-700 dark:border-border-dark bg-white dark:bg-slate-900 dark:bg-neutral-dark flex-shrink-0 transition-all duration-300 relative",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* User section */}
        <div className={cn("border-b border-slate-200 dark:border-slate-700 dark:border-border-dark", collapsed ? "p-4" : "p-6")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-bold">Apprenant</p>
                <p className="text-xs text-slate-500">{t("my_courses")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute top-5 -right-3 z-10 w-6 h-6 bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          )}
          title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
        >
          <span className="material-symbols-outlined text-sm">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>

        {/* Navigation */}
        <nav className={cn("flex-1 p-4 space-y-1", collapsed && "px-2")}>
          {APPRENANT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? t(link.labelKey) : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm font-semibold transition-all",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                isActive(link.href)
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5 hover:text-primary"
              )}
            >
              <span className="material-symbols-outlined text-xl flex-shrink-0">{link.icon}</span>
              {!collapsed && t(link.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Explore link + Logout */}
        <div className={cn("border-t border-slate-200 dark:border-slate-700 dark:border-border-dark space-y-1", collapsed ? "p-2" : "p-4")}>
          <Link
            href="/formations/explorer"
            title={collapsed ? t("explore") : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary transition-all",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
            )}
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">explore</span>
            {!collapsed && t("explore")}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/formations" })}
            title={collapsed ? t("logout") : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
            )}
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">logout</span>
            {!collapsed && t("logout")}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 w-72 max-w-[min(85vw,288px)] bg-white dark:bg-slate-900 dark:bg-neutral-dark border-r border-slate-200 dark:border-slate-700 dark:border-border-dark flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 dark:border-border-dark">
              <span className="font-bold text-sm">{t("my_courses")}</span>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {APPRENANT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5"
                  )}
                >
                  <span className="material-symbols-outlined text-xl">{link.icon}</span>
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 dark:border-border-dark">
              <button
                onClick={() => signOut({ callbackUrl: "/formations" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
                {t("logout")}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar with hamburger + breadcrumb */}
        <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200 dark:border-slate-700 dark:border-border-dark bg-white dark:bg-slate-900 dark:bg-neutral-dark">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center text-xs sm:text-sm text-slate-500 min-w-0 overflow-x-auto whitespace-nowrap">
            <Link href="/formations" className="hover:text-primary transition-colors flex-shrink-0">{t("breadcrumb_home")}</Link>
            {breadcrumbSegments.map((segment, i) => (
              <span key={i} className="flex items-center flex-shrink-0">
                <span className="material-symbols-outlined text-xs mx-1">chevron_right</span>
                <span className={`truncate max-w-[120px] sm:max-w-none ${i === breadcrumbSegments.length - 1 ? "font-semibold text-slate-900 dark:text-white dark:text-slate-100" : ""}`}>
                  {(segment || "").charAt(0).toUpperCase() + (segment || "").slice(1).replace(/-/g, " ")}
                </span>
              </span>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-800/50 dark:bg-background-dark min-h-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
