// GET /api/formations/quiz/[quizId] — Récupérer un quiz pour le joueur

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { ensureUserInDb } from "@/lib/formations/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            options: true,
            explanation: true,
            // Do NOT return correctAnswer to client
          },
        },
        lesson: {
          select: {
            sectionId: true,
            section: {
              select: {
                formationId: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        formationId: quiz.lesson.section.formationId,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Non inscrit" }, { status: 403 });
    }

    return NextResponse.json({
      id: quiz.id,
      title: quiz.title,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions,
      lessonId: quiz.lessonId,
    });
  } catch (error) {
    console.error("[GET /api/formations/quiz/[quizId]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
