import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  serviceStore,
  boostStore,
  BOOST_TIERS,
} from "@/lib/dev/data-store";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";
import { canBoost, normalizePlanName, getPlanLimits } from "@/lib/plans";

// POST /api/services/[id]/boost — Activate a boost on a service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const service = serviceStore.getById(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (service.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    // Service must be active to be boosted
    if (service.status !== "actif") {
      return NextResponse.json(
        {
          error:
            "Seuls les services actifs peuvent etre boostes. Veuillez activer votre service d'abord.",
        },
        { status: 400 }
      );
    }

    // Check if there is already an active boost
    const existingBoost = boostStore.getActiveBoost(id);
    if (existingBoost) {
      return NextResponse.json(
        {
          error:
            "Ce service a deja un boost actif. Attendez son expiration avant d'en activer un nouveau.",
          currentBoost: {
            tier: existingBoost.tier,
            expiresAt: existingBoost.expiresAt,
          },
        },
        { status: 409 }
      );
    }

    // Anti-abus : rate limiting (max 3 tentatives de boost par heure)
    const rateLimitKey = `boost:${session.user.id}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives de boost. Veuillez patienter." },
        { status: 429 }
      );
    }
    recordFailedAttempt(rateLimitKey);

    // Anti-abus : limite de boosts par plan par mois (using centralized plan rules)
    const userPlan = normalizePlanName(session.user.plan);
    const planLimits = getPlanLimits(userPlan);

    if (planLimits.boostLimit === 0) {
      return NextResponse.json(
        {
          error: "Le plan Gratuit ne permet pas de booster des services. Passez au plan Pro ou superieur.",
          code: "PLAN_REQUIRED",
        },
        { status: 403 }
      );
    }

    // Compter les boosts actives ce mois-ci par cet utilisateur
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const userBoostsThisMonth = boostStore.getByUser(session.user.id)
      .filter((b) => b.startedAt >= monthStart).length;

    if (!canBoost(userPlan, userBoostsThisMonth)) {
      return NextResponse.json(
        {
          error: `Vous avez atteint la limite de ${planLimits.boostLimit} boost(s) par mois pour le plan ${planLimits.name}. Passez a un plan superieur pour plus de boosts.`,
          code: "BOOST_LIMIT_REACHED",
          limit: planLimits.boostLimit,
          used: userBoostsThisMonth,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tier } = body;

    // Validate the boost tier
    if (!tier || !BOOST_TIERS[tier as keyof typeof BOOST_TIERS]) {
      return NextResponse.json(
        {
          error:
            'Tier de boost invalide. Les options valides sont : "standard", "premium", "ultime".',
          availableTiers: BOOST_TIERS,
        },
        { status: 400 }
      );
    }

    const validTier = tier as keyof typeof BOOST_TIERS;
    const tierConfig = BOOST_TIERS[validTier];

    // Activate the boost (this also creates a transaction and notification)
    const boost = boostStore.activate(id, session.user.id, validTier);

    return NextResponse.json({
      boost,
      tierDetails: {
        name: tierConfig.name,
        duration: tierConfig.duration,
        price: tierConfig.price,
        estimatedViews: tierConfig.estimatedViews,
      },
      message: `${tierConfig.name} active pour ${tierConfig.duration} jours. Votre service sera mis en avant dans le marketplace.`,
    });
  } catch (error) {
    console.error("[API /services/[id]/boost POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'activation du boost" },
      { status: 500 }
    );
  }
}

// GET /api/services/[id]/boost — Get boost info for a service
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const service = serviceStore.getById(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (service.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    // Get active boost
    const activeBoost = boostStore.getActiveBoost(id);

    // Get boost history for this service
    const boostHistory = boostStore.getByService(id);

    // Calculate total stats from all boosts
    const totalStats = boostHistory.reduce(
      (acc, b) => ({
        totalSpent: acc.totalSpent + b.price,
        totalViews: acc.totalViews + b.viewsGenerated,
        totalClicks: acc.totalClicks + b.clicksGenerated,
        totalOrders: acc.totalOrders + b.ordersGenerated,
      }),
      { totalSpent: 0, totalViews: 0, totalClicks: 0, totalOrders: 0 }
    );

    return NextResponse.json({
      activeBoost,
      history: boostHistory,
      stats: totalStats,
      availableTiers: BOOST_TIERS,
    });
  } catch (error) {
    console.error("[API /services/[id]/boost GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des informations de boost" },
      { status: 500 }
    );
  }
}
