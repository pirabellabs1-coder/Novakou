// GET /api/formations/cart — Voir le panier
// POST /api/formations/cart — Ajouter au panier
// DELETE /api/formations/cart — Retirer du panier

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";
import { ensureUserInDb } from "@/lib/formations/ensure-user";

const cartItemInclude = {
  formation: {
    select: {
      id: true,
      slug: true,
      title: true,
      shortDesc: true,
      thumbnail: true,
      price: true,
      originalPrice: true,
      isFree: true,
      rating: true,
      reviewsCount: true,
      studentsCount: true,
      duration: true,
      level: true,
      hasCertificate: true,
      status: true,
      instructeur: {
        select: {
          user: { select: { name: true, avatar: true, image: true } },
        },
      },
    },
  },
} as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    // Vérifier si un code promo est passé
    const { searchParams } = new URL(req.url);
    const promoCode = searchParams.get("promo");

    const items = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: cartItemInclude,
      orderBy: { createdAt: "desc" },
    });

    // Filtrer les formations inactives
    const activeItems = items.filter(
      (item) => item.formation.status === "ACTIF"
    );

    const subtotal = activeItems.reduce(
      (acc, item) => acc + item.formation.price,
      0
    );

    let discount = 0;
    let promoDetails = null;

    if (promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: {
          code: promoCode.toUpperCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (promo && (promo.maxUsage === null || promo.usageCount < promo.maxUsage)) {
        // Respect formationIds targeting: only discount applicable formations
        const applicableItems = promo.formationIds.length > 0
          ? activeItems.filter((item) => promo.formationIds.includes(item.formationId))
          : activeItems;
        const applicableSubtotal = applicableItems.reduce(
          (acc, item) => acc + item.formation.price,
          0
        );
        discount = Math.round(applicableSubtotal * (promo.discountPct / 100) * 100) / 100;
        promoDetails = { code: promo.code, discountPct: promo.discountPct };
      }
    }

    return NextResponse.json({
      items: activeItems,
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
      promoCode: promoDetails?.code,
      promoDiscountPct: promoDetails?.discountPct,
    });
  } catch (error) {
    console.error("[GET /api/formations/cart]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const addItemSchema = z.object({ formationId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    const body = await req.json();
    const { formationId } = addItemSchema.parse(body);

    const formation = await prisma.formation.findUnique({
      where: { id: formationId, status: "ACTIF" },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    // Vérifier que l'apprenant n'est pas déjà inscrit
    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_formationId: { userId: session.user.id, formationId } },
    });

    if (enrolled) {
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit à cette formation" },
        { status: 400 }
      );
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_formationId: { userId: session.user.id, formationId } },
      update: {},
      create: { userId: session.user.id, formationId },
      include: cartItemInclude,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[POST /api/formations/cart]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formationId = searchParams.get("formationId");

    if (!formationId) {
      return NextResponse.json({ error: "formationId requis (ou 'all' pour vider le panier)" }, { status: 400 });
    }

    // Support clearing entire cart with ?formationId=all
    if (formationId === "all") {
      await prisma.cartItem.deleteMany({
        where: { userId: session.user.id },
      });
    } else {
      await prisma.cartItem.deleteMany({
        where: { userId: session.user.id, formationId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/formations/cart]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
