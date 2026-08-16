import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/api-rate-limit";
import { reconcileCollectByRef } from "@/lib/payments/reconcile-collect";

/**
 * Rappel Monetbil — notification de paiement.
 *
 * CE POINT D'ENTRÉE MANQUAIT. L'initialisation d'un encaissement Monetbil
 * déclarait déjà `notify_url = /api/webhooks/monetbil`… mais aucun code ne
 * vivait à cette adresse : chaque notification partait dans un 404, découvert
 * le 2026-08-16 en sondant les webhooks. Aucune vente n'a été perdue — le cron
 * de réconciliation reprenait chaque tentative toutes les cinq minutes — mais
 * les acheteurs Monetbil attendaient leur livraison jusqu'à cinq minutes de
 * trop, pour rien.
 *
 * ─── MÊME PRINCIPE DE SÛRETÉ QUE PAWAPAY ────────────────────────────────────
 * On ne croit PAS le statut annoncé dans le corps. On en extrait uniquement
 * l'identifiant de transaction, puis l'état réel est redemandé à Monetbil par
 * un appel authentifié (checkPayment). Un rappel forgé ne peut donc déclencher
 * qu'une re-vérification — jamais une livraison.
 *
 * Monetbil envoie ses notifications en POST form-url-encoded (payment_ref,
 * paymentId, transaction_id…) ; certains comptes envoient du JSON. On accepte
 * les deux plutôt que de parier sur l'un.
 */

export const dynamic = "force-dynamic";

function extraireReference(corps: Record<string, unknown> | null): string | null {
  if (!corps) return null;
  const candidat =
    corps.paymentId ?? corps.payment_id ?? corps.transaction_id ?? corps.payment_ref;
  return typeof candidat === "string" && candidat ? candidat : null;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const rl = await rateLimit(`webhook:monetbil:${ip}`, 120, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const brut = await request.text();
  let corps: Record<string, unknown> | null = null;
  try {
    corps = JSON.parse(brut) as Record<string, unknown>;
  } catch {
    // Form-url-encoded — leur format historique.
    try {
      corps = Object.fromEntries(new URLSearchParams(brut).entries());
    } catch {
      corps = null;
    }
  }

  const reference = extraireReference(corps);
  if (!reference) {
    // 200 : un rappel illisible ne doit pas être rejoué indéfiniment.
    console.warn("[monetbil webhook] aucune référence exploitable :", brut.slice(0, 500));
    return NextResponse.json({ ok: true, ignored: true, reason: "no_reference" });
  }

  // La réconciliation retrouve la tentative par providerRef OU par notre
  // référence interne — payment_ref porte la seconde, paymentId la première.
  const resultat = await reconcileCollectByRef(reference);
  console.log("[monetbil webhook]", { reference, ...resultat });
  return NextResponse.json({ ok: true, ...resultat });
}

/** Monetbil peut sonder l'URL avant de l'accepter : un GET ne doit pas 404. */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "monetbil", method: "POST attendu" });
}
