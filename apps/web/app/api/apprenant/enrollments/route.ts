// GET /api/apprenant/enrollments — Mes formations avec stats

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { formationCardInclude } from "@/lib/formations/prisma-helpers";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        formation: {
          select: {
            id: true,
            slug: true,
            titleFr: true,
            titleEn: true,
            thumbnail: true,
            duration: true,
            level: true,
            categoryId: true,
            instructeur: {
              select: { user: { select: { name: true } } },
            },
          },
        },
        certificate: { select: { code: true } },
        cohort: {
          select: {
            id: true,
            titleFr: true,
            titleEn: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        lessonProgress: {
          take: 1,
          orderBy: { completedAt: "desc" },
          where: { completed: true },
          include: {
            lesson: { select: { titleFr: true, titleEn: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map enrollments with instructor data from the included formation relation
    const enriched = enrollments.map((e) => ({
      ...e,
      instructeur: { user: { name: e.formation.instructeur?.user?.name ?? "" } },
      lastLessonTitle: e.lessonProgress[0]?.lesson?.titleFr ?? null,
    }));

    // Stats
    const completed = enrollments.filter((e) => e.progress >= 100).length;
    const inProgress = enrollments.filter((e) => e.progress < 100).length;
    const certificates = enrollments.filter((e) => e.certificate !== null).length;
    const totalMinutes = enrollments.reduce((sum, e) => sum + e.formation.duration, 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Streak: check consecutive days with lesson activity
    const recentProgress = await prisma.lessonProgress.findMany({
      where: {
        enrollment: { userId },
        completed: true,
        completedAt: { not: null },
      },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 100,
    });

    let streak = 0;
    if (recentProgress.length > 0) {
      const dates = [...new Set(recentProgress.map((p) => p.completedAt!.toISOString().split("T")[0]))];
      const today = new Date().toISOString().split("T")[0];
      let current = today;
      for (const date of dates) {
        if (date === current) {
          streak++;
          const d = new Date(current);
          d.setDate(d.getDate() - 1);
          current = d.toISOString().split("T")[0];
        } else break;
      }
    }

    // ── weeklyHours: hours per week for last 8 weeks ──
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const progressWithDuration = await prisma.lessonProgress.findMany({
      where: {
        enrollment: { userId },
        completed: true,
        completedAt: { not: null, gte: eightWeeksAgo },
      },
      select: {
        completedAt: true,
        lesson: { select: { duration: true } },
      },
      orderBy: { completedAt: "asc" },
    });

    // Build weekly buckets
    const weeklyMap = new Map<string, number>();
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
      const key = weekStart.toISOString().split("T")[0];
      weeklyMap.set(key, 0);
    }

    for (const p of progressWithDuration) {
      if (!p.completedAt) continue;
      const date = new Date(p.completedAt);
      // Find the Monday of that week
      const day = date.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(date);
      monday.setDate(monday.getDate() + mondayOffset);
      const key = monday.toISOString().split("T")[0];

      const lessonMinutes = p.lesson?.duration ?? 0;
      const hours = lessonMinutes / 60;
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + hours);
    }

    const weeklyHours = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, hours]) => ({ week, hours: Math.round(hours * 10) / 10 }));

    // ── skillRadar: average progress per category ──
    const categoryProgressMap = new Map<string, { total: number; count: number; name: string }>();

    for (const e of enrollments) {
      const catId = e.formation.categoryId;
      if (!catId) continue;
      const existing = categoryProgressMap.get(catId);
      if (existing) {
        existing.total += e.progress;
        existing.count += 1;
      } else {
        categoryProgressMap.set(catId, { total: e.progress, count: 1, name: "" });
      }
    }

    // Fetch category names
    const categoryIds = Array.from(categoryProgressMap.keys());
    if (categoryIds.length > 0) {
      const categories = await prisma.formationCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, nameFr: true },
      });
      for (const cat of categories) {
        const entry = categoryProgressMap.get(cat.id);
        if (entry) entry.name = cat.nameFr;
      }
    }

    const skillRadar = Array.from(categoryProgressMap.values()).map((v) => ({
      category: v.name,
      progress: Math.round(v.total / v.count),
    }));

    // ── weeklyGoalProgress: hours this week / 5 hours goal * 100 ──
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekProgress = await prisma.lessonProgress.findMany({
      where: {
        enrollment: { userId },
        completed: true,
        completedAt: { not: null, gte: startOfWeek },
      },
      select: {
        lesson: { select: { duration: true } },
      },
    });

    const thisWeekMinutes = thisWeekProgress.reduce(
      (sum, p) => sum + (p.lesson?.duration ?? 0),
      0
    );
    const thisWeekHours = thisWeekMinutes / 60;
    const weeklyGoalProgress = Math.min(100, Math.round((thisWeekHours / 5) * 100));

    // ── recommendations: 4 formations from same categories, not already enrolled ──
    const enrolledFormationIds = enrollments.map((e) => e.formationId);
    const userCategoryIds = [...new Set(enrollments.map((e) => e.formation.categoryId).filter(Boolean))];

    let recommendations: unknown[] = [];
    if (userCategoryIds.length > 0) {
      recommendations = await prisma.formation.findMany({
        where: {
          status: "ACTIF",
          categoryId: { in: userCategoryIds },
          id: { notIn: enrolledFormationIds },
        },
        include: formationCardInclude,
        take: 4,
        orderBy: { studentsCount: "desc" },
      });
    }

    return NextResponse.json({
      enrollments: enriched,
      stats: { inProgress, completed, certificates, totalHours, streak },
      weeklyHours,
      skillRadar,
      recommendations,
      weeklyGoalProgress,
    });
  } catch (error) {
    console.error("[GET /api/apprenant/enrollments]", error);
    return NextResponse.json({
      enrollments: [],
      stats: {
        inProgress: 0,
        completed: 0,
        certificates: 0,
        totalHours: 0,
        streak: 0,
      },
      weeklyHours: [],
      skillRadar: [],
      recommendations: [],
      weeklyGoalProgress: 0,
    });
  }
}
