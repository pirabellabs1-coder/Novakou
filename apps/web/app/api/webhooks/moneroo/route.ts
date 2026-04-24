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
import crypto from "crypto";
import { retrievePayment, retrievePayout } from "@/lib/moneroo";
import { fulfillCheckout } from "@/lib/formations/fulfillment";
import { prisma } from "@/lib/prisma";
import { shortMethodLabel } from "@/lib/moneroo-payout-methods";

/**
 * Vérifie la signature HMAC Moneroo sur le body brut.
 * Moneroo envoie un header `X-Moneroo-Signature` (ou `X-Hub-Signature-256`
 * selon version) calculé en HMAC-SHA256 du body avec MONEROO_WEBHOOK_SECRET.
 * Si le secret n'est PAS configuré côté server, on skip la vérif (le webhook
 * restera protégé par la re-vérification via retrievePayment).
 */
function verifyMonerooSignature(rawBody: string, headers: Headers): boolean {
  const secret = process.env.MONEROO_WEBHOOK_SECRET;
  if (!secret) return true; // optional : safe car retrievePayment revérifie

  const provided =
    headers.get("x-moneroo-signature") ||
    headers.get("x-hub-signature-256") ||
    headers.get("x-webhook-signature") ||
    "";
  if (!provided) {
    console.warn("[moneroo webhook] header signature manquant (secret configuré)");
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // Format souvent préfixé par "sha256=<hex>"
  const cleaned = provided.replace(/^sha256=/i, "").trim();
  try {
    const a = Buffer.from(cleaned, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

interface MonerooWebhookPayload {
  event?: string;
  data?: {
    id?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  };
}

export async function POST(req: Request) {
  // On lit le body brut AVANT de le parser, pour pouvoir vérifier la signature HMAC
  const rawBody = await req.text();

  if (!verifyMonerooSignature(rawBody, req.headers)) {
    console.warn("[moneroo webhook] signature invalide — IP:", req.headers.get("x-forwarded-for") || "?");
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let body: MonerooWebhookPayload;
  try {
    body = JSON.parse(rawBody) as MonerooWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "data.id manquant" }, { status: 400 });
  }

  // ─── Détecter si c'est un event de PAYOUT (retrait) plutôt qu'un payment ─
  // Moneroo utilise des events nommés "payout.*" pour les retraits.
  const eventName = (body.event ?? "").toLowerCase();
  const isPayoutEvent = eventName.startsWith("payout.") || eventName.includes("payout");

  if (isPayoutEvent) {
    return handlePayoutWebhook(paymentId, eventName);
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

/**
 * Gère les webhooks payout (retraits) de Moneroo.
 * Events typiques : payout.success, payout.failed, payout.pending, payout.cancelled
 *
 * On re-vérifie le statut via retrievePayout() pour éviter tout spoofing,
 * puis on met à jour l'InstructorWithdrawal correspondant (trouvé via paymentRef).
 */
async function handlePayoutWebhook(payoutId: string, eventName: string) {
  // Re-verif auprès de Moneroo
  let verified: Awaited<ReturnType<typeof retrievePayout>>;
  try {
    verified = await retrievePayout(payoutId);
  } catch (err) {
    console.error("[moneroo webhook payout] retrievePayout failed:", err);
    return NextResponse.json({ error: "Vérification payout Moneroo échouée" }, { status: 502 });
  }

  const status = verified.status;

  // Audit log
  await prisma.auditLog
    .create({
      data: {
        action: `moneroo_payout_${status}`,
        targetType: "withdrawal",
        targetId: payoutId,
        details: {
          event: eventName,
          status,
          amount: verified.amount,
          currency: verified.currency,
          method: verified.method,
        } as object,
      },
    })
    .catch(() => null);

  // Retrouver le withdrawal via paymentRef
  const w = await prisma.instructorWithdrawal.findFirst({
    where: { paymentRef: payoutId },
    include: { instructeur: { include: { user: { select: { id: true } } } } },
  });
  if (!w) {
    console.warn("[moneroo webhook payout] withdrawal introuvable pour paymentRef:", payoutId);
    return NextResponse.json({ ok: true, ignored: true, reason: "withdrawal_not_found" });
  }

  // ── success ──────────────────────────────────────────────────────────
  if (status === "success") {
    if (w.status !== "TRAITE") {
      await prisma.instructorWithdrawal.update({
        where: { id: w.id },
        data: {
          status: "TRAITE",
          processedAt: new Date(),
          errorMessage: null,
        },
      });
      await prisma.notification.create({
        data: {
          userId: w.instructeur.user.id,
          type: "PAYMENT",
          title: "Retrait versé ✅",
          message: `Vos ${Math.round(w.amount)} FCFA viennent d'être envoyés via ${shortMethodLabel(w.method)}. Vérifiez votre compte.`,
          link: w.method.endsWith("_mentor") ? "/mentor/finances" : "/wallet",
        },
      }).catch(() => null);
    }
    return NextResponse.json({ ok: true, payout: "success" });
  }

  // ── failed / cancelled : on re-ouvre le retrait ───────────────────────
  if (status === "failed" || status === "cancelled") {
    await prisma.instructorWithdrawal.update({
      where: { id: w.id },
      data: {
        status: "REFUSE",
        processedAt: new Date(),
        errorMessage: `Moneroo a rejeté le payout (status=${status}).`,
        refusedReason: "Échec du transfert Moneroo — vérifiez vos coordonnées de réception et réessayez.",
      },
    });
    await prisma.notification.create({
      data: {
        userId: w.instructeur.user.id,
        type: "PAYMENT",
        title: "Retrait échoué",
        message: `Votre retrait de ${Math.round(w.amount)} FCFA n'a pas pu aboutir. Vérifiez vos coordonnées et créez une nouvelle demande.`,
        link: w.method.endsWith("_mentor") ? "/mentor/finances" : "/wallet",
      },
    }).catch(() => null);
    return NextResponse.json({ ok: true, payout: status });
  }

  // ── processing / pending : on ne touche pas au statut ────────────────
  return NextResponse.json({ ok: true, payout: status, ignored: true });
}
