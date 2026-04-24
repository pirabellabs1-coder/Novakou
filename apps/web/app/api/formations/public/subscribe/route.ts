import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { initPayment } from "@/lib/moneroo";

/**
 * POST /api/formations/public/subscribe
 *
 * Body: { planId }
 *
 * Initialise le paiement de la premiere periode d'un plan d'abonnement
 * via Moneroo. Apres success (webhook), une Subscription sera creee dans
 * /api/webhooks/moneroo (handler 'subscription' ajoute plus bas).
 *
 * L'user DOIT etre connecte (pas guest pour les abonnements).
 */
export async function POST(request: Request) {
  try {
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

    const { planId } = await request.json();
    if (!planId) return NextResponse.json({ error: "planId requis" }, { status: 400 });

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { instructeur: { include: { user: { select: { id: true } } } } },
    });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan introuvable ou inactif" }, { status: 404 });
    }

    // Verifier max members
    if (plan.maxMembers) {
      const currentActive = await prisma.subscription.count({
        where: { planId: plan.id, status: { in: ["active", "trialing"] } },
      });
      if (currentActive >= plan.maxMembers) {
        return NextResponse.json(
          { error: "Plan complet — max membres atteint", code: "MAX_MEMBERS" },
          { status: 400 },
        );
      }
    }

    // Deja abonne ?
    const existing = await prisma.subscription.findFirst({
      where: { userId, planId: plan.id, status: { in: ["active", "trialing", "past_due"] } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Vous etes deja abonne a ce plan", code: "ALREADY_SUBSCRIBED" },
        { status: 400 },
      );
    }

    // User info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!user?.email) return NextResponse.json({ error: "Profil user incomplet" }, { status: 400 });

    const firstName = (user.name || user.email.split("@")[0]).split(" ")[0];
    const lastName = (user.name || "").split(" ").slice(1).join(" ") || "Membre";

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

    // Init paiement Moneroo
    const payment = await initPayment({
      amount: Math.round(plan.price),
      currency: plan.currency || "XOF",
      description: `Abonnement : ${plan.name}`,
      customer: { email: user.email, first_name: firstName, last_name: lastName },
      return_url: `${APP_URL}/payment/return`,
      metadata: {
        type: "subscription_initial",
        planId: plan.id,
        userId,
        instructeurId: plan.instructeurId,
        interval: plan.interval,
      },
    });

    return NextResponse.json({ data: { checkout_url: payment.checkout_url, id: payment.id } });
  } catch (err) {
    console.error("[public/subscribe POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
