// GET /api/cron/abandoned-cart-email — Envoie les emails de relance panier abandonné
// Appelé par Vercel Cron ou cron externe toutes les 15 minutes
// Séquence : 1h → RELANCE_1, 24h → RELANCE_2, 7j → RELANCE_3

import { NextRequest, NextResponse } from "next/server";
import prisma from "@freelancehigh/db";
import {
  sendAbandonedCartEmail1,
  sendAbandonedCartEmail2,
  sendAbandonedCartEmail3,
} from "@/lib/email/formations";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const TWENTY_FOUR_HOURS = 24 * ONE_HOUR;
    const SEVEN_DAYS = 7 * TWENTY_FOUR_HOURS;

    // Fetch all active abandoned carts not yet fully relanced
    const carts = await prisma.abandonedCart.findMany({
      where: {
        status: { in: ["DETECTE", "RELANCE_1", "RELANCE_2"] },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    let sent = 0;

    for (const cart of carts) {
      const timeSinceDetection = now - new Date(cart.detectedAt).getTime();
      const email = cart.user.email;
      const name = cart.user.name || "Apprenant";
      if (!email) continue;

      const cartUrl = `${APP_URL}/checkout`;
      const unsubscribeToken = Buffer.from(cart.userId).toString("base64");
      const unsubscribeUrl = `${APP_URL}/api/formations/unsubscribe/${unsubscribeToken}`;

      // Fetch cart items for email content
      const cartItems = await prisma.cartItem.findMany({
        where: { id: { in: cart.cartItemIds } },
        include: {
          formation: { select: { title: true, price: true, thumbnail: true, learnPoints: true } },
        },
      });

      const items = cartItems
        .filter((ci) => ci.formation)
        .map((ci) => ({
          title: ci.formation!.title,
          price: ci.formation!.price,
          thumbnail: ci.formation!.thumbnail ?? undefined,
          learnPoints: ci.formation!.learnPoints as string[],
        }));

      if (items.length === 0) {
        // Mark as TERMINE if no valid items
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { status: "TERMINE" },
        });
        continue;
      }

      try {
        if (cart.status === "DETECTE" && timeSinceDetection >= ONE_HOUR) {
          await sendAbandonedCartEmail1({ email, name, items, cartUrl, unsubscribeUrl });
          await prisma.abandonedCart.update({
            where: { id: cart.id },
            data: { status: "RELANCE_1", emailSequence: 1, lastEmailAt: new Date() },
          });
          sent++;
        } else if (cart.status === "RELANCE_1" && timeSinceDetection >= TWENTY_FOUR_HOURS) {
          await sendAbandonedCartEmail2({ email, name, items, cartUrl, unsubscribeUrl });
          await prisma.abandonedCart.update({
            where: { id: cart.id },
            data: { status: "RELANCE_2", emailSequence: 2, lastEmailAt: new Date() },
          });
          sent++;
        } else if (cart.status === "RELANCE_2" && timeSinceDetection >= SEVEN_DAYS) {
          await sendAbandonedCartEmail3({ email, name, items, cartUrl, unsubscribeUrl });
          await prisma.abandonedCart.update({
            where: { id: cart.id },
            data: { status: "RELANCE_3", emailSequence: 3, lastEmailAt: new Date() },
          });
          sent++;
        }
      } catch (emailErr) {
        console.error(`[CRON abandoned-cart-email] Failed to send to ${email}:`, emailErr);
      }
    }

    return NextResponse.json({ success: true, emailsSent: sent });
  } catch (error) {
    console.error("[CRON abandoned-cart-email]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
