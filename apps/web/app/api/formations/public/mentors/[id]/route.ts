import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/formations/public/mentors/[id]
 * Returns a mentor's public profile + recent reviews.
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const profile = await prisma.mentorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, email: true, createdAt: true } },
        bookings: {
          where: { status: "COMPLETED", studentRating: { not: null } },
          orderBy: { scheduledAt: "desc" },
          take: 6,
          select: {
            id: true,
            scheduledAt: true,
            studentRating: true,
            studentReview: true,
            student: { select: { id: true, name: true, image: true } },
          },
        },
        sessionPacks: {
          where: { isActive: true },
          orderBy: { sessionsCount: "asc" },
          select: {
            id: true,
            title: true,
            sessionsCount: true,
            priceXof: true,
            sessionDurationMinutes: true,
            description: true,
            validityDays: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Mentor introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: profile.id,
        userId: profile.user.id,
        name: profile.user.name,
        image: profile.user.image,
        specialty: profile.specialty,
        bio: profile.bio,
        domain: profile.domain,
        coverImage: profile.coverImage,
        sessionPrice: profile.sessionPrice,
        sessionDuration: profile.sessionDuration,
        languages: profile.languages,
        badges: profile.badges,
        isAvailable: profile.isAvailable,
        isVerified: profile.isVerified,
        rating: profile.rating,
        reviewsCount: profile.reviewsCount,
        totalSessions: profile.totalSessions,
        totalStudents: profile.totalStudents,
        memberSince: profile.user.createdAt,
        reviews: profile.bookings.map((b) => ({
          id: b.id,
          rating: b.studentRating,
          review: b.studentReview,
          date: b.scheduledAt,
          student: b.student,
        })),
        sessionPacks: profile.sessionPacks.map((p) => ({
          id: p.id,
          title: p.title,
          sessionsCount: p.sessionsCount,
          price: p.priceXof,
          // Compute "originalPrice" as sessionsCount × sessionPrice (no discount)
          // for the front to display strikethrough
          originalPrice: profile.sessionPrice * p.sessionsCount,
          sessionDurationMinutes: p.sessionDurationMinutes,
          description: p.description,
          validityDays: p.validityDays,
          savingPct: profile.sessionPrice > 0
            ? Math.max(0, Math.round((1 - p.priceXof / (profile.sessionPrice * p.sessionsCount)) * 100))
            : 0,
        })),
      },
    });
  } catch (err) {
    console.error("[public/mentors/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
