// POST /api/webhooks/stripe — Stripe webhook handler
// Handles: formations, digital products, marketing, AND marketplace events (Connect, escrow)

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@freelancehigh/db";
import { sendEnrollmentConfirmedEmail, sendNewStudentNotificationEmail, sendCohortEnrollmentEmail, sendDigitalProductDeliveryEmail, sendLicenseKeyEmail } from "@/lib/email/formations";
import { stripe } from "@/lib/stripe";
import { onFormationPurchase, onProductPurchase } from "@/lib/marketing/hooks";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
}

// Disable automatic body parsing (required for signature verification)
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    const stripeInstance = getStripe();
    event = stripeInstance.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    const eventType = event.type as string;

    switch (eventType) {
      // ── Checkout & Subscriptions ──
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // ── Payment Intents (marketplace escrow + failures) ──
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      // ── Stripe Connect account updates ──
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      // ── Charges (disputes & refunds) ──
      case "charge.disputed":
        await handleChargeDisputed(event.data.object as unknown as Stripe.Charge);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as unknown as Stripe.Charge);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Erreur traitement ${event.type}:`, error);
    return NextResponse.json({ error: "Erreur traitement" }, { status: 500 });
  }
}

// ── payment_intent.succeeded (marketplace escrow release) ───────────────────

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  const platform = paymentIntent.metadata?.platform;

  // Only handle Novakou marketplace payment intents
  if (platform !== "freelancehigh" || !orderId) {
    console.log(
      `[Stripe Webhook] payment_intent.succeeded — not a marketplace payment, skipping (pi=${paymentIntent.id})`
    );
    return;
  }

  try {
    // Update order status: payment succeeded, escrow funds held
    // For manual capture intents, 'succeeded' means the capture went through
    // and funds have been transferred to the connected account
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        stripePaymentIntentId: paymentIntent.id,
        paidAt: new Date(),
      } as any,
    });

    // Update wallet transaction: mark escrow as released
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

    console.log(
      `[Stripe Webhook] Payment succeeded for order ${orderId} — escrow released (pi=${paymentIntent.id}, amount=${paymentIntent.amount} ${paymentIntent.currency})`
    );
  } catch (error) {
    // If Prisma models don't exist yet (MVP phase), log and continue
    console.error(
      `[Stripe Webhook] Error updating order for payment_intent.succeeded:`,
      error instanceof Error ? error.message : error
    );
  }
}

// ── account.updated (Stripe Connect account status) ─────────────────────────

async function handleAccountUpdated(account: Stripe.Account) {
  const accountId = account.id;

  // Determine verification status
  const chargesEnabled = account.charges_enabled;
  const payoutsEnabled = account.payouts_enabled;
  const detailsSubmitted = account.details_submitted;

  let verificationStatus: string;
  if (chargesEnabled && payoutsEnabled) {
    verificationStatus = "verified";
  } else if (detailsSubmitted) {
    verificationStatus = "pending";
  } else {
    verificationStatus = "incomplete";
  }

  // Check for any requirements
  const currentlyDue = account.requirements?.currently_due ?? [];
  const pastDue = account.requirements?.past_due ?? [];
  const hasOutstandingRequirements = currentlyDue.length > 0 || pastDue.length > 0;

  try {
    // Update the freelance profile with Stripe account status
    await prisma.user.updateMany({
      where: { stripeAccountId: accountId } as any,
      data: {
        stripeAccountStatus: verificationStatus,
        stripeChargesEnabled: chargesEnabled,
        stripePayoutsEnabled: payoutsEnabled,
        stripeDetailsSubmitted: detailsSubmitted ?? false,
      } as any,
    });

    console.log(
      `[Stripe Webhook] Account updated: ${accountId} — status=${verificationStatus}, charges=${chargesEnabled}, payouts=${payoutsEnabled}${
        hasOutstandingRequirements
          ? `, outstanding_requirements=[${[...currentlyDue, ...pastDue].join(", ")}]`
          : ""
      }`
    );
  } catch (error) {
    // If Prisma models don't have these fields yet, log and continue
    console.error(
      `[Stripe Webhook] Error updating user for account.updated:`,
      error instanceof Error ? error.message : error
    );
  }
}

// ── checkout.session.completed ──────────────────────────────────────────────

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const type = session.metadata?.type;

  if (type === "formation") {
    await handleFormationCheckout(session);
  } else if (type === "cohort") {
    await handleCohortCheckout(session);
  } else if (type === "digital_product") {
    await handleDigitalProductCheckout(session);
  } else if (type === "subscription") {
    await handleSubscriptionCheckout(session);
  } else if (type === "funnel_purchase") {
    await handleFunnelCheckout(session);
  }
}

// ── Subscription checkout ───────────────────────────────────────────────────

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;

  if (!userId || !planId) {
    console.error("[Stripe Webhook] Subscription metadata missing:", session.id);
    return;
  }

  try {
    // Update user subscription tier
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: planId.toUpperCase(),
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        subscriptionUpdatedAt: new Date(),
      } as any,
    });

    console.log(
      `[Stripe Webhook] Subscription activated: userId=${userId}, plan=${planId}, session=${session.id}`
    );
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error updating subscription:`,
      error instanceof Error ? error.message : error
    );
  }
}

// ── Formation checkout (existing) ───────────────────────────────────────────

async function handleFormationCheckout(session: Stripe.Checkout.Session) {
  const { userId, formationIds: formationIdsJson, promoId } = session.metadata ?? {};

  if (!userId || !formationIdsJson) {
    console.error("[Stripe Webhook] Métadonnées manquantes:", session.id);
    return;
  }

  let formationIds: string[];
  try {
    formationIds = JSON.parse(formationIdsJson);
  } catch {
    console.error("[Stripe Webhook] formationIds invalide:", formationIdsJson);
    return;
  }

  if (!formationIds.length) return;

  // Idempotence : vérifier qu'on n'a pas déjà traité cette session
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      formationId: { in: formationIds },
      stripeSessionId: session.id,
    },
  });

  if (existingEnrollment) {
    console.log("[Stripe Webhook] Session déjà traitée (idempotence):", session.id);
    return;
  }

  // Récupérer les formations
  const formations = await prisma.formation.findMany({
    where: { id: { in: formationIds }, status: "ACTIF" },
    include: {
      instructeur: {
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });

  if (formations.length === 0) {
    console.error("[Stripe Webhook] Aucune formation active trouvée pour:", formationIds);
    return;
  }

  // Calculer le prix effectif par formation (avec promo si applicable)
  let discountPct = 0;
  if (promoId) {
    const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
    if (promo?.isActive) discountPct = promo.discountPct;
  }

  // Créer les enrollments et mettre à jour les stats en transaction
  await prisma.$transaction(async (tx) => {
    for (const formation of formations) {
      const paidAmount = formation.price * (1 - discountPct / 100);
      const instructeurRevenue = paidAmount * 0.7; // 70% pour l'instructeur

      // Créer ou retrouver l'enrollment (upsert pour éviter les doublons)
      const existing = await tx.enrollment.findUnique({
        where: { userId_formationId: { userId, formationId: formation.id } },
      });

      if (existing) {
        if (!existing.stripeSessionId) {
          await tx.enrollment.update({
            where: { id: existing.id },
            data: { stripeSessionId: session.id },
          });
        }
        continue;
      }

      await tx.enrollment.create({
        data: {
          userId,
          formationId: formation.id,
          paidAmount,
          stripeSessionId: session.id,
          progress: 0,
        },
      });

      await tx.formation.update({
        where: { id: formation.id },
        data: { studentsCount: { increment: 1 } },
      });

      await tx.instructeurProfile.update({
        where: { id: formation.instructeurId },
        data: { totalEarned: { increment: instructeurRevenue } },
      });
    }

    if (promoId) {
      await tx.promoCode.update({
        where: { id: promoId },
        data: { usageCount: { increment: 1 } },
      });
    }

    await tx.cartItem.deleteMany({
      where: { userId, formationId: { in: formationIds } },
    });
  });

  // Marquer les paniers abandonnés comme convertis
  await prisma.abandonedCart.updateMany({
    where: { userId, status: { not: "CONVERTI" } },
    data: { status: "CONVERTI" },
  }).catch(() => {});

  // Créer MarketingEvent pour chaque formation
  for (const formation of formations) {
    prisma.marketingEvent.create({
      data: {
        type: "PURCHASE_COMPLETED",
        formationId: formation.id,
        userId,
        metadata: {
          sessionId: session.id,
          amount: formation.price * (1 - discountPct / 100),
          source: promoId ? "promo" : "direct",
        },
      },
    }).catch(() => {});
  }

  // Envoyer les emails de confirmation (hors transaction)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (user?.email) {
    for (const formation of formations) {
      const paidAmount = formation.price * (1 - discountPct / 100);

      sendEnrollmentConfirmedEmail({
        email: user.email,
        name: user.name ?? "Apprenant",
        formationTitle: formation.title,
        formationSlug: formation.id,
        paidAmount,
        locale: "fr",
      }).catch((err) => console.error("[Email] sendEnrollmentConfirmedEmail:", err));

      const instrEmail = formation.instructeur?.user?.email;
      if (instrEmail) {
        sendNewStudentNotificationEmail({
          instructeurEmail: instrEmail,
          instructeurName: formation.instructeur?.user?.name ?? "Instructeur",
          studentName: user.name ?? "Apprenant",
          formationTitle: formation.title,
          paidAmount,
        }).catch((err) => console.error("[Email] sendNewStudentNotificationEmail:", err));
      }
    }
  }

  // Fire marketing hooks for each formation purchase (fire-and-forget)
  for (const formation of formations) {
    const paidAmount = formation.price * (1 - discountPct / 100);
    try {
      onFormationPurchase(userId, formation.id, paidAmount, {
        sessionId: session.id,
        source: promoId ? "promo" : "direct",
        formationTitle: formation.title,
      });
    } catch (err) {
      console.error("[Marketing Hooks] Formation purchase hook error:", err);
    }
  }

  console.log(
    `[Stripe Webhook] ${formations.length} enrollment(s) créé(s) pour userId=${userId}, session=${session.id}`
  );
}

// ── Cohort checkout ─────────────────────────────────────────────────────────

async function handleCohortCheckout(session: Stripe.Checkout.Session) {
  const { userId, cohortId, formationId } = session.metadata ?? {};

  if (!userId || !cohortId || !formationId) {
    console.error("[Stripe Webhook] Métadonnées cohorte manquantes:", session.id);
    return;
  }

  // Idempotence
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { userId, formationId, stripeSessionId: session.id },
  });

  if (existingEnrollment) {
    console.log("[Stripe Webhook] Cohort session déjà traitée (idempotence):", session.id);
    return;
  }

  const cohort = await prisma.formationCohort.findUnique({
    where: { id: cohortId },
    include: {
      formation: {
        include: {
          instructeur: {
            include: { user: { select: { email: true, name: true } } },
          },
        },
      },
    },
  });

  if (!cohort) {
    console.error("[Stripe Webhook] Cohorte introuvable:", cohortId);
    return;
  }

  const paidAmount = cohort.price;
  const instructeurRevenue = paidAmount * 0.7;

  await prisma.$transaction(async (tx) => {
    // Atomic check: verify we haven't exceeded maxParticipants
    const currentCohort = await tx.formationCohort.findUnique({
      where: { id: cohortId },
      select: { currentCount: true, maxParticipants: true },
    });

    if (!currentCohort || currentCohort.currentCount >= currentCohort.maxParticipants) {
      throw new Error("COHORT_FULL");
    }

    // Check not already enrolled
    const existing = await tx.enrollment.findUnique({
      where: { userId_formationId: { userId, formationId } },
    });

    if (existing) {
      console.log("[Stripe Webhook] Already enrolled in formation (cohort):", formationId);
      return;
    }

    // Create enrollment with cohortId
    await tx.enrollment.create({
      data: {
        userId,
        formationId,
        cohortId,
        paidAmount,
        stripeSessionId: session.id,
        progress: 0,
      },
    });

    // Increment counters
    const updatedCohort = await tx.formationCohort.update({
      where: { id: cohortId },
      data: { currentCount: { increment: 1 } },
    });

    // Mark as COMPLET if full
    if (updatedCohort.currentCount >= updatedCohort.maxParticipants) {
      await tx.formationCohort.update({
        where: { id: cohortId },
        data: { status: "COMPLET" },
      });
    }

    // Update formation stats
    await tx.formation.update({
      where: { id: formationId },
      data: { studentsCount: { increment: 1 } },
    });

    // Credit instructor
    await tx.instructeurProfile.update({
      where: { id: cohort.formation.instructeurId },
      data: { totalEarned: { increment: instructeurRevenue } },
    });
  });

  // Emails (hors transaction, fire-and-forget)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (user?.email) {
    sendCohortEnrollmentEmail({
      email: user.email,
      name: user.name ?? "Apprenant",
      cohortTitle: cohort.title,
      formationTitle: cohort.formation.title,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      paidAmount,
      cohortId,
      locale: "fr",
    }).catch((err) => console.error("[Email] sendCohortEnrollmentEmail:", err));

    const instrEmail = cohort.formation.instructeur?.user?.email;
    if (instrEmail) {
      sendNewStudentNotificationEmail({
        instructeurEmail: instrEmail,
        instructeurName: cohort.formation.instructeur?.user?.name ?? "Instructeur",
        studentName: user.name ?? "Apprenant",
        formationTitle: `${cohort.title} (${cohort.formation.title})`,
        paidAmount,
      }).catch((err) => console.error("[Email] sendNewStudentNotificationEmail:", err));
    }
  }

  // Fire marketing hook for cohort purchase (fire-and-forget)
  try {
    onFormationPurchase(userId, formationId, paidAmount, {
      sessionId: session.id,
      cohortId,
      source: "cohort",
      formationTitle: cohort.formation.title,
      cohortTitle: cohort.title,
    });
  } catch (err) {
    console.error("[Marketing Hooks] Cohort purchase hook error:", err);
  }

  console.log(
    `[Stripe Webhook] Cohort enrollment créé: userId=${userId}, cohortId=${cohortId}, session=${session.id}`
  );
}

// ── Digital product checkout ────────────────────────────────────────────────

async function handleDigitalProductCheckout(session: Stripe.Checkout.Session) {
  const { userId, productId, flashPromoId } = session.metadata ?? {};

  if (!userId || !productId) {
    console.error("[Stripe Webhook] Métadonnées produit manquantes:", session.id);
    return;
  }

  // Idempotence
  const existing = await prisma.digitalProductPurchase.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    console.log("[Stripe Webhook] Achat produit déjà traité (idempotence):", session.id);
    return;
  }

  const product = await prisma.digitalProduct.findUnique({
    where: { id: productId },
    include: {
      instructeur: {
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });

  if (!product) {
    console.error("[Stripe Webhook] Produit introuvable:", productId);
    return;
  }

  const paidAmount = (session.amount_total ?? 0) / 100;

  // Generate license key for LICENCE type products
  const licenseKey = product.productType === "LICENCE"
    ? generateLicenseKey()
    : null;

  await prisma.$transaction(async (tx) => {
    // Atomic stock check + increment
    if (product.maxBuyers !== null) {
      const updated = await tx.digitalProduct.updateMany({
        where: {
          id: productId,
          currentBuyers: { lt: product.maxBuyers },
        },
        data: {
          currentBuyers: { increment: 1 },
          salesCount: { increment: 1 },
        },
      });
      if (updated.count === 0) {
        throw new Error("STOCK_EXHAUSTED");
      }
    } else {
      await tx.digitalProduct.update({
        where: { id: productId },
        data: { salesCount: { increment: 1 } },
      });
    }

    // Create purchase
    await tx.digitalProductPurchase.create({
      data: {
        userId,
        productId,
        paidAmount,
        stripeSessionId: session.id,
        licenseKey,
      },
    });

    // Revenue for instructor (70%)
    const instructeurRevenue = paidAmount * 0.7;
    await tx.instructeurProfile.update({
      where: { id: product.instructeurId },
      data: { totalEarned: { increment: instructeurRevenue } },
    });

    // Increment flash promo usage
    if (flashPromoId) {
      await tx.flashPromotion.update({
        where: { id: flashPromoId },
        data: { usageCount: { increment: 1 } },
      });
    }
  });

  // MarketingEvent
  prisma.marketingEvent.create({
    data: {
      type: "PURCHASE_COMPLETED",
      digitalProductId: productId,
      userId,
      metadata: {
        sessionId: session.id,
        amount: paidAmount,
        source: flashPromoId ? "flash_promo" : "direct",
        productType: product.productType,
      },
    },
  }).catch(() => {});

  // Mark abandoned carts as converted
  await prisma.abandonedCart.updateMany({
    where: { userId, status: { not: "CONVERTI" } },
    data: { status: "CONVERTI" },
  }).catch(() => {});

  // Send delivery email to buyer (fire-and-forget)
  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (buyer?.email) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
    const downloadUrl = `${baseUrl}/formations/produits/${product.slug}?purchased=true`;

    if (licenseKey) {
      // License key product — send license key email
      sendLicenseKeyEmail({
        email: buyer.email,
        name: buyer.name ?? "Utilisateur",
        productTitle: product.title,
        licenseKey,
        downloadUrl,
        locale: "fr",
      }).catch((err) => console.error("[Email] sendLicenseKeyEmail:", err));
    } else {
      // Standard digital product — send delivery email
      sendDigitalProductDeliveryEmail({
        email: buyer.email,
        name: buyer.name ?? "Utilisateur",
        productTitle: product.title,
        downloadUrl,
        locale: "fr",
      }).catch((err) => console.error("[Email] sendDigitalProductDeliveryEmail:", err));
    }

    // Notify instructor of new sale
    const instrEmail = product.instructeur?.user?.email;
    if (instrEmail) {
      sendNewStudentNotificationEmail({
        instructeurEmail: instrEmail,
        instructeurName: product.instructeur?.user?.name ?? "Instructeur",
        studentName: buyer.name ?? "Utilisateur",
        formationTitle: `[Produit] ${product.title}`,
        paidAmount,
      }).catch((err) => console.error("[Email] sendNewStudentNotificationEmail (product):", err));
    }
  }

  // Fire marketing hook for product purchase (fire-and-forget)
  try {
    onProductPurchase(userId, productId, paidAmount, {
      sessionId: session.id,
      source: flashPromoId ? "flash_promo" : "direct",
      productTitle: product.title,
      productType: product.productType,
    });
  } catch (err) {
    console.error("[Marketing Hooks] Product purchase hook error:", err);
  }

  console.log(
    `[Stripe Webhook] Achat produit ${productId} par userId=${userId}, session=${session.id}`
  );
}

// ── payment_intent.payment_failed ───────────────────────────────────────────

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  const orderId = paymentIntent.metadata?.order_id;
  const failureMessage = paymentIntent.last_payment_error?.message || "Erreur inconnue";
  const failureCode = paymentIntent.last_payment_error?.code || "unknown";

  // Handle marketplace order payment failure
  if (orderId && paymentIntent.metadata?.platform === "freelancehigh") {
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "FAILED",
          paymentFailureReason: failureMessage,
        } as any,
      });

      console.log(
        `[Stripe Webhook] Marketplace payment failed for order ${orderId}: ${failureCode} — ${failureMessage}`
      );
    } catch (error) {
      console.error(
        `[Stripe Webhook] Error updating order for payment failure:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // Create MarketingEvent (for formations/products tracking)
  prisma.marketingEvent.create({
    data: {
      type: "PAYMENT_FAILED",
      userId: userId || null,
      formationId: paymentIntent.metadata?.formationId || null,
      digitalProductId: paymentIntent.metadata?.productId || null,
      metadata: {
        paymentIntentId: paymentIntent.id,
        failureMessage,
        failureCode,
        amount: (paymentIntent.amount ?? 0) / 100,
        orderId: orderId || null,
      },
    },
  }).catch(() => {});

  console.log(
    `[Stripe Webhook] Paiement échoué: ${paymentIntent.id}, userId=${userId}, raison=${failureCode}`
  );
}

// ── charge.disputed ─────────────────────────────────────────────────────────

async function handleChargeDisputed(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === "string"
    ? charge.payment_intent
    : charge.payment_intent?.id;

  // Try to find related enrollment and mark refund requested
  if (paymentIntentId) {
    // Find the checkout session linked to this payment intent
    const stripeInstance = getStripe();
    const sessions = await stripeInstance.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    const session = sessions.data[0];
    if (session?.metadata?.userId) {
      const userId = session.metadata.userId;

      // Update enrollments if formation
      if (session.metadata.type === "formation") {
        await prisma.enrollment.updateMany({
          where: { stripeSessionId: session.id },
          data: { refundRequested: true },
        }).catch(() => {});
      }

      // MarketingEvent
      prisma.marketingEvent.create({
        data: {
          type: "PAYMENT_FAILED",
          userId,
          formationId: session.metadata.formationId || null,
          digitalProductId: session.metadata.productId || null,
          metadata: {
            chargeId: charge.id,
            disputeType: "disputed",
            amount: (charge.amount ?? 0) / 100,
          },
        },
      }).catch(() => {});
    }
  }

  console.log(`[Stripe Webhook] Litige ouvert: charge=${charge.id}`);
}

// ── charge.refunded ─────────────────────────────────────────────────────────

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === "string"
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (paymentIntentId) {
    const stripeInstance = getStripe();
    const sessions = await stripeInstance.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    const session = sessions.data[0];
    if (session?.metadata?.userId) {
      // Update enrollments if formation
      if (session.metadata.type === "formation") {
        await prisma.enrollment.updateMany({
          where: { stripeSessionId: session.id },
          data: {
            refundedAt: new Date(),
          },
        }).catch(() => {});
      }
    }
  }

  console.log(`[Stripe Webhook] Remboursement: charge=${charge.id}, montant=${charge.amount_refunded / 100}€`);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = 4;
  const segmentLength = 4;
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    let part = "";
    for (let j = 0; j < segmentLength; j++) {
      part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(part);
  }
  return parts.join("-"); // e.g. "AB3K-X9F2-M7PQ-1ZYC"
}

// ── Funnel checkout ─────────────────────────────────────────────────────────

async function handleFunnelCheckout(session: Stripe.Checkout.Session) {
  const { funnelId, funnelSlug, visitorId, acceptedItemIds } = session.metadata ?? {};

  if (!funnelId || !acceptedItemIds) {
    console.error("[Stripe Webhook] Funnel metadata manquantes:", session.id);
    return;
  }

  const itemIds = acceptedItemIds.split(",").filter(Boolean);
  const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;

  console.log(
    `[Stripe Webhook] Funnel purchase: funnelId=${funnelId}, items=${itemIds.length}, total=${totalAmount}€, session=${session.id}`
  );

  try {
    // 1. Track the purchase event in funnel analytics
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = prisma as any;
      if (db.salesFunnelEvent) {
        await db.salesFunnelEvent.create({
          data: {
            funnelId,
            type: "purchase",
            stepIndex: -1,
            stepType: "CHECKOUT",
            visitorId: visitorId || "anonymous",
            revenue: totalAmount,
            metadata: { sessionId: session.id, items: itemIds },
          },
        });
      }

      // Update funnel aggregate stats
      if (db.salesFunnel) {
        await db.salesFunnel.update({
          where: { id: funnelId },
          data: {
            totalPurchases: { increment: 1 },
            totalRevenue: { increment: totalAmount },
          },
        });
      }
    } catch (funnelErr) {
      console.error("[Stripe Webhook] Funnel event tracking error:", funnelErr);
    }

    // 2. Enroll the user in purchased formations
    // Try to find the user by email
    let userId: string | null = null;
    if (customerEmail) {
      const user = await prisma.user.findUnique({
        where: { email: customerEmail },
        select: { id: true, name: true },
      });
      if (user) userId = user.id;
    }

    if (userId) {
      for (const itemId of itemIds) {
        // Check if it's a formation
        const formation = await prisma.formation.findUnique({
          where: { id: itemId },
          select: { id: true, instructeurId: true, title: true, studentsCount: true },
        });

        if (formation) {
          // Create enrollment if not already enrolled
          const existing = await prisma.enrollment.findFirst({
            where: { userId, formationId: formation.id },
          });

          if (!existing) {
            await prisma.enrollment.create({
              data: {
                userId,
                formationId: formation.id,
                paidAmount: totalAmount / itemIds.length,
                stripeSessionId: session.id,
              },
            });

            // Increment students count
            await prisma.formation.update({
              where: { id: formation.id },
              data: { studentsCount: { increment: 1 } },
            });
          }

          // Trigger marketing hooks
          try {
            await onFormationPurchase(formation.id, userId, totalAmount / itemIds.length);
          } catch { /* non-blocking */ }

          continue;
        }

        // Check if it's a digital product
        try {
          const product = await prisma.digitalProduct.findUnique({
            where: { id: itemId },
            select: { id: true },
          });
          if (product) {
            await onProductPurchase(product.id, userId, totalAmount / itemIds.length);
          }
        } catch { /* non-blocking */ }
      }
    }

    console.log(`[Stripe Webhook] Funnel checkout processed: ${session.id}, ${itemIds.length} items enrolled`);
  } catch (error) {
    console.error("[Stripe Webhook] Funnel checkout error:", error);
  }
}
