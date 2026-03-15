"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useAgencyStore } from "@/store/agency";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

// All navigation links — flat list, always visible, no collapsible sections
const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/agence", icon: "dashboard", exact: true },
  { label: "Équipe", href: "/agence/equipe", icon: "groups" },
  { label: "Services", href: "/agence/services", icon: "work" },
  { label: "Projets", href: "/agence/projets", icon: "assignment" },
  { label: "Commandes", href: "/agence/commandes", icon: "shopping_cart" },
  { label: "Clients", href: "/agence/clients", icon: "people" },
  { label: "Sous-traitance", href: "/agence/sous-traitance", icon: "handshake" },
  { label: "Messages", href: "/agence/messages", icon: "chat_bubble" },
  { label: "Finances", href: "/agence/finances", icon: "payments" },
  { label: "Factures", href: "/agence/factures", icon: "receipt_long" },
  { label: "Contrats", href: "/agence/contrats", icon: "handshake" },
  { label: "Ressources", href: "/agence/ressources", icon: "folder_shared" },
  { label: "Avis", href: "/agence/avis", icon: "reviews" },
  { label: "Statistiques", href: "/agence/analytics", icon: "bar_chart" },
  { label: "Boost", href: "/agence/services/boost", icon: "rocket_launch" },
  { label: "SEO", href: "/agence/services/seo", icon: "search" },
  { label: "Litiges", href: "/agence/litiges", icon: "gavel" },
  { label: "Aide", href: "/agence/aide", icon: "help" },
  { label: "Paramètres", href: "/agence/parametres", icon: "settings" },
];

interface AgenceSidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AgenceSidebar({ onClose, collapsed = false, onToggleCollapse }: AgenceSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { syncAll, stats } = useAgencyStore();

  // Sync data on mount
  useEffect(() => {
    syncAll();
  }, [syncAll]);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Get agency info from session or fallback
  const agencyName = session?.user?.name || "Mon Agence";
  const agencyPlan = "Agence"; // From subscription API

  return (
    <aside className={cn(
      "flex-shrink-0 bg-background-dark border-r border-border-dark flex flex-col h-screen transition-all duration-300",
      collapsed ? "w-[68px]" : "w-64"
    )}>
      {/* Logo + collapse toggle */}
      <div className={cn("flex items-center flex-shrink-0", collapsed ? "p-3 justify-center" : "p-5 gap-3")}>
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-xl">apartment</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white leading-none truncate">{agencyName}</h1>
            <p className="text-[11px] text-primary/60 mt-0.5">Espace Agence</p>
          </div>
        )}
        {onClose && !collapsed && (
          <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors",
              collapsed ? "w-9 h-9 mt-2" : "ml-auto w-7 h-7"
            )}
            title={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
          >
            <span className="material-symbols-outlined text-lg">
              {collapsed ? "menu" : "menu_open"}
            </span>
          </button>
        )}
      </div>

      {/* Accueil — retour au feed */}
      <div className={cn("pb-2 flex-shrink-0", collapsed ? "px-2" : "px-3")}>
        <Link
          href="/explorer"
          className={cn(
            "flex items-center rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors",
            collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
          )}
          onClick={onClose}
          title={collapsed ? "Accueil" : undefined}
        >
          <span className="material-symbols-outlined text-lg">home</span>
          {!collapsed && <span>Accueil</span>}
        </Link>
        <div className="border-b border-border-dark mt-2" />
      </div>

      {/* CTA Nouveau Service */}
      <div className={cn("pb-3 flex-shrink-0", collapsed ? "px-2" : "px-4")}>
        <Link
          href="/agence/services/creer"
          onClick={onClose}
          className={cn(
            "flex items-center bg-primary text-background-dark font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20",
            collapsed ? "justify-center w-full py-2.5 text-lg" : "justify-center gap-2 w-full text-sm py-2.5"
          )}
          title={collapsed ? "Nouveau Service" : undefined}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {!collapsed && "Nouveau Service"}
        </Link>
      </div>

      {/* Navigation — flat list, scrollable, all visible */}
      <nav className={cn("flex-1 overflow-y-auto space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {NAV_ITEMS.map(({ label, href, icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
                active
                  ? "bg-primary/10 text-primary border-r-2 border-primary"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Profile section — bottom */}
      <div className={cn("border-t border-border-dark flex-shrink-0", collapsed ? "p-2" : "p-4")}>
        <Link
          href="/agence/profil"
          onClick={onClose}
          className={cn("flex items-center group", collapsed ? "justify-center" : "gap-3")}
          title={collapsed ? agencyName : undefined}
        >
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">apartment</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                  {agencyName}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {agencyPlan}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-500 text-lg group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </>
          )}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/connexion" })}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors mt-1",
            collapsed ? "justify-center w-full py-2 px-0" : "gap-2 w-full px-3 py-2"
          )}
          title={collapsed ? "Se déconnecter" : undefined}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          {!collapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </aside>
  );
}
