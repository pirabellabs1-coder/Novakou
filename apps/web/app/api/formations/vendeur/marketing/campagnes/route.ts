import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

import { getActiveShopId } from "@/lib/formations/active-shop";

/**
 * L'URL de destination finit dans un `NextResponse.redirect` servi par notre
 * domaine (/api/marketing/campaigns/[slug]). On n'accepte donc que http(s) ou
 * un chemin interne : un schéma exotique (javascript:, data:) ou une chaîne
 * non parsable n'a rien à faire dans une redirection signée Novakou.
 */
function normaliserDestination(valeur: unknown): { ok: true; url: string } | { ok: false; erreur: string } {
  const brut = typeof valeur === "string" ? valeur.trim() : "";
  if (!brut) return { ok: false, erreur: "URL de destination requise" };
  if (brut.startsWith("/")) return { ok: true, url: brut.slice(0, 2000) };
  try {
    const parsee = new URL(brut);
    if (parsee.protocol !== "http:" && parsee.protocol !== "https:") {
      return { ok: false, erreur: "L'URL doit commencer par http:// ou https://" };
    }
    return { ok: true, url: parsee.toString().slice(0, 2000) };
  } catch {
    return { ok: false, erreur: "URL de destination invalide" };
  }
}

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
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ data: [] });
    const pid = _ctx.instructeurId;

    const campaigns = await prisma.campaignTracker.findMany({
      where: { instructeurId: pid, ...(activeShopId ? { OR: [{ shopId: activeShopId }, { shopId: null }] } : {}) },
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
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." }, { status: 401 });
    const pid = _ctx.instructeurId;

    const body = await request.json();
    const { name, destinationUrl, utmSource, utmMedium, utmCampaign, utmContent } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Le nom doit contenir au moins 2 caractères" }, { status: 400 });
    }
    const destination = normaliserDestination(destinationUrl);
    if (!destination.ok) {
      return NextResponse.json({ error: destination.erreur }, { status: 400 });
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
        name: name.trim().slice(0, 140),
        slug,
        destinationUrl: destination.url,
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
