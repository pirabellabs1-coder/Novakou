import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { transactionStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV) {
      const summary = transactionStore.getSummary(session.user.id);

      return NextResponse.json(summary);
    } else {
      const userId = session.user.id;
      const userRole = session.user.role;

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

      // Freelance / Agence: show earnings summary
      const [completedAgg, pendingAgg, totalEarnedAgg] = await Promise.all([
        prisma.payment.aggregate({ where: { payeeId: userId, status: "COMPLETE" }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { payeeId: userId, status: "EN_ATTENTE" }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { payeeId: userId, status: "COMPLETE" }, _sum: { amount: true } }),
      ]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const commissionAgg = await prisma.payment.aggregate({
        where: { payeeId: userId, status: "COMPLETE", type: "commission", createdAt: { gte: monthStart } },
        _sum: { amount: true },
      });

      return NextResponse.json({
        available: Math.round((completedAgg._sum.amount ?? 0) * 100) / 100,
        pending: Math.round((pendingAgg._sum.amount ?? 0) * 100) / 100,
        totalEarned: Math.round((totalEarnedAgg._sum.amount ?? 0) * 100) / 100,
        commissionThisMonth: Math.round(Math.abs(commissionAgg._sum.amount ?? 0) * 100) / 100,
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
