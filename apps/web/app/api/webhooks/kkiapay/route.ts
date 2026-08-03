import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/api-rate-limit";
import { hasCredentials } from "@/lib/payments/credentials";
import { reconcileCollectByRef } from "@/lib/payments/reconcile-collect";

/**
 * Webhook KkiaPay — notification de transaction.
 *
 * À déclarer dans leur tableau de bord :
 *   https://www.novakou.com/api/webhooks/kkiapay
 *
 * POURQUOI IL EXISTE MALGRÉ LA FENÊTRE. Le paiement KkiaPay se déroule dans
 * une fenêtre ouverte par le NAVIGATEUR : si l'acheteur la ferme juste après
 * avoir payé, ou perd le réseau avant que la page nous prévienne, personne ne
 * nous annonce l'encaissement. Ce webhook est le second chemin, et le cron de
 * réconciliation le troisième.
 *
 * SÛRETÉ. On n'extrait du corps QUE l'identifiant de transaction. L'état réel
 * est ensuite redemandé à KkiaPay par un appel authentifié (clé privée +
 * secret), et le montant encaissé est comparé à celui de la commande avant
 * toute livraison. Un webhook forgé ne peut donc rien déclencher : ni statut,
 * ni montant ne sont crus sur parole.
 */

export const dynamic = "force-dynamic";

/**
 * Notre référence interne, que nous avons passée au widget dans `data` et que
 * KkiaPay nous renvoie tel quel. C'est elle qui permet de retrouver la commande
 * quand le fournisseur n'a pas encore d'identifiant enregistré chez nous.
 */
function extractInternalRef(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const data = (b.data && typeof b.data === "object" ? b.data : {}) as Record<string, unknown>;
  const cand = typeof b.data === "string" ? b.data : (data.ref ?? data.internalRef ?? b.partnerId);
  return typeof cand === "string" && cand ? cand : null;
}

/** L'identifiant peut arriver sous plusieurs noms selon l'événement. */
function extractTransactionId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const data = (b.data && typeof b.data === "object" ? b.data : {}) as Record<string, unknown>;
  const tx = (b.transaction && typeof b.transaction === "object" ? b.transaction : {}) as Record<string, unknown>;
  const cand =
    b.transactionId ?? data.transactionId ?? tx.transactionId ??
    b.transaction_id ?? data.transaction_id ??
    b.id ?? data.id;
  return typeof cand === "string" && cand ? cand : null;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const rl = await rateLimit(`webhook:kkiapay:${ip}`, 120, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  if (!(await hasCredentials("kkiapay"))) {
    return NextResponse.json({ ok: true, ignored: true, reason: "kkiapay_not_configured" });
  }

  const raw = await request.text();
  let body: unknown;
  try { body = JSON.parse(raw); } catch { body = null; }

  const transactionId = extractTransactionId(body);
  if (!transactionId) {
    return NextResponse.json({ ok: true, ignored: true, reason: "no_transaction_id" });
  }

  // On cherche d'abord par NOTRE référence (toujours connue à ce stade), et on
  // enregistre au passage l'identifiant du fournisseur.
  const internalRef = extractInternalRef(body);
  const result = await reconcileCollectByRef(internalRef ?? transactionId, transactionId);
  console.log("[kkiapay webhook]", { transactionId, internalRef, ...result });
  return NextResponse.json({ ok: true, ...result });
}
