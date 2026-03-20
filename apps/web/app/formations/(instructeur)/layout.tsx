"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface NavSubItem {
  href: string;
  icon: string;
  labelKey: string;
}

interface NavLink {
  href: string;
  icon: string;
  labelKey: string;
  subItems?: NavSubItem[];
}

// ── Navigation config ────────────────────────────────────────────────────────

const INSTRUCTEUR_LINKS: NavLink[] = [
  { href: "/formations/instructeur/dashboard", icon: "dashboard", labelKey: "dashboard" },
  { href: "/formations/instructeur/mes-formations", icon: "library_books", labelKey: "my_courses" },
  {
    href: "/formations/instructeur/produits",
    icon: "inventory_2",
    labelKey: "digital_products",
    subItems: [
      { href: "/formations/instructeur/produits/dashboard", icon: "dashboard", labelKey: "sub_dashboard" },
      { href: "/formations/instructeur/produits/creer", icon: "add_circle", labelKey: "sub_create_product" },
    ],
  },
  { href: "/formations/instructeur/creer", icon: "add_circle", labelKey: "create_course" },
  { href: "/formations/instructeur/apprenants", icon: "groups", labelKey: "students" },
  { href: "/formations/instructeur/revenus", icon: "account_balance_wallet", labelKey: "revenue" },
  { href: "/formations/instructeur/avis", icon: "rate_review", labelKey: "reviews" },
  { href: "/formations/instructeur/statistiques", icon: "analytics", labelKey: "statistics" },
  { href: "/formations/instructeur/tunnel-de-vente", icon: "filter_alt", labelKey: "sales_funnel" },
  {
    href: "/formations/instructeur/marketing",
    icon: "campaign",
    labelKey: "marketing",
    subItems: [
      { href: "/formations/instructeur/marketing/affilies", icon: "group_add", labelKey: "sub_affiliates" },
      { href: "/formations/instructeur/marketing/reductions", icon: "sell", labelKey: "sub_discounts" },
      { href: "/formations/instructeur/marketing/flash", icon: "bolt", labelKey: "sub_flash" },
      { href: "/formations/instructeur/marketing/emails", icon: "forward_to_inbox", labelKey: "sub_emails" },
      { href: "/formations/instructeur/marketing/funnels", icon: "filter_alt", labelKey: "sub_funnels" },
      { href: "/formations/instructeur/marketing/popups", icon: "web_asset", labelKey: "sub_popups" },
      { href: "/formations/instructeur/marketing/campagnes", icon: "ads_click", labelKey: "sub_campaigns" },
      { href: "/formations/instructeur/marketing/analytics", icon: "monitoring", labelKey: "sub_analytics" },
      { href: "/formations/instructeur/marketing/pixels", icon: "code", labelKey: "sub_pixels" },
    ],
  },
  {
    href: "/formations/instructeur/promotions",
    icon: "local_offer",
    labelKey: "promotions",
    subItems: [
      { href: "/formations/instructeur/promotions/creer", icon: "add_circle", labelKey: "sub_create_promotion" },
    ],
  },
  { href: "/formations/instructeur/parametres", icon: "settings", labelKey: "settings" },
];

// ── Layout Component ─────────────────────────────────────────────────────────

export default function InstructeurLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const pathname = usePathname();
  const t = useTranslations("formations_nav");

  function isActive(href: string) {
    if (href === "/formations/instructeur/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  function isExactActive(href: string) {
    return pathname === href;
  }

  function toggleSection(href: string) {
    setExpandedSections((prev) =>
      prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href],
    );
  }

  // Auto-expand sections when a sub-route is active
  function isSectionExpanded(href: string) {
    return expandedSections.includes(href) || pathname.startsWith(href + "/");
  }

  // Helper function to detect UUIDs and long alphanumeric IDs
  function isUUID(s: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) || (s.length > 20 && /^[a-z0-9]+$/i.test(s));
  }

  // Breadcrumb
  const rawSegments = pathname
    .replace("/formations/instructeur/", "")
    .replace("/formations/instructeur", "")
    .split("/")
    .filter(Boolean);

  // ── Desktop sidebar nav link renderer ──

  function renderDesktopLink(link: NavLink) {
    const active = isActive(link.href);
    const hasSubItems = link.subItems && link.subItems.length > 0;
    const isExpanded = hasSubItems && isSectionExpanded(link.href);

    return (
      <div key={link.href}>
        {hasSubItems && !collapsed ? (
          // Expandable link
          <>
            <button
              onClick={() => toggleSection(link.href)}
              className={cn(
                "flex items-center rounded-xl text-sm font-semibold transition-all w-full",
                "gap-3 px-3 py-2.5",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5 hover:text-primary",
              )}
            >
              <span className="material-symbols-outlined text-xl flex-shrink-0">{link.icon}</span>
              <span className="flex-1 text-left">{t(link.labelKey)}</span>
              <span
                className={cn(
                  "material-symbols-outlined text-sm transition-transform duration-200",
                  isExpanded && "rotate-180",
                )}
              >
                expand_more
              </span>
            </button>

            {/* Sub items */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="ml-5 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5 py-1">
                {/* Hub link */}
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all",
                    isExactActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5 hover:text-primary",
                  )}
                >
                  <span className="material-symbols-outlined text-lg flex-shrink-0">hub</span>
                  {t("sub_overview")}
                </Link>
                {link.subItems!.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all",
                      isActive(sub.href)
                        ? "bg-primary/10 text-primary"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5 hover:text-primary",
                    )}
                  >
                    <span className="material-symbols-outlined text-lg flex-shrink-0">{sub.icon}</span>
                    {t(sub.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Simple link (or collapsed state for expandable)
          <Link
            href={link.href}
            title={collapsed ? t(link.labelKey) : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-semibold transition-all",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
              active
                ? "bg-primary/10 text-primary"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5 hover:text-primary",
            )}
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">{link.icon}</span>
            {!collapsed && t(link.labelKey)}
          </Link>
        )}
      </div>
    );
  }

  // ── Mobile sidebar nav link renderer ──

  function renderMobileLink(link: NavLink) {
    const active = isActive(link.href);
    const hasSubItems = link.subItems && link.subItems.length > 0;
    const isExpanded = hasSubItems && isSectionExpanded(link.href);

    return (
      <div key={link.href}>
        {hasSubItems ? (
          <>
            <button
              onClick={() => toggleSection(link.href)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all w-full",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5",
              )}
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              <span className="flex-1 text-left">{t(link.labelKey)}</span>
              <span
                className={cn(
                  "material-symbols-outlined text-sm transition-transform duration-200",
                  isExpanded && "rotate-180",
                )}
              >
                expand_more
              </span>
            </button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="ml-5 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5 py-1">
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all",
                    isExactActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5",
                  )}
                >
                  <span className="material-symbols-outlined text-lg">hub</span>
                  {t("sub_overview")}
                </Link>
                {link.subItems!.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all",
                      isActive(sub.href)
                        ? "bg-primary/10 text-primary"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5",
                    )}
                  >
                    <span className="material-symbols-outlined text-lg">{sub.icon}</span>
                    {t(sub.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          <Link
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
              active
                ? "bg-primary/10 text-primary"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5",
            )}
          >
            <span className="material-symbols-outlined text-xl">{link.icon}</span>
            {t(link.labelKey)}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-700 dark:border-border-dark bg-white dark:bg-slate-900 dark:bg-neutral-dark flex-shrink-0 transition-all duration-300 relative",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* User section */}
        <div className={cn("border-b border-slate-200 dark:border-slate-700 dark:border-border-dark", collapsed ? "p-4" : "p-6")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary">cast_for_education</span>
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-bold">Instructeur</p>
                <p className="text-xs text-slate-500">{t("instructor_dashboard")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 -right-3 z-10 w-6 h-6 bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
        >
          <span className="material-symbols-outlined text-sm">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>

        {/* Navigation */}
        <nav className={cn("flex-1 p-4 space-y-1 overflow-y-auto", collapsed && "px-2")}>
          {INSTRUCTEUR_LINKS.map(renderDesktopLink)}
        </nav>

        {/* Explore link + Logout */}
        <div className={cn("border-t border-slate-200 dark:border-slate-700 dark:border-border-dark space-y-1", collapsed ? "p-2" : "p-4")}>
          <Link
            href="/formations/explorer"
            title={collapsed ? t("explore") : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary transition-all",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
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
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
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
              <span className="font-bold text-sm">{t("instructor_dashboard")}</span>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {INSTRUCTEUR_LINKS.map(renderMobileLink)}
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
            <span className="material-symbols-outlined text-xs mx-1 flex-shrink-0">chevron_right</span>
            <Link href="/formations/instructeur/dashboard" className="hover:text-primary transition-colors flex-shrink-0">{t("breadcrumb_instructor")}</Link>
            {rawSegments.map((segment, i) => (
              <span key={i} className="flex items-center flex-shrink-0">
                <span className="material-symbols-outlined text-xs mx-1">chevron_right</span>
                <span className={`truncate max-w-[120px] sm:max-w-none ${i === rawSegments.length - 1 ? "font-semibold text-slate-900 dark:text-white dark:text-slate-100" : ""}`}>
                  {isUUID(segment) ? `#${segment.slice(0, 8)}...` : (segment || "").charAt(0).toUpperCase() + (segment || "").slice(1).replace(/-/g, " ")}
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
