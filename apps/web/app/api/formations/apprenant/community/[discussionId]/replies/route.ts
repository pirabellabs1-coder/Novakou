import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveActiveUserId } from "@/lib/formations/active-user";

/**
 * GET /api/formations/apprenant/community/[discussionId]/replies
 * POST pour ajouter une reponse { content }
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ discussionId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { discussionId } = await params;
    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id: discussionId },
      select: { formationId: true, status: true },
    });
    if (!discussion || discussion.status !== "active") {
      return NextResponse.json({ error: "Discussion introuvable" }, { status: 404 });
    }

    // Check enrollment or instructor
    const [enrollment, formation] = await Promise.all([
      prisma.enrollment.findUnique({
        where: { userId_formationId: { userId, formationId: discussion.formationId } },
        select: { refundedAt: true },
      }),
      prisma.formation.findUnique({
        where: { id: discussion.formationId },
        select: { instructeur: { select: { userId: true } } },
      }),
    ]);
    const isInstructor = formation?.instructeur.userId === userId;
    if (!isInstructor && (!enrollment || enrollment.refundedAt)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const replies = await prisma.courseDiscussionReply.findMany({
      where: { discussionId, status: "active" },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ data: replies, isInstructor });
  } catch (err) {
    console.error("[community/replies GET]", err);
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ discussionId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { discussionId } = await params;
    const body = await req.json();
    const content: string = body.content;
    if (!content || content.trim().length < 3) {
      return NextResponse.json({ error: "Message trop court" }, { status: 400 });
    }

    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id: discussionId },
      select: { formationId: true, userId: true, title: true, status: true },
    });
    if (!discussion || discussion.status !== "active") {
      return NextResponse.json({ error: "Discussion introuvable" }, { status: 404 });
    }

    const formation = await prisma.formation.findUnique({
      where: { id: discussion.formationId },
      select: { instructeur: { select: { userId: true } } },
    });
    const isInstructor = formation?.instructeur.userId === userId;

    if (!isInstructor) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_formationId: { userId, formationId: discussion.formationId } },
        select: { refundedAt: true },
      });
      if (!enrollment || enrollment.refundedAt) {
        return NextResponse.json({ error: "Vous devez être inscrit" }, { status: 403 });
      }
    }

    const reply = await prisma.courseDiscussionReply.create({
      data: {
        discussionId,
        userId,
        content: content.trim(),
        isInstructor,
        status: "active",
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Notif a l'auteur de la discussion (sauf si c'est la meme personne)
    if (discussion.userId !== userId) {
      prisma.notification.create({
        data: {
          userId: discussion.userId,
          type: "MESSAGE",
          title: isInstructor ? "L'instructeur a répondu à votre question" : "Nouvelle réponse",
          message: `Sur "${discussion.title.slice(0, 60)}"`,
          link: `/apprenant/formation/${discussion.formationId}?discussion=${discussionId}`,
        },
      }).catch(() => null);
    }

    return NextResponse.json({ data: reply }, { status: 201 });
  } catch (err) {
    console.error("[community/replies POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
