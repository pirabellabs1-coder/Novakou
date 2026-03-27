import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { reviewStore } from "@/lib/dev/data-store";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const review = reviewStore.getById(id);
      if (!review) {
        return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
      }
      const updated = reviewStore.markHelpful(id);
      return NextResponse.json({ review: updated });
    }

    // Production: acknowledge (no dedicated field in Prisma schema yet)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /reviews/[id]/helpful POST]", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage de l'avis" },
      { status: 500 }
    );
  }
}
