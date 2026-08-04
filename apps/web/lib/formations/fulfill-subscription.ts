import { prisma } from "@/lib/prisma";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";

/**
 * Livraison d'un ABONNEMENT payé.
 *
 * Extrait du webhook de l'ancienne passerelle, qui était le SEUL endroit où
 * cette logique existait : la supprimer sans la déplacer aurait fait
 * disparaître les abonnements avec elle.
 *
 * Ce que « livrer un abonnement » veut dire, concrètement :
 *   • l'abonnement lui-même (période courante, statut) ;
 *   • une facture — sa référence de paiement est unique en base, c'est ce qui
 *     rend l'opération idempotente même si deux confirmations arrivent en même
 *     temps ;
 *   • la comptabilité : sans `PlatformRevenue`, le portefeuille du vendeur
 *     reste à zéro alors que l'argent est bien arrivé ;
 *   • l'accès aux formations et produits liés au plan.
 */
export type SubscriptionFulfillResult = {
  subscriptionId: string;
  /** Vrai si ce paiement avait déjà été traité — rien n'a été refait. */
  dejaTraite: boolean;
};

export async function fulfillSubscription(p: {
  userId: string;
  planId: string;
  /** Référence du paiement chez la passerelle — clé d'idempotence. */
  paymentRef: string;
  paymentProvider: string | null;
  /** Renouvellement d'un abonnement existant plutôt qu'une première souscription. */
  isRenewal?: boolean;
  renewingSubscriptionId?: string | null;
}): Promise<SubscriptionFulfillResult> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: p.planId } });
  if (!plan) throw new Error(`Plan d'abonnement introuvable : ${p.planId}`);

  const dejaFait = await prisma.subscriptionInvoice.findFirst({
    where: { paymentRef: p.paymentRef },
    select: { id: true, subscriptionId: true },
  });
  if (dejaFait) {
    return { subscriptionId: dejaFait.subscriptionId, dejaTraite: true };
  }

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  if (plan.interval === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  const hasTrial = !p.isRenewal && typeof plan.trialDays === "number" && plan.trialDays > 0;
  const trialEndsAt = hasTrial
    ? new Date(periodStart.getTime() + (plan.trialDays as number) * 24 * 60 * 60 * 1000)
    : null;

  const sub = await prisma.subscription.upsert({
    where:
      p.isRenewal && p.renewingSubscriptionId
        ? { id: p.renewingSubscriptionId }
        : { userId_planId: { userId: p.userId, planId: p.planId } },
    create: {
      userId: p.userId,
      planId: p.planId,
      status: hasTrial ? "trialing" : "active",
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
      renewalCount: { increment: p.isRenewal ? 1 : 0 },
      cancelAtPeriodEnd: false,
    },
  });

  // La facture AVANT le crédit vendeur : si deux confirmations arrivent en
  // même temps, la seconde échoue ici (référence unique) et s'arrête — jamais
  // de double crédit.
  let invoice;
  try {
    invoice = await prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: sub.id,
        userId: p.userId,
        amount: plan.price,
        currency: plan.currency,
        status: "paid",
        periodStart,
        periodEnd,
        paymentRef: p.paymentRef,
        paymentProvider: p.paymentProvider,
        paidAt: new Date(),
      },
    });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return { subscriptionId: sub.id, dejaTraite: true };
    }
    throw e;
  }

  await prisma.subscriptionPlan
    .update({
      where: { id: p.planId },
      data: {
        totalEarned: { increment: plan.price },
        ...(p.isRenewal ? {} : { activeCount: { increment: 1 } }),
      },
    })
    .catch(() => null);

  const commission = Math.round(plan.price * PLATFORM_COMMISSION_RATE);
  const netVendeur = Math.max(0, plan.price - commission);
  await prisma.platformRevenue
    .create({
      data: {
        orderId: invoice.id,
        orderType: "subscription",
        grossAmount: plan.price,
        commissionRate: PLATFORM_COMMISSION_RATE,
        commissionAmount: commission,
        vendorAmount: netVendeur,
        affiliateId: null,
        affiliateAmount: 0,
        paymentRef: p.paymentRef,
        currency: "XOF",
        instructeurId: plan.instructeurId,
        shopId: plan.shopId ?? null,
      },
    })
    .catch((e) => console.error("[abonnement] revenu plateforme", e?.message ?? e));
  await prisma.instructeurProfile
    .update({ where: { id: plan.instructeurId }, data: { totalEarned: { increment: netVendeur } } })
    .catch((e) => console.error("[abonnement] total vendeur", e?.message ?? e));

  // Accès aux contenus inclus. Le marqueur `sub_<id>` permet de reconnaître
  // plus tard les accès accordés par abonnement, pour les retirer à son terme.
  const marqueur = `sub_${sub.id}`;
  for (const fid of plan.linkedFormationIds) {
    await prisma.enrollment
      .upsert({
        where: { userId_formationId: { userId: p.userId, formationId: fid } },
        create: { userId: p.userId, formationId: fid, paidAmount: 0, stripeSessionId: marqueur },
        update: {},
      })
      .catch((e) => console.warn("[abonnement] inscription", fid, e?.message ?? e));
  }
  for (const pid of plan.linkedProductIds) {
    await prisma.digitalProductPurchase
      .upsert({
        where: { userId_productId: { userId: p.userId, productId: pid } },
        create: { userId: p.userId, productId: pid, paidAmount: 0, stripeSessionId: marqueur },
        update: {},
      })
      .catch((e) => console.warn("[abonnement] achat produit", pid, e?.message ?? e));
  }

  return { subscriptionId: sub.id, dejaTraite: false };
}
