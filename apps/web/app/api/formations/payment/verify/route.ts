import { NextResponse } from "next/server";
import { reconcileCollectByRef } from "@/lib/payments/reconcile-collect";

/**
 * GET /api/formations/payment/verify?id=xxx&provider=feexpay|fedapay|kkiapay|ipaymoney
 *
 * Vérifie un paiement ET finalise la commande
 * (crée enrollments, crédite wallet vendeur, envoie emails) en utilisant
 * la metadata stockée chez le provider — PAS besoin de session utilisateur
 * (le user revient de la page du fournisseur et peut ne plus avoir son cookie
 * NextAuth selon le navigateur et la stratégie de redirect cross-origin).
 *
 * Sécurité :
 *  - L'ID paiement vient des query params, le provider est la SOURCE DE VÉRITÉ
 *    (on appelle leur API avec notre secret pour récupérer status + metadata).
 *  - Un attaquant ne peut PAS forger un paiement réussi : il faudrait qu'il
 *    devine un paymentId existant déjà payé, et même là le pire scénario est
 *    qu'il déclenche un fulfillCheckout idempotent (déjà fait par le webhook).
 *
 * Idempotent : si fulfillCheckout a déjà tourné (via webhook ou retour user
 * précédent), il skip les enrollments déjà existants.
 */

/** Passerelles en service : elles passent par la réconciliation partagée. */
const NOUVELLES_PASSERELLES = new Set(["feexpay", "fedapay", "kkiapay", "ipaymoney"]);


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const rawProvider = (searchParams.get("provider") ?? "").trim().toLowerCase();

    // ── Passerelles actuelles ────────────────────────────────────────────
    // Cette route ne connaissait que deux fournisseurs, tous deux retirés. Un
    // acheteur revenant d'une page bancaire voyait donc « Vérification
    // échouée » APRÈS avoir payé, et l'événement d'achat ne partait jamais.
    //
    // Pour ceux-là, la vérification et la livraison sont exactement ce que
    // fait la réconciliation : on la réutilise plutôt que d'en réécrire une
    // seconde qui divergera.
    if (NOUVELLES_PASSERELLES.has(rawProvider)) {
      const r = await reconcileCollectByRef(id);
      if (!r.matched) {
        return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      }
      if (r.status !== "success") {
        return NextResponse.json({
          data: { id, status: r.status, provider: rawProvider, fulfilled: false },
        });
      }
      return NextResponse.json({
        data: {
          id,
          status: "success",
          provider: rawProvider,
          fulfilled: r.delivered,
          amount: r.fulfilled?.totalAmount ?? 0,
          currency: "XOF",
          metadata: { type: "formations_checkout" },
          result: {
            totalAmount: r.fulfilled?.totalAmount ?? 0,
            enrollments: (r.fulfilled?.formationIds ?? []).map((eid) => ({ id: eid })),
            purchases: (r.fulfilled?.productIds ?? []).map((pid) => ({ id: pid })),
            skipped: [],
          },
        },
      });
    }

    // Toute autre passerelle est hors service. On refuse clairement plutôt que
    // d'interroger une intégration supprimée — ce qui produisait une erreur
    // technique illisible pour l'acheteur.
    return NextResponse.json(
      { error: "Ce mode de paiement n'est plus pris en charge." },
      { status: 410 },
    );
  } catch (err) {
    console.error("[payment/verify]", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: "Échec de la vérification", message }, { status: 500 });
  }
}
