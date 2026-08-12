import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileCollectAttempt } from "@/lib/payments/reconcile-collect";

/**
 * GET /api/formations/payment/collect-status?ref=<internalRef>&provider=<id>&pid=<ref fournisseur>
 *
 * Suivi d'un encaissement DIRECT (push Mobile Money), interrogé par la page
 * d'attente. Contrairement à une page hébergée, il n'y a pas de redirection de
 * retour : c'est ce point qui constate le paiement et déclenche la livraison.
 *
 * SÛRETÉ :
 *  - le statut est demandé au FOURNISSEUR, jamais déduit du client ;
 *  - la livraison passe par fulfillCheckout, idempotent : plusieurs
 *    interrogations (ou le webhook en parallèle) ne livrent qu'une fois ;
 *  - le montant vient de l'attempt enregistré à l'initialisation, pas de la
 *    requête — un acheteur ne peut pas s'auto-attribuer une commande.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ref = (sp.get("ref") ?? "").trim();
    const provider = (sp.get("provider") ?? "").trim().toLowerCase();
    const pid = (sp.get("pid") ?? "").trim();

    if (!ref || !provider || !pid) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // On retrouve la tentative par sa référence interne (stockée en metadata).
    const attempt = await prisma.checkoutAttempt.findFirst({
      where: { metadata: { path: ["internalRef"], equals: ref } },
      orderBy: { createdAt: "desc" },
    });
    if (!attempt) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Déjà finalisée : on ne réinterroge pas le fournisseur pour rien.
    if (attempt.status === "COMPLETED") {
      return NextResponse.json({ data: { status: "success", alreadyDone: true } });
    }

    // Statut réel + livraison : exactement ce que fait le cron et le webhook.
    // Ce suivi refaisait la même chose de son côté ; deux implémentations pour
    // une seule règle, c'est une divergence programmée.
    const r = await reconcileCollectAttempt(attempt);

    if (r.status === "pending" || r.status === "unknown") {
      return NextResponse.json({ data: { status: "pending", transient: r.status === "unknown" } });
    }
    if (r.status === "failed") {
      // Le motif est TRADUIT ici, pas renvoyé brut : l'acheteur doit lire
      // « solde insuffisant », pas « PAYER_LIMIT_REACHED ». Le code technique
      // reste en base pour le diagnostic vendeur/admin.
      const { messageEchecAcheteur } = await import("@/lib/payments/echec-messages");
      const motif = messageEchecAcheteur(r.failureCode, r.failureMessage);
      return NextResponse.json({
        data: { status: "failed", titre: motif.titre, explication: motif.explication },
      });
    }

    // Succès : on renvoie de quoi déclencher l'ÉVÉNEMENT D'ACHAT côté pixels.
    // Sans ça, une vente Mobile Money — la majorité — reste invisible pour
    // Facebook, TikTok et Google : le vendeur paie sa publicité sans jamais
    // pouvoir mesurer ce qu'elle rapporte.
    return NextResponse.json({
      data: {
        status: "success",
        delivered: r.delivered,
        ref,
        ...(r.fulfilled
          ? {
              amount: r.fulfilled.totalAmount,
              formationIds: r.fulfilled.formationIds,
              productIds: r.fulfilled.productIds,
            }
          : {}),
      },
    });
  } catch (err) {
    console.error("[collect-status]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
