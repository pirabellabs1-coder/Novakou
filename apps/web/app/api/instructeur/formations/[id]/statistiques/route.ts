// GET /api/instructeur/formations/[id]/statistiques — Stats détaillées d'une formation

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { INSTRUCTOR_COMMISSION } from "@/lib/formations/prisma-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructeur) {
      return NextResponse.json({ error: "Profil instructeur introuvable" }, { status: 403 });
    }

    // Get formation with sections/lessons (no lessonProgress on Lesson model)
    const formation = await prisma.formation.findFirst({
      where: { id, instructeurId: instructeur.id },
      include: {
        sections: {
          include: {
            lessons: {
              select: { id: true, titleFr: true },
            },
          },
        },
        enrollments: {
          select: {
            id: true,
            paidAmount: true,
            createdAt: true,
            completedAt: true,
          },
        },
        reviews: { select: { rating: true } },
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    const totalStudents = formation.enrollments.length;
    const completedCount = formation.enrollments.filter((e) => e.completedAt !== null).length;
    const completionRate = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;

    const totalRevenue = formation.enrollments.reduce(
      (acc: number, e: { paidAmount: number }) => acc + e.paidAmount,
      0
    );

    const avgRating =
      formation.reviews.length > 0
        ? formation.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) /
          formation.reviews.length
        : 0;

    // Revenue by month (last 6 months)
    const monthMap = new Map<string, number>();
    for (const e of formation.enrollments) {
      const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + e.paidAmount * INSTRUCTOR_COMMISSION);
    }

    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth.push({
        month: d.toLocaleString("fr-FR", { month: "short" }),
        revenue: Math.round(monthMap.get(key) ?? 0),
      });
    }

    // Enrollments by week (last 8 weeks)
    const weekMap = new Map<string, number>();
    for (const e of formation.enrollments) {
      const d = new Date(e.createdAt);
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      const key = startOfWeek.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
      weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
    }

    const enrollmentsByWeek = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7 - d.getDay());
      const key = d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
      enrollmentsByWeek.push({ week: key, count: weekMap.get(key) ?? 0 });
    }

    // Lesson completion rates — query LessonProgress separately
    const allLessons = formation.sections.flatMap((s) => s.lessons);
    const lessonIds = allLessons.map((l) => l.id);
    const enrollmentIds = formation.enrollments.map((e) => e.id);

    const progressRecords = await prisma.lessonProgress.findMany({
      where: {
        lessonId: { in: lessonIds },
        enrollmentId: { in: enrollmentIds },
      },
      select: { lessonId: true, completed: true, score: true },
    });

    const lessonCompletion = allLessons.map((lesson) => {
      const records = progressRecords.filter((p) => p.lessonId === lesson.id);
      const total = records.length;
      const completed = records.filter((p) => p.completed).length;
      return {
        title: lesson.titleFr,
        completedPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    // Average quiz score from all progress records with scores
    const scoredRecords = progressRecords.filter((p) => p.score !== null);
    const avgQuizScore =
      scoredRecords.length > 0
        ? scoredRecords.reduce((a, b) => a + (b.score as number), 0) / scoredRecords.length
        : 0;

    return NextResponse.json({
      titleFr: formation.titleFr,
      studentsCount: totalStudents,
      rating: avgRating,
      reviewsCount: formation.reviews.length,
      completionRate,
      totalRevenue,
      revenueByMonth,
      enrollmentsByWeek,
      avgQuizScore,
      lessonCompletion,
    });
  } catch (error) {
    console.error("[GET /api/instructeur/formations/[id]/statistiques]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
