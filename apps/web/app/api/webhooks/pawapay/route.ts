import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/api-rate-limit";
import { reconcileCollectByRef } from "@/lib/payments/reconcile-collect";

/**
 * Rappel PawaPay — notification de statut final.
 *
 * À déclarer dans leur tableau de bord (Callback URLs) :
 *   https://www.novakou.com/api/webhooks/pawapay
 *
 * La même URL convient aux dépôts, versements et remboursements : on n'utilise
 * de leur corps que l'identifiant, et l'état réel est redemandé ensuite.
 *
 * ─── POURQUOI CE POINT D'ENTRÉE EST SÛR SANS SIGNATURE ─────────────────────
 * On ne croit PAS le statut annoncé dans le corps. On en extrait uniquement
 * l'identifiant de transaction, puis on redemande l'état réel à PawaPay par un
 * appel authentifié. Un rappel forgé ne peut donc déclencher qu'une
 * re-vérification — jamais une livraison.
 *
 * C'est ce qui permet de configurer l'URL AVANT d'avoir leurs identifiants :
 * la sûreté ne repose pas sur le secret du rappel. La vérification de leur
 * signature reste un durcissement souhaitable, à ajouter une fois leur schéma
 * exact connu — pas devine.
 *
 * ─── ET SI CE POINT D'ENTRÉE TOMBE ? ───────────────────────────────────────
 * Rien n'est perdu : le cron de réconciliation reprend les tentatives non
 * conclues toutes les cinq minutes. Ce rappel accélère la livraison, il n'en
 * est pas la condition.
 */

export const dynamic = "force-dynamic";

/**
 * L'identifiant peut arriver sous plusieurs noms selon l'opération : dépôt,
 * versement ou remboursement. On accepte aussi `clientReferenceId`, qui porte
 * NOTRE référence interne — la réconciliation sait retrouver une tentative par
 * l'une ou l'autre.
 */
function extraireReference(corps: unknown): string | null {
  if (!corps || typeof corps !== "object") return null;
  const b = corps as Record<string, unknown>;
  const data = (b.data && typeof b.data === "object" ? b.data : {}) as Record<string, unknown>;

  const candidat =
    b.depositId ?? data.depositId ??
    b.payoutId ?? data.payoutId ??
    b.refundId ?? data.refundId ??
    b.clientReferenceId ?? data.clientReferenceId;

  return typeof candidat === "string" && candidat ? candidat : null;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const rl = await rateLimit(`webhook:pawapay:${ip}`, 120, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const brut = await request.text();
  let corps: unknown;
  try {
    corps = JSON.parse(brut);
  } catch {
    corps = null;
  }

  const reference = extraireReference(corps);
  if (!reference) {
    // On répond 200 : un rappel qu'on ne sait pas lire ne doit pas pousser
    // PawaPay à le rejouer indéfiniment. La trace suffit au diagnostic.
    console.warn("[pawapay webhook] aucune référence exploitable :", brut.slice(0, 500));
    return NextResponse.json({ ok: true, ignored: true, reason: "no_reference" });
  }

  const resultat = await reconcileCollectByRef(reference);
  console.log("[pawapay webhook]", { reference, ...resultat });
  return NextResponse.json({ ok: true, ...resultat });
}

/**
 * PawaPay vérifie parfois qu'une URL de rappel répond avant de l'accepter.
 * Un GET qui renvoie 404 ferait échouer cette validation — et bloquerait la
 * génération du jeton API.
 */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "pawapay", method: "POST attendu" });
}
