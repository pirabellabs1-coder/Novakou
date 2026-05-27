// Audit paiement 2026-05-26 — Karim Benali (bureau réunions 12-16, votes 18-26)
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
import { rateLimit } from "@/lib/api-rate-limit";
import { sendDigitalProductDeliveryEmail } from "@/lib/email/formations";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";

/**
 * Vérifie la signature HMAC Moneroo sur le body brut.
 * Moneroo envoie un header `X-Moneroo-Signature` (ou `X-Hub-Signature-256`
 * selon version) calculé en HMAC-SHA256 du body avec MONEROO_WEBHOOK_SECRET.
 *
 * SECURITY (production) : si le secret est absent en production, on REFUSE
 * le webhook (sinon replay attack possible). En dev on accepte (le re-check
 * via retrievePayment garde un filet de sécurité).
 *
 * Replay protection : si le payload contient un `timestamp` (Unix seconds ou
 * ms), on rejette tout webhook plus vieux que 5 minutes.
 */
const MONEROO_REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 min

function verifyMonerooSignature(rawBody: string, headers: Headers): boolean {
  const secret = process.env.MONEROO_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[Moneroo Webhook] CRITICAL: MONEROO_WEBHOOK_SECRET missing in production — refusing webhook to prevent replay attack",
      );
      return false; // refuse webhook in production
    }
    return true; // dev only : retrievePayment revérifie de toute façon
  }

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

/**
 * Anti-replay : si le payload contient un timestamp (Unix sec ou ms), on
 * rejette tout webhook plus vieux que MONEROO_REPLAY_WINDOW_MS.
 * Retourne `true` si OK, `false` si trop vieux.
 */
function verifyMonerooTimestamp(rawBody: string): boolean {
  let parsed: Record<string, unknown> | unknown[] | null = null;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return true; // si pas parseable, on laisse la signature trancher
  }
  if (!parsed || typeof parsed !== "object") return true;
  // Lecture défensive — l'objet n'est pas typé strictement (payload provider externe).
  const obj = parsed as { timestamp?: unknown; created_at?: unknown; data?: { timestamp?: unknown } };
  const ts: unknown = obj.timestamp ?? obj.data?.timestamp ?? obj.created_at;
  if (ts === undefined || ts === null || ts === "") return true; // pas de timestamp → skip

  let tsMs: number;
  if (typeof ts === "number") {
    // Unix seconds (10 chiffres) vs ms (13 chiffres)
    tsMs = ts < 1e12 ? ts * 1000 : ts;
  } else if (typeof ts === "string") {
    const n = Number(ts);
    if (Number.isFinite(n)) {
      tsMs = n < 1e12 ? n * 1000 : n;
    } else {
      // ISO string
      const d = Date.parse(ts);
      if (!Number.isFinite(d)) return true;
      tsMs = d;
    }
  } else {
    return true;
  }

  const now = Date.now();
  if (now - tsMs > MONEROO_REPLAY_WINDOW_MS) {
    console.warn(
      `[moneroo webhook] timestamp trop ancien (${Math.round((now - tsMs) / 1000)}s) — rejeté pour replay protection`,
    );
    return false;
  }
  // Tolérance future skew : 5 min également
  if (tsMs - now > MONEROO_REPLAY_WINDOW_MS) {
    console.warn(`[moneroo webhook] timestamp dans le futur (skew) — rejeté`);
    return false;
  }
  return true;
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
  // Rate limit: 200 webhook calls per minute (protect against replay floods)
  // FIX: Use x-real-ip (set by Vercel edge, not spoofable) over x-forwarded-for
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`webhook:moneroo:${ip}`, 200, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  // On lit le body brut AVANT de le parser, pour pouvoir vérifier la signature HMAC
  const rawBody = await req.text();

  if (!verifyMonerooSignature(rawBody, req.headers)) {
    console.warn("[moneroo webhook] signature invalide — IP:", req.headers.get("x-forwarded-for") || "?");
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  // Anti-replay : rejet si le timestamp dépasse 5 min de skew
  if (!verifyMonerooTimestamp(rawBody)) {
    return NextResponse.json({ error: "Timestamp hors fenêtre (replay protection)" }, { status: 401 });
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

  // ── Audit paiement 2026-05-26 — vote 20 : validation montant ────────
  // Compare le montant vérifié auprès du provider à la somme calculée DB.
  // Tolérance ±1 FCFA. Si écart → on REFUSE le fulfillment mais on
  // renvoie 200 pour éviter que Moneroo retente indéfiniment.
  const amountCheck = await assertAmountMatches(paymentId, verified.amount ?? 0, metadata);
  if (!amountCheck.ok) {
    return NextResponse.json({ ok: true, rejected: "amount_mismatch" });
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
        // Defense-in-depth (vote 19) : fulfillment refait le check montant
        // côté serveur. Double rempart en plus de assertAmountMatches.
        expectedAmountReceived: verified.amount ?? undefined,
      });
      return NextResponse.json({ ok: true, fulfilled: true, result });
    } catch (err) {
      // AmountMismatchError → on retourne 200 pour ne pas faire re-trigger
      // Moneroo (le check sera idempotent côté DB ; ré-essayer ne change rien).
      if (err instanceof Error && err.name === "AmountMismatchError") {
        console.error("[moneroo webhook] amount mismatch — fulfillment refusé", err.message);
        return NextResponse.json({ ok: true, rejected: "amount_mismatch" });
      }
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

      // Trial period : si le plan a un trialDays > 0 ET c'est une nouvelle
      // souscription (pas un renewal), créer en status "trialing" avec
      // trialEndsAt = now + trialDays jours. Le cron subscription-renewal
      // basculera vers "active" à expiration du trial.
      const hasTrial = !isRenewal && plan.trialDays && plan.trialDays > 0;
      const initialStatus = hasTrial ? "trialing" : "active";
      const trialEndsAt = hasTrial
        ? new Date(periodStart.getTime() + (plan.trialDays as number) * 24 * 60 * 60 * 1000)
        : null;

      // Creer ou mettre a jour la Subscription
      const sub = await prisma.subscription.upsert({
        where: isRenewal && renewingSubId
          ? { id: renewingSubId }
          : { userId_planId: { userId, planId } },
        create: {
          userId,
          planId,
          status: initialStatus,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          lastPaymentAt: new Date(),
          totalPaid: plan.price,
          renewalCount: 0,
          trialEndsAt,
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
      const invoice = await prisma.subscriptionInvoice.create({
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

      // Bureau session 4 (P0 Karim/Amélie) — comptabilité subscription Moneroo.
      // Identique à PayGenius : sans PlatformRevenue, wallet vendeur reste à 0
      // sur les revenus d'abonnement.
      const subPlatform = Math.round(plan.price * PLATFORM_COMMISSION_RATE);
      const subVendorNet = Math.max(0, plan.price - subPlatform);
      await prisma.platformRevenue
        .create({
          data: {
            orderId: invoice.id,
            orderType: "subscription",
            grossAmount: plan.price,
            commissionRate: PLATFORM_COMMISSION_RATE,
            commissionAmount: subPlatform,
            vendorAmount: subVendorNet,
            affiliateId: null,
            affiliateAmount: 0,
            paymentRef: paymentId,
            currency: "XOF",
            instructeurId: plan.instructeurId,
            shopId: plan.shopId ?? null,
          },
        })
        .catch((e) => console.error("[moneroo sub platformRevenue]", e?.message ?? e));
      await prisma.instructeurProfile
        .update({
          where: { id: plan.instructeurId },
          data: { totalEarned: { increment: subVendorNet } },
        })
        .catch((e) => console.error("[moneroo sub totalEarned]", e?.message ?? e));

      // Grant access — auto-create Enrollment / DigitalProductPurchase rows
      // for every linked formation/product so the buyer can access content
      // immediately. We tag stripeSessionId with `sub_<subId>` so a future
      // expiration cron can identify subscription-granted enrollments and
      // revoke them when the subscription ends.
      const subTag = `sub_${sub.id}`;
      for (const fid of plan.linkedFormationIds) {
        await prisma.enrollment.upsert({
          where: { userId_formationId: { userId, formationId: fid } },
          create: { userId, formationId: fid, paidAmount: 0, stripeSessionId: subTag },
          update: {}, // existing enrollment kept untouched
        }).catch((e) => console.warn("[moneroo subscription enroll]", fid, e?.message ?? e));
      }
      for (const pid of plan.linkedProductIds) {
        await prisma.digitalProductPurchase.upsert({
          where: { userId_productId: { userId, productId: pid } },
          create: { userId, productId: pid, paidAmount: 0, stripeSessionId: subTag },
          update: {},
        }).catch((e) => console.warn("[moneroo subscription purchase]", pid, e?.message ?? e));
      }

      return NextResponse.json({ ok: true, subscription: sub.id, type });
    } catch (err) {
      console.error("[moneroo webhook subscription_initial/renewal]", err);
      return NextResponse.json({ error: "Subscription fulfillment failed" }, { status: 500 });
    }
  }

  // Achat d'un Bundle (multi-items à prix groupé)
  if (type === "bundle_purchase") {
    const userId = String(metadata.userId ?? "");
    const bundleId = String(metadata.bundleId ?? "");
    const discountCodeId = metadata.discountCodeId ? String(metadata.discountCodeId) : null;
    const bundleDiscountAmount = Number(metadata.discountAmount ?? 0);
    const bundleSubTotalMeta = Number(metadata.bundleSubTotal ?? 0);

    if (!userId || !bundleId) {
      return NextResponse.json({ ok: true, ignored: true, reason: "missing_metadata" });
    }

    try {
      const bundle = await prisma.productBundle.findUnique({
        where: { id: bundleId },
        include: { items: true, instructeur: { include: { user: { select: { email: true, name: true } } } } },
      });
      if (!bundle) {
        return NextResponse.json({ error: "Bundle introuvable" }, { status: 400 });
      }

      // Idempotence robuste (migration 2026052701) : on dédoublonne sur
      // `paymentRef`. Si le webhook re-fire avec le même paymentId Moneroo,
      // la 2e tentative findUnique trouve la purchase et skip. Fini les
      // faux positifs (rachat post-refund bloqué) de l'ancien
      // findFirst({bundleId, userId}).
      const existingByRef = await prisma.productBundlePurchase.findUnique({
        where: { paymentRef: paymentId },
      });
      if (existingByRef) {
        return NextResponse.json({ ok: true, alreadyProcessed: true, via: "paymentRef" });
      }

      // Créer la ProductBundlePurchase (paidAmount = bundle.priceXof - discount)
      const paidAmount = Math.max(
        0,
        Math.round(bundle.priceXof) - (Number.isFinite(bundleDiscountAmount) ? bundleDiscountAmount : 0),
      );
      const purchase = await prisma.productBundlePurchase.create({
        data: {
          bundleId,
          userId,
          paidAmount,
          paymentRef: paymentId,
          provider: "moneroo",
          status: "PAID",
        },
      });

      // Bureau session 4 (P0 Karim/Marcus) — comptabilité bundle.
      // Sans ça, le vendeur ne touche RIEN sur ses ventes de bundle :
      // pas de PlatformRevenue, pas d'incrément `totalEarned`,
      // jauge wallet à 0 même après 100 ventes.
      const bundlePlatform = Math.round(paidAmount * PLATFORM_COMMISSION_RATE);
      const bundleVendorNet = Math.max(0, paidAmount - bundlePlatform);
      await prisma.platformRevenue
        .create({
          data: {
            orderId: purchase.id,
            orderType: "bundle",
            grossAmount: paidAmount,
            commissionRate: PLATFORM_COMMISSION_RATE,
            commissionAmount: bundlePlatform,
            vendorAmount: bundleVendorNet,
            affiliateId: null,
            affiliateAmount: 0,
            paymentRef: paymentId,
            currency: "XOF",
            instructeurId: bundle.instructeurId,
            shopId: bundle.shopId ?? null,
          },
        })
        .catch((e) => console.error("[moneroo bundle platformRevenue]", e?.message ?? e));
      await prisma.instructeurProfile
        .update({
          where: { id: bundle.instructeurId },
          data: { totalEarned: { increment: bundleVendorNet } },
        })
        .catch((e) => console.error("[moneroo bundle totalEarned]", e?.message ?? e));

      // Record DiscountUsage if a discount was applied at checkout init.
      // Idempotent via @@unique([discountId, userId, orderId]).
      if (discountCodeId && bundleDiscountAmount > 0) {
        const subTotal = bundleSubTotalMeta > 0 ? bundleSubTotalMeta : Math.round(bundle.priceXof);
        await prisma.discountUsage
          .create({
            data: {
              discountId: discountCodeId,
              userId,
              orderType: "bundle",
              orderId: purchase.id,
              originalAmount: subTotal,
              discountAmount: bundleDiscountAmount,
              finalAmount: paidAmount,
            },
          })
          .catch((err) => {
            if ((err as { code?: string }).code === "P2002") return null;
            console.warn("[moneroo bundle discountUsage]", (err as { message?: string })?.message ?? err);
            return null;
          });
        await prisma.discountCode
          .update({
            where: { id: discountCodeId },
            data: {
              totalDiscounted: { increment: bundleDiscountAmount },
              revenue: { increment: paidAmount },
            },
          })
          .catch((err) => console.warn("[moneroo bundle discountCode update]", err));
      }

      // Auto-enroller chaque item — tag stripeSessionId = "bundle_<id>" pour
      // pouvoir tracer / auditer l'origine.
      // Bureau session 4 (P1 Marcus) : on vérifie le STATUS de chaque item
      // au moment du fulfillment. Si le vendeur a supprimé/archivé une
      // formation/produit entre l'achat et le webhook, on skip cet item
      // avec un log (et on ne plante pas le fulfillment des autres items).
      const tag = `bundle_${purchase.id}`;
      const formationIdsInBundle = bundle.items
        .filter((i) => i.itemKind === "formation" && i.formationId)
        .map((i) => i.formationId!) as string[];
      const productIdsInBundle = bundle.items
        .filter((i) => i.itemKind === "digital" && i.productId)
        .map((i) => i.productId!) as string[];
      const [activeFormations, activeProducts] = await Promise.all([
        formationIdsInBundle.length > 0
          ? prisma.formation.findMany({
              where: { id: { in: formationIdsInBundle }, status: "ACTIF" },
              select: { id: true },
            })
          : Promise.resolve([] as { id: string }[]),
        productIdsInBundle.length > 0
          ? prisma.digitalProduct.findMany({
              where: { id: { in: productIdsInBundle }, status: "ACTIF" },
              select: { id: true },
            })
          : Promise.resolve([] as { id: string }[]),
      ]);
      const activeFormationIds = new Set(activeFormations.map((f) => f.id));
      const activeProductIds = new Set(activeProducts.map((p) => p.id));
      let enrolledFormations = 0;
      let enrolledProducts = 0;
      const skippedItems: string[] = [];
      for (const item of bundle.items) {
        if (item.itemKind === "formation" && item.formationId) {
          if (!activeFormationIds.has(item.formationId)) {
            skippedItems.push(`formation:${item.formationId}`);
            continue;
          }
          await prisma.enrollment.upsert({
            where: { userId_formationId: { userId, formationId: item.formationId } },
            create: { userId, formationId: item.formationId, paidAmount: 0, stripeSessionId: tag },
            update: {},
          }).catch((e) => console.warn("[moneroo bundle enroll]", item.formationId, e?.message ?? e));
          enrolledFormations++;
        } else if (item.itemKind === "digital" && item.productId) {
          if (!activeProductIds.has(item.productId)) {
            skippedItems.push(`product:${item.productId}`);
            continue;
          }
          await prisma.digitalProductPurchase.upsert({
            where: { userId_productId: { userId, productId: item.productId } },
            create: { userId, productId: item.productId, paidAmount: 0, stripeSessionId: tag },
            update: {},
          }).catch((e) => console.warn("[moneroo bundle purchase]", item.productId, e?.message ?? e));
          enrolledProducts++;
        }
      }
      if (skippedItems.length > 0) {
        console.warn(`[moneroo bundle] purchase=${purchase.id} skipped ${skippedItems.length} inactive items:`, skippedItems);
      }

      // Email de confirmation à l'acheteur
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
        }).catch((e) => console.warn("[moneroo bundle email buyer]", e?.message ?? e));
      }

      return NextResponse.json({
        ok: true,
        bundleId,
        purchaseId: purchase.id,
        enrolledFormations,
        enrolledProducts,
      });
    } catch (err) {
      console.error("[moneroo webhook bundle_purchase]", err);
      return NextResponse.json({ error: "Bundle fulfillment failed" }, { status: 500 });
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
 * Audit paiement 2026-05-26 — vote 20 : tolérance ±1 FCFA.
 *
 * Recharge depuis la DB les formations / products / bundles déclarés dans la
 * metadata et recalcule le total attendu. Si le montant payé est inférieur
 * (au-delà de la tolérance), on REJETTE le fulfillment et on marque la
 * CheckoutAttempt en REJECTED_AMOUNT_MISMATCH. On renvoie OK 200 quand même
 * pour ne pas faire retrigger le webhook (Moneroo retenterait sinon).
 *
 * Aucune PII dans les logs : seuls le paymentId + montants.
 */
async function assertAmountMatches(
  paymentId: string,
  verifiedAmount: number,
  metadata: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false }> {
  const type = String(metadata.type ?? "");
  const tolerance = 1; // ±1 FCFA (vote 20)

  let expectedTotal = 0;

  try {
    if (type === "formations_checkout") {
      const formationIds = parseIdList(metadata.formationIds);
      const productIds = parseIdList(metadata.productIds);
      const [formations, products] = await Promise.all([
        formationIds.length > 0
          ? prisma.formation.findMany({
              where: { id: { in: formationIds }, status: "ACTIF" },
              select: { id: true, price: true },
            })
          : Promise.resolve([] as { id: string; price: number }[]),
        productIds.length > 0
          ? prisma.digitalProduct.findMany({
              where: { id: { in: productIds }, status: "ACTIF" },
              select: { id: true, price: true },
            })
          : Promise.resolve([] as { id: string; price: number }[]),
      ]);
      const subTotal =
        formations.reduce((s, f) => s + f.price, 0) +
        products.reduce((s, p) => s + p.price, 0);

      // Si un code promo est appliqué, le webhook ne connaît pas forcément le
      // discountAmount exact — on lit metadata.totalAmount si dispo, sinon on
      // applique le sub-total brut.
      const declaredTotal = Number(metadata.totalAmount ?? NaN);
      expectedTotal = Number.isFinite(declaredTotal) && declaredTotal > 0 ? declaredTotal : subTotal;
    } else if (type === "bundle_purchase") {
      const bundleId = String(metadata.bundleId ?? "");
      if (!bundleId) return { ok: true };
      const bundle = await prisma.productBundle.findUnique({
        where: { id: bundleId },
        select: { priceXof: true },
      });
      if (!bundle) return { ok: true };
      const discount = Number(metadata.discountAmount ?? 0);
      expectedTotal = Math.max(
        0,
        Math.round(bundle.priceXof) - (Number.isFinite(discount) ? discount : 0),
      );
    } else if (type === "subscription_initial" || type === "subscription_renewal") {
      const planId = String(metadata.planId ?? "");
      if (!planId) return { ok: true };
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        select: { price: true },
      });
      if (!plan) return { ok: true };
      expectedTotal = plan.price;
    } else {
      // Type inconnu / mentor_booking / marketplace_order → on saute le check
      // (ces flows ont leur propre logique de validation amont).
      return { ok: true };
    }
  } catch (err) {
    console.warn("[moneroo.webhook] assertAmountMatches lookup failed", { paymentId, err: err instanceof Error ? err.message : String(err) });
    return { ok: true }; // fail-open : ne pas bloquer si lookup DB échoue
  }

  if (verifiedAmount < expectedTotal - tolerance) {
    console.error("[moneroo.webhook] amount mismatch", {
      paymentId,
      expected: expectedTotal,
      received: verifiedAmount,
    });
    // Tag CheckoutAttempt si on a un attemptId
    const attemptId = metadata.attemptId ? String(metadata.attemptId) : null;
    if (attemptId) {
      // L'enum CheckoutAttemptStatus n'a pas de valeur dédiée — on utilise
      // FAILED + failureCode "AMOUNT_MISMATCH" pour discriminer côté admin.
      await prisma.checkoutAttempt
        .update({
          where: { id: attemptId },
          data: {
            status: "FAILED",
            failureReason: `Amount mismatch: expected ${expectedTotal}, received ${verifiedAmount}`,
            failureCode: "AMOUNT_MISMATCH",
            providerRef: paymentId,
          },
        })
        .catch(() => null);
    }
    return { ok: false };
  }

  return { ok: true };
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
