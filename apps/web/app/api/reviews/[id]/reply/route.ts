import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { reviewStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

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

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const review = reviewStore.getById(id);
      if (!review) {
        return NextResponse.json(
          { error: "Avis introuvable" },
          { status: 404 }
        );
      }

      if (review.freelanceId !== session.user.id) {
        return NextResponse.json(
          { error: "Seul le freelance peut repondre a cet avis" },
          { status: 403 }
        );
      }

      if (review.reply) {
        return NextResponse.json(
          { error: "Vous avez deja repondu a cet avis" },
          { status: 409 }
        );
      }

      const updated = reviewStore.reply(id, reply.trim());
      return NextResponse.json({ review: updated });
    }

    // Production: Prisma
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json(
        { error: "Avis introuvable" },
        { status: 404 }
      );
    }

    if (review.targetId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le freelance peut repondre a cet avis" },
        { status: 403 }
      );
    }

    if (review.response) {
      return NextResponse.json(
        { error: "Vous avez deja repondu a cet avis" },
        { status: 409 }
      );
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { response: reply.trim() },
      include: { author: true, service: true },
    });

    return NextResponse.json({
      review: {
        id: updated.id,
        orderId: updated.orderId,
        serviceId: updated.serviceId,
        clientId: updated.authorId,
        clientName: (updated as Record<string, unknown>).author
          ? ((updated as Record<string, unknown>).author as Record<string, unknown>).name || ""
          : "",
        freelanceId: updated.targetId,
        rating: updated.rating,
        qualite: updated.quality ?? 0,
        communication: updated.communication ?? 0,
        delai: updated.timeliness ?? 0,
        comment: updated.comment || "",
        reply: updated.response,
        repliedAt: updated.updatedAt.toISOString(),
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API /reviews/[id]/reply POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la reponse a l'avis" },
      { status: 500 }
    );
  }
}
