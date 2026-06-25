import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * POST /api/marketing/funnels/import-systeme
 * Body : { url: string }  (URL publique d'un tunnel/page Systeme.io)
 *
 * Import « best-effort » : on récupère la page et on extrait le titre, la
 * description et l'image principale (balises Open Graph — fiables même quand
 * la page est rendue en JS). On crée un tunnel Novakou EN BROUILLON avec une
 * étape landing pré-remplie (hero). Le vendeur attache ensuite son produit et
 * peaufine. Systeme.io n'expose pas de format d'export standard : c'est donc un
 * point de départ rapide, pas une copie pixel-perfect.
 */
function extractMeta(html: string, prop: string): string | null {
  // <meta property="og:title" content="..."> ou name="..."
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m?.[1]) return m[1].trim();
  // ordre inversé content avant property
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`,
    "i",
  );
  return html.match(re2)?.[1]?.trim() ?? null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "tunnel";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx?.instructeurId) return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim() : "";
    let parsed: URL;
    try { parsed = new URL(url); } catch { return NextResponse.json({ error: "URL invalide" }, { status: 400 }); }
    if (!/^https?:$/.test(parsed.protocol)) {
      return NextResponse.json({ error: "URL invalide (http/https requis)" }, { status: 400 });
    }

    // Récupère la page (timeout 8s, UA navigateur pour éviter les blocages)
    let html = "";
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; NovakouImporter/1.0)" },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      html = await res.text();
    } catch {
      return NextResponse.json(
        { error: "Impossible de récupérer la page. Vérifiez que l'URL est publique." },
        { status: 502 },
      );
    }

    const ogTitle = extractMeta(html, "og:title");
    const ogDesc = extractMeta(html, "og:description") || extractMeta(html, "description");
    const ogImage = extractMeta(html, "og:image");
    const htmlTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? null;

    const name = decodeEntities(ogTitle || htmlTitle || "Tunnel importé").slice(0, 120);
    const headline = decodeEntities(h1 || ogTitle || htmlTitle || name).slice(0, 160);
    const subheadline = ogDesc ? decodeEntities(ogDesc).slice(0, 300) : null;
    const imageUrl = ogImage && /^https?:\/\//.test(ogImage) ? ogImage : null;

    // Slug unique
    let slug = slugify(name);
    if (await prisma.salesFunnel.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const funnel = await prisma.salesFunnel.create({
      data: {
        instructeurId: ctx.instructeurId,
        name,
        slug,
        description: `Importé depuis Systeme.io (${parsed.hostname})`,
        isActive: false, // brouillon : le vendeur attache son produit puis active
        steps: {
          create: [
            {
              stepOrder: 0,
              stepType: "LANDING",
              title: "Page de capture",
              headlineFr: headline,
              descriptionFr: subheadline,
              ctaTextFr: "Je commence maintenant",
              blocks: [
                {
                  type: "hero",
                  id: `hero_${Math.random().toString(36).slice(2, 9)}`,
                  data: {
                    headline,
                    subheadline: subheadline ?? "",
                    ctaText: "Je commence maintenant",
                    ...(imageUrl ? { imageUrl } : {}),
                  },
                },
              ],
            },
          ],
        },
      },
      select: { id: true, slug: true },
    });

    return NextResponse.json({
      ok: true,
      funnelId: funnel.id,
      slug: funnel.slug,
      imported: { name, headline, hasImage: !!imageUrl },
      note: "Tunnel créé en brouillon. Attachez votre produit puis activez-le.",
    });
  } catch (err) {
    console.error("[funnels/import-systeme]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
