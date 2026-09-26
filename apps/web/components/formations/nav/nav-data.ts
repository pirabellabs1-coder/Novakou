import type { NavIconName } from "./icons";

/**
 * Contenu du menu public : libellés, destinations et ancres. Rien ici ne
 * dépend du rendu — les composants (barre, méga-menus, menu mobile) lisent
 * la même source, donc desktop et mobile ne peuvent pas diverger.
 */

export type NavLink = { href: string; label: string; mega?: boolean; dropdown?: boolean };

export const NAV_LINKS: NavLink[] = [
  // L'entrée « Explorer » pointait vers l'accueil, juste à côté du logo qui y
  // mène déjà : deux chemins vers la même page, dont un qui portait le nom
  // d'une AUTRE page du menu (« Marketplace », soit /explorer). Retirée pour
  // que chaque entrée désigne une destination distincte.
  { href: "/explorer", label: "Marketplace" },
  { href: "/fonctionnalites", label: "Fonctionnalités", mega: true },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/affiliation", label: "Affiliation" },
  { href: "/mentors", label: "Mentorat" },
  { href: "/academie", label: "Ressources", dropdown: true },
];

export type NavItem = { href: string; icon: NavIconName; label: string; desc: string };

export const RESOURCE_LINKS: NavItem[] = [
  { href: "/academie", icon: "school", label: "Académie", desc: "Guides & ebooks gratuits" },
  { href: "/guides", icon: "article", label: "Blog & guides", desc: "Conseils pour vendre plus" },
];

export const FEATURE_CATEGORIES: { title: string; items: NavItem[] }[] = [
  {
    title: "Vendre",
    items: [
      { icon: "storefront", label: "Boutique en ligne", desc: "Votre vitrine pro en 3 min", href: "/fonctionnalites#boutique" },
      { icon: "account_tree", label: "Tunnels de vente", desc: "Funnels qui convertissent", href: "/fonctionnalites#funnels" },
      { icon: "sell", label: "Pricing flexible", desc: "Forfaits, promos, coupons", href: "/fonctionnalites#pricing" },
    ],
  },
  {
    title: "Encaisser",
    items: [
      { icon: "account_balance_wallet", label: "Mobile Money", desc: "Wave, Orange, MTN — 17 pays", href: "/fonctionnalites#paiements" },
      { icon: "credit_card", label: "Carte & PayPal", desc: "Visa, Mastercard, SEPA", href: "/fonctionnalites#paiements" },
      { icon: "payments", label: "Retraits rapides", desc: "Sous 24-48h sur votre compte", href: "/fonctionnalites#retraits" },
    ],
  },
  {
    title: "Créer",
    items: [
      { icon: "auto_awesome", label: "Assistant IA", desc: "Rédaction, structure, quiz", href: "/fonctionnalites#ia" },
      { icon: "play_circle", label: "Hébergement vidéo", desc: "Vidéos sécurisées incluses", href: "/fonctionnalites#video" },
      { icon: "workspace_premium", label: "Certificats", desc: "Diplômes auto-générés", href: "/fonctionnalites#certificats" },
    ],
  },
  {
    title: "Automatiser",
    items: [
      { icon: "mail", label: "Emails automatiques", desc: "Séquences & notifications", href: "/fonctionnalites#emails" },
      { icon: "bolt", label: "Automatisations", desc: "Workflows sans code", href: "/fonctionnalites#automatisations" },
      { icon: "group", label: "Affiliation", desc: "Vos clients deviennent vendeurs", href: "/fonctionnalites#affiliation" },
    ],
  },
];

/** Colonne de mise en avant du méga-menu (desktop uniquement). */
export const FEATURE_HIGHLIGHTS = [
  {
    href: "/fonctionnalites#ia",
    eyebrow: "Studio IA",
    title: "Créez plus vite avec l'IA",
    desc: "Plan de cours, quiz et page de vente rédigés avec vous.",
    cta: "Découvrir",
    tone: "dark" as const,
  },
  {
    href: "/fonctionnalites#paiements",
    eyebrow: "Mobile Money",
    title: "Wave, Orange Money, MTN MoMo",
    desc: "Encaissez dans 17 pays, retraits sous 24–48 h.",
    cta: "Voir les paiements",
    tone: "tint" as const,
  },
];

/** Page courante : correspondance exacte ou sous-chemin (les ancres sont ignorées). */
export function isActivePath(pathname: string, href: string): boolean {
  const base = href.split("#")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isFeaturesPath(pathname: string): boolean {
  return isActivePath(pathname, "/fonctionnalites");
}

export function isResourcesPath(pathname: string): boolean {
  return RESOURCE_LINKS.some((l) => isActivePath(pathname, l.href));
}
