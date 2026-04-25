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

    const existing = await prisma.discountCode.findFirst({ where: { id, instructeurId: pid } });
    if (!existing) return NextResponse.json({ error: "Code introuvable" }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.discountCode.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        maxUses: body.maxUses !== undefined ? (body.maxUses ? parseInt(body.maxUses) : null) : undefined,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[codes-promo PATCH]", err);
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

    const existing = await prisma.discountCode.findFirst({ where: { id, instructeurId: pid } });
    if (!existing) return NextResponse.json({ error: "Code introuvable" }, { status: 404 });

    await prisma.discountCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[codes-promo DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
