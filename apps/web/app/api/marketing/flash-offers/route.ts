// GET /api/marketing/flash-offers — List flash offers (active for public, all for instructor)
// POST /api/marketing/flash-offers — Create a new flash offer

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// ── Mock data ────────────────────────────────────────────────────────────────

interface MockFlashOffer {
  id: string;
  formationId: string | null;
  digitalProductId: string | null;
  formationTitle: string | null;
  productTitle: string | null;
  discountPct: number;
  startsAt: string;
  endsAt: string;
  maxUsage: number | null;
  usageCount: number;
  isActive: boolean;
  revenue: number;
  createdAt: string;
}

const MOCK_FLASH_OFFERS: MockFlashOffer[] = [];

let devFlashOffers = [...MOCK_FLASH_OFFERS];

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "instructor"; // "public" | "instructor"

    if (DEV_MODE) {
      const now = new Date();

      if (scope === "public") {
        // Return only active offers that are currently running
        const activeOffers = devFlashOffers.filter(
          (o) =>
            o.isActive &&
            new Date(o.startsAt) <= now &&
            new Date(o.endsAt) > now &&
            (o.maxUsage === null || o.usageCount < o.maxUsage),
        );
        return NextResponse.json({ offers: activeOffers });
      }

      // Instructor view: return all
      const active = devFlashOffers.filter(
        (o) => o.isActive && new Date(o.startsAt) <= now && new Date(o.endsAt) > now,
      );
      const scheduled = devFlashOffers.filter(
        (o) => o.isActive && new Date(o.startsAt) > now,
      );
      const past = devFlashOffers.filter(
        (o) => !o.isActive || new Date(o.endsAt) <= now,
      );

      return NextResponse.json({
        active,
        scheduled,
        past,
        stats: {
          totalOffers: devFlashOffers.length,
          activeNow: active.length,
          totalRevenue: devFlashOffers.reduce((sum, o) => sum + o.revenue, 0),
          totalUsages: devFlashOffers.reduce((sum, o) => sum + o.usageCount, 0),
        },
      });
    }

    // Production
    const session = await getServerSession(authOptions);
    const prisma = (await import("@freelancehigh/db")).default;
    const now = new Date();

    if (scope === "public") {
      const activeOffers = await prisma.flashPromotion.findMany({
        where: {
          isActive: true,
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        include: {
          formation: { select: { id: true, titleFr: true, titleEn: true, price: true } },
          digitalProduct: { select: { id: true, titleFr: true, titleEn: true, price: true } },
        },
        orderBy: { endsAt: "asc" },
      });

      return NextResponse.json({ offers: activeOffers });
    }

    // Instructor view
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const formationIds = (
      await prisma.formation.findMany({
        where: { instructeurId: instructeur.id },
        select: { id: true },
      })
    ).map((f) => f.id);

    const productIds = (
      await prisma.digitalProduct.findMany({
        where: { instructeurId: instructeur.id },
        select: { id: true },
      })
    ).map((p) => p.id);

    const offers = await prisma.flashPromotion.findMany({
      where: {
        OR: [
          { formationId: { in: formationIds } },
          { digitalProductId: { in: productIds } },
        ],
      },
      include: {
        formation: { select: { titleFr: true } },
        digitalProduct: { select: { titleFr: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const active = offers.filter(
      (o) => o.isActive && o.startsAt <= now && o.endsAt > now,
    );
    const scheduled = offers.filter((o) => o.isActive && o.startsAt > now);
    const past = offers.filter((o) => !o.isActive || o.endsAt <= now);

    return NextResponse.json({
      active,
      scheduled,
      past,
      stats: {
        totalOffers: offers.length,
        activeNow: active.length,
        totalRevenue: 0, // TODO: calculate from related enrollments/purchases
        totalUsages: offers.reduce((sum, o) => sum + o.usageCount, 0),
      },
    });
  } catch (error) {
    console.error("[GET /api/marketing/flash-offers]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formationId, digitalProductId, discountPct, startsAt, endsAt, maxUsage } = body;

    // Validation
    if (!formationId && !digitalProductId) {
      return NextResponse.json({ error: "Selectionnez une formation ou un produit" }, { status: 400 });
    }
    if (formationId && digitalProductId) {
      return NextResponse.json({ error: "Selectionnez une formation OU un produit, pas les deux" }, { status: 400 });
    }
    if (typeof discountPct !== "number" || discountPct < 1 || discountPct > 90) {
      return NextResponse.json({ error: "Le pourcentage doit etre entre 1 et 90" }, { status: 400 });
    }
    if (!startsAt || !endsAt) {
      return NextResponse.json({ error: "Les dates de debut et fin sont requises" }, { status: 400 });
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      return NextResponse.json({ error: "La date de fin doit etre apres la date de debut" }, { status: 400 });
    }

    if (DEV_MODE) {
      const targetTitle = formationId
        ? `Formation #${formationId}`
        : `Produit #${digitalProductId}`;

      const newOffer: MockFlashOffer = {
        id: `flash_${String(devFlashOffers.length + 1).padStart(3, "0")}`,
        formationId: formationId || null,
        digitalProductId: digitalProductId || null,
        formationTitle: formationId ? targetTitle : null,
        productTitle: digitalProductId ? targetTitle : null,
        discountPct,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        maxUsage: maxUsage || null,
        usageCount: 0,
        isActive: true,
        revenue: 0,
        createdAt: new Date().toISOString(),
      };

      devFlashOffers.push(newOffer);
      return NextResponse.json({ offer: newOffer }, { status: 201 });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    // Verify ownership
    if (formationId) {
      const formation = await prisma.formation.findFirst({
        where: { id: formationId, instructeurId: instructeur.id },
      });
      if (!formation) {
        return NextResponse.json({ error: "Formation non trouvee" }, { status: 404 });
      }
    }
    if (digitalProductId) {
      const product = await prisma.digitalProduct.findFirst({
        where: { id: digitalProductId, instructeurId: instructeur.id },
      });
      if (!product) {
        return NextResponse.json({ error: "Produit non trouve" }, { status: 404 });
      }
    }

    const offer = await prisma.flashPromotion.create({
      data: {
        formationId: formationId || null,
        digitalProductId: digitalProductId || null,
        discountPct,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        maxUsage: maxUsage || null,
      },
      include: {
        formation: { select: { titleFr: true } },
        digitalProduct: { select: { titleFr: true } },
      },
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/flash-offers]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
