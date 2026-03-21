import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { transactionStore, notificationStore } from "@/lib/dev/data-store";
import { createAuditLog } from "@/lib/admin/audit";

// PATCH /api/admin/finances/[id] — Block/unblock/approve a transaction
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (IS_DEV) {
      const tx = transactionStore.getAll().find((t) => t.id === id);
      if (!tx) {
        return NextResponse.json(
          { error: "Transaction introuvable" },
          { status: 404 }
        );
      }

      const statusMap: Record<string, string> = {
        block: "bloque",
        unblock: "en_attente",
        approve: "complete",
      };
      const titleMap: Record<string, string> = {
        block: "Transaction bloquee",
        unblock: "Transaction debloquee",
        approve: "Transaction approuvee",
      };

      if (!statusMap[action]) {
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 }
        );
      }

      const updated = transactionStore.update(id, { status: statusMap[action] as "complete" | "en_attente" | "echoue" | "bloque" });

      notificationStore.add({
        userId: tx.userId,
        title: titleMap[action],
        message: `Votre transaction "${tx.description}" (${Math.abs(tx.amount)} EUR) a ete ${statusMap[action] === "complete" ? "approuvee" : statusMap[action] === "bloque" ? "bloquee" : "debloquee"}.`,
        type: "payment",
        read: false,
        link: "/dashboard/finances",
      });

      return NextResponse.json({
        success: true,
        message: `Transaction ${id} ${action === "block" ? "bloquee" : action === "approve" ? "approuvee" : "debloquee"}`,
        transaction: updated,
      });
    }

    // ── Production: Prisma ──
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json(
        { error: "Transaction introuvable" },
        { status: 404 }
      );
    }

    const prismaStatusMap: Record<string, string> = {
      block: "ECHOUE", // Use ECHOUE as "blocked" since no BLOQUE enum
      unblock: "EN_ATTENTE",
      approve: "COMPLETE",
    };

    if (!prismaStatusMap[action]) {
      return NextResponse.json(
        { error: `Action inconnue: ${action}` },
        { status: 400 }
      );
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: { status: prismaStatusMap[action] as "ECHOUE" | "EN_ATTENTE" | "COMPLETE" },
    });

    // Create notification for the payer
    await prisma.notification.create({
      data: {
        userId: payment.payerId,
        title: action === "block" ? "Transaction bloquee" : action === "approve" ? "Transaction approuvee" : "Transaction debloquee",
        message: `Votre transaction de ${Math.abs(payment.amount)} ${payment.currency} a ete ${action === "block" ? "bloquee" : action === "approve" ? "approuvee" : "debloquee"} par l'administration.`,
        type: "PAYMENT",
        link: "/dashboard/finances",
      },
    });

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: `transaction.${action}`,
      targetType: "payment",
      targetId: id,
      targetUserId: payment.payerId,
      details: { amount: payment.amount, previousStatus: payment.status },
    });

    return NextResponse.json({
      success: true,
      message: `Transaction ${id} ${action === "block" ? "bloquee" : action === "approve" ? "approuvee" : "debloquee"}`,
      transaction: updated,
    });
  } catch (error) {
    console.error("[API /admin/finances/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'action admin sur la transaction" },
      { status: 500 }
    );
  }
}
