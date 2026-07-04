import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";
import type { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/formations/vendeur/funnels/[id]/duplicate
 * Duplique un tunnel (étapes + blocs + thème) en brouillon « (copie) ».
 * Les stats repartent à zéro ; le slug est régénéré.
 */
export async function POST(_req: Request, { params }: Params) {
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

    const src = await prisma.salesFunnel.findFirst({
      where: { id, instructeurId: inst.id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
    if (!src) return NextResponse.json({ error: "Tunnel introuvable" }, { status: 404 });

    const slug = `${src.slug.replace(/-copie(-\d+)?$/, "").slice(0, 60)}-copie-${Date.now().toString(36)}`;

    const copy = await prisma.salesFunnel.create({
      data: {
        instructeurId: inst.id,
        shopId: src.shopId,
        name: `${src.name} (copie)`.slice(0, 120),
        slug,
        description: src.description,
        isActive: false,
        theme: (src.theme ?? undefined) as Prisma.InputJsonValue | undefined,
        salesLimit: src.salesLimit,
        steps: {
          create: src.steps.map((s) => ({
            stepOrder: s.stepOrder,
            stepType: s.stepType,
            title: s.title,
            formationId: s.formationId,
            productId: s.productId,
            discountPct: s.discountPct,
            headlineFr: s.headlineFr,
            headlineEn: s.headlineEn,
            descriptionFr: s.descriptionFr,
            descriptionEn: s.descriptionEn,
            ctaTextFr: s.ctaTextFr,
            ctaTextEn: s.ctaTextEn,
            blocks: (s.blocks ?? undefined) as Prisma.InputJsonValue | undefined,
          })),
        },
      },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({ data: copy });
  } catch (err) {
    console.error("[vendeur/funnels/duplicate POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
