// POST /api/marketing/affiliate/payout — Request affiliate earnings payout

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    if (DEV_MODE) {
      // In dev mode, simulate a successful payout request
      if (amount < 20) {
        return NextResponse.json(
          { error: "Le montant minimum de retrait est de 20€" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        payout: {
          id: `payout-${Date.now()}`,
          amount,
          status: "PENDING",
          requestedAt: new Date().toISOString(),
          estimatedArrival: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }

    // Production: create payout request via Prisma
    // const affiliate = await prisma.affiliateProfile.findFirst({ where: { userId: session.user.id } });
    // if (!affiliate) return NextResponse.json({ error: "Profil affilié non trouvé" }, { status: 404 });
    // if (affiliate.pendingEarnings < amount) return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    // const payout = await prisma.affiliatePayout.create({ data: { affiliateId: affiliate.id, amount, status: "PENDING" } });
    return NextResponse.json({ success: true, payout: null });
  } catch (error) {
    console.error("[POST /api/marketing/affiliate/payout]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
