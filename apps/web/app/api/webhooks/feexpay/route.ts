import { NextResponse } from "next/server";
import { checkPayoutStatus, normalizeFeexpayStatus, isFeexpayConfigured } from "@/lib/feexpay";
import { reconcilePayout } from "@/lib/payout/reconcile";

// Webhook FeexPay — confirmation des payouts.
//
// SÛRETÉ : on ne se fie PAS au statut du corps du webhook. On extrait seulement
// la référence, puis on RE-VÉRIFIE le statut réel via l'API FeexPay authentifiée
// (checkPayoutStatus) avant toute écriture. Un webhook falsifié ne peut donc
// déclencher qu'une re-vérification, jamais forcer un "success".

export const dynamic = "force-dynamic";

/** Cherche la référence du payout dans les formes possibles du payload. */
function extractReference(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const data = (b.data && typeof b.data === "object" ? b.data : {}) as Record<string, unknown>;
  const tx = (b.transaction && typeof b.transaction === "object" ? b.transaction : {}) as Record<string, unknown>;
  const cand = b.reference ?? data.reference ?? tx.reference ?? b.transref ?? data.transref ?? b.callback_info ?? data.callback_info;
  return typeof cand === "string" && cand ? cand : null;
}

export async function POST(request: Request) {
  if (!isFeexpayConfigured()) {
    // Clés absentes → le fournisseur n'est pas actif ; on ignore proprement.
    return NextResponse.json({ ok: true, ignored: true, reason: "feexpay_not_configured" });
  }

  const raw = await request.text();
  let body: unknown;
  try { body = JSON.parse(raw); } catch { body = null; }

  const reference = extractReference(body);
  if (!reference) {
    return NextResponse.json({ ok: true, ignored: true, reason: "no_reference" });
  }

  // Re-vérification authentifiée du statut réel (source de vérité).
  let status: "success" | "failed" | "pending";
  try {
    const verified = await checkPayoutStatus(reference);
    status = normalizeFeexpayStatus(verified.status);
  } catch (err) {
    console.warn("[feexpay webhook] checkPayoutStatus a échoué:", err instanceof Error ? err.message : err);
    // On ne touche à rien si on ne peut pas confirmer.
    return NextResponse.json({ ok: true, ignored: true, reason: "status_unverified" });
  }

  const result = await reconcilePayout(reference, status, "FeexPay");
  console.log("[feexpay webhook]", { reference, status, matched: result.matched, kind: result.kind, applied: result.applied });
  return NextResponse.json({ ok: true, ...result });
}
