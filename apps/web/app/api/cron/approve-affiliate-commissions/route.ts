import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";

/**
 * GET /api/cron/approve-affiliate-commissions
 *
 * Daily at 03:00 UTC. Promotes PENDING affiliate commissions to APPROVED
 * once they're past the refund window (default 14 days). Once APPROVED, le
 * montant devient RETIRABLE : l'affilié déclenche lui-même son virement via
 * /affilie/retraits (POST /api/formations/affilie/retraits), qui crée le
 * retrait réel. Pas de payout automatique côté plateforme.
 *
 * Auth: Bearer CRON_SECRET (or x-vercel-cron header from Vercel).
 */

const REFUND_WINDOW_DAYS = 14;

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  try {
    const cutoff = new Date(Date.now() - REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Find PENDING commissions older than the refund window
    const pendingOlder = await prisma.affiliateCommission.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
      },
      select: { id: true, affiliateId: true, commissionAmount: true },
      take: 1000, // batch cap to stay within Vercel cron timeout
    });

    if (pendingOlder.length === 0) {
      return NextResponse.json({
        ok: true,
        promoted: 0,
        message: "No PENDING commissions past refund window",
      });
    }

    // Promote each to APPROVED + bump pendingEarnings on the affiliate profile
    let promoted = 0;
    let errors = 0;

    for (const c of pendingOlder) {
      try {
        await prisma.$transaction([
          prisma.affiliateCommission.update({
            where: { id: c.id },
            data: { status: "APPROVED" },
          }),
          // pendingEarnings already includes this commission since creation —
          // approving doesn't move money yet, just makes it eligible for payout.
          // No balance change here.
        ]);
        promoted += 1;
      } catch (err) {
        errors += 1;
        console.error(`[CRON approve-affiliate-commissions] failed id=${c.id}:`, err);
      }
    }

    console.log(`[CRON approve-affiliate-commissions] promoted=${promoted}, errors=${errors}, cutoff=${cutoff.toISOString()}`);

    return NextResponse.json({
      ok: true,
      promoted,
      errors,
      cutoffDate: cutoff.toISOString(),
      windowDays: REFUND_WINDOW_DAYS,
    });
  } catch (err) {
    console.error("[CRON approve-affiliate-commissions] fatal:", err);
    return NextResponse.json(
      { error: "Erreur lors de la promotion des commissions" },
      { status: 500 }
    );
  }
}
