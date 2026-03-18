// POST /api/formations/[id]/discussions/report — Signaler une discussion ou réponse

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { discussionId, replyId, reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "La raison du signalement est requise" },
        { status: 400 }
      );
    }

    if (!discussionId && !replyId) {
      return NextResponse.json(
        { error: "discussionId ou replyId est requis" },
        { status: 400 }
      );
    }

    // Check for duplicate report on discussion
    if (discussionId) {
      const existingReport = await prisma.discussionReport.findUnique({
        where: {
          userId_discussionId: {
            userId,
            discussionId,
          },
        },
      });

      if (existingReport) {
        return NextResponse.json(
          { error: "Vous avez déjà signalé cette discussion" },
          { status: 409 }
        );
      }

      // Verify discussion exists
      const discussion = await prisma.courseDiscussion.findUnique({
        where: { id: discussionId },
      });

      if (!discussion) {
        return NextResponse.json(
          { error: "Discussion introuvable" },
          { status: 404 }
        );
      }

      // Create report and increment reportCount in a transaction
      await prisma.$transaction([
        prisma.discussionReport.create({
          data: {
            userId,
            discussionId,
            reason,
          },
        }),
        prisma.courseDiscussion.update({
          where: { id: discussionId },
          data: { reportCount: { increment: 1 } },
        }),
      ]);
    }

    if (replyId) {
      // Verify reply exists
      const reply = await prisma.courseDiscussionReply.findUnique({
        where: { id: replyId },
      });

      if (!reply) {
        return NextResponse.json(
          { error: "Réponse introuvable" },
          { status: 404 }
        );
      }

      // For reply reports, check by replyId (no unique constraint on userId+replyId,
      // so we check manually)
      const existingReplyReport = await prisma.discussionReport.findFirst({
        where: {
          userId,
          replyId,
        },
      });

      if (existingReplyReport) {
        return NextResponse.json(
          { error: "Vous avez déjà signalé cette réponse" },
          { status: 409 }
        );
      }

      // Create report and increment reportCount on the reply in a transaction
      await prisma.$transaction([
        prisma.discussionReport.create({
          data: {
            userId,
            replyId,
            reason,
          },
        }),
        prisma.courseDiscussionReply.update({
          where: { id: replyId },
          data: { reportCount: { increment: 1 } },
        }),
      ]);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/formations/[id]/discussions/report]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
