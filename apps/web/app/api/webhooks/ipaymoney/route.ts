import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { rateLimit } from "@/lib/api-rate-limit";
import { credential, hasCredentials } from "@/lib/payments/credentials";
import { reconcileCollectByRef } from "@/lib/payments/reconcile-collect";

/**
 * Webhook iPay Money — notification d'encaissement.
 *
 * À déclarer dans leur tableau de bord (Développeurs → Webhooks) :
 *   https://www.novakou.com/api/webhooks/ipaymoney
 *
 * SÛRETÉ, en deux couches indépendantes :
 *
 *  1. Le fournisseur renvoie une chaîne partagée dans l'en-tête `secret-hash`.
 *     On la compare en TEMPS CONSTANT — une comparaison ordinaire s'arrête au
 *     premier caractère différent, ce qui laisse deviner le secret octet par
 *     octet en mesurant le temps de réponse.
 *
 *  2. Même une fois cette vérification passée, on ne croit PAS le statut
 *     annoncé dans le corps. On en extrait uniquement la référence, puis on
 *     redemande l'état réel à iPay Money par un appel authentifié. Un webhook
 *     forgé ne peut donc déclencher qu'une re-vérification, jamais une
 *     livraison.
 */

export const dynamic = "force-dynamic";

/** Comparaison à temps constant, insensible aux longueurs différentes. */
function secretsMatch(recu: string, attendu: string): boolean {
  const a = Buffer.from(recu);
  const b = Buffer.from(attendu);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** La référence peut arriver sous plusieurs noms selon l'événement. */
function extractReference(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const data = (b.data && typeof b.data === "object" ? b.data : {}) as Record<string, unknown>;
  const payment = (b.payment && typeof b.payment === "object" ? b.payment : {}) as Record<string, unknown>;
  const cand =
    b.reference ?? data.reference ?? payment.reference ??
    b.external_reference ?? data.external_reference ??
    b.transaction_id ?? data.transaction_id ?? payment.transaction_id;
  return typeof cand === "string" && cand ? cand : null;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const rl = await rateLimit(`webhook:ipaymoney:${ip}`, 120, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  if (!(await hasCredentials("ipaymoney"))) {
    return NextResponse.json({ ok: true, ignored: true, reason: "ipaymoney_not_configured" });
  }

  // ── Couche 1 : le secret partagé ────────────────────────────────────────
  const attendu = await credential("ipaymoney", "webhookSecret");
  if (!attendu) {
    // Pas de secret enregistré : on refuse plutôt que d'accepter n'importe qui.
    // Le cron de réconciliation livrera de toute façon la vente.
    return NextResponse.json(
      { ok: true, ignored: true, reason: "webhook_secret_absent" },
      { status: 200 },
    );
  }
  const recu = request.headers.get("secret-hash") ?? "";
  if (!secretsMatch(recu, attendu)) {
    console.warn("[ipaymoney webhook] secret-hash invalide");
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  // ── Couche 2 : on ne croit que notre propre vérification ────────────────
  const raw = await request.text();
  let body: unknown;
  try { body = JSON.parse(raw); } catch { body = null; }

  const reference = extractReference(body);
  if (!reference) {
    return NextResponse.json({ ok: true, ignored: true, reason: "no_reference" });
  }

  const result = await reconcileCollectByRef(reference);
  console.log("[ipaymoney webhook]", { reference, ...result });
  return NextResponse.json({ ok: true, ...result });
}
