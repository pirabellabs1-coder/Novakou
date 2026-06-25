import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * PATCH /api/formations/vendeur/goal
 * Body : { monthlyGoal: number | null }
 *
 * Permet au vendeur de fixer lui-même son objectif de revenu mensuel (FCFA).
 * `null` (ou 0) → retour à l'objectif automatique par défaut.
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx?.instructeurId) {
      return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const raw = body.monthlyGoal;
    // null / 0 → objectif auto ; sinon entier positif borné (max 1 milliard FCFA)
    let monthlyGoal: number | null = null;
    if (raw !== null && raw !== undefined && Number(raw) > 0) {
      monthlyGoal = Math.min(1_000_000_000, Math.round(Number(raw)));
    }

    await prisma.instructeurProfile.update({
      where: { id: ctx.instructeurId },
      data: { monthlyGoal },
    });

    return NextResponse.json({ ok: true, monthlyGoal });
  } catch (err) {
    console.error("[vendeur/goal PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
