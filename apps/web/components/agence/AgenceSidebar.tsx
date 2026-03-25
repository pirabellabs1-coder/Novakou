"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useAgencyStore } from "@/store/agency";

// --- Types ---

interface NavItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
  badge?: number;
}

interface NavSection {
  id: string;
  title: string;
  icon: string;
  items: NavItem[];
}

// --- Data — structured into collapsible sections ---

const SECTIONS: NavSection[] = [
  {
    id: "principal",
    title: "Principal",
    icon: "space_dashboard",
    items: [
      { label: "Tableau de bord", href: "/agence", icon: "dashboard", exact: true },
      { label: "Explorer", href: "/agence/explorer", icon: "explore" },
      { label: "Services", href: "/agence/services", icon: "work" },
      { label: "Projets", href: "/agence/projets", icon: "assignment" },
    ],
  },
  {
    id: "gestion",
    title: "Gestion",
    icon: "groups",
    items: [
      { label: "Équipe", href: "/agence/equipe", icon: "groups" },
      { label: "Commandes", href: "/agence/commandes", icon: "shopping_cart" },
      { label: "Clients", href: "/agence/clients", icon: "people" },
      { label: "Sous-traitance", href: "/agence/sous-traitance", icon: "handshake" },
      { label: "Candidatures", href: "/agence/candidatures", icon: "description" },
      { label: "Offres", href: "/agence/offres", icon: "local_offer" },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    icon: "forum",
    items: [
      { label: "Messages", href: "/agence/messages", icon: "chat_bubble" },
      { label: "Notifications", href: "/agence/notifications", icon: "notifications" },
    ],
  },
  {
    id: "finances",
    title: "Finances",
    icon: "account_balance",
    items: [
      { label: "Finances", href: "/agence/finances", icon: "payments" },
      { label: "Factures", href: "/agence/factures", icon: "receipt_long" },
      { label: "Contrats", href: "/agence/contrats", icon: "handshake" },
    ],
  },
  {
    id: "marketing",
    title: "Marketing & Stats",
    icon: "campaign",
    items: [
      { label: "Statistiques", href: "/agence/analytics", icon: "bar_chart" },
      { label: "Boost", href: "/agence/services/boost", icon: "rocket_launch" },
      { label: "SEO", href: "/agence/services/seo", icon: "search" },
      { label: "Portfolio", href: "/agence/portfolio", icon: "folder_open" },
      { label: "Ressources", href: "/agence/ressources", icon: "folder_shared" },
      { label: "Avis", href: "/agence/avis", icon: "reviews" },
    ],
  },
  {
    id: "outils",
    title: "Outils",
    icon: "build",
    items: [
      { label: "Vérification KYC", href: "/agence/kyc", icon: "verified_user" },
      { label: "Sécurité", href: "/agence/securite", icon: "shield" },
      { label: "Formations", href: "/formations", icon: "school" },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Favoris", href: "/agence/favoris", icon: "favorite" },
  { label: "Litiges", href: "/agence/litiges", icon: "gavel" },
  { label: "Abonnement", href: "/agence/abonnement", icon: "workspace_premium" },
  { label: "Aide", href: "/agence/aide", icon: "help" },
  { label: "Paramètres", href: "/agence/parametres", icon: "settings" },
];

// --- Helpers ---

function useIsActive() {
  const pathname = usePathname();
  return (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };
}

function sectionHasActive(
  items: NavItem[],
  isActive: (href: string, exact?: boolean) => boolean
): boolean {
  return items.some((item) => isActive(item.href, item.exact));
}

// --- Component ---

interface AgenceSidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AgenceSidebar({ onClose, collapsed = false, onToggleCollapse }: AgenceSidebarProps) {
  const { data: session } = useSession();
  const isActive = useIsActive();
  const { syncAll } = useAgencyStore();

  // Sync data on mount
  useEffect(() => {
    syncAll();
  }, [syncAll]);

  // All sections start expanded
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SECTIONS.map((s) => [s.id, true]))
  );

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const agencyName = session?.user?.name || "Mon Agence";
  const agencyPlan = "Agence";

  return (
    <aside
      className={cn(
        "flex-shrink-0 bg-background-dark border-r border-border-dark flex flex-col h-screen transition-all duration-300",
        collapsed ? "w-[72px]" : "w-72"
      )}
    >
      {/* Logo + Toggle */}
      <div
        className={cn(
          "flex items-center flex-shrink-0",
          collapsed ? "p-4 justify-center" : "p-5 gap-3"
        )}
      >
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary">apartment</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold leading-none text-white truncate">{agencyName}</h1>
            <p className="text-[11px] text-primary/60 mt-0.5">Espace Agence</p>
          </div>
        )}
        {onClose && !collapsed && (
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0",
              collapsed &&
                "absolute top-5 -right-3 z-10 w-6 h-6 bg-background-dark border border-border-dark rounded-full shadow-md"
            )}
            title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            <span className="material-symbols-outlined text-lg">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto",
          collapsed ? "px-2 space-y-1" : "px-3"
        )}
      >
        {/* Accueil — retour au feed */}
        <Link
          href="/explorer"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-xl font-semibold transition-colors mb-2",
            collapsed
              ? "w-10 h-10 justify-center text-slate-400 hover:text-white hover:bg-white/5"
              : "px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5"
          )}
          title="Accueil"
        >
          <span className="material-symbols-outlined text-lg flex-shrink-0">home</span>
          {!collapsed && <span>Accueil</span>}
        </Link>
        <div className={cn("border-b border-border-dark", collapsed ? "mb-1" : "mb-3")} />

        {/* CTA Nouveau Service */}
        <div className={cn("mb-3", collapsed ? "" : "px-0")}>
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

        {/* Collapsible sections */}
        {SECTIONS.map((section) => {
          const isOpen = openSections[section.id] ?? true;
          const hasActive = sectionHasActive(section.items, isActive);

          return (
            <div key={section.id} className={collapsed ? "" : "mb-1"}>
              {/* Section header — hidden when sidebar collapsed */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "flex items-center w-full gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                    hasActive && !isOpen
                      ? "text-primary"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <span className="flex-1 text-left">{section.title}</span>
                  <span
                    className={cn(
                      "material-symbols-outlined text-base transition-transform duration-200",
                      !isOpen && "-rotate-90"
                    )}
                  >
                    expand_more
                  </span>
                </button>
              )}

              {/* Section items */}
              {(collapsed || isOpen) && (
                <div className={cn(!collapsed && "space-y-0.5 pb-1")}>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isActive(item.href, item.exact)}
                      collapsed={collapsed}
                      onClose={onClose}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Separator */}
        <div
          className={cn(
            "border-t border-border-dark my-2",
            collapsed ? "mx-1" : "mx-3"
          )}
        />

        {/* Bottom nav items (not collapsible) */}
        <div className={cn(!collapsed && "space-y-0.5 pb-2")}>
          {BOTTOM_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href, item.exact)}
              collapsed={collapsed}
              onClose={onClose}
            />
          ))}
        </div>
      </nav>

      {/* Profile section — bottom */}
      <div
        className={cn(
          "border-t border-border-dark flex-shrink-0",
          collapsed ? "p-3" : "p-4"
        )}
      >
        <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-3")}>
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
            <span className="material-symbols-outlined text-lg">apartment</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <Link href="/agence/profil" className="text-sm font-semibold text-white truncate hover:text-primary transition-colors block">
                {agencyName}
              </Link>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {agencyPlan}
              </span>
            </div>
          )}
          <div className={cn("flex items-center flex-shrink-0", collapsed ? "gap-0" : "gap-1")}>
            <Link
              href="/agence/parametres"
              className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="Paramètres"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/connexion" })}
              className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
              title="Se déconnecter"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

// --- NavLink sub-component ---

function NavLink({
  item,
  active,
  collapsed,
  onClose,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClose?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-lg text-sm font-semibold transition-colors relative",
        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
        active
          ? "bg-primary/10 text-primary"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      )}
    >
      <span className="material-symbols-outlined text-xl flex-shrink-0">
        {item.icon}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {item.badge != null && item.badge > 0 && (
        collapsed ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white px-0.5">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        ) : (
          <span className="ml-auto min-w-[20px] h-[20px] rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary px-1">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )
      )}
    </Link>
  );
}
