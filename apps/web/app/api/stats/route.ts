import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { calculateStats } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const stats = calculateStats(session.user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API /stats GET]", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul des statistiques" },
      { status: 500 }
    );
  }
}
