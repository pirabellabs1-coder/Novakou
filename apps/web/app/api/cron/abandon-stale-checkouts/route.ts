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

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STALE_AFTER_MS = 60 * 60 * 1000; // 1 heure

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const token = new URL(request.url).searchParams.get("token");
  if (token === secret) return true;
  return false;
}

async function handle(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
