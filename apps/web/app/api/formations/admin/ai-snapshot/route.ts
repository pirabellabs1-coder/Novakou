import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/admin/ai-snapshot
 *
 * Retourne un snapshot complet de la plateforme : utilisateurs, vendeurs,
 * produits, ventes, retraits, litiges... Format dense destine a etre
 * consomme par Claude pour generer des rapports, detecter des anomalies,
 * repondre aux questions admin.
 *
 * Auth : session.role === "ADMIN"
 */
export const dynamic = "force-dynamic";

type SafeNumber = number | null | undefined;
const n = (v: SafeNumber): number => (typeof v === "number" && !Number.isNaN(v) ? v : 0);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userRole = session?.user?.role?.toString().toLowerCase();
    if (userRole !== "admin" && !IS_DEV) {
      return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallel queries — aggregate platform state in ONE snapshot
    const [
      totalUsers,
      newUsersToday,
      newUsersYesterday,
      newUsers7d,
      activeInstructeurs,
      pendingInstructeurs,
      totalFormations,
      activeFormations,
      pendingFormations,
      formationsCreatedToday,
      totalProducts,
      activeProducts,
      productsCreatedToday,
      paymentsToday,
      paymentsYesterday,
      payments7d,
      payments30d,
      failedPayments7d,
      pendingWithdrawals,
      totalWithdrawalsPaid,
      withdrawalsToday,
      pendingInquiries,
      topVendors30d,
      recentErrors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfYesterday, lt: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.instructeurProfile.count({ where: { status: "APPROUVE" } }),
      prisma.instructeurProfile.count({ where: { status: "EN_ATTENTE" } }),
      prisma.formation.count(),
      prisma.formation.count({ where: { status: "ACTIF" } }),
      prisma.formation.count({ where: { status: "EN_ATTENTE" } }),
      prisma.formation.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.digitalProduct.count(),
      prisma.digitalProduct.count({ where: { status: "ACTIF" } }),
      prisma.digitalProduct.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "COMPLETE", createdAt: { gte: startOfToday } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "COMPLETE", createdAt: { gte: startOfYesterday, lt: startOfToday } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "COMPLETE", createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "COMPLETE", createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.payment.count({ where: { status: "ECHOUE", createdAt: { gte: sevenDaysAgo } } }),
      prisma.instructorWithdrawal.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "EN_ATTENTE" },
      }),
      prisma.instructorWithdrawal.aggregate({
        _sum: { amount: true },
        where: { status: "TRAITE" },
      }),
      prisma.instructorWithdrawal.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.productInquiry.count({ where: { status: "pending" } }).catch(() => 0),
      prisma.instructeurProfile.findMany({
        take: 5,
        orderBy: { totalEarned: "desc" },
        where: { totalEarned: { gt: 0 } },
        select: {
          id: true,
          totalEarned: true,
          user: { select: { name: true, email: true } },
        },
      }),
      // Recent orders with errors/refunds (proxy for "issues")
      prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        where: { status: "ECHOUE" },
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          method: true,
          description: true,
          createdAt: true,
        },
      }),
    ]);

    const snapshot = {
      generatedAt: now.toISOString(),
      today: startOfToday.toISOString(),

      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newYesterday: newUsersYesterday,
        new7d: newUsers7d,
      },

      vendors: {
        approved: activeInstructeurs,
        pendingApproval: pendingInstructeurs,
      },

      catalog: {
        formationsTotal: totalFormations,
        formationsActive: activeFormations,
        formationsPendingReview: pendingFormations,
        formationsCreatedToday: formationsCreatedToday,
        productsTotal: totalProducts,
        productsActive: activeProducts,
        productsCreatedToday: productsCreatedToday,
      },

      revenue: {
        today: {
          amount: n(paymentsToday._sum.amount),
          transactions: paymentsToday._count,
        },
        yesterday: {
          amount: n(paymentsYesterday._sum.amount),
          transactions: paymentsYesterday._count,
        },
        last7d: {
          amount: n(payments7d._sum.amount),
          transactions: payments7d._count,
        },
        last30d: {
          amount: n(payments30d._sum.amount),
          transactions: payments30d._count,
        },
        failedPayments7d,
      },

      withdrawals: {
        pendingCount: pendingWithdrawals._count,
        pendingAmount: n(pendingWithdrawals._sum.amount),
        totalPaidAllTime: n(totalWithdrawalsPaid._sum.amount),
        requestedToday: withdrawalsToday,
      },

      support: {
        pendingInquiries,
      },

      topVendors: topVendors30d.map((v) => ({
        id: v.id,
        name: v.user?.name ?? "(sans nom)",
        email: v.user?.email ?? "",
        totalEarned: v.totalEarned,
      })),

      recentErrors: recentErrors.map((p) => ({
        id: p.id,
        amount: p.amount,
        type: p.type,
        method: p.method,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ data: snapshot });
  } catch (err) {
    console.error("[admin/ai-snapshot GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
