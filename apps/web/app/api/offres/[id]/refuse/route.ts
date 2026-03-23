import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { offreStore } from "@/lib/dev/data-store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: offreId } = await params;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      offreStore.updateStatus(offreId, "refusee");
      return NextResponse.json({ ok: true });
    }

    // Prisma
    const offre = await prisma.offer.findUnique({
      where: { id: offreId },
    });

    if (!offre) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    if (offre.clientId !== session.user.id && offre.clientEmail !== session.user.email) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    await prisma.offer.update({
      where: { id: offreId },
      data: { status: "REFUSE" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /offres/[id]/refuse POST]", error);
    return NextResponse.json(
      { error: "Erreur lors du refus de l'offre" },
      { status: 500 }
    );
  }
}
