// GET /api/apprenant/achats — Historique des achats de l'apprenant

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch formation enrollments (includes cohort enrollments)
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        formation: {
          select: {
            id: true,
            slug: true,
            titleFr: true,
            titleEn: true,
            thumbnail: true,
            instructeur: {
              select: { user: { select: { name: true } } },
            },
          },
        },
        cohort: {
          select: {
            id: true,
            titleFr: true,
            titleEn: true,
          },
        },
      },
    });

    // Fetch digital product purchases
    const productPurchases = await prisma.digitalProductPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            titleFr: true,
            titleEn: true,
            banner: true,
            productType: true,
            instructeur: {
              select: { user: { select: { name: true } } },
            },
          },
        },
      },
    });

    // Build unified purchases list
    type Purchase = {
      id: string;
      type: "formation" | "cohort" | "product";
      title: string;
      amount: number;
      currency: string;
      status: "COMPLETED" | "PENDING" | "REFUNDED";
      createdAt: string;
      paymentMethod: string;
      formation?: {
        id: string;
        slug: string;
        thumbnail: string | null;
        instructeur: string;
      };
      product?: {
        id: string;
        slug: string;
        type: string;
      };
    };

    const purchases: Purchase[] = [];

    // Map enrollments to purchases
    for (const enrollment of enrollments) {
      const isCohort = !!enrollment.cohort;
      const title = isCohort
        ? enrollment.cohort?.titleFr ?? enrollment.formation.titleFr
        : enrollment.formation.titleFr;

      let status: "COMPLETED" | "PENDING" | "REFUNDED" = "COMPLETED";
      if (enrollment.refundedAt) status = "REFUNDED";
      else if (enrollment.refundRequested) status = "PENDING";

      purchases.push({
        id: enrollment.id,
        type: isCohort ? "cohort" : "formation",
        title,
        amount: enrollment.paidAmount,
        currency: "EUR",
        status,
        createdAt: enrollment.createdAt.toISOString(),
        paymentMethod: enrollment.stripeSessionId ? "card" : "mobile_money",
        formation: {
          id: enrollment.formation.id,
          slug: enrollment.formation.slug,
          thumbnail: enrollment.formation.thumbnail,
          instructeur: enrollment.formation.instructeur?.user?.name ?? "",
        },
      });
    }

    // Map product purchases
    for (const pp of productPurchases) {
      purchases.push({
        id: pp.id,
        type: "product",
        title: pp.product.titleFr,
        amount: pp.paidAmount,
        currency: "EUR",
        status: "COMPLETED",
        createdAt: pp.createdAt.toISOString(),
        paymentMethod: pp.stripeSessionId ? "card" : "mobile_money",
        product: {
          id: pp.product.id,
          slug: pp.product.slug,
          type: pp.product.productType,
        },
      });
    }

    // Sort all purchases by date descending
    purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Compute stats
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedPurchases = purchases.filter((p) => p.status === "COMPLETED");
    const thisMonthPurchases = completedPurchases.filter(
      (p) => new Date(p.createdAt) >= thisMonthStart
    );

    return NextResponse.json({
      purchases,
      stats: {
        totalSpent: completedPurchases.reduce((sum, p) => sum + p.amount, 0),
        totalFormations: purchases.filter((p) => p.type === "formation" || p.type === "cohort").length,
        totalProducts: purchases.filter((p) => p.type === "product").length,
        thisMonth: thisMonthPurchases.reduce((sum, p) => sum + p.amount, 0),
      },
    });
  } catch (error) {
    console.error("[GET /api/apprenant/achats]", error);
    return NextResponse.json({
      purchases: [],
      stats: {
        totalSpent: 0,
        totalFormations: 0,
        totalProducts: 0,
        thisMonth: 0,
      },
    });
  }
}
