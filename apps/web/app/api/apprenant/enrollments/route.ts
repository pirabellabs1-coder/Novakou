// GET /api/apprenant/enrollments — Mes formations avec stats

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { formationCardInclude } from "@/lib/formations/prisma-helpers";
import { ensureUserInDb } from "@/lib/formations/ensure-user";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    const userId = session.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        formation: {
          select: {
            id: true,
            slug: true,
            title: true,
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
            title: true,
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
            lesson: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map enrollments with instructor data from the included formation relation
    const enriched = enrollments.map((e) => ({
      ...e,
      instructeur: { user: { name: e.formation.instructeur?.user?.name ?? "" } },
      lastLessonTitle: e.lessonProgress[0]?.lesson?.title ?? null,
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

    const now = new Date();

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
        select: { id: true, name: true },
      });
      for (const cat of categories) {
        const entry = categoryProgressMap.get(cat.id);
        if (entry) entry.name = cat.name;
      }
    }

    const skillRadar = Array.from(categoryProgressMap.values())
      .filter((v) => v.name)
      .map((v) => ({
        category: v.name,
        value: Math.round(v.total / v.count),
      }));

    // ── dailyHours: hours per day for the current week (Mon-Sun) ──
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset2 = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset2);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekProgress = await prisma.lessonProgress.findMany({
      where: {
        enrollment: { userId },
        completed: true,
        completedAt: { not: null, gte: startOfWeek },
      },
      select: {
        completedAt: true,
        lesson: { select: { duration: true } },
      },
    });

    // Build daily buckets for the current week
    const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const dailyMap = new Map<number, number>(); // 0=Mon ... 6=Sun
    for (let i = 0; i < 7; i++) dailyMap.set(i, 0);

    for (const p of thisWeekProgress) {
      if (!p.completedAt) continue;
      const d = new Date(p.completedAt).getDay();
      // Convert JS Sunday=0 to Mon=0 format
      const dayIndex = d === 0 ? 6 : d - 1;
      const minutes = p.lesson?.duration ?? 0;
      dailyMap.set(dayIndex, (dailyMap.get(dayIndex) ?? 0) + minutes / 60);
    }

    const dailyHoursArray = dayLabels.map((day, i) => ({
      day,
      hours: Math.round((dailyMap.get(i) ?? 0) * 10) / 10,
    }));

    // Weekly goal: actual hours this week / 5 hours goal * 100
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
      weeklyHours: dailyHoursArray,
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
