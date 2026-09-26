// Menu de l'espace vendeur — source unique, lue par vendeur/layout.tsx et par
// la coque des routes partagées (/kyc, /wallet, /messages). Un lien ajouté
// ici apparaît partout ; il n'existe plus de copie à tenir « en miroir ».
import {
  LayoutDashboard,
  BarChart3,
  Store,
  Link2,
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
  Contact,
  Headphones,
  FolderOpen,
  KeyRound,
  Webhook,
  BookOpen,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { ShellNavItem, ShellNavSection } from "../SidebarNav";

export type CleCompteurVendeur = "abandons" | "inquiries" | "retraits";
export type CompteursVendeur = Record<CleCompteurVendeur, number>;

/**
 * Vote 13 — badges "à traiter" sur la sidebar vendeur.
 * Mapping route → clé compteur de l'endpoint /api/formations/vendeur/sidebar-counts :
 *   /vendeur/abandons  → abandons (CheckoutAttempt ABANDONED/FAILED non récupérés)
 *   /vendeur/inquiries → inquiries (ProductInquiry status="pending")
 *   /wallet            → retraits  (InstructorWithdrawal status="EN_ATTENTE")
 */
export const COMPTEUR_PAR_HREF: Record<string, CleCompteurVendeur> = {
  "/vendeur/abandons": "abandons",
  "/vendeur/inquiries": "inquiries",
  "/wallet": "retraits",
};

type Entree = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: "IA" | "Pro";
  section: string;
};

// Note : `Storefront` n'existe pas dans lucide-react — on utilise `Store` partout
// et on distingue produits (Store) vs boutiques (Store) par les labels.
const ENTREES: Entree[] = [
  // Vue
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendeur/dashboard", section: "Vue" },
  { icon: BarChart3, label: "Statistiques", href: "/vendeur/statistiques", section: "Vue" },
  // Catalogue
  { icon: Store, label: "Mes produits", href: "/vendeur/produits", section: "Catalogue" },
  { icon: Link2, label: "Liens de paiement", href: "/vendeur/liens-paiement", section: "Catalogue" },
  { icon: CreditCard, label: "Abonnements", href: "/vendeur/memberships", section: "Catalogue" },
  { icon: Layers, label: "Bundles", href: "/vendeur/bundles", section: "Catalogue" },
  { icon: Store, label: "Mes boutiques", href: "/vendeur/boutiques", section: "Catalogue" },
  { icon: Receipt, label: "Transactions", href: "/vendeur/transactions", section: "Catalogue" },
  { icon: Contact, label: "Clients", href: "/vendeur/clients", section: "Catalogue" },
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
  // « Mon profil » retiré du menu : dans le modèle multi-boutique, c'est
  // l'identité de la BOUTIQUE qui est publique, pas le profil personnel. Le
  // profil reste accessible via l'avatar en haut à droite et « Paramètres ».
  { icon: Users, label: "Équipe", href: "/vendeur/parametres/equipe", section: "Compte" },
  { icon: ShieldCheck, label: "Vérification KYC", href: "/kyc", section: "Compte" },
  { icon: Settings, label: "Paramètres", href: "/vendeur/parametres", section: "Compte" },
];

const LIBELLES_SECTIONS = Array.from(new Set(ENTREES.map((n) => n.section)));

/**
 * Menu de la coque : mêmes liens, compteurs « à traiter » (visibles seulement
 * au-delà de ce que le vendeur a déjà vu — `dejaVus`, mémorisé par le layout)
 * et pastilles IA / Pro. Sans compteurs (routes partagées), aucun badge.
 */
export function sectionsVendeur({
  compteurs,
  dejaVus = {},
}: {
  compteurs?: CompteursVendeur;
  dejaVus?: Partial<CompteursVendeur>;
} = {}): ShellNavSection[] {
  return LIBELLES_SECTIONS.map((label) => ({
    label,
    items: ENTREES.filter((n) => n.section === label).map((item): ShellNavItem => {
      const cle = COMPTEUR_PAR_HREF[item.href];
      const count = cle && compteurs ? compteurs[cle] : 0;
      const afficher = cle ? count > (dejaVus[cle] ?? 0) : false;
      return {
        icon: item.icon,
        label: item.label,
        href: item.href,
        count: afficher ? count : 0,
        countLabel: "à traiter",
        tag: item.badge ? { label: item.badge, tone: item.badge === "Pro" ? "amber" : "green" } : undefined,
      };
    }),
  }));
}
