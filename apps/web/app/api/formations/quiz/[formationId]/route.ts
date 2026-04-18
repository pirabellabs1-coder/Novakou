/**
 * Quiz management for a specific formation.
 *
 * GET  → quiz config (only questions WITHOUT correctness flags when a
 *        learner is asking — instructor gets the full shape)
 * PUT  { title, passPct, questions } → upsert (instructor-only)
 * POST { answers }                   → submit an attempt (learner)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

type Params = { params: Promise<{ formationId: string }> };

interface Choice { label: string; correct: boolean }
interface Question { id: string; question: string; choices: Choice[]; explanation?: string }

export async function GET(_req: Request, { params }: Params) {
  const { formationId } = await params;
  const session = await getServerSession(authOptions);

  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
    select: { id: true, instructeurId: true, title: true },
  });
  if (!formation) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

  const quiz = await prisma.formationQuiz.findUnique({
    where: { formationId },
  });
  if (!quiz) return NextResponse.json({ data: null });

  // Is the current user the instructor?
  const userId = session?.user?.id;
  const isInstructor = userId
    ? !!(await prisma.instructeurProfile.findFirst({
        where: { userId, id: formation.instructeurId },
        select: { id: true },
      }))
    : false;

  // Learners get the questions without the `correct` flag.
  const questions = Array.isArray(quiz.questions) ? (quiz.questions as unknown as Question[]) : [];
  const sanitized = isInstructor
    ? questions
    : questions.map((q) => ({
        id: q.id,
        question: q.question,
        choices: q.choices.map((c) => ({ label: c.label })),
      }));

  return NextResponse.json({
    data: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passPct: quiz.passPct,
      isActive: quiz.isActive,
      questions: sanitized,
      isInstructor,
    },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { formationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id && !IS_DEV) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
    include: { instructeur: { select: { userId: true } } },
  });
  if (!formation) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  if (formation.instructeur.userId !== session?.user?.id && !IS_DEV) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    passPct?: number;
    isActive?: boolean;
    questions?: Question[];
  };

  const title = (body.title ?? "").trim() || "Quiz final";
  const description = body.description?.trim() || null;
  const passPct = Number.isFinite(body.passPct) ? Math.min(100, Math.max(0, Number(body.passPct))) : 70;
  const isActive = body.isActive !== false;
  const questions = Array.isArray(body.questions) ? body.questions : [];

  // Validate structure
  for (const q of questions) {
    if (!q.id || !q.question || !Array.isArray(q.choices) || q.choices.length < 2) {
      return NextResponse.json({ error: "Question invalide (id, énoncé, ≥ 2 choix requis)" }, { status: 400 });
    }
    if (!q.choices.some((c) => c.correct)) {
      return NextResponse.json({ error: `La question "${q.question.slice(0, 40)}…" doit avoir au moins une réponse correcte.` }, { status: 400 });
    }
  }

  const quiz = await prisma.formationQuiz.upsert({
    where: { formationId },
    create: {
      formationId,
      title,
      description,
      passPct,
      isActive,
      questions: questions as unknown as object,
    },
    update: {
      title,
      description,
      passPct,
      isActive,
      questions: questions as unknown as object,
    },
  });
  return NextResponse.json({ data: quiz });
}

export async function POST(req: Request, { params }: Params) {
  const { formationId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const quiz = await prisma.formationQuiz.findUnique({ where: { formationId } });
  if (!quiz || !quiz.isActive) {
    return NextResponse.json({ error: "Quiz indisponible" }, { status: 404 });
  }

  // Must be enrolled
  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_formationId: { userId, formationId } },
  }).catch(() => null);
  if (!enrolled) return NextResponse.json({ error: "Vous devez être inscrit à la formation" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { answers?: { questionId: string; choiceIndex: number }[] };
  const answers = Array.isArray(body.answers) ? body.answers : [];

  const questions = Array.isArray(quiz.questions) ? (quiz.questions as unknown as Question[]) : [];
  const total = questions.length;
  if (total === 0) return NextResponse.json({ error: "Quiz vide" }, { status: 400 });

  let correct = 0;
  const detailed: { questionId: string; chosen: number; ok: boolean }[] = [];
  for (const q of questions) {
    const given = answers.find((a) => a.questionId === q.id);
    const chosen = given?.choiceIndex ?? -1;
    const ok = chosen >= 0 && chosen < q.choices.length && q.choices[chosen]?.correct === true;
    if (ok) correct++;
    detailed.push({ questionId: q.id, chosen, ok });
  }
  const scorePct = Math.round((correct / total) * 100);
  const passed = scorePct >= quiz.passPct;

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId,
      scorePct,
      passed,
      answers: detailed as unknown as object,
    },
  });

  return NextResponse.json({
    data: {
      attempt,
      scorePct,
      correct,
      total,
      passed,
      threshold: quiz.passPct,
    },
  });
}
