// GET /api/formations/instructeurs/[id] — Profil public d'un instructeur

import { NextRequest, NextResponse } from "next/server";
import prisma from "@freelancehigh/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { id, status: "APPROUVE" },
      include: {
        user: { select: { name: true, avatar: true, image: true } },
        formations: {
          where: { status: "ACTIF" },
          select: {
            id: true,
            slug: true,
            titleFr: true,
            titleEn: true,
            price: true,
            isFree: true,
            rating: true,
            studentsCount: true,
            reviewsCount: true,
            thumbnail: true,
            duration: true,
            level: true,
          },
          orderBy: { studentsCount: "desc" },
        },
        _count: { select: { formations: { where: { status: "ACTIF" } } } },
      },
    });

    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur introuvable" }, { status: 404 });
    }

    // Calculate aggregates
    const totalStudents = instructeur.formations.reduce((acc, f) => acc + f.studentsCount, 0);
    const ratings = instructeur.formations.filter((f) => f.reviewsCount > 0);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((acc, f) => acc + f.rating * f.reviewsCount, 0) /
          ratings.reduce((acc, f) => acc + f.reviewsCount, 0)
        : 0;

    // Fetch reviews across all active formations for this instructor
    const formationIds = instructeur.formations.map((f) => f.id);
    const reviews = formationIds.length > 0
      ? await prisma.formationReview.findMany({
          where: { formationId: { in: formationIds } },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [];

    // Calculate completion rate from enrollments across all formations
    let completionRate = 0;
    if (formationIds.length > 0) {
      const enrollmentStats = await prisma.enrollment.aggregate({
        where: { formationId: { in: formationIds } },
        _count: { id: true },
        _avg: { progress: true },
      });
      // completionRate = average progress across all enrollments (0-100)
      completionRate = enrollmentStats._avg.progress
        ? Math.round(enrollmentStats._avg.progress)
        : 0;
    }

    // Determine badges based on real data
    const badges: string[] = [];
    if (instructeur.status === "APPROUVE") badges.push("verified");
    if (totalStudents >= 100 && avgRating >= 4.5) badges.push("top_instructor");
    // If instructor has few formations and few students, they're likely new
    if (instructeur._count.formations <= 2 && totalStudents < 50) {
      badges.push("new");
    }

    return NextResponse.json({
      instructeur: {
        ...instructeur,
        avgRating: Math.round(avgRating * 10) / 10,
        totalStudents,
        completionRate,
        badges,
        reviews: reviews.map((r) => ({
          id: r.id,
          studentName: r.user?.name ?? "Apprenant",
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/formations/instructeurs/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
