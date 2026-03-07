import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { profileStore } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const profile = profileStore.get(session.user.id);

    if (!profile) {
      return NextResponse.json(
        { error: "Profil introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[API /profile GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du profil" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const updates = await request.json();

    // Remove fields that should not be updated directly
    delete updates.userId;
    delete updates.completionPercent;
    delete updates.badges;

    const profile = profileStore.update(session.user.id, updates);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[API /profile PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour du profil" },
      { status: 500 }
    );
  }
}
