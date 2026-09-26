// Menu de l'administration — source unique, lue par admin/layout.tsx et par
// la coque des routes partagées (/kyc, /wallet, /messages).
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
  ExternalLink,
  Store,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import type { ShellNavItem, ShellNavSection } from "../SidebarNav";

type Entree = { icon: LucideIcon; label: string; href: string };

const ENTREES: Entree[] = [
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

/** Compteurs lus par le layout admin ; `parPage` : href → éléments en attente. */
export type CompteursAdmin = {
  signalements: number;
  commentaires: number;
  retraitsVendeurs: number;
  parPage: Record<string, number>;
};

/**
 * Menu de la coque : un compteur par entrée — signalements et commentaires
 * ont leur source dédiée ; toute autre page ayant des éléments en attente
 * reçoit le même repère, sans avoir à l'ajouter une par une ici.
 * Sans compteurs (routes partagées), aucun badge.
 */
export function sectionsAdmin({ compteurs }: { compteurs?: CompteursAdmin } = {}): ShellNavSection[] {
  const c: Partial<CompteursAdmin> = compteurs ?? {};
  const { signalements = 0, commentaires = 0, retraitsVendeurs = 0, parPage = {} } = c;
  const items = ENTREES.map((item): ShellNavItem => {
    let count = 0;
    let countTone: "rose" | "amber" = "rose";
    if (item.href === "/admin/signalements" && signalements > 0) {
      count = signalements;
    } else if (item.href === "/admin/commentaires" && commentaires > 0) {
      count = commentaires;
      countTone = "amber";
    } else if (item.href === "/admin/retraits-vendeurs" && retraitsVendeurs > 0) {
      count = retraitsVendeurs;
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
}
