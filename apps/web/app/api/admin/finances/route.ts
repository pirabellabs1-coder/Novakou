import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { transactionStore, orderStore } from "@/lib/dev/data-store";

// GET /api/admin/finances — All transactions + financial summary
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

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

    // Escrow: funds held in active orders
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
      const sales = monthTxs
        .filter((t) => t.type === "vente" && t.status === "complete")
        .reduce((sum, t) => sum + t.amount, 0);
      const commissions = monthTxs
        .filter((t) => t.type === "commission" && t.status === "complete")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const withdrawals = monthTxs
        .filter((t) => t.type === "retrait" && t.status === "complete")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        month: monthNames[d.getMonth()],
        monthKey,
        sales: Math.round(sales * 100) / 100,
        commissions: Math.round(commissions * 100) / 100,
        withdrawals: Math.round(withdrawals * 100) / 100,
      };
    });

    // ── Transactions by type ──
    const byType = {
      vente: transactions.filter((t) => t.type === "vente").length,
      retrait: transactions.filter((t) => t.type === "retrait").length,
      commission: transactions.filter((t) => t.type === "commission").length,
      remboursement: transactions.filter((t) => t.type === "remboursement").length,
      bonus: transactions.filter((t) => t.type === "bonus").length,
      boost: transactions.filter((t) => t.type === "boost").length,
    };

    // ── Transactions by status ──
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
  } catch (error) {
    console.error("[API /admin/finances GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des finances" },
      { status: 500 }
    );
  }
}
