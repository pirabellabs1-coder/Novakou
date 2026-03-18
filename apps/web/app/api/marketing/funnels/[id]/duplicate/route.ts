// POST /api/marketing/funnels/[id]/duplicate — Dupliquer un funnel

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

// Access the dev store from the parent funnels route
// In dev mode, we import the mock data directly
async function getDevFunnels(): Promise<{ devFunnels: unknown[] } | null> {
  if (!DEV_MODE) return null;
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/marketing/funnels`);
    const data = await res.json();
    return { devFunnels: data.funnels || [] };
  } catch {
    return null;
  }
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (DEV_MODE) {
      const store = await getDevFunnels();
      if (!store) {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = (store.devFunnels as any[]).find((f) => f.id === id);
      if (!source) {
        return NextResponse.json({ error: "Funnel non trouvé" }, { status: 404 });
      }

      const newSlug = slugify(source.name + " copie") + "-" + Math.random().toString(36).substring(2, 8);
      const newId = `funnel_dup_${Date.now().toString(36)}`;

      const duplicate = {
        ...source,
        id: newId,
        name: `${source.name} (copie)`,
        slug: newSlug,
        isActive: false,
        totalViews: 0,
        totalClicks: 0,
        totalPurchases: 0,
        totalSkips: 0,
        totalRevenue: 0,
        conversionRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        steps: (source.steps || []).map((step: any, idx: number) => ({
          ...step,
          id: `step_${newId}_${idx + 1}`,
        })),
      };

      // POST the duplicate back to the main funnels route to add to devFunnels
      await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/marketing/funnels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: duplicate.name,
          description: duplicate.description,
          steps: duplicate.steps,
          isActive: false,
        }),
      });

      return NextResponse.json({ funnel: duplicate }, { status: 201 });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouvé" }, { status: 403 });
    }

    const source = await db.salesFunnel.findFirst({
      where: { id, instructeurId: instructeur.id },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!source) {
      return NextResponse.json({ error: "Funnel non trouvé" }, { status: 404 });
    }

    const newSlug = slugify(source.name + " copie") + "-" + Math.random().toString(36).substring(2, 8);

    const duplicate = await db.salesFunnel.create({
      data: {
        instructeurId: instructeur.id,
        name: `${source.name} (copie)`,
        slug: newSlug,
        description: source.description,
        isActive: false,
        steps: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: source.steps.map((step: any, idx: number) => ({
            type: step.type,
            title: step.title,
            headlineFr: step.headlineFr,
            headlineEn: step.headlineEn,
            descriptionFr: step.descriptionFr,
            descriptionEn: step.descriptionEn,
            ctaTextFr: step.ctaTextFr,
            ctaTextEn: step.ctaTextEn,
            linkedProductId: step.linkedProductId,
            discountPct: step.discountPct,
            order: idx,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ funnel: duplicate }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/funnels/[id]/duplicate]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
