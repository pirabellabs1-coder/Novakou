/**
 * POST /api/webhooks/moneroo
 *
 * Webhook Moneroo : confirme un paiement et déclenche le fulfillment de la
 * commande (création des enrollments + crédit wallet vendeur + emails).
 *
 * Moneroo envoie un POST JSON avec au minimum `{ event, data: { id, status } }`.
 * On sécurise en allant RE-VÉRIFIER le status via l'API Moneroo (pas
 * confiance dans le payload seul — empêche les replay / spoofing).
 *
 * Types d'événements gérés :
 *   - `payment.success` / status === "success" → fulfill
 *   - `payment.failed` / status === "failed" / "cancelled" → audit log
 */

import { NextResponse } from "next/server";
import { retrievePayment } from "@/lib/moneroo";
import { fulfillCheckout } from "@/lib/formations/fulfillment";
import { prisma } from "@/lib/prisma";

interface MonerooWebhookPayload {
  event?: string;
  data?: {
    id?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  };
}

export async function POST(req: Request) {
  let body: MonerooWebhookPayload;
  try {
    body = (await req.json()) as MonerooWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "data.id manquant" }, { status: 400 });
  }

  // Re-vérifier le status auprès de Moneroo (NE PAS faire confiance au body seul)
  let verified: Awaited<ReturnType<typeof retrievePayment>>;
  try {
    verified = await retrievePayment(paymentId);
  } catch (err) {
    console.error("[moneroo webhook] retrievePayment failed:", err);
    return NextResponse.json({ error: "Vérification Moneroo échouée" }, { status: 502 });
  }

  const status = verified.status;
  const metadata = (verified.metadata ?? {}) as Record<string, unknown>;
  const type = String(metadata.type ?? "");

  // Audit log de l'événement reçu (trace)
  await prisma.auditLog
    .create({
      data: {
        action: `moneroo_webhook_${status}`,
        targetType: "payment",
        targetId: paymentId,
        details: {
          event: body.event,
          status,
          amount: verified.amount,
          currency: verified.currency,
          metadataType: type,
          metadata,
        } as object,
      },
    })
    .catch(() => null);

  // Ne fulfill que sur success
  if (status !== "success") {
    return NextResponse.json({ ok: true, status, ignored: true });
  }

  // Router selon le type de commande stockée dans la métadonnée
  if (type === "formations_checkout") {
    const userId = String(metadata.userId ?? "");
    const sessionRef = String(metadata.sessionRef ?? paymentId);
    const formationIds = parseIdList(metadata.formationIds);
    const productIds = parseIdList(metadata.productIds);
    const discountCodeStr = metadata.discountCode ? String(metadata.discountCode) : null;
    const affiliateProfileId = metadata.affiliateProfileId ? String(metadata.affiliateProfileId) : null;
    const affiliateCommissionRate = Number(metadata.affiliateCommissionRate ?? 0);

    if (!userId || (formationIds.length === 0 && productIds.length === 0)) {
      return NextResponse.json({ error: "Metadata incomplète" }, { status: 400 });
    }

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
      return NextResponse.json({ ok: true, fulfilled: true, result });
    } catch (err) {
      console.error("[moneroo webhook] fulfillCheckout failed:", err);
      return NextResponse.json({ error: "Fulfillment échoué" }, { status: 500 });
    }
  }

  if (type === "mentor_booking") {
    // Les bookings mentor se fulfill via /api/formations/mentor-bookings/[id]/confirm-payment
    // actuellement (flow plus ancien). Le webhook peut aussi le déclencher ici si besoin.
    const bookingId = String(metadata.bookingId ?? "");
    if (bookingId) {
      await prisma.mentorBooking
        .update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            escrowStatus: "HELD",
            paidAt: new Date(),
            paymentRef: paymentId,
            paymentProvider: "moneroo",
          },
        })
        .catch((err) => console.warn("[moneroo webhook mentor]", err));
    }
    return NextResponse.json({ ok: true, type: "mentor_booking" });
  }

  if (type === "marketplace_order") {
    const orderId = String(metadata.itemId ?? metadata.order_id ?? "");
    if (orderId) {
      await prisma.order
        .update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
          } as any,
        })
        .catch((err) => console.warn("[moneroo webhook marketplace order]", err));

      // Update wallet transaction: mark escrow as released (if model exists)
      try {
        await (prisma as any).walletTransaction.updateMany({
          where: {
            orderId,
            escrowStatus: "held",
          },
          data: {
            escrowStatus: "released",
            releasedAt: new Date(),
          },
        });
      } catch {
        // Ignore if model or field does not exist
      }
    }
    return NextResponse.json({ ok: true, type: "marketplace_order" });
  }

  if (type === "subscription") {
    const userId = String(metadata.userId ?? "");
    const planId = String(metadata.itemId ?? metadata.plan_id ?? "");
    if (userId && planId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: planId.toUpperCase(),
          subscriptionUpdatedAt: new Date(),
        } as any,
      }).catch((err) => console.warn("[moneroo webhook subscription]", err));
    }
    return NextResponse.json({ ok: true, type: "subscription" });
  }

  // Type inconnu — on log et on renvoie OK pour que Moneroo ne retente pas
  console.warn("[moneroo webhook] unknown metadata type:", type);
  return NextResponse.json({ ok: true, ignored: true, reason: "unknown_type" });
}

function parseIdList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    // Could be comma-separated or JSON-encoded
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch { /* fall through */ }
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
