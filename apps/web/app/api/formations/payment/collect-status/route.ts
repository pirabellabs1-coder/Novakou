import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillCheckout } from "@/lib/formations/fulfillment";

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

    // Statut réel côté fournisseur.
    let status: "success" | "failed" | "pending";
    try {
      if (provider === "feexpay") {
        const { checkCollectStatus } = await import("@/lib/feexpay");
        status = (await checkCollectStatus(pid)).status;
      } else if (provider === "fedapay") {
        const { checkCollectStatus } = await import("@/lib/fedapay");
        status = (await checkCollectStatus(pid)).status;
      } else {
        return NextResponse.json({ error: "Fournisseur inconnu" }, { status: 400 });
      }
    } catch (err) {
      // Fournisseur injoignable : on reste en attente plutôt que d'annoncer un
      // échec — le paiement est peut-être en cours côté opérateur.
      console.error("[collect-status] interrogation échouée:", err);
      return NextResponse.json({ data: { status: "pending", transient: true } });
    }

    if (status === "pending") {
      return NextResponse.json({ data: { status: "pending" } });
    }

    if (status === "failed") {
      await prisma.checkoutAttempt
        .update({
          where: { id: attempt.id },
          data: { status: "FAILED", failureReason: "Paiement refusé ou annulé par l'acheteur" },
        })
        .catch(() => null);
      return NextResponse.json({ data: { status: "failed" } });
    }

    // ── Paiement confirmé : livrer (idempotent) ───────────────────────────
    const meta = (attempt.metadata ?? {}) as Record<string, unknown>;
    const formationIds = String(meta.formationIds ?? "").split(",").filter(Boolean);
    const productIds = String(meta.productIds ?? "").split(",").filter(Boolean);

    if (!attempt.userId) {
      console.error("[collect-status] attempt sans userId, livraison impossible:", attempt.id);
      return NextResponse.json({ data: { status: "success", delivered: false } });
    }

    try {
      await fulfillCheckout({
        userId: attempt.userId,
        formationIds,
        productIds,
        discountCodeStr: typeof meta.discountCode === "string" && meta.discountCode ? meta.discountCode : null,
        sessionRef: ref,
      });
      await prisma.checkoutAttempt
        .update({ where: { id: attempt.id }, data: { status: "COMPLETED", recoveredAt: new Date() } })
        .catch(() => null);
      return NextResponse.json({ data: { status: "success", delivered: true } });
    } catch (err) {
      // Le paiement EST passé mais la livraison a échoué : surtout ne pas dire
      // « échec » à l'acheteur, il a payé. On trace pour reprise manuelle.
      console.error("[collect-status] paiement OK mais fulfillment échoué:", ref, err);
      return NextResponse.json({ data: { status: "success", delivered: false } });
    }
  } catch (err) {
    console.error("[collect-status]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
