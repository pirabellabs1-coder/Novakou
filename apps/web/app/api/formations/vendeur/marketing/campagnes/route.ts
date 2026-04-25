import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

import { getActiveShopId } from "@/lib/formations/active-shop";
import { getInstructeurId as _gii } from "@/lib/formations/instructeur";
async function getProfileId(userId: string) { return _gii(userId); }

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ data: [] });
    const pid = _ctx.instructeurId;

    const campaigns = await prisma.campaignTracker.findMany({
      where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: campaigns });
  } catch (err) {
    console.error("[campagnes GET]", err);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." }, { status: 401 });
    const pid = _ctx.instructeurId;

    const body = await request.json();
    const { name, destinationUrl, utmSource, utmMedium, utmCampaign, utmContent } = body;

    if (!name || !destinationUrl) {
      return NextResponse.json({ error: "Nom et URL destination requis" }, { status: 400 });
    }

    // Build unique slug
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.campaignTracker.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const campaign = await prisma.campaignTracker.create({
      data: { instructeurId: pid, shopId: activeShopId,
        name: name.trim(),
        slug,
        destinationUrl: destinationUrl.trim(),
        utmSource: utmSource?.trim() || null,
        utmMedium: utmMedium?.trim() || null,
        utmCampaign: utmCampaign?.trim() || null,
        utmContent: utmContent?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ data: campaign });
  } catch (err) {
    console.error("[campagnes POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
