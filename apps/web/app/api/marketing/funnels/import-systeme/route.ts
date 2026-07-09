import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parse, type HTMLElement as ParsedElement } from "node-html-parser";
import juice from "juice";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

export const maxDuration = 120;

/**
 * POST /api/marketing/funnels/import-systeme
 * Body : { url: string } OU { urls: string[] } (1 URL par étape du tunnel, max 8)
 *
 * Import FIDÈLE d'un tunnel Systeme.io (ou de toute page de vente publique) :
 * 1. Chaque page est téléchargée AVEC ses feuilles de style, et le CSS est
 *    « inliné » (juice) pour connaître les styles réels de chaque élément.
 * 2. Le contenu est converti en blocs Novakou DANS L'ORDRE, avec ses styles :
 *    couleurs et tailles des titres/textes, couleurs et arrondis des boutons,
 *    fonds (couleurs, dégradés, images) des sections, alignements.
 * 3. Plusieurs URLs = plusieurs étapes du même tunnel (capture → vente → …).
 * Ce qui n'est pas repris : la police exacte et les mises en page en colonnes
 * complexes (le contenu reste dans l'ordre, à réorganiser si besoin).
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

// ── Lecture des styles inline (après passage de juice) ──────────────────────
function styleOf(el: ParsedElement): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = el.getAttribute("style") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf(":");
    if (i === -1) continue;
    const k = part.slice(0, i).trim().toLowerCase();
    const v = part.slice(i + 1).trim();
    if (k && v) out[k] = v;
  }
  return out;
}

// Convertit font-size CSS → px entier (borné)
function pxSize(v: string | undefined): number | null {
  if (!v) return null;
  let px: number | null = null;
  const m = v.match(/^([\d.]+)(px|rem|em|pt)?$/i);
  if (m) {
    const n = parseFloat(m[1]);
    const unit = (m[2] || "px").toLowerCase();
    px = unit === "px" ? n : unit === "pt" ? n * 1.333 : n * 16; // rem/em ≈ 16px
  }
  if (px === null || !Number.isFinite(px)) return null;
  return Math.max(10, Math.min(96, Math.round(px)));
}

// Variables CSS (:root/body) extraites des feuilles de style — les sites
// modernes définissent leurs couleurs via var(--x) que l'inliner ne résout pas.
type CssVars = Map<string, string>;

function collectCssVars(css: string): CssVars {
  const vars: CssVars = new Map();
  const rootBlocks = css.match(/(?::root|html|body)[^{}]*\{[^{}]*\}/gi) || [];
  for (const block of rootBlocks) {
    for (const m of block.matchAll(/--([\w-]+)\s*:\s*([^;}]+)[;}]/g)) {
      vars.set(m[1].trim(), m[2].trim());
    }
  }
  return vars;
}

// Résout var(--x, fallback) récursivement (3 passes max)
function resolveVars(v: string, vars: CssVars): string {
  let out = v;
  for (let i = 0; i < 3 && out.includes("var("); i++) {
    out = out.replace(/var\(\s*--([\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_all, name, fb) => {
      return vars.get(String(name).trim()) ?? (fb ? String(fb).trim() : "");
    });
  }
  return out.trim();
}

// Une couleur exploitable (pas transparent/inherit)
function usableColor(v: string | undefined, vars?: CssVars): string | null {
  if (!v) return null;
  let c = v.trim();
  if (vars && c.includes("var(")) c = resolveVars(c, vars);
  if (!c || /^(transparent|inherit|initial|unset|currentcolor)$/i.test(c) || c.includes("var(")) return null;
  if (/^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/i.test(c)) return null;
  if (/^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(c) || /gradient\(/i.test(c)) return c;
  return null;
}

// Couleur de texte effective : sur l'élément, sinon sur ses ENFANTS de texte
// (les builders type styled-components posent la couleur sur des <span>),
// sinon héritée des parents (6 niveaux).
function effectiveColor(el: ParsedElement, vars: CssVars): string | null {
  const own = usableColor(styleOf(el)["color"], vars);
  if (own && !/gradient\(/i.test(own)) return own;
  for (const child of el.querySelectorAll("span, strong, b, em, font").slice(0, 4)) {
    const c = usableColor(styleOf(child)["color"], vars);
    if (c && !/gradient\(/i.test(c)) return c;
  }
  let cur: ParsedElement | null = el.parentNode as ParsedElement | null;
  for (let depth = 0; cur && depth < 6; depth++) {
    const c = usableColor(styleOf(cur)["color"], vars);
    if (c && !/gradient\(/i.test(c)) return c;
    cur = cur.parentNode as ParsedElement | null;
  }
  return null;
}

// Fond d'un élément : { color?: couleur/dégradé, image?: url }
function backgroundOf(st: Record<string, string>, baseUrl: URL, vars: CssVars): { color: string | null; image: string | null } {
  const bg = resolveVars(st["background"] || "", vars);
  const bgColor = usableColor(st["background-color"], vars)
    || (bg.includes("gradient(") ? bg.match(/[a-z-]*gradient\([^)]*\)/i)?.[0] ?? null : usableColor(bg.split(" ")[0]));
  let image: string | null = null;
  const urlM = (resolveVars(st["background-image"] || "", vars) || bg).match(/url\(["']?([^"')]+)["']?\)/i);
  if (urlM) {
    try {
      const abs = new URL(urlM[1], baseUrl).toString();
      if (/^https?:\/\//.test(abs) && !/logo|icon|favicon/i.test(abs)) image = abs;
    } catch { /* url relative invalide */ }
  }
  return { color: bgColor, image };
}

function weightOf(st: Record<string, string>): number | null {
  const w = st["font-weight"];
  if (!w) return null;
  if (/^\d+$/.test(w)) return Math.max(300, Math.min(900, parseInt(w, 10)));
  if (w === "bold") return 700;
  return null;
}

function alignOf(st: Record<string, string>): string | null {
  const a = (st["text-align"] || "").toLowerCase();
  return a === "center" || a === "right" || a === "left" ? a : null;
}

// ── Extraction linéaire d'un périmètre (page entière ou section) ────────────
type ExtractCtx = {
  seenImages: Set<string>;
  seenButtons: Set<string>;
  seenTexts: Set<string>;
  processedLists: Set<ParsedElement>;
  leadFormAdded: boolean;
  buttonsCount: number;
  total: number;
};

function extractLinear(scope: ParsedElement, baseUrl: URL, ctx: ExtractCtx, vars: CssVars): ImportedBlock[] {
  const blocks: ImportedBlock[] = [];
  const push = (type: string, data: Record<string, unknown>) => {
    if (ctx.total >= 80) return;
    ctx.total++;
    blocks.push({ id: rid(type), type, data });
  };

  const nodes = scope.querySelectorAll("h1, h2, h3, p, ul, ol, img, button, a, iframe, input");
  for (const el of nodes) {
    if (ctx.total >= 80) break;
    const tag = el.tagName?.toLowerCase();
    const st = styleOf(el);

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const text = decodeEntities(clean(el.text));
      if (text.length < 3 || text.length > 220 || BOILERPLATE_RE.test(text)) continue;
      const key = `h:${text}`;
      if (ctx.seenTexts.has(key)) continue;
      ctx.seenTexts.add(key);
      const hColor = effectiveColor(el, vars);
      push("heading", {
        content: text,
        level: tag === "h1" ? 1 : tag === "h2" ? 2 : 3,
        align: alignOf(st) ?? "center",
        ...(hColor ? { color: hColor } : {}),
        ...(pxSize(st["font-size"]) ? { size: pxSize(st["font-size"]) } : {}),
        ...(weightOf(st) ? { weight: weightOf(st) } : {}),
      });
      continue;
    }

    if (tag === "p") {
      const text = decodeEntities(clean(el.text));
      if (text.length < 12 || text.length > 1200 || BOILERPLATE_RE.test(text)) continue;
      const key = `p:${text.slice(0, 80)}`;
      if (ctx.seenTexts.has(key)) continue;
      ctx.seenTexts.add(key);
      const pColor = effectiveColor(el, vars);
      push("text", {
        content: text,
        align: alignOf(st) ?? "left",
        size: pxSize(st["font-size"]) ?? 16,
        ...(pColor ? { color: pColor } : {}),
      });
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      if (ctx.processedLists.has(el)) continue;
      ctx.processedLists.add(el);
      const items = el.querySelectorAll("li")
        .map((li) => decodeEntities(clean(li.text)))
        .filter((t) => t.length >= 3 && t.length <= 300 && !BOILERPLATE_RE.test(t))
        .slice(0, 12);
      if (items.length < 2) continue;
      const key = `ul:${items[0]}`;
      if (ctx.seenTexts.has(key)) continue;
      ctx.seenTexts.add(key);
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
      if ((w > 0 && w < 80) || (h > 0 && h < 80)) continue;
      if (ctx.seenImages.has(src)) continue;
      ctx.seenImages.add(src);
      const radius = pxSize(st["border-radius"]);
      push("image", { url: src, alt: decodeEntities(clean(el.getAttribute("alt") || "")), align: "center", radius: radius !== null ? Math.min(radius, 60) : 12 });
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
      if (ctx.leadFormAdded) continue;
      const type = (el.getAttribute("type") || "").toLowerCase();
      const nameAttr = (el.getAttribute("name") || "").toLowerCase();
      if (type === "email" || nameAttr.includes("email")) {
        ctx.leadFormAdded = true;
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
      if (ctx.buttonsCount >= 6) continue;
      const cls = (el.getAttribute("class") || "").toLowerCase();
      const isButtonLike = tag === "button" || /btn|button|cta/.test(cls);
      if (!isButtonLike) continue;
      const text = decodeEntities(clean(el.text));
      if (text.length < 2 || text.length > 60 || BOILERPLATE_RE.test(text)) continue;
      const key = text.toLowerCase();
      if (ctx.seenButtons.has(key)) continue;
      ctx.seenButtons.add(key);
      ctx.buttonsCount++;
      const { color: btnBg } = backgroundOf(st, baseUrl, vars);
      const radius = pxSize(st["border-radius"]);
      const btnColor = usableColor(st["color"], vars);
      push("button", {
        text,
        link: "",
        style: "primary",
        size: "lg",
        align: "center",
        ...(btnBg ? { bgColor: btnBg } : {}),
        ...(btnColor ? { textColor: btnColor } : {}),
        ...(radius !== null ? { _borderRadius: Math.min(radius, 60) } : {}),
      });
      continue;
    }
  }
  return blocks;
}

// ── Extraction d'une page complète : sections avec leurs fonds si possible ──
function extractPage(html: string, baseUrl: URL, vars: CssVars): ImportedBlock[] {
  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });
  for (const sel of ["script", "style", "noscript", "svg", "nav"]) {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  }

  const freshCtx = (): ExtractCtx => ({
    seenImages: new Set(), seenButtons: new Set(), seenTexts: new Set(),
    processedLists: new Set(), leadFormAdded: false, buttonsCount: 0, total: 0,
  });

  // Conteneurs « section » : balises <section>, sinon divs porteuses d'un fond
  const allSections = root.querySelectorAll("section");
  let containers = allSections.filter((s) => !allSections.some((o) => o !== s && o.querySelectorAll("section").includes(s)));
  if (containers.length < 2) {
    const bgDivs = root.querySelectorAll("div").filter((d) => {
      const { color, image } = backgroundOf(styleOf(d), baseUrl, vars);
      return (color || image) && clean(d.text).length > 60;
    });
    // garder les divs à fond non imbriquées les unes dans les autres
    containers = bgDivs.filter((d) => !bgDivs.some((o) => o !== d && o.querySelectorAll("div").includes(d))).slice(0, 14);
  }

  if (containers.length >= 2) {
    const ctx = freshCtx();
    const blocks: ImportedBlock[] = [];
    for (const sec of containers) {
      const inner = extractLinear(sec, baseUrl, ctx, vars);
      if (!inner.length) continue;
      const st = styleOf(sec);
      const { color: bgColor, image: bgImage } = backgroundOf(st, baseUrl, vars);
      if (bgColor || bgImage) {
        const secText = usableColor(st["color"], vars);
        blocks.push({
          id: rid("section"),
          type: "section",
          data: {
            blocks: inner,
            ...(bgColor ? { bgColor } : {}),
            ...(bgImage ? { bgImage } : {}),
            ...(secText ? { textColor: secText } : {}),
            paddingY: 48,
            paddingX: 16,
            maxWidth: 1152,
          },
        });
      } else {
        blocks.push(...inner);
      }
    }
    if (blocks.length >= 3) return blocks;
  }

  return extractLinear(root, baseUrl, freshCtx(), vars);
}

// ── Téléchargement d'une page + de ses feuilles de style, CSS inliné ────────
async function fetchInlinedPage(url: URL): Promise<{ html: string; rawHtml: string; cssVars: CssVars }> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.6",
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  const res = await fetch(url.toString(), { headers, signal: ctrl.signal, redirect: "follow" });
  clearTimeout(t);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let rawHtml = await res.text();
  if (rawHtml.length > 2_000_000) rawHtml = rawHtml.slice(0, 2_000_000);

  // Récupérer les feuilles de style externes (max 8, ~700 Ko au total)
  let css = "";
  const linkRe = /<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;
  const links = (rawHtml.match(linkRe) || []).slice(0, 8);
  for (const linkTag of links) {
    const href = linkTag.match(hrefRe)?.[1];
    if (!href) continue;
    try {
      const cssUrl = new URL(href, url).toString();
      if (!/^https?:\/\//.test(cssUrl)) continue;
      const cctrl = new AbortController();
      const ct = setTimeout(() => cctrl.abort(), 6_000);
      const cres = await fetch(cssUrl, { headers, signal: cctrl.signal });
      clearTimeout(ct);
      if (cres.ok) {
        const text = await cres.text();
        if (css.length + text.length <= 700_000) css += "\n" + text;
      }
    } catch { /* feuille inaccessible : on continue sans */ }
  }

  // Variables CSS (:root/body) — depuis les feuilles externes ET les <style> de la page
  const inlineStyles = (rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
    .map((s) => s.replace(/<\/?style[^>]*>/gi, ""))
    .join("\n");
  const cssVars = collectCssVars(css + "\n" + inlineStyles);

  // Inliner TOUT le CSS (externe + <style> de la page — styled-components y
  // met les couleurs/fonds) dans les attributs style de chaque élément.
  // inlineContent n'applique PAS les <style> tout seul : on les concatène.
  let html = rawHtml;
  try {
    const allCss = (css + "\n" + inlineStyles).slice(0, 900_000);
    html = juice.inlineContent(rawHtml, allCss, {
      inlinePseudoElements: false,
      preserveImportant: false,
      applyStyleTags: false,
      removeStyleTags: true,
      applyWidthAttributes: false,
    });
  } catch (e) {
    console.error("[import-systeme] juice error (contenu importé sans styles):", e);
  }
  return { html, rawHtml, cssVars };
}

// Devine le type d'étape à partir du contenu importé
function guessStepType(blocks: ImportedBlock[], index: number): "LANDING" | "CAPTURE" | "THANK_YOU" {
  if (blocks.some((b) => b.type === "lead-form")) return "CAPTURE";
  const txt = JSON.stringify(blocks).toLowerCase();
  if (index > 0 && /merci|thank you|félicitations|felicitations|confirmation/.test(txt.slice(0, 600))) return "THANK_YOU";
  return "LANDING";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx?.instructeurId) return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const rawList: string[] = Array.isArray(body.urls)
      ? body.urls.map((u: unknown) => String(u).trim()).filter(Boolean)
      : typeof body.url === "string"
        ? body.url.split(/[\s,]+/).map((u: string) => u.trim()).filter(Boolean)
        : [];
    const urlStrings = [...new Set(rawList)].slice(0, 8);
    if (!urlStrings.length) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

    const parsedUrls: URL[] = [];
    for (const u of urlStrings) {
      try {
        const p = new URL(u);
        if (!/^https?:$/.test(p.protocol)) throw new Error("proto");
        parsedUrls.push(p);
      } catch {
        return NextResponse.json({ error: `URL invalide : ${u.slice(0, 80)}` }, { status: 400 });
      }
    }

    // ── Importer chaque page (1 URL = 1 étape du tunnel) ──
    const pages: Array<{ url: URL; blocks: ImportedBlock[]; title: string; ogTitle: string | null; ogDesc: string | null; fullImport: boolean }> = [];
    for (const pageUrl of parsedUrls) {
      let html = "", rawHtml = "", cssVars: CssVars = new Map();
      try {
        ({ html, rawHtml, cssVars } = await fetchInlinedPage(pageUrl));
      } catch {
        return NextResponse.json(
          { error: `Impossible de récupérer ${pageUrl.hostname}${pageUrl.pathname}. Vérifiez que l'URL est bien PUBLIQUE (l'adresse que voient vos visiteurs, pas celle de votre tableau de bord).` },
          { status: 502 },
        );
      }

      const ogTitle = extractMeta(rawHtml, "og:title");
      const ogDesc = extractMeta(rawHtml, "og:description") || extractMeta(rawHtml, "description");
      const htmlTitle = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;

      let blocks: ImportedBlock[] = [];
      try {
        blocks = extractPage(html, pageUrl, cssVars);
      } catch (e) {
        console.error("[import-systeme] extract error:", e);
      }

      const fullImport = blocks.length >= 3;
      if (!fullImport) {
        const headline = decodeEntities(clean(ogTitle || htmlTitle || "Page importée")).slice(0, 160);
        const subheadline = ogDesc ? decodeEntities(ogDesc).slice(0, 300) : "";
        const ogImage = extractMeta(rawHtml, "og:image");
        const imageUrl = ogImage && /^https?:\/\//.test(ogImage) ? ogImage : null;
        blocks = [
          { id: rid("heading"), type: "heading", data: { content: headline, level: 1, align: "center" } },
          ...(subheadline ? [{ id: rid("text"), type: "text", data: { content: subheadline, align: "center", size: 18 } }] : []),
          ...(imageUrl ? [{ id: rid("image"), type: "image", data: { url: imageUrl, alt: headline, align: "center", radius: 12 } }] : []),
          { id: rid("button"), type: "button", data: { text: "Je commence maintenant", link: "", style: "primary", size: "lg", align: "center" } },
        ];
      }

      pages.push({
        url: pageUrl,
        blocks,
        title: decodeEntities(clean(ogTitle || htmlTitle || `Étape ${pages.length + 1}`)).slice(0, 60),
        ogTitle, ogDesc, fullImport,
      });
    }

    const name = (pages[0].title || "Tunnel importé").slice(0, 120);
    let slug = slugify(name);
    if (await prisma.salesFunnel.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const funnel = await prisma.salesFunnel.create({
      data: {
        instructeurId: ctx.instructeurId,
        name,
        slug,
        description: `Importé depuis ${parsedUrls[0].hostname} (${pages.length} page${pages.length > 1 ? "s" : ""})`,
        isActive: false, // brouillon : le vendeur relit, attache son produit puis active
        steps: {
          create: pages.map((p, i) => ({
            stepOrder: i,
            stepType: guessStepType(p.blocks, i),
            title: pages.length > 1 ? `${i + 1}. ${p.title.slice(0, 50)}` : "Page importée",
            headlineFr: p.ogTitle ? decodeEntities(p.ogTitle).slice(0, 160) : p.title.slice(0, 160),
            descriptionFr: p.ogDesc ? decodeEntities(p.ogDesc).slice(0, 300) : null,
            blocks: p.blocks as unknown as object,
          })),
        },
      },
      select: { id: true, slug: true },
    });

    const totalBlocks = pages.reduce((n, p) => n + p.blocks.length, 0);
    const allTypes = [...new Set(pages.flatMap((p) => p.blocks.map((b) => b.type)))];
    const styledCount = pages.flatMap((p) => p.blocks).filter((b) => {
      const d = b.data as Record<string, unknown>;
      return d.color || d.bgColor || d.size || (b.type === "section" && (d.bgColor || d.bgImage));
    }).length;

    return NextResponse.json({
      ok: true,
      funnelId: funnel.id,
      slug: funnel.slug,
      imported: {
        name,
        pagesCount: pages.length,
        blocksCount: totalBlocks,
        styledCount,
        fullImport: pages.every((p) => p.fullImport),
        types: allTypes,
      },
      note: pages.every((p) => p.fullImport)
        ? `${totalBlocks} blocs importés sur ${pages.length} étape${pages.length > 1 ? "s" : ""}, avec les couleurs, fonds et tailles d'origine. Relisez, attachez votre produit, puis activez.`
        : "Certaines pages n'ont pas livré assez de contenu exploitable — un squelette a été créé à partir de leurs métadonnées.",
    });
  } catch (err) {
    console.error("[funnels/import-systeme]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
