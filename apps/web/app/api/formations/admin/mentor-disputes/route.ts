import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/mentor-disputes?scope=open|history|all
 *   - open (default)  : disputes en attente de décision
 *   - history         : disputes déjà tranchées par l'admin (audit)
 *   - all             : les deux combinées (open d'abord)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || role !== "ADMIN") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") ?? "open";

    const commonInclude = {
      mentor: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      student: { select: { id: true, name: true, email: true, image: true } },
    } as const;

    // OPEN = waiting on admin decision
    const open =
      scope === "history"
        ? []
        : await prisma.mentorBooking.findMany({
            where: {
              status: { in: ["CANCELLATION_REQUESTED_STUDENT", "CANCELLATION_REQUESTED_MENTOR"] },
            },
            orderBy: { cancelRequestedAt: "desc" },
            include: commonInclude,
          });

    // HISTORY = bookings already decided by admin (adminDecisionAt not null)
    const history =
      scope === "open"
        ? []
        : await prisma.mentorBooking.findMany({
            where: {
              adminDecisionAt: { not: null },
              // exclude in-progress (shouldn't happen but safety)
              NOT: {
                status: { in: ["CANCELLATION_REQUESTED_STUDENT", "CANCELLATION_REQUESTED_MENTOR"] },
              },
            },
            orderBy: { adminDecisionAt: "desc" },
            take: 100,
            include: commonInclude,
          });

    // Attach admin resolver info (who decided) for history
    const adminIds = Array.from(
      new Set(history.map((h) => h.adminDecisionBy).filter((x): x is string => Boolean(x))),
    );
    const admins = adminIds.length
      ? await prisma.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const adminMap = new Map(admins.map((a) => [a.id, a]));

    const historyWithAdmin = history.map((h) => ({
      ...h,
      adminResolver: h.adminDecisionBy ? adminMap.get(h.adminDecisionBy) ?? null : null,
    }));

    return NextResponse.json({
      data: scope === "history" ? historyWithAdmin : scope === "all" ? { open, history: historyWithAdmin } : open,
      counts: { open: open.length, history: history.length },
    });
  } catch (err) {
    console.error("[admin/mentor-disputes GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
