// Menu de l'espace affilié — source unique, lue par affilie/layout.tsx et par
// la coque des routes partagées (/kyc, /wallet, /messages).
import { ArrowLeftRight, Banknote, BarChart3, Link2, Settings, Trophy, Wallet } from "lucide-react";
import type { ShellNavSection } from "../SidebarNav";

export const SECTIONS_AFFILIE: ShellNavSection[] = [
  {
    label: "Affiliation",
    items: [
      { icon: BarChart3, label: "Tableau de bord", href: "/affilie/dashboard" },
      { icon: Link2, label: "Mes liens", href: "/affilie/liens" },
      { icon: Banknote, label: "Commissions", href: "/affilie/commissions" },
      { icon: Wallet, label: "Retraits", href: "/affilie/retraits" },
      { icon: Trophy, label: "Performances", href: "/affilie/performances" },
      { icon: Settings, label: "Paramètres", href: "/affilie/parametres" },
    ],
  },
  {
    label: "Autres espaces",
    items: [{ icon: ArrowLeftRight, label: "Espace apprenant", href: "/apprenant/dashboard" }],
  },
];
