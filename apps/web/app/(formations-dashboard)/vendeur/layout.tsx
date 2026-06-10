// Refonte par Augustin Mékongo + Fatou Diallo — bureau 2026-05-26 (votes 7, 8, 13)
// Migration intégrale des icônes Material Symbols → Lucide React (2026-06-07)
// pour éliminer le bug "da", "ba", "st"… affiché en texte brut quand la font
// Material Symbols ne charge pas assez vite.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart3,
  Store,
  CreditCard,
  Layers,
  Receipt,
  AlertCircle,
  Wallet,
  Megaphone,
  Sparkles,
  Brain,
  Bot,
  Zap,
  MessageSquare,
  Star,
  HelpCircle,
  Users,
  Headphones,
  FolderOpen,
  KeyRound,
  Webhook,
  BookOpen,
  User,
  ShieldCheck,
  Settings,
  Menu,
  PanelLeft,
  Search,
  ChevronDown,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { RoleGuard } from "@/components/formations/RoleGuard";
import { ShopProvider, useActiveShop } from "@/components/formations/ShopProvider";
import ShopSwitcher from "@/components/formations/ShopSwitcher";
import { NovakouNotificationBell } from "@/components/notifications/NovakouNotificationBell";

/**
 * Vote 13 — badges "à traiter" sur la sidebar vendeur.
 * Mapping route → clé compteur de l'endpoint /api/formations/vendeur/sidebar-counts :
 *   /vendeur/abandons  → abandons (CheckoutAttempt ABANDONED/FAILED non récupérés)
 *   /vendeur/inquiries → inquiries (ProductInquiry status="pending")
 *   /wallet            → retraits  (InstructorWithdrawal status="EN_ATTENTE")
 */
const COUNT_KEY_BY_HREF: Record<string, "abandons" | "inquiries" | "retraits"> = {
  "/vendeur/abandons": "abandons",
  "/vendeur/inquiries": "inquiries",
  "/wallet": "retraits",
};

type SidebarCounts = { abandons: number; inquiries: number; retraits: number };

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
  section?: string;
};

// Note : `Storefront` n'existe pas dans lucide-react — on utilise `Store` partout
// et on distingue produits (Store) vs boutiques (Store) par les labels.
const navItems: NavItem[] = [
  // Vue
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendeur/dashboard", section: "Vue" },
  { icon: BarChart3, label: "Statistiques", href: "/vendeur/statistiques", section: "Vue" },
  // Catalogue
  { icon: Store, label: "Mes produits", href: "/vendeur/produits", section: "Catalogue" },
  { icon: CreditCard, label: "Abonnements", href: "/vendeur/memberships", section: "Catalogue" },
  { icon: Layers, label: "Bundles", href: "/vendeur/bundles", section: "Catalogue" },
  { icon: Store, label: "Mes boutiques", href: "/vendeur/boutiques", section: "Catalogue" },
  { icon: Receipt, label: "Transactions", href: "/vendeur/transactions", section: "Catalogue" },
  { icon: AlertCircle, label: "Abandons & Échecs", href: "/vendeur/abandons", section: "Catalogue" },
  { icon: Wallet, label: "Revenus & retraits", href: "/wallet", section: "Catalogue" },
  // Croissance
  { icon: Megaphone, label: "Marketing", href: "/vendeur/marketing", section: "Croissance" },
  { icon: Sparkles, label: "AI Studio", href: "/vendeur/ai-studio", section: "Croissance", badge: "IA" },
  { icon: Brain, label: "Coach IA", href: "/vendeur/ai-coach", section: "Croissance", badge: "IA" },
  { icon: Bot, label: "Bot support boutique", href: "/vendeur/support-ia", section: "Croissance", badge: "IA" },
  { icon: Zap, label: "Automatisations", href: "/vendeur/automatisations", section: "Croissance" },
  // Engagement
  { icon: MessageSquare, label: "Messages", href: "/messages", section: "Engagement" },
  { icon: Star, label: "Avis clients", href: "/vendeur/avis", section: "Engagement" },
  { icon: HelpCircle, label: "Questions acheteurs", href: "/vendeur/inquiries", section: "Engagement" },
  { icon: Users, label: "Communauté", href: "/vendeur/communaute", section: "Engagement" },
  { icon: Headphones, label: "Coaching", href: "/vendeur/coaching", section: "Engagement", badge: "Pro" },
  { icon: FolderOpen, label: "Ressources", href: "/vendeur/ressources", section: "Engagement" },
  // Développeur
  { icon: KeyRound, label: "Clés API", href: "/vendeur/api-keys", section: "Développeur" },
  { icon: Webhook, label: "Webhooks sortants", href: "/vendeur/webhooks", section: "Développeur" },
  { icon: BookOpen, label: "Documentation API", href: "/vendeur/documentation-api", section: "Développeur" },
  // Compte
  { icon: User, label: "Mon profil", href: "/vendeur/profil", section: "Compte" },
  { icon: Users, label: "Équipe", href: "/vendeur/parametres/equipe", section: "Compte" },
  { icon: ShieldCheck, label: "Vérification KYC", href: "/kyc", section: "Compte" },
  { icon: Settings, label: "Paramètres", href: "/vendeur/parametres", section: "Compte" },
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
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const { activeShop } = useActiveShop();

  const { data: countsResp } = useQuery<{ data: SidebarCounts }>({
    queryKey: ["vendeur-sidebar-counts"],
    queryFn: () => fetch("/api/formations/vendeur/sidebar-counts").then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const counts: SidebarCounts = countsResp?.data ?? { abandons: 0, inquiries: 0, retraits: 0 };

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

  const shopColor = activeShop?.themeColor || "#006e2f";

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
      {/* ── Topbar KAZA — logo carré, search bar centrée, avatar 2 lignes ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200/80 h-[68px] flex items-center px-4 md:px-6 gap-3">
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>

        {/* Logo carré "N Novakou" style KAZA */}
        <Link href="/vendeur/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}
          >
            <span className="text-white font-extrabold text-base tracking-tight">N</span>
          </div>
          <span className="hidden sm:block font-extrabold text-slate-900 text-lg tracking-tight">Novakou</span>
        </Link>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex ml-2 p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          aria-label={collapsed ? "Étendre le menu" : "Réduire le menu"}
          title={collapsed ? "Étendre le menu" : "Réduire le menu"}
        >
          <PanelLeft size={22} />
        </button>

        {/* Active shop switcher (only shown when 2+ shops) */}
        <ShopSwitcher />

        {/* Search bar centrée KAZA */}
        <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto px-4">
          <div className="w-full relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-2xl placeholder-slate-400 text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        {/* Right : notif + avatar 2 lignes (style KAZA) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <NovakouNotificationBell tone="slate" viewAllHref="/vendeur/notifications" />
          <Link
            href="/vendeur/profil"
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#dcefe2] flex items-center justify-center text-[#006e2f] text-xs font-extrabold flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-sm font-bold text-slate-900 max-w-[140px] truncate">
                {displayName}
              </span>
              <span className="text-[11px] text-slate-500">
                {activeShop?.name ? "Vendeur Pro" : "Vendeur"}
              </span>
            </div>
            <ChevronDown size={16} className="hidden md:block text-slate-400 ml-1" />
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

      {/* Sidebar — style KAZA */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-200/60 pt-[68px] flex flex-col transition-all duration-300 ${sidebarWidth} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${mobileOpen ? "w-64" : ""}`}
      >
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Fermer le menu"
          >
            <X size={20} className="text-slate-500" />
          </button>
        )}

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {sections.map((section) => {
            const items = navItems.filter((n) => n.section === section);
            return (
              <div key={section} className="mb-6 last:mb-0">
                {(!collapsed || mobileOpen) && (
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {section}
                  </p>
                )}
                <ul className="space-y-1">
                  {items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const countKey = COUNT_KEY_BY_HREF[item.href];
                    const count = countKey ? counts[countKey] : 0;
                    const showCountBadge = count > 0;
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          title={collapsed && !mobileOpen ? item.label : undefined}
                          className={`group flex items-center gap-3 rounded-xl text-sm transition-all duration-150 ${
                            collapsed && !mobileOpen ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                          } ${
                            isActive
                              ? "bg-[#e6f5eb] text-[#006e2f] font-bold"
                              : "text-[#41544a] hover:bg-slate-50 hover:text-slate-900 font-semibold"
                          }`}
                        >
                          <Icon
                            size={18}
                            className={`flex-shrink-0 ${isActive ? "text-[#006e2f]" : "text-[#7d9486] group-hover:text-slate-700"}`}
                          />
                          {(!collapsed || mobileOpen) && (
                            <>
                              <span className="truncate">{item.label}</span>
                              {showCountBadge ? (
                                <span
                                  aria-label={`${count} à traiter`}
                                  className={`text-[10px] font-bold rounded-full px-1.5 ml-auto min-w-[18px] text-center leading-[18px] h-[18px] ${
                                    isActive ? "bg-rose-400 text-white" : "bg-rose-500 text-white"
                                  }`}
                                >
                                  {count > 99 ? "99+" : count}
                                </span>
                              ) : item.badge ? (
                                <span
                                  className={`ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                    item.badge === "Pro" ? "bg-[#fef3c7] text-[#92400e]" : "text-white"
                                  }`}
                                  style={
                                    item.badge === "Pro"
                                      ? undefined
                                      : { background: "linear-gradient(135deg,#006e2f,#22c55e)" }
                                  }
                                >
                                  {item.badge}
                                </span>
                              ) : null}
                            </>
                          )}
                          {collapsed && !mobileOpen && showCountBadge && (
                            <span
                              aria-hidden
                              className="absolute ml-8 -mt-5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"
                            />
                          )}
                          {collapsed && !mobileOpen && !showCountBadge && item.badge && (
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

        {/* Sign out */}
        <div className={`border-t border-gray-100 ${collapsed && !mobileOpen ? "p-2" : "px-3 py-4"}`}>
          <button
            onClick={() => {
              document.cookie = "nk_active_shop=; path=/; max-age=0";
              signOut({ callbackUrl: "/" });
            }}
            title={collapsed && !mobileOpen ? "Se déconnecter" : undefined}
            className={`flex items-center justify-center gap-2 w-full rounded-xl text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors border border-red-200 ${
              collapsed && !mobileOpen ? "py-2 px-2" : "py-2.5 px-4"
            }`}
          >
            <LogOut size={16} />
            {(!collapsed || mobileOpen) && "Se déconnecter"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`pt-[68px] min-h-screen transition-all duration-300 ${mainOffset}`}>
        {children}
      </main>
    </div>
  );
}
