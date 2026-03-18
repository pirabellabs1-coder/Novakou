// GET /api/instructeur/apprenants — Liste les apprenants de l'instructeur

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

    const apprenants = await prisma.enrollment.findMany({
      where: {
        formation: { instructeurId: instructeur.id },
      },
      include: {
        user: { select: { name: true, email: true, avatar: true, image: true } },
        formation: { select: { titleFr: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ apprenants });
  } catch (error) {
    console.error("[GET /api/instructeur/apprenants]", error);
    return NextResponse.json({ apprenants: [] });
  }
}
