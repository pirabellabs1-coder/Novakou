// PUT/DELETE /api/apprenant/reviews/[id] — Modifier ou supprimer un avis

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

const EDIT_WINDOW_DAYS = 7;

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;
    const reviewId = params.id;

    // Find the review
    const review = await prisma.formationReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
    }

    // Check ownership
    if (review.userId !== userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez modifier que vos propres avis" },
        { status: 403 }
      );
    }

    // Check 7-day edit window
    const daysSinceCreation =
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > EDIT_WINDOW_DAYS) {
      return NextResponse.json(
        {
          error:
            "La période de modification de 7 jours est dépassée. Vous ne pouvez plus modifier cet avis.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { rating, comment } = body;

    // Validate rating
    if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "La note doit être entre 1 et 5" },
        { status: 400 }
      );
    }

    // Update the review
    const updatedReview = await prisma.formationReview.update({
      where: { id: reviewId },
      data: {
        ...(rating !== undefined ? { rating } : {}),
        ...(comment !== undefined ? { comment } : {}),
      },
    });

    // Recalculate formation average rating
    const allReviews = await prisma.formationReview.findMany({
      where: { formationId: review.formationId },
      select: { rating: true },
    });

    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    await prisma.formation.update({
      where: { id: review.formationId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: allReviews.length,
      },
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error("[PUT /api/apprenant/reviews/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;
    const reviewId = params.id;

    // Find the review
    const review = await prisma.formationReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
    }

    // Check ownership
    if (review.userId !== userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que vos propres avis" },
        { status: 403 }
      );
    }

    const formationId = review.formationId;

    // Delete the review
    await prisma.formationReview.delete({
      where: { id: reviewId },
    });

    // Recalculate formation average rating
    const remainingReviews = await prisma.formationReview.findMany({
      where: { formationId },
      select: { rating: true },
    });

    const avgRating =
      remainingReviews.length > 0
        ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) /
          remainingReviews.length
        : 0;

    await prisma.formation.update({
      where: { id: formationId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: remainingReviews.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/apprenant/reviews/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
