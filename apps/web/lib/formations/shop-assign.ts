import { prisma } from "@/lib/prisma";

/**
 * Valide un `shopId` fourni par le vendeur pour (RE)AFFECTER un produit ou une
 * formation à l'une de SES boutiques, et renvoie le fragment de mise à jour de
 * relation Prisma à injecter dans un `update({ data: { shop: … } })`.
 *
 * On passe par la RELATION (`shop: { connect | disconnect }`), pas par la clé
 * étrangère brute `shopId` : quand la même mise à jour écrit aussi des relations
 * imbriquées (les fichiers d'un produit, par ex.), Prisma refuse la clé brute.
 * Même piège que pour la catégorie.
 *
 * Contrat :
 *  • champ absent du corps (`undefined`) → `undefined` : on ne touche pas.
 *  • champ vide (`null` / "") → `disconnect` : le produit n'est plus rattaché
 *    à une boutique (il reste visible côté vendeur, cf. filtre `shopId: null`).
 *  • id valide appartenant AU VENDEUR → `connect`.
 *  • id qui n'est pas une boutique du vendeur → on lève `SHOP_INVALIDE`
 *    (empêche d'attribuer son produit à la boutique d'un tiers).
 */
export async function resolveShopRelationUpdate(
  instructeurId: string,
  rawShopId: unknown,
): Promise<{ connect: { id: string } } | { disconnect: true } | undefined> {
  if (rawShopId === undefined) return undefined;
  if (rawShopId === null || rawShopId === "") return { disconnect: true };

  const id = String(rawShopId);
  const shop = await prisma.vendorShop.findFirst({
    where: { id, instructeurId },
    select: { id: true },
  });
  if (!shop) throw new Error("SHOP_INVALIDE");
  return { connect: { id: shop.id } };
}
