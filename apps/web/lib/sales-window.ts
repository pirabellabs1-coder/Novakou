/**
 * Fenêtre de vente : échéance affichée à l'acheteur.
 *
 * DÉCISION PRODUIT (fondateur, 2026-08-03) : le compte à rebours est un outil
 * d'urgence marketing, PAS un interrupteur de vente.
 *
 *   1. Arrivé à zéro, il repart tout seul pour un nouveau cycle. Personne n'a
 *      à rouvrir la vente à la main — un vendeur qui dort ne perd pas ses
 *      ventes du lendemain matin.
 *   2. Il ne bloque JAMAIS un achat. Avant, dépasser la date rendait le
 *      produit incommandable, y compris côté serveur : la page affichait
 *      « Vente terminée » et l'argent ne rentrait plus.
 *
 * Pour arrêter réellement de vendre, le vendeur dispose de deux leviers
 * explicites, qui eux bloquent : mettre le produit en pause (statut) ou fixer
 * un nombre maximum d'acheteurs.
 *
 * Ce module est PUR et partagé serveur/client : les deux doivent afficher et
 * décider la même chose, sinon le compte à rebours saute au chargement.
 */

/**
 * Durée d'un cycle une fois l'échéance initiale passée.
 *
 * 24 h : assez court pour que le décompte reste crédible (on voit des heures
 * et des minutes, pas « 6 jours »), assez long pour ne pas se réinitialiser
 * sous les yeux d'un acheteur qui lit la page.
 */
export const SALES_CYCLE_MS = 24 * 60 * 60 * 1000;

/**
 * Échéance réellement affichée.
 *
 * Tant que la date fixée par le vendeur est future, on la respecte telle
 * quelle — une vraie date de fin de promotion garde son sens. Une fois
 * dépassée, on avance de cycles entiers jusqu'à retomber dans le futur, en
 * conservant l'heure d'origine.
 *
 * @returns la date à afficher, ou null si le vendeur n'en a fixé aucune.
 */
export function effectiveSalesDeadline(
  salesEndAt: Date | string | null | undefined,
  now: number = Date.now(),
): Date | null {
  if (!salesEndAt) return null;
  const base = salesEndAt instanceof Date ? salesEndAt.getTime() : new Date(salesEndAt).getTime();
  if (!Number.isFinite(base)) return null;
  if (base > now) return new Date(base);

  // Nombre de cycles à ajouter pour repasser devant l'instant présent. Calcul
  // direct plutôt qu'une boucle : une échéance vieille de deux ans ferait
  // sinon 730 tours à chaque rendu.
  const cycles = Math.floor((now - base) / SALES_CYCLE_MS) + 1;
  return new Date(base + cycles * SALES_CYCLE_MS);
}

/**
 * Un produit est-il encore commandable ?
 *
 * Seul le nombre d'acheteurs peut fermer la vente. La date, jamais.
 */
export function isSaleOpen(opts: {
  maxBuyers?: number | null;
  currentBuyers?: number | null;
}): boolean {
  const max = opts.maxBuyers;
  if (typeof max !== "number" || max <= 0) return true;
  return Math.max(0, opts.currentBuyers ?? 0) < max;
}
