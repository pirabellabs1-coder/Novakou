// GET /api/cron/abandoned-cart-check — Détecte les paniers abandonnés
// Appelé par Vercel Cron ou cron externe toutes les 30 minutes
// Détecte les CartItem > 1h sans Enrollment correspondant

import { NextRequest, NextResponse } from "next/server";
import prisma from "@freelancehigh/db";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find cart items older than 1h
    const oldCartItems = await prisma.cartItem.findMany({
      where: {
        createdAt: { lt: oneHourAgo },
      },
    });

    // Filter out cart items where the user already has an enrollment for that formation
    const abandonedCarts = [];
    for (const item of oldCartItems) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: item.userId, formationId: item.formationId },
      });
      if (!enrollment) abandonedCarts.push(item);
    }

    // Group by userId
    const userCarts = new Map<string, string[]>();
    for (const item of abandonedCarts) {
      const userId = item.userId;
      if (!userCarts.has(userId)) userCarts.set(userId, []);
      userCarts.get(userId)!.push(item.id);
    }

    let created = 0;
    for (const [userId, cartItemIds] of userCarts) {
      // Check if an active AbandonedCart already exists for this user
      const existing = await prisma.abandonedCart.findFirst({
        where: {
          userId,
          status: { notIn: ["CONVERTI", "TERMINE", "DESABONNE"] },
        },
      });

      if (!existing) {
        await prisma.abandonedCart.create({
          data: {
            userId,
            cartItemIds,
            detectedAt: new Date(),
            emailSequence: 0,
            status: "DETECTE",
          },
        });
        created++;

        // Create MarketingEvent
        await prisma.marketingEvent.create({
          data: {
            type: "CART_ABANDONED",
            userId,
            metadata: { cartItemCount: cartItemIds.length },
          },
        });
      }
    }

    return NextResponse.json({ success: true, detected: created });
  } catch (error) {
    console.error("[CRON abandoned-cart-check]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
