// GET /api/formations/stats — Statistiques publiques de la plateforme formations

import { NextResponse } from "next/server";
import prisma from "@freelancehigh/db";

export const revalidate = 60; // ISR: revalider toutes les 60 secondes

export async function GET() {
  try {
    const [
      formationsCount,
      apprenantsResult,
      instructeursCount,
      reviewsAgg,
    ] = await Promise.all([
      // Nombre de formations actives
      prisma.formation.count({ where: { status: "ACTIF" } }),

      // Nombre d'apprenants uniques — raw SQL COUNT(DISTINCT) instead of
      // groupBy which fetches all rows into memory
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "userId") as count FROM "Enrollment"
      `,

      // Nombre d'instructeurs approuvés
      prisma.instructeurProfile.count({ where: { status: "APPROUVE" } }),

      // Note moyenne globale
      prisma.formationReview.aggregate({
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      formations: formationsCount,
      apprenants: Number(apprenantsResult[0]?.count ?? 0),
      instructeurs: instructeursCount,
      averageRating: reviewsAgg._avg.rating
        ? Math.round(reviewsAgg._avg.rating * 10) / 10
        : 0,
      totalReviews: reviewsAgg._count,
    });
  } catch (error) {
    console.error("[GET /api/formations/stats]", error);
    return NextResponse.json({
      formations: 0,
      apprenants: 0,
      instructeurs: 0,
      averageRating: 0,
      totalReviews: 0,
    });
  }
}
