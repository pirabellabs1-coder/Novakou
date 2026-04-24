import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/formations/public/formation/[slug]
 * Returns full formation detail for the public page.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const formation = await prisma.formation.findUnique({
      where: { slug },
      include: {
        instructeur: {
          select: {
            id: true,
            yearsExp: true,
            expertise: true,
            bioFr: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
        category: { select: { id: true, slug: true, name: true } },
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                duration: true,
                isFree: true,
                order: true,
              },
            },
          },
        },
        reviews: {
          where: { rating: { gte: 1 } },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!formation || formation.status !== "ACTIF") {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    // Fire-and-forget view counter increment
    prisma.formation
      .update({
        where: { id: formation.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => null);

    // Compute total lessons + duration
    const totalLessons = formation.sections.reduce(
      (sum: number, s: { lessons: unknown[] }) => sum + s.lessons.length,
      0
    );

    return NextResponse.json({
      data: {
        id: formation.id,
        slug: formation.slug,
        title: formation.title,
        shortDesc: formation.shortDesc,
        description: formation.description,
        descriptionFormat: formation.descriptionFormat,
        learnPoints: formation.learnPoints,
        requirements: formation.requirements,
        targetAudience: formation.targetAudience,
        locale: formation.locale,
        thumbnail: formation.thumbnail,
        previewVideo: formation.previewVideo,
        level: formation.level,
        languages: formation.language,
        duration: formation.duration,
        price: formation.price,
        originalPrice: formation.originalPrice,
        isFree: formation.isFree,
        hasCertificate: formation.hasCertificate,
        maxStudents: formation.maxStudents,
        rating: formation.rating,
        reviewsCount: formation.reviewsCount,
        studentsCount: formation.studentsCount,
        viewsCount: formation.viewsCount,
        totalLessons,
        category: formation.category,
        instructeur: {
          id: formation.instructeur.id,
          userId: formation.instructeur.user.id,
          name: formation.instructeur.user.name,
          image: formation.instructeur.user.image,
          bio: formation.instructeur.bioFr,
          expertise: formation.instructeur.expertise,
          yearsExp: formation.instructeur.yearsExp,
        },
        sections: formation.sections.map((s) => ({
          id: s.id,
          title: s.title,
          order: s.order,
          lessons: s.lessons,
          lessonCount: s.lessons.length,
          duration: s.lessons.reduce((sum: number, l: { duration: number | null }) => sum + (l.duration ?? 0), 0),
        })),
        reviews: formation.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          response: r.response,
          respondedAt: r.respondedAt,
          createdAt: r.createdAt,
          user: r.user,
        })),
        createdAt: formation.createdAt,
      },
    });
  } catch (err) {
    console.error("[public/formation/[slug]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
