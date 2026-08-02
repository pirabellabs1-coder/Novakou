import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { reconcileCollectAttempt } from "@/lib/payments/reconcile-collect";

/**
 * GET /api/cron/collect-reconcile
 *
 * FILET DE SÉCURITÉ DE LA LIVRAISON.
 *
 * Un encaissement Mobile Money se valide sur le téléphone de l'acheteur : il
 * n'y a pas de redirection de retour. Tant que la livraison ne se déclenchait
 * que depuis la page d'attente, elle dépendait du navigateur de l'acheteur —
 * onglet fermé et la vente restait encaissée mais non livrée.
 *
 * Ce cron reprend toutes les tentatives encore ouvertes, demande leur statut
 * réel au fournisseur (appel authentifié, jamais le corps d'un webhook) et
 * livre celles qui sont payées. Il ne dépend ni du navigateur, ni de la bonne
 * configuration d'un webhook chez le fournisseur.
 *
 * Idempotent : `fulfillCheckout` ne livre qu'une fois, quel que soit le nombre
 * de passages.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Fenêtre de reprise. Au-delà, une tentative encore « STARTED » n'a
 * quasi-certainement jamais été payée (l'acheteur a abandonné avant de valider
 * sur son téléphone) et un autre cron l'archive.
 */
const WINDOW_HOURS = 48;

/** Plafond par passage : on tourne toutes les 5 min, inutile de tout balayer. */
const MAX_PER_RUN = 60;

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const since = new Date(Date.now() - WINDOW_HOURS * 3600_000);

  const attempts = await prisma.checkoutAttempt.findMany({
    where: {
      status: "STARTED",
      // Sans référence fournisseur il n'y a rien à interroger : l'init a échoué
      // avant même d'atteindre la passerelle.
      providerRef: { not: null },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
  });

  const results: Array<{ attemptId: string; status: string; delivered: boolean; reason?: string }> = [];
  let delivered = 0;
  let failed = 0;
  let stillPending = 0;

  for (const attempt of attempts) {
    try {
      const r = await reconcileCollectAttempt(attempt);
      if (r.delivered) delivered++;
      else if (r.status === "failed") failed++;
      else stillPending++;

      // On ne journalise que ce qui bouge ou ce qui coince : une tentative
      // simplement « en attente » est le cas normal et noierait le reste.
      if (r.delivered || r.status === "failed" || r.reason) {
        results.push({ attemptId: attempt.id, status: r.status, delivered: r.delivered, reason: r.reason });
      }
    } catch (err) {
      console.error("[collect-reconcile] tentative", attempt.id, err);
      results.push({
        attemptId: attempt.id,
        status: "error",
        delivered: false,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (delivered > 0) {
    console.log(`[collect-reconcile] ${delivered} vente(s) rattrapée(s) et livrée(s)`);
  }

  return NextResponse.json({
    scanned: attempts.length,
    delivered,
    failed,
    stillPending,
    results,
  });
}
