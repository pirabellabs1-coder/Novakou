import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { projectStore } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const projects = projectStore.getOpen();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[API /projects GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des projets" },
      { status: 500 }
    );
  }
}
