import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

import { getInstructeurId as _gii } from "@/lib/formations/instructeur";
async function getProfileId(userId: string) { return _gii(userId); }

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const pid = await getProfileId(userId);
    if (!pid) return NextResponse.json({ data: { programs: [], stats: { totalAffiliates: 0, activeAffiliates: 0, totalClicks: 0, totalConversions: 0, totalEarned: 0, pendingEarnings: 0 } } });

    const programs = await prisma.affiliateProgram.findMany({
      where: { instructeurId: pid },
      include: {
        affiliates: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { totalEarned: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const allAffiliates = programs.flatMap((p) => p.affiliates);
    const stats = {
      totalAffiliates: allAffiliates.length,
      activeAffiliates: allAffiliates.filter((a) => a.status === "ACTIVE").length,
      totalClicks: allAffiliates.reduce((s, a) => s + a.totalClicks, 0),
      totalConversions: allAffiliates.reduce((s, a) => s + a.totalConversions, 0),
      totalEarned: allAffiliates.reduce((s, a) => s + a.totalEarned, 0),
      pendingEarnings: allAffiliates.reduce((s, a) => s + a.pendingEarnings, 0),
    };

    return NextResponse.json({ data: { programs, stats } });
  } catch (err) {
    console.error("[affiliation GET]", err);
    return NextResponse.json({ data: null });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." }, { status: 401 });
    const pid = _ctx.instructeurId;

    const body = await request.json();
    const { name, description, commissionPct, cookieDays, minPayoutAmount, autoApprove } = body;

    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

    const existing = await prisma.affiliateProgram.findFirst({ where: { instructeurId: pid } });
    if (existing) return NextResponse.json({ error: "Vous avez déjà un programme actif" }, { status: 409 });

    const program = await prisma.affiliateProgram.create({
      data: {
        instructeurId: pid,
        name: name.trim(),
        description: description?.trim() || null,
        commissionPct: parseFloat(commissionPct) || 20,
        cookieDays: parseInt(cookieDays) || 30,
        minPayoutAmount: parseFloat(minPayoutAmount) || 13120,
        autoApprove: autoApprove ?? true,
        isActive: true,
        applyToAll: true,
      },
    });

    return NextResponse.json({ data: program });
  } catch (err) {
    console.error("[affiliation POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
