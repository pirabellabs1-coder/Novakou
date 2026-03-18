// PUT /api/admin/formations/refunds/[id] — Traiter une demande de remboursement (approve/reject)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { logAuditAction, getRequestIp } from "@/lib/formations/audit";

const VALID_ACTIONS = ["approve", "reject"];

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
    const { action, note } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Action invalide. Valeurs acceptées : ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const refund = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        enrollment: {
          select: { id: true, formationId: true, userId: true },
        },
      },
    });

    if (!refund) {
      return NextResponse.json({ error: "Demande de remboursement non trouvée" }, { status: 404 });
    }

    if (refund.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette demande a déjà été traitée" },
        { status: 400 }
      );
    }

    const now = new Date();
    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    // Update refund request
    const updated = await prisma.refundRequest.update({
      where: { id },
      data: {
        status: newStatus,
        adminNote: note ?? null,
        resolvedAt: now,
        resolvedBy: session.user.id,
      },
    });

    // If approved, update the enrollment
    if (action === "approve" && refund.enrollment) {
      await prisma.enrollment.update({
        where: { id: refund.enrollment.id },
        data: {
          refundRequested: true,
          refundedAt: now,
        },
      });
    }

    await logAuditAction({
      userId: session.user.id,
      action: `refund_${action}d`,
      targetType: "refundRequest",
      targetId: id,
      targetUserId: refund.userId,
      metadata: {
        amount: refund.amount,
        reason: refund.reason,
        adminNote: note ?? null,
        enrollmentId: refund.enrollmentId,
      },
      ipAddress: getRequestIp(req),
    });

    return NextResponse.json({ refund: updated });
  } catch (error) {
    console.error("[PUT /api/admin/formations/refunds/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
