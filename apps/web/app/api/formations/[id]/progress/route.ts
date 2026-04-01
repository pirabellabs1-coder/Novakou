// GET /api/formations/[id]/progress — Progression de l'apprenant
// PUT /api/formations/[id]/progress — Mettre à jour la progression d'une leçon

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { calculateProgress, generateCertificateCode } from "@/lib/formations/prisma-helpers";
import { sendCertificateIssuedEmail } from "@/lib/email/formations";
import { z } from "zod";
import { ensureUserInDb } from "@/lib/formations/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    const enrollment = await prisma.enrollment.findFirst({
      where: { formationId: id, userId: session.user.id },
      include: {
        lessonProgress: true,
        certificate: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Non inscrit" }, { status: 404 });
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("[GET /api/formations/[id]/progress]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const updateProgressSchema = z.object({
  lessonId: z.string(),
  completed: z.boolean(),
  watchedPct: z.number().min(0).max(100).optional(),
  score: z.number().min(0).max(100).optional(),
});

export async function PUT(
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
    const { lessonId, completed, watchedPct, score } = updateProgressSchema.parse(body);

    const enrollment = await prisma.enrollment.findFirst({
      where: { formationId: id, userId: session.user.id },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Non inscrit" }, { status: 404 });
    }

    // Upsert la progression de la leçon
    await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
      update: {
        completed,
        watchedPct: watchedPct ?? undefined,
        score: score ?? undefined,
        completedAt: completed ? new Date() : null,
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        completed,
        watchedPct: watchedPct ?? null,
        score: score ?? null,
        completedAt: completed ? new Date() : null,
      },
    });

    // Recalculer la progression globale
    const progress = await calculateProgress(enrollment.id);

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress,
        completedAt: progress === 100 ? new Date() : null,
      },
    });

    // Si formation 100% complétée, vérifier les critères de certificat
    if (progress === 100) {
      const formation = await prisma.formation.findUnique({
        where: { id },
        select: { hasCertificate: true, minScore: true, requireFinalQuiz: true },
      });

      if (formation?.hasCertificate) {
        // Vérifier si le certificat n'existe pas encore
        const existingCert = await prisma.certificate.findUnique({
          where: { enrollmentId: enrollment.id },
        });

        if (!existingCert) {
          // Calculer le score moyen des quiz
          const quizResults = await prisma.lessonProgress.findMany({
            where: { enrollmentId: enrollment.id, score: { not: null } },
            select: { score: true },
          });

          const avgScore = quizResults.length > 0
            ? Math.round(quizResults.reduce((acc, r) => acc + (r.score ?? 0), 0) / quizResults.length)
            : 100;

          if (avgScore >= (formation.minScore ?? 80)) {
            // Générer le certificat
            const code = generateCertificateCode();
            await prisma.certificate.create({
              data: {
                code,
                enrollmentId: enrollment.id,
                userId: session.user.id,
                formationId: id,
                score: avgScore,
              },
            });

            // Send certificate email (fire-and-forget)
            const formationDetails = await prisma.formation.findUnique({
              where: { id },
              select: { title: true },
            });
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://freelancehigh.com";
            sendCertificateIssuedEmail({
              email: session.user.email ?? "",
              name: session.user.name ?? "Apprenant",
              formationTitle: formationDetails?.title ?? "Formation",
              certificateCode: code,
              pdfUrl: `${baseUrl}/api/formations/${id}/certificate`,
              score: avgScore,
              locale: "fr",
            }).catch((err) => console.error("[Email] sendCertificateIssuedEmail:", err));
          }
        }
      }
    }

    return NextResponse.json({ progress, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[PUT /api/formations/[id]/progress]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
