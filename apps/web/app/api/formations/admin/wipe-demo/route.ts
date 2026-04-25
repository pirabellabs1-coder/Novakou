import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * POST /api/admin/wipe-demo
 * Body: { mode?: "all" | "products" | "purchases" | "reviews" | "marketing" | "demo-only" }
 *
 * Cleans demo/seed data. Uses cascade deletes via Prisma onDelete: Cascade.
 * "demo-only" removes only items owned by dev-instructeur-001 (the seeded ones).
 * "all" removes EVERY formation, product, enrollment, etc. (use with caution).
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const mode = body.mode ?? "demo-only";

    const stats: Record<string, number> = {};

    if (mode === "demo-only") {
      // Only delete items belonging to the dev seed instructor
      const devProfile = await prisma.instructeurProfile.findUnique({
        where: { userId: "dev-instructeur-001" },
        select: { id: true },
      });
      if (devProfile) {
        const formationsDel = await prisma.formation.deleteMany({
          where: { instructeurId: devProfile.id },
        });
        const productsDel = await prisma.digitalProduct.deleteMany({
          where: { instructeurId: devProfile.id },
        });
        stats.formations = formationsDel.count;
        stats.products = productsDel.count;
      } else {
        stats.formations = 0;
        stats.products = 0;
      }
      // Reset orphan stats counters
      stats.notes = 0;
    }

    if (mode === "all") {
      // Delete in order to respect FK constraints (or rely on cascades)
      const reviews1 = await prisma.formationReview.deleteMany({});
      const reviews2 = await prisma.digitalProductReview.deleteMany({});
      const enrollments = await prisma.enrollment.deleteMany({});
      const purchases = await prisma.digitalProductPurchase.deleteMany({});
      const cartItems = await prisma.cartItem.deleteMany({});
      const formations = await prisma.formation.deleteMany({});
      const products = await prisma.digitalProduct.deleteMany({});
      // Reset instructor totalEarned
      await prisma.instructeurProfile.updateMany({ data: { totalEarned: 0 } });
      stats.formationReviews = reviews1.count;
      stats.productReviews = reviews2.count;
      stats.enrollments = enrollments.count;
      stats.purchases = purchases.count;
      stats.cartItems = cartItems.count;
      stats.formations = formations.count;
      stats.products = products.count;
    }

    if (mode === "products") {
      const formations = await prisma.formation.deleteMany({});
      const products = await prisma.digitalProduct.deleteMany({});
      stats.formations = formations.count;
      stats.products = products.count;
    }

    if (mode === "purchases") {
      const enrollments = await prisma.enrollment.deleteMany({});
      const purchases = await prisma.digitalProductPurchase.deleteMany({});
      const cartItems = await prisma.cartItem.deleteMany({});
      // Reset stats counters
      await prisma.formation.updateMany({ data: { studentsCount: 0 } });
      await prisma.digitalProduct.updateMany({ data: { salesCount: 0 } });
      await prisma.instructeurProfile.updateMany({ data: { totalEarned: 0 } });
      stats.enrollments = enrollments.count;
      stats.purchases = purchases.count;
      stats.cartItems = cartItems.count;
    }

    if (mode === "reviews") {
      const r1 = await prisma.formationReview.deleteMany({});
      const r2 = await prisma.digitalProductReview.deleteMany({});
      // Reset rating counters
      await prisma.formation.updateMany({ data: { rating: 0, reviewsCount: 0 } });
      await prisma.digitalProduct.updateMany({ data: { rating: 0, reviewsCount: 0 } });
      stats.formationReviews = r1.count;
      stats.productReviews = r2.count;
    }

    if (mode === "marketing") {
      const discounts = await prisma.discountCode.deleteMany({});
      const popups = await prisma.smartPopup.deleteMany({});
      const campaigns = await prisma.campaignTracker.deleteMany({});
      const sequences = await prisma.emailSequence.deleteMany({});
      const workflows = await prisma.automationWorkflow.deleteMany({});
      const funnels = await prisma.salesFunnel.deleteMany({});
      const pixels = await prisma.marketingPixel.deleteMany({});
      stats.discountCodes = discounts.count;
      stats.popups = popups.count;
      stats.campaigns = campaigns.count;
      stats.sequences = sequences.count;
      stats.workflows = workflows.count;
      stats.funnels = funnels.count;
      stats.pixels = pixels.count;
    }

    return NextResponse.json({
      success: true,
      mode,
      deleted: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[wipe-demo]", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: "Erreur serveur", message }, { status: 500 });
  }
}
