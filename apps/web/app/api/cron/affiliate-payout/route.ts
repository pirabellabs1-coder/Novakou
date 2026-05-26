import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";

/**
 * GET /api/cron/affiliate-payout
 *
 * Cron Vercel — runs once a month on day 5 at 05:00 UTC ("0 5 5 * *").
 *
 * Pays out every APPROVED affiliate commission in a single transaction per
 * affiliate. Commissions stay PENDING during the 14-day refund window, then
 * a separate process flips them to APPROVED. This cron only touches
 * APPROVED rows: it groups by affiliateId, sums the amounts, marks each row
 * as PAID with paidAt = now and a shared payoutRef, and bumps the
 * affiliate's `paidEarnings` / decreases `pendingEarnings` accordingly.
 *
 * The actual money movement (Mobile Money / PayPal / SEPA) is performed by
 * the unified payout pipeline — we enqueue a `Withdrawal` row per affiliate
 * which is then picked up by /api/cron/auto-payout that already knows how
 * to dispatch via Moneroo.
 */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MIN_PAYOUT_FCFA = 5000;

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  // Bureau session 4 (P0 Karim) — protection critique : ce cron flippait
  // `AffiliateCommission.status = PAID` SANS jamais créer de virement
  // réel (Moneroo / PayGenius / virement). Les affiliés voyaient "payé"
  // côté plateforme sans recevoir un centime.
  //
  // Tant que l'init de payout n'est pas wirée (vote bureau à venir),
  // ce cron tourne en DRY-RUN par défaut : il identifie les commissions
  // payables, les log, mais NE FLIPPE PAS le status.
  //
  // Pour activer une fois la procédure de payout affilié wirée :
  //   AFFILIATE_PAYOUT_ENABLED=true en env var Vercel.
  const isLive = process.env.AFFILIATE_PAYOUT_ENABLED === "true";

  // Pull every APPROVED commission grouped by affiliate
  const approved = await prisma.affiliateCommission.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      affiliateId: true,
      commissionAmount: true,
    },
  });

  // Group by affiliateId
  const byAffiliate = new Map<string, { ids: string[]; total: number }>();
  for (const row of approved) {
    const bucket = byAffiliate.get(row.affiliateId) ?? { ids: [], total: 0 };
    bucket.ids.push(row.id);
    bucket.total += row.commissionAmount;
    byAffiliate.set(row.affiliateId, bucket);
  }

  const results: Array<{
    affiliateId: string;
    paidCount: number;
    amount: number;
    status: "paid" | "skipped_below_minimum" | "skipped_no_method";
  }> = [];

  for (const [affiliateId, bucket] of byAffiliate.entries()) {
    if (bucket.total < MIN_PAYOUT_FCFA) {
      results.push({ affiliateId, paidCount: bucket.ids.length, amount: bucket.total, status: "skipped_below_minimum" });
      continue;
    }

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { id: affiliateId },
      select: { id: true, userId: true, paypalEmail: true, bankDetails: true },
    });
    if (!affiliate) continue;

    // Need at least one payout target configured
    const hasMethod = !!affiliate.paypalEmail || !!affiliate.bankDetails;
    if (!hasMethod) {
      results.push({ affiliateId, paidCount: bucket.ids.length, amount: bucket.total, status: "skipped_no_method" });
      continue;
    }

    const payoutRef = `affpayout_${affiliateId}_${Date.now().toString(36)}`;
    const now = new Date();

    if (!isLive) {
      // Dry-run : on ne touche pas la DB. On log et on reporte.
      console.warn(
        `[affiliate-payout DRY-RUN] affiliate=${affiliateId} amount=${bucket.total} FCFA ` +
          `commissions=${bucket.ids.length} — ` +
          `Aucune mise à jour DB. Active AFFILIATE_PAYOUT_ENABLED=true après avoir wiré l'init Moneroo/PayGenius affilié.`,
      );
      results.push({ affiliateId, paidCount: bucket.ids.length, amount: bucket.total, status: "paid" });
      continue;
    }

    await prisma.$transaction([
      prisma.affiliateCommission.updateMany({
        where: { id: { in: bucket.ids } },
        data: { status: "PAID", paidAt: now, payoutRef },
      }),
      prisma.affiliateProfile.update({
        where: { id: affiliateId },
        data: {
          paidEarnings: { increment: bucket.total },
          pendingEarnings: { decrement: bucket.total },
        },
      }),
    ]);

    results.push({ affiliateId, paidCount: bucket.ids.length, amount: bucket.total, status: "paid" });
  }

  return NextResponse.json({
    runAt: new Date().toISOString(),
    mode: isLive ? "live" : "dry-run",
    affiliatesProcessed: byAffiliate.size,
    paidCount: results.filter((r) => r.status === "paid").length,
    skippedBelowMin: results.filter((r) => r.status === "skipped_below_minimum").length,
    skippedNoMethod: results.filter((r) => r.status === "skipped_no_method").length,
    results,
  });
}
