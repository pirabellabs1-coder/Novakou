"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface NavSection {
  title: string;
  items: { label: string; href: string; icon: string; exact?: boolean; badge?: string }[];
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
      { label: "Mes Commandes", href: "/client/commandes", icon: "shopping_bag" },
      { label: "Propositions", href: "/client/propositions", icon: "send" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/client/messages", icon: "chat" },
      { label: "Favoris", href: "/client/favoris", icon: "favorite" },
      { label: "Avis", href: "/client/avis", icon: "rate_review" },
    ],
  },
  {
    title: "Finances",
    items: [
      { label: "Paiements", href: "/client/paiements", icon: "receipt_long" },
      { label: "Wallet Web3", href: "/client/portefeuille-web3", icon: "account_balance_wallet" },
      { label: "Litiges", href: "/client/litiges", icon: "gavel" },
    ],
  },
];

const BOTTOM_ITEMS = [
  { label: "Notifications", href: "/client/notifications", icon: "notifications" },
  { label: "Aide", href: "/client/aide", icon: "help" },
  { label: "Profil", href: "/client/profil", icon: "person" },
  { label: "Paramètres", href: "/client/parametres", icon: "settings" },
];

interface ClientSidebarProps {
  onClose?: () => void;
}

export function ClientSidebar({ onClose }: ClientSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function isSectionActive(section: NavSection) {
    return section.items.some(item => isActive(item.href, item.exact));
  }

  function toggleSection(title: string) {
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-background-dark border-r border-border-dark flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl">bolt</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-none">FreelanceHigh</h1>
          <p className="text-[11px] text-primary/60 mt-0.5">Espace Client</p>
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
        >
          <span className="material-symbols-outlined text-lg">home</span>
          <span>Accueil</span>
        </Link>
        <div className="border-b border-border-dark mt-2" />
      </div>

      {/* Collapsible Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 mt-1 space-y-1">
        {SECTIONS.map(section => {
          const isOpen = !collapsed[section.title];
          const sectionActive = isSectionActive(section);

          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
              >
                <span className={cn(sectionActive && !isOpen && "text-primary")}>{section.title}</span>
                <span className={cn("material-symbols-outlined text-sm transition-transform", isOpen ? "rotate-0" : "-rotate-90")}>
                  expand_more
                </span>
              </button>
              {isOpen && (
                <div className="space-y-0.5 mb-2">
                  {section.items.map(({ label, href, icon, exact, badge }) => {
                    const active = isActive(href, exact);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        )}
                      >
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                        <span className="flex-1">{label}</span>
                        {badge && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">{badge}</span>
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
                  ? "bg-primary/10 text-primary"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <span className="material-symbols-outlined text-lg">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* CTA Nouveau Projet */}
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

      {/* Logout */}
      <div className="px-4 pb-4 flex-shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/connexion" })}
          className="flex items-center justify-center gap-2 w-full border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-semibold py-2.5 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
