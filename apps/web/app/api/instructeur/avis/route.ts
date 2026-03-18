// GET /api/instructeur/avis — Avis reçus par l'instructeur

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructeur || instructeur.status !== "APPROUVE") {
      return NextResponse.json({ error: "Profil instructeur non trouvé" }, { status: 403 });
    }

    const avis = await prisma.formationReview.findMany({
      where: {
        formation: { instructeurId: instructeur.id },
      },
      include: {
        user: { select: { name: true, avatar: true, image: true } },
        formation: { select: { id: true, titleFr: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ avis });
  } catch (error) {
    console.error("[GET /api/instructeur/avis]", error);
    return NextResponse.json({ avis: [] });
  }
}
