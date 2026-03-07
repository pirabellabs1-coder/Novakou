import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { transactionStore, notificationStore } from "@/lib/dev/data-store";

const VALID_METHODS = ["SEPA", "PayPal", "Wave", "Orange Money", "MTN Mobile Money"];
const MINIMUM_WITHDRAWAL = 20;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, method, details } = body;

    // Validate amount
    if (typeof amount !== "number" || amount < MINIMUM_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Le montant minimum de retrait est de ${MINIMUM_WITHDRAWAL} EUR` },
        { status: 400 }
      );
    }

    // Validate method
    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json(
        { error: `Methode de retrait invalide. Methodes acceptees : ${VALID_METHODS.join(", ")}` },
        { status: 400 }
      );
    }

    // Check available balance
    const summary = transactionStore.getSummary(session.user.id);
    if (amount > summary.available) {
      return NextResponse.json(
        { error: "Solde insuffisant pour ce retrait" },
        { status: 400 }
      );
    }

    // Create the withdrawal transaction
    const transaction = transactionStore.add({
      userId: session.user.id,
      type: "retrait",
      description: `Retrait vers ${method}${details ? ` - ${details}` : ""}`,
      amount: -amount,
      status: "en_attente",
      date: new Date().toISOString().slice(0, 10),
      method,
    });

    // Create notification
    notificationStore.add({
      userId: session.user.id,
      title: "Demande de retrait",
      message: `Votre demande de retrait de ${amount.toFixed(2)} EUR vers ${method} est en cours de traitement`,
      type: "payment",
      read: false,
      link: "/dashboard/finances",
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("[API /finances/withdrawal POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la demande de retrait" },
      { status: 500 }
    );
  }
}
