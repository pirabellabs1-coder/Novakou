// Profil instructeur : accès réel à la base.
//
// ⚠️ Ce fichier était un BOUCHON : `getOrCreateInstructeurProfile()` renvoyait
// `{ id: userId }` sans jamais interroger la base. Tous les appelants (les
// routes /api/marketing/**) filtraient donc leurs requêtes sur
// `instructeurId = <identifiant d'UTILISATEUR>`, qui ne correspond à aucune
// ligne : l'écran « Analytics marketing » affichait zéro vente et zéro revenu
// pour TOUS les vendeurs, quelle que soit leur activité réelle.
//
// On délègue désormais à l'implémentation de référence
// (lib/formations/instructeur.ts), celle qu'utilise déjà tout l'espace vendeur :
// upsert atomique, donc le profil existe toujours au retour.

import { getOrCreateInstructeur } from "@/lib/formations/instructeur";
import { prisma } from "@/lib/prisma";

/**
 * Renvoie le profil instructeur du compte (créé à la volée s'il n'existe pas).
 * Lève si l'utilisateur n'existe plus : un appelant ne doit jamais continuer
 * avec un identifiant inventé, sous peine de requêtes filtrées sur du vide.
 */
export async function getOrCreateInstructeurProfile(userId: string) {
  const profil = await getOrCreateInstructeur(userId);
  if (!profil) {
    throw new Error("Profil instructeur introuvable pour l'utilisateur " + userId);
  }
  return profil;
}

/** Statistiques agrégées d'un instructeur (ventes, revenus, avis, catalogue). */
export async function getInstructeurStats(instructeurId: string) {
  const [formations, produits, avis, inscriptions, achats] = await Promise.all([
    prisma.formation.findMany({ where: { instructeurId }, select: { id: true } }),
    prisma.digitalProduct.findMany({ where: { instructeurId }, select: { id: true } }),
    prisma.formationReview.aggregate({
      where: { formation: { instructeurId } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.enrollment.findMany({
      where: { formation: { instructeurId }, refundedAt: null },
      select: { paidAmount: true, userId: true },
    }),
    prisma.digitalProductPurchase.findMany({
      where: { product: { instructeurId } },
      select: { paidAmount: true, userId: true },
    }),
  ]);

  const acheteurs = new Set([...inscriptions.map((i) => i.userId), ...achats.map((a) => a.userId)]);

  return {
    totalVentes: inscriptions.length + achats.length,
    totalRevenu:
      inscriptions.reduce((s, i) => s + i.paidAmount, 0) + achats.reduce((s, a) => s + a.paidAmount, 0),
    noteMoyenne: Math.round((avis._avg.rating ?? 0) * 10) / 10,
    nombreAvis: avis._count._all,
    nombreProduits: formations.length + produits.length,
    nombreApprenants: acheteurs.size,
  };
}
