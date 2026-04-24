import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";

/**
 * GET /api/formations/vendeur/subscription-plans
 *   Liste les plans d'abonnement du vendeur.
 *
 * POST /api/formations/vendeur/subscription-plans
 *   Body: { name, description, price, interval ("monthly"|"yearly"),
 *           linkedFormationIds?, linkedProductIds?, trialDays?, maxMembers?, imageUrl? }
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ data: [] });

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        instructeurId: ctx.instructeurId,
        ...(activeShopId ? { shopId: activeShopId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
    return NextResponse.json({ data: plans });
  } catch (err) {
    console.error("[vendeur/subscription-plans GET]", err);
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const body = await request.json();
    const { name, description, imageUrl, price, interval, linkedFormationIds, linkedProductIds, trialDays, maxMembers } = body;

    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json({ error: "Nom requis (3 chars min)" }, { status: 400 });
    }
    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: "Description requise (10 chars min)" }, { status: 400 });
    }
    if (!Number.isFinite(Number(price)) || Number(price) < 500) {
      return NextResponse.json({ error: "Prix minimum : 500 FCFA" }, { status: 400 });
    }
    if (!["monthly", "yearly"].includes(interval)) {
      return NextResponse.json({ error: "Intervalle : monthly ou yearly" }, { status: 400 });
    }
    if ((!Array.isArray(linkedFormationIds) || linkedFormationIds.length === 0) &&
        (!Array.isArray(linkedProductIds) || linkedProductIds.length === 0)) {
      return NextResponse.json({ error: "Liez au moins 1 formation ou 1 produit au plan" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        instructeurId: ctx.instructeurId,
        shopId: activeShopId,
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl?.trim() || null,
        price: Number(price),
        interval,
        linkedFormationIds: Array.isArray(linkedFormationIds) ? linkedFormationIds : [],
        linkedProductIds: Array.isArray(linkedProductIds) ? linkedProductIds : [],
        trialDays: trialDays ? Math.max(0, Math.min(30, Number(trialDays))) : null,
        maxMembers: maxMembers ? Math.max(1, Number(maxMembers)) : null,
      },
    });

    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (err) {
    console.error("[vendeur/subscription-plans POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
