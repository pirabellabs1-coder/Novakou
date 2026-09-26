/**
 * Types et petites règles partagés par la marketplace publique (/explorer).
 * `Item` est le miroir exact de la réponse de
 * `app/api/formations/public/explorer/route.ts` — ne pas y ajouter de champ
 * que l'API ne renvoie pas.
 */
export type Item = {
  id: string;
  kind: "formation" | "product" | "bundle";
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  thumbnail: string | null;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  category: string | null;
  categorySlug?: string | null;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  type: string;
  seller: string;
  sellerAvatar: string | null;
  verified?: boolean;
  shortDesc?: string | null;
  createdAt: string;
};

export type CategoryMeta = { name: string; slug: string; icon: string | null; color: string | null };

export type ExplorerData = {
  formations: Item[];
  products: Item[];
  bundles: Item[];
  categories: CategoryMeta[];
  stats: { totalFormations: number; totalProducts: number; totalBundles: number; total: number };
};

export type Onglet = "all" | "formations" | "products" | "bundles";
export type Tri = "relevance" | "price-asc" | "price-desc" | "rating" | "recent";

/** Borne haute du curseur de prix : à cette valeur, aucun filtre n'est envoyé à l'API. */
export const PRIX_MAX_DEFAUT = 1_000_000;

/** Fiche publique de l'article selon sa nature. */
export function hrefArticle(item: Item): string {
  if (item.kind === "formation") return `/formation/${item.slug}`;
  if (item.kind === "bundle") return `/bundle/${item.slug}`;
  return `/produit/${item.slug}`;
}

/** Remise en % (null sans prix barré). */
export function remisePct(item: Item): number | null {
  if (!item.originalPrice || item.originalPrice <= item.price) return null;
  return Math.round((1 - item.price / item.originalPrice) * 100);
}

export type Badge = "Bestseller" | "Bien noté" | "Nouveau";

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;

/** Un seul badge de mérite par carte, du plus fort au plus faible : ventes, note, fraîcheur. */
export function badgeArticle(item: Item, maintenant = Date.now()): Badge | null {
  if (item.salesCount >= 50) return "Bestseller";
  if (item.rating >= 4.5 && item.reviewsCount >= 3) return "Bien noté";
  if (maintenant - new Date(item.createdAt).getTime() < SEPT_JOURS_MS) return "Nouveau";
  return null;
}

const LIBELLES_TYPE: Record<string, string> = {
  EBOOK: "E-book",
  PDF: "PDF",
  TEMPLATE: "Template",
  LICENCE: "Licence",
  AUDIO: "Audio",
  VIDEO: "Vidéo",
  AUTRE: "Fichier",
};

/** « EBOOK » → « E-book » ; les libellés déjà lisibles (« Formation vidéo », « Pack ») passent tels quels. */
export function libelleType(type: string): string {
  return LIBELLES_TYPE[type] ?? type;
}

/** Une description peut arriver en HTML (éditeur riche) : on n'en garde que le texte. */
export function sansHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Sélection « à la une » : ventes, puis note, puis nombre d'avis, puis fraîcheur. */
export function trierVedettes(items: Item[]): Item[] {
  return [...items].sort(
    (a, b) =>
      b.salesCount - a.salesCount ||
      b.rating - a.rating ||
      b.reviewsCount - a.reviewsCount ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
