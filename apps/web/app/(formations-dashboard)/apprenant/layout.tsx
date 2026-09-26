// Refonte style KAZA — apprenant — 2026-06-07
// Coque commune DashboardShell (2026-09-26) : mêmes liens, panier et cloche ;
// l'habillage vit dans components/formations/dashboard.
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { NovakouNotificationBell } from "@/components/notifications/NovakouNotificationBell";
import { DashboardShell, ShellUserChip, initiales } from "@/components/formations/dashboard/DashboardShell";
import type { ShellNavItem, ShellNavSection } from "@/components/formations/dashboard/SidebarNav";
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
    label: "Gagner de l'argent",
    items: [
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
              Vos formations, e-books et produits numériques, réunis en un seul endroit.
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
  const displayName = user?.name ?? "Client";
  const initials = initiales(user?.name, "AP");
  const avatarUrl =
    ((user as Record<string, unknown> | undefined)?.image as string | undefined) ??
    ((user as Record<string, unknown> | undefined)?.avatar as string | undefined);

  // Menu de la coque : les sections vides ne s'affichent pas ; le panier
  // porte le compteur d'articles.
  const sections = useMemo<ShellNavSection[]>(
    () =>
      navSections
        .filter((s) => s.items.length > 0)
        .map((s) => ({
          label: s.label,
          items: s.items.map(
            (it): ShellNavItem => ({
              icon: it.icon,
              label: it.label,
              href: it.href,
              count: it.badge ? cartCount : 0,
              countTone: "green",
              countLabel: "articles dans le panier",
            }),
          ),
        })),
    [cartCount],
  );

  return (
    <DashboardShell
      space="apprenant"
      spaceLabel="Espace apprenant"
      homeHref="/apprenant/dashboard"
      sections={sections}
      search={{ placeholder: "Rechercher une formation, un mentor...", label: "Rechercher une formation ou un mentor" }}
      topEnd={
        <>
          <div className="nkd__bell">
            <NovakouNotificationBell tone="slate" viewAllHref="/apprenant/notifications" />
          </div>
          <Link
            href="/apprenant/panier"
            className="nkd__ibtn"
            aria-label={cartCount > 0 ? `Panier (${cartCount})` : "Panier"}
          >
            <ShoppingCart aria-hidden="true" />
            {cartCount > 0 && <span className="nkd__ibtn-badge" aria-hidden="true">{cartCount}</span>}
          </Link>
          <ShellUserChip
            href="/apprenant/parametres"
            name={displayName}
            subtitle="Client"
            src={avatarUrl}
            initials={initials}
            chevron
          />
        </>
      }
      sidebarFoot={
        <>
          <Link href="/explorer" className="nkd-btn nkd-btn--primary nkd-btn--block">
            <Search aria-hidden="true" />
            Explorer le catalogue
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="nkd-btn nkd-btn--danger nkd-btn--block"
          >
            <LogOut aria-hidden="true" />
            Se déconnecter
          </button>
        </>
      }
      footer={<ApprenantFooter />}
    >
      {children}
    </DashboardShell>
  );
}
