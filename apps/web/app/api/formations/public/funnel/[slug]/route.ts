import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/formations/public/funnel/[slug]
 * Returns the live (public) funnel.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const funnel = await prisma.salesFunnel.findUnique({
      where: { slug },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        instructeur: {
          select: {
            id: true,
            user: { select: { id: true, name: true, image: true } },
            marketingPixels: {
              where: { isActive: true },
              select: { type: true, pixelId: true },
            },
          },
        },
      },
    });

    if (!funnel || !funnel.isActive) {
      return NextResponse.json({ error: "Funnel introuvable ou inactif" }, { status: 404 });
    }

    // Increment view counter (fire-and-forget)
    prisma.salesFunnel
      .update({
        where: { id: funnel.id },
        data: { totalViews: { increment: 1 } },
      })
      .catch(() => null);

    // Track funnel event
    prisma.funnelEvent
      .create({
        data: {
          funnelId: funnel.id,
          stepId: funnel.steps[0]?.id ?? null,
          eventType: "view",
        },
      })
      .catch(() => null);

    return NextResponse.json({ data: funnel });
  } catch (err) {
    console.error("[public/funnel/[slug] GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
