// Menu mentor affiché sur les routes partagées (/kyc, /wallet, /messages).
//
// ⚠️ Reprise telle quelle du menu mentor de l'ancienne coque partagée : c'est
// celui que les mentors voyaient déjà sur ces routes. Le layout de l'espace
// mentor (mentor/layout.tsx, pas encore passé sur la coque commune) garde son
// propre menu, qui diverge (rendez-vous, coach IA, paramètres ; pas de
// /wallet). Quand ce layout migrera, il devra lire CE module — et les deux
// listes seront alors à réconcilier en une seule.
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  FolderOpen,
  Wallet,
  Receipt,
  MessageSquare,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import type { ShellNavSection } from "../SidebarNav";

export const SECTIONS_MENTOR: ShellNavSection[] = [
  {
    label: "Vue",
    items: [
      { icon: LayoutDashboard, label: "Tableau de bord", href: "/mentor/dashboard" },
      { icon: Users, label: "Mes apprenants", href: "/mentor/apprenants" },
      { icon: Calendar, label: "Mon calendrier", href: "/mentor/calendrier" },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { icon: Package, label: "Packs de sessions", href: "/mentor/packs" },
      { icon: FolderOpen, label: "Ressources", href: "/mentor/ressources" },
    ],
  },
  {
    label: "Finances",
    items: [
      { icon: Wallet, label: "Revenus & retraits", href: "/wallet" },
      { icon: Receipt, label: "Finances", href: "/mentor/finances" },
    ],
  },
  {
    label: "Engagement",
    items: [{ icon: MessageSquare, label: "Messages", href: "/messages" }],
  },
  {
    label: "Compte",
    items: [
      { icon: ShieldCheck, label: "Vérification KYC", href: "/kyc" },
      { icon: UserCircle, label: "Mon profil", href: "/mentor/profil" },
    ],
  },
];
