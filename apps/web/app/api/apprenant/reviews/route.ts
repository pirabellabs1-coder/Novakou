// GET /api/apprenant/reviews — Mes avis sur les formations

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

const EDIT_WINDOW_DAYS = 7;

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    const reviews = await prisma.formationReview.findMany({
      where: { userId },
      include: {
        formation: {
          select: {
            id: true,
            titleFr: true,
            titleEn: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    const mappedReviews = reviews.map((r) => {
      const daysSinceCreation =
        (now.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const canEdit = daysSinceCreation <= EDIT_WINDOW_DAYS;

      return {
        id: r.id,
        formationId: r.formationId,
        formationTitle: r.formation.titleFr,
        formationSlug: r.formation.slug,
        rating: r.rating,
        comment: r.comment,
        status: "active",
        createdAt: r.createdAt,
        canEdit,
        instructorResponse: r.response ?? null,
      };
    });

    return NextResponse.json({ reviews: mappedReviews });
  } catch (error) {
    console.error("[GET /api/apprenant/reviews]", error);
    return NextResponse.json({ reviews: [] });
  }
}
