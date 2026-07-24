import { prisma } from "@/lib/prisma";

/**
 * Vérifie que toutes les formations/produits « liés » (plan d'abonnement,
 * bundle, order-bump…) appartiennent bien au vendeur `instructeurId`.
 * Renvoie les ids ÉTRANGERS (tableaux vides = tout appartient au vendeur).
 *
 * Sans ce contrôle, un vendeur peut lier le contenu payant d'un AUTRE vendeur
 * à son propre plan à 500 FCFA : via `access.ts` (accès accordé dès qu'un
 * abonnement actif liste l'id), ses abonnés obtiendraient gratuitement le
 * contenu d'autrui — vol de contenu + détournement de revenu.
 */
export async function findForeignLinkedIds(
  instructeurId: string,
  formationIds: string[],
  productIds: string[],
): Promise<{ foreignFormationIds: string[]; foreignProductIds: string[] }> {
  const [ownedF, ownedP] = await Promise.all([
    formationIds.length
      ? prisma.formation.findMany({
          where: { id: { in: formationIds }, instructeurId },
          select: { id: true },
        })
      : Promise.resolve([] as { id: string }[]),
    productIds.length
      ? prisma.digitalProduct.findMany({
          where: { id: { in: productIds }, instructeurId },
          select: { id: true },
        })
      : Promise.resolve([] as { id: string }[]),
  ]);
  const ownedFSet = new Set(ownedF.map((x) => x.id));
  const ownedPSet = new Set(ownedP.map((x) => x.id));
  return {
    foreignFormationIds: formationIds.filter((id) => !ownedFSet.has(id)),
    foreignProductIds: productIds.filter((id) => !ownedPSet.has(id)),
  };
}
