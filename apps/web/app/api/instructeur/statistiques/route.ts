// GET /api/instructeur/statistiques — Statistiques avancées instructeur

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { INSTRUCTOR_COMMISSION } from "@/lib/formations/prisma-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructeur || instructeur.status !== "APPROUVE") {
      return NextResponse.json({ error: "Profil instructeur non trouvé" }, { status: 403 });
    }

    const period = req.nextUrl.searchParams.get("period") ?? "6m";
    const months = period === "7d" ? 1 : period === "30d" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    // Revenue by month
    const enrollments = await prisma.enrollment.findMany({
      where: {
        formation: { instructeurId: instructeur.id },
        createdAt: { gte: since },
      },
      select: { createdAt: true, paidAmount: true },
    });

    const monthMap = new Map<string, number>();
    for (const e of enrollments) {
      const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + e.paidAmount);
    }

    const revenueByMonth = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rev = monthMap.get(key) ?? 0;
      revenueByMonth.push({
        month: d.toLocaleString("fr-FR", { month: "short" }),
        revenue: Math.round(rev),
        net: Math.round(rev * INSTRUCTOR_COMMISSION),
      });
    }

    // Enrollments by week (last 8 weeks)
    const enrollmentsByWeek = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const count = enrollments.filter(
        (e) => new Date(e.createdAt) >= weekStart && new Date(e.createdAt) < weekEnd
      ).length;

      enrollmentsByWeek.push({
        week: `S${8 - i}`,
        students: count,
      });
    }

    // Formation performance with real revenue
    const formations = await prisma.formation.findMany({
      where: { instructeurId: instructeur.id, status: "ACTIF" },
      select: {
        id: true,
        titleFr: true,
        studentsCount: true,
        rating: true,
        enrollments: { select: { paidAmount: true } },
      },
      orderBy: { studentsCount: "desc" },
      take: 5,
    });

    const formationPerformance = formations.map((f) => ({
      name: f.titleFr.length > 20 ? f.titleFr.substring(0, 20) + "..." : f.titleFr,
      students: f.studentsCount,
      rating: f.rating,
      revenue: Math.round(f.enrollments.reduce((acc, e) => acc + e.paidAmount, 0) * INSTRUCTOR_COMMISSION * 100) / 100,
    }));

    // Completion rate
    const allEnrollments = await prisma.enrollment.findMany({
      where: { formation: { instructeurId: instructeur.id } },
      select: { progress: true },
    });
    const completionRate = allEnrollments.length > 0
      ? (allEnrollments.filter((e) => e.progress >= 100).length / allEnrollments.length) * 100
      : 0;

    // Avg quiz score
    const quizScores = await prisma.lessonProgress.findMany({
      where: {
        score: { not: null },
        enrollment: { formation: { instructeurId: instructeur.id } },
      },
      select: { score: true },
    });
    const avgQuizScore = quizScores.length > 0
      ? quizScores.reduce((acc, q) => acc + (q.score ?? 0), 0) / quizScores.length
      : 0;

    // Top countries (from actual user profiles)
    const enrollmentsWithCountry = await prisma.enrollment.findMany({
      where: { formation: { instructeurId: instructeur.id } },
      select: { user: { select: { country: true } } },
    });
    const countryMap = new Map<string, number>();
    for (const e of enrollmentsWithCountry) {
      const c = e.user.country || "Non renseigné";
      countryMap.set(c, (countryMap.get(c) ?? 0) + 1);
    }
    const topCountries = Array.from(countryMap.entries())
      .map(([country, students]) => ({ country, students }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        revenueByMonth,
        enrollmentsByWeek,
        formationPerformance,
        completionRate,
        avgQuizScore,
        topCountries,
        conversionData: [],
      },
    });
  } catch (error) {
    console.error("[GET /api/instructeur/statistiques]", error);
    return NextResponse.json({
      stats: {
        revenueByMonth: [],
        enrollmentsByWeek: [],
        formationPerformance: [],
        completionRate: 0,
        avgQuizScore: 0,
        topCountries: [],
        conversionData: [],
      },
    });
  }
}
