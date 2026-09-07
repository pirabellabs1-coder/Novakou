import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { isSecretBoxReady } from "@/lib/crypto/secret-box";
import { chiffrerSecretTotp, secretTotpEstChiffre } from "@/lib/crypto/two-factor-secret";

/**
 * GET /api/cron/chiffrer-secrets-2fa
 *
 * AUCUN SECRET TOTP NE DOIT RESTER EN CLAIR EN BASE.
 *
 * `User.twoFactorSecret` était écrit en clair. Un dump de la base — sauvegarde
 * égarée, accès en lecture d'un prestataire — livrait donc le second facteur en
 * même temps que le mot de passe haché, et le deuxième facteur cessait d'en
 * être un. La 2FA étant obligatoire et non contournable pour les comptes ADMIN,
 * c'est la porte d'entrée de la plateforme qui était concernée.
 *
 * L'écriture est désormais chiffrée à la source (`setup-2fa`). Cette tâche
 * reprend l'existant et sert ensuite de filet : si une ligne en clair réapparaît
 * un jour — un chemin oublié, une restauration de sauvegarde — elle est reprise
 * au passage suivant au lieu de dormir indéfiniment.
 *
 * ⚠️ Pourquoi ici et pas dans un script : `PAYMENT_CREDENTIALS_KEY` est déclarée
 * « sensitive » sur Vercel, donc illisible en dehors du serveur, y compris par
 * l'API. Un script local produirait un chiffré que la production ne saurait pas
 * relire — et 2FA cassée pour tout le monde. Le rattrapage doit tourner là où
 * vit la clé.
 *
 * Deux traitements :
 *   • 2FA ACTIVE                     → le secret est chiffré, transparent.
 *   • 2FA jamais activée, ligne plus  → le secret est SUPPRIMÉ. Un secret
 *     vieille que 24 h                  d'installation abandonnée n'authentifie
 *                                       personne ; le chiffrer protégerait une
 *                                       donnée qui n'a pas lieu d'exister.
 *     Les lignes récentes sont chiffrées, jamais purgées : une installation
 *     peut être en cours à la seconde près.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Au-delà, une installation jamais confirmée est considérée abandonnée. */
const AGE_ABANDON_MS = 24 * 60 * 60 * 1000;

/** Plafond par passage : la tâche est un filet, pas un traitement de masse. */
const MAX_LIGNES = 500;

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  if (!isSecretBoxReady()) {
    // Fail-closed et bruyant : sans la clé, on ne touche à RIEN. Réécrire en
    // clair « en attendant » est exactement ce qu'on cherche à supprimer.
    return NextResponse.json(
      { ok: false, erreur: "PAYMENT_CREDENTIALS_KEY absente ou invalide : aucun secret traité." },
      { status: 503 },
    );
  }

  const lignes = await prisma.user.findMany({
    where: { NOT: { twoFactorSecret: null } },
    select: { id: true, twoFactorEnabled: true, twoFactorSecret: true, updatedAt: true },
    take: MAX_LIGNES,
  });

  const maintenant = Date.now();
  let chiffres = 0;
  let purges = 0;
  let deja = 0;
  const echecs: string[] = [];

  for (const u of lignes) {
    const secret = u.twoFactorSecret;
    if (!secret || secretTotpEstChiffre(secret)) {
      deja++;
      continue;
    }

    const abandonne =
      !u.twoFactorEnabled && maintenant - u.updatedAt.getTime() > AGE_ABANDON_MS;

    try {
      if (abandonne) {
        await prisma.user.update({
          where: { id: u.id },
          data: { twoFactorSecret: null, twoFactorVerifiedAt: null },
        });
        purges++;
      } else {
        await prisma.user.update({
          where: { id: u.id },
          data: { twoFactorSecret: chiffrerSecretTotp(secret) },
        });
        chiffres++;
      }
    } catch (err) {
      // Jamais l'identité de l'utilisateur dans une réponse HTTP : l'id suffit
      // à retrouver la ligne dans les logs.
      echecs.push(u.id);
      console.error("[chiffrer-secrets-2fa] échec sur", u.id, err);
    }
  }

  return NextResponse.json({
    ok: echecs.length === 0,
    examines: lignes.length,
    chiffres,
    purges,
    dejaChiffres: deja,
    echecs: echecs.length,
  });
}
