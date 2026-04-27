/**
 * POST /api/webhooks/paygenius
 *
 * Webhook PayGenius (GeniusPay) — confirme un paiement ou un payout (cashout)
 * et déclenche le fulfillment ou la mise à jour du retrait correspondant.
 *
 * Architecture parallèle au handler Moneroo (apps/web/app/api/webhooks/moneroo)
 * mais avec deux différences clés :
 *
 *   1. Vérification de signature : HMAC-SHA256 sur `timestamp + "." + payload`
 *      avec le secret `PAYGENIUS_WEBHOOK_SECRET`. Replay protection : 5 min.
 *      Headers : X-Webhook-Signature + X-Webhook-Timestamp.
 *
 *   2. Events supportés (selon la doc, deux conventions co-existent) :
 *        - Paiements  : payment.success | payment.failed | payment.cancelled
 *                       payment.refunded | payment.expired | payment.initiated
 *        - Payouts    : cashout.completed | cashout.failed | cashout.requested
 *                       payout.created | payout.completed | payout.failed
 *      → On gère les deux nommages.
 */

import { NextResponse } from "next/server";
import {
  retrievePayment,
  retrievePayout,
  verifyPayGeniusSignature,
  normalizePaymentStatus,
  normalizePayoutStatus,
} from "@/lib/paygenius";
import { fulfillCheckout } from "@/lib/formations/fulfillment";
import { prisma } from "@/lib/prisma";
import { shortMethodLabel } from "@/lib/moneroo-payout-methods";
import { rateLimit } from "@/lib/api-rate-limit";
import { sendDigitalProductDeliveryEmail } from "@/lib/email/formations";

interface PayGeniusWebhookPayload {
  id?: string;
  event?: string;
  timestamp?: number;
  data?: {
    object?: string;
    id?: number | string;
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    payment_method?: string;
    provider?: string;
    metadata?: Record<string, unknown>;
  };
  environment?: "sandbox" | "live";
  api_version?: string;
}

export async function POST(req: Request) {
  // Rate limit : 200 webhook calls par minute (protection replay flood)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`webhook:paygenius:${ip}`, 200, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  // Lire le body brut AVANT parsing pour vérification HMAC
  const rawBody = await req.text();

  const sigCheck = verifyPayGeniusSignature(rawBody, req.headers);
  if (!sigCheck.ok) {
    console.warn("[paygenius webhook] signature invalide :", sigCheck.reason);
    return NextResponse.json(
      { error: "Signature invalide", reason: sigCheck.reason },
      { status: 401 },
    );
  }

  let body: PayGeniusWebhookPayload;
  try {
    body = JSON.parse(rawBody) as PayGeniusWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const eventName = (body.event ?? "").toLowerCase();
  const reference = body.data?.reference || (body.data?.id ? String(body.data.id) : "");

  if (!reference) {
    return NextResponse.json({ error: "data.reference / data.id manquant" }, { status: 400 });
  }

  // ─── Détection : payout (cashout) vs payment ──────────────────────────
  const isPayoutByName =
    eventName.startsWith("cashout.") ||
    eventName.startsWith("payout.") ||
    eventName.includes("cashout") ||
    eventName.includes("payout") ||
    /^pyt-/i.test(reference);

  const isPayoutInDb = !isPayoutByName
    ? !!(await prisma.instructorWithdrawal.findFirst({
        where: { paymentRef: reference },
        select: { id: true },
      }))
    : false;

  if (isPayoutByName || isPayoutInDb) {
    return handlePayoutWebhook(reference, eventName, body.data?.status);
  }

  // ─── PAYMENT — re-vérifier le statut auprès de PayGenius ──────────────
  let verified: Awaited<ReturnType<typeof retrievePayment>>;
  try {
    verified = await retrievePayment(reference);
  } catch (err) {
    console.error("[paygenius webhook] retrievePayment failed:", err);
    return NextResponse.json({ error: "Vérification PayGenius échouée" }, { status: 502 });
  }

  const status = verified.status; // déjà normalisé en "success"/"failed"/...
  const metadata = verified.metadata ?? {};
  const type = String(metadata.type ?? "");

  console.log("[paygenius webhook]", {
    event: body.event,
    reference,
    status,
    amount: verified.amount,
    currency: verified.currency,
    type,
  });

  // Trace le résultat sur CheckoutAttempt
  const attemptId = metadata.attemptId ? String(metadata.attemptId) : null;
  if (attemptId) {
    try {
      await prisma.checkoutAttempt.update({
        where: { id: attemptId },
        data: {
          status: status === "success" ? "COMPLETED" : "FAILED",
          ...(status === "success" && { recoveredAt: new Date() }),
          ...(status !== "success" && {
            failureReason: `PayGenius status: ${status}`,
            failureCode: status,
          }),
          providerRef: reference,
        },
      });
    } catch (e) {
      console.warn("[paygenius webhook] attempt update failed:", e);
    }
  }

  // Ne fulfill que sur success
  if (status !== "success") {
    return NextResponse.json({ ok: true, status, ignored: true });
  }

  // ─── Routing par metadata.type (identique à Moneroo) ──────────────────
  if (type === "formations_checkout") {
    const userId = String(metadata.userId ?? "");
    const sessionRef = String(metadata.sessionRef ?? reference);
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
      console.error("[paygenius webhook] fulfillCheckout failed:", err);
      return NextResponse.json({ error: "Fulfillment échoué" }, { status: 500 });
    }
  }

  if (type === "mentor_booking") {
    const bookingId = String(metadata.bookingId ?? "");
    if (bookingId) {
      await prisma.mentorBooking
        .update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            escrowStatus: "HELD",
            paidAt: new Date(),
            paymentRef: reference,
            paymentProvider: "paygenius",
          },
        })
        .catch((err) => console.warn("[paygenius webhook mentor]", err));
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
        .catch((err) => console.warn("[paygenius webhook marketplace order]", err));

      try {
        await (prisma as any).walletTransaction.updateMany({
          where: { orderId, escrowStatus: "held" },
          data: { escrowStatus: "released", releasedAt: new Date() },
        });
      } catch {
        /* ignore */
      }
    }
    return NextResponse.json({ ok: true, type: "marketplace_order" });
  }

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
      if (plan.interval === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

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

      await prisma.subscriptionInvoice.create({
        data: {
          subscriptionId: sub.id,
          userId,
          amount: plan.price,
          currency: plan.currency,
          status: "paid",
          periodStart,
          periodEnd,
          paymentRef: reference,
          paymentProvider: "paygenius",
          paidAt: new Date(),
        },
      });

      await prisma.subscriptionPlan
        .update({
          where: { id: planId },
          data: {
            totalEarned: { increment: plan.price },
            ...(isRenewal ? {} : { activeCount: { increment: 1 } }),
          },
        })
        .catch(() => null);

      const subTag = `sub_${sub.id}`;
      for (const fid of plan.linkedFormationIds) {
        await prisma.enrollment
          .upsert({
            where: { userId_formationId: { userId, formationId: fid } },
            create: { userId, formationId: fid, paidAmount: 0, stripeSessionId: subTag },
            update: {},
          })
          .catch((e) => console.warn("[paygenius subscription enroll]", fid, e?.message ?? e));
      }
      for (const pid of plan.linkedProductIds) {
        await prisma.digitalProductPurchase
          .upsert({
            where: { userId_productId: { userId, productId: pid } },
            create: { userId, productId: pid, paidAmount: 0, stripeSessionId: subTag },
            update: {},
          })
          .catch((e) => console.warn("[paygenius subscription purchase]", pid, e?.message ?? e));
      }

      return NextResponse.json({ ok: true, subscription: sub.id, type });
    } catch (err) {
      console.error("[paygenius webhook subscription_initial/renewal]", err);
      return NextResponse.json({ error: "Subscription fulfillment failed" }, { status: 500 });
    }
  }

  if (type === "bundle_purchase") {
    const userId = String(metadata.userId ?? "");
    const bundleId = String(metadata.bundleId ?? "");

    if (!userId || !bundleId) {
      return NextResponse.json({ ok: true, ignored: true, reason: "missing_metadata" });
    }

    try {
      const bundle = await prisma.productBundle.findUnique({
        where: { id: bundleId },
        include: { items: true, instructeur: { include: { user: { select: { email: true, name: true } } } } },
      });
      if (!bundle) return NextResponse.json({ error: "Bundle introuvable" }, { status: 400 });

      const existing = await prisma.productBundlePurchase.findFirst({ where: { bundleId, userId } });
      if (existing) return NextResponse.json({ ok: true, alreadyProcessed: true });

      const purchase = await prisma.productBundlePurchase.create({
        data: { bundleId, userId, paidAmount: bundle.priceXof },
      });

      const tag = `bundle_${purchase.id}`;
      let enrolledFormations = 0;
      let enrolledProducts = 0;
      for (const item of bundle.items) {
        if (item.itemKind === "formation" && item.formationId) {
          await prisma.enrollment
            .upsert({
              where: { userId_formationId: { userId, formationId: item.formationId } },
              create: { userId, formationId: item.formationId, paidAmount: 0, stripeSessionId: tag },
              update: {},
            })
            .catch((e) => console.warn("[paygenius bundle enroll]", item.formationId, e?.message ?? e));
          enrolledFormations++;
        } else if (item.itemKind === "digital" && item.productId) {
          await prisma.digitalProductPurchase
            .upsert({
              where: { userId_productId: { userId, productId: item.productId } },
              create: { userId, productId: item.productId, paidAmount: 0, stripeSessionId: tag },
              update: {},
            })
            .catch((e) => console.warn("[paygenius bundle purchase]", item.productId, e?.message ?? e));
          enrolledProducts++;
        }
      }

      const buyer = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (buyer?.email) {
        const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
        sendDigitalProductDeliveryEmail({
          email: buyer.email,
          name: buyer.name ?? "Acheteur",
          productTitle: `Bundle : ${bundle.title}`,
          downloadUrl: `${APP_URL}/apprenant/mes-formations`,
          locale: "fr",
        }).catch((e) => console.warn("[paygenius bundle email buyer]", e?.message ?? e));
      }

      return NextResponse.json({
        ok: true,
        bundleId,
        purchaseId: purchase.id,
        enrolledFormations,
        enrolledProducts,
      });
    } catch (err) {
      console.error("[paygenius webhook bundle_purchase]", err);
      return NextResponse.json({ error: "Bundle fulfillment failed" }, { status: 500 });
    }
  }

  console.warn("[paygenius webhook] unknown metadata type:", type);
  return NextResponse.json({ ok: true, ignored: true, reason: "unknown_type" });
}

function parseIdList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* fall through */
    }
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Gère les webhooks payout (cashout) de PayGenius.
 * Events possibles :
 *   - cashout.completed / cashout.failed / cashout.requested / cashout.approved
 *   - payout.created / payout.completed / payout.failed
 */
async function handlePayoutWebhook(reference: string, eventName: string, declared?: string) {
  // 1. Re-vérifier le statut côté PayGenius
  let status: ReturnType<typeof normalizePayoutStatus> = "pending";
  let verifiedAmount = 0;

  try {
    const verified = await retrievePayout(reference);
    status = verified.status;
    verifiedAmount = verified.amount ?? 0;
  } catch (err) {
    console.warn(
      "[paygenius webhook payout] retrievePayout failed, fallback sur event :",
      err instanceof Error ? err.message : err,
    );
    // Fallback : déduire le statut depuis le nom de l'event ou le `declared` body
    status = inferPayoutStatusFromEvent(eventName, declared);
  }

  console.log("[paygenius webhook payout]", {
    event: eventName,
    reference,
    status,
    amount: verifiedAmount,
  });

  // 2. Retrouver le withdrawal correspondant
  const w = await prisma.instructorWithdrawal.findFirst({
    where: { paymentRef: reference },
    include: { instructeur: { include: { user: { select: { id: true } } } } },
  });
  if (!w) {
    console.warn("[paygenius webhook payout] withdrawal introuvable :", reference);
    return NextResponse.json({ ok: true, ignored: true, reason: "withdrawal_not_found" });
  }

  // 3. Mettre à jour le statut
  if (status === "success") {
    if (w.status !== "TRAITE") {
      await prisma.instructorWithdrawal.update({
        where: { id: w.id },
        data: { status: "TRAITE", processedAt: new Date(), errorMessage: null },
      });
      await prisma.notification
        .create({
          data: {
            userId: w.instructeur.user.id,
            type: "PAYMENT",
            title: "Retrait versé ✅",
            message: `Vos ${Math.round(w.amount)} FCFA viennent d'être envoyés via ${shortMethodLabel(w.method)} (PayGenius). Vérifiez votre compte.`,
            link: w.method.endsWith("_mentor") ? "/mentor/finances" : "/wallet",
          },
        })
        .catch(() => null);
    }
    return NextResponse.json({ ok: true, payout: "success" });
  }

  if (status === "failed" || status === "cancelled") {
    await prisma.instructorWithdrawal.update({
      where: { id: w.id },
      data: {
        status: "REFUSE",
        processedAt: new Date(),
        errorMessage: `PayGenius a rejeté le payout (status=${status}).`,
        refusedReason: "Échec du transfert PayGenius — vérifiez vos coordonnées de réception et réessayez.",
      },
    });
    await prisma.notification
      .create({
        data: {
          userId: w.instructeur.user.id,
          type: "PAYMENT",
          title: "Retrait échoué",
          message: `Votre retrait de ${Math.round(w.amount)} FCFA n'a pas pu aboutir. Vérifiez vos coordonnées et créez une nouvelle demande.`,
          link: w.method.endsWith("_mentor") ? "/mentor/finances" : "/wallet",
        },
      })
      .catch(() => null);
    return NextResponse.json({ ok: true, payout: status });
  }

  // processing / pending : on ne touche pas au statut
  return NextResponse.json({ ok: true, payout: status, ignored: true });
}

/**
 * Déduit un statut de payout normalisé à partir du nom de l'event PayGenius
 * et/ou du status déclaré dans le body.
 */
function inferPayoutStatusFromEvent(eventName: string, declared?: string): "pending" | "processing" | "success" | "failed" | "cancelled" {
  const n = eventName.toLowerCase();
  if (declared) {
    const d = declared.toLowerCase();
    if (d === "completed" || d === "success" || d === "succeeded") return "success";
    if (d === "failed" || d === "error") return "failed";
    if (d === "cancelled" || d === "canceled") return "cancelled";
    if (d === "processing") return "processing";
    if (d === "pending" || d === "requested" || d === "approved") return "pending";
  }
  if (n.includes("completed") || n.includes("success")) return "success";
  if (n.includes("failed")) return "failed";
  if (n.includes("cancelled") || n.includes("canceled")) return "cancelled";
  if (n.includes("processing")) return "processing";
  return "pending";
}
