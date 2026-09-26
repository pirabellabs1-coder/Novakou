/**
 * Types partagés de la vitrine d'une boutique. Les pages serveur
 * (`app/boutique/**`) construisent ces objets ; `BoutiqueView` et ses
 * sections les consomment.
 */

export type ShopItemKind = "formation" | "product" | "bundle" | "subscription";

export interface ShopItem {
  kind: ShopItemKind;
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  isFree: boolean;
  rating: number;
  /** apprenants / ventes / acheteurs / abonnés */
  count: number;
  reviewsCount?: number;
  // Pack
  originalPrice?: number | null;
  itemsCount?: number;
  // Abonnement
  interval?: "monthly" | "yearly";
  trialDays?: number | null;
  description?: string;
}

export interface ShopOwner {
  name: string;
  email: string | null;
  image: string | null;
  coverUrl?: string | null;
  bio: string | null;
  kind: "vendor" | "mentor";
  domain: string | null;
  themeColor?: string | null;
}

/** Réseaux et moyens de contact PUBLICS de la boutique (jamais ceux du compte). */
export interface ShopSocials {
  email?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
}

export interface ShopReview {
  id: string;
  rating: number;
  comment: string;
  /** Prénom seulement : un acheteur n'a pas demandé à être exposé. */
  author: string;
  /** ISO 8601 */
  date: string;
  itemTitle: string;
}

export const KIND_LABEL: Record<ShopItemKind, string> = {
  formation: "Formation",
  product: "Produit",
  bundle: "Pack",
  subscription: "Abonnement",
};

/** Lien vers la fiche — mêmes formes que la marketplace (le middleware
 *  redirige `/produit/x` vers l'adresse courte `/x`). */
export function hrefItem(item: ShopItem): string {
  if (item.kind === "formation") return `/formation/${item.slug}`;
  if (item.kind === "product") return `/produit/${item.slug}`;
  if (item.kind === "bundle") return `/bundle/${item.slug}`;
  return `/abonnement/${item.id}`;
}

export function estGratuit(item: ShopItem): boolean {
  return item.isFree || item.price === 0;
}
