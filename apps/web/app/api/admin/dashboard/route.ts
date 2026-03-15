import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, IS_DEV } from "@/lib/prisma";
import { serviceStore, orderStore, transactionStore, reviewStore } from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";
import { trackingStore } from "@/lib/tracking/tracking-store";

// GET /api/admin/dashboard — Aggregated platform stats for admin dashboard
export async function GET() {
  try {
    // Authentification et verification role admin obligatoire
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV) {
      const users = devStore.getAll();
      const orders = orderStore.getAll();
      const services = serviceStore.getAll();
      const transactions = transactionStore.getAll();
      const reviews = reviewStore.getAll();

      // ── User Stats (exclure admin, suspendus et bannis du comptage actif) ──
      const activeUsers = users.filter((u) => u.role !== "admin" && u.status === "ACTIF");
      const totalUsers = activeUsers.length;
      const freelances = activeUsers.filter((u) => u.role === "freelance").length;
      const clients = activeUsers.filter((u) => u.role === "client").length;
      const agencies = activeUsers.filter((u) => u.role === "agence").length;
      const suspendedUsers = users.filter((u) => u.status === "suspendu").length;
      const bannedUsers = users.filter((u) => u.status === "banni").length;

      // ── Order Stats ──
      const totalOrders = orders.length;
      const activeOrders = orders.filter((o) =>
        ["en_attente", "en_cours", "revision"].includes(o.status)
      ).length;
      const completedOrders = orders.filter((o) => o.status === "termine").length;
      const gmv = orders
        .filter((o) => o.status !== "annule")
        .reduce((sum, o) => sum + o.amount, 0);

      // ── Service Stats ──
      const totalServices = services.length;
      const pendingModeration = services.filter((s) => s.status === "en_attente").length;

      // ── Financial Stats ──
      const completedSales = transactions.filter(
        (t) => t.type === "vente" && t.status === "complete"
      );
      const commissions = transactions.filter(
        (t) => t.type === "commission" && t.status === "complete"
      );
      const pendingTransactions = transactions.filter(
        (t) => t.status === "en_attente"
      );
      const withdrawals = transactions.filter(
        (t) => t.type === "retrait" && t.status === "en_attente"
      );

      const platformRevenue = commissions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );
      const escrowFunds = orders
        .filter((o) => ["en_attente", "en_cours", "revision", "livre"].includes(o.status))
        .reduce((sum, o) => sum + o.amount, 0);
      const pendingWithdrawals = withdrawals.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );

      // ── Disputes ──
      const totalDisputes = orders.filter((o) => o.status === "litige").length;

      // ── Monthly Revenue (this year, grouped by month) ──
      const now = new Date();
      const currentYear = now.getFullYear();
      const monthNames = [
        "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
        "Jul", "Aou", "Sep", "Oct", "Nov", "Dec",
      ];

      const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
        const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
        const monthOrders = orders.filter(
          (o) =>
            o.status === "termine" &&
            o.completedAt &&
            o.completedAt.startsWith(monthKey)
        );
        const revenue = monthOrders.reduce((sum, o) => sum + o.amount, 0);
        const commission = monthOrders.reduce((sum, o) => sum + o.commission, 0);

        return {
          month: monthNames[i],
          monthKey,
          revenue,
          commission,
          orders: monthOrders.length,
        };
      });

      // ── Orders by Status ──
      const ordersByStatus = {
        en_attente: orders.filter((o) => o.status === "en_attente").length,
        en_cours: orders.filter((o) => o.status === "en_cours").length,
        livre: orders.filter((o) => o.status === "livre").length,
        revision: orders.filter((o) => o.status === "revision").length,
        termine: completedOrders,
        annule: orders.filter((o) => o.status === "annule").length,
        litige: totalDisputes,
      };

      // ── Recent Orders (last 10) ──
      const recentOrders = [...orders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10)
        .map((o) => ({
          id: o.id,
          serviceTitle: o.serviceTitle,
          clientName: o.clientName,
          amount: o.amount,
          status: o.status,
          createdAt: o.createdAt,
        }));

      // ── Recent Users (last 10) ──
      const recentUsers = [...users]
        .filter((u) => u.role !== "admin")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10)
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          plan: u.plan,
          status: u.status,
          createdAt: u.createdAt,
        }));

      // ── Review Stats ──
      const totalReviews = reviews.length;
      const avgRating =
        totalReviews > 0
          ? Math.round(
              (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10
            ) / 10
          : 0;
      const reportedReviews = reviews.filter((r) => r.reported).length;

      return NextResponse.json({
        users: {
          totalUsers,
          freelances,
          clients,
          agencies,
          suspended: suspendedUsers,
          banned: bannedUsers,
        },
        orders: {
          total: totalOrders,
          active: activeOrders,
          completed: completedOrders,
          gmv: Math.round(gmv * 100) / 100,
          byStatus: ordersByStatus,
        },
        services: {
          total: totalServices,
          pendingModeration,
          active: services.filter((s) => s.status === "actif").length,
          paused: services.filter((s) => s.status === "pause").length,
          refused: services.filter((s) => s.status === "refuse").length,
        },
        finances: {
          platformRevenue: Math.round(platformRevenue * 100) / 100,
          escrowFunds: Math.round(escrowFunds * 100) / 100,
          pendingWithdrawals: Math.round(pendingWithdrawals * 100) / 100,
          totalTransactions: transactions.length,
          pendingTransactions: pendingTransactions.length,
        },
        disputes: {
          total: totalDisputes,
        },
        reviews: {
          total: totalReviews,
          avgRating,
          reported: reportedReviews,
        },
        monthlyRevenue,
        recentOrders,
        recentUsers,
        traffic: {
          activeSessions: trackingStore.getActiveSessions(),
          todayPageViews: trackingStore.getStats({ period: "1d" }).totalPageViews,
          todayUniques: trackingStore.getStats({ period: "1d" }).uniqueVisitors,
          avgSessionDuration: trackingStore.getStats({ period: "7d" }).avgSessionDuration,
          topPages: trackingStore.getStats({ period: "1d" }).topPages.slice(0, 5),
        },
      });
    }

    // Production: Prisma
    const [
      totalUsers,
      freelanceCount,
      clientCount,
      agencyCount,
      totalOrders,
      activeOrders,
      completedOrders,
      totalDisputes,
      totalServices,
      pendingModeration,
      activeServices,
      pausedServices,
      refusedServices,
      revenueResult,
      reviewStats,
      recentOrdersRaw,
      recentUsersRaw,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: "ADMIN" }, status: "ACTIF" } }),
      prisma.user.count({ where: { role: "FREELANCE", status: "ACTIF" } }),
      prisma.user.count({ where: { role: "CLIENT", status: "ACTIF" } }),
      prisma.user.count({ where: { role: "AGENCE", status: "ACTIF" } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["EN_ATTENTE", "EN_COURS", "REVISION"] } } }),
      prisma.order.count({ where: { status: "TERMINE" } }),
      prisma.order.count({ where: { status: "LITIGE" } }),
      prisma.service.count(),
      prisma.service.count({ where: { status: "EN_ATTENTE" } }),
      prisma.service.count({ where: { status: "ACTIF" } }),
      prisma.service.count({ where: { status: "PAUSE" } }),
      prisma.service.count({ where: { status: "REFUSE" } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETE", type: "commission" },
        _sum: { amount: true },
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          service: { select: { title: true } },
          client: { select: { name: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: { not: "ADMIN" } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const gmvResult = await prisma.order.aggregate({
      where: { status: { not: "ANNULE" } },
      _sum: { amount: true },
    });

    const escrowResult = await prisma.order.aggregate({
      where: { status: { in: ["EN_ATTENTE", "EN_COURS", "REVISION", "LIVRE"] } },
      _sum: { amount: true },
    });

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      serviceTitle: o.service?.title ?? "",
      clientName: o.client?.name ?? "",
      amount: o.amount,
      status: o.status,
      createdAt: o.createdAt,
    }));

    const recentUsers = recentUsersRaw.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan,
      status: u.status,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      users: {
        totalUsers,
        freelances: freelanceCount,
        clients: clientCount,
        agencies: agencyCount,
      },
      orders: {
        total: totalOrders,
        active: activeOrders,
        completed: completedOrders,
        gmv: Math.round((gmvResult._sum.amount ?? 0) * 100) / 100,
        byStatus: {
          en_attente: 0,
          en_cours: 0,
          livre: 0,
          revision: 0,
          termine: completedOrders,
          annule: 0,
          litige: totalDisputes,
        },
      },
      services: {
        total: totalServices,
        pendingModeration,
        active: activeServices,
        paused: pausedServices,
        refused: refusedServices,
      },
      finances: {
        platformRevenue: Math.round((revenueResult._sum.amount ?? 0) * 100) / 100,
        escrowFunds: Math.round((escrowResult._sum.amount ?? 0) * 100) / 100,
        pendingWithdrawals: 0,
        totalTransactions: 0,
        pendingTransactions: 0,
      },
      disputes: {
        total: totalDisputes,
      },
      reviews: {
        total: reviewStats._count.id,
        avgRating: reviewStats._avg.rating
          ? Math.round(reviewStats._avg.rating * 10) / 10
          : 0,
        reported: 0,
      },
      monthlyRevenue: [],
      recentOrders,
      recentUsers,
      traffic: {
        activeSessions: 0,
        todayPageViews: 0,
        todayUniques: 0,
        avgSessionDuration: 0,
        topPages: [],
      },
    });
  } catch (error) {
    console.error("[API /admin/dashboard GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des statistiques" },
      { status: 500 }
    );
  }
}
