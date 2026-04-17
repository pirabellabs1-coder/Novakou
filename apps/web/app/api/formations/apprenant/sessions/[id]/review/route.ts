import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/apprenant/sessions/[id]/review
 *
 * Body:
 *   {
 *     rating: 1..5,
 *     review?: string (max 2000 chars)
 *   }
 *
 * - Only on COMPLETED sessions owned by the student
 * - Only once (subsequent calls return 400)
 * - Recomputes MentorProfile.rating and reviewsCount after save
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { rating, review } = body as { rating?: number; review?: string };

    if (!Number.isFinite(rating) || rating! < 1 || rating! > 5) {
      return NextResponse.json({ error: "Note invalide (1 à 5)." }, { status: 400 });
    }
    const safeRating = Math.round(rating!);
    const safeReview = typeof review === "string" ? review.trim().slice(0, 2000) : null;

    const booking = await prisma.mentorBooking.findFirst({
      where: { id, studentId: userId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
    }
    if (booking.status !== "COMPLETED" && booking.status !== "RELEASED") {
      return NextResponse.json(
        { error: "Les avis ne peuvent être déposés que sur des séances terminées." },
        { status: 400 },
      );
    }
    if (booking.studentRating != null) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un avis pour cette séance." },
        { status: 400 },
      );
    }

    // Save review
    await prisma.mentorBooking.update({
      where: { id },
      data: {
        studentRating: safeRating,
        studentReview: safeReview,
      },
    });

    // Recompute mentor profile stats (rating + reviewsCount)
    const agg = await prisma.mentorBooking.aggregate({
      where: {
        mentorId: booking.mentorId,
        studentRating: { not: null },
      },
      _avg: { studentRating: true },
      _count: { studentRating: true },
    });

    await prisma.mentorProfile.update({
      where: { id: booking.mentorId },
      data: {
        rating: agg._avg.studentRating ?? 0,
        reviewsCount: agg._count.studentRating ?? 0,
      },
    });

    // Notify mentor
    const profile = await prisma.mentorProfile.findUnique({
      where: { id: booking.mentorId },
      select: { userId: true },
    });
    if (profile) {
      await prisma.notification.create({
        data: {
          userId: profile.userId,
          type: "ORDER",
          title: "Nouvel avis reçu",
          message: `${session?.user?.name ?? "Un apprenant"} vous a laissé ${safeRating}/5 étoiles.`,
          link: "/mentor/rendez-vous",
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      data: {
        rating: safeRating,
        review: safeReview,
        mentorRatingAverage: agg._avg.studentRating ?? 0,
        mentorReviewsCount: agg._count.studentRating ?? 0,
      },
    });
  } catch (err) {
    console.error("[apprenant/sessions/[id]/review POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
