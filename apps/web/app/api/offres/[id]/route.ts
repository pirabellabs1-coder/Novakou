import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { offreStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

export async function PATCH(
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

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const offre = offreStore.update(id, body);
      if (!offre) {
        return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
      }
      return NextResponse.json({ offre });
    }

    // Prisma: update offer (only if owned by user)
    const existing = await prisma.offer.findFirst({
      where: { id, freelanceId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        ...(body.title ? { title: body.title } : {}),
        ...(body.amount != null ? { amount: Number(body.amount) } : {}),
        ...(body.delay ? { delay: body.delay } : {}),
        ...(body.revisions != null ? { revisions: Number(body.revisions) } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.status ? { status: body.status.toUpperCase() } : {}),
      },
    });

    return NextResponse.json({
      offre: {
        id: updated.id,
        freelanceId: updated.freelanceId,
        client: updated.clientName,
        title: updated.title,
        amount: updated.amount,
        delay: updated.delay,
        revisions: updated.revisions,
        description: updated.description,
        status: updated.status.toLowerCase(),
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API /offres/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour de l'offre" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      const deleted = offreStore.delete(id);
      if (!deleted) {
        return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    // Prisma: delete offer (only if owned by user)
    const existing = await prisma.offer.findFirst({
      where: { id, freelanceId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    await prisma.offer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /offres/[id] DELETE]", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'offre" },
      { status: 500 }
    );
  }
}
