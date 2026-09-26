// Coque commune DashboardShell (2026-09-26) : la garde 2FA et le contrôle de
// rôle restent dans le middleware ; ici seulement le menu, les compteurs et
// le repli mémorisé. L'habillage vit dans components/formations/dashboard.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  Shield,
  ExternalLink,
  Store,
  LogOut,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { NovakouNotificationBell } from "@/components/notifications/NovakouNotificationBell";
import { ADMIN_ROLE_LABELS, ALL_ADMIN_ROLES, type AdminRole } from "@/lib/admin-permissions";
import {
  DashboardShell,
  ShellStatusCard,
  ShellUserChip,
  initiales,
} from "@/components/formations/dashboard/DashboardShell";
import type { ShellNavItem, ShellNavSection } from "@/components/formations/dashboard/SidebarNav";

type NavItem = { icon: LucideIcon; label: string; href: string };

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Vue générale", href: "/admin/dashboard" },
  { icon: BrainCircuit, label: "IA Assistant", href: "/admin/ai-assistant" },
  { icon: Bot, label: "Agents IA", href: "/admin/agents" },
  { icon: Package, label: "Produits", href: "/admin/produits" },
  { icon: Users, label: "Utilisateurs", href: "/admin/utilisateurs" },
  { icon: Globe, label: "Par pays", href: "/admin/pays" },
  { icon: Receipt, label: "Transactions", href: "/admin/transactions" },
  // Trésorerie — une seule vue sur l'argent : soldes réels chez chaque
  // passerelle + journal de tous les mouvements (encaissements et versements)
  // avec la passerelle qui les a portés, pour la comptabilité.
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

const ACCES_RAPIDE: ShellNavItem[] = [
  { icon: ExternalLink, label: "Voir la plateforme", href: "/" },
  { icon: Store, label: "Marketplace", href: "/explorer" },
];

type BadgeCounts = { reports: number; comments: number; withdrawals: number };
// Référence stable tant que l'API n'a pas répondu.
const PAR_PAGE_VIDE: Record<string, number> = {};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Repli du menu SUR ORDINATEUR (demande fondateur) : le hamburger ne servait
  // qu'au mobile, impossible de fermer le menu sur grand écran pour élargir
  // les tableaux (produits, transactions…). Le choix est mémorisé. Le tiroir
  // mobile est géré par la coque.
  const [menuReplie, setMenuReplie] = useState(false);
  useEffect(() => {
    setMenuReplie(window.localStorage.getItem("novakou:admin-menu-replie") === "1");
  }, []);
  const basculerMenu = () => {
    setMenuReplie((v) => {
      window.localStorage.setItem("novakou:admin-menu-replie", v ? "0" : "1");
      return !v;
    });
  };
  const { data: session } = useSession();

  const displayName = session?.user?.name ?? "Super Admin";
  const displayEmail = session?.user?.email ?? "admin@novakou.com";
  const initials = initiales(session?.user?.name, "AD");
  const avatarUrl = session?.user?.image;
  // Sous-rôle porté par la session (lib/admin-permissions) : affiché, jamais
  // décidé ici — les permissions sont contrôlées côté API.
  const adminRole = session?.user?.adminRole;
  const statut =
    adminRole && adminRole !== "super_admin" && (ALL_ADMIN_ROLES as string[]).includes(adminRole)
      ? ADMIN_ROLE_LABELS[adminRole as AdminRole]
      : "Accès complet";

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
  const parPage = enAttente?.data?.parPage ?? PAR_PAGE_VIDE;
  const total = enAttente?.data?.total ?? 0;

  const badges: BadgeCounts = {
    reports: dashRes?.data?.quickStats?.pendingReports ?? 0,
    comments: commentsRes?.summary?.withoutResponse ?? 0,
    withdrawals: parPage["/admin/retraits-vendeurs"] ?? 0,
  };
  const { reports, comments, withdrawals } = badges;

  // Menu de la coque : un compteur par entrée — signalements et commentaires
  // ont leur source dédiée ; toute autre page ayant des éléments en attente
  // reçoit le même repère, sans avoir à l'ajouter une par une ici.
  const sections = useMemo<ShellNavSection[]>(() => {
    const items = navItems.map((item): ShellNavItem => {
      let count = 0;
      let countTone: "rose" | "amber" = "rose";
      if (item.href === "/admin/signalements" && reports > 0) {
        count = reports;
      } else if (item.href === "/admin/commentaires" && comments > 0) {
        count = comments;
        countTone = "amber";
      } else if (item.href === "/admin/retraits-vendeurs" && withdrawals > 0) {
        count = withdrawals;
        countTone = "amber";
      } else {
        count = parPage[item.href] ?? 0;
      }
      return { icon: item.icon, label: item.label, href: item.href, count, countTone, countLabel: "en attente" };
    });
    return [
      { label: "Administration", items },
      { label: "Accès rapide", items: ACCES_RAPIDE },
    ];
  }, [reports, comments, withdrawals, parPage]);

  return (
    <DashboardShell
      space="admin"
      spaceLabel="Administration"
      homeHref="/admin/dashboard"
      sections={sections}
      collapse={{ mode: "hidden", collapsed: menuReplie, onToggle: basculerMenu }}
      topStart={
        <span className="nkd__chip nkd__chip--dark nkd__chip--sm">
          <Shield aria-hidden="true" />
          Admin
        </span>
      }
      topEnd={
        <>
          {/* Repère global : un point rouge dès qu'une décision attend quelque
              part, visible depuis N'IMPORTE QUELLE page admin. Sans lui, il
              fallait déjà être dans le menu pour voir les compteurs — donc
              savoir qu'il fallait regarder. */}
          {total > 0 && (
            <span className="nkd__chip nkd__chip--rose nkd__chip--md" title="Éléments en attente d'une décision">
              <span className="nkd__live" aria-hidden="true" />
              {total} à traiter
            </span>
          )}
          <div className="nkd__bell">
            <NovakouNotificationBell tone="light" viewAllHref="/admin/notifications" />
          </div>
          <Link href="/admin/configuration" title="Configuration" aria-label="Configuration" className="nkd__ibtn">
            <Settings aria-hidden="true" />
          </Link>
          <ShellUserChip name={displayName} subtitle={displayEmail} src={avatarUrl} initials={initials} />
        </>
      }
      sidebarCard={<ShellStatusCard title={displayName} status={statut} src={avatarUrl} initials={initials} />}
      sidebarFoot={
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="nkd-btn nkd-btn--danger nkd-btn--block"
        >
          <LogOut aria-hidden="true" />
          Déconnexion
        </button>
      }
    >
      {children}
    </DashboardShell>
  );
}
