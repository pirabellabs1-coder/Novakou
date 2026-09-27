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

    // Mêmes bornes qu'à la création : la commission se paie en argent réel.
    let commission: number | undefined;
    if (body.commissionPct !== undefined) {
      commission = Number(body.commissionPct);
      if (!Number.isFinite(commission) || commission < 1 || commission > 80) {
        return NextResponse.json({ error: "La commission doit être entre 1 et 80 %" }, { status: 400 });
      }
    }
    let cookie: number | undefined;
    if (body.cookieDays !== undefined) {
      cookie = Number(body.cookieDays);
      if (!Number.isInteger(cookie) || cookie < 1 || cookie > 365) {
        return NextResponse.json({ error: "La durée du cookie doit être entre 1 et 365 jours" }, { status: 400 });
      }
    }

    const updated = await prisma.affiliateProgram.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        commissionPct: commission,
        cookieDays: cookie,
        autoApprove: body.autoApprove !== undefined ? body.autoApprove : undefined,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[affiliation PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
