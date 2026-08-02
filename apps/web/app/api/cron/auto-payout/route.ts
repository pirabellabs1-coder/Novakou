import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import {
  processInstructorWithdrawalAuto,
  processAffiliateWithdrawalAuto,
} from "@/lib/payout/process-withdrawal";

/**
 * GET /api/cron/auto-payout
 *
 * FILET DE SÉCURITÉ DES VERSEMENTS.
 *
 * Le versement part normalement dès la demande de retrait : la route wallet
 * appelle l'orchestrateur immédiatement. Aucune validation admin n'est requise.
 *
 * Mais un versement peut rester bloqué en EN_ATTENTE sans référence
 * fournisseur : requête interrompue, fournisseur injoignable à la seconde près,
 * déploiement au mauvais moment. Sans reprise, l'argent du vendeur dort
 * indéfiniment et il faut qu'un humain s'en aperçoive.
 *
 * Ce cron reprend ces retraits orphelins et relance l'orchestrateur, qui est
 * idempotent (il ne touche pas un retrait déjà envoyé ou déjà traité).
 */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Délai de grâce avant reprise : on laisse la demande initiale finir son
 * travail. Reprendre trop tôt lancerait un second versement en parallèle du
 * premier — la garde `paymentRef` protège, mais autant ne pas courir après.
 */
const GRACE_MS = Number(process.env.AUTO_PAYOUT_DELAY_MINUTES || 10) * 60 * 1000;

/** Plafond par passage : au-delà, le passage suivant prend la suite. */
const MAX_PER_RUN = 25;

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const cutoff = new Date(Date.now() - GRACE_MS);

  const [instructorWithdrawals, affiliateWithdrawals] = await Promise.all([
    prisma.instructorWithdrawal.findMany({
      where: { status: "EN_ATTENTE", paymentRef: null, createdAt: { lte: cutoff } },
      orderBy: { createdAt: "asc" },
      take: MAX_PER_RUN,
      select: { id: true, amount: true },
    }),
    prisma.affiliateWithdrawal.findMany({
      where: { status: "EN_ATTENTE", paymentRef: null, createdAt: { lte: cutoff } },
      orderBy: { createdAt: "asc" },
      take: MAX_PER_RUN,
      select: { id: true, amount: true },
    }),
  ]);

  const results: Array<{ kind: "vendeur" | "affilie"; id: string; status: string; reason?: string }> = [];
  let sent = 0;
  let refused = 0;
  let pendingManual = 0;

  for (const w of instructorWithdrawals) {
    try {
      const r = await processInstructorWithdrawalAuto(w.id);
      if (r.status === "SENT") sent++;
      else if (r.status === "REFUSED") refused++;
      else pendingManual++;
      results.push({ kind: "vendeur", id: w.id, status: r.status, reason: "reason" in r ? r.reason : undefined });
    } catch (err) {
      console.error("[auto-payout] retrait vendeur", w.id, err);
      results.push({ kind: "vendeur", id: w.id, status: "ERROR", reason: err instanceof Error ? err.message : String(err) });
    }
  }

  for (const w of affiliateWithdrawals) {
    try {
      const r = await processAffiliateWithdrawalAuto(w.id);
      if (r.status === "SENT") sent++;
      else if (r.status === "REFUSED") refused++;
      else pendingManual++;
      results.push({ kind: "affilie", id: w.id, status: r.status, reason: "reason" in r ? r.reason : undefined });
    } catch (err) {
      console.error("[auto-payout] retrait affilié", w.id, err);
      results.push({ kind: "affilie", id: w.id, status: "ERROR", reason: err instanceof Error ? err.message : String(err) });
    }
  }

  if (sent > 0) console.log(`[auto-payout] ${sent} versement(s) rattrapé(s)`);

  return NextResponse.json({
    scanned: instructorWithdrawals.length + affiliateWithdrawals.length,
    sent,
    refused,
    pendingManual,
    results,
  });
}
