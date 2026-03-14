import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { transactionStore, notificationStore } from "@/lib/dev/data-store";

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

    const tx = transactionStore.getAll().find((t) => t.id === id);

    if (!tx) {
      return NextResponse.json(
        { error: "Transaction introuvable" },
        { status: 404 }
      );
    }

    switch (action) {
      case "block": {
        const updated = transactionStore.update(id, { status: "bloque" });

        notificationStore.add({
          userId: tx.userId,
          title: "Transaction bloquee",
          message: `Votre transaction "${tx.description}" (${Math.abs(tx.amount)} EUR) a ete bloquee par l'administration.`,
          type: "payment",
          read: false,
          link: "/dashboard/finances",
        });

        return NextResponse.json({
          success: true,
          message: `Transaction ${id} bloquee`,
          transaction: updated,
        });
      }

      case "unblock": {
        const updated = transactionStore.update(id, { status: "en_attente" });

        notificationStore.add({
          userId: tx.userId,
          title: "Transaction debloquee",
          message: `Votre transaction "${tx.description}" a ete debloquee par l'administration.`,
          type: "payment",
          read: false,
          link: "/dashboard/finances",
        });

        return NextResponse.json({
          success: true,
          message: `Transaction ${id} debloquee`,
          transaction: updated,
        });
      }

      case "approve": {
        const updated = transactionStore.update(id, { status: "complete" });

        notificationStore.add({
          userId: tx.userId,
          title: "Transaction approuvee",
          message: `Votre transaction "${tx.description}" (${Math.abs(tx.amount)} EUR) a ete approuvee.`,
          type: "payment",
          read: false,
          link: "/dashboard/finances",
        });

        return NextResponse.json({
          success: true,
          message: `Transaction ${id} approuvee`,
          transaction: updated,
        });
      }

      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API /admin/finances/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'action admin sur la transaction" },
      { status: 500 }
    );
  }
}
