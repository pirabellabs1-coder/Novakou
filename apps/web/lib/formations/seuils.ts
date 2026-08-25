/**
 * SEUIL DE VISIBILITÉ MARKETPLACE (décision fondateur, 2026-08-24).
 *
 * L'ancienne règle REFUSAIT la publication d'un produit payant sous
 * 1 000 FCFA. La nouvelle ne bloque rien : le vendeur fixe librement son
 * prix, le produit reste publié, vendable sur sa boutique et par lien
 * direct — mais sous ce seuil il N'APPARAÎT PAS sur la marketplace
 * publique (explorer, meilleures ventes, recommandations publiques).
 *
 * Le gratuit (0 FCFA) reste visible : c'est un outil d'acquisition, pas
 * un « payant dérisoire ».
 *
 * Ce fichier est volontairement sans dépendance : la constante sert aux
 * requêtes serveur ET aux écrans vendeur (message sous le champ prix).
 */
export const SEUIL_MARKETPLACE_FCFA = 1000;

/**
 * Clause Prisma à joindre (via `AND`) à toute requête de listing de la
 * marketplace publique. En `AND` et non étalée : plusieurs de ces requêtes
 * construisent déjà leur propre `OR` de recherche, qu'un étalement écraserait.
 */
// Pas de `as const` : Prisma exige des tableaux mutables dans ses `where`.
export const FILTRE_PRIX_MARKETPLACE = {
  OR: [{ price: 0 }, { price: { gte: SEUIL_MARKETPLACE_FCFA } }],
};
