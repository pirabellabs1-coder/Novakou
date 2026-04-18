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
              videoUrl: true,
              duration: true,
              order: true,
              isFree: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  // Vérifier l'accès
  let hasAccess = !!formation.isFree;
  if (!hasAccess && userId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_formationId: { userId, formationId: formation.id } },
      select: { id: true, refundedAt: true },
    }).catch(() => null);
    hasAccess = !!enrollment && !enrollment.refundedAt;
  }

  // Si l'utilisateur n'a pas accès : on masque les videoUrls sauf les leçons isFree (preview)
  const sanitized = {
    ...formation,
    hasAccess,
    sections: formation.sections.map((s) => ({
      ...s,
      lessons: s.lessons.map((l) => ({
        ...l,
        videoUrl: hasAccess || l.isFree ? l.videoUrl : null,
      })),
    })),
  };

  return NextResponse.json({ data: sanitized });
}
