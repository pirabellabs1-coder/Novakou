import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import {
  getAvailablePayoutMethods,
  PAYOUT_METHODS,
} from "@/lib/moneroo-payout-methods";

/**
 * GET /api/formations/wallet/payout-methods
 *
 * Retourne la liste des méthodes de retrait Moneroo disponibles pour
 * l'utilisateur authentifié, filtrées selon son pays (`user.country`).
 *
 * Réponse :
 * {
 *   data: {
 *     userCountry: "SN",
 *     methods: [
 *       { id, label, icon, currency, requiredFields, placeholder, minAmount, processingTime, category },
 *       ...
 *     ],
 *     // Toutes les méthodes (pour debug / utilisateurs sans pays défini)
 *     allMethods: [...]
 *   }
 * }
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });

    const country = user?.country ?? null;
    const available = getAvailablePayoutMethods(country);

    return NextResponse.json({
      data: {
        userCountry: country,
        methods: available,
        allMethods: PAYOUT_METHODS,
      },
    });
  } catch (err) {
    console.error("[wallet/payout-methods GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
