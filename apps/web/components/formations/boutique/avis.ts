import type { ShopReview } from "./types";
import { prenom } from "./format";

/** Avis tel que Prisma le renvoie, une fois le titre de l'article aplati. */
export interface AvisBrut {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  user: { name: string | null } | null;
  titre: string;
}

/**
 * Fusionne les avis de formations et de produits d'une boutique en une seule
 * liste, du plus récent au plus ancien, sans commentaire vide. L'auteur est
 * réduit à son prénom : un acheteur n'a pas demandé à être exposé sur la
 * vitrine d'un vendeur.
 */
export function fusionnerAvis(listes: AvisBrut[][], max = 6): ShopReview[] {
  return listes
    .flat()
    .filter((a) => a.comment.trim().length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, max)
    .map((a) => ({
      id: a.id,
      rating: Math.max(1, Math.min(5, Math.round(a.rating))),
      comment: a.comment.trim(),
      author: prenom(a.user?.name),
      date: new Date(a.createdAt).toISOString(),
      itemTitle: a.titre,
    }));
}
