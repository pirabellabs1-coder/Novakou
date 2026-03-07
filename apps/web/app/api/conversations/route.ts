import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { conversationStore } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const conversations = conversationStore.getByUser(session.user.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[API /conversations GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des conversations" },
      { status: 500 }
    );
  }
}
