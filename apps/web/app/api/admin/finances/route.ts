import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { transactionStore, orderStore } from "@/lib/dev/data-store";

// GET /api/admin/finances — All transactions + financial summary
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV) {
      const transactions = transactionStore.getAll();
      const orders = orderStore.getAll();

      // ── Summary calculations ──
      const completedSales = transactions.filter(
        (t) => t.type === "vente" && t.status === "complete"
      );
      const completedCommissions = transactions.filter(
        (t) => t.type === "commission" && t.status === "complete"
      );
      const pendingWithdrawals = transactions.filter(
        (t) => t.type === "retrait" && t.status === "en_attente"
      );
      const completedWithdrawals = transactions.filter(
        (t) => t.type === "retrait" && t.status === "complete"
      );
      const refunds = transactions.filter(
        (t) => t.type === "remboursement" && t.status === "complete"
      );

      const platformRevenue = completedCommissions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );
      const escrowFunds = orders
        .filter((o) =>
          ["en_attente", "en_cours", "revision", "livre"].includes(o.status)
        )
        .reduce((sum, o) => sum + o.amount, 0);
      const totalPendingWithdrawals = pendingWithdrawals.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );
      const totalPayments = completedSales.reduce(
        (sum, t) => sum + t.amount,
        0
      );
      const totalWithdrawn = completedWithdrawals.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );
      const totalRefunded = refunds.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      // ── Monthly breakdown (last 12 months) ──
      const now = new Date();
      const monthNames = [
        "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
        "Jul", "Aou", "Sep", "Oct", "Nov", "Dec",
      ];
      const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthTxs = transactions.filter((t) => t.date.startsWith(monthKey));
        return {
          month: monthNames[d.getMonth()],
          monthKey,
          sales: Math.round(monthTxs.filter((t) => t.type === "vente" && t.status === "complete").reduce((s, t) => s + t.amount, 0) * 100) / 100,
          commissions: Math.round(monthTxs.filter((t) => t.type === "commission" && t.status === "complete").reduce((s, t) => s + Math.abs(t.amount), 0) * 100) / 100,
          withdrawals: Math.round(monthTxs.filter((t) => t.type === "retrait" && t.status === "complete").reduce((s, t) => s + Math.abs(t.amount), 0) * 100) / 100,
        };
      });

      const byType = {
        vente: transactions.filter((t) => t.type === "vente").length,
        retrait: transactions.filter((t) => t.type === "retrait").length,
        commission: transactions.filter((t) => t.type === "commission").length,
        remboursement: transactions.filter((t) => t.type === "remboursement").length,
        bonus: transactions.filter((t) => t.type === "bonus").length,
        boost: transactions.filter((t) => t.type === "boost").length,
      };
      const byStatus = {
        complete: transactions.filter((t) => t.status === "complete").length,
        en_attente: transactions.filter((t) => t.status === "en_attente").length,
        echoue: transactions.filter((t) => t.status === "echoue").length,
      };

      return NextResponse.json({
        transactions: transactions.map((t) => ({
          id: t.id,
          userId: t.userId,
          type: t.type,
          description: t.description,
          amount: t.amount,
          status: t.status,
          date: t.date,
          orderId: t.orderId ?? null,
          method: t.method ?? null,
        })),
        summary: {
          platformRevenue: Math.round(platformRevenue * 100) / 100,
          escrowFunds: Math.round(escrowFunds * 100) / 100,
          pendingWithdrawals: Math.round(totalPendingWithdrawals * 100) / 100,
          totalPayments: Math.round(totalPayments * 100) / 100,
          totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
          totalRefunded: Math.round(totalRefunded * 100) / 100,
          totalTransactions: transactions.length,
        },
        byType,
        byStatus,
        monthlyBreakdown,
      });
    }

    // ── Production: Prisma ──
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        payer: { select: { id: true, name: true } },
        payee: { select: { id: true, name: true } },
        order: { select: { id: true, status: true } },
      },
    });

    // Summary aggregations
    const [
      commissionTotal,
      escrowResult,
      pendingWithdrawalsResult,
      totalPaymentsResult,
      withdrawnResult,
      refundedResult,
      totalCount,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { type: "commission", status: "COMPLETE" },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: { status: { in: ["EN_ATTENTE", "EN_COURS", "REVISION", "LIVRE"] } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { type: "retrait", status: "EN_ATTENTE" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { type: "paiement", status: "COMPLETE" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { type: "retrait", status: "COMPLETE" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { type: "remboursement", status: "COMPLETE" },
        _sum: { amount: true },
      }),
      prisma.payment.count(),
    ]);

    // Monthly breakdown (last 12 months)
    const now = new Date();
    const monthNames = [
      "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
      "Jul", "Aou", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthlyBreakdown = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const [salesAgg, commAgg, withdrawAgg] = await Promise.all([
        prisma.payment.aggregate({
          where: { type: "paiement", status: "COMPLETE", createdAt: { gte: d, lt: nextMonth } },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { type: "commission", status: "COMPLETE", createdAt: { gte: d, lt: nextMonth } },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { type: "retrait", status: "COMPLETE", createdAt: { gte: d, lt: nextMonth } },
          _sum: { amount: true },
        }),
      ]);

      monthlyBreakdown.push({
        month: monthNames[d.getMonth()],
        monthKey,
        sales: Math.round((salesAgg._sum.amount ?? 0) * 100) / 100,
        commissions: Math.round(Math.abs(commAgg._sum.amount ?? 0) * 100) / 100,
        withdrawals: Math.round(Math.abs(withdrawAgg._sum.amount ?? 0) * 100) / 100,
      });
    }

    // By type and status counts
    const [
      typeVente, typeRetrait, typeCommission, typeRemboursement, typeAbonnement,
      statusComplete, statusEnAttente, statusEchoue,
    ] = await Promise.all([
      prisma.payment.count({ where: { type: "paiement" } }),
      prisma.payment.count({ where: { type: "retrait" } }),
      prisma.payment.count({ where: { type: "commission" } }),
      prisma.payment.count({ where: { type: "remboursement" } }),
      prisma.payment.count({ where: { type: "abonnement" } }),
      prisma.payment.count({ where: { status: "COMPLETE" } }),
      prisma.payment.count({ where: { status: "EN_ATTENTE" } }),
      prisma.payment.count({ where: { status: "ECHOUE" } }),
    ]);

    return NextResponse.json({
      transactions: payments.map((p) => ({
        id: p.id,
        userId: p.payerId,
        payerName: p.payer?.name,
        payeeName: p.payee?.name,
        type: p.type,
        description: p.description,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        method: p.method,
        date: p.createdAt,
        orderId: p.orderId,
      })),
      summary: {
        platformRevenue: Math.round(Math.abs(commissionTotal._sum.amount ?? 0) * 100) / 100,
        escrowFunds: Math.round((escrowResult._sum.amount ?? 0) * 100) / 100,
        pendingWithdrawals: Math.round(Math.abs(pendingWithdrawalsResult._sum.amount ?? 0) * 100) / 100,
        totalPayments: Math.round((totalPaymentsResult._sum.amount ?? 0) * 100) / 100,
        totalWithdrawn: Math.round(Math.abs(withdrawnResult._sum.amount ?? 0) * 100) / 100,
        totalRefunded: Math.round((refundedResult._sum.amount ?? 0) * 100) / 100,
        totalTransactions: totalCount,
      },
      byType: {
        vente: typeVente,
        retrait: typeRetrait,
        commission: typeCommission,
        remboursement: typeRemboursement,
        abonnement: typeAbonnement,
      },
      byStatus: {
        complete: statusComplete,
        en_attente: statusEnAttente,
        echoue: statusEchoue,
      },
      monthlyBreakdown,
    });
  } catch (error) {
    console.error("[API /admin/finances GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des finances" },
      { status: 500 }
    );
  }
}
