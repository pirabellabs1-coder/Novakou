/**
 * POST /api/formations/public/memberships/[id]/subscribe
 * Initialise un paiement Moneroo / PayGenius pour s'abonner à un plan.
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
import { initPayment as initMoneroo, isMonerooConfigured } from "@/lib/moneroo";
import { initPayment as initPayGenius, isPayGeniusConfigured } from "@/lib/paygenius";

type Provider = "moneroo" | "paygenius";
function resolveProvider(raw: unknown): Provider {
  return String(raw ?? "").toLowerCase() === "paygenius" ? "paygenius" : "moneroo";
}

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const provider: Provider = resolveProvider((body as { provider?: string }).provider);

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

    // Paid plan → init payment
    const providerOk = provider === "paygenius" ? isPayGeniusConfigured() : isMonerooConfigured();
    if (!providerOk) {
      return NextResponse.json(
        { error: `${provider === "paygenius" ? "PayGenius" : "Moneroo"} non configuré` },
        { status: 503 },
      );
    }

    // ── Affiliate attribution ────────────────────────────────────
    let affiliateProfileId = "";
    let affiliateCommissionRate = 0;
    try {
      const cookieStore = await cookies();
      const affCookie =
        cookieStore.get("fh_ref")?.value ?? cookieStore.get("fh_aff_code")?.value;
      if (affCookie) {
        const prof = await prisma.affiliateProfile.findUnique({
          where: { affiliateCode: affCookie },
          select: {
            id: true, status: true,
            program: { select: { commissionPct: true, isActive: true } },
          },
        });
        if (prof && prof.status === "ACTIVE" && prof.program.isActive) {
          affiliateProfileId = prof.id;
          affiliateCommissionRate = (prof.program.commissionPct ?? 0) / 100;
        }
      }
    } catch (err) {
      console.warn("[subscribe affiliate cookie]", err);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";
    const sessionRef = `sub:${id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const description = `Abonnement Novakou — ${plan.name}`;
    const metadata = {
      type: "subscription_initial",
      sessionRef,
      userId,
      planId: id,
      paymentProvider: provider,
      affiliateProfileId,
      affiliateCommissionRate: String(affiliateCommissionRate),
    };
    const returnUrl = `${appUrl}/payment/return?ref=${encodeURIComponent(sessionRef)}&provider=${provider}`;

    const fName = user.name ?? user.email.split("@")[0];
    const [first, ...rest] = fName.split(" ");
    const last = rest.join(" ") || "User";

    let checkoutUrl: string;
    if (provider === "paygenius") {
      const pg = await initPayGenius({
        amount: Math.round(plan.price), currency: plan.currency, description,
        customer: { email: user.email, name: fName },
        return_url: returnUrl, metadata,
      });
      checkoutUrl = pg.checkout_url;
    } else {
      const mnr = await initMoneroo({
        amount: Math.round(plan.price), currency: plan.currency, description,
        customer: { email: user.email, first_name: first || "Apprenant", last_name: last },
        return_url: returnUrl, metadata,
      });
      checkoutUrl = mnr.checkout_url;
    }

    return NextResponse.json({ data: { checkout_url: checkoutUrl, sessionRef } });
  } catch (err) {
    console.error("[memberships/subscribe]", err);
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
