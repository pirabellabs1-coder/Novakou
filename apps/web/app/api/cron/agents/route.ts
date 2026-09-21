import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { ensureAgentsSeeded } from "@/lib/agents/runtime";
import { runKycVerification } from "@/lib/agents/impl/kyc-verification";
import { runProductVerification } from "@/lib/agents/impl/product-verification";

/**
 * GET /api/cron/agents
 *
 * Fait tourner les DEUX agents de vérification autonomes : KYC et fiches
 * produit. Chacun DÉCIDE — approuve ou refuse avec un motif envoyé à la
 * personne — sans intervention admin (décision fondateur 2026-09-21).
 *
 * `?agent=kyc_verification|product_verification` exécute un seul agent.
 */
export const dynamic = "force-dynamic";
// Chaque dossier/fiche analysée coûte un appel vision (jusqu'à 45 s). Les
// agents s'arrêtent d'eux-mêmes avant d'approcher cette limite (voir
// `BUDGET_MS` dans chaque impl) et laissent le reste au passage suivant,
// 15 min plus tard — le plafond ici n'est qu'un filet de sécurité.
export const maxDuration = 280;

const RUNNERS: Record<string, () => Promise<unknown>> = {
  kyc_verification: runKycVerification,
  product_verification: runProductVerification,
};

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  await ensureAgentsSeeded();

  const only = new URL(req.url).searchParams.get("agent");
  const keys = only && RUNNERS[only] ? [only] : Object.keys(RUNNERS);

  const results: Record<string, unknown> = {};
  for (const k of keys) {
    try {
      results[k] = await RUNNERS[k]();
    } catch (e) {
      results[k] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({ ok: true, ran: keys, results, at: new Date().toISOString() });
}
