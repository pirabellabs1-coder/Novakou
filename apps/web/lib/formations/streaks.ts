/**
 * Learner streaks & badges engine.
 *
 * Called after any lesson/video progress update. Updates the LearnerStreak
 * row, then unlocks LearnerBadges when their conditions are met.
 *
 * Streak rule : consecutive days with at least 1 activity. If the last
 * activity was yesterday → streak++; if today → no-op; else reset to 1.
 *
 * Never throws — logs and returns.
 */

import { prisma } from "@/lib/prisma";

interface BadgeSpec {
  code: string;
  title: string;
  description: string;
  icon: string;
  check: (ctx: BadgeCtx) => boolean;
}

interface BadgeCtx {
  currentStreak: number;
  longestStreak: number;
  totalMinutes: number;
  lessonsCompleted: number;
  formationsCompleted: number;
  firstActivity: boolean;
}

const BADGES: BadgeSpec[] = [
  {
    code: "FIRST_LESSON",
    title: "Premier pas",
    description: "Vous avez complété votre première leçon !",
    icon: "rocket_launch",
    check: (c) => c.lessonsCompleted >= 1,
  },
  {
    code: "WEEK_STREAK",
    title: "Semaine parfaite",
    description: "7 jours consécutifs d'étude.",
    icon: "local_fire_department",
    check: (c) => c.currentStreak >= 7,
  },
  {
    code: "MONTH_STREAK",
    title: "Mois de fer",
    description: "30 jours consécutifs — respect.",
    icon: "whatshot",
    check: (c) => c.currentStreak >= 30,
  },
  {
    code: "10_LESSONS",
    title: "10 leçons",
    description: "10 leçons terminées.",
    icon: "task_alt",
    check: (c) => c.lessonsCompleted >= 10,
  },
  {
    code: "50_LESSONS",
    title: "50 leçons",
    description: "50 leçons terminées.",
    icon: "workspace_premium",
    check: (c) => c.lessonsCompleted >= 50,
  },
  {
    code: "FIRST_FORMATION",
    title: "Première formation",
    description: "Vous avez terminé votre première formation !",
    icon: "school",
    check: (c) => c.formationsCompleted >= 1,
  },
  {
    code: "MARATHON_10H",
    title: "Marathon",
    description: "10 heures cumulées d'étude.",
    icon: "timer",
    check: (c) => c.totalMinutes >= 600,
  },
  {
    code: "MARATHON_50H",
    title: "Discipline totale",
    description: "50 heures cumulées d'étude.",
    icon: "military_tech",
    check: (c) => c.totalMinutes >= 3000,
  },
];

function daysBetween(a: Date, b: Date): number {
  const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((bDay - aDay) / (24 * 3600 * 1000));
}

export async function recordActivity(userId: string, minutes: number = 1) {
  try {
    const now = new Date();
    const existing = await prisma.learnerStreak.findUnique({ where: { userId } });
    let currentStreak = 1;
    let longestStreak = 1;
    let totalMinutes = minutes;

    if (existing) {
      totalMinutes = existing.totalMinutes + minutes;
      if (!existing.lastActivityAt) {
        currentStreak = 1;
      } else {
        const delta = daysBetween(new Date(existing.lastActivityAt), now);
        if (delta === 0) currentStreak = existing.currentStreak; // same day → no bump
        else if (delta === 1) currentStreak = existing.currentStreak + 1;
        else currentStreak = 1; // streak broken
      }
      longestStreak = Math.max(existing.longestStreak, currentStreak);
    }

    await prisma.learnerStreak.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak,
        longestStreak,
        totalMinutes,
        lastActivityAt: now,
      },
      update: {
        currentStreak,
        longestStreak,
        totalMinutes,
        lastActivityAt: now,
      },
    });

    await evaluateAndUnlockBadges(userId, { currentStreak, longestStreak, totalMinutes });
  } catch (err) {
    console.error("[streaks] recordActivity failed:", err);
  }
}

async function evaluateAndUnlockBadges(
  userId: string,
  streak: { currentStreak: number; longestStreak: number; totalMinutes: number },
) {
  try {
    // Build the context for badge checks (reusing existing enrollment data)
    const [lessonsCompleted, formationsCompleted, already] = await Promise.all([
      prisma.lessonProgress
        .count({ where: { userId, completedAt: { not: null } } })
        .catch(() => 0),
      prisma.enrollment.count({ where: { userId, completedAt: { not: null } } }),
      prisma.learnerBadge.findMany({
        where: { userId },
        select: { code: true },
      }),
    ]);
    const unlockedCodes = new Set(already.map((b) => b.code));

    const ctx: BadgeCtx = {
      ...streak,
      lessonsCompleted,
      formationsCompleted,
      firstActivity: true,
    };

    for (const b of BADGES) {
      if (unlockedCodes.has(b.code)) continue;
      if (!b.check(ctx)) continue;
      await prisma.learnerBadge
        .create({
          data: {
            userId,
            code: b.code,
            title: b.title,
            description: b.description,
            icon: b.icon,
          },
        })
        .catch(() => null);
    }
  } catch (err) {
    console.error("[streaks] badge eval failed:", err);
  }
}

export { BADGES };
