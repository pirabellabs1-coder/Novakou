import { prisma } from "@/lib/prisma";
import {
  verifierFiche,
  problemesPublication,
  signauxValidationManuelle,
  type ProblemeFiche,
  type SignalValidation,
} from "@/lib/formations/product-quality";

/**
 * DÉCISION DE PUBLICATION — un seul juge pour les trois guichets.
 *
 * Un produit peut être publié depuis l'assistant de création, depuis la page
 * d'édition, ou par l'API publique (clé API). Trois chemins qui appliquaient
 * trois niveaux de contrôle différents : ce que l'un refusait, l'autre le
 * laissait passer. Tout passe désormais par ici.
 *
 * Régime HYBRIDE (décision fondateur, 2026-08-08, d'après son document de
 * règles de validation) :
 *   1. Compte suspendu/banni            → refus net (403).
 *   2. Fiche non conforme aux règles    → refus net (400) avec la liste des
 *      corrections (complétude, prix plancher, majuscules, promesses…).
 *   3. Fiche conforme MAIS signal       → EN_ATTENTE : la file de validation
 *      admin (prix > 500 000, vendeur sans KYC, e-mail non confirmé).
 *   4. Fiche conforme, aucun signal     → ACTIF, en ligne immédiatement.
 */
export type DecisionPublication =
  | { ok: false; httpStatus: 400 | 403; error: string; problemes?: ProblemeFiche[] }
  | { ok: true; statut: "ACTIF" | "EN_ATTENTE"; signaux: SignalValidation[] };

export async function decisionPublication(p: {
  /** Utilisateur (User.id) qui publie — pas l'InstructeurProfile. */
  userId: string;
  titre?: string | null;
  description?: string | null;
  prix?: number | null;
  vignetteUrl?: string | null;
  banniereUrl?: string | null;
  /** Les formations n'ont pas de champ bannière : ne l'exiger que pour les produits. */
  exigerBanniere: boolean;
}): Promise<DecisionPublication> {
  // ── 1. Éligibilité du vendeur ────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: p.userId },
    select: { status: true, kyc: true, emailVerified: true },
  });
  if (user && user.status !== "ACTIF") {
    return {
      ok: false,
      httpStatus: 403,
      error:
        "Votre compte est suspendu : la publication est désactivée. " +
        "Contactez le support pour comprendre pourquoi et rétablir votre accès.",
    };
  }

  // ── 2. Conformité de la fiche (refus automatique) ────────────────────────
  const problemes = [
    ...(await verifierFiche({
      titre: p.titre,
      description: p.description,
      prix: p.prix,
      vignetteUrl: p.vignetteUrl,
      banniereUrl: p.banniereUrl,
    })),
    ...problemesPublication({
      vignetteUrl: p.vignetteUrl,
      banniereUrl: p.banniereUrl,
      exigerBanniere: p.exigerBanniere,
    }),
  ];
  if (problemes.length > 0) {
    return {
      ok: false,
      httpStatus: 400,
      error: problemes.map((x) => x.message).join(" "),
      problemes,
    };
  }

  // ── 3. Signaux → validation manuelle ─────────────────────────────────────
  const signaux = signauxValidationManuelle({
    prix: p.prix,
    kycNiveau: user?.kyc ?? 1,
    // `emailVerified` est une date : null = jamais confirmé.
    emailVerifie: user ? user.emailVerified != null : true,
  });

  return { ok: true, statut: signaux.length > 0 ? "EN_ATTENTE" : "ACTIF", signaux };
}

/**
 * Prévient le vendeur que sa publication part en validation manuelle — sans
 * ça, il croit son produit en ligne et découvre l'attente par hasard.
 */
export async function notifierMiseEnAttente(p: {
  userId: string;
  titre: string;
}): Promise<void> {
  const { createNotification } = await import("@/lib/notifications/service");
  await createNotification({
    userId: p.userId,
    type: "system",
    title: "Produit soumis à validation",
    message:
      `« ${p.titre} » a bien été soumis. Il sera vérifié par l'équipe avant sa mise en ligne — ` +
      "vous serez notifié dès qu'il est approuvé.",
    link: "/vendeur/produits",
  }).catch(() => null);
}

/**
 * Trace un refus de publication dans la cloche du vendeur.
 *
 * Le bandeau affiché à l'écran explique la cause, mais il disparaît dès que le
 * vendeur le ferme — or il ferme souvent avant d'avoir tout corrigé. La même
 * cause déposée en notification reste consultable : il retrouve POURQUOI son
 * produit n'est pas en ligne, à tout moment, sans re-tenter la publication.
 */
export async function notifierRefusPublication(p: {
  userId: string;
  titre: string;
  raison: string;
}): Promise<void> {
  const { createNotification } = await import("@/lib/notifications/service");
  await createNotification({
    userId: p.userId,
    type: "system",
    title: "Publication refusée",
    message:
      `« ${p.titre} » n'a pas pu être mis en ligne. ${p.raison} ` +
      "Corrigez votre fiche puis relancez la publication.",
    link: "/vendeur/produits",
  }).catch(() => null);
}
