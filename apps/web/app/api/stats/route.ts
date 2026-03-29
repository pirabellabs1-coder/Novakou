import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { calculateStats } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const stats = calculateStats(session.user.id);
      return NextResponse.json(stats);
    }

    // ── Production: Prisma ──
    const userId = session.user.id;
    const userRole = session.user.role;
    const now = new Date();
    const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];

    // Monthly revenue (last 12 months)
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const where = userRole === "CLIENT"
        ? { clientId: userId, status: "TERMINE" as const, completedAt: { gte: d, lt: nextMonth } }
        : { freelanceId: userId, status: "TERMINE" as const, completedAt: { gte: d, lt: nextMonth } };

      const [orderAgg, orderCount] = await Promise.all([
        prisma.order.aggregate({ where, _sum: { amount: true } }),
        prisma.order.count({ where }),
      ]);

      monthlyRevenue.push({
        month: months[d.getMonth()],
        revenue: Math.round((orderAgg._sum.amount ?? 0) * 100) / 100,
        orders: orderCount,
      });
    }

    // Orders by status
    const orderWhere = userRole === "CLIENT" ? { clientId: userId } : { freelanceId: userId };
    const [activeOrders, completedOrders, totalOrders] = await Promise.all([
      prisma.order.count({ where: { ...orderWhere, status: { in: ["EN_ATTENTE", "EN_COURS", "REVISION"] } } }),
      prisma.order.count({ where: { ...orderWhere, status: "TERMINE" } }),
      prisma.order.count({ where: orderWhere }),
    ]);

    // Services (for freelance/agency)
    const services = userRole !== "CLIENT"
      ? await prisma.service.findMany({ where: { userId }, select: { id: true, status: true, views: true, orderCount: true } })
      : [];
    const totalViews = services.reduce((s, sv) => s + sv.views, 0);
    const totalServiceOrders = services.reduce((s, sv) => s + sv.orderCount, 0);
    const conversionRate = totalViews > 0 ? Math.round((totalServiceOrders / totalViews) * 1000) / 10 : 0;

    // Reviews
    const reviews = await prisma.review.findMany({
      where: { targetId: userId },
      select: { rating: true, quality: true, communication: true, timeliness: true },
    });
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10 : 0;

    // Finance summary — from Payments, Orders, and Wallet
    const [earned, pending, completedOrdersAgg, pendingOrdersAgg] = await Promise.all([
      prisma.payment.aggregate({ where: { payeeId: userId, status: "COMPLETE" }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { payeeId: userId, status: "EN_ATTENTE" }, _sum: { amount: true } }),
      prisma.order.aggregate({ where: { freelanceId: userId, status: "TERMINE" }, _sum: { freelancerPayout: true, amount: true } }),
      prisma.order.aggregate({ where: { freelanceId: userId, status: { in: ["EN_ATTENTE", "EN_COURS", "REVISION"] } }, _sum: { amount: true } }),
    ]);

    // Also check wallet model
    let walletData = { balance: 0, pending: 0, totalEarned: 0 };
    try {
      const wallet = await prisma.walletFreelance.findUnique({ where: { userId } });
      if (wallet) {
        walletData = { balance: wallet.balance, pending: wallet.pending, totalEarned: wallet.totalEarned };
      }
    } catch { /* WalletFreelance may not exist yet */ }

    // Use wallet as primary source of truth; fallback to orders only if wallet is empty
    const orderEarned = Math.round((completedOrdersAgg._sum.freelancerPayout ?? completedOrdersAgg._sum.amount ?? 0) * 100) / 100;
    const orderPending = Math.round((pendingOrdersAgg._sum.amount ?? 0) * 100) / 100;

    const hasWallet = walletData.balance > 0 || walletData.pending > 0 || walletData.totalEarned > 0;
    const summaryAvailable = Math.round((hasWallet ? walletData.balance : orderEarned) * 100) / 100;
    const summaryPending = Math.round((hasWallet ? walletData.pending : orderPending) * 100) / 100;
    const summaryTotalEarned = Math.round((hasWallet ? walletData.totalEarned : orderEarned) * 100) / 100;

    const currentMonth = monthlyRevenue[monthlyRevenue.length - 1]?.revenue ?? 0;
    const previousMonth = monthlyRevenue[monthlyRevenue.length - 2]?.revenue ?? 0;
    const revenueTrend = previousMonth > 0 ? Math.round(((currentMonth - previousMonth) / previousMonth) * 1000) / 10 : currentMonth > 0 ? 100 : 0;

    return NextResponse.json({
      summary: {
        available: summaryAvailable,
        pending: summaryPending,
        totalEarned: summaryTotalEarned,
        commissionThisMonth: 0,
      },
      monthlyRevenue,
      activeOrders,
      completedOrders,
      totalOrders,
      avgRating,
      viewsThisMonth: totalViews,
      conversionRate,
      servicesCount: {
        total: services.length,
        active: services.filter((s) => s.status === "ACTIF").length,
        paused: services.filter((s) => s.status === "PAUSE").length,
        draft: services.filter((s) => s.status === "BROUILLON").length,
        pending: services.filter((s) => s.status === "EN_ATTENTE").length,
      },
      revenueThisMonth: currentMonth,
      revenueTrend,
      ordersTrend: 0,
      totalReviews,
      avgQualite: totalReviews > 0 ? Math.round((reviews.reduce((s, r) => s + (r.quality ?? 0), 0) / totalReviews) * 10) / 10 : 0,
      avgCommunication: totalReviews > 0 ? Math.round((reviews.reduce((s, r) => s + (r.communication ?? 0), 0) / totalReviews) * 10) / 10 : 0,
      avgDelai: totalReviews > 0 ? Math.round((reviews.reduce((s, r) => s + (r.timeliness ?? 0), 0) / totalReviews) * 10) / 10 : 0,
      weeklyOrders: [],
      profileViews: [],
    });
  } catch (error) {
    console.error("[API /stats GET]", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul des statistiques" },
      { status: 500 }
    );
  }
}
