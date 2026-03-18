// PUT /api/instructeur/marketing/pixels/[id] — Modifier un pixel
// DELETE /api/instructeur/marketing/pixels/[id] — Supprimer un pixel

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouvé" }, { status: 403 });
    }

    const existing = await prisma.marketingPixel.findFirst({
      where: { id, instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pixel non trouvé" }, { status: 404 });
    }

    const body = await req.json();
    const { pixelId, isActive } = body;

    const pixel = await prisma.marketingPixel.update({
      where: { id },
      data: {
        ...(pixelId !== undefined && { pixelId }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ pixel });
  } catch (error) {
    console.error("[PUT /api/instructeur/marketing/pixels/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouvé" }, { status: 403 });
    }

    const existing = await prisma.marketingPixel.findFirst({
      where: { id, instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pixel non trouvé" }, { status: 404 });
    }

    await prisma.marketingPixel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/instructeur/marketing/pixels/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
