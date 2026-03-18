// GET /api/marketing/funnels — List funnels for authenticated instructor with stats
// POST /api/marketing/funnels — Create a new sales funnel
// PUT /api/marketing/funnels — Update funnel (toggle active, update steps)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// -- Types ------------------------------------------------------------------

type FunnelStepType =
  | "LANDING"
  | "PRODUCT"
  | "CHECKOUT"
  | "UPSELL"
  | "DOWNSELL"
  | "CONFIRMATION"
  | "THANK_YOU";

interface FunnelStep {
  id: string;
  type: FunnelStepType;
  title: string;
  headlineFr: string;
  headlineEn: string;
  descriptionFr: string;
  descriptionEn: string;
  ctaTextFr: string;
  ctaTextEn: string;
  linkedProductId: string | null;
  linkedProductTitle: string | null;
  linkedProductPrice: number | null;
  discountPct: number | null;
  order: number;
}

interface MockFunnel {
  id: string;
  instructeurId: string;
  name: string;
  slug: string;
  description: string;
  steps: FunnelStep[];
  isActive: boolean;
  totalViews: number;
  totalClicks: number;
  totalPurchases: number;
  totalSkips: number;
  totalRevenue: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

// -- Mock data ---------------------------------------------------------------

const MOCK_FUNNELS: MockFunnel[] = [];

let devFunnels = [...MOCK_FUNNELS];

// -- Helper: generate slug ---------------------------------------------------

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// -- GET ---------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (DEV_MODE) {
      // Public access by slug (for funnel renderer)
      if (slug) {
        const funnel = devFunnels.find((f) => f.slug === slug && f.isActive);
        if (!funnel) {
          return NextResponse.json({ error: "Funnel non trouvé" }, { status: 404 });
        }
        return NextResponse.json({ funnel });
      }

      // Instructor list view
      const stats = {
        totalFunnels: devFunnels.length,
        activeFunnels: devFunnels.filter((f) => f.isActive).length,
        totalViews: devFunnels.reduce((sum, f) => sum + f.totalViews, 0),
        totalConversions: devFunnels.reduce((sum, f) => sum + f.totalPurchases, 0),
        totalRevenue: devFunnels.reduce((sum, f) => sum + f.totalRevenue, 0),
      };

      return NextResponse.json({ funnels: devFunnels, stats });
    }

    // Production
    const session = await getServerSession(authOptions);
    const prisma = (await import("@freelancehigh/db")).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any;

    // Public slug lookup
    if (slug) {
      const funnel = await db.salesFunnel.findFirst({
        where: { slug, isActive: true },
        include: { steps: { orderBy: { order: "asc" } } },
      });
      if (!funnel) {
        return NextResponse.json({ error: "Funnel non trouvé" }, { status: 404 });
      }
      return NextResponse.json({ funnel });
    }

    // Instructor view
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouvé" }, { status: 403 });
    }

    const funnels = await db.salesFunnel.findMany({
      where: { instructeurId: instructeur.id },
      include: {
        steps: { orderBy: { order: "asc" } },
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      totalFunnels: funnels.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeFunnels: funnels.filter((f: any) => f.isActive).length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalViews: funnels.reduce((sum: number, f: any) => sum + f.totalViews, 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalConversions: funnels.reduce((sum: number, f: any) => sum + f.totalPurchases, 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalRevenue: funnels.reduce((sum: number, f: any) => sum + f.totalRevenue, 0),
    };

    return NextResponse.json({ funnels, stats });
  } catch (error) {
    console.error("[GET /api/marketing/funnels]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// -- POST --------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, steps, isActive: activateOnCreate } = body;

    // Validation
    if (!name || typeof name !== "string" || name.length < 3) {
      return NextResponse.json({ error: "Le nom du funnel doit contenir au moins 3 caractères" }, { status: 400 });
    }

    if (!steps || !Array.isArray(steps) || steps.length < 2) {
      return NextResponse.json({ error: "Le funnel doit contenir au moins 2 étapes" }, { status: 400 });
    }

    const validTypes: FunnelStepType[] = [
      "LANDING", "PRODUCT", "CHECKOUT", "UPSELL", "DOWNSELL", "CONFIRMATION", "THANK_YOU",
    ];

    for (const step of steps) {
      if (!step.type || !validTypes.includes(step.type)) {
        return NextResponse.json({ error: `Type d'étape invalide : ${step.type}` }, { status: 400 });
      }
      if (!step.title || typeof step.title !== "string") {
        return NextResponse.json({ error: "Chaque étape doit avoir un titre" }, { status: 400 });
      }
    }

    const slug = slugify(name) + "-" + Math.random().toString(36).substring(2, 8);

    if (DEV_MODE) {
      const funnelId = `funnel_${String(devFunnels.length + 1).padStart(3, "0")}`;

      const newFunnel: MockFunnel = {
        id: funnelId,
        instructeurId: "inst_001",
        name,
        slug,
        description: description || "",
        steps: steps.map((step: Partial<FunnelStep>, index: number) => ({
          id: `step_${funnelId}_${index + 1}`,
          type: step.type as FunnelStepType,
          title: step.title || "",
          headlineFr: step.headlineFr || "",
          headlineEn: step.headlineEn || "",
          descriptionFr: step.descriptionFr || "",
          descriptionEn: step.descriptionEn || "",
          ctaTextFr: step.ctaTextFr || "",
          ctaTextEn: step.ctaTextEn || "",
          linkedProductId: step.linkedProductId || null,
          linkedProductTitle: step.linkedProductTitle || null,
          linkedProductPrice: step.linkedProductPrice || null,
          discountPct: step.discountPct || null,
          order: index,
        })),
        isActive: activateOnCreate ?? false,
        totalViews: 0,
        totalClicks: 0,
        totalPurchases: 0,
        totalSkips: 0,
        totalRevenue: 0,
        conversionRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      devFunnels.push(newFunnel);
      return NextResponse.json({ funnel: newFunnel }, { status: 201 });
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

    const funnel = await db.salesFunnel.create({
      data: {
        instructeurId: instructeur.id,
        name,
        slug,
        description: description || "",
        isActive: activateOnCreate ?? false,
        steps: {
          create: steps.map((step: Partial<FunnelStep>, index: number) => ({
            type: step.type,
            title: step.title || "",
            headlineFr: step.headlineFr || "",
            headlineEn: step.headlineEn || "",
            descriptionFr: step.descriptionFr || "",
            descriptionEn: step.descriptionEn || "",
            ctaTextFr: step.ctaTextFr || "",
            ctaTextEn: step.ctaTextEn || "",
            linkedProductId: step.linkedProductId || null,
            discountPct: step.discountPct || null,
            order: index,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ funnel }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/funnels]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// -- PUT ---------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, steps, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID du funnel requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const index = devFunnels.findIndex((f) => f.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "Funnel non trouvé" }, { status: 404 });
      }

      const funnel = devFunnels[index];

      // Update fields
      if (name !== undefined) funnel.name = name;
      if (description !== undefined) funnel.description = description;
      if (isActive !== undefined) funnel.isActive = isActive;

      if (steps && Array.isArray(steps)) {
        funnel.steps = steps.map((step: Partial<FunnelStep>, idx: number) => ({
          id: step.id || `step_${funnel.id}_${idx + 1}`,
          type: (step.type as FunnelStepType) || "LANDING",
          title: step.title || "",
          headlineFr: step.headlineFr || "",
          headlineEn: step.headlineEn || "",
          descriptionFr: step.descriptionFr || "",
          descriptionEn: step.descriptionEn || "",
          ctaTextFr: step.ctaTextFr || "",
          ctaTextEn: step.ctaTextEn || "",
          linkedProductId: step.linkedProductId || null,
          linkedProductTitle: step.linkedProductTitle || null,
          linkedProductPrice: step.linkedProductPrice || null,
          discountPct: step.discountPct || null,
          order: idx,
        }));
      }

      funnel.updatedAt = new Date().toISOString();
      devFunnels[index] = funnel;

      return NextResponse.json({ funnel });
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

    const existing = await db.salesFunnel.findFirst({
      where: { id, instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Funnel non trouvé" }, { status: 404 });
    }

    // Update funnel
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If steps are updated, delete old ones and recreate
    if (steps && Array.isArray(steps)) {
      await db.salesFunnelStep.deleteMany({ where: { funnelId: id } });

      await db.salesFunnelStep.createMany({
        data: steps.map((step: Partial<FunnelStep>, idx: number) => ({
          funnelId: id,
          type: step.type || "LANDING",
          title: step.title || "",
          headlineFr: step.headlineFr || "",
          headlineEn: step.headlineEn || "",
          descriptionFr: step.descriptionFr || "",
          descriptionEn: step.descriptionEn || "",
          ctaTextFr: step.ctaTextFr || "",
          ctaTextEn: step.ctaTextEn || "",
          linkedProductId: step.linkedProductId || null,
          discountPct: step.discountPct || null,
          order: idx,
        })),
      });
    }

    const funnel = await db.salesFunnel.update({
      where: { id },
      data: updateData,
      include: { steps: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ funnel });
  } catch (error) {
    console.error("[PUT /api/marketing/funnels]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// -- DELETE ------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const index = devFunnels.findIndex((f) => f.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "Funnel non trouvé" }, { status: 404 });
      }
      devFunnels.splice(index, 1);
      return NextResponse.json({ success: true });
    }

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

    const existing = await db.salesFunnel.findFirst({
      where: { id, instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Funnel non trouvé" }, { status: 404 });
    }

    // Delete steps first, then funnel
    await db.salesFunnelStep.deleteMany({ where: { funnelId: id } });
    await db.salesFunnel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/marketing/funnels]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
