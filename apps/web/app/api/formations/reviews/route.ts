import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/reviews?formationId=xxx OR ?productId=xxx
 * Returns recent reviews for a formation or digital product (public).
 *
 * POST /api/formations/reviews
 * Body: { kind: "formation" | "product", itemId, rating, comment }
 * Auth required. Buyer-only (must own the item).
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formationId = searchParams.get("formationId");
    const productId = searchParams.get("productId");

    if (formationId) {
      const reviews = await prisma.formationReview.findMany({
        where: { formationId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, rating: true, comment: true, response: true, respondedAt: true, createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      });
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
      return NextResponse.json({
        data: reviews,
        summary: { count: reviews.length, avgRating },
      });
    }

    if (productId) {
      const reviews = await prisma.digitalProductReview.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, rating: true, comment: true, createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      });
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
      return NextResponse.json({
        data: reviews,
        summary: { count: reviews.length, avgRating },
      });
    }

    return NextResponse.json({ error: "formationId ou productId requis" }, { status: 400 });
  } catch (err) {
    console.error("[reviews GET]", err);
    return NextResponse.json({ data: [], summary: { count: 0, avgRating: 0 } });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { kind, itemId, rating, comment } = body;

    if (!kind || !itemId || !rating || !comment) {
      return NextResponse.json({ error: "kind, itemId, rating et comment requis" }, { status: 400 });
    }
    const r = parseInt(rating);
    if (isNaN(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "rating doit être entre 1 et 5" }, { status: 400 });
    }
    if (typeof comment !== "string" || comment.trim().length < 5) {
      return NextResponse.json({ error: "Le commentaire doit faire au moins 5 caractères" }, { status: 400 });
    }

    if (kind === "formation") {
      // Check user has enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_formationId: { userId, formationId: itemId } },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "Vous devez être inscrit à cette formation" }, { status: 403 });
      }
      // Upsert review (one per user per formation)
      const review = await prisma.formationReview.upsert({
        where: { userId_formationId: { userId, formationId: itemId } },
        create: {
          userId,
          formationId: itemId,
          enrollmentId: enrollment.id,
          rating: r,
          comment: comment.trim(),
        },
        update: {
          rating: r,
          comment: comment.trim(),
        },
      });
      // Recompute formation rating + count
      const allReviews = await prisma.formationReview.findMany({
        where: { formationId: itemId },
        select: { rating: true },
      });
      const avg = allReviews.reduce((s, x) => s + x.rating, 0) / allReviews.length;
      await prisma.formation.update({
        where: { id: itemId },
        data: { rating: avg, reviewsCount: allReviews.length },
      });
      return NextResponse.json({ data: review });
    }

    if (kind === "product") {
      const purchase = await prisma.digitalProductPurchase.findFirst({
        where: { userId, productId: itemId },
      });
      if (!purchase) {
        return NextResponse.json({ error: "Vous devez avoir acheté ce produit" }, { status: 403 });
      }
      const review = await prisma.digitalProductReview.upsert({
        where: { userId_productId: { userId, productId: itemId } },
        create: { userId, productId: itemId, rating: r, comment: comment.trim() },
        update: { rating: r, comment: comment.trim() },
      });
      const allReviews = await prisma.digitalProductReview.findMany({
        where: { productId: itemId },
        select: { rating: true },
      });
      const avg = allReviews.reduce((s, x) => s + x.rating, 0) / allReviews.length;
      await prisma.digitalProduct.update({
        where: { id: itemId },
        data: { rating: avg, reviewsCount: allReviews.length },
      });
      return NextResponse.json({ data: review });
    }

    return NextResponse.json({ error: "kind invalide" }, { status: 400 });
  } catch (err) {
    console.error("[reviews POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
