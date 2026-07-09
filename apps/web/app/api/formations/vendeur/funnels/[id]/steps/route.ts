import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";
import type { FunnelStepType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = new Set(["LANDING", "CAPTURE", "PRODUCT", "UPSELL", "THANK_YOU"]);
const MAX_STEPS = 15;

/**
 * POST /api/formations/vendeur/funnels/[id]/steps
 * Ajoute une étape au tunnel. Body: { title, stepType }.
 * L'étape est créée VIDE (blocks: []) en dernière position.
 */
export async function POST(request: Request, { params }: Params) {
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

    const funnel = await prisma.salesFunnel.findFirst({
      where: { id, instructeurId: inst.id },
      select: { id: true, _count: { select: { steps: true } } },
    });
    if (!funnel) return NextResponse.json({ error: "Tunnel introuvable" }, { status: 404 });
    if (funnel._count.steps >= MAX_STEPS) {
      return NextResponse.json({ error: `Maximum ${MAX_STEPS} étapes par tunnel` }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "").trim().slice(0, 80) || "Nouvelle étape";
    const stepType = ALLOWED_TYPES.has(String(body.stepType)) ? (String(body.stepType) as FunnelStepType) : ("LANDING" as FunnelStepType);

    const maxOrder = await prisma.funnelStep.aggregate({
      where: { funnelId: id },
      _max: { stepOrder: true },
    });

    const step = await prisma.funnelStep.create({
      data: {
        funnelId: id,
        stepOrder: (maxOrder._max.stepOrder ?? 0) + 1,
        stepType,
        title,
        blocks: [],
      },
    });

    return NextResponse.json({ data: step }, { status: 201 });
  } catch (err) {
    console.error("[vendeur/funnels/steps POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
