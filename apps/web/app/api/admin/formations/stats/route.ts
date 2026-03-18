// GET /api/admin/formations/stats — Stats globales formations pour l'admin

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { PLATFORM_COMMISSION } from "@/lib/formations/config";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalFormations,
      totalStudents,
      certificatesIssued,
      pendingFormations,
      pendingInstructors,
      recentEnrollments,
      recentCertificates,
      prevMonthFormations,
      prevMonthStudents,
      prevMonthCerts,
    ] = await Promise.all([
      prisma.formation.count({ where: { status: "ACTIF" } }),
      prisma.enrollment.count(),
      prisma.certificate.count(),
      prisma.formation.count({ where: { status: "EN_ATTENTE" } }),
      prisma.instructeurProfile.count({ where: { status: "EN_ATTENTE" } }),
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          formation: { select: { titleFr: true } },
        },
      }),
      prisma.certificate.findMany({
        take: 5,
        orderBy: { issuedAt: "desc" },
        include: {
          user: { select: { name: true } },
          enrollment: {
            include: {
              formation: { select: { titleFr: true } },
            },
          },
        },
      }),
      prisma.formation.count({
        where: { status: "ACTIF", createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
      }),
      prisma.enrollment.count({
        where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
      }),
      prisma.certificate.count({
        where: { issuedAt: { gte: startOfPrevMonth, lt: startOfMonth } },
      }),
    ]);

    // Revenue this month
    const monthRevenue = await prisma.enrollment.aggregate({
      where: { createdAt: { gte: startOfMonth }, paidAmount: { gt: 0 } },
      _sum: { paidAmount: true },
    });
    const revenueThisMonth = monthRevenue._sum.paidAmount ?? 0;

    // Revenue prev month (for trend)
    const prevRevenue = await prisma.enrollment.aggregate({
      where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth }, paidAmount: { gt: 0 } },
      _sum: { paidAmount: true },
    });
    const revenuePrevMonth = prevRevenue._sum.paidAmount ?? 0;

    // Current month counts for trend
    const thisMonthFormations = await prisma.formation.count({
      where: { status: "ACTIF", createdAt: { gte: startOfMonth } },
    });
    const thisMonthStudents = await prisma.enrollment.count({
      where: { createdAt: { gte: startOfMonth } },
    });
    const thisMonthCerts = await prisma.certificate.count({
      where: { issuedAt: { gte: startOfMonth } },
    });

    // Compute trends (percentage change vs previous month)
    function trend(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    const trends = {
      formationsTrend: trend(thisMonthFormations, prevMonthFormations),
      studentsTrend: trend(thisMonthStudents, prevMonthStudents),
      revenueTrend: trend(revenueThisMonth, revenuePrevMonth),
      certificatesTrend: trend(thisMonthCerts, prevMonthCerts),
    };

    // Revenue by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const enrollmentsByMonthRaw = await prisma.enrollment.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: twelveMonthsAgo }, paidAmount: { gt: 0 } },
      _sum: { paidAmount: true },
      _count: true,
    });

    const revenueMap = new Map<string, number>();
    const enrollCountMap = new Map<string, number>();
    for (const row of enrollmentsByMonthRaw) {
      const key = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, "0")}`;
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + (row._sum.paidAmount ?? 0));
      enrollCountMap.set(key, (enrollCountMap.get(key) ?? 0) + row._count);
    }

    const revenueByMonth = [];
    const enrollmentsByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rev = revenueMap.get(key) ?? 0;
      const count = enrollCountMap.get(key) ?? 0;
      const monthLabel = d.toLocaleString("fr-FR", { month: "short" });
      revenueByMonth.push({
        month: monthLabel,
        revenue: Math.round(rev),
        commission: Math.round(rev * PLATFORM_COMMISSION),
      });
      enrollmentsByMonth.push({
        month: monthLabel,
        enrollments: count,
      });
    }

    // Top categories
    const categoriesWithCounts = await prisma.formationCategory.findMany({
      select: {
        nameFr: true,
        color: true,
        _count: { select: { formations: true } },
      },
      orderBy: { formations: { _count: "desc" } },
      take: 6,
    });

    const topCategories = categoriesWithCounts.map((c) => ({
      name: c.nameFr,
      value: c._count.formations,
      color: c.color || "#22C55E",
    }));

    // Recent activity
    const recentActivity = [
      ...recentEnrollments.map((e) => ({
        type: "enrollment",
        title: `Inscription : ${e.formation.titleFr}`,
        user: e.user.name,
        date: new Date(e.createdAt).toLocaleDateString("fr-FR"),
        timestamp: new Date(e.createdAt).toISOString(),
      })),
      ...recentCertificates.map((c) => ({
        type: "certificate",
        title: `Certificat : ${c.enrollment.formation.titleFr}`,
        user: c.user.name,
        date: new Date(c.issuedAt).toLocaleDateString("fr-FR"),
        timestamp: new Date(c.issuedAt).toISOString(),
      })),
    ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);

    // Marketing stats
    const [totalProducts, productSalesAgg, abandonedCartsTotal, recoveredCarts, failedPayments] = await Promise.all([
      prisma.digitalProduct.count({ where: { status: "ACTIF" } }),
      prisma.digitalProductPurchase.aggregate({ _sum: { paidAmount: true }, _count: true }),
      prisma.abandonedCart.count(),
      prisma.abandonedCart.count({ where: { status: "CONVERTI" } }),
      prisma.marketingEvent.count({ where: { type: "PAYMENT_FAILED" } }),
    ]);

    const marketing = {
      totalProducts,
      productSales: productSalesAgg._count,
      productRevenue: productSalesAgg._sum.paidAmount ?? 0,
      abandonedCarts: abandonedCartsTotal,
      recoveredCarts,
      recoveryRate: abandonedCartsTotal > 0 ? (recoveredCarts / abandonedCartsTotal) * 100 : 0,
      failedPayments,
    };

    // ── New computed fields ──

    // 1. Conversion Funnel
    const [totalViewsAgg, totalEnrollments, paidEnrollments] = await Promise.all([
      prisma.formation.aggregate({ _sum: { viewsCount: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { paidAmount: { gt: 0 } } }),
    ]);

    const conversionFunnel = [
      { step: "Visiteurs", count: totalViewsAgg._sum.viewsCount ?? 0 },
      { step: "Inscriptions", count: totalEnrollments },
      { step: "Achats", count: paidEnrollments },
      { step: "Certificats", count: certificatesIssued },
    ];

    // 2. Revenue Waterfall
    const totalRevenueAgg = await prisma.enrollment.aggregate({
      where: { paidAmount: { gt: 0 } },
      _sum: { paidAmount: true },
    });
    const grossRevenue = totalRevenueAgg._sum.paidAmount ?? 0;
    const refundedAgg = await prisma.enrollment.aggregate({
      where: { refundedAt: { not: null } },
      _sum: { paidAmount: true },
    });
    const refunds = refundedAgg._sum.paidAmount ?? 0;
    const commissions = grossRevenue * PLATFORM_COMMISSION;
    const netRevenue = grossRevenue - commissions - refunds;

    const revenueWaterfall = {
      gross: Math.round(grossRevenue * 100) / 100,
      commissions: Math.round(commissions * 100) / 100,
      refunds: Math.round(refunds * 100) / 100,
      net: Math.round(netRevenue * 100) / 100,
    };

    // 3. Activity Heatmap (last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const [enrollmentsByDay, lessonProgressByDay] = await Promise.all([
      prisma.enrollment.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: oneYearAgo } },
        _count: true,
      }),
      prisma.lessonProgress.groupBy({
        by: ["completedAt"],
        where: { completed: true, completedAt: { gte: oneYearAgo, not: null } },
        _count: true,
      }),
    ]);

    const heatmapMap = new Map<string, number>();
    for (const row of enrollmentsByDay) {
      const dateKey = row.createdAt.toISOString().split("T")[0];
      heatmapMap.set(dateKey, (heatmapMap.get(dateKey) ?? 0) + row._count);
    }
    for (const row of lessonProgressByDay) {
      if (row.completedAt) {
        const dateKey = row.completedAt.toISOString().split("T")[0];
        heatmapMap.set(dateKey, (heatmapMap.get(dateKey) ?? 0) + row._count);
      }
    }

    const activityHeatmap = Array.from(heatmapMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Category Radar (top 6 categories with detailed metrics)
    const categoriesForRadar = await prisma.formationCategory.findMany({
      select: {
        nameFr: true,
        formations: {
          select: {
            id: true,
            studentsCount: true,
            rating: true,
            price: true,
            enrollments: {
              select: {
                paidAmount: true,
                progress: true,
                completedAt: true,
              },
            },
          },
        },
      },
      orderBy: { formations: { _count: "desc" } },
      take: 6,
    });

    const categoryRadar = categoriesForRadar.map((cat) => {
      const formationCount = cat.formations.length;
      const allEnrollments = cat.formations.flatMap((f) => f.enrollments);
      const studentCount = allEnrollments.length;
      const revenue = allEnrollments.reduce((sum, e) => sum + (e.paidAmount ?? 0), 0);
      const avgRating = formationCount > 0
        ? cat.formations.reduce((sum, f) => sum + f.rating, 0) / formationCount
        : 0;
      const completedCount = allEnrollments.filter((e) => e.completedAt !== null).length;
      const completionRate = studentCount > 0 ? (completedCount / studentCount) * 100 : 0;

      return {
        name: cat.nameFr,
        formations: formationCount,
        students: studentCount,
        revenue: Math.round(revenue * 100) / 100,
        rating: Math.round(avgRating * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
      };
    });

    // 5. Top Instructors (top 10)
    const instructorProfiles = await prisma.instructeurProfile.findMany({
      where: { status: "APPROUVE" },
      select: {
        id: true,
        user: { select: { name: true, avatar: true, image: true } },
        formations: {
          where: { status: "ACTIF" },
          select: {
            id: true,
            rating: true,
            studentsCount: true,
            enrollments: {
              select: {
                paidAmount: true,
                completedAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
      take: 50, // Fetch more, then sort and slice
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const instructorStats = instructorProfiles.map((inst) => {
      const allEnrollments = inst.formations.flatMap((f) => f.enrollments);
      const totalRevenue = allEnrollments.reduce((sum, e) => sum + (e.paidAmount ?? 0), 0);
      const totalStudentCount = allEnrollments.length;
      const formationCount = inst.formations.length;
      const avgRating = formationCount > 0
        ? inst.formations.reduce((sum, f) => sum + f.rating, 0) / formationCount
        : 0;
      const completed = allEnrollments.filter((e) => e.completedAt !== null).length;
      const completionRate = totalStudentCount > 0 ? (completed / totalStudentCount) * 100 : 0;

      // Trend: compare last 30 days revenue vs previous 30 days
      const recentRevenue = allEnrollments
        .filter((e) => e.createdAt >= thirtyDaysAgo)
        .reduce((sum, e) => sum + (e.paidAmount ?? 0), 0);
      const previousRevenue = allEnrollments
        .filter((e) => e.createdAt >= sixtyDaysAgo && e.createdAt < thirtyDaysAgo)
        .reduce((sum, e) => sum + (e.paidAmount ?? 0), 0);
      const trendValue = previousRevenue > 0
        ? Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100)
        : recentRevenue > 0 ? 100 : 0;

      return {
        id: inst.id,
        name: inst.user.name,
        avatar: inst.user.avatar || inst.user.image || null,
        formations: formationCount,
        students: totalStudentCount,
        revenue: Math.round(totalRevenue * 100) / 100,
        rating: Math.round(avgRating * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        trend: trendValue,
      };
    });

    const topInstructors = instructorStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 6. Geo Distribution (from user.country on enrolled users)
    const enrolledUsers = await prisma.enrollment.findMany({
      select: {
        user: { select: { country: true, countryFlag: true } },
      },
    });

    const geoMap = new Map<string, { flag: string; count: number }>();
    for (const e of enrolledUsers) {
      const country = e.user.country || "Inconnu";
      const flag = e.user.countryFlag || "";
      const existing = geoMap.get(country);
      if (existing) {
        existing.count += 1;
      } else {
        geoMap.set(country, { flag, count: 1 });
      }
    }

    const totalEnrolledUsers = enrolledUsers.length;
    const geoDistribution = Array.from(geoMap.entries())
      .map(([country, { flag, count }]) => ({
        country,
        flag,
        count,
        percentage: totalEnrolledUsers > 0
          ? Math.round((count / totalEnrolledUsers) * 1000) / 10
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalFormations,
      totalStudents,
      revenueThisMonth,
      certificatesIssued,
      pendingFormations,
      pendingInstructors,
      revenueByMonth,
      enrollmentsByMonth,
      topCategories,
      recentActivity,
      trends,
      marketing,
      conversionFunnel,
      revenueWaterfall,
      activityHeatmap,
      categoryRadar,
      topInstructors,
      geoDistribution,
    });
  } catch (error) {
    console.error("[GET /api/admin/formations/stats]", error);
    return NextResponse.json({
      totalFormations: 0,
      totalStudents: 0,
      revenueThisMonth: 0,
      certificatesIssued: 0,
      formationsTrend: 0,
      studentsTrend: 0,
      revenueTrend: 0,
      certificatesTrend: 0,
      enrollmentsByMonth: [],
      revenueByMonth: [],
      topCategories: [],
      recentActivity: [],
      pendingFormations: 0,
      pendingInstructors: 0,
      conversionFunnel: [
        { step: "visitors", count: 0 },
        { step: "enrollments", count: 0 },
        { step: "purchases", count: 0 },
        { step: "certificates", count: 0 },
      ],
      revenueWaterfall: { gross: 0, commissions: 0, refunds: 0, net: 0 },
      activityHeatmap: [],
      categoryRadar: [],
      topInstructors: [],
      geoDistribution: [],
      marketing: null,
      productStats: null,
      trends: {
        formationsTrend: 0,
        studentsTrend: 0,
        revenueTrend: 0,
        certificatesTrend: 0,
      },
    });
  }
}
