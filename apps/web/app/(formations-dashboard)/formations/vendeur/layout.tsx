"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { RoleGuard } from "@/components/formations/RoleGuard";

type NavItem = {
  icon: string;
  label: string;
  href: string;
  badge?: string;
  section?: string;
};

const navItems: NavItem[] = [
  // Vue
  { icon: "dashboard", label: "Tableau de bord", href: "/formations/vendeur/dashboard", section: "Vue" },
  { icon: "bar_chart", label: "Statistiques", href: "/formations/vendeur/statistiques", section: "Vue" },
  // Catalogue
  { icon: "storefront", label: "Mes produits", href: "/formations/vendeur/produits", section: "Catalogue" },
  { icon: "receipt_long", label: "Transactions", href: "/formations/vendeur/transactions", section: "Catalogue" },
  { icon: "account_balance_wallet", label: "Revenus & retraits", href: "/formations/wallet", section: "Catalogue" },
  // Croissance
  { icon: "campaign", label: "Marketing", href: "/formations/vendeur/marketing", section: "Croissance" },
  { icon: "bolt", label: "Automatisations", href: "/formations/vendeur/automatisations", section: "Croissance" },
  // Engagement
  { icon: "chat_bubble", label: "Messages", href: "/formations/messages", section: "Engagement" },
  { icon: "groups", label: "Communauté", href: "/formations/vendeur/communaute", section: "Engagement" },
  { icon: "support_agent", label: "Coaching", href: "/formations/vendeur/coaching", section: "Engagement", badge: "Pro" },
  { icon: "folder_open", label: "Ressources", href: "/formations/vendeur/ressources", section: "Engagement" },
  // Compte
  { icon: "account_circle", label: "Mon profil", href: "/formations/vendeur/profil", section: "Compte" },
  { icon: "settings", label: "Paramètres", href: "/formations/vendeur/parametres", section: "Compte" },
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
      <VendeurLayoutInner>{children}</VendeurLayoutInner>
    </RoleGuard>
  );
}

function VendeurLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Collapsed sidebar on desktop (persisted in localStorage)
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

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

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center px-4 md:px-6 gap-3">
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-[#191c1e]"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 text-[#5c647a] transition-colors"
          aria-label={collapsed ? "Étendre le menu" : "Réduire le menu"}
          title={collapsed ? "Étendre le menu" : "Réduire le menu"}
        >
          <span className="material-symbols-outlined text-[22px]">
            {collapsed ? "menu_open" : "menu"}
          </span>
        </button>

        {/* Logo */}
        <Link href="/formations/vendeur/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
            <span className="text-white font-bold text-xs tracking-tight">NK</span>
          </div>
          <span className="hidden sm:block font-bold text-[#191c1e] text-sm">Novakou</span>
        </Link>

        {/* Vendor badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
          <span className="material-symbols-outlined text-amber-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
          <span className="text-amber-700 text-[11px] font-semibold">Espace Vendeur</span>
        </div>

        <div className="flex-1" />

        {/* Quick action — create product */}
        <Link
          href="/formations/vendeur/produits/creer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Nouveau produit
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button className="relative p-2 rounded-full hover:bg-gray-100 text-[#5c647a]" aria-label="Notifications">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white" />
          </button>
          <button className="relative p-2 rounded-full hover:bg-gray-100 text-[#5c647a]" aria-label="Aide">
            <span className="material-symbols-outlined text-[22px]">help_outline</span>
          </button>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ml-1 ring-2 ring-white shadow-sm" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-1 ring-2 ring-white shadow-sm">
              {initials}
            </div>
          )}
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

        {/* Instructor info */}
        <div className={`border-b border-gray-100 transition-all ${collapsed && !mobileOpen ? "py-4 px-2" : "px-5 py-5"}`}>
          <div className={`flex items-center ${collapsed && !mobileOpen ? "justify-center" : "gap-3"}`}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-[#006e2f]/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-amber-400/20">
                {initials}
              </div>
            )}
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0">
                <p className="font-semibold text-[#191c1e] text-sm truncate">{displayName}</p>
                <p className="text-xs text-[#5c647a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-amber-500 text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  Instructeur
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation — sectioned */}
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
                              ? "bg-gradient-to-r from-[#006e2f]/10 to-transparent text-[#006e2f] font-semibold"
                              : "text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] flex-shrink-0 ${
                              isActive ? "text-[#006e2f]" : "text-[#5c647a] group-hover:text-[#191c1e]"
                            }`}
                            style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
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

        {/* Create product CTA */}
        <div className={`border-t border-gray-100 ${collapsed && !mobileOpen ? "p-2" : "px-3 py-4"}`}>
          <Link
            href="/formations/vendeur/produits/creer"
            onClick={() => setMobileOpen(false)}
            title={collapsed && !mobileOpen ? "Créer un produit" : undefined}
            className={`flex items-center justify-center gap-2 w-full rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 shadow-md shadow-[#006e2f]/20 ${
              collapsed && !mobileOpen ? "py-2.5 px-2" : "py-3 px-4"
            }`}
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            {(!collapsed || mobileOpen) && "Créer un produit"}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/formations" })}
            title={collapsed && !mobileOpen ? "Se déconnecter" : undefined}
            className={`mt-2 flex items-center justify-center gap-2 w-full rounded-xl text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors border border-red-200 ${
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
