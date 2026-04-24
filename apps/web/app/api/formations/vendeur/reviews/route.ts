import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * GET /api/formations/vendeur/reviews
 * Liste tous les avis sur les formations + produits du vendeur.
 * Avec pagination simple, filtre par type et par "sans réponse".
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

  const url = new URL(request.url);
  const onlyUnanswered = url.searchParams.get("unanswered") === "1";

  // Formations reviews
  const formationReviews = await prisma.formationReview.findMany({
    where: {
      formation: { instructeurId: ctx.instructeurId },
      ...(onlyUnanswered ? { response: null } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      formation: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Product reviews
  const productReviews = await prisma.digitalProductReview.findMany({
    where: {
      product: { instructeurId: ctx.instructeurId },
      ...(onlyUnanswered ? { response: null } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      product: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Normalize + merge
  const reviews = [
    ...formationReviews.map((r) => ({
      id: r.id,
      type: "formation" as const,
      rating: r.rating,
      comment: r.comment,
      response: r.response,
      respondedAt: r.respondedAt,
      createdAt: r.createdAt,
      author: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        image: r.user.image,
      },
      target: {
        id: r.formation.id,
        title: r.formation.title,
        slug: r.formation.slug,
      },
    })),
    ...productReviews.map((r) => ({
      id: r.id,
      type: "product" as const,
      rating: r.rating,
      comment: r.comment,
      response: r.response,
      respondedAt: r.respondedAt,
      createdAt: r.createdAt,
      author: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        image: r.user.image,
      },
      target: {
        id: r.product.id,
        title: r.product.title,
        slug: r.product.slug,
      },
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Stats globales
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;
  const unansweredCount = reviews.filter((r) => !r.response).length;
  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return NextResponse.json({
    data: {
      reviews,
      stats: {
        total: totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        unansweredCount,
        distribution,
      },
    },
  });
}
