"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  key: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Principal",
    key: "principal",
    items: [
      { label: "Tableau de bord", href: "/agence", icon: "dashboard", exact: true },
      { label: "Équipe", href: "/agence/equipe", icon: "groups" },
      { label: "Clients", href: "/agence/clients", icon: "people" },
      { label: "Explorer", href: "/agence/explorer", icon: "explore" },
    ],
  },
  {
    title: "Gestion",
    key: "gestion",
    items: [
      { label: "Projets", href: "/agence/projets", icon: "folder_open" },
      { label: "Services", href: "/agence/services", icon: "work" },
      { label: "Créer un service", href: "/agence/services/creer", icon: "add_circle" },
      { label: "Portfolio", href: "/agence/portfolio", icon: "photo_library" },
      { label: "Commandes", href: "/agence/commandes", icon: "shopping_cart" },
      { label: "SEO", href: "/agence/services/seo", icon: "search" },
      { label: "Boost", href: "/agence/services/boost", icon: "rocket_launch" },
    ],
  },
  {
    title: "Commercial",
    key: "commercial",
    items: [
      { label: "Candidatures", href: "/agence/candidatures", icon: "assignment_ind" },
      { label: "Offres", href: "/agence/offres", icon: "local_offer" },
      { label: "Sous-traitance", href: "/agence/sous-traitance", icon: "handshake" },
    ],
  },
  {
    title: "Communication",
    key: "communication",
    items: [
      { label: "Messages", href: "/agence/messages", icon: "chat_bubble" },
      { label: "Avis", href: "/agence/avis", icon: "reviews" },
    ],
  },
  {
    title: "Finances",
    key: "finances",
    items: [
      { label: "Finances", href: "/agence/finances", icon: "payments" },
      { label: "Abonnement", href: "/agence/abonnement", icon: "card_membership" },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Analytics", href: "/agence/analytics", icon: "bar_chart" },
  { label: "Ressources", href: "/agence/ressources", icon: "cloud" },
  { label: "Aide", href: "/agence/aide", icon: "help" },
  { label: "Paramètres", href: "/agence/parametres", icon: "settings" },
];

interface AgenceSidebarProps {
  onClose?: () => void;
}

export function AgenceSidebar({ onClose }: AgenceSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function toggleSection(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function isSectionActive(section: NavSection) {
    return section.items.some((item) => isActive(item.href, item.exact));
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-background-dark border-r border-border-dark flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl">apartment</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-none">TechCorp Agency</h1>
          <p className="text-[11px] text-primary/60 mt-0.5">Espace Agence</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Accueil — retour au feed */}
      <div className="px-3 pb-2">
        <Link
          href="/feed"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={onClose}
        >
          <span className="material-symbols-outlined text-lg">home</span>
          <span>Accueil</span>
        </Link>
        <div className="border-b border-border-dark mt-2" />
      </div>

      {/* CTA Nouveau Service */}
      <div className="px-4 pb-3 flex-shrink-0">
        <Link
          href="/agence/services"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full bg-primary text-background-dark text-sm font-bold py-2.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nouveau Service
        </Link>
      </div>

      {/* Collapsible Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 mt-1 space-y-1">
        {NAV_SECTIONS.map((section) => {
          const isCollapsed = collapsed[section.key] ?? false;
          const sectionActive = isSectionActive(section);

          return (
            <div key={section.key}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.key)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  sectionActive
                    ? "text-primary/80"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <span>{section.title}</span>
                <span
                  className={cn(
                    "material-symbols-outlined text-sm transition-transform duration-200",
                    isCollapsed ? "-rotate-90" : "rotate-0"
                  )}
                >
                  expand_more
                </span>
              </button>

              {/* Section items */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isCollapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
                )}
              >
                <div className="space-y-0.5 pb-1">
                  {section.items.map(({ label, href, icon, exact }) => {
                    const active = isActive(href, exact);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          active
                            ? "bg-primary/10 text-primary border-r-2 border-primary"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        )}
                      >
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom nav (non-collapsible) */}
      <div className="px-3 py-2 border-t border-border-dark flex-shrink-0 space-y-0.5">
        {BOTTOM_ITEMS.map(({ label, href, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary border-r-2 border-primary"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Profile section */}
      <div className="p-4 border-t border-border-dark flex-shrink-0">
        <Link
          href="/agence/profil"
          onClick={onClose}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
              TechCorp Agency
            </p>
            <p className="text-[11px] text-slate-500 truncate">Plan Agence</p>
          </div>
          <span className="material-symbols-outlined text-slate-500 text-lg group-hover:text-primary transition-colors">
            chevron_right
          </span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/connexion" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors mt-1"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}
