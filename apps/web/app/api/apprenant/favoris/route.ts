// GET /api/apprenant/favoris — List user's favorite formations
// POST /api/apprenant/favoris — Add a formation to favorites
// DELETE /api/apprenant/favoris — Remove a formation from favorites

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    // Query UserFavorite table
    // NOTE: Requires a UserFavorite model in schema.prisma + migration
    const favorites = await (prisma as any).userFavorite.findMany({
      where: { userId },
      select: { formationId: true, addedAt: true },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("[GET /api/apprenant/favoris]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const formationId = body?.formationId;

    if (!formationId || typeof formationId !== "string") {
      return NextResponse.json({ error: "formationId requis" }, { status: 400 });
    }

    const userId = session.user.id;

    // Upsert into UserFavorite table
    // NOTE: Requires a UserFavorite model in schema.prisma + migration
    await (prisma as any).userFavorite.upsert({
      where: { userId_formationId: { userId, formationId } },
      create: { userId, formationId },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/apprenant/favoris]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formationId = searchParams.get("formationId");

    if (!formationId) {
      return NextResponse.json({ error: "formationId requis" }, { status: 400 });
    }

    const userId = session.user.id;

    // Delete from UserFavorite table
    // NOTE: Requires a UserFavorite model in schema.prisma + migration
    await (prisma as any).userFavorite.deleteMany({
      where: { userId, formationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/apprenant/favoris]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
