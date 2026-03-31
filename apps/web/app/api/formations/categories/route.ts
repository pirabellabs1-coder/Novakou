// GET /api/formations/categories — Liste des catégories formations

import { NextResponse } from "next/server";
import prisma from "@freelancehigh/db";

export async function GET() {
  try {
    const categories = await prisma.formationCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { formations: { where: { status: "ACTIF" } } } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[GET /api/formations/categories]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
