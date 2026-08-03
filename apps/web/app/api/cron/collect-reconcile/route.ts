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
      // ABANDONED compte AUSSI. Un autre cron déclare une tentative abandonnée
      // au bout d'une heure d'inactivité — mais « abandonnée » n'est que NOTRE
      // supposition : seul le fournisseur sait si l'acheteur a fini par
      // confirmer sur son téléphone. Ne regarder que STARTED faisait que toute
      // vente confirmée après 60 minutes était perdue définitivement, sans que
      // rien ne la reprenne jamais.
      status: { in: ["STARTED", "ABANDONED"] },
      // Sans référence fournisseur il n'y a rien à interroger : l'init a échoué
      // avant même d'atteindre la passerelle.
      providerRef: { not: null },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
  });

  /**
   * Tentatives récentes que ce cron NE reprend PAS, et pourquoi.
   *
   * Un rattrapage qui n'explique pas ce qu'il écarte est aussi aveugle que
   * pas de rattrapage du tout : une vente absente de la liste passait pour
   * inexistante, alors qu'elle était simplement hors critères.
   */
  const recentes = await prisma.checkoutAttempt.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { id: true, createdAt: true, status: true, amount: true, paymentMethod: true, providerRef: true, metadata: true },
  });
  const reprisIds = new Set(attempts.map((a) => a.id));
  const nonReprises = recentes
    .filter((r) => !reprisIds.has(r.id))
    .map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const raison = !r.providerRef
        ? "aucune référence fournisseur — la demande n'a jamais atteint la passerelle"
        : r.status === "COMPLETED"
          ? "déjà livrée"
          : r.status === "FAILED"
            ? "refusée par le fournisseur"
            : `statut « ${r.status} » hors critères`;
      return {
        quand: r.createdAt.toISOString(),
        montant: Math.round(r.amount),
        moyen: r.paymentMethod,
        passerelle: typeof meta.paymentProvider === "string" ? meta.paymentProvider : null,
        statut: r.status,
        raison,
      };
    });

  const results: Array<Record<string, unknown>> = [];
  let delivered = 0;
  let failed = 0;
  let stillPending = 0;

  for (const attempt of attempts) {
    try {
      const r = await reconcileCollectAttempt(attempt);
      if (r.delivered) delivered++;
      else if (r.status === "failed") failed++;
      else stillPending++;

      // On rend TOUJOURS le détail, y compris « en attente ». Filtrer ces
      // lignes rendait invisible la différence entre « l'acheteur n'a pas
      // encore confirmé » et « on n'arrive pas à interroger le fournisseur » —
      // or c'est exactement cette différence qu'on cherche quand une vente
      // encaissée n'arrive pas.
      const meta = (attempt.metadata ?? {}) as Record<string, unknown>;
      results.push({
        attemptId: attempt.id,
        passerelle: typeof meta.paymentProvider === "string" ? meta.paymentProvider : null,
        moyen: attempt.paymentMethod,
        montant: Math.round(attempt.amount),
        status: r.status,
        delivered: r.delivered,
        reason: r.reason,
      });
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
    nonReprises,
  });
}
