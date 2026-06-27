import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getAvailablePayoutMethods, PAYOUT_METHODS } from "@/lib/moneroo-payout-methods";

/**
 * GET /api/formations/affilie/payout-methods
 * Méthodes de versement Moneroo disponibles pour l'affilié, filtrées par pays.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { country: true } });
    const country = user?.country ?? null;
    const available = getAvailablePayoutMethods(country);
    const methods = (available.length > 0 ? available : PAYOUT_METHODS).map((m) => ({
      id: m.id,
      label: m.label.replace(/ — Moneroo$/, ""),
      icon: m.icon,
      requiredFields: m.requiredFields,
      placeholder: m.placeholder,
      processingTime: m.processingTime,
      category: m.category,
      minAmount: m.minAmount,
    }));

    return NextResponse.json({ data: { userCountry: country, methods } });
  } catch (err) {
    console.error("[affilie/payout-methods GET]", err);
    return NextResponse.json({ data: { userCountry: null, methods: [] } });
  }
}
