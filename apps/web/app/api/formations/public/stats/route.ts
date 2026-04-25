import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalUsers, totalInstructors, totalFormations, totalProducts, totalEnrollments, totalPurchases, totalCountries] =
      await Promise.all([
        prisma.user.count(),
        prisma.instructeurProfile.count(),
        prisma.formation.count({ where: { status: "ACTIF" } }),
        prisma.digitalProduct.count({ where: { status: "ACTIF" } }),
        prisma.enrollment.count(),
        prisma.digitalProductPurchase.count(),
        prisma.user.findMany({
          where: { country: { not: null } },
          select: { country: true },
          distinct: ["country"],
        }),
      ]);

    const totalSales = totalEnrollments + totalPurchases;
    const totalProductsCount = totalFormations + totalProducts;

    return NextResponse.json({
      data: {
        totalUsers,
        totalInstructors,
        totalLearners: totalUsers - totalInstructors,
        totalFormations,
        totalProducts,
        totalProductsCount,
        totalSales,
        totalCountries: totalCountries.length,
      },
    });
  } catch (err) {
    console.error("[public/stats]", err);
    return NextResponse.json({
      data: {
        totalUsers: 0, totalInstructors: 0, totalLearners: 0,
        totalFormations: 0, totalProducts: 0, totalProductsCount: 0,
        totalSales: 0, totalCountries: 0,
      },
    });
  }
}
