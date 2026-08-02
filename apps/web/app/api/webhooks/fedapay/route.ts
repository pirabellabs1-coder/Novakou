import { NextResponse } from "next/server";
import { checkPayoutStatus, normalizeFedapayStatus, isFedapayConfigured } from "@/lib/fedapay";
import { reconcilePayout } from "@/lib/payout/reconcile";
import { reconcileCollectByRef } from "@/lib/payments/reconcile-collect";
import { rateLimit } from "@/lib/api-rate-limit";

// Webhook FedaPay — confirmation des encaissements ET des versements.
//
// SÛRETÉ (idem FeexPay) : on n'extrait du corps que l'id du payout, puis on
// RE-VÉRIFIE le statut via l'API FedaPay authentifiée avant toute écriture.

export const dynamic = "force-dynamic";

/** Extrait l'id du payout des formes possibles du payload FedaPay. */
function extractPayoutId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  // FedaPay envoie { name: "payout.xxx", entity: { id, ... } } ou { data: {...} }.
  const entity = (b.entity && typeof b.entity === "object" ? b.entity : {}) as Record<string, unknown>;
  const data = (b.data && typeof b.data === "object" ? b.data : {}) as Record<string, unknown>;
  const payout = (b.payout && typeof b.payout === "object" ? b.payout : {}) as Record<string, unknown>;
  const cand = entity.id ?? data.id ?? payout.id ?? b.id;
  if (cand === undefined || cand === null) return null;
  return String(cand);
}

/** Ne réagir qu'aux évènements liés aux payouts (ignore les évènements payin). */
function isPayoutEvent(body: unknown): boolean {
  if (!body || typeof body !== "object") return true; // par défaut on tente
  const name = String((body as Record<string, unknown>).name ?? "").toLowerCase();
  if (!name) return true;
  return name.includes("payout");
}

export async function POST(request: Request) {
  // Rate limit anti-flood (chaque appel déclenche une re-vérification API).
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`webhook:fedapay:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  if (!(await isFedapayConfigured())) {
    return NextResponse.json({ ok: true, ignored: true, reason: "fedapay_not_configured" });
  }

  const raw = await request.text();
  let body: unknown;
  try { body = JSON.parse(raw); } catch { body = null; }

  if (!isPayoutEvent(body)) {
    return NextResponse.json({ ok: true, ignored: true, reason: "not_a_payout_event" });
  }

  const payoutId = extractPayoutId(body);
  if (!payoutId) {
    return NextResponse.json({ ok: true, ignored: true, reason: "no_payout_id" });
  }

  // Encaissement ? FedaPay notifie transactions et payouts sur la même URL. Si
  // la référence correspond à un achat en attente, la livraison est le sujet.
  const collect = await reconcileCollectByRef(payoutId);
  if (collect.matched) {
    console.log("[fedapay webhook] encaissement", { payoutId, ...collect });
    return NextResponse.json({ ok: true, kind: "collect", ...collect });
  }

  let status: "success" | "failed" | "pending";
  try {
    const verified = await checkPayoutStatus(payoutId);
    status = normalizeFedapayStatus(verified.status);
  } catch (err) {
    console.warn("[fedapay webhook] checkPayoutStatus a échoué:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true, ignored: true, reason: "status_unverified" });
  }

  const result = await reconcilePayout(payoutId, status, "FedaPay");
  console.log("[fedapay webhook]", { payoutId, status, matched: result.matched, kind: result.kind, applied: result.applied });
  return NextResponse.json({ ok: true, ...result });
}
