import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { candidatureStore } from "@/lib/dev/data-store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: candidatureId } = await params;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      candidatureStore.updateStatus(candidatureId, "refusee");
      return NextResponse.json({ ok: true });
    }

    // Prisma
    const bid = await prisma.projectBid.findUnique({
      where: { id: candidatureId },
      include: { project: { select: { clientId: true } } },
    });

    if (!bid) {
      return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
    }

    if (bid.project.clientId !== session.user.id) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    await prisma.projectBid.update({
      where: { id: candidatureId },
      data: { status: "refusee" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /candidatures/[id]/refuse POST]", error);
    return NextResponse.json(
      { error: "Erreur lors du refus de la candidature" },
      { status: 500 }
    );
  }
}
