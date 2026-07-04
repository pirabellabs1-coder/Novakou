import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/formations/vendeur/funnels/[id]/leads
 * Liste les leads (emails capturés) d'un tunnel appartenant au vendeur connecté.
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const inst = await getOrCreateInstructeur(userId);
    if (!inst) return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 401 });

    // Vérifie la propriété du tunnel avant d'exposer les leads.
    const funnel = await prisma.salesFunnel.findFirst({
      where: { id, instructeurId: inst.id },
      select: { id: true },
    });
    if (!funnel) return NextResponse.json({ error: "Tunnel introuvable" }, { status: 404 });

    const leads = await prisma.funnelLead.findMany({
      where: { funnelId: id },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, name: true, email: true, phone: true, data: true, createdAt: true },
    });
    return NextResponse.json({ data: leads });
  } catch (err) {
    console.error("[vendeur/funnels/leads GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
