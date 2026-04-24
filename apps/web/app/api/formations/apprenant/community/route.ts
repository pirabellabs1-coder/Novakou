import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveActiveUserId } from "@/lib/formations/active-user";

/**
 * GET /api/formations/apprenant/community?formationId=X
 * Liste les discussions d'une formation (apprenant doit etre enrolled).
 *
 * POST /api/formations/apprenant/community
 * Body: { formationId, title, content, isQuestion? }
 * Cree une discussion.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const formationId = searchParams.get("formationId");
    if (!formationId) return NextResponse.json({ error: "formationId requis" }, { status: 400 });

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_formationId: { userId, formationId } },
      select: { id: true, refundedAt: true },
    });
    if (!enrollment || enrollment.refundedAt) {
      return NextResponse.json({ error: "Vous devez être inscrit à cette formation" }, { status: 403 });
    }

    const discussions = await prisma.courseDiscussion.findMany({
      where: { formationId, status: "active" },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { replies: true } },
      },
    });

    return NextResponse.json({ data: discussions });
  } catch (err) {
    console.error("[apprenant/community GET]", err);
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { formationId, title, content } = body;

    if (!formationId || !title || !content) {
      return NextResponse.json({ error: "formationId, title, content requis" }, { status: 400 });
    }
    if (title.trim().length < 5 || title.trim().length > 200) {
      return NextResponse.json({ error: "Titre : 5-200 caractères" }, { status: 400 });
    }
    if (content.trim().length < 10) {
      return NextResponse.json({ error: "Message trop court (10 chars min)" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_formationId: { userId, formationId } },
      select: { id: true, refundedAt: true },
    });
    if (!enrollment || enrollment.refundedAt) {
      return NextResponse.json({ error: "Vous devez être inscrit à cette formation" }, { status: 403 });
    }

    const discussion = await prisma.courseDiscussion.create({
      data: {
        formationId,
        userId,
        title: title.trim(),
        content: content.trim(),
        status: "active",
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { replies: true } },
      },
    });

    // Notify instructor
    const formation = await prisma.formation.findUnique({
      where: { id: formationId },
      select: { title: true, instructeur: { select: { userId: true } } },
    });
    if (formation?.instructeur.userId) {
      prisma.notification.create({
        data: {
          userId: formation.instructeur.userId,
          type: "MESSAGE",
          title: "Nouvelle discussion dans votre communauté",
          message: `"${title.trim().slice(0, 60)}" sur ${formation.title}`,
          link: `/vendeur/communaute`,
        },
      }).catch(() => null);
    }

    return NextResponse.json({ data: discussion }, { status: 201 });
  } catch (err) {
    console.error("[apprenant/community POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
