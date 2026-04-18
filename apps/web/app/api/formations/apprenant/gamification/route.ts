/**
 * GET /api/formations/apprenant/gamification
 * Returns { streak, badges[] } for the current user.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { BADGES } from "@/lib/formations/streaks";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const userId = session.user.id;

  const [streak, unlocked] = await Promise.all([
    prisma.learnerStreak.findUnique({ where: { userId } }),
    prisma.learnerBadge.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
    }),
  ]);

  const unlockedCodes = new Set(unlocked.map((b) => b.code));
  const locked = BADGES.filter((b) => !unlockedCodes.has(b.code)).map((b) => ({
    code: b.code,
    title: b.title,
    description: b.description,
    icon: b.icon,
    locked: true as const,
  }));

  return NextResponse.json({
    data: {
      streak: streak ?? {
        currentStreak: 0,
        longestStreak: 0,
        totalMinutes: 0,
        lastActivityAt: null,
      },
      badges: {
        unlocked: unlocked.map((b) => ({ ...b, locked: false })),
        locked,
      },
    },
  });
}
