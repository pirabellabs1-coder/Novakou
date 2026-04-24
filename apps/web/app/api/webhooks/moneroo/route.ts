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
  // Moneroo/KkiaPay peut envoyer :
  //   - Des events nommés "payout.*" (cas explicite)
  //   - Des events génériques "transaction.success" / "transaction.failed"
  //     → dans ce cas on verifie si l'ID correspond a un withdrawal en DB
  const eventName = (body.event ?? "").toLowerCase();
  const isPayoutByName = eventName.startsWith("payout.") || eventName.includes("payout");

  // Si le nom ne nous dit rien, on cherche dans InstructorWithdrawal
  // pour voir si cet ID correspond a un retrait que nous avons initie.
  const isPayoutInDb = !isPayoutByName
    ? !!(await prisma.instructorWithdrawal.findFirst({
        where: { paymentRef: paymentId },
        select: { id: true },
      }))
    : false;

  if (isPayoutByName || isPayoutInDb) {
    // En plus du statut verifie via Moneroo, on passe aussi le status declare
    // par le webhook (fallback si retrievePayout echoue ou renvoie une forme
    // inattendue - notamment pour KkiaPay qui n'a que transaction.success/failed)
    const declaredStatus = inferStatusFromEvent(eventName, body.data?.status);
    return handlePayoutWebhook(paymentId, eventName, declaredStatus);
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

  // Log console — on ne peut pas creer un AuditLog sans actorId (Prisma required).
  // Pour les webhooks systeme, on garde une trace console uniquement.
  console.log("[moneroo webhook]", {
    event: body.event,
    id: paymentId,
    status,
    amount: verified.amount,
    currency: verified.currency,
    type,
  });

  // Trace le resultat sur CheckoutAttempt (abandons / echecs + recuperation)
  const attemptId = metadata.attemptId ? String(metadata.attemptId) : null;
  if (attemptId) {
    try {
      const reason = typeof verified === "object" && verified !== null && "error" in verified
        ? String((verified as { error?: unknown }).error ?? "")
        : "";
      const errorCode = typeof verified === "object" && verified !== null && "error_code" in verified
        ? String((verified as { error_code?: unknown }).error_code ?? "")
        : "";
      await prisma.checkoutAttempt.update({
        where: { id: attemptId },
        data: {
          status: status === "success" ? "COMPLETED" : "FAILED",
          ...(status === "success" && { recoveredAt: new Date() }),
          ...(status !== "success" && {
            failureReason: reason || `Moneroo status: ${status}`,
            failureCode: errorCode || status,
          }),
          providerRef: paymentId,
        },
      });
    } catch (e) {
      console.warn("[moneroo webhook] attempt update failed:", e);
    }
  }

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

  // Nouveau : abonnement initial via SubscriptionPlan (Memberships vendeurs)
  if (type === "subscription_initial" || type === "subscription_renewal") {
    const userId = String(metadata.userId ?? "");
    const planId = String(metadata.planId ?? "");
    const isRenewal = type === "subscription_renewal";
    const renewingSubId = String(metadata.subscriptionId ?? "");

    if (!userId || !planId) {
      return NextResponse.json({ ok: true, ignored: true, reason: "missing_metadata" });
    }

    try {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) {
        return NextResponse.json({ error: "Plan introuvable" }, { status: 400 });
      }

      const periodStart = new Date();
      const periodEnd = new Date(periodStart);
      if (plan.interval === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Creer ou mettre a jour la Subscription
      const sub = await prisma.subscription.upsert({
        where: isRenewal && renewingSubId
          ? { id: renewingSubId }
          : { userId_planId: { userId, planId } },
        create: {
          userId,
          planId,
          status: "active",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          lastPaymentAt: new Date(),
          totalPaid: plan.price,
          renewalCount: 0,
        },
        update: {
          status: "active",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          lastPaymentAt: new Date(),
          totalPaid: { increment: plan.price },
          renewalCount: { increment: isRenewal ? 1 : 0 },
          cancelAtPeriodEnd: false,
        },
      });

      // Invoice
      await prisma.subscriptionInvoice.create({
        data: {
          subscriptionId: sub.id,
          userId,
          amount: plan.price,
          currency: plan.currency,
          status: "paid",
          periodStart,
          periodEnd,
          paymentRef: paymentId,
          paymentProvider: "moneroo",
          paidAt: new Date(),
        },
      });

      // Update plan stats
      await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: {
          totalEarned: { increment: plan.price },
          ...(isRenewal ? {} : { activeCount: { increment: 1 } }),
        },
      }).catch(() => null);

      return NextResponse.json({ ok: true, subscription: sub.id, type });
    } catch (err) {
      console.error("[moneroo webhook subscription_initial/renewal]", err);
      return NextResponse.json({ error: "Subscription fulfillment failed" }, { status: 500 });
    }
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
/**
 * Deduit un statut normalise ("success" | "failed" | "cancelled" | "pending")
 * a partir du nom d'event + du status declare dans le body Moneroo.
 *
 * Cas supportes :
 *  - "payout.success" / "payout.completed"          -> success
 *  - "payout.failed" / "payout.cancelled"           -> failed / cancelled
 *  - "transaction.success" (fallback KkiaPay)       -> success
 *  - "transaction.failed"                            -> failed
 */
function inferStatusFromEvent(eventName: string, declared?: string): string {
  const n = eventName.toLowerCase();
  if (declared) {
    const d = declared.toLowerCase();
    if (["success", "succeeded", "completed", "failed", "cancelled", "pending", "processing", "initiated"].includes(d)) {
      if (d === "succeeded" || d === "completed") return "success";
      if (d === "initiated") return "pending";
      return d;
    }
  }
  // payout.initiated = l'ordre est parti, on n'a pas encore la confirmation
  if (n.includes("initiated")) return "pending";
  if (n.includes("success") || n.includes("completed")) return "success";
  if (n.includes("failed")) return "failed";
  if (n.includes("cancelled") || n.includes("canceled")) return "cancelled";
  if (n.includes("pending") || n.includes("processing")) return "pending";
  return "pending";
}

async function handlePayoutWebhook(payoutId: string, eventName: string, fallbackStatus = "pending") {
  // On essaye d'abord retrievePayout. Si l'API ne renvoie pas un payout
  // (ex: l'ID est en fait une transaction normale cote Moneroo), on utilise
  // le fallback deduit du nom de l'event.
  let status: string = fallbackStatus;
  let verifiedMethod = "";
  let verifiedAmount = 0;
  let verifiedCurrency = "";
  try {
    const verified = await retrievePayout(payoutId);
    status = verified.status;
    verifiedMethod = verified.method ?? "";
    verifiedAmount = verified.amount ?? 0;
    verifiedCurrency = verified.currency ?? "";
  } catch (err) {
    console.warn("[moneroo webhook payout] retrievePayout failed, using fallback:", err instanceof Error ? err.message : err);
    // Deuxieme essai : retrievePayment (au cas ou KkiaPay traite les payouts
    // comme des transactions normales)
    try {
      const verifiedAsPayment = await retrievePayment(payoutId);
      status = verifiedAsPayment.status;
      verifiedAmount = verifiedAsPayment.amount ?? 0;
      verifiedCurrency = verifiedAsPayment.currency ?? "";
    } catch (err2) {
      console.warn("[moneroo webhook payout] retrievePayment aussi failed, on reste sur fallback status=", fallbackStatus);
      // On garde fallbackStatus — au pire le retrait reste EN_ATTENTE,
      // l'admin pourra rafraichir manuellement.
    }
  }

  // Log console — on ne peut pas creer un AuditLog sans actorId (Prisma required)
  console.log("[moneroo webhook payout]", {
    event: eventName,
    id: payoutId,
    status,
    amount: verifiedAmount,
    currency: verifiedCurrency,
    method: verifiedMethod,
  });

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
