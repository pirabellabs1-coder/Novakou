"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Globe,
  LayoutDashboard,
  BrainCircuit,
  Bot,
  Package,
  Users,
  Receipt,
  Banknote,
  Landmark,
  Plug,
  MessageSquare,
  Flag,
  Gavel,
  BadgeCheck,
  UserMinus,
  Megaphone,
  MessagesSquare,
  Headphones,
  History,
  BarChart3,
  Filter,
  Settings,
  Menu,
  Shield,
  ExternalLink,
  Store,
  LogOut,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { NovakouNotificationBell } from "@/components/notifications/NovakouNotificationBell";

type NavItem = { icon: LucideIcon; label: string; href: string };

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Vue générale", href: "/admin/dashboard" },
  { icon: BrainCircuit, label: "IA Assistant", href: "/admin/ai-assistant" },
  { icon: Bot, label: "Agents IA", href: "/admin/agents" },
  { icon: Package, label: "Produits", href: "/admin/produits" },
  { icon: Users, label: "Utilisateurs", href: "/admin/utilisateurs" },
  { icon: Globe, label: "Par pays", href: "/admin/pays" },
  { icon: Receipt, label: "Transactions", href: "/admin/transactions" },
  // Trésorerie : soldes réels chez les passerelles + journal de tous les
  // mouvements (encaissements et versements), avec la passerelle de chacun.
  { icon: Landmark, label: "Trésorerie", href: "/admin/tresorerie" },
  // Une seule vue sur l'argent : soldes réels chez chaque passerelle, et tous
  // les mouvements avec la passerelle qui les a portés — pour la comptabilité.
  { icon: Landmark, label: "Trésorerie", href: "/admin/tresorerie" },
  { icon: Plug, label: "Passerelles de paiement", href: "/admin/passerelles" },
  // Sans cette entree la page existe mais n'est atteignable qu'en tapant son
  // adresse : une page admin qu'on ne trouve pas n'est pas une page.
  { icon: Plug, label: "Couverture passerelles", href: "/admin/passerelles/couverture" },
  { icon: Plug, label: "Taux de change", href: "/admin/taux" },
  { icon: Banknote, label: "Retraits vendeurs", href: "/admin/retraits-vendeurs" },
  { icon: Banknote, label: "Retraits affiliés", href: "/admin/affiliate-withdrawals" },
  { icon: Landmark, label: "Retraits plateforme", href: "/admin/retraits" },
  { icon: MessageSquare, label: "Commentaires", href: "/admin/commentaires" },
  { icon: Flag, label: "Signalements", href: "/admin/signalements" },
  { icon: Gavel, label: "Disputes mentor", href: "/admin/mentor-disputes" },
  { icon: BadgeCheck, label: "Vérification KYC", href: "/admin/kyc" },
  { icon: UserMinus, label: "Suppressions de compte", href: "/admin/suppressions" },
  { icon: GraduationCap, label: "Académie", href: "/admin/academie" },
  { icon: Megaphone, label: "Campagnes email", href: "/admin/emails" },
  { icon: MessagesSquare, label: "Conversations", href: "/admin/conversations" },
  { icon: Headphones, label: "Tickets support", href: "/admin/tickets" },
  { icon: History, label: "Journal d'audit", href: "/admin/audit" },
  { icon: BarChart3, label: "Rapports", href: "/admin/rapports" },
  { icon: Filter, label: "Funnel acheteur", href: "/admin/analytics-funnel" },
  { icon: Settings, label: "Configuration", href: "/admin/configuration" },
];

function getInitials(name?: string | null): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type BadgeCounts = { reports: number; comments: number; withdrawals: number };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Repli du menu SUR ORDINATEUR (demande fondateur) : le hamburger ne servait
  // qu'au mobile, impossible de fermer le menu sur grand écran pour élargir
  // les tableaux (produits, transactions…). Le choix est mémorisé.
  const [menuReplie, setMenuReplie] = useState(false);
  useEffect(() => {
    setMenuReplie(window.localStorage.getItem("novakou:admin-menu-replie") === "1");
  }, []);
  const basculerMenu = () => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setMenuReplie((v) => {
        window.localStorage.setItem("novakou:admin-menu-replie", v ? "0" : "1");
        return !v;
      });
    } else {
      setSidebarOpen((v) => !v);
    }
  };
  const { data: session } = useSession();

  const displayName = session?.user?.name ?? "Super Admin";
  const displayEmail = session?.user?.email ?? "admin@novakou.com";
  const initials = getInitials(session?.user?.name);
  const avatarUrl = session?.user?.image;

  // Fetch dashboard to get pending counts for sidebar badges
  const { data: dashRes } = useQuery<{ data: { quickStats: { pendingReports: number; pendingRefunds: number } } }>({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetch("/api/formations/admin/dashboard").then((r) => r.json()),
    staleTime: 60_000,
  });

  const { data: commentsRes } = useQuery<{ data: unknown[]; summary: { withoutResponse: number } | null }>({
    queryKey: ["admin-commentaires"],
    queryFn: () => fetch("/api/formations/admin/commentaires").then((r) => r.json()),
    staleTime: 60_000,
  });

  /**
   * Tout ce qui attend une décision, en UN appel.
   *
   * Le menu comptait vingt-trois entrées identiques : rien ne disait qu'une
   * pièce d'identité dormait depuis trois jours ou qu'un retrait attendait
   * d'être versé. Il fallait ouvrir chaque page pour le découvrir — donc on ne
   * le découvrait pas.
   */
  const { data: enAttente } = useQuery<{ data: { parPage: Record<string, number>; total: number } }>({
    queryKey: ["admin-actions-en-attente"],
    queryFn: () => fetch("/api/formations/admin/actions-en-attente").then((r) => r.json()),
    // Rafraîchi seul : l'admin laisse souvent son onglet ouvert, et un badge
    // figé sur une valeur périmée vaut moins que pas de badge du tout.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const parPage = enAttente?.data?.parPage ?? {};

  const badges: BadgeCounts = {
    reports: dashRes?.data?.quickStats?.pendingReports ?? 0,
    comments: commentsRes?.summary?.withoutResponse ?? 0,
    withdrawals: parPage["/admin/retraits-vendeurs"] ?? 0,
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e4eae6] h-16 flex items-center px-4 md:px-6 gap-4">
        {/* Ouvrir / fermer le menu — mobile ET ordinateur */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 text-[#13241b]"
          onClick={basculerMenu}
          aria-label="Ouvrir ou fermer le menu"
          title="Ouvrir / fermer le menu"
        >
          <Menu size={22} />
        </button>

        {/* Logo */}
        <Link href="/admin/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}
          >
            <span className="text-white font-extrabold text-sm tracking-tight">N</span>
          </div>
          <span className="hidden sm:block font-extrabold text-[#13241b] text-base tracking-tight">Novakou</span>
        </Link>

        {/* Admin badge */}
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#0b3b20]">
          <Shield size={12} />
          Admin
        </span>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Repère global : un point rouge dès qu'une décision attend quelque
              part, visible depuis N'IMPORTE QUELLE page admin. Sans lui, il
              fallait déjà être dans le menu pour voir les compteurs — donc
              savoir qu'il fallait regarder. */}
          {(enAttente?.data?.total ?? 0) > 0 && (
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-extrabold"
              title="Éléments en attente d'une décision"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {enAttente?.data?.total} à traiter
            </span>
          )}
          <NovakouNotificationBell tone="light" viewAllHref="/admin/notifications" />
          <Link
            href="/admin/configuration"
            title="Configuration"
            className="relative p-2 rounded-full hover:bg-gray-100 text-[#5d7166]"
          >
            <Settings size={20} />
          </Link>
          {/* Admin avatar */}
          <div className="flex items-center gap-2 ml-1">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#006e2f] text-xs font-extrabold flex-shrink-0 bg-[#dcefe2]">
                {initials}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-xs font-bold text-[#13241b] leading-none">{displayName}</p>
              <p className="text-[10px] text-[#5d7166] mt-0.5">{displayEmail}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-[#e4eae6] pt-16 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${menuReplie ? "md:-translate-x-full" : "md:translate-x-0"}`}
      >
        {/* Admin info */}
        <div className="px-5 py-4 border-b border-[#e4eae6]">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#006e2f] font-extrabold text-sm flex-shrink-0 bg-[#dcefe2]">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-[#13241b] text-sm truncate">{displayName}</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full"></span>
                <p className="text-[10px] text-[#5d7166] font-semibold">Accès complet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#8aa092]">
            Administration
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              const showReports = item.href === "/admin/signalements" && badges.reports > 0;
              const showComments = item.href === "/admin/commentaires" && badges.comments > 0;
              const showWithdrawals = item.href === "/admin/retraits-vendeurs" && badges.withdrawals > 0;
              // Toute autre page ayant des éléments en attente reçoit le même
              // repère — sans avoir à l'ajouter une par une ici.
              const aTraiter =
                !showReports && !showComments && !showWithdrawals ? (parPage[item.href] ?? 0) : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 ${
                      isActive
                        ? "bg-[#e6f5eb] text-[#006e2f] font-bold"
                        : "text-[#41544a] hover:bg-slate-50 hover:text-[#13241b] font-semibold"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`flex-shrink-0 ${isActive ? "text-[#006e2f]" : "text-[#7d9486]"}`}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                    {showReports && (
                      <span className="ml-auto bg-rose-100 text-rose-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                        {badges.reports}
                      </span>
                    )}
                    {showComments && (
                      <span className="ml-auto bg-amber-100 text-amber-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                        {badges.comments}
                      </span>
                    )}
                    {aTraiter > 0 && (
                      <span className="ml-auto bg-rose-100 text-rose-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                        {aTraiter}
                      </span>
                    )}
                    {showWithdrawals && (
                      <span className="ml-auto bg-amber-100 text-amber-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                        {badges.withdrawals}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-4 border-t border-[#e4eae6]">
            <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#8aa092]">
              Accès rapide
            </p>
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#41544a] hover:bg-slate-50 hover:text-[#13241b] transition-all duration-150"
            >
              <ExternalLink size={18} className="flex-shrink-0 text-[#7d9486]" />
              Voir la plateforme
            </Link>
            <Link
              href="/explorer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#41544a] hover:bg-slate-50 hover:text-[#13241b] transition-all duration-150"
            >
              <Store size={18} className="flex-shrink-0 text-[#7d9486]" />
              Marketplace
            </Link>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-[#e4eae6]">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`pt-16 min-h-screen transition-[margin] duration-300 ${menuReplie ? "" : "md:ml-64"}`}
      >
        {children}
      </main>
    </div>
  );
}
