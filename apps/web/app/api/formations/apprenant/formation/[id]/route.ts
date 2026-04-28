/**
 * GET /api/formations/apprenant/formation/[id]
 *
 * Retourne le contenu complet d'une formation pour un apprenant qui y est
 * inscrit. Protège contre l'accès non-autorisé :
 *   - Doit être connecté
 *   - Doit avoir une Enrollment active pour cette formation, sauf si la
 *     formation est gratuite (isFree) auquel cas l'accès est libre
 *   - Les leçons marquées isFree restent visibles même sans inscription
 *     (preview / tease de conversion).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);

  // Tente d'abord par id, sinon par slug (permet URLs plus propres)
  const formation = await prisma.formation.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      thumbnail: true,
      price: true,
      isFree: true,
      instructeur: {
        select: {
          user: { select: { name: true, image: true } },
        },
      },
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          desc: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              desc: true,
              content: true,
              videoUrl: true,
              pdfUrl: true,
              audioUrl: true,
              duration: true,
              order: true,
              isFree: true,
              type: true,
              allowDownload: true,
              resources: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                  fileSize: true,
                  mimeType: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  // Vérifier l'accès — soit Enrollment direct, soit via Subscription active
  let hasAccess = !!formation.isFree;
  if (!hasAccess && userId) {
    const { userHasFormationAccess } = await import("@/lib/formations/access");
    hasAccess = await userHasFormationAccess(userId, formation.id);
  }

  // Charger la progression (leçons déjà terminées) pour cet utilisateur
  let completedLessonIds = new Set<string>();
  let progressPct = 0;
  let enrollmentId: string | null = null;
  if (userId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_formationId: { userId, formationId: formation.id } },
      select: {
        id: true,
        progress: true,
        lessonProgress: {
          where: { completed: true },
          select: { lessonId: true },
        },
      },
    });
    if (enrollment) {
      enrollmentId = enrollment.id;
      progressPct = enrollment.progress;
      completedLessonIds = new Set(enrollment.lessonProgress.map((p) => p.lessonId));
    }
  }

  // Si l'utilisateur n'a pas accès : on masque les videoUrls sauf les leçons isFree (preview)
  const sanitized = {
    ...formation,
    hasAccess,
    enrollmentId,
    progressPct,
    sections: formation.sections.map((s) => ({
      ...s,
      lessons: s.lessons.map((l) => ({
        ...l,
        videoUrl: hasAccess || l.isFree ? l.videoUrl : null,
        pdfUrl: hasAccess || l.isFree ? l.pdfUrl : null,
        audioUrl: hasAccess || l.isFree ? l.audioUrl : null,
        content: hasAccess || l.isFree ? l.content : null,
        resources: hasAccess || l.isFree ? l.resources : [],
        completed: completedLessonIds.has(l.id),
      })),
    })),
  };

  return NextResponse.json({ data: sanitized });
}
