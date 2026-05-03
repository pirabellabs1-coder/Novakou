/**
 * GET /api/formations/public/memberships/[id]
 * Public detail endpoint for a vendor subscription plan (membership).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: {
      instructeur: { select: { id: true, user: { select: { id: true, name: true, image: true } } } },
      shop: { select: { id: true, slug: true, name: true, themeColor: true, logoUrl: true } },
    },
  });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });
  }

  // Hydrate linked formations + products (titles/images for display)
  const [formations, products] = await Promise.all([
    plan.linkedFormationIds.length > 0
      ? prisma.formation.findMany({
          where: { id: { in: plan.linkedFormationIds }, status: "ACTIF" },
          select: { id: true, slug: true, title: true, thumbnail: true, price: true },
        })
      : Promise.resolve([]),
    plan.linkedProductIds.length > 0
      ? prisma.digitalProduct.findMany({
          where: { id: { in: plan.linkedProductIds }, status: "ACTIF" },
          select: { id: true, slug: true, title: true, banner: true, price: true },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    data: {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      imageUrl: plan.imageUrl,
      bannerUrl: plan.bannerUrl,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      trialDays: plan.trialDays,
      maxMembers: plan.maxMembers,
      activeCount: plan.activeCount,
      instructeur: {
        id: plan.instructeur.id,
        userId: plan.instructeur.user?.id,
        name: plan.instructeur.user?.name,
        image: plan.instructeur.user?.image,
      },
      shop: plan.shop,
      includedFormations: formations,
      includedProducts: products,
    },
  });
}
