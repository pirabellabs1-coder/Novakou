import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { reconcilePayout, type ReconcileStatus } from "@/lib/payout/reconcile";

/**
 * GET /api/cron/payout-reconcile
 *
 * FILET DE SÉCURITÉ DE LA CONFIRMATION DES VERSEMENTS.
 *
 * Un versement part en « PENDING » : le fournisseur confirme plus tard, par
 * webhook. Si ce webhook ne part pas (URL pas encore renseignée chez le
 * fournisseur, secret changé, indisponibilité), le retrait reste EN_ATTENTE
 * alors que l'argent est bel et bien parti — le vendeur croit ne pas être payé
 * et son solde reste bloqué.
 *
 * Ce cron interroge le fournisseur pour chaque retrait encore EN_ATTENTE ayant
 * une référence, et applique le vrai statut. Il ne dépend d'aucun webhook.
 *
 * Idempotent : `reconcilePayout` ignore les retraits déjà finalisés.
 */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Plafond par passage — le passage suivant reprendra le reste. */
const MAX_PER_RUN = 40;

/** Fenêtre : au-delà, une référence n'est plus interrogeable utilement. */
const WINDOW_DAYS = 14;

type ProviderId = "feexpay" | "fedapay";

/** Statut réel du versement chez le fournisseur, ou null si indéterminable. */
async function providerStatus(provider: ProviderId, ref: string): Promise<ReconcileStatus | null> {
  try {
    if (provider === "feexpay") {
      const { checkPayoutStatus, normalizeFeexpayStatus, isFeexpayConfigured } = await import("@/lib/feexpay");
      if (!isFeexpayConfigured()) return null;
      return normalizeFeexpayStatus((await checkPayoutStatus(ref)).status);
    }
    const { checkPayoutStatus, normalizeFedapayStatus, isFedapayConfigured } = await import("@/lib/fedapay");
    if (!isFedapayConfigured()) return null;
    return normalizeFedapayStatus((await checkPayoutStatus(ref)).status);
  } catch (err) {
    // Fournisseur injoignable : surtout ne rien conclure. Marquer « échoué »
    // ici ferait croire au vendeur qu'il n'a pas été payé alors qu'il l'a été.
    console.warn(`[payout-reconcile] statut ${provider} indisponible pour ${ref}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
  const where = {
    status: "EN_ATTENTE",
    paymentRef: { not: null },
    paymentProvider: { in: ["feexpay", "fedapay"] },
    createdAt: { gte: since },
  };

  const [vendeurs, affilies] = await Promise.all([
    prisma.instructorWithdrawal.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: MAX_PER_RUN,
      select: { id: true, paymentRef: true, paymentProvider: true },
    }),
    prisma.affiliateWithdrawal.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: MAX_PER_RUN,
      select: { id: true, paymentRef: true, paymentProvider: true },
    }),
  ]);

  const rows = [
    ...vendeurs.map((w) => ({ ...w, kind: "vendeur" as const })),
    ...affilies.map((w) => ({ ...w, kind: "affilie" as const })),
  ];

  const results: Array<{ kind: string; id: string; status: string; applied?: string }> = [];
  let paid = 0;
  let failed = 0;
  let stillPending = 0;

  for (const w of rows) {
    const provider = w.paymentProvider as ProviderId;
    const ref = w.paymentRef;
    if (!ref) continue;

    const status = await providerStatus(provider, ref);
    if (!status) {
      results.push({ kind: w.kind, id: w.id, status: "indeterminé" });
      continue;
    }
    if (status === "pending") {
      stillPending++;
      continue;
    }

    const label = provider === "feexpay" ? "FeexPay" : "FedaPay";
    const r = await reconcilePayout(ref, status, label);
    if (status === "success") paid++;
    else failed++;
    results.push({ kind: w.kind, id: w.id, status, applied: r.applied });
  }

  if (paid > 0 || failed > 0) {
    console.log(`[payout-reconcile] ${paid} versement(s) confirmé(s), ${failed} échoué(s)`);
  }

  return NextResponse.json({ scanned: rows.length, paid, failed, stillPending, results });
}
