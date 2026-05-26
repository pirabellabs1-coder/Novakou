// Refonte par Augustin Mékongo + Fatou Diallo — bureau 2026-05-26 (votes 7, 8, 13)
//
// Endpoint léger destiné aux badges "À traiter" de la sidebar vendeur.
// Renvoie 3 compteurs : abandons (checkout attempts non résolus),
// inquiries (questions acheteur en attente), retraits (demandes EN_ATTENTE).
// Pensé pour être polled toutes les 60s côté layout — pas de jointure lourde.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) {
      return NextResponse.json({ data: { abandons: 0, inquiries: 0, retraits: 0 } });
    }
    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    const shopFilter = activeShopId ? { shopId: activeShopId } : {};

    const [abandons, inquiries, retraits] = await Promise.all([
      prisma.checkoutAttempt.count({
        where: {
          instructeurId: ctx.instructeurId,
          ...shopFilter,
          status: { in: ["ABANDONED", "FAILED"] },
          recoveredAt: null,
        },
      }),
      prisma.productInquiry.count({
        where: {
          instructeurId: ctx.instructeurId,
          ...shopFilter,
          status: "pending",
        },
      }),
      prisma.instructorWithdrawal.count({
        where: {
          instructeurId: ctx.instructeurId,
          ...shopFilter,
          status: "EN_ATTENTE",
        },
      }),
    ]);

    return NextResponse.json({
      data: { abandons, inquiries, retraits },
    });
  } catch (err) {
    console.error("[vendeur/sidebar-counts]", err);
    // En cas d'erreur : on renvoie 0 partout — pas de badges plutôt qu'un crash de layout.
    return NextResponse.json({ data: { abandons: 0, inquiries: 0, retraits: 0 } });
  }
}
