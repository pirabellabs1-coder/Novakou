import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

type Params = { params: Promise<{ id: string; stepId: string }> };

/**
 * DELETE /api/formations/vendeur/funnels/[id]/steps/[stepId]
 * Supprime une étape (au moins 1 étape doit rester), puis renumérote
 * les étapes restantes (stepOrder 1..n).
 */
export async function DELETE(_req: Request, { params }: Params) {
  const { id, stepId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const inst = await getOrCreateInstructeur(userId);
    if (!inst) return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 401 });

    const funnel = await prisma.salesFunnel.findFirst({
      where: { id, instructeurId: inst.id },
      select: { id: true, steps: { orderBy: { stepOrder: "asc" }, select: { id: true } } },
    });
    if (!funnel) return NextResponse.json({ error: "Tunnel introuvable" }, { status: 404 });
    if (!funnel.steps.some((s) => s.id === stepId)) {
      return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
    }
    if (funnel.steps.length <= 1) {
      return NextResponse.json({ error: "Impossible de supprimer la dernière étape du tunnel" }, { status: 400 });
    }

    const remaining = funnel.steps.filter((s) => s.id !== stepId);
    await prisma.$transaction([
      prisma.funnelStep.delete({ where: { id: stepId } }),
      ...remaining.map((s, i) =>
        prisma.funnelStep.update({ where: { id: s.id }, data: { stepOrder: i + 1 } })
      ),
    ]);

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[vendeur/funnels/steps DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
