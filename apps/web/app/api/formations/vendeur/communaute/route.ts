import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

/**
 * POST /api/formations/vendeur/communaute
 *   Body: { discussionId: string, action: "pin" | "unpin" | "delete" | "report", reason? }
 *
 *   Modération vendeur sur ses propres formations (CourseDiscussion).
 *   - pin/unpin   : toggle isPinned
 *   - delete      : soft-delete (status="deleted") + purge des reports associés
 *   - report      : crée un DiscussionReport (le vendeur signale un post problématique
 *                   qui sera visible côté admin)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const profile = await getOrCreateInstructeur(ctx.userId);
    if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      discussionId?: string;
      action?: string;
      reason?: string;
    };
    const { discussionId, action } = body;

    if (!discussionId || !action) {
      return NextResponse.json({ error: "discussionId et action requis" }, { status: 400 });
    }

    // Vérifie que la discussion appartient bien à une formation du vendeur
    const discussion = await prisma.courseDiscussion.findFirst({
      where: {
        id: discussionId,
        formation: { instructeurId: profile.id },
      },
      select: { id: true, isPinned: true, status: true },
    });
    if (!discussion) {
      return NextResponse.json({ error: "Discussion introuvable ou non autorisée" }, { status: 404 });
    }

    if (action === "pin" || action === "unpin") {
      await prisma.courseDiscussion.update({
        where: { id: discussionId },
        data: { isPinned: action === "pin" },
      });
      return NextResponse.json({ data: { ok: true, isPinned: action === "pin" } });
    }

    if (action === "delete") {
      await prisma.$transaction([
        prisma.courseDiscussion.update({
          where: { id: discussionId },
          data: { status: "deleted" },
        }),
        prisma.discussionReport.deleteMany({ where: { discussionId } }),
      ]);
      return NextResponse.json({ data: { ok: true, deleted: true } });
    }

    if (action === "report") {
      const reason = (body.reason ?? "inappropriate").slice(0, 100);
      // findFirst + create plutôt que upsert : discussionId est nullable côté
      // schema (DiscussionReport peut cibler une reply), donc la compound key
      // userId_discussionId n'est pas exposée comme unique selector.
      const existing = await prisma.discussionReport.findFirst({
        where: { userId: ctx.userId, discussionId },
        select: { id: true },
      });
      if (!existing) {
        await prisma.$transaction([
          prisma.discussionReport.create({
            data: { userId: ctx.userId, discussionId, reason },
          }),
          prisma.courseDiscussion.update({
            where: { id: discussionId },
            data: { reportCount: { increment: 1 } },
          }),
        ]);
      }
      return NextResponse.json({ data: { ok: true, reported: true } });
    }

    return NextResponse.json({ error: "Action invalide (pin | unpin | delete | report)" }, { status: 400 });
  } catch (err) {
    console.error("[vendeur/communaute POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ data: null });
    const userId = ctx.userId;

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
