import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { sendCertificateIssuedEmail } from "@/lib/email/formations";
import { randomBytes } from "crypto";

/**
 * POST /api/apprenant/lessons/[id]/complete
 *
 * Marks a lesson as completed for the current user.
 * Automatically updates the enrollment progress.
 * If progress reaches 100%, generates a certificate automatically.
 *
 * Body: { watchedPct?: number, score?: number }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id: lessonId } = await params;
    const body = await request.json().catch(() => ({}));
    const watchedPct = Number(body.watchedPct ?? 100);
    const score = typeof body.score === "number" ? body.score : undefined;

    // 1. Find the lesson + its formation
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        section: { select: { formationId: true } },
      },
    });
    if (!lesson) return NextResponse.json({ error: "Leçon introuvable" }, { status: 404 });

    const formationId = lesson.section.formationId;

    // 2. Find the enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_formationId: { userId, formationId } },
      select: { id: true, formationId: true, progress: true, completedAt: true },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Vous n'êtes pas inscrit à cette formation" }, { status: 403 });
    }

    // 3. Upsert lesson progress
    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        completed: true,
        watchedPct,
        score,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        watchedPct,
        score,
        completedAt: new Date(),
      },
    });

    // 4. Count total lessons + completed lessons to compute progress
    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({ where: { section: { formationId } } }),
      prisma.lessonProgress.count({
        where: { enrollmentId: enrollment.id, completed: true },
      }),
    ]);

    const newProgress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    const is100 = newProgress >= 100;

    // 5. Update enrollment progress
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: newProgress,
        ...(is100 && !enrollment.completedAt ? { completedAt: new Date() } : {}),
      },
    });

    // 6. Auto-generate certificate if just completed
    let certificateId: string | null = null;
    let certificateCode: string | null = null;
    if (is100) {
      // Check if certificate already exists
      const existing = await prisma.certificate.findUnique({
        where: { enrollmentId: enrollment.id },
        select: { id: true, code: true },
      });
      if (existing) {
        certificateId = existing.id;
        certificateCode = existing.code;
      } else {
        // Generate unique code: NK-YYYYMMDD-XXXXXX
        const now = new Date();
        const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const randPart = randomBytes(4).toString("hex").toUpperCase();
        const code = `NK-${datePart}-${randPart}`;

        // Compute average score from lesson progresses
        const progresses = await prisma.lessonProgress.findMany({
          where: { enrollmentId: enrollment.id, score: { not: null } },
          select: { score: true },
        });
        const avgScore = progresses.length > 0
          ? Math.round(progresses.reduce((s, p) => s + (p.score ?? 0), 0) / progresses.length)
          : 100;

        const newCert = await prisma.certificate.create({
          data: {
            code,
            enrollmentId: enrollment.id,
            userId,
            formationId,
            score: avgScore,
          },
          select: { id: true, code: true },
        });
        certificateId = newCert.id;
        certificateCode = newCert.code;

        // Email de félicitations + certificat (best-effort, ne bloque pas)
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          });
          const formation = await prisma.formation.findUnique({
            where: { id: formationId },
            select: { title: true },
          });
          if (user?.email && formation) {
            sendCertificateIssuedEmail({
              email: user.email,
              name: user.name || user.email.split("@")[0],
              formationTitle: formation.title,
              certificateCode: code,
              score: avgScore,
              locale: "fr",
            }).catch((e) => console.error("[cert email]", e?.message ?? e));
          }
        } catch (e) {
          console.error("[cert email lookup]", e);
        }
      }
    }

    return NextResponse.json({
      data: {
        progress: newProgress,
        completed: is100,
        certificate: certificateId ? { id: certificateId, code: certificateCode } : null,
      },
    });
  } catch (err) {
    console.error("[lessons/[id]/complete POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
