// GET /api/formations/apprenants/[id] — Profil public d'un apprenant

import { NextRequest, NextResponse } from "next/server";
import prisma from "@freelancehigh/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        image: true,
        createdAt: true,
        freelancerProfile: { select: { bio: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Apprenant introuvable" }, { status: 404 });
    }

    // Get enrollments (completed courses)
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: id },
      include: {
        formation: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnail: true,
            duration: true,
            instructeur: {
              select: { user: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get certificates
    const certificates = await prisma.certificate.findMany({
      where: { userId: id, revokedAt: null },
      include: {
        enrollment: {
          include: {
            formation: {
              select: {
                title: true,
                instructeur: { select: { user: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    // Enrollment model has no `status` field — use completedAt or progress >= 100
    const completedEnrollments = enrollments.filter(
      (e) => e.completedAt !== null || e.progress >= 100
    );

    const totalHours = enrollments.reduce(
      (acc, e) => acc + (e.formation?.duration ?? 0),
      0
    );

    const avgScore =
      certificates.length > 0
        ? Math.round(
            certificates.reduce((acc, c) => acc + c.score, 0) / certificates.length
          )
        : 0;

    // Determine badges
    const badges: string[] = [];
    if (completedEnrollments.length >= 1) badges.push("premier_cours");
    if (completedEnrollments.length >= 5) badges.push("cinq_cours");
    if (completedEnrollments.length >= 10) badges.push("dix_cours");
    if (certificates.length >= 5) badges.push("expert_certifie");

    return NextResponse.json({
      apprenant: {
        id: user.id,
        name: user.name,
        avatar: user.avatar || user.image,
        bio: user.freelancerProfile?.bio ?? null,
        memberSince: user.createdAt.toISOString(),
        stats: {
          completedCourses: completedEnrollments.length,
          certificates: certificates.length,
          totalHours: Math.round(totalHours / 60),
          avgScore,
        },
        badges,
        enrollments: completedEnrollments.map((e) => ({
          id: e.id,
          formationId: e.formation?.id,
          formationSlug: e.formation?.slug,
          formationTitle: e.formation?.title ?? "Formation",
          formationThumbnail: e.formation?.thumbnail,
          instructorName: e.formation?.instructeur?.user?.name ?? "Instructeur",
          completedAt: (e.completedAt ?? e.updatedAt).toISOString(),
          progress: e.progress,
        })),
        certificates: certificates.map((c) => ({
          id: c.id,
          code: c.code,
          formationTitle: c.enrollment?.formation?.title ?? "Formation",
          instructorName: c.enrollment?.formation?.instructeur?.user?.name ?? "Instructeur",
          score: c.score,
          issuedAt: c.issuedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/formations/apprenants/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
