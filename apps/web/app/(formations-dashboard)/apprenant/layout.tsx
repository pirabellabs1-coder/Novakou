// Refonte style KAZA — apprenant — 2026-06-07
// Topbar navy + sidebar navy actif, sections sm-uppercase, icônes Lucide.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { NovakouNotificationBell } from "@/components/notifications/NovakouNotificationBell";
import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  Package,
  Layers,
  ShoppingBag,
  CalendarDays,
  UserPlus,
  Settings,
  Bell,
  HelpCircle,
  Search,
  ChevronDown,
  Menu,
  X,
  LogOut,
  ShoppingCart,
  Award,
  CreditCard,
  Wallet,
  MessageSquare,
  Sparkles,
  Users,
  Gift,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Vue",
    items: [
      { icon: LayoutDashboard, label: "Tableau de bord", href: "/apprenant/dashboard" },
      { icon: TrendingUp,      label: "Progression",      href: "/apprenant/progression" },
    ],
  },
  {
    label: "Mes achats",
    items: [
      { icon: BookOpen,    label: "Mes formations",  href: "/apprenant/mes-formations" },
      { icon: Package,     label: "Mes produits",    href: "/apprenant/mes-produits" },
      { icon: Layers,      label: "Mes bundles",     href: "/apprenant/bundles" },
      { icon: CreditCard,  label: "Mes abonnements", href: "/apprenant/abonnements" },
      { icon: Award,       label: "Certificats",     href: "/apprenant/certificats" },
      { icon: ShoppingBag, label: "Mes commandes",   href: "/apprenant/commandes" },
      { icon: ShoppingCart,label: "Panier",          href: "/apprenant/panier", badge: true },
      { icon: Wallet,      label: "Dépenses",        href: "/apprenant/depenses" },
    ],
  },
  {
    label: "Mentorat",
    items: [
      { icon: CalendarDays, label: "Mes sessions",    href: "/apprenant/sessions" },
      { icon: Users,        label: "Mes mentors",     href: "/apprenant/mentors" },
      { icon: UserPlus,     label: "Réserver mentor", href: "/mentors" },
      { icon: MessageSquare,label: "Messages",        href: "/messages" },
      { icon: Sparkles,     label: "Coach IA",        href: "/apprenant/ai-coach" },
    ],
  },
  {
    label: "Paramètres",
    items: [
      { icon: Settings,   label: "Mon compte",    href: "/apprenant/parametres" },
      { icon: Bell,       label: "Notifications", href: "/apprenant/notifications" },
      { icon: Gift,       label: "Affiliation",   href: "/apprenant/affiliation" },
      { icon: HelpCircle, label: "Aide",          href: "/aide" },
    ],
  },
];

// Derive initials from name
function getInitials(name?: string | null): string {
  if (!name) return "AP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ApprenantFooter() {
  return (
    <footer className="border-t border-slate-200/60 bg-white mt-auto">
      <div className="px-6 py-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#006e2f] flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">N</span>
              </div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">Novakou</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              La plateforme d&apos;apprentissage qui élève votre carrière freelance.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-3">Apprendre</p>
            <ul className="space-y-1.5">
              {[
                { label: "Explorer le catalogue", href: "/explorer" },
                { label: "Mes formations",         href: "/apprenant/mes-formations" },
                { label: "Trouver un mentor",      href: "/mentors" },
                { label: "Mes certificats",        href: "/apprenant/certificats" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-slate-500 hover:text-[#006e2f] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-3">Support</p>
            <ul className="space-y-1.5">
              {[
                { label: "Centre d'aide",                href: "/aide" },
                { label: "Contact",                       href: "/contact" },
                { label: "Conditions d'utilisation",      href: "/cgu" },
                { label: "Politique de confidentialité",  href: "/confidentialite" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs text-slate-500 hover:text-[#006e2f] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-slate-400">© 2026 Novakou — Tous droits réservés</p>
          <p className="text-[10px] text-slate-400">Fondé par Pirabel Labs · Afrique francophone &amp; diaspora</p>
        </div>
      </div>
    </footer>
  );
}

export default function ApprenantLayout({ children }: { children: React.ReactNode }) {
  // No RoleGuard here on purpose: /apprenant/* is the BUYER space — anyone
  // who has ever purchased a product can come back here to find it. That
  // includes vendors, mentors, and affiliates buying from each other. The
  // middleware already gates this layout behind authentication (it redirects
  // anonymous users to /acheteur/connexion), so we just need to ensure
  // they're logged in, not that they're "apprenant" specifically.
  return <ApprenantLayoutInner>{children}</ApprenantLayoutInner>;
}

function ApprenantLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const displayName = user?.name ?? "Apprenant";
  const initials = getInitials(user?.name);
  const avatarUrl =
    ((user as Record<string, unknown> | undefined)?.image as string | undefined) ??
    ((user as Record<string, unknown> | undefined)?.avatar as string | undefined);

  return (
    <div
      className="min-h-screen bg-[#f7f9fb]"
      style={{ fontFamily: "var(--font-manrope), var(--font-inter), Inter, sans-serif" }}
    >
      {/* ── Top Navbar style KAZA — logo carré navy, search centrée, avatar 2 lignes ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200/80 h-[68px] flex items-center px-4 md:px-6 gap-3">
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo carré "N Novakou" style KAZA */}
        <Link href="/apprenant/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-[#006e2f] flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-white font-extrabold text-base tracking-tight">N</span>
          </div>
          <span className="hidden sm:block font-extrabold text-slate-900 text-lg tracking-tight">Novakou</span>
        </Link>

        {/* Search bar centrée KAZA */}
        <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto px-4">
          <div className="w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher une formation, un mentor..."
              className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-2xl placeholder-slate-400 text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        {/* Right : notif + cart + avatar avec nom + rôle (style KAZA) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <NovakouNotificationBell tone="slate" viewAllHref="/apprenant/notifications" />

          {/* Cart */}
          <Link
            href="/apprenant/panier"
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Panier"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Avatar avec nom + rôle KAZA */}
          <Link
            href="/apprenant/parametres"
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
              <span className="text-[11px] text-slate-500">Apprenant</span>
            </div>
            <ChevronDown className="hidden md:block w-4 h-4 text-slate-400 ml-1" />
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

      {/* Sidebar — style KAZA : fond blanc, items minimaux, actif = navy plein */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-slate-200/60 pt-[68px] flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Close button mobile */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}

        {/* Navigation style KAZA — actif = fond navy plein blanc texte, sections sm-uppercase */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6 last:mb-0">
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {section.label}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/apprenant/dashboard" && pathname.startsWith(item.href + "/"));
                  const showBadge = item.badge && cartCount > 0;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                          isActive
                            ? "bg-[#e6f5eb] text-[#006e2f] font-bold"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <Icon
                          className={`w-[18px] h-[18px] flex-shrink-0 ${
                            isActive ? "text-[#006e2f]" : "text-slate-500 group-hover:text-slate-700"
                          }`}
                          strokeWidth={isActive ? 2.4 : 2}
                        />
                        <span className="truncate flex-1">{item.label}</span>
                        {showBadge && (
                          <span
                            className={`text-[10px] font-bold rounded-full px-1.5 ml-auto min-w-[18px] text-center leading-[18px] h-[18px] ${
                              isActive ? "bg-[#006e2f] text-white" : "bg-emerald-500 text-white"
                            }`}
                          >
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
        </nav>

        {/* CTAs bas de sidebar */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-2">
          <Link
            href="/explorer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" strokeWidth={2.4} />
            Explorer le catalogue
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-colors border border-rose-200"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.4} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content — pt-[68px] = hauteur du topbar style KAZA */}
      <main className="md:ml-64 pt-[68px] min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <ApprenantFooter />
      </main>
    </div>
  );
}
