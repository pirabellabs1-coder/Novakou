import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const reviews = await prisma.formationReview.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, rating: true, comment: true, response: true, respondedAt: true, createdAt: true,
        user: { select: { name: true, email: true, image: true } },
        formation: {
          select: {
            id: true, title: true,
            instructeur: { select: { user: { select: { name: true } } } },
          },
        },
      },
    });

    const summary = {
      total: reviews.length,
      withResponse: reviews.filter((r) => r.response).length,
      withoutResponse: reviews.filter((r) => !r.response).length,
      avgRating: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      ratingDist: [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
      })),
    };

    return NextResponse.json({ data: reviews, summary });
  } catch (err) {
    console.error("[admin/commentaires]", err);
    return NextResponse.json({ data: [], summary: null });
  }
}
