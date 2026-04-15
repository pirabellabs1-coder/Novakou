"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

const navGroups = [
  {
    label: "Général",
    items: [
      { icon: "dashboard",         label: "Tableau de bord", href: "/formations/apprenant/dashboard" },
      { icon: "school",            label: "Mes formations",  href: "/formations/apprenant/mes-formations" },
      { icon: "inventory_2",       label: "Mes produits",    href: "/formations/apprenant/produits" },
      { icon: "workspace_premium", label: "Certificats",     href: "/formations/apprenant/certificats" },
    ],
  },
  {
    label: "Achats",
    items: [
      { icon: "shopping_cart",         label: "Panier",    href: "/formations/apprenant/panier",    badge: true },
      { icon: "receipt_long",          label: "Commandes", href: "/formations/apprenant/commandes" },
      { icon: "account_balance_wallet",label: "Dépenses",  href: "/formations/apprenant/depenses" },
    ],
  },
  {
    label: "Accompagnement",
    items: [
      { icon: "support_agent", label: "Mes mentors", href: "/formations/apprenant/mentors" },
      { icon: "forum",         label: "Messages",    href: "/formations/messages" },
    ],
  },
  {
    label: "Compte",
    items: [
      { icon: "settings", label: "Paramètres", href: "/formations/apprenant/parametres" },
    ],
  },
];

function ApprenantFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#006e2f" }}>
                <span className="text-white font-bold text-[10px]">FH</span>
              </div>
              <span className="font-bold text-[#191c1e] text-sm">FreelanceHigh</span>
            </div>
            <p className="text-xs text-[#5c647a] leading-relaxed">
              La plateforme d&apos;apprentissage qui élève votre carrière freelance.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#191c1e] uppercase tracking-wide mb-3">Apprendre</p>
            <ul className="space-y-1.5">
              {[
                { label: "Explorer le catalogue",  href: "/formations/explorer" },
                { label: "Mes formations",          href: "/formations/apprenant/mes-formations" },
                { label: "Trouver un mentor",       href: "/formations/mentors" },
                { label: "Mes certificats",         href: "/formations/apprenant/certificats" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-[#5c647a] hover:text-[#006e2f] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-[#191c1e] uppercase tracking-wide mb-3">Support</p>
            <ul className="space-y-1.5">
              {[
                { label: "Centre d'aide",               href: "/formations/aide" },
                { label: "Contact",                      href: "/formations/contact" },
                { label: "Conditions d'utilisation",     href: "/formations/cgu" },
                { label: "Politique de confidentialité", href: "/formations/confidentialite" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs text-[#5c647a] hover:text-[#006e2f] transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-[#5c647a]">© 2026 FreelanceHigh — Tous droits réservés</p>
          <p className="text-[10px] text-[#5c647a]">Fondé par Lissanon Gildas · Afrique francophone &amp; diaspora</p>
        </div>
      </div>
    </footer>
  );
}

// Derive initials from name
function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ApprenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();

  // Fetch cart count from real API
  const { data: cartData } = useQuery({
    queryKey: ["apprenant-cart-count"],
    queryFn: () => fetch("/api/formations/apprenant/cart").then((r) => r.json()),
    enabled: status === "authenticated",
    staleTime: 30_000,
  });

  const cartCount: number = cartData?.count ?? 0;
  const user = session?.user;
  const displayName  = user?.name ?? "Apprenant";
  const displayEmail = user?.email ?? "";
  const initials     = getInitials(user?.name);
  const avatarUrl    = (user as Record<string, unknown> | undefined)?.image as string | undefined
                    ?? (user as Record<string, unknown> | undefined)?.avatar as string | undefined;

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center px-4 md:px-6 gap-4">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-[#191c1e]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <Link href="/formations/apprenant/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: "#006e2f" }}>
            <span className="text-white font-bold text-xs tracking-tight">FH</span>
          </div>
          <span className="hidden sm:block font-bold text-[#191c1e] text-sm">FreelanceHigh</span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-full hover:bg-gray-100 text-[#5c647a]">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>

          {/* Cart */}
          <Link href="/formations/apprenant/panier" className="relative p-2 rounded-full hover:bg-gray-100 text-[#5c647a]">
            <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#006e2f] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User avatar */}
          <Link href="/formations/apprenant/parametres">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ml-1" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-1">
                {initials}
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-gray-100 pt-16 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* User info */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-[#191c1e] text-sm truncate">{displayName}</p>
              <p className="text-xs text-[#5c647a] truncate">{displayEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-widest px-3 mb-1.5">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/formations/apprenant/dashboard" && pathname.startsWith(item.href));
                    const showBadge = "badge" in item && item.badge && cartCount > 0;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-[#006e2f]/10 text-[#006e2f] font-semibold"
                              : "text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] flex-shrink-0 ${isActive ? "text-[#006e2f]" : "text-[#5c647a]"}`}
                            style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            {item.icon}
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {showBadge && (
                            <span className="w-5 h-5 rounded-full bg-[#006e2f] text-white text-[9px] font-bold flex items-center justify-center">
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* CTAs */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-2">
          <Link
            href="/formations/apprenant/affiliation"
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
            Devenir Affilié
            <span className="ml-auto text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-bold">40%</span>
          </Link>
          <Link
            href="/formations/explorer"
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-[#006e2f]/30 text-[#006e2f] text-xs font-semibold hover:bg-[#006e2f]/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">explore</span>
            Explorer le catalogue
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-64 pt-16 min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <ApprenantFooter />
      </main>
    </div>
  );
}
