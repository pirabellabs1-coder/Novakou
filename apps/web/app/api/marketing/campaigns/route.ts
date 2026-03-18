// GET /api/marketing/campaigns — List campaign trackers for instructor with stats
// POST /api/marketing/campaigns — Create campaign tracker (name, UTM params, destination URL)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// ── Types ────────────────────────────────────────────────────────────────────

interface MockCampaign {
  id: string;
  slug: string;
  name: string;
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string | null;
  isActive: boolean;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  revenue: number;
  lastClickAt: string | null;
  createdAt: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: MockCampaign[] = [];

let devCampaigns = [...MOCK_CAMPAIGNS];

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

function buildTrackingUrl(baseUrl: string, slug: string): string {
  return `${baseUrl}/api/marketing/campaigns/${slug}`;
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    if (DEV_MODE) {
      const stats = {
        totalCampaigns: devCampaigns.length,
        activeCampaigns: devCampaigns.filter((c) => c.isActive).length,
        totalClicks: devCampaigns.reduce((sum, c) => sum + c.clicks, 0),
        totalConversions: devCampaigns.reduce((sum, c) => sum + c.conversions, 0),
        totalRevenue: devCampaigns.reduce((sum, c) => sum + c.revenue, 0),
      };

      const origin = new URL(req.url).origin;
      const campaigns = devCampaigns.map((c) => ({
        ...c,
        trackingUrl: buildTrackingUrl(origin, c.slug),
        conversionRate: c.clicks > 0 ? Math.round((c.conversions / c.clicks) * 1000) / 10 : 0,
      }));

      return NextResponse.json({ campaigns, stats });
    }

    // ── Production ──
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

    const campaigns = await prisma.campaignTracker.findMany({
      where: { instructeurId: instructeur.id },
      include: {
        _count: { select: { clicks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const origin = new URL(req.url).origin;
    const enriched = campaigns.map((c) => ({
      ...c,
      clicks: c._count.clicks,
      trackingUrl: buildTrackingUrl(origin, c.slug),
    }));

    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.isActive).length,
      totalClicks: enriched.reduce((sum, c) => sum + c.clicks, 0),
      totalConversions: 0, // TODO: calculate from conversion events
      totalRevenue: 0, // TODO: calculate from attributed revenue
    };

    return NextResponse.json({ campaigns: enriched, stats });
  } catch (error) {
    console.error("[GET /api/marketing/campaigns]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, destinationUrl, utmSource, utmMedium, utmCampaign, utmContent } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Le nom de la campagne est requis (min 2 caracteres)" }, { status: 400 });
    }
    if (!destinationUrl || typeof destinationUrl !== "string") {
      return NextResponse.json({ error: "L'URL de destination est requise" }, { status: 400 });
    }
    if (!utmSource || typeof utmSource !== "string") {
      return NextResponse.json({ error: "La source UTM est requise" }, { status: 400 });
    }
    if (!utmMedium || typeof utmMedium !== "string") {
      return NextResponse.json({ error: "Le medium UTM est requis" }, { status: 400 });
    }
    if (!utmCampaign || typeof utmCampaign !== "string") {
      return NextResponse.json({ error: "Le nom de campagne UTM est requis" }, { status: 400 });
    }

    const slug = generateSlug(`${name}-${Date.now().toString(36)}`);
    const origin = new URL(req.url).origin;

    if (DEV_MODE) {
      const newCampaign: MockCampaign = {
        id: `camp_${String(devCampaigns.length + 1).padStart(3, "0")}`,
        slug,
        name: name.trim(),
        destinationUrl: destinationUrl.trim(),
        utmSource: utmSource.trim(),
        utmMedium: utmMedium.trim(),
        utmCampaign: utmCampaign.trim(),
        utmContent: utmContent?.trim() || null,
        isActive: true,
        clicks: 0,
        uniqueClicks: 0,
        conversions: 0,
        revenue: 0,
        lastClickAt: null,
        createdAt: new Date().toISOString(),
      };

      devCampaigns.push(newCampaign);

      return NextResponse.json({
        campaign: {
          ...newCampaign,
          trackingUrl: buildTrackingUrl(origin, slug),
          conversionRate: 0,
        },
      }, { status: 201 });
    }

    // ── Production ──
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

    // Check slug uniqueness
    const existing = await prisma.campaignTracker.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json({ error: "Un lien de tracking avec ce slug existe deja" }, { status: 409 });
    }

    const campaign = await prisma.campaignTracker.create({
      data: {
        slug,
        name: name.trim(),
        destinationUrl: destinationUrl.trim(),
        utmSource: utmSource.trim(),
        utmMedium: utmMedium.trim(),
        utmCampaign: utmCampaign.trim(),
        utmContent: utmContent?.trim() || null,
        instructeurId: instructeur.id,
      },
    });

    return NextResponse.json({
      campaign: {
        ...campaign,
        trackingUrl: buildTrackingUrl(origin, slug),
        clicks: 0,
        conversions: 0,
        revenue: 0,
        conversionRate: 0,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/campaigns]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PUT ─────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isActive, name, destinationUrl, utmSource, utmMedium, utmCampaign, utmContent } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const index = devCampaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
      }

      if (isActive !== undefined) devCampaigns[index].isActive = isActive;
      if (name !== undefined) devCampaigns[index].name = name;
      if (destinationUrl !== undefined) devCampaigns[index].destinationUrl = destinationUrl;
      if (utmSource !== undefined) devCampaigns[index].utmSource = utmSource;
      if (utmMedium !== undefined) devCampaigns[index].utmMedium = utmMedium;
      if (utmCampaign !== undefined) devCampaigns[index].utmCampaign = utmCampaign;
      if (utmContent !== undefined) devCampaigns[index].utmContent = utmContent;

      const origin = new URL(req.url).origin;
      return NextResponse.json({
        campaign: {
          ...devCampaigns[index],
          trackingUrl: buildTrackingUrl(origin, devCampaigns[index].slug),
          conversionRate: devCampaigns[index].clicks > 0 ? Math.round((devCampaigns[index].conversions / devCampaigns[index].clicks) * 1000) / 10 : 0,
        },
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;
    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;
    if (destinationUrl !== undefined) updateData.destinationUrl = destinationUrl;

    const campaign = await prisma.campaignTracker.update({ where: { id }, data: updateData });
    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("[PUT /api/marketing/campaigns]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const index = devCampaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
      }
      devCampaigns.splice(index, 1);
      return NextResponse.json({ success: true });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;
    await prisma.campaignTracker.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/marketing/campaigns]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
