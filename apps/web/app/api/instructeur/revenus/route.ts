// GET /api/instructeur/revenus — Finances instructeur

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { INSTRUCTOR_COMMISSION, PLATFORM_COMMISSION } from "@/lib/formations/prisma-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructeur || instructeur.status !== "APPROUVE") {
      return NextResponse.json({ error: "Compte instructeur non approuvé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);

    const formations = await prisma.formation.findMany({
      where: { instructeurId: instructeur.id },
      select: { id: true },
    });
    const formationIds = formations.map((f) => f.id);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { formationId: { in: formationIds } },
        include: {
          user: { select: { name: true } },
          formation: { select: { titleFr: true, titleEn: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where: { formationId: { in: formationIds } } }),
    ]);

    const withdrawals = await prisma.instructorWithdrawal.findMany({
      where: { instructeurId: instructeur.id },
      orderBy: { createdAt: "desc" },
    });

    // Use ALL enrollments for total computation (not just paginated)
    const allEnrollments = await prisma.enrollment.findMany({
      where: { formationId: { in: formationIds } },
      select: { paidAmount: true, createdAt: true },
    });

    const totalGross = allEnrollments.reduce((acc, e) => acc + e.paidAmount, 0);
    const totalEarned = Math.round(totalGross * INSTRUCTOR_COMMISSION * 100) / 100;

    const withdrawnAmount = withdrawals
      .filter((w) => w.status === "TRAITE")
      .reduce((acc, w) => acc + w.amount, 0);

    const pendingRevenue = allEnrollments
      .filter((e) => new Date(e.createdAt) > thirtyDaysAgo)
      .reduce((acc, e) => acc + e.paidAmount * INSTRUCTOR_COMMISSION, 0);

    const available = Math.round((totalEarned - pendingRevenue - withdrawnAmount) * 100) / 100;

    // Map frontend status from French API statuses
    const statusMap: Record<string, string> = {
      EN_ATTENTE: "PENDING",
      TRAITE: "COMPLETED",
      REFUSE: "FAILED",
      EN_COURS: "PROCESSING",
    };

    // Transactions in the shape the frontend expects
    const transactions = enrollments.map((e) => ({
      id: e.id,
      type: "SALE",
      amount: Math.round(e.paidAmount * INSTRUCTOR_COMMISSION * 100) / 100,
      status: new Date(e.createdAt) > thirtyDaysAgo ? "PENDING" : "COMPLETED",
      createdAt: e.createdAt,
      description: e.formation.titleFr,
      formation: { titleFr: e.formation.titleFr, titleEn: e.formation.titleEn },
    }));

    // Monthly revenue (last 6 months)
    const monthlyRevenue: { month: string; gross: number; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const monthGross = allEnrollments
        .filter((e) => {
          const created = new Date(e.createdAt);
          return created >= monthStart && created < monthEnd;
        })
        .reduce((acc, e) => acc + e.paidAmount, 0);

      monthlyRevenue.push({
        month: d.toLocaleString("fr-FR", { month: "short" }),
        gross: Math.round(monthGross),
        net: Math.round(monthGross * INSTRUCTOR_COMMISSION),
      });
    }

    // Withdrawals in the shape the frontend expects
    const formattedWithdrawals = withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount,
      method: w.method,
      status: statusMap[w.status] ?? w.status,
      requestedAt: w.createdAt,
    }));

    return NextResponse.json({
      totalEarned: totalEarned,
      available: Math.max(0, available),
      pending: Math.round(pendingRevenue * 100) / 100,
      withdrawn: withdrawnAmount,
      transactions,
      monthlyRevenue,
      withdrawals: formattedWithdrawals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/instructeur/revenus]", error);
    return NextResponse.json({
      totalEarned: 0,
      available: 0,
      pending: 0,
      withdrawn: 0,
      transactions: [],
      monthlyRevenue: [],
      withdrawals: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
  }
}
