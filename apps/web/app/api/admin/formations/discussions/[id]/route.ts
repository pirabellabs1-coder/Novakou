// PUT /api/admin/formations/discussions/[id] — Moderer une discussion (lock, delete, restore)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { logAuditAction, getRequestIp } from "@/lib/formations/audit";

const VALID_ACTIONS = ["lock", "delete", "restore"];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Action invalide. Valeurs acceptées : ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const discussion = await prisma.courseDiscussion.findUnique({ where: { id } });
    if (!discussion) {
      return NextResponse.json({ error: "Discussion non trouvée" }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      lock: "locked",
      delete: "deleted",
      restore: "active",
    };

    const newStatus = statusMap[action];

    const updated = await prisma.courseDiscussion.update({
      where: { id },
      data: { status: newStatus },
    });

    await logAuditAction({
      userId: session.user.id,
      action: `discussion_${action}`,
      targetType: "courseDiscussion",
      targetId: id,
      targetUserId: discussion.userId,
      metadata: {
        discussionTitle: discussion.title,
        previousStatus: discussion.status,
        newStatus,
        reportCount: discussion.reportCount,
      },
      ipAddress: getRequestIp(req),
    });

    return NextResponse.json({ discussion: updated });
  } catch (error) {
    console.error("[PUT /api/admin/formations/discussions/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
