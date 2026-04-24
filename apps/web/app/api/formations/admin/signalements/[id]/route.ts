import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * PATCH /api/formations/admin/signalements/[id]
 *
 * Admin traite un signalement de contenu (discussion ou réponse).
 *
 * Body: { action: "delete_content" | "dismiss" }
 * - delete_content : marque le contenu signalé (discussion ou reply) comme "deleted"
 *                    + supprime tous les signalements associés à ce contenu
 * - dismiss        : supprime uniquement ce signalement (ignore) sans toucher au contenu
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (session?.user?.role && session.user.role !== "ADMIN" && !IS_DEV) {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action: string = body.action;

    const report = await prisma.discussionReport.findUnique({
      where: { id },
      select: { id: true, discussionId: true, replyId: true },
    });
    if (!report) {
      return NextResponse.json({ error: "Signalement introuvable" }, { status: 404 });
    }

    if (action === "dismiss") {
      await prisma.discussionReport.delete({ where: { id } });
      return NextResponse.json({ data: { dismissed: true } });
    }

    if (action === "delete_content") {
      // Soft-delete le contenu + supprime tous les signalements pour ce contenu
      if (report.replyId) {
        await prisma.$transaction([
          prisma.courseDiscussionReply.update({
            where: { id: report.replyId },
            data: { status: "deleted" },
          }),
          prisma.discussionReport.deleteMany({ where: { replyId: report.replyId } }),
        ]);
      } else if (report.discussionId) {
        await prisma.$transaction([
          prisma.courseDiscussion.update({
            where: { id: report.discussionId },
            data: { status: "deleted" },
          }),
          prisma.discussionReport.deleteMany({ where: { discussionId: report.discussionId } }),
        ]);
      } else {
        return NextResponse.json({ error: "Signalement sans cible" }, { status: 400 });
      }
      return NextResponse.json({ data: { deleted: true } });
    }

    return NextResponse.json({ error: "Action invalide (delete_content | dismiss)" }, { status: 400 });
  } catch (err) {
    console.error("[admin/signalements PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
