import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parse, type HTMLElement as ParsedElement } from "node-html-parser";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * POST /api/marketing/funnels/import-systeme
 * Body : { url: string }  (URL publique d'un tunnel/page Systeme.io — ou de
 * n'importe quelle page de vente publique)
 *
 * VRAI import de contenu : la page est téléchargée puis parsée — titres,
 * paragraphes, listes à puces, images, boutons, vidéos YouTube/Vimeo et
 * formulaire de capture sont convertis en blocs Novakou, DANS L'ORDRE de la
 * page d'origine. Les couleurs/polices exactes ne sont pas reprises (le thème
 * Novakou s'applique) : c'est une migration de contenu, pas une copie pixel
 * par pixel. Si la page ne livre pas assez de contenu exploitable (page
 * protégée, rendue 100 % en JavaScript…), on retombe sur un squelette à
 * partir des balises Open Graph, en le disant honnêtement au vendeur.
 */

type ImportedBlock = { id: string; type: string; data: Record<string, unknown> };

const rid = (t: string) => `imp_${t}_${Math.random().toString(36).slice(2, 9)}`;
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

function extractMeta(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i");
  const m = html.match(re);
  if (m?.[1]) return m[1].trim();
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
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

const BOILERPLATE_RE = /cookie|mentions? légales|politique de confidentialité|tous droits réservés|all rights reserved|©|propulsé par|powered by|systeme\.io/i;

// Extraction linéaire du contenu de la page → blocs Novakou dans l'ordre.
function extractBlocks(root: ParsedElement, baseUrl: URL): ImportedBlock[] {
  // Retirer le bruit (les iframes vidéo sont traitées à part AVANT suppression)
  for (const sel of ["script", "style", "noscript", "svg", "nav", "header nav"]) {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  }

  const blocks: ImportedBlock[] = [];
  const seenImages = new Set<string>();
  const seenButtons = new Set<string>();
  const seenTexts = new Set<string>();
  const processedLists = new Set<ParsedElement>();
  let leadFormAdded = false;
  let buttonsCount = 0;

  const push = (type: string, data: Record<string, unknown>) => {
    if (blocks.length >= 60) return;
    blocks.push({ id: rid(type), type, data });
  };

  const nodes = root.querySelectorAll("h1, h2, h3, p, ul, ol, img, button, a, iframe, input");
  for (const el of nodes) {
    if (blocks.length >= 60) break;
    const tag = el.tagName?.toLowerCase();

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const text = decodeEntities(clean(el.text));
      if (text.length < 3 || text.length > 220 || BOILERPLATE_RE.test(text)) continue;
      const key = `h:${text}`;
      if (seenTexts.has(key)) continue;
      seenTexts.add(key);
      push("heading", { content: text, level: tag === "h1" ? 1 : tag === "h2" ? 2 : 3, align: "center" });
      continue;
    }

    if (tag === "p") {
      // Ignorer les <p> qui contiennent des titres/listes déjà traités
      const text = decodeEntities(clean(el.text));
      if (text.length < 12 || text.length > 1200 || BOILERPLATE_RE.test(text)) continue;
      const key = `p:${text.slice(0, 80)}`;
      if (seenTexts.has(key)) continue;
      seenTexts.add(key);
      push("text", { content: text, align: "left", size: 16 });
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      if (processedLists.has(el)) continue;
      processedLists.add(el);
      const items = el.querySelectorAll("li")
        .map((li) => decodeEntities(clean(li.text)))
        .filter((t) => t.length >= 3 && t.length <= 300 && !BOILERPLATE_RE.test(t))
        .slice(0, 12);
      // Les menus déguisés en listes : items très courts et nombreux → ignorer
      if (items.length < 2) continue;
      const key = `ul:${items[0]}`;
      if (seenTexts.has(key)) continue;
      seenTexts.add(key);
      push("list", { items, icon: "check_circle" });
      continue;
    }

    if (tag === "img") {
      let src = el.getAttribute("src") || el.getAttribute("data-src") || "";
      if (!src || src.startsWith("data:")) continue;
      try { src = new URL(src, baseUrl).toString(); } catch { continue; }
      if (!/^https?:\/\//.test(src)) continue;
      if (/logo|favicon|icon|pixel|badge|avatar/i.test(src)) continue;
      const w = Number(el.getAttribute("width") || 0);
      const h = Number(el.getAttribute("height") || 0);
      if ((w > 0 && w < 80) || (h > 0 && h < 80)) continue; // icônes
      if (seenImages.has(src)) continue;
      seenImages.add(src);
      push("image", { url: src, alt: decodeEntities(clean(el.getAttribute("alt") || "")), align: "center", radius: 12 });
      continue;
    }

    if (tag === "iframe") {
      const src = el.getAttribute("src") || "";
      if (/youtube\.com|youtu\.be|vimeo\.com/i.test(src)) {
        push("video", { url: src.startsWith("//") ? `https:${src}` : src });
      }
      continue;
    }

    if (tag === "input") {
      // Formulaire de capture : un input email sur la page → bloc formulaire Novakou
      if (leadFormAdded) continue;
      const type = (el.getAttribute("type") || "").toLowerCase();
      const nameAttr = (el.getAttribute("name") || "").toLowerCase();
      if (type === "email" || nameAttr.includes("email")) {
        leadFormAdded = true;
        push("lead-form", {
          title: "Recevez votre accès",
          subtitle: "",
          buttonText: "Je m'inscris",
          collectName: true,
          collectPhone: false,
          successMessage: "Merci ! Vérifiez votre boîte mail.",
          confetti: true,
        });
      }
      continue;
    }

    if (tag === "button" || tag === "a") {
      if (buttonsCount >= 5) continue;
      const cls = (el.getAttribute("class") || "").toLowerCase();
      const isButtonLike = tag === "button" || /btn|button|cta/.test(cls);
      if (!isButtonLike) continue;
      const text = decodeEntities(clean(el.text));
      if (text.length < 2 || text.length > 60 || BOILERPLATE_RE.test(text)) continue;
      const key = text.toLowerCase();
      if (seenButtons.has(key)) continue;
      seenButtons.add(key);
      buttonsCount++;
      push("button", { text, link: "", style: "primary", size: "lg", align: "center" });
      continue;
    }
  }

  // Nettoyage final : pas deux blocs identiques consécutifs
  return blocks.filter((b, i) => {
    const prev = blocks[i - 1];
    return !(prev && prev.type === b.type && JSON.stringify(prev.data) === JSON.stringify(b.data));
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx?.instructeurId) return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim() : "";
    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { return NextResponse.json({ error: "URL invalide" }, { status: 400 }); }
    if (!/^https?:$/.test(parsedUrl.protocol)) {
      return NextResponse.json({ error: "URL invalide (http/https requis)" }, { status: 400 });
    }

    // Récupère la page (timeout 12 s, UA navigateur pour éviter les blocages)
    let html = "";
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.6",
        },
        signal: ctrl.signal,
        redirect: "follow",
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch {
      return NextResponse.json(
        { error: "Impossible de récupérer la page. Vérifiez que l'URL est bien PUBLIQUE (l'adresse que voient vos visiteurs, pas celle de votre tableau de bord Systeme.io)." },
        { status: 502 },
      );
    }

    const ogTitle = extractMeta(html, "og:title");
    const ogDesc = extractMeta(html, "og:description") || extractMeta(html, "description");
    const ogImage = extractMeta(html, "og:image");
    const htmlTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
    const name = decodeEntities(ogTitle || htmlTitle || "Tunnel importé").slice(0, 120);

    // ── VRAI IMPORT : parser la page et convertir son contenu en blocs ──
    let blocks: ImportedBlock[] = [];
    try {
      const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });
      blocks = extractBlocks(root, parsedUrl);
    } catch (parseErr) {
      console.error("[import-systeme] parse error:", parseErr);
    }

    const fullImport = blocks.length >= 3;
    if (!fullImport) {
      // Fallback honnête : squelette à partir des balises Open Graph
      const headline = decodeEntities(clean(ogTitle || htmlTitle || name)).slice(0, 160);
      const subheadline = ogDesc ? decodeEntities(ogDesc).slice(0, 300) : "";
      const imageUrl = ogImage && /^https?:\/\//.test(ogImage) ? ogImage : null;
      blocks = [
        { id: rid("heading"), type: "heading", data: { content: headline, level: 1, align: "center" } },
        ...(subheadline ? [{ id: rid("text"), type: "text", data: { content: subheadline, align: "center", size: 18 } }] : []),
        ...(imageUrl ? [{ id: rid("image"), type: "image", data: { url: imageUrl, alt: headline, align: "center", radius: 12 } }] : []),
        { id: rid("button"), type: "button", data: { text: "Je commence maintenant", link: "", style: "primary", size: "lg", align: "center" } },
      ];
    }

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
        description: `Importé depuis ${parsedUrl.hostname}`,
        isActive: false, // brouillon : le vendeur relit, attache son produit puis active
        steps: {
          create: [
            {
              stepOrder: 0,
              stepType: "LANDING",
              title: "Page importée",
              headlineFr: decodeEntities(ogTitle || htmlTitle || name).slice(0, 160),
              descriptionFr: ogDesc ? decodeEntities(ogDesc).slice(0, 300) : null,
              blocks: blocks as unknown as object,
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
      imported: {
        name,
        blocksCount: blocks.length,
        fullImport,
        types: [...new Set(blocks.map((b) => b.type))],
      },
      note: fullImport
        ? `${blocks.length} blocs importés (titres, textes, images, boutons…). Relisez la page, attachez votre produit, puis activez.`
        : "La page n'a pas livré assez de contenu exploitable — un squelette de départ a été créé à partir de ses métadonnées.",
    });
  } catch (err) {
    console.error("[funnels/import-systeme]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
