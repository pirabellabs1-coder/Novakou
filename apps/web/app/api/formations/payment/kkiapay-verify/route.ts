import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillCheckout } from "@/lib/formations/fulfillment";
import { verifyTransaction } from "@/lib/kkiapay";

/**
 * POST /api/formations/payment/kkiapay-verify
 * body: { transactionId, internalRef }
 *
 * Constate un paiement KkiaPay et livre.
 *
 * KkiaPay n'expose aucune API serveur pour débiter : le paiement se fait dans
 * une fenêtre du fournisseur, ouverte par le NAVIGATEUR. Le navigateur nous
 * annonce ensuite un identifiant de transaction — et un navigateur ment.
 *
 * D'où deux vérifications non négociables avant toute livraison :
 *  1. le statut est demandé à KkiaPay via un appel authentifié (clé privée +
 *     secret, jamais exposées au client) ;
 *  2. le montant réellement encaissé est comparé au montant de la tentative
 *     enregistrée à l'initialisation — sinon il suffirait de payer 100 F pour
 *     un produit à 20 000 F et de nous transmettre l'identifiant.
 *
 * `fulfillCheckout` est idempotent : rejouer cet appel ne livre qu'une fois.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Tolérance sur le montant : les frais opérateur peuvent arrondir d'un franc. */
const AMOUNT_TOLERANCE = 1;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      transactionId?: string;
      internalRef?: string;
    };
    const transactionId = (body.transactionId ?? "").trim();
    const internalRef = (body.internalRef ?? "").trim();

    if (!transactionId || !internalRef) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const attempt = await prisma.checkoutAttempt.findFirst({
      where: { metadata: { path: ["internalRef"], equals: internalRef } },
      orderBy: { createdAt: "desc" },
    });
    if (!attempt) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }
    if (attempt.status === "COMPLETED") {
      return NextResponse.json({ data: { status: "success", delivered: true, alreadyDone: true } });
    }

    // ── 1. Statut réel, demandé à KkiaPay ─────────────────────────────────
    let verified: Awaited<ReturnType<typeof verifyTransaction>>;
    try {
      verified = await verifyTransaction(transactionId);
    } catch (err) {
      // Injoignable : on ne conclut rien. Le paiement est peut-être passé ;
      // annoncer un échec priverait l'acheteur de son produit.
      console.error("[kkiapay-verify] vérification impossible:", err);
      return NextResponse.json({ data: { status: "pending", transient: true } });
    }

    if (verified.status === "pending") {
      return NextResponse.json({ data: { status: "pending" } });
    }
    if (verified.status === "failed") {
      await prisma.checkoutAttempt
        .update({
          where: { id: attempt.id },
          data: { status: "FAILED", failureReason: "Paiement refusé ou annulé par l'acheteur" },
        })
        .catch(() => null);
      return NextResponse.json({ data: { status: "failed" } });
    }

    // ── 2. Le montant encaissé correspond-il à la commande ? ──────────────
    const expected = Math.round(attempt.amount);
    const received = verified.amount === null ? null : Math.round(verified.amount);
    if (received === null || received < expected - AMOUNT_TOLERANCE) {
      const detail = `attendu ${expected}, reçu ${received ?? "inconnu"}`;
      console.error("[kkiapay-verify] montant incohérent:", internalRef, detail);
      await prisma.checkoutAttempt
        .update({
          where: { id: attempt.id },
          data: { status: "FAILED", failureReason: `Montant incohérent (${detail})`, failureCode: "amount_mismatch" },
        })
        .catch(() => null);
      return NextResponse.json(
        { error: "Le montant payé ne correspond pas à la commande.", code: "AMOUNT_MISMATCH" },
        { status: 400 },
      );
    }

    // ── 3. Livraison ──────────────────────────────────────────────────────
    if (!attempt.userId) {
      return NextResponse.json({ data: { status: "success", delivered: false } });
    }

    const meta = (attempt.metadata ?? {}) as Record<string, unknown>;
    const toIds = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((x): x is string => typeof x === "string" && x.length > 0)
        : typeof v === "string"
          ? v.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

    try {
      await fulfillCheckout({
        userId: attempt.userId,
        formationIds: toIds(meta.formationIds),
        productIds: toIds(meta.productIds),
        discountCodeStr: typeof meta.discountCode === "string" && meta.discountCode ? meta.discountCode : null,
        sessionRef: internalRef,
      });
    } catch (err) {
      // Encaissé mais non livré : on laisse la tentative ouverte pour que le
      // cron de réconciliation repasse.
      console.error("[kkiapay-verify] paiement OK mais livraison échouée:", internalRef, err);
      await prisma.checkoutAttempt
        .update({ where: { id: attempt.id }, data: { providerRef: transactionId } })
        .catch(() => null);
      return NextResponse.json({ data: { status: "success", delivered: false } });
    }

    await prisma.checkoutAttempt
      .update({
        where: { id: attempt.id },
        data: { status: "COMPLETED", providerRef: transactionId, recoveredAt: new Date() },
      })
      .catch(() => null);

    return NextResponse.json({ data: { status: "success", delivered: true } });
  } catch (err) {
    console.error("[kkiapay-verify]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
