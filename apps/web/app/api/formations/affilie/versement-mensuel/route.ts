import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import {
  decrireDestination,
  ecrireDestination,
  lireDestination,
  validerDestination,
} from "@/lib/payout/versement-mensuel-affilie";
import { sendMoyenVersementModifieEmail } from "@/lib/email/withdrawals";

/**
 * /api/formations/affilie/versement-mensuel
 *
 * Le moyen vers lequel partent les commissions validées, automatiquement le 5
 * de chaque mois (cron/affiliate-payout).
 *   GET    → le moyen enregistré (numéro masqué) ou null
 *   PUT    → l'enregistrer { method, msisdn, country? }
 *   DELETE → désactiver le versement automatique
 *
 * Tout changement est signalé par e-mail au titulaire : détourner les
 * versements est la première chose que tenterait quelqu'un qui a pris la main
 * sur le compte.
 */

const schema = z.object({
  method: z.string().min(2).max(64),
  msisdn: z.string().min(6).max(32),
  country: z.string().max(64).optional(),
});

/** Profil affilié de la session ; `NextResponse` d'erreur s'il n'y en a pas. */
async function profilConnecte() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const profil = await prisma.affiliateProfile.findUnique({
    where: { userId },
    select: { id: true, bankDetails: true, user: { select: { email: true, name: true } } },
  });
  return profil ?? NextResponse.json({ error: "Profil affilié introuvable" }, { status: 404 });
}

export async function GET() {
  try {
    const profil = await profilConnecte();
    if (profil instanceof NextResponse) return profil;
    const d = lireDestination(profil.bankDetails);
    return NextResponse.json({ data: d ? { method: d.method, libelle: decrireDestination(d) } : null });
  } catch (err) {
    console.error("[affilie/versement-mensuel GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profil = await profilConnecte();
    if (profil instanceof NextResponse) return profil;

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const v = validerDestination(parsed.data);
    if (!v.ok) return NextResponse.json({ error: v.erreur, code: v.code }, { status: 400 });

    await prisma.affiliateProfile.update({
      where: { id: profil.id },
      data: { bankDetails: ecrireDestination(profil.bankDetails, v.destination) },
    });
    const libelle = decrireDestination(v.destination);
    await sendMoyenVersementModifieEmail(profil.user?.email ?? "", profil.user?.name, libelle);
    return NextResponse.json({ data: { method: v.destination.method, libelle } });
  } catch (err) {
    console.error("[affilie/versement-mensuel PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const profil = await profilConnecte();
    if (profil instanceof NextResponse) return profil;
    if (!lireDestination(profil.bankDetails)) return NextResponse.json({ data: null });

    await prisma.affiliateProfile.update({
      where: { id: profil.id },
      data: { bankDetails: ecrireDestination(profil.bankDetails, null) },
    });
    await sendMoyenVersementModifieEmail(profil.user?.email ?? "", profil.user?.name, null);
    return NextResponse.json({ data: null });
  } catch (err) {
    console.error("[affilie/versement-mensuel DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
