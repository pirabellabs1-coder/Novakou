import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { reviewStore } from "@/lib/dev/data-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reply } = body;

    if (!reply || reply.trim().length === 0) {
      return NextResponse.json(
        { error: "La reponse ne peut pas etre vide" },
        { status: 400 }
      );
    }

    const review = reviewStore.getById(id);
    if (!review) {
      return NextResponse.json(
        { error: "Avis introuvable" },
        { status: 404 }
      );
    }

    // Only the freelance who received the review can reply
    if (review.freelanceId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le freelance peut repondre a cet avis" },
        { status: 403 }
      );
    }

    // Cannot reply more than once
    if (review.reply) {
      return NextResponse.json(
        { error: "Vous avez deja repondu a cet avis" },
        { status: 409 }
      );
    }

    const updated = reviewStore.reply(id, reply.trim());

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error("[API /reviews/[id]/reply POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la reponse a l'avis" },
      { status: 500 }
    );
  }
}
