// GET /api/apprenant/discussions — Mes discussions avec stats non-lus

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get discussions where the user is the author
    const ownDiscussions = await prisma.courseDiscussion.findMany({
      where: {
        userId,
        status: { not: "deleted" },
      },
      include: {
        formation: {
          select: { id: true, titleFr: true, titleEn: true, slug: true },
        },
        replies: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
          },
          where: { status: "active" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get discussions where the user has replied (but is not the author)
    const repliedDiscussionIds = await prisma.courseDiscussionReply.findMany({
      where: {
        userId,
        status: "active",
        discussion: {
          status: { not: "deleted" },
          userId: { not: userId },
        },
      },
      select: { discussionId: true },
      distinct: ["discussionId"],
    });

    const repliedDiscussions = repliedDiscussionIds.length > 0
      ? await prisma.courseDiscussion.findMany({
          where: {
            id: { in: repliedDiscussionIds.map((r) => r.discussionId) },
            status: { not: "deleted" },
          },
          include: {
            formation: {
              select: { id: true, titleFr: true, titleEn: true, slug: true },
            },
            replies: {
              select: {
                id: true,
                userId: true,
                createdAt: true,
              },
              where: { status: "active" },
            },
          },
          orderBy: { updatedAt: "desc" },
        })
      : [];

    // Merge and deduplicate
    const allDiscussionsMap = new Map<string, typeof ownDiscussions[0]>();
    for (const d of ownDiscussions) {
      allDiscussionsMap.set(d.id, d);
    }
    for (const d of repliedDiscussions) {
      if (!allDiscussionsMap.has(d.id)) {
        allDiscussionsMap.set(d.id, d);
      }
    }

    let totalUnread = 0;

    const discussions = Array.from(allDiscussionsMap.values()).map((d) => {
      const isAuthor = d.userId === userId;
      const repliesCount = d.replies.length;

      // Approximate unread: replies created after the user's last reply in that discussion
      const userReplies = d.replies
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // If the user is the author and never replied, use discussion creation date as baseline
      const lastUserActivity = userReplies.length > 0
        ? userReplies[0].createdAt
        : isAuthor
          ? d.createdAt
          : new Date(0);

      const unreadCount = d.replies.filter(
        (r) => r.userId !== userId && r.createdAt > lastUserActivity
      ).length;

      totalUnread += unreadCount;

      // Last activity = most recent reply or discussion creation
      const lastReply = d.replies.length > 0
        ? d.replies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;
      const lastActivityAt = lastReply ? lastReply.createdAt : d.createdAt;

      return {
        id: d.id,
        title: d.title,
        formationId: d.formation.id,
        formationTitle: d.formation.titleFr,
        formationSlug: d.formation.slug,
        repliesCount,
        unreadCount,
        lastActivityAt,
        status: d.status,
        isAuthor,
      };
    });

    // Sort by last activity descending
    discussions.sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime()
    );

    return NextResponse.json({ discussions, totalUnread });
  } catch (error) {
    console.error("[GET /api/apprenant/discussions]", error);
    return NextResponse.json({ discussions: [], totalUnread: 0 });
  }
}
