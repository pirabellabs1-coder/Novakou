import { NextResponse } from "next/server";
import { retrievePayment, isMonerooConfigured } from "@/lib/moneroo";
import { fulfillCheckout } from "@/lib/formations/fulfillment";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/payment/verify?id=xxx
 *
 * Vérifie un paiement Moneroo ET finalise la commande (crée enrollments,
 * crédite wallet vendeur, envoie emails) en utilisant la metadata stockée
 * sur Moneroo — PAS besoin de session utilisateur car on trust la source
 * (Moneroo) qu'on re-interroge directement.
 *
 * Idempotent : si fulfillCheckout a déjà tourné (via webhook ou retour user),
 * il skip les enrollments déjà existants. Donc rappeler cet endpoint
 * n'effectuera pas de double achat.
 */

function parseIdList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch { /* fall through */ }
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export async function GET(request: Request) {
  try {
    if (!isMonerooConfigured()) {
      return NextResponse.json({ error: "Moneroo non configuré" }, { status: 503 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    // 1. Récupère le paiement depuis Moneroo (source de vérité)
    const payment = await retrievePayment(id);
    const metadata = (payment.metadata ?? {}) as Record<string, unknown>;

    // Si pas encore succès, on retourne juste le status (page affiche "en attente" / "échoué")
    if (payment.status !== "success") {
      return NextResponse.json({
        data: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          metadata,
          fulfilled: false,
        },
      });
    }

    // 2. Paiement réussi — extrait les ids depuis la metadata
    const userId = typeof metadata.userId === "string" ? metadata.userId : "";
    const sessionRef = typeof metadata.sessionRef === "string" ? metadata.sessionRef : String(metadata.internalRef ?? payment.id);
    const formationIds = parseIdList(metadata.formationIds);
    const productIds = parseIdList(metadata.productIds);
    const discountCodeStr = metadata.discountCode ? String(metadata.discountCode) : null;
    const affiliateProfileId = metadata.affiliateProfileId ? String(metadata.affiliateProfileId) : null;
    const affiliateCommissionRate = Number(metadata.affiliateCommissionRate ?? 0);

    // Type autre que formations_checkout (mentor_booking) → géré ailleurs
    const type = String(metadata.type ?? "");
    if (type && type !== "formations_checkout") {
      return NextResponse.json({
        data: {
          id: payment.id,
          status: payment.status,
          metadata,
          fulfilled: false,
          note: `Type ${type} géré par un autre endpoint`,
        },
      });
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: "Metadata incomplète — userId manquant. Contactez le support si votre paiement a bien été prélevé.",
          data: { status: payment.status, metadata },
        },
        { status: 400 }
      );
    }

    if (formationIds.length === 0 && productIds.length === 0) {
      return NextResponse.json(
        { error: "Aucun produit dans la metadata", data: { status: payment.status, metadata } },
        { status: 400 }
      );
    }

    // 3. Fulfill (idempotent — skip si enrollment existe déjà)
    try {
      const result = await fulfillCheckout({
        userId,
        formationIds,
        productIds,
        discountCodeStr,
        sessionRef,
        affiliate: affiliateProfileId
          ? { profileId: affiliateProfileId, commissionRate: affiliateCommissionRate }
          : null,
      });

      // Clean le panier de l'utilisateur (items achetés)
      if (formationIds.length > 0) {
        await prisma.cartItem
          .deleteMany({ where: { userId, formationId: { in: formationIds } } })
          .catch(() => null);
      }
      if (productIds.length > 0) {
        await prisma.cartItem
          .deleteMany({ where: { userId, productId: { in: productIds } } })
          .catch(() => null);
      }

      return NextResponse.json({
        data: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          metadata,
          fulfilled: true,
          result,
        },
      });
    } catch (err) {
      console.error("[payment/verify] fulfillCheckout failed:", err);
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : "Finalisation échouée",
          data: { status: payment.status, metadata, fulfilled: false },
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[payment/verify]", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: "Échec de la vérification", message }, { status: 500 });
  }
}
