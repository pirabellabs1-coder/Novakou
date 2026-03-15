import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { orderStore, getUserRank, getNextRank, RANK_LEVELS } from "@/lib/dev/data-store";
import { computeBadges } from "@/lib/badges";
import { reviewStore, profileStore } from "@/lib/dev/data-store";

// GET /api/rank — Fetch user's rank, badges, and progress
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const userId = session.user.id;

    // Calculate completed orders
    const orders = orderStore.getByFreelance(userId);
    const completedOrders = orders.filter((o) => o.status === "termine").length;
    const totalOrders = orders.filter((o) => o.status !== "annule").length;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    // Calculate avg rating
    const reviews = reviewStore.getByFreelance(userId);
    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    // Get rank
    const currentRank = getUserRank(completedOrders);
    const nextRankInfo = getNextRank(completedOrders);

    // Compute badges
    // Calculate total revenue for High Seller badge
    const transactions = (await import("@/lib/dev/data-store")).transactionStore.getByUser(userId);
    const totalRevenue = transactions
      .filter((t) => t.type === "vente" && t.status === "complete")
      .reduce((sum, t) => sum + t.amount, 0);

    const badges = computeBadges({
      completedOrders,
      completionRate,
      avgRating,
      kycLevel: session.user.kyc ?? 1,
      plan: session.user.plan ?? "gratuit",
      role: session.user.role,
      isInstructor: session.user.formationsRole === "instructeur",
      totalRevenue,
    });

    return NextResponse.json({
      rank: currentRank,
      nextRank: nextRankInfo.nextRank,
      progress: nextRankInfo.progress,
      salesNeeded: nextRankInfo.salesNeeded,
      completedSales: completedOrders,
      badges,
      stats: {
        completedOrders,
        completionRate,
        avgRating,
        totalReviews: reviews.length,
      },
      allRanks: RANK_LEVELS,
    });
  } catch (error) {
    console.error("[API /rank GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
