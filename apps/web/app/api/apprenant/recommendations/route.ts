// GET /api/apprenant/recommendations — Formations recommandées

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { formationCardInclude } from "@/lib/formations/prisma-helpers";

const TARGET_COUNT = 4;

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the user's enrolled formation category IDs
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        formation: {
          select: { categoryId: true, id: true },
        },
      },
    });

    const enrolledFormationIds = enrollments.map((e) => e.formationId);
    const enrolledCategoryIds = [
      ...new Set(enrollments.map((e) => e.formation.categoryId)),
    ];

    let recommendations: Array<Record<string, unknown>> = [];

    // Query formations in those categories that the user is NOT enrolled in
    if (enrolledCategoryIds.length > 0) {
      recommendations = await prisma.formation.findMany({
        where: {
          status: "ACTIF",
          categoryId: { in: enrolledCategoryIds },
          id: { notIn: enrolledFormationIds },
        },
        include: formationCardInclude,
        orderBy: { studentsCount: "desc" },
        take: TARGET_COUNT,
      });
    }

    // If less than TARGET_COUNT, fill with popular formations
    if (recommendations.length < TARGET_COUNT) {
      const remaining = TARGET_COUNT - recommendations.length;
      const existingIds = [
        ...enrolledFormationIds,
        ...recommendations.map((r) => (r as { id: string }).id),
      ];

      const popular = await prisma.formation.findMany({
        where: {
          status: "ACTIF",
          id: { notIn: existingIds },
        },
        include: formationCardInclude,
        orderBy: { studentsCount: "desc" },
        take: remaining,
      });

      recommendations = [...recommendations, ...popular];
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("[GET /api/apprenant/recommendations]", error);
    return NextResponse.json({ recommendations: [] });
  }
}
