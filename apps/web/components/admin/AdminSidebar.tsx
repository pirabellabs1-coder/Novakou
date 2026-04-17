"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { hasPermission, ADMIN_NAV_PERMISSIONS, ADMIN_ROLE_LABELS, type AdminRole, type AdminPermission } from "@/lib/admin-permissions";

// Read admin role from session JWT instead of hard-coding
function useAdminRole(): AdminRole {
  const { data: session } = useSession();
  return (session?.user?.adminRole as AdminRole) || "super_admin";
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "dashboard", exact: true },
  { label: "Utilisateurs", href: "/admin/utilisateurs", icon: "people" },
  { label: "KYC", href: "/admin/kyc", icon: "verified" },
  { label: "Services", href: "/admin/services", icon: "work" },
  { label: "Boosts", href: "/admin/boosts", icon: "rocket_launch" },
  { label: "Commandes", href: "/admin/commandes", icon: "shopping_cart" },
  { label: "Litiges", href: "/admin/litiges", icon: "gavel" },
  { label: "Finances", href: "/admin/finances", icon: "payments" },
  { label: "Comptabilité", href: "/admin/comptabilite", icon: "account_balance" },
  { label: "Plans", href: "/admin/plans", icon: "workspace_premium" },
  { label: "Formations", href: "/admin/dashboard", icon: "school" },
  { label: "Catégories", href: "/admin/categories", icon: "category" },
  { label: "Messages", href: "/admin/messages", icon: "chat" },
  { label: "Notifications", href: "/admin/notifications", icon: "notifications" },
  { label: "Analytics", href: "/admin/analytics", icon: "bar_chart" },
  { label: "Journal d'audit", href: "/admin/audit-log", icon: "history" },
  { label: "Equipe", href: "/admin/equipe", icon: "group" },
];

const BOTTOM_ITEMS = [
  { label: "Configuration", href: "/admin/configuration", icon: "settings" },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const adminRole = useAdminRole();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function canAccess(href: string): boolean {
    const requiredPermission = ADMIN_NAV_PERMISSIONS[href];
    if (!requiredPermission) return true;
    return hasPermission(adminRole, requiredPermission as AdminPermission);
  }

  const visibleNav = NAV_ITEMS.filter((item) => canAccess(item.href));
  const visibleBottom = BOTTOM_ITEMS.filter((item) => canAccess(item.href));

  return (
    <aside className={cn(
      "flex-shrink-0 bg-neutral-dark border-r border-border-dark flex flex-col h-screen transition-all duration-300",
      collapsed ? "w-[68px]" : "w-64"
    )}>
      {/* Header + toggle */}
      <div className="p-3 flex items-center justify-between flex-shrink-0">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-lg">admin_panel_settings</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-black text-white leading-none">Novakou</h1>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Administration</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-border-dark/50 transition-colors"
            title="Réduire le menu"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="px-2 pb-1">
          <button
            onClick={onToggle}
            className="w-full p-2 rounded-lg text-slate-400 hover:text-white hover:bg-border-dark/50 transition-colors flex items-center justify-center"
            title="Ouvrir le menu"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 py-2">
        {/* Accueil */}
        <Link
          href="/explorer"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-border-dark/50 transition-colors mb-1",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Accueil" : undefined}
        >
          <span className="material-symbols-outlined text-lg">home</span>
          {!collapsed && <span>Accueil</span>}
        </Link>
        <div className="border-b border-border-dark mb-2" />

        {visibleNav.map(({ label, href, icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                active ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-white hover:bg-border-dark/50",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <span className="material-symbols-outlined text-lg">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-2 border-t border-border-dark">
        {visibleBottom.map(({ label, href, icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              isActive(href) ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-white hover:bg-border-dark/50",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? label : undefined}
          >
            <span className="material-symbols-outlined text-lg">{icon}</span>
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </div>

      {/* User section */}
      <div className={cn("p-3 border-t border-border-dark flex-shrink-0", collapsed && "px-2")}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">AP</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Admin Principal</p>
                <p className="text-[10px] text-primary font-semibold">{ADMIN_ROLE_LABELS[adminRole]}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/connexion" })}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 border border-red-500/20 hover:border-red-400/40 transition-all"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Se déconnecter
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">AP</div>
            <button
              onClick={() => signOut({ callbackUrl: "/connexion" })}
              className="p-2 rounded-xl text-red-400 hover:bg-red-400/10 border border-red-500/20 hover:border-red-400/40 transition-all"
              title="Se déconnecter"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
