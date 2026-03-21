import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { transactionStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV) {
      const transactions = transactionStore.getByUser(session.user.id);

      return NextResponse.json({ transactions });
    } else {
      const userId = session.user.id;

      const dbPayments = await prisma.payment.findMany({
        where: {
          OR: [
            { payerId: userId },
            { payeeId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      // Map to same shape as dev-store StoredTransaction
      const transactions = dbPayments.map((p) => ({
        id: p.id,
        userId: p.payeeId === userId ? userId : p.payerId,
        type: p.type?.toLowerCase() || "vente",
        description: p.description || "",
        amount: p.amount,
        status: p.status?.toLowerCase() || "complete",
        date: p.createdAt.toISOString().slice(0, 10),
        orderId: p.orderId || undefined,
        method: p.method || undefined,
      }));

      return NextResponse.json({ transactions });
    }
  } catch (error) {
    console.error("[API /finances/transactions GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des transactions" },
      { status: 500 }
    );
  }
}
