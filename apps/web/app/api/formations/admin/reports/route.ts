// /api/formations/admin/reports
//
// GET — liste les rapports archivés (SavedReport)
// POST — génère un nouveau rapport (financial | users | sales | products) et l'archive
//
// Refactor 2026-05 : retrait de @ts-nocheck. L'ancienne version interrogeait
// les modèles `Transaction` et `VendorWithdrawal` qui n'existent pas dans le
// schéma Novakou (héritage FreelanceHigh). On utilise désormais les modèles
// présents : Payment (paiements bruts) + InstructorWithdrawal (retraits
// vendeurs) + PlatformRevenue (revenus plateforme par commande).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
    const type = url.searchParams.get("type") || undefined;

    const where: Prisma.SavedReportWhereInput = {};
    if (type) where.type = type;

    const [reports, total] = await Promise.all([
      prisma.savedReport.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { generatedAt: "desc" },
        include: {
          generator: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.savedReport.count({ where }),
    ]);

    return NextResponse.json({
      data: reports,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[Admin Reports API GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, dateFrom, dateTo } = body as {
      type: string; title?: string; dateFrom?: string; dateTo?: string;
    };

    if (!type) {
      return NextResponse.json({ error: "Type requis" }, { status: 400 });
    }

    const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = dateTo ? new Date(dateTo) : new Date();

    // Generate report data based on type
    let data: Record<string, unknown> = {};
    let reportTitle = title || "";

    if (type === "financial") {
      reportTitle = reportTitle || `Rapport financier ${from.toLocaleDateString("fr-FR")} - ${to.toLocaleDateString("fr-FR")}`;

      // Schéma Novakou : Payment (paiements bruts) + InstructorWithdrawal
      // (retraits vendeurs validés). PlatformRevenue stocke la commission
      // par commande mais n'est pas réutilisé ici — totalRevenue = somme des
      // Payment au statut PAYE sur la période.
      const [payments, totalRevenue, withdrawals] = await Promise.all([
        prisma.payment.findMany({
          where: { createdAt: { gte: from, lte: to } },
          orderBy: { createdAt: "desc" },
          take: 500,
          select: {
            id: true, amount: true, type: true, status: true, createdAt: true,
            // Payment.payer = User (le payeur du paiement)
            payer: { select: { name: true, email: true } },
          },
        }),
        prisma.payment.aggregate({
          where: { createdAt: { gte: from, lte: to }, status: "COMPLETE" },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.instructorWithdrawal.aggregate({
          where: { createdAt: { gte: from, lte: to } },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      data = {
        transactions: payments.length,
        // On garde la clé `transactionDetails` pour ne pas casser le frontend
        // admin/rapports qui consomme déjà ce shape.
        transactionDetails: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          type: p.type,
          status: p.status,
          createdAt: p.createdAt,
          user: p.payer,
        })),
        totalRevenue: totalRevenue._sum?.amount ?? 0,
        completedCount: totalRevenue._count,
        totalWithdrawals: withdrawals._sum?.amount ?? 0,
        withdrawalCount: withdrawals._count,
      };
    } else if (type === "users") {
      reportTitle = reportTitle || `Rapport utilisateurs ${from.toLocaleDateString("fr-FR")} - ${to.toLocaleDateString("fr-FR")}`;

      const [totalUsers, newUsers, byRole] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
        prisma.user.groupBy({
          by: ["role"],
          _count: true,
        }),
      ]);

      data = { totalUsers, newUsers, byRole };
    } else if (type === "sales") {
      reportTitle = reportTitle || `Rapport ventes ${from.toLocaleDateString("fr-FR")} - ${to.toLocaleDateString("fr-FR")}`;

      const [enrollments, totalSales, topProducts] = await Promise.all([
        prisma.enrollment.count({ where: { createdAt: { gte: from, lte: to } } }),
        prisma.enrollment.aggregate({
          where: { createdAt: { gte: from, lte: to } },
          _sum: { paidAmount: true },
        }),
        prisma.enrollment.groupBy({
          by: ["formationId"],
          where: { createdAt: { gte: from, lte: to } },
          _count: true,
          _sum: { paidAmount: true },
          orderBy: { _count: { formationId: "desc" } },
          take: 20,
        }),
      ]);

      // Fetch formation titles for top products
      const formationIds = topProducts.map((p) => p.formationId);
      const formations = await prisma.formation.findMany({
        where: { id: { in: formationIds } },
        select: { id: true, title: true },
      });
      const formationMap = new Map(formations.map((f) => [f.id, f.title]));

      data = {
        totalEnrollments: enrollments,
        totalRevenue: totalSales._sum.paidAmount || 0,
        topProducts: topProducts.map((p) => ({
          formationId: p.formationId,
          title: formationMap.get(p.formationId) || "Inconnu",
          count: p._count,
          revenue: p._sum.paidAmount || 0,
        })),
      };
    } else if (type === "products") {
      reportTitle = reportTitle || `Rapport produits ${from.toLocaleDateString("fr-FR")} - ${to.toLocaleDateString("fr-FR")}`;

      const [total, byStatus, recentProducts] = await Promise.all([
        prisma.formation.count(),
        prisma.formation.groupBy({ by: ["status"], _count: true }),
        prisma.formation.findMany({
          where: { createdAt: { gte: from, lte: to } },
          take: 50,
          orderBy: { createdAt: "desc" },
          select: {
            id: true, title: true, price: true, status: true, createdAt: true,
            // Schéma Novakou : Formation -> InstructeurProfile -> User
            // (pas de relation `vendor` directe sur Formation).
            instructeur: { select: { user: { select: { name: true } } } },
          },
        }),
      ]);

      data = { total, byStatus, recentProducts };
    }

    const userId = session?.user?.id || "system";

    const report = await prisma.savedReport.create({
      data: {
        type,
        title: reportTitle,
        dateFrom: from,
        dateTo: to,
        data: data as object,
        generatedBy: userId,
      },
      include: {
        generator: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ data: report });
  } catch (error) {
    console.error("[Admin Reports API POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
