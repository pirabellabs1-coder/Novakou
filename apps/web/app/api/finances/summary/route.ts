import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { transactionStore, orderStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const userRole = ((session.user as Record<string, unknown>).role as string || "").toLowerCase();

      // Client in dev mode: calculate from orders
      if (userRole === "client") {
        const allOrders = orderStore.getAll();
        const clientOrders = allOrders.filter((o: Record<string, unknown>) => o.clientId === session.user.id);
        let totalSpent = 0;
        let pending = 0;
        for (const o of clientOrders) {
          const amount = Number((o as Record<string, unknown>).amount) || 0;
          const status = ((o as Record<string, unknown>).status as string || "").toLowerCase();
          if (status === "termine" || status === "livre") totalSpent += amount;
          else if (["en_attente", "en_cours", "revision"].includes(status)) pending += amount;
        }
        return NextResponse.json({
          available: 0,
          pending: Math.round(pending * 100) / 100,
          totalEarned: 0,
          totalSpent: Math.round(totalSpent * 100) / 100,
          commissionThisMonth: 0,
          credits: 0,
        });
      }

      // Freelance/Agence: existing logic
      const summary = transactionStore.getSummary(session.user.id);
      return NextResponse.json(summary);
    } else {
      const userId = session.user.id;
      const userRole = (session.user as Record<string, unknown>).role as string;

      if (userRole === "CLIENT") {
        // Client: show spending summary
        const [totalSpent, pendingOrders] = await Promise.all([
          prisma.order.aggregate({ where: { clientId: userId, status: "TERMINE" }, _sum: { amount: true } }),
          prisma.order.aggregate({ where: { clientId: userId, status: { in: ["EN_ATTENTE", "EN_COURS", "REVISION"] } }, _sum: { amount: true } }),
        ]);

        return NextResponse.json({
          available: 0,
          pending: Math.round((pendingOrders._sum.amount ?? 0) * 100) / 100,
          totalEarned: 0,
          totalSpent: Math.round((totalSpent._sum.amount ?? 0) * 100) / 100,
          commissionThisMonth: 0,
        });
      }

      // Freelance / Agence: show earnings summary from wallet models
      if (userRole === "AGENCE" || userRole === "agence") {
        const agencyProfile = await prisma.agencyProfile.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (agencyProfile) {
          const wallet = await prisma.walletAgency.findUnique({
            where: { agencyId: agencyProfile.id },
          });

          // Commission this month from orders
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const commissionAgg = await prisma.order.aggregate({
            where: { agencyId: agencyProfile.id, status: "TERMINE", completedAt: { gte: monthStart } },
            _sum: { platformFee: true },
          });

          return NextResponse.json({
            available: Math.round((wallet?.balance ?? 0) * 100) / 100,
            pending: Math.round((wallet?.pending ?? 0) * 100) / 100,
            totalEarned: Math.round((wallet?.totalEarned ?? 0) * 100) / 100,
            commissionThisMonth: Math.round(Math.abs(commissionAgg._sum.platformFee ?? 0) * 100) / 100,
          });
        }
      }

      // Freelance: use wallet model + Order fallback
      const wallet = await prisma.walletFreelance.findUnique({
        where: { userId },
      });

      // Always compute from Orders as a fallback/supplement
      const [completedOrdersAgg, pendingOrdersAgg, paymentAgg, pendingPaymentAgg] = await Promise.all([
        prisma.order.aggregate({ where: { freelanceId: userId, status: "TERMINE" }, _sum: { freelancerPayout: true, amount: true } }),
        prisma.order.aggregate({ where: { freelanceId: userId, status: { in: ["EN_ATTENTE", "EN_COURS", "REVISION"] } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { payeeId: userId, status: "COMPLETE" }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { payeeId: userId, status: "EN_ATTENTE" }, _sum: { amount: true } }),
      ]);

      // Wallet is the primary source of truth; fallback to orders only if wallet is empty
      const walletAvailable = wallet?.balance ?? 0;
      const walletPending = wallet?.pending ?? 0;
      const walletTotalEarned = wallet?.totalEarned ?? 0;

      const orderTotalEarned = Math.round((completedOrdersAgg._sum.freelancerPayout ?? completedOrdersAgg._sum.amount ?? 0) * 100) / 100;
      const orderPending = Math.round((pendingOrdersAgg._sum.amount ?? 0) * 100) / 100;

      const hasWallet = walletAvailable > 0 || walletPending > 0 || walletTotalEarned > 0;
      const available = Math.round((hasWallet ? walletAvailable : orderTotalEarned) * 100) / 100;
      const pending = Math.round((hasWallet ? walletPending : orderPending) * 100) / 100;
      const totalEarned = Math.round((hasWallet ? walletTotalEarned : orderTotalEarned) * 100) / 100;

      // Commission this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const commissionAgg = await prisma.order.aggregate({
        where: { freelanceId: userId, status: "TERMINE", completedAt: { gte: monthStart } },
        _sum: { platformFee: true },
      });

      return NextResponse.json({
        available,
        pending,
        totalEarned,
        commissionThisMonth: Math.round(Math.abs(commissionAgg._sum.platformFee ?? 0) * 100) / 100,
      });
    }
  } catch (error) {
    console.error("[API /finances/summary GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du resume financier" },
      { status: 500 }
    );
  }
}

