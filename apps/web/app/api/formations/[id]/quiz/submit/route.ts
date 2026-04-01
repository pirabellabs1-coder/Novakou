// POST /api/formations/[id]/quiz/submit — Soumettre les réponses d'un quiz

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";
import { generateCertificateCode, generateCertificatePDF } from "@/lib/formations/certificate-generator";
import { sendCertificateIssuedEmail } from "@/lib/email/formations";
import { uploadFile } from "@/lib/supabase-storage";
import { ensureUserInDb } from "@/lib/formations/ensure-user";

const submitSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    const body = await req.json();
    const { quizId, answers } = submitSchema.parse(body);

    // Get quiz with correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: {
            id: true,
            type: true,
            correctAnswer: true,
            explanation: true,
          },
        },
        lesson: {
          select: {
            id: true,
            section: { select: { formationId: true } },
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
        formationId: id,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Non inscrit" }, { status: 403 });
    }

    // Calculate score
    let correct = 0;
    const details: { questionId: string; correct: boolean; correctAnswer?: string | string[]; explanation: string | null }[] = [];

    // Map for normalizing VRAI_FAUX values (creation stores "Vrai"/"Faux", quiz page sends "true"/"false")
    const vraiMap: Record<string, string> = { "vrai": "true", "faux": "false", "true": "true", "false": "false" };

    for (const question of quiz.questions) {
      const userAnswer = answers[question.id];
      let isCorrect = false;
      let normalizedCorrectAnswer: string | string[] = question.correctAnswer;

      if (question.type === "CHOIX_MULTIPLE") {
        // Multiple choice: compare sorted arrays
        const correctArr = question.correctAnswer.split(",").map((s) => s.trim()).sort();
        normalizedCorrectAnswer = correctArr;
        const userArr = Array.isArray(userAnswer)
          ? [...userAnswer].sort()
          : (String(userAnswer ?? "")).split(",").map((s: string) => s.trim()).sort();
        isCorrect = JSON.stringify(correctArr) === JSON.stringify(userArr);
      } else if (question.type === "TEXTE_LIBRE") {
        // Free text: loose comparison (lowercase, trim)
        const expected = question.correctAnswer.toLowerCase().trim();
        const given = (typeof userAnswer === "string" ? userAnswer : "").toLowerCase().trim();
        isCorrect = given.includes(expected) || expected.includes(given);
        normalizedCorrectAnswer = question.correctAnswer;
      } else if (question.type === "VRAI_FAUX") {
        // Normalize both sides: "Vrai"/"Faux" from DB and "true"/"false" from client
        const normalizedCorrect = vraiMap[question.correctAnswer.toLowerCase()] ?? question.correctAnswer;
        const normalizedUser = vraiMap[String(userAnswer).toLowerCase()] ?? String(userAnswer);
        isCorrect = normalizedCorrect === normalizedUser;
        normalizedCorrectAnswer = normalizedCorrect;
      } else {
        // Single choice
        isCorrect = String(userAnswer) === String(question.correctAnswer);
        normalizedCorrectAnswer = question.correctAnswer;
      }

      if (isCorrect) correct++;
      details.push({
        questionId: question.id,
        correct: isCorrect,
        correctAnswer: normalizedCorrectAnswer,
        explanation: question.explanation ?? null,
      });
    }

    const score = quiz.questions.length > 0 ? Math.round((correct / quiz.questions.length) * 100) : 0;
    const passed = score >= quiz.passingScore;

    // Update lesson progress with score
    if (passed) {
      await prisma.lessonProgress.upsert({
        where: {
          enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: quiz.lessonId },
        },
        create: {
          enrollmentId: enrollment.id,
          lessonId: quiz.lessonId,
          completed: true,
          score,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          score,
          completedAt: new Date(),
        },
      });

      // Recalculate global progress
      const allLessons = await prisma.lesson.count({
        where: { section: { formationId: id } },
      });
      const completedCount = await prisma.lessonProgress.count({
        where: { enrollmentId: enrollment.id, completed: true },
      });
      const progressPct = allLessons > 0 ? Math.round((completedCount / allLessons) * 100) : 0;

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { progress: progressPct, ...(progressPct >= 100 ? { completedAt: new Date() } : {}) },
      });

      // Auto-generate certificate when 100% completed
      let certificateCode: string | null = null;
      if (progressPct >= 100) {
        const formation = await prisma.formation.findUnique({
          where: { id: id },
          select: {
            hasCertificate: true,
            minScore: true,
            title: true,
            instructeur: { select: { user: { select: { name: true } } } },
          },
        });

        if (formation?.hasCertificate && score >= (formation.minScore ?? 0)) {
          // Check if certificate already exists
          const existing = await prisma.certificate.findFirst({
            where: { enrollmentId: enrollment.id },
          });

          if (!existing) {
            certificateCode = generateCertificateCode();

            // Generate PDF and upload to Supabase Storage
            try {
              const pdfBuffer = await generateCertificatePDF({
                studentName: session.user.name ?? "Apprenant",
                formationTitle: formation.title,
                instructorName: formation.instructeur?.user?.name ?? "Instructeur",
                score,
                completionDate: new Date(),
                certificateCode,
                locale: "fr",
              });

              // Upload PDF to Supabase Storage
              const storagePath = `${session.user.id}/${certificateCode}.pdf`;
              const uploadResult = await uploadFile(
                "certificates",
                storagePath,
                pdfBuffer,
                "application/pdf"
              );

              await prisma.certificate.create({
                data: {
                  code: certificateCode,
                  enrollmentId: enrollment.id,
                  userId: session.user.id,
                  formationId: id,
                  score,
                  pdfStoragePath: uploadResult?.path ?? null,
                  pdfUrl: uploadResult?.url ?? null,
                },
              });
            } catch (pdfErr) {
              console.error("[Certificate PDF generation error]", pdfErr);
              // Still create certificate record without PDF
              await prisma.certificate.create({
                data: {
                  code: certificateCode,
                  enrollmentId: enrollment.id,
                  userId: session.user.id,
                  formationId: id,
                  score,
                },
              });
            }

            // Send certificate email (fire-and-forget)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://freelancehigh.com";
            sendCertificateIssuedEmail({
              email: session.user.email ?? "",
              name: session.user.name ?? "Apprenant",
              formationTitle: formation.title,
              certificateCode,
              pdfUrl: `${baseUrl}/api/formations/${id}/certificate`,
              score,
              locale: "fr",
            }).catch((err) => console.error("[Email] sendCertificateIssuedEmail:", err));
          }
        }
      }
    }

    return NextResponse.json({
      score,
      passed,
      correctAnswers: correct,
      totalQuestions: quiz.questions.length,
      details,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    console.error("[POST /api/formations/[id]/quiz/submit]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
