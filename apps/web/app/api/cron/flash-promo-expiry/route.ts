// GET /api/cron/flash-promo-expiry — Désactive les promotions flash expirées ou épuisées
// Appelé par Vercel Cron ou cron externe toutes les 5 minutes

import { NextRequest, NextResponse } from "next/server";
import prisma from "@freelancehigh/db";

export async function GET(req: NextRequest) {
  // Vérifier le secret cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Désactiver les promos expirées (endsAt < now)
    const expired = await prisma.flashPromotion.updateMany({
      where: {
        isActive: true,
        endsAt: { lt: now },
      },
      data: { isActive: false },
    });

    // Désactiver les promos avec usage maximal atteint
    // Fetch promos where maxUsage is set and usageCount >= maxUsage
    const maxedOut = await prisma.$executeRaw`
      UPDATE "FlashPromotion"
      SET "isActive" = false
      WHERE "isActive" = true
        AND "maxUsage" IS NOT NULL
        AND "usageCount" >= "maxUsage"
    `;

    return NextResponse.json({
      success: true,
      expiredCount: expired.count,
      maxedOutCount: maxedOut,
    });
  } catch (error) {
    console.error("[CRON flash-promo-expiry]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
