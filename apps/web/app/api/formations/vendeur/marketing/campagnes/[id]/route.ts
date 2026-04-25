import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

import { getInstructeurId as _gii } from "@/lib/formations/instructeur";
async function getProfileId(userId: string) { return _gii(userId); }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const pid = await getProfileId(userId);
    if (!pid) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    const existing = await prisma.campaignTracker.findFirst({ where: { id, instructeurId: pid } });
    if (!existing) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.campaignTracker.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        name: body.name?.trim() || undefined,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[campagnes PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const pid = await getProfileId(userId);
    if (!pid) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    const existing = await prisma.campaignTracker.findFirst({ where: { id, instructeurId: pid } });
    if (!existing) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });

    await prisma.campaignTracker.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[campagnes DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
