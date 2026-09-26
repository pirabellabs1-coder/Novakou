// Menu de l'espace apprenant — source unique, lue par apprenant/layout.tsx et
// par la coque des routes partagées (/kyc, /wallet, /messages).
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
import type { ShellNavItem, ShellNavSection } from "../SidebarNav";

type Entree = {
  icon: LucideIcon;
  label: string;
  href: string;
  /** Porte le compteur d'articles du panier. */
  badge?: boolean;
};

const SECTIONS: { label: string; items: Entree[] }[] = [
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

/**
 * Menu de la coque : les sections vides ne s'affichent pas ; le panier porte
 * le compteur d'articles (`panier`, lu par le layout). Sans compteur, rien.
 */
export function sectionsApprenant({ panier = 0 }: { panier?: number } = {}): ShellNavSection[] {
  return SECTIONS.filter((s) => s.items.length > 0).map((s) => ({
    label: s.label,
    items: s.items.map(
      (it): ShellNavItem => ({
        icon: it.icon,
        label: it.label,
        href: it.href,
        count: it.badge ? panier : 0,
        countTone: "green",
        countLabel: "articles dans le panier",
      }),
    ),
  }));
}
