import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await getOrCreateInstructeur(userId);
    if (!profile) {
      return NextResponse.json({ data: { posts: [], stats: { totalMembers: 0, postsThisMonth: 0, engagement: 0 } } });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const formations = await prisma.formation.findMany({
      where: { instructeurId: profile.id },
      select: { id: true },
    });
    const formationIds = formations.map((f) => f.id);

    const [discussions, repliesCount, enrollmentsCount] = await Promise.all([
      prisma.courseDiscussion.findMany({
        where: { formationId: { in: formationIds } },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 50,
        select: {
          id: true, title: true, content: true, isPinned: true, isResolved: true,
          status: true, reportCount: true, createdAt: true,
          user: { select: { name: true, email: true, image: true } },
          formation: { select: { title: true, id: true } },
          _count: { select: { replies: true } },
        },
      }),
      prisma.courseDiscussionReply.count({
        where: { discussion: { formationId: { in: formationIds } } },
      }),
      prisma.enrollment.count({ where: { formationId: { in: formationIds } } }),
    ]);

    const postsThisMonth = discussions.filter((d) => d.createdAt >= startOfMonth).length;
    const engagement = enrollmentsCount > 0
      ? Math.round(((discussions.length + repliesCount) / enrollmentsCount) * 100) / 10
      : 0;

    return NextResponse.json({
      data: {
        posts: discussions,
        stats: {
          totalMembers: enrollmentsCount,
          postsThisMonth,
          totalPosts: discussions.length,
          engagement,
        },
      },
    });
  } catch (err) {
    console.error("[vendeur/communaute]", err);
    return NextResponse.json({ data: { posts: [], stats: null } });
  }
}
