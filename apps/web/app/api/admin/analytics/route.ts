import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import {
  serviceStore,
  orderStore,
  transactionStore,
  reviewStore,
  candidatureStore,
  projectStore,
} from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";
import { trackingStore } from "@/lib/tracking/tracking-store";

// GET /api/admin/analytics — Platform analytics
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "30d";

    // Determine date range from period param
    const now = new Date();
    let periodStart: Date;
    let monthsBack: number;
    if (period === "7d") {
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      monthsBack = 1;
    } else if (period === "90d") {
      periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      monthsBack = 3;
    } else if (period === "12m") {
      periodStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      monthsBack = 12;
    } else {
      // default: 30d
      periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      monthsBack = 1;
    }

    const currentYear = now.getFullYear();
    const monthNames = [
      "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
      "Jul", "Aou", "Sep", "Oct", "Nov", "Dec",
    ];

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // ── DEV MODE: use dev stores (unchanged) ──
      const users = devStore.getAll().filter((u) => u.role !== "admin");
      const orders = orderStore.getAll();
      const services = serviceStore.getAll();
      const transactions = transactionStore.getAll();
      const reviews = reviewStore.getAll();
      const candidatures = candidatureStore.getAll();
      const projects = projectStore.getAll();

      const revenueByCategory: Record<string, { revenue: number; orders: number }> = {};
      for (const order of orders) {
        if ((order.status === "termine" || order.status === "livre") && (!order.completedAt || new Date(order.completedAt) >= periodStart)) {
          const cat = order.category || "Non categorise";
          if (!revenueByCategory[cat]) revenueByCategory[cat] = { revenue: 0, orders: 0 };
          revenueByCategory[cat].revenue += order.amount;
          revenueByCategory[cat].orders += 1;
        }
      }

      const usersByCountry: Record<string, number> = {};
      for (const user of users) {
        const country = user.country || "XX";
        usersByCountry[country] = (usersByCountry[country] ?? 0) + 1;
      }
      const orderCountries: Record<string, { clients: number; revenue: number }> = {};
      for (const order of orders) {
        const country = order.clientCountry || "XX";
        if (!orderCountries[country]) orderCountries[country] = { clients: 0, revenue: 0 };
        orderCountries[country].clients += 1;
        if (order.status === "termine") orderCountries[country].revenue += order.amount;
      }

      const registrationTrends = Array.from({ length: 12 }, (_, i) => {
        const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
        const mu = users.filter((u) => u.createdAt.startsWith(monthKey));
        return { month: monthNames[i], monthKey, total: mu.length, freelances: mu.filter((u) => u.role === "freelance").length, clients: mu.filter((u) => u.role === "client").length, agencies: mu.filter((u) => u.role === "agence").length };
      });

      const totalRegistrations = users.length;
      const usersWithOrders = new Set([...orders.map((o) => o.clientId), ...orders.map((o) => o.freelanceId)]).size;
      const usersWithCompletedOrders = new Set(orders.filter((o) => o.status === "termine").flatMap((o) => [o.clientId, o.freelanceId])).size;
      const usersWithReviews = new Set(reviews.map((r) => r.clientId)).size;
      const profileCompleted = Math.round(totalRegistrations * 0.7);

      const revenueTrends = Array.from({ length: monthsBack }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const mo = orders.filter((o) => o.status === "termine" && o.completedAt?.startsWith(monthKey));
        return { month: monthNames[d.getMonth()], monthKey, revenue: Math.round(mo.reduce((s, o) => s + o.amount, 0) * 100) / 100, commission: Math.round(mo.reduce((s, o) => s + o.commission, 0) * 100) / 100, orders: mo.length };
      });

      const activeServices = services.filter((s) => s.status === "actif");
      const reviewStats = {
        totalReviews: reviews.length,
        avgRating: reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0,
        avgQualite: reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.qualite, 0) / reviews.length) * 10) / 10 : 0,
        avgCommunication: reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.communication, 0) / reviews.length) * 10) / 10 : 0,
        avgDelai: reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.delai, 0) / reviews.length) * 10) / 10 : 0,
        reported: reviews.filter((r) => r.reported).length,
        distribution: [
          { stars: 5, count: reviews.filter((r) => r.rating >= 4.5).length },
          { stars: 4, count: reviews.filter((r) => r.rating >= 3.5 && r.rating < 4.5).length },
          { stars: 3, count: reviews.filter((r) => r.rating >= 2.5 && r.rating < 3.5).length },
          { stars: 2, count: reviews.filter((r) => r.rating >= 1.5 && r.rating < 2.5).length },
          { stars: 1, count: reviews.filter((r) => r.rating < 1.5).length },
        ],
      };

      const paymentMethods: Record<string, number> = {};
      for (const tx of transactions) { const m = tx.method ?? "carte_bancaire"; paymentMethods[m] = (paymentMethods[m] ?? 0) + 1; }

      const trafficStats30d = trackingStore.getStats({ period: (period === "12m" ? "90d" : period) as "1d" | "7d" | "30d" | "90d" });

      return NextResponse.json({
        revenueByCategory: Object.entries(revenueByCategory).map(([category, data]) => ({ category, revenue: Math.round(data.revenue * 100) / 100, orders: data.orders })).sort((a, b) => b.revenue - a.revenue),
        topCountries: Object.entries(orderCountries).map(([country, data]) => ({ country, users: usersByCountry[country] ?? 0, orders: data.clients, revenue: Math.round(data.revenue * 100) / 100 })).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        registrationTrends,
        conversionFunnel: [
          { step: "Inscrits", count: totalRegistrations, rate: 100 },
          { step: "Profil complété", count: profileCompleted, rate: totalRegistrations > 0 ? Math.round((profileCompleted / totalRegistrations) * 100) : 0 },
          { step: "1ère commande", count: usersWithOrders, rate: totalRegistrations > 0 ? Math.round((usersWithOrders / totalRegistrations) * 100) : 0 },
          { step: "Commande terminée", count: usersWithCompletedOrders, rate: totalRegistrations > 0 ? Math.round((usersWithCompletedOrders / totalRegistrations) * 100) : 0 },
          { step: "Avis laissé", count: usersWithReviews, rate: totalRegistrations > 0 ? Math.round((usersWithReviews / totalRegistrations) * 100) : 0 },
        ],
        servicePerformance: {
          totalViews: services.reduce((s, sv) => s + sv.views, 0),
          totalClicks: services.reduce((s, sv) => s + sv.clicks, 0),
          totalOrders: services.reduce((s, sv) => s + sv.orderCount, 0),
          avgCTR: 0, avgConversion: 0,
          avgRating: activeServices.length > 0 ? Math.round(activeServices.filter((sv) => sv.ratingCount > 0).reduce((s, sv) => s + sv.rating, 0) / Math.max(1, activeServices.filter((sv) => sv.ratingCount > 0).length) * 10) / 10 : 0,
          topServices: [...services].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((sv) => ({ id: sv.id, title: sv.title, category: sv.categoryName, revenue: sv.revenue, orders: sv.orderCount, rating: sv.rating, views: sv.views })),
        },
        revenueTrends,
        projectStats: { totalProjects: projects.length, openProjects: projects.filter((p) => p.status === "ouvert").length, filledProjects: projects.filter((p) => p.status === "pourvu").length, closedProjects: projects.filter((p) => p.status === "ferme").length, totalCandidatures: candidatures.length, acceptedCandidatures: candidatures.filter((c) => c.status === "acceptee").length, avgProposalsPerProject: projects.length > 0 ? Math.round((projects.reduce((s, p) => s + p.proposals, 0) / projects.length) * 10) / 10 : 0 },
        reviewStats,
        paymentMethods,
        trafficAnalytics: { pageViewsTrend: trafficStats30d.pageViewsTrend, sessionsTrend: trafficStats30d.sessionsTrend, topReferrers: trafficStats30d.topReferrers, utmBreakdown: trafficStats30d.utmBreakdown, deviceBreakdown: trafficStats30d.deviceBreakdown, bounceRate: trafficStats30d.bounceRate, avgSessionDuration: trafficStats30d.avgSessionDuration, totalPageViews: trafficStats30d.totalPageViews, uniqueVisitors: trafficStats30d.uniqueVisitors, totalSessions: trafficStats30d.totalSessions },
      });
    }

    // ══════════════════════════════════════════════
    // PRODUCTION: Prisma queries on real database
    // ══════════════════════════════════════════════

    // ── Registration Trends (12 months) ──
    const registrationTrends = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentYear, i, 1);
      const nextMonth = new Date(currentYear, i + 1, 1);
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;

      const [total, freelances, clients, agencies] = await Promise.all([
        prisma.user.count({ where: { role: { not: "ADMIN" }, createdAt: { gte: d, lt: nextMonth } } }),
        prisma.user.count({ where: { role: "FREELANCE", createdAt: { gte: d, lt: nextMonth } } }),
        prisma.user.count({ where: { role: "CLIENT", createdAt: { gte: d, lt: nextMonth } } }),
        prisma.user.count({ where: { role: "AGENCE", createdAt: { gte: d, lt: nextMonth } } }),
      ]);

      registrationTrends.push({ month: monthNames[i], monthKey, total, freelances, clients, agencies });
    }

    // ── Revenue by Category ──
    const categoryRevenue = await prisma.order.findMany({
      where: { status: { in: ["TERMINE", "LIVRE"] }, completedAt: { gte: periodStart } },
      include: { service: { include: { category: { select: { name: true } } } } },
    });
    const revByCat: Record<string, { revenue: number; orders: number }> = {};
    for (const o of categoryRevenue) {
      const cat = o.service?.category?.name || "Non categorise";
      if (!revByCat[cat]) revByCat[cat] = { revenue: 0, orders: 0 };
      revByCat[cat].revenue += o.amount;
      revByCat[cat].orders += 1;
    }
    const revenueByCategory = Object.entries(revByCat)
      .map(([category, data]) => ({ category, revenue: Math.round(data.revenue * 100) / 100, orders: data.orders }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Top Countries ──
    const usersWithCountry = await prisma.user.findMany({
      where: { role: { not: "ADMIN" }, country: { not: null } },
      select: { country: true },
    });
    const userCountByCountry: Record<string, number> = {};
    for (const u of usersWithCountry) {
      const c = u.country || "XX";
      userCountByCountry[c] = (userCountByCountry[c] ?? 0) + 1;
    }

    const ordersWithCountry = await prisma.order.findMany({
      where: { status: "TERMINE", completedAt: { gte: periodStart } },
      include: { client: { select: { country: true } } },
    });
    const ordersByCountry: Record<string, { orders: number; revenue: number }> = {};
    for (const o of ordersWithCountry) {
      const c = o.client?.country || "XX";
      if (!ordersByCountry[c]) ordersByCountry[c] = { orders: 0, revenue: 0 };
      ordersByCountry[c].orders += 1;
      ordersByCountry[c].revenue += o.amount;
    }

    const allCountries = new Set([...Object.keys(userCountByCountry), ...Object.keys(ordersByCountry)]);
    const topCountries = [...allCountries]
      .map((country) => ({
        country,
        users: userCountByCountry[country] ?? 0,
        orders: ordersByCountry[country]?.orders ?? 0,
        revenue: Math.round((ordersByCountry[country]?.revenue ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ── Revenue Trends (period-aware) ──
    const revenueTrends = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const [revenueAgg, commissionAgg, orderCount] = await Promise.all([
        prisma.order.aggregate({ where: { status: "TERMINE", completedAt: { gte: d, lt: nextMonth } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { type: "commission", status: "COMPLETE", createdAt: { gte: d, lt: nextMonth } }, _sum: { amount: true } }),
        prisma.order.count({ where: { status: "TERMINE", completedAt: { gte: d, lt: nextMonth } } }),
      ]);

      revenueTrends.push({
        month: monthNames[d.getMonth()],
        monthKey,
        revenue: Math.round((revenueAgg._sum.amount ?? 0) * 100) / 100,
        commission: Math.round(Math.abs(commissionAgg._sum.amount ?? 0) * 100) / 100,
        orders: orderCount,
      });
    }

    // ── Conversion Funnel ──
    const [totalUsers, usersWithProfile, usersWithFirstOrder, usersWithComplete, usersWithReview] = await Promise.all([
      prisma.user.count({ where: { role: { not: "ADMIN" } } }),
      prisma.freelancerProfile.count({ where: { bio: { not: null } } }),
      prisma.user.count({
        where: {
          role: { not: "ADMIN" },
          OR: [
            { ordersAsClient: { some: {} } },
            { ordersAsFreelance: { some: {} } },
          ],
        },
      }),
      prisma.user.count({
        where: {
          role: { not: "ADMIN" },
          OR: [
            { ordersAsClient: { some: { status: "TERMINE" } } },
            { ordersAsFreelance: { some: { status: "TERMINE" } } },
          ],
        },
      }),
      prisma.user.count({ where: { reviewsGiven: { some: {} } } }),
    ]);

    const conversionFunnel = [
      { step: "Inscrits", count: totalUsers, rate: 100 },
      { step: "Profil complété", count: usersWithProfile, rate: totalUsers > 0 ? Math.round((usersWithProfile / totalUsers) * 100) : 0 },
      { step: "1ère commande", count: usersWithFirstOrder, rate: totalUsers > 0 ? Math.round((usersWithFirstOrder / totalUsers) * 100) : 0 },
      { step: "Commande terminée", count: usersWithComplete, rate: totalUsers > 0 ? Math.round((usersWithComplete / totalUsers) * 100) : 0 },
      { step: "Avis laissé", count: usersWithReview, rate: totalUsers > 0 ? Math.round((usersWithReview / totalUsers) * 100) : 0 },
    ];

    // ── Review Stats ──
    const [reviewAgg, reviewCount, reviewDistribution] = await Promise.all([
      prisma.review.aggregate({ _avg: { rating: true, quality: true, communication: true, timeliness: true }, _count: { id: true } }),
      prisma.review.count(),
      Promise.all([
        prisma.review.count({ where: { rating: { gte: 4.5 } } }),
        prisma.review.count({ where: { rating: { gte: 3.5, lt: 4.5 } } }),
        prisma.review.count({ where: { rating: { gte: 2.5, lt: 3.5 } } }),
        prisma.review.count({ where: { rating: { gte: 1.5, lt: 2.5 } } }),
        prisma.review.count({ where: { rating: { lt: 1.5 } } }),
      ]),
    ]);

    const reviewStats = {
      totalReviews: reviewCount,
      avgRating: Math.round((reviewAgg._avg.rating ?? 0) * 10) / 10,
      avgQualite: Math.round((reviewAgg._avg.quality ?? 0) * 10) / 10,
      avgCommunication: Math.round((reviewAgg._avg.communication ?? 0) * 10) / 10,
      avgDelai: Math.round((reviewAgg._avg.timeliness ?? 0) * 10) / 10,
      reported: 0,
      distribution: [
        { stars: 5, count: reviewDistribution[0] },
        { stars: 4, count: reviewDistribution[1] },
        { stars: 3, count: reviewDistribution[2] },
        { stars: 2, count: reviewDistribution[3] },
        { stars: 1, count: reviewDistribution[4] },
      ],
    };

    // ── Service Performance ──
    const [totalViews, totalOrders, avgServiceRating, topServicesRaw] = await Promise.all([
      prisma.service.aggregate({ _sum: { views: true } }),
      prisma.service.aggregate({ _sum: { orderCount: true } }),
      prisma.service.aggregate({ where: { status: "ACTIF", ratingCount: { gt: 0 } }, _avg: { rating: true } }),
      prisma.service.findMany({ where: { status: "ACTIF" }, orderBy: { orderCount: "desc" }, take: 5, include: { category: { select: { name: true } } } }),
    ]);

    const servicePerformance = {
      totalViews: totalViews._sum.views ?? 0,
      totalClicks: 0,
      totalOrders: totalOrders._sum.orderCount ?? 0,
      avgCTR: 0,
      avgConversion: 0,
      avgRating: Math.round((avgServiceRating._avg.rating ?? 0) * 10) / 10,
      topServices: topServicesRaw.map((s) => ({
        id: s.id, title: s.title, category: s.category?.name ?? "", revenue: 0, orders: s.orderCount, rating: s.rating, views: s.views,
      })),
    };

    // ── Payment Methods ──
    const payments = await prisma.payment.groupBy({ by: ["method"], _count: { id: true }, where: { method: { not: null } } });
    const paymentMethods: Record<string, number> = {};
    for (const p of payments) {
      if (p.method) paymentMethods[p.method] = p._count.id;
    }

    // ── Traffic Analytics (from tracking store, period-aware) ──
    const trafficStatsPeriod = trackingStore.getStats({ period: (period === "12m" ? "90d" : period) as "1d" | "7d" | "30d" | "90d" });

    return NextResponse.json({
      revenueByCategory,
      topCountries,
      registrationTrends,
      conversionFunnel,
      servicePerformance,
      revenueTrends,
      projectStats: { totalProjects: 0, openProjects: 0, filledProjects: 0, closedProjects: 0, totalCandidatures: 0, acceptedCandidatures: 0, avgProposalsPerProject: 0 },
      reviewStats,
      paymentMethods,
      trafficAnalytics: {
        pageViewsTrend: trafficStatsPeriod.pageViewsTrend,
        sessionsTrend: trafficStatsPeriod.sessionsTrend,
        topReferrers: trafficStatsPeriod.topReferrers,
        utmBreakdown: trafficStatsPeriod.utmBreakdown,
        deviceBreakdown: trafficStatsPeriod.deviceBreakdown,
        bounceRate: trafficStatsPeriod.bounceRate,
        avgSessionDuration: trafficStatsPeriod.avgSessionDuration,
        totalPageViews: trafficStatsPeriod.totalPageViews,
        uniqueVisitors: trafficStatsPeriod.uniqueVisitors,
        totalSessions: trafficStatsPeriod.totalSessions,
      },
    });
  } catch (error) {
    console.error("[API /admin/analytics GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des analytics" },
      { status: 500 }
    );
  }
}
