"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { RoleGuard } from "@/components/formations/RoleGuard";
import { ShopProvider, useActiveShop } from "@/components/formations/ShopProvider";
import ShopSwitcher from "@/components/formations/ShopSwitcher";

type NavItem = {
  icon: string;
  label: string;
  href: string;
  badge?: string;
  section?: string;
};

const navItems: NavItem[] = [
  // Vue
  { icon: "dashboard", label: "Tableau de bord", href: "/vendeur/dashboard", section: "Vue" },
  { icon: "bar_chart", label: "Statistiques", href: "/vendeur/statistiques", section: "Vue" },
  // Catalogue
  { icon: "storefront", label: "Mes produits", href: "/vendeur/produits", section: "Catalogue" },
  { icon: "category", label: "Bundles", href: "/vendeur/bundles", section: "Catalogue" },
  { icon: "store", label: "Mes boutiques", href: "/vendeur/boutiques", section: "Catalogue" },
  { icon: "receipt_long", label: "Transactions", href: "/vendeur/transactions", section: "Catalogue" },
  { icon: "account_balance_wallet", label: "Revenus & retraits", href: "/wallet", section: "Catalogue" },
  // Croissance
  { icon: "campaign", label: "Marketing", href: "/vendeur/marketing", section: "Croissance" },
  { icon: "bolt", label: "Automatisations", href: "/vendeur/automatisations", section: "Croissance" },
  // Engagement
  { icon: "chat_bubble", label: "Messages", href: "/messages", section: "Engagement" },
  { icon: "groups", label: "Communauté", href: "/vendeur/communaute", section: "Engagement" },
  { icon: "support_agent", label: "Coaching", href: "/vendeur/coaching", section: "Engagement", badge: "Pro" },
  { icon: "folder_open", label: "Ressources", href: "/vendeur/ressources", section: "Engagement" },
  // Développeur
  { icon: "key", label: "Clés API", href: "/vendeur/api-keys", section: "Développeur" },
  { icon: "menu_book", label: "Documentation API", href: "/developer/docs", section: "Développeur" },
  // Compte
  { icon: "account_circle", label: "Mon profil", href: "/vendeur/profil", section: "Compte" },
  { icon: "groups", label: "Équipe", href: "/vendeur/parametres/equipe", section: "Compte" },
  { icon: "verified_user", label: "Vérification KYC", href: "/kyc", section: "Compte" },
  { icon: "settings", label: "Paramètres", href: "/vendeur/parametres", section: "Compte" },
];

// Group nav items by section
const sections = Array.from(new Set(navItems.map((n) => n.section))).filter(Boolean) as string[];

function getInitials(name?: string | null): string {
  if (!name) return "FH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function VendeurLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="instructeur">
      <ShopProvider>
        <VendeurLayoutInner>{children}</VendeurLayoutInner>
      </ShopProvider>
    </RoleGuard>
  );
}

function VendeurLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Collapsed sidebar on desktop (persisted in localStorage)
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const { activeShop } = useActiveShop();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vendeur-sidebar-collapsed");
      if (saved === "true") setCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("vendeur-sidebar-collapsed", String(next)); } catch { /* ignore */ }
  }

  const displayName = session?.user?.name ?? "Instructeur";
  const initials = getInitials(session?.user?.name);
  const avatarUrl = session?.user?.image;

  const sidebarWidth = collapsed ? "w-20" : "w-64";
  const mainOffset = collapsed ? "md:ml-20" : "md:ml-64";

  // Couleur thème dynamique de la boutique active. Si la boutique a un themeColor → utilisée
  // partout dans le chrome (sidebar item actif, accents, boutons). Sinon vert Novakou.
  const shopColor = activeShop?.themeColor || "#006e2f";

  // Page chooser : pas de chrome (plein écran)
  if (pathname === "/vendeur/choisir-boutique") {
    return (
      <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f7f9fb]"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif", "--shop-color": shopColor } as React.CSSProperties}
    >
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-16 flex items-center px-4 md:px-6 gap-3">
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          aria-label={collapsed ? "Étendre le menu" : "Réduire le menu"}
          title={collapsed ? "Étendre le menu" : "Réduire le menu"}
        >
          <span className="material-symbols-outlined text-[22px]">
            {collapsed ? "menu_open" : "menu"}
          </span>
        </button>

        {/* Logo */}
        <Link href="/vendeur/dashboard" className="flex items-center gap-2 flex-shrink-0 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            <span className="text-white font-extrabold text-xs tracking-tight">NK</span>
          </div>
          <span className="hidden sm:block font-extrabold text-slate-900 text-sm tracking-tight">Novakou</span>
        </Link>

        {/* Active shop switcher (only shown when 2+ shops) */}
        <ShopSwitcher />

        {/* Search bar (desktop) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-auto">
          <div className="w-full relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">
              search
            </span>
            <input
              type="search"
              placeholder="Rechercher un produit, une commande..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100/80 border border-transparent rounded-xl placeholder-slate-400 text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex-1 lg:hidden" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {activeShop && (
            <Link
              href={`/boutique/${activeShop.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              title="Voir ma boutique en ligne"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span className="hidden xl:inline">Voir ma boutique</span>
            </Link>
          )}
          <button
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
          <button
            className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Aide"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" />
          <Link
            href="/vendeur/profil"
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 ring-2 ring-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
              >
                {initials}
              </div>
            )}
            <span className="hidden md:block text-xs font-bold text-slate-700 max-w-[100px] truncate">
              {displayName.split(" ")[0]}
            </span>
          </Link>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-gray-100 pt-16 flex flex-col transition-all duration-300 ${sidebarWidth} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${mobileOpen ? "w-64" : ""}`}
      >
        {/* Close button mobile */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-[20px] text-[#5c647a]">close</span>
          </button>
        )}

        {/* Navigation — sectioned (sidebar starts directly with nav, shop info is in the topbar) */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {sections.map((section) => {
            const items = navItems.filter((n) => n.section === section);
            return (
              <div key={section} className="mb-5 last:mb-0">
                {(!collapsed || mobileOpen) && (
                  <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-widest text-[#5c647a]">
                    {section}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          title={collapsed && !mobileOpen ? item.label : undefined}
                          className={`group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            collapsed && !mobileOpen ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                          } ${
                            isActive
                              ? "font-semibold"
                              : "text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]"
                          }`}
                          style={
                            isActive
                              ? {
                                  background: `linear-gradient(to right, var(--shop-color, #006e2f)1a, transparent)`,
                                  color: "var(--shop-color, #006e2f)",
                                }
                              : undefined
                          }
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] flex-shrink-0 ${
                              isActive ? "" : "text-[#5c647a] group-hover:text-[#191c1e]"
                            }`}
                            style={{
                              fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                              color: isActive ? "var(--shop-color, #006e2f)" : undefined,
                            }}
                          >
                            {item.icon}
                          </span>
                          {(!collapsed || mobileOpen) && (
                            <>
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                          {collapsed && !mobileOpen && item.badge && (
                            <span className="absolute ml-8 -mt-5 text-[8px] font-bold w-3 h-3 rounded-full bg-amber-400" />
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

        {/* Sign out only (Create product CTA retiré) */}
        <div className={`border-t border-gray-100 ${collapsed && !mobileOpen ? "p-2" : "px-3 py-4"}`}>
          <button
            onClick={() => {
              // Vider le cookie boutique active pour qu'au prochain login l'utilisateur
              // soit re-routé sur le chooser (s'il a 2+ boutiques)
              document.cookie = "nk_active_shop=; path=/; max-age=0";
              signOut({ callbackUrl: "/" });
            }}
            title={collapsed && !mobileOpen ? "Se déconnecter" : undefined}
            className={`flex items-center justify-center gap-2 w-full rounded-xl text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors border border-red-200 ${
              collapsed && !mobileOpen ? "py-2 px-2" : "py-2.5 px-4"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            {(!collapsed || mobileOpen) && "Se déconnecter"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ${mainOffset}`}>
        {children}
      </main>
    </div>
  );
}
