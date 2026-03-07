import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { transactionStore } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const summary = transactionStore.getSummary(session.user.id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[API /finances/summary GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du resume financier" },
      { status: 500 }
    );
  }
}
