"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "dashboard", exact: true },
  { label: "Utilisateurs", href: "/admin/utilisateurs", icon: "people" },
  { label: "KYC", href: "/admin/kyc", icon: "verified" },
  { label: "Services", href: "/admin/services", icon: "work" },
  { label: "Commandes", href: "/admin/commandes", icon: "shopping_cart" },
  { label: "Litiges", href: "/admin/litiges", icon: "gavel" },
  { label: "Finances", href: "/admin/finances", icon: "payments" },
  { label: "Plans", href: "/admin/plans", icon: "workspace_premium" },
  { label: "Blog", href: "/admin/blog", icon: "article" },
  { label: "Catégories", href: "/admin/categories", icon: "category" },
  { label: "Messages", href: "/admin/messages", icon: "chat" },
  { label: "Notifications", href: "/admin/notifications", icon: "notifications" },
  { label: "Analytics", href: "/admin/analytics", icon: "bar_chart" },
  { label: "Journal d'audit", href: "/admin/audit-log", icon: "history" },
];

const BOTTOM_ITEMS = [
  { label: "Configuration", href: "/admin/configuration", icon: "settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-neutral-dark border-r border-border-dark flex flex-col h-screen overflow-hidden">
      <div className="p-5 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-lg">admin_panel_settings</span>
        </div>
        <div>
          <h1 className="text-sm font-black text-white leading-none">FreelanceHigh</h1>
          <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Administration</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 py-2">
        {/* Accueil — retour au feed */}
        <Link
          href="/feed"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-border-dark/50 transition-colors mb-1"
        >
          <span className="material-symbols-outlined text-lg">home</span>
          <span>Accueil</span>
        </Link>
        <div className="border-b border-border-dark mb-2" />

        {NAV_ITEMS.map(({ label, href, icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors", active ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-white hover:bg-border-dark/50")}>
              <span className="material-symbols-outlined text-lg">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-2 border-t border-border-dark">
        {BOTTOM_ITEMS.map(({ label, href, icon }) => (
          <Link key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors", isActive(href) ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-white hover:bg-border-dark/50")}>
            <span className="material-symbols-outlined text-lg">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-border-dark flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">AP</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">Admin Principal</p>
            <p className="text-[10px] text-primary font-semibold">Super Admin</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/connexion" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 border border-red-500/20 hover:border-red-400/40 transition-all"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
