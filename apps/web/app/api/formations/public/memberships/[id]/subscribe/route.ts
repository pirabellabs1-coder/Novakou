/**
 * POST /api/formations/public/memberships/[id]/subscribe
 * Initialise un paiement la passerelle / PayGenius pour s'abonner à un plan.
 * Au paiement, le webhook (`type: "subscription_initial"`) crée la
 * Subscription + auto-enrolle le user dans toutes les formations/produits liés.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveActiveUserId } from "@/lib/formations/active-user";

type Provider = "passerelle" | "paygenius";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour vous abonner", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });
    }

    // Déjà abonné ?
    const existingSub = await prisma.subscription.findFirst({
      where: { userId, planId: id, status: { in: ["active", "trialing"] } },
    });
    if (existingSub) {
      return NextResponse.json(
        { error: "Vous êtes déjà abonné à ce plan", code: "ALREADY_SUBSCRIBED" },
        { status: 409 },
      );
    }

    // Cap abonnés actifs ?
    if (plan.maxMembers && plan.activeCount >= plan.maxMembers) {
      return NextResponse.json(
        { error: "Plan complet — nombre maximum d'abonnés atteint", code: "MAX_MEMBERS_REACHED" },
        { status: 410 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!user?.email) {
      return NextResponse.json({ error: "Email utilisateur introuvable" }, { status: 400 });
    }

    // Free plan (price=0) → bypass payment, fulfill direct via webhook simulation
    if (plan.price <= 0) {
      // Crée directement la subscription + enroll
      const periodStart = new Date();
      const periodEnd = new Date(periodStart);
      if (plan.interval === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      const sub = await prisma.subscription.create({
        data: {
          userId, planId: id, status: "active",
          currentPeriodStart: periodStart, currentPeriodEnd: periodEnd,
          lastPaymentAt: new Date(), totalPaid: 0, renewalCount: 0,
        },
      });
      // Auto-enroll
      const subTag = `sub_${sub.id}`;
      for (const fid of plan.linkedFormationIds) {
        await prisma.enrollment.upsert({
          where: { userId_formationId: { userId, formationId: fid } },
          create: { userId, formationId: fid, paidAmount: 0, stripeSessionId: subTag },
          update: {},
        }).catch(() => null);
      }
      for (const pid of plan.linkedProductIds) {
        await prisma.digitalProductPurchase.upsert({
          where: { userId_productId: { userId, productId: pid } },
          create: { userId, productId: pid, paidAmount: 0, stripeSessionId: subTag },
          update: {},
        }).catch(() => null);
      }
      await prisma.subscriptionPlan.update({
        where: { id },
        data: { activeCount: { increment: 1 } },
      }).catch(() => null);

      return NextResponse.json({
        data: { free: true, subscriptionId: sub.id, redirect_url: "/apprenant/abonnements" },
      });
    }

    // Essai gratuit (trialDays > 0) → PAS de débit immédiat. On crée directement
    // l'abonnement en "trialing" avec accès complet ; à la fin de l'essai, le cron
    // subscription-renewal envoie le 1er lien de paiement (currentPeriodEnd =
    // trialEndsAt). Sans ça, l'acheteur était débité du plein tarif alors que
    // l'UI promet « Essayer X jours gratuits ».
    if (plan.trialDays && plan.trialDays > 0) {
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
      const sub = await prisma.subscription.create({
        data: {
          userId, planId: id, status: "trialing",
          currentPeriodStart: trialStart, currentPeriodEnd: trialEnd,
          trialEndsAt: trialEnd, totalPaid: 0, renewalCount: 0,
        },
      });
      const subTag = `sub_${sub.id}`;
      for (const fid of plan.linkedFormationIds) {
        await prisma.enrollment.upsert({
          where: { userId_formationId: { userId, formationId: fid } },
          create: { userId, formationId: fid, paidAmount: 0, stripeSessionId: subTag },
          update: {},
        }).catch(() => null);
      }
      for (const pid of plan.linkedProductIds) {
        await prisma.digitalProductPurchase.upsert({
          where: { userId_productId: { userId, productId: pid } },
          create: { userId, productId: pid, paidAmount: 0, stripeSessionId: subTag },
          update: {},
        }).catch(() => null);
      }
      await prisma.subscriptionPlan.update({
        where: { id },
        data: { activeCount: { increment: 1 } },
      }).catch(() => null);

      return NextResponse.json({
        data: { trial: true, subscriptionId: sub.id, redirect_url: "/apprenant/abonnements" },
      });
    }

    // ── Plan PAYANT : le paiement ne part plus d'ici ─────────────────────────
    // Il passe par l'écran de paiement de la plateforme, via
    // /api/formations/payment/init avec `membershipPlanId`. Cette route se
    // contente de dire qu'un paiement est nécessaire.
    //
    // Avant, elle initialisait elle-même un paiement chez une passerelle
    // retirée et renvoyait l'acheteur sur la page hébergée du fournisseur.
    return NextResponse.json({ data: { requiresPayment: true, planId: id, amount: Math.round(plan.price) } });
  } catch (err) {
    console.error("[memberships/subscribe]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
