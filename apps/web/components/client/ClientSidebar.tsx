"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/store/client";
import { useMessagingStore } from "@/store/messaging";

interface NavSection {
  title: string;
  items: { label: string; href: string; icon: string; exact?: boolean; badgeKey?: string }[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Tableau de bord", href: "/client", icon: "dashboard", exact: true },
      { label: "Explorer", href: "/client/explorer", icon: "explore" },
      { label: "Recherche IA", href: "/client/recherche-ia", icon: "neurology" },
    ],
  },
  {
    title: "Projets & Commandes",
    items: [
      { label: "Mes Projets", href: "/client/projets", icon: "assignment" },
      { label: "Mes Commandes", href: "/client/commandes", icon: "shopping_bag", badgeKey: "orders" },
      { label: "Propositions", href: "/client/propositions", icon: "send" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/client/messages", icon: "chat", badgeKey: "messages" },
      { label: "Favoris", href: "/client/favoris", icon: "favorite" },
      { label: "Avis", href: "/client/avis", icon: "rate_review" },
    ],
  },
  {
    title: "Finances",
    items: [
      { label: "Paiements", href: "/client/paiements", icon: "receipt_long" },
      { label: "Factures", href: "/client/factures", icon: "description" },
      { label: "Litiges", href: "/client/litiges", icon: "gavel" },
    ],
  },
];

const BOTTOM_ITEMS = [
  { label: "Notifications", href: "/client/notifications", icon: "notifications", badgeKey: "notifications" as const },
  { label: "Aide", href: "/client/aide", icon: "help" },
  { label: "Profil", href: "/client/profil", icon: "person" },
  { label: "Paramètres", href: "/client/parametres", icon: "settings" },
];

interface ClientSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function ClientSidebar({ collapsed = false, onToggle, onClose }: ClientSidebarProps) {
  const pathname = usePathname();
  const [sectionCollapsed, setSectionCollapsed] = useState<Record<string, boolean>>({});

  // Badge counts from client and messaging stores
  const activeOrders = useClientStore((s) => s.activeOrdersCount());
  const unreadNotifications = useClientStore((s) => s.unreadNotificationsCount());
  const conversations = useMessagingStore((s) => s.conversations);
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const badgeCounts: Record<string, number> = {
    orders: activeOrders,
    notifications: unreadNotifications,
    messages: unreadMessages,
  };

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function isSectionActive(section: NavSection) {
    return section.items.some(item => isActive(item.href, item.exact));
  }

  function toggleSection(title: string) {
    setSectionCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <aside
      className={cn(
        "flex-shrink-0 bg-background-dark border-r border-border-dark flex flex-col h-screen transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo + Toggle */}
      <div className={cn("flex items-center flex-shrink-0", collapsed ? "p-4 justify-center" : "p-5 gap-3")}>
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-xl">bolt</span>
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold text-white leading-none">FreelanceHigh</h1>
            <p className="text-[11px] text-primary/60 mt-0.5">Espace Client</p>
          </div>
        )}
        {onToggle && !onClose && (
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0",
              collapsed
                ? "absolute top-5 -right-3 z-10 w-6 h-6 bg-background-dark border border-border-dark rounded-full shadow-md"
                : "ml-auto"
            )}
            title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            <span className="material-symbols-outlined text-lg">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Accueil — retour au feed */}
      <div className={cn("pb-2", collapsed ? "px-2" : "px-3")}>
        <Link
          href="/explorer"
          title={collapsed ? "Accueil" : undefined}
          className={cn(
            "flex items-center rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors",
            collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5 text-sm"
          )}
        >
          <span className="material-symbols-outlined text-lg">home</span>
          {!collapsed && <span>Accueil</span>}
        </Link>
      </div>

      {/* Collapsible Navigation Sections */}
      <nav className={cn("flex-1 overflow-y-auto mt-1 space-y-1", collapsed ? "px-2" : "px-3")}>
        {SECTIONS.map(section => {
          const isOpen = !sectionCollapsed[section.title];
          const sectionActive = isSectionActive(section);

          return (
            <div key={section.title}>
              {/* Section header — hidden when sidebar collapsed */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-slate-100 transition-colors"
                >
                  <span className={cn(sectionActive && !isOpen && "text-primary")}>{section.title}</span>
                  <span className={cn("material-symbols-outlined text-sm transition-transform", isOpen ? "rotate-0" : "-rotate-90")}>
                    expand_more
                  </span>
                </button>
              )}
              {(collapsed || isOpen) && (
                <div className={cn(!collapsed && "space-y-0.5 mb-2")}>
                  {section.items.map(({ label, href, icon, exact, badgeKey }) => {
                    const active = isActive(href, exact);
                    const badgeCount = badgeKey ? badgeCounts[badgeKey] || 0 : 0;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        title={collapsed ? label : undefined}
                        className={cn(
                          "flex items-center rounded-lg text-sm font-medium transition-all duration-200 relative",
                          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        )}
                      >
                        <span className="material-symbols-outlined text-lg flex-shrink-0">{icon}</span>
                        {!collapsed && <span className="flex-1">{label}</span>}
                        {badgeCount > 0 && (
                          collapsed ? (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </span>
                          ) : (
                            <span className="min-w-[20px] h-5 flex items-center justify-center text-[10px] bg-red-500 text-white px-1.5 rounded-full font-bold">
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </span>
                          )
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className={cn("py-2 border-t border-border-dark flex-shrink-0 space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {BOTTOM_ITEMS.map(({ label, href, icon, badgeKey }) => {
          const active = isActive(href);
          const badgeCount = badgeKey ? badgeCounts[badgeKey] || 0 : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-200 relative",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <span className="material-symbols-outlined text-lg flex-shrink-0">{icon}</span>
              {!collapsed && <span className="flex-1">{label}</span>}
              {badgeCount > 0 && (
                collapsed ? (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                ) : (
                  <span className="min-w-[20px] h-5 flex items-center justify-center text-[10px] bg-red-500 text-white px-1.5 rounded-full font-bold">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )
              )}
            </Link>
          );
        })}
      </div>

      {/* CTA Nouveau Projet — hidden when collapsed */}
      {!collapsed && (
        <div className="px-4 pb-2 flex-shrink-0">
          <Link
            href="/client/projets/nouveau"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full bg-primary text-background-dark text-sm font-bold py-3 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nouveau Projet
          </Link>
        </div>
      )}

      {/* Logout */}
      <div className={cn("pb-4 flex-shrink-0", collapsed ? "px-2" : "px-4")}>
        <button
          onClick={() => signOut({ callbackUrl: "/connexion" })}
          title={collapsed ? "Se déconnecter" : undefined}
          className={cn(
            "flex items-center justify-center gap-2 w-full border border-red-500/20 text-red-400 hover:bg-red-500/10 font-semibold rounded-xl transition-all",
            collapsed ? "py-2.5 text-xs" : "py-2.5 text-sm"
          )}
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          {!collapsed && "Se déconnecter"}
        </button>
      </div>
    </aside>
  );
}
