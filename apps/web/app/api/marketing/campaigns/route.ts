// GET /api/marketing/campaigns — List campaign trackers for instructor with stats
// POST /api/marketing/campaigns — Create campaign tracker (name, UTM params, destination URL)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getOrCreateInstructeurProfile } from "@/lib/formations/prisma-helpers";

/**
 * Une `destinationUrl` finit dans un `NextResponse.redirect` servi par notre
 * domaine (/api/marketing/campaigns/[slug]). On n'accepte donc que http(s) :
 * un schéma exotique (javascript:, data:) ou une chaîne non parsable n'a rien
 * à faire dans une redirection signée Novakou.
 */
function normalizeDestination(value: unknown): { ok: true; url: string } | { ok: false; error: string } {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return { ok: false, error: "URL de destination requise" };
  if (raw.startsWith("/")) return { ok: true, url: raw };
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, error: "L'URL doit commencer par http:// ou https://" };
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return { ok: false, error: "URL de destination invalide" };
  }
}

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
    // ── Production ──
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await getOrCreateInstructeurProfile(session.user.id);

    const campaigns = await prisma.campaignTracker.findMany({
      where: { instructeurId: instructeur.id },
      orderBy: { createdAt: "desc" },
    });

    const origin = new URL(req.url).origin;
    // On s'appuie sur les compteurs stockés (totalClicks/totalConversions/
    // totalRevenue), incrémentés par l'endpoint de clic et par les webhooks de
    // paiement — plus fiables que _count.events qui mélange clics et conversions.
    const enriched = campaigns.map((c) => ({
      ...c,
      clicks: c.totalClicks,
      trackingUrl: buildTrackingUrl(origin, c.slug),
    }));

    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.isActive).length,
      totalClicks: campaigns.reduce((sum, c) => sum + c.totalClicks, 0),
      totalConversions: campaigns.reduce((sum, c) => sum + c.totalConversions, 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.totalRevenue, 0),
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

    // ── Production ──
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await getOrCreateInstructeurProfile(session.user.id);

    // Check slug uniqueness
    const existing = await prisma.campaignTracker.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json({ error: "Un lien de tracking avec ce slug existe deja" }, { status: 409 });
    }

    const dest = normalizeDestination(destinationUrl);
    if (!dest.ok) return NextResponse.json({ error: dest.error }, { status: 400 });

    const campaign = await prisma.campaignTracker.create({
      data: {
        slug,
        name: name.trim(),
        destinationUrl: dest.url,
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
    // Le PUT ne met a jour que ces champs-la (cf. updateData plus bas).
    const { id, isActive, name, destinationUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    // La campagne doit appartenir au vendeur connecté. Sans ce contrôle,
    // n'importe quel compte connecté pouvait réécrire la `destinationUrl` du
    // lien tracké d'un AUTRE vendeur : le lien déjà partagé sur les réseaux
    // continuait de pointer sur novakou.com mais redirigeait où l'attaquant
    // voulait (hameçonnage sous notre nom).
    const instructeur = await getOrCreateInstructeurProfile(session.user.id);
    const owned = await prisma.campaignTracker.findFirst({
      where: { id, instructeurId: instructeur.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;
    if (destinationUrl !== undefined) {
      // Même validation qu'à la création : http(s) uniquement.
      const check = normalizeDestination(destinationUrl);
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
      updateData.destinationUrl = check.url;
    }

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

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    // Même garde-fou qu'au PUT : un vendeur ne supprime que SES campagnes.
    const instructeur = await getOrCreateInstructeurProfile(session.user.id);
    const owned = await prisma.campaignTracker.findFirst({
      where: { id, instructeurId: instructeur.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
    }

    await prisma.campaignTracker.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/marketing/campaigns]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
