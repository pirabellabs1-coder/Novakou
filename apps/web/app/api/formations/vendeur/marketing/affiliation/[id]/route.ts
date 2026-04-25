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

    const existing = await prisma.affiliateProgram.findFirst({ where: { id, instructeurId: pid } });
    if (!existing) return NextResponse.json({ error: "Programme introuvable" }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.affiliateProgram.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        commissionPct: body.commissionPct !== undefined ? parseFloat(body.commissionPct) : undefined,
        cookieDays: body.cookieDays !== undefined ? parseInt(body.cookieDays) : undefined,
        autoApprove: body.autoApprove !== undefined ? body.autoApprove : undefined,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[affiliation PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
