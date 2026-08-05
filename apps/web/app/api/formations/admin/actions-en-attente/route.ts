import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/admin/actions-en-attente
 *
 * CE QUI ATTEND VRAIMENT UNE DÉCISION DE L'ADMIN.
 *
 * Le menu admin comptait vingt-trois entrées, toutes identiques : rien ne
 * disait qu'une vérification d'identité dormait depuis trois jours ou qu'un
 * retrait attendait d'être versé. Il fallait ouvrir chaque page pour le
 * découvrir — donc on ne le découvrait pas.
 *
 * On ne compte QUE ce qui appelle un geste. Un retrait déjà traité, une pièce
 * déjà validée n'apparaissent pas : un compteur qui ne retombe jamais à zéro
 * cesse d'être lu, exactement comme une alerte qui crie tout le temps.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token?.role?.toString().toUpperCase() !== "ADMIN" && !IS_DEV) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }

  // Chaque compteur est isolé : une table absente ou renommée ne doit pas
  // faire disparaître TOUS les badges du menu.
  const compter = async (fn: () => Promise<number>) => fn().catch(() => 0);

  const [kyc, retraitsVendeurs, retraitsAffilies, retraitsPlateforme, suppressions] =
    await Promise.all([
      compter(() => prisma.kycRequest.count({ where: { status: "EN_ATTENTE" } })),
      compter(() => prisma.instructorWithdrawal.count({ where: { status: "EN_ATTENTE" } })),
      compter(() => prisma.affiliateWithdrawal.count({ where: { status: "EN_ATTENTE" } })),
      compter(() => prisma.platformPayout.count({ where: { status: "EN_ATTENTE" } })),
      compter(() =>
        prisma.accountDeletionRequest.count({ where: { status: "AWAITING_REVIEW" } }),
      ),
    ]);

  const parPage: Record<string, number> = {
    "/admin/kyc": kyc,
    "/admin/retraits-vendeurs": retraitsVendeurs,
    "/admin/affiliate-withdrawals": retraitsAffilies,
    "/admin/retraits": retraitsPlateforme,
    "/admin/suppressions": suppressions,
  };

  return NextResponse.json({
    data: {
      parPage,
      total: Object.values(parPage).reduce((s, n) => s + n, 0),
    },
  });
}
