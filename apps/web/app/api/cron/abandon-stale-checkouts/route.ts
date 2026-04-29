/**
 * Cron : transition STARTED → ABANDONED pour les CheckoutAttempt qui traînent.
 *
 * Cas couvert : un visiteur clique "Payer" (création de l'attempt en STARTED)
 * mais ferme le navigateur SANS aller chez le provider. Aucun webhook
 * n'arrive jamais → l'attempt reste STARTED indéfiniment et le vendeur ne
 * le voit jamais dans son onglet "À relancer".
 *
 * Ce cron passe ces attempts à ABANDONED après 1 heure d'inactivité — ils
 * apparaissent alors dans le dashboard vendeur et sont éligibles aux
 * emails de relance (cron `send-abandon-reminders`).
 *
 * Authentification : Bearer CRON_SECRET (ou ?token=).
 * Idempotent : ne touche que les attempts STARTED > 1h, ne re-traite rien.
 *
 * Cadence recommandée : toutes les 30 minutes (Vercel Cron / GitHub Actions).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STALE_AFTER_MS = 60 * 60 * 1000; // 1 heure

async function handle(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const cutoff = new Date(Date.now() - STALE_AFTER_MS);

  const result = await prisma.checkoutAttempt.updateMany({
    where: {
      status: "STARTED",
      createdAt: { lte: cutoff },
    },
    data: {
      status: "ABANDONED",
      failureReason: "Visiteur n'a pas finalisé le paiement (timeout 1h)",
      failureCode: "stale_checkout",
    },
  });

  return NextResponse.json({
    ok: true,
    abandonedCount: result.count,
    cutoff: cutoff.toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
