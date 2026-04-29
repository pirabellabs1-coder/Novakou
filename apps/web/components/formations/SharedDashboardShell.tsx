"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

type NavItem = { icon: string; label: string; href: string; section: string; badge?: string };

// IMPORTANT — these arrays must mirror exactly the navItems in the role-specific
// layouts (apps/web/app/(formations-dashboard)/{vendeur,mentor,apprenant}/layout.tsx).
// When the user lands on a shared route (/kyc, /wallet, /messages) they must see
// the same sidebar as on their dashboard, not a different one.

const VENDOR_NAV: NavItem[] = [
  { icon: "dashboard", label: "Tableau de bord", href: "/vendeur/dashboard", section: "Vue" },
  { icon: "bar_chart", label: "Statistiques", href: "/vendeur/statistiques", section: "Vue" },
  { icon: "storefront", label: "Mes produits", href: "/vendeur/produits", section: "Catalogue" },
  { icon: "card_membership", label: "Abonnements", href: "/vendeur/memberships", section: "Catalogue" },
  { icon: "category", label: "Bundles", href: "/vendeur/bundles", section: "Catalogue" },
  { icon: "store", label: "Mes boutiques", href: "/vendeur/boutiques", section: "Catalogue" },
  { icon: "receipt_long", label: "Transactions", href: "/vendeur/transactions", section: "Catalogue" },
  { icon: "payments", label: "Abandons & Échecs", href: "/vendeur/abandons", section: "Catalogue" },
  { icon: "account_balance_wallet", label: "Revenus & retraits", href: "/wallet", section: "Catalogue" },
  { icon: "campaign", label: "Marketing", href: "/vendeur/marketing", section: "Croissance" },
  { icon: "auto_awesome", label: "AI Studio", href: "/vendeur/ai-studio", section: "Croissance", badge: "IA" },
  { icon: "psychology", label: "Coach IA", href: "/vendeur/ai-coach", section: "Croissance", badge: "IA" },
  { icon: "smart_toy", label: "Bot support boutique", href: "/vendeur/support-ia", section: "Croissance", badge: "IA" },
  { icon: "bolt", label: "Automatisations", href: "/vendeur/automatisations", section: "Croissance" },
  { icon: "chat_bubble", label: "Messages", href: "/messages", section: "Engagement" },
  { icon: "reviews", label: "Avis clients", href: "/vendeur/avis", section: "Engagement" },
  { icon: "forum", label: "Questions acheteurs", href: "/vendeur/inquiries", section: "Engagement" },
  { icon: "groups", label: "Communauté", href: "/vendeur/communaute", section: "Engagement" },
  { icon: "support_agent", label: "Coaching", href: "/vendeur/coaching", section: "Engagement", badge: "Pro" },
  { icon: "folder_open", label: "Ressources", href: "/vendeur/ressources", section: "Engagement" },
  { icon: "key", label: "Clés API", href: "/vendeur/api-keys", section: "Développeur" },
  { icon: "webhook", label: "Webhooks sortants", href: "/vendeur/webhooks", section: "Développeur" },
  { icon: "menu_book", label: "Documentation API", href: "/vendeur/documentation-api", section: "Développeur" },
  { icon: "account_circle", label: "Mon profil", href: "/vendeur/profil", section: "Compte" },
  { icon: "groups", label: "Équipe", href: "/vendeur/parametres/equipe", section: "Compte" },
  { icon: "verified_user", label: "Vérification KYC", href: "/kyc", section: "Compte" },
  { icon: "settings", label: "Paramètres", href: "/vendeur/parametres", section: "Compte" },
];

const MENTOR_NAV: NavItem[] = [
  { icon: "dashboard", label: "Tableau de bord", href: "/mentor/dashboard", section: "Vue" },
  { icon: "groups", label: "Mes apprenants", href: "/mentor/apprenants", section: "Vue" },
  { icon: "event", label: "Mon calendrier", href: "/mentor/calendrier", section: "Vue" },
  { icon: "category", label: "Packs de sessions", href: "/mentor/packs", section: "Catalogue" },
  { icon: "folder_open", label: "Ressources", href: "/mentor/ressources", section: "Catalogue" },
  { icon: "account_balance_wallet", label: "Revenus & retraits", href: "/wallet", section: "Finances" },
  { icon: "payments", label: "Finances", href: "/mentor/finances", section: "Finances" },
  { icon: "chat_bubble", label: "Messages", href: "/messages", section: "Engagement" },
  { icon: "verified_user", label: "Vérification KYC", href: "/kyc", section: "Compte" },
  { icon: "person", label: "Mon profil", href: "/mentor/profil", section: "Compte" },
];

const APPRENANT_NAV: NavItem[] = [
  { icon: "dashboard", label: "Tableau de bord", href: "/apprenant/dashboard", section: "Général" },
  { icon: "school", label: "Mes formations", href: "/apprenant/mes-formations", section: "Général" },
  { icon: "inventory_2", label: "Mes produits", href: "/apprenant/mes-produits", section: "Général" },
  { icon: "workspace_premium", label: "Certificats", href: "/apprenant/certificats", section: "Général" },
  { icon: "shopping_cart", label: "Panier", href: "/apprenant/panier", section: "Achats" },
  { icon: "receipt_long", label: "Commandes", href: "/apprenant/commandes", section: "Achats" },
  { icon: "account_balance_wallet", label: "Dépenses", href: "/apprenant/depenses", section: "Achats" },
  { icon: "support_agent", label: "Mes mentors", href: "/apprenant/mentors", section: "Accompagnement" },
  { icon: "event", label: "Mes sessions", href: "/apprenant/sessions", section: "Accompagnement" },
  { icon: "forum", label: "Messages", href: "/messages", section: "Accompagnement" },
  { icon: "psychology", label: "Coach IA", href: "/apprenant/ai-coach", section: "Accompagnement" },
  { icon: "verified_user", label: "Vérification KYC", href: "/kyc", section: "Compte" },
  { icon: "settings", label: "Paramètres", href: "/apprenant/parametres", section: "Compte" },
];

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  instructeur: VENDOR_NAV,
  mentor: MENTOR_NAV,
  apprenant: APPRENANT_NAV,
};

function getInitials(name?: string | null): string {
  if (!name) return "FH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Shell with role-aware sidebar for routes that live outside role-specific
 * layouts (/kyc, /wallet, /messages). The sidebar mirrors the user's main
 * dashboard sidebar exactly so they don't perceive a different menu.
 */
export function SharedDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = (session?.user as { formationsRole?: string } | undefined)?.formationsRole ?? "apprenant";
  const navItems = NAV_BY_ROLE[role] ?? APPRENANT_NAV;
  const sections = Array.from(new Set(navItems.map((n) => n.section))).filter(Boolean) as string[];

  const displayName = session?.user?.name ?? "Utilisateur";
  const initials = getInitials(session?.user?.name);
  const avatarUrl = session?.user?.image;

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Top bar — same chrome as vendor layout */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-16 flex items-center px-4 md:px-6 gap-3">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            <span className="text-white font-extrabold text-xs tracking-tight">NK</span>
          </div>
          <span className="hidden sm:block font-extrabold text-slate-900 text-sm tracking-tight">Novakou</span>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold ring-2 ring-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
            >
              {initials}
            </div>
          )}
          <span className="hidden md:block text-xs font-bold text-slate-700 max-w-[100px] truncate">
            {displayName.split(" ")[0]}
          </span>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-gray-100 pt-16 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-[20px] text-[#5c647a]">close</span>
          </button>
        )}

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {sections.map((section) => {
            const items = navItems.filter((n) => n.section === section);
            return (
              <div key={section} className="mb-5 last:mb-0">
                <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-widest text-[#5c647a]">{section}</p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 px-3 py-2.5 ${
                            isActive
                              ? "bg-[#006e2f]/10 text-[#006e2f] font-semibold"
                              : "text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]"
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[20px] flex-shrink-0"
                            style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 px-3 py-4">
          <button
            onClick={() => {
              document.cookie = "nk_active_shop=; path=/; max-age=0";
              signOut({ callbackUrl: "/" });
            }}
            className="flex items-center justify-center gap-2 w-full rounded-xl text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors border border-red-200 py-2.5 px-4"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pt-16 min-h-screen md:ml-64">{children}</main>
    </div>
  );
}
