"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard";

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

// --- Data ---

const SECTIONS: NavSection[] = [
  {
    id: "principal",
    title: "Principal",
    icon: "space_dashboard",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: "dashboard", exact: true },
      { label: "Explorer", href: "/dashboard/explorer", icon: "explore" },
      { label: "Mes Services", href: "/dashboard/services", icon: "work" },
      { label: "Créer un service", href: "/dashboard/services/creer", icon: "add_circle" },
      { label: "SEO Services", href: "/dashboard/services/seo", icon: "search_check" },
      { label: "Boost", href: "/dashboard/boost", icon: "rocket_launch" },
      { label: "Commandes", href: "/dashboard/commandes", icon: "shopping_cart" },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    icon: "forum",
    items: [
      { label: "Messagerie", href: "/dashboard/messages", icon: "chat_bubble" },
      { label: "Notifications", href: "/dashboard/notifications", icon: "notifications" },
    ],
  },
  {
    id: "opportunites",
    title: "Opportunités",
    icon: "trending_up",
    items: [
      { label: "Candidatures", href: "/dashboard/candidatures", icon: "description" },
      { label: "Offres", href: "/dashboard/offres", icon: "local_offer" },
      { label: "Propositions", href: "/dashboard/propositions", icon: "send" },
    ],
  },
  {
    id: "finances",
    title: "Finances",
    icon: "account_balance",
    items: [
      { label: "Finances", href: "/dashboard/finances", icon: "payments" },
      { label: "Factures", href: "/dashboard/factures", icon: "receipt_long" },
      { label: "Paiements", href: "/dashboard/paiements", icon: "account_balance_wallet" },
      { label: "Escrow", href: "/dashboard/escrow", icon: "lock" },
      { label: "Wallet Web3", href: "/dashboard/portefeuille-web3", icon: "currency_bitcoin" },
    ],
  },
  {
    id: "profil-stats",
    title: "Profil & Stats",
    icon: "person",
    items: [
      { label: "Mon Profil", href: "/dashboard/profil", icon: "person" },
      { label: "Portfolio", href: "/dashboard/portfolio", icon: "folder_open" },
      { label: "Avis reçus", href: "/dashboard/avis", icon: "star" },
      { label: "Disponibilité", href: "/dashboard/disponibilite", icon: "event_available" },
      { label: "Statistiques", href: "/dashboard/statistiques", icon: "bar_chart" },
    ],
  },
  {
    id: "outils",
    title: "Outils",
    icon: "build",
    items: [
      { label: "Certifications", href: "/dashboard/certifications", icon: "verified" },
      { label: "Productivité", href: "/dashboard/productivite", icon: "timer" },
      { label: "Sécurité", href: "/dashboard/securite", icon: "shield" },
      { label: "Automatisation", href: "/dashboard/automatisation", icon: "smart_toy" },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Favoris", href: "/dashboard/favoris", icon: "favorite" },
  { label: "Affiliation", href: "/dashboard/affiliation", icon: "group_add" },
  { label: "Litiges", href: "/dashboard/litiges", icon: "gavel" },
  { label: "Abonnement", href: "/dashboard/abonnement", icon: "workspace_premium" },
  { label: "Paramètres", href: "/dashboard/parametres", icon: "settings" },
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

// --- Components ---

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const isActive = useIsActive();
  const unreadCount = useDashboardStore((s) => s.unreadCount);

  // Augment nav items with dynamic badges
  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.href === "/dashboard/notifications" ? { ...item, badge: unreadCount } : item
    ),
  }));

  // All sections start expanded
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SECTIONS.map((s) => [s.id, true]))
  );

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside
      className={cn(
        "flex-shrink-0 bg-background-dark border-r border-border-dark flex flex-col h-screen overflow-hidden transition-all duration-300",
        collapsed ? "w-[72px]" : "w-72"
      )}
    >
      {/* Logo + Toggle */}
      <div
        className={cn(
          "flex items-center flex-shrink-0",
          collapsed ? "p-4 justify-center" : "p-6 gap-3"
        )}
      >
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary">rocket_launch</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-none text-white">FreelanceHigh</h1>
            <p className="text-xs text-primary/60">Espace Freelance</p>
          </div>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
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
          href="/feed"
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

        {/* Collapsible sections */}
        {sections.map((section) => {
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
            />
          ))}
        </div>
      </nav>

      {/* Upgrade card — hidden when collapsed */}
      {!collapsed && (
        <div className="p-4 mt-auto flex-shrink-0">
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
              Passer à l&apos;offre Premium
            </p>
            <p className="text-xs text-slate-400 mb-3">
              Accédez à plus de clients et boostez vos revenus.
            </p>
            <Link
              href="/dashboard/abonnement"
              className="block w-full text-center bg-primary text-background-dark text-xs font-bold py-2 rounded-lg hover:brightness-110 transition-colors"
            >
              Mettre à jour
            </Link>
          </div>
        </div>
      )}

      {/* User */}
      <div
        className={cn(
          "border-t border-border-dark flex items-center flex-shrink-0",
          collapsed ? "p-3 justify-center" : "p-4 gap-3"
        )}
      >
        <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
          LG
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Lissanon Gildas</p>
              <p className="text-xs text-slate-400 truncate">Développeur Fullstack</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Link href="/dashboard/parametres" className="text-slate-400 hover:text-primary transition-colors p-1 rounded-lg hover:bg-white/5" title="Paramètres">
                <span className="material-symbols-outlined text-lg">settings</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/connexion" })}
                className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10"
                title="Se déconnecter"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// --- NavLink sub-component ---

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const badge = item.badge;
  return (
    <Link
      href={item.href}
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
      {badge != null && badge > 0 && (
        collapsed ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white px-0.5">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : (
          <span className="ml-auto min-w-[20px] h-[20px] rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary px-1">
            {badge > 99 ? "99+" : badge}
          </span>
        )
      )}
    </Link>
  );
}

// --- Mobile menu button ---

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
    >
      <span className="material-symbols-outlined">menu</span>
    </button>
  );
}
