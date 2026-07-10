import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parse, type HTMLElement as ParsedElement } from "node-html-parser";
import juice from "juice";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { extractViaBrowser } from "@/lib/import/browser-extract";

export const maxDuration = 300;

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

// Luminance perçue (0 = noir, 1 = blanc) d'une couleur CSS, ou null si inconnue.
function luminance(color: string | null | undefined): number | null {
  if (!color) return null;
  const c = color.trim().toLowerCase();
  let r: number, g: number, b: number;
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1];
    r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
  } else {
    const rgb = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
    if (!rgb) return null;
    r = parseFloat(rgb[1]); g = parseFloat(rgb[2]); b = parseFloat(rgb[3]);
  }
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Garantit un contraste lisible : tout texte de la section dont la couleur est
// trop proche du fond est basculé en blanc (fond sombre) ou noir (fond clair).
// Les couleurs d'accent (orange, vert…) suffisamment contrastées sont gardées.
function fixContrast(inner: ImportedBlock[], bgLum: number | null): void {
  if (bgLum === null) return;
  const target = bgLum < 0.5 ? "#ffffff" : "#111827";
  for (const b of inner) {
    const d = b.data as Record<string, unknown>;
    // Récursion dans les rangées (colonnes) et boîtes de contenu.
    if (b.type === "row" && Array.isArray(d.columns)) {
      for (const c of d.columns as Array<{ blocks: ImportedBlock[] }>) fixContrast(c.blocks ?? [], bgLum);
      continue;
    }
    if (Array.isArray(d.blocks)) { fixContrast(d.blocks as ImportedBlock[], bgLum); continue; }
    if (b.type !== "heading" && b.type !== "text") continue;
    const tl = luminance(d.color as string | undefined);
    if (tl === null) continue; // pas de couleur → héritera de la section
    if (Math.abs(tl - bgLum) < 0.4) d.color = target;
  }
}

// Fond EFFECTIF d'une section : la section elle-même n'a souvent qu'un fond
// clair, l'image/overlay réel étant sur un div enfant (cas Systeme.io). On
// scanne donc la section + ses descendants pour trouver le vrai fond.
function deepBackground(sec: ParsedElement, baseUrl: URL, vars: CssVars): { color: string | null; image: string | null; darkOverlay: boolean } {
  const own = backgroundOf(styleOf(sec), baseUrl, vars);
  let image = own.image;
  let color = own.color;
  let darkOverlay = false;

  // Chercher parmi les descendants : image de fond substantielle + overlay sombre
  const descendants = sec.querySelectorAll("div, figure, span");
  for (const el of descendants.slice(0, 120)) {
    const st = styleOf(el);
    const { color: c, image: img } = backgroundOf(st, baseUrl, vars);
    if (img && !image) image = img; // 1re image de fond rencontrée
    // Overlay sombre semi-transparent (rgba(0,0,0,.x)) posé par-dessus l'image
    if (c && /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0?\.[1-9]/i.test(c)) {
      const lum = luminance(c);
      if (lum !== null && lum < 0.5) darkOverlay = true;
    }
    // Fond de couleur sombre sur un enfant qui remplit la section
    if (c && !color) {
      const lum = luminance(c);
      if (lum !== null && lum < 0.3) color = c;
    }
  }
  return { color, image, darkOverlay };
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

// Un seul ÉLÉMENT feuille (titre/texte/liste/image/bouton/vidéo/champ) → 1 bloc,
// ou null s'il n'y a rien d'exploitable. Applique la déduplication via ctx.
function atomicBlockFor(el: ParsedElement, baseUrl: URL, ctx: ExtractCtx, vars: CssVars): ImportedBlock | null {
  const tag = el.tagName?.toLowerCase();
  const st = styleOf(el);
  const mk = (type: string, data: Record<string, unknown>): ImportedBlock => ({ id: rid(type), type, data });

  if (tag === "h1" || tag === "h2" || tag === "h3") {
    const text = decodeEntities(clean(el.text));
    if (text.length < 3 || text.length > 220 || BOILERPLATE_RE.test(text)) return null;
    const key = `h:${text}`;
    if (ctx.seenTexts.has(key)) return null;
    ctx.seenTexts.add(key);
    const hColor = effectiveColor(el, vars);
    return mk("heading", {
      content: text,
      level: tag === "h1" ? 1 : tag === "h2" ? 2 : 3,
      align: alignOf(st) ?? "center",
      ...(hColor ? { color: hColor } : {}),
      ...(pxSize(st["font-size"]) ? { size: pxSize(st["font-size"]) } : {}),
      ...(weightOf(st) ? { weight: weightOf(st) } : {}),
    });
  }
  if (tag === "p") {
    const text = decodeEntities(clean(el.text));
    if (text.length < 12 || text.length > 1200 || BOILERPLATE_RE.test(text)) return null;
    const key = `p:${text.slice(0, 80)}`;
    if (ctx.seenTexts.has(key)) return null;
    ctx.seenTexts.add(key);
    const pColor = effectiveColor(el, vars);
    return mk("text", {
      content: text,
      align: alignOf(st) ?? "left",
      size: pxSize(st["font-size"]) ?? 16,
      ...(pColor ? { color: pColor } : {}),
    });
  }
  if (tag === "ul" || tag === "ol") {
    if (ctx.processedLists.has(el)) return null;
    ctx.processedLists.add(el);
    const items = el.querySelectorAll("li")
      .map((li) => decodeEntities(clean(li.text)))
      .filter((t) => t.length >= 3 && t.length <= 300 && !BOILERPLATE_RE.test(t))
      .slice(0, 12);
    if (items.length < 2) return null;
    const key = `ul:${items[0]}`;
    if (ctx.seenTexts.has(key)) return null;
    ctx.seenTexts.add(key);
    return mk("list", { items, icon: "check_circle" });
  }
  if (tag === "img") {
    let src = el.getAttribute("src") || el.getAttribute("data-src") || "";
    if (!src || src.startsWith("data:")) return null;
    try { src = new URL(src, baseUrl).toString(); } catch { return null; }
    if (!/^https?:\/\//.test(src)) return null;
    if (/logo|favicon|icon|pixel|badge|avatar/i.test(src)) return null;
    const w = Number(el.getAttribute("width") || 0);
    const h = Number(el.getAttribute("height") || 0);
    if ((w > 0 && w < 80) || (h > 0 && h < 80)) return null;
    if (ctx.seenImages.has(src)) return null;
    ctx.seenImages.add(src);
    const radius = pxSize(st["border-radius"]);
    return mk("image", { url: src, alt: decodeEntities(clean(el.getAttribute("alt") || "")), align: "center", radius: radius !== null ? Math.min(radius, 60) : 12 });
  }
  if (tag === "iframe") {
    const src = el.getAttribute("src") || "";
    if (/youtube\.com|youtu\.be|vimeo\.com/i.test(src)) return mk("video", { url: src.startsWith("//") ? `https:${src}` : src });
    return null;
  }
  if (tag === "input") {
    if (ctx.leadFormAdded) return null;
    const type = (el.getAttribute("type") || "").toLowerCase();
    const nameAttr = (el.getAttribute("name") || "").toLowerCase();
    if (type === "email" || nameAttr.includes("email")) {
      ctx.leadFormAdded = true;
      return mk("lead-form", { title: "Recevez votre accès", subtitle: "", buttonText: "Je m'inscris", collectName: true, collectPhone: false, successMessage: "Merci ! Vérifiez votre boîte mail.", confetti: true });
    }
    return null;
  }
  if (tag === "button" || tag === "a") {
    if (ctx.buttonsCount >= 6) return null;
    const cls = (el.getAttribute("class") || "").toLowerCase();
    if (!(tag === "button" || /btn|button|cta/.test(cls))) return null;
    const text = decodeEntities(clean(el.text));
    if (text.length < 2 || text.length > 60 || BOILERPLATE_RE.test(text)) return null;
    const key = text.toLowerCase();
    if (ctx.seenButtons.has(key)) return null;
    ctx.seenButtons.add(key);
    ctx.buttonsCount++;
    const { color: btnBg } = backgroundOf(st, baseUrl, vars);
    const radius = pxSize(st["border-radius"]);
    const btnColor = usableColor(st["color"], vars);
    return mk("button", {
      text, link: "", style: "primary", size: "lg", align: "center",
      ...(btnBg ? { bgColor: btnBg } : {}),
      ...(btnColor ? { textColor: btnColor } : {}),
      ...(radius !== null ? { _borderRadius: Math.min(radius, 60) } : {}),
    });
  }
  return null;
}

const ATOMIC_TAGS = new Set(["h1", "h2", "h3", "p", "ul", "ol", "img", "iframe", "input", "button", "a"]);
const INLINE_TAGS = new Set(["span", "b", "i", "em", "strong", "a", "br", "small", "u", "mark", "sub", "sup", "font"]);

// Un div/span est une « feuille de texte » si tout son texte est local (ses
// enfants ne sont qu'inline). Systeme.io met titres/paragraphes dans des divs,
// pas des <h>/<p> : sans ça, tout le contenu des cartes est invisible.
function isTextLeaf(el: ParsedElement): boolean {
  for (const c of el.childNodes as ParsedElement[]) {
    if (!c.tagName) continue;
    if (INLINE_TAGS.has(c.tagName.toLowerCase())) continue;
    if (clean(c.text).length > 0) return false; // un enfant bloc porte son propre texte
  }
  return clean(el.text).length > 0;
}

// Convertit un div/span « feuille de texte » en bloc heading ou text.
function textLeafBlock(el: ParsedElement, ctx: ExtractCtx, vars: CssVars): ImportedBlock | null {
  const text = decodeEntities(clean(el.text));
  if (text.length < 2 || text.length > 900 || BOILERPLATE_RE.test(text)) return null;
  const key = `t:${text.slice(0, 80)}`;
  if (ctx.seenTexts.has(key)) return null;
  ctx.seenTexts.add(key);
  const st = styleOf(el);
  const size = pxSize(st["font-size"]);
  const weight = weightOf(st);
  const color = effectiveColor(el, vars);
  // Gros ou gras et court → titre ; sinon paragraphe.
  const isHeading = (size !== null && size >= 22) || ((weight ?? 0) >= 600 && text.length <= 70);
  if (isHeading) {
    return { id: rid("heading"), type: "heading", data: {
      content: text, level: size && size >= 32 ? 2 : 3, align: alignOf(st) ?? "left",
      ...(color ? { color } : {}), ...(size ? { size } : {}), ...(weight ? { weight } : {}),
    } };
  }
  return { id: rid("text"), type: "text", data: {
    content: text, align: alignOf(st) ?? "left", size: size ?? 16, ...(color ? { color } : {}),
  } };
}

// Détecte un conteneur MULTI-COLONNES (grid ou flex-row) et renvoie les groupes
// d'éléments par colonne (2 à 4 colonnes), ou null. Gère l'écoulement d'une
// grille N-colonnes qui « enroule » plus d'enfants (répartition en ligne).
function detectColumns(el: ParsedElement, vars: CssVars): ParsedElement[][] | null {
  const st = styleOf(el);
  const disp = (st["display"] || "").toLowerCase();
  const kids = (el.childNodes as ParsedElement[]).filter((c) => c.tagName && clean(c.text).length > 8);
  if (kids.length < 2) return null;

  if (disp.includes("grid")) {
    const gtc = resolveVars(st["grid-template-columns"] || "", vars).trim();
    if (!gtc || /^(none|1fr)$/.test(gtc)) return null;
    let nCols = 0;
    const rep = gtc.match(/repeat\(\s*(\d+)/);
    if (rep) nCols = parseInt(rep[1], 10);
    else nCols = gtc.split(/\s+(?![^()]*\))/).filter(Boolean).length;
    if (nCols < 2 || nCols > 4) return null; // ignore les grilles 12-col (footer) etc.
    // Répartition ligne par ligne : enfant i → colonne i % nCols
    const cols: ParsedElement[][] = Array.from({ length: nCols }, () => []);
    kids.forEach((k, i) => cols[i % nCols].push(k));
    return cols.every((c) => c.length) ? cols : null;
  }

  if (disp.includes("flex") && !(st["flex-direction"] || "").includes("column")) {
    if (kids.length < 2 || kids.length > 4) return null;
    // Chaque enfant direct = une colonne
    return kids.map((k) => [k]);
  }
  return null;
}

// Extraction RÉCURSIVE : reproduit les grilles/flex en RANGÉES Novakou avec
// colonnes, tout en gardant l'ordre de la page. `allowColumns=false` à
// l'intérieur d'une colonne (Novakou n'imbrique pas de rangée dans une colonne).
function extractTree(el: ParsedElement, baseUrl: URL, ctx: ExtractCtx, vars: CssVars, allowColumns = true, depth = 0): ImportedBlock[] {
  if (ctx.total >= 80 || depth > 40) return [];
  const tag = el.tagName?.toLowerCase();

  // Élément feuille (titre, texte, image, bouton…) → un bloc, pas de descente.
  if (tag && ATOMIC_TAGS.has(tag)) {
    const b = atomicBlockFor(el, baseUrl, ctx, vars);
    if (b) { ctx.total++; return [b]; }
    return [];
  }

  // Div/span « feuille de texte » (contenu des cartes Systeme.io) → bloc texte.
  if ((tag === "div" || tag === "span" || tag === "li" || tag === "figcaption" || tag === "label") && isTextLeaf(el)) {
    const b = textLeafBlock(el, ctx, vars);
    if (b) { ctx.total++; return [b]; }
    return [];
  }

  // Conteneur multi-colonnes → rangée avec colonnes.
  if (allowColumns) {
    const cols = detectColumns(el, vars);
    if (cols) {
      const columns = cols.map((colEls) => ({
        blocks: colEls.flatMap((ce) => extractTree(ce, baseUrl, ctx, vars, false, depth + 1)),
      }));
      const filled = columns.filter((c) => c.blocks.length);
      // Au moins 2 colonnes remplies → vraie rangée.
      if (filled.length >= 2) {
        ctx.total++;
        return [{ id: rid("row"), type: "row", data: { columns, gap: 24, padding: 8, stackMobile: true } }];
      }
      // 1 seule colonne remplie : PAS de rangée, mais le contenu a déjà été
      // extrait (dédup pollué) → on le renvoie à plat pour ne rien perdre.
      const flat = columns.flatMap((c) => c.blocks);
      if (flat.length) return flat;
    }
  }

  // Sinon : descendre dans les enfants, dans l'ordre.
  const out: ImportedBlock[] = [];
  for (const child of el.childNodes as ParsedElement[]) {
    if (!child.tagName) continue;
    out.push(...extractTree(child, baseUrl, ctx, vars, allowColumns, depth + 1));
    if (ctx.total >= 80) break;
  }
  return out;
}

// Compat : extraction d'un périmètre (avec colonnes activées).
function extractLinear(scope: ParsedElement, baseUrl: URL, ctx: ExtractCtx, vars: CssVars): ImportedBlock[] {
  return extractTree(scope, baseUrl, ctx, vars, true, 0);
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
      // Fond effectif (section + descendants : image/overlay souvent sur un enfant)
      let { color: bgColor, image: bgImage, darkOverlay } = deepBackground(sec, baseUrl, vars);
      const secText = usableColor(styleOf(sec)["color"], vars);

      // ── Filet de sécurité CONTRASTE : jamais de texte invisible ──
      // On regarde la couleur dominante des textes de la section.
      const textColors = inner
        .filter((b) => b.type === "heading" || b.type === "text")
        .map((b) => luminance((b.data as Record<string, string>).color))
        .filter((l): l is number => l !== null);
      const lightText = textColors.length > 0 && textColors.filter((l) => l > 0.6).length >= textColors.length / 2;
      const darkText = textColors.length > 0 && textColors.filter((l) => l < 0.4).length >= textColors.length / 2;
      const bgLum = bgImage ? (darkOverlay ? 0.15 : 0.5) : luminance(bgColor);

      // Texte clair mais fond clair (ou absent) → forcer un fond sombre lisible.
      if (lightText && !bgImage && (bgLum === null || bgLum > 0.5)) {
        bgColor = "#111827";
      }
      // Texte sombre mais fond sombre → forcer un fond clair.
      if (darkText && !bgImage && bgLum !== null && bgLum < 0.3) {
        bgColor = "#ffffff";
      }
      // Image de fond avec du texte clair → texte blanc + overlay sombre +
      // couleur de secours sombre (texte lisible même si l'image ne charge pas).
      const imageWithLightText = bgImage && (darkOverlay || lightText || !darkText);
      const forceWhite = imageWithLightText;
      const fallbackDark = bgImage ? (bgColor && luminance(bgColor) !== null && luminance(bgColor)! < 0.3 ? bgColor : "#111827") : bgColor;

      // Normalisation de contraste par texte (garantie « jamais invisible »).
      const effLum = bgImage ? (imageWithLightText ? 0.12 : 0.5) : luminance(bgColor);
      fixContrast(inner, effLum);

      if (bgColor || bgImage) {
        blocks.push({
          id: rid("section"),
          type: "section",
          data: {
            blocks: inner,
            ...(bgImage ? { bgColor: fallbackDark } : bgColor ? { bgColor } : {}),
            ...(bgImage ? { bgImage } : {}),
            ...(bgImage && imageWithLightText ? { overlayColor: "rgba(0,0,0,0.55)" } : {}),
            ...(forceWhite ? { textColor: "#ffffff" } : secText ? { textColor: secText } : {}),
            paddingY: 56,
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
    // Boutique active : SANS elle le tunnel importé n'apparaissait pas dans la
    // liste (filtrée par boutique). getActiveShopId auto-sélectionne la primaire.
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });

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
    const pages: Array<{ url: URL; blocks: ImportedBlock[]; title: string; ogTitle: string | null; ogDesc: string | null; fullImport: boolean; engine: string }> = [];
    let funnelFont: string | null = null; // police de la 1re page (thème du tunnel)
    let funnelBg: string | null = null; // fond de page de la 1re page (thème du tunnel)
    for (const pageUrl of parsedUrls) {
      let blocks: ImportedBlock[] = [];
      let engine = "browser";
      let browserTitle: string | null = null;

      // 1) MÉTHODE FIDÈLE : rendu par navigateur réel (styles calculés, images,
      //    vidéos JS). C'est la voie principale.
      try {
        const br = await extractViaBrowser(pageUrl.toString());
        if (br && br.blocks.length >= 3) {
          blocks = br.blocks as ImportedBlock[];
          browserTitle = br.title || null;
        }
        if (pages.length === 0 && br?.pageFont) funnelFont = br.pageFont;
        if (pages.length === 0 && br?.pageBg && !br.pageBg.includes("gradient")) funnelBg = br.pageBg;
      } catch (e) {
        console.error("[import-systeme] browser extract failed:", e);
      }

      // Métadonnées (toujours utiles pour le nom/SEO), + fallback HTML si besoin.
      let rawHtml = "";
      let ogTitle: string | null = null, ogDesc: string | null = null, htmlTitle: string | null = null;

      // 2) FILET DE SÉCURITÉ : si le navigateur n'a rien donné, analyse HTML statique.
      if (blocks.length < 3) {
        engine = "static";
        let html = "", cssVars: CssVars = new Map();
        try {
          ({ html, rawHtml, cssVars } = await fetchInlinedPage(pageUrl));
        } catch {
          return NextResponse.json(
            { error: `Impossible de récupérer ${pageUrl.hostname}${pageUrl.pathname}. Vérifiez que l'URL est bien PUBLIQUE (l'adresse que voient vos visiteurs, pas celle de votre tableau de bord).` },
            { status: 502 },
          );
        }
        ogTitle = extractMeta(rawHtml, "og:title");
        ogDesc = extractMeta(rawHtml, "og:description") || extractMeta(rawHtml, "description");
        htmlTitle = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
        try {
          blocks = extractPage(html, pageUrl, cssVars);
        } catch (e) {
          console.error("[import-systeme] extract error:", e);
        }
      } else {
        // Navigateur OK : on récupère juste les métadonnées (léger) pour le nom/SEO.
        try {
          const meta = await fetchInlinedPage(pageUrl);
          rawHtml = meta.rawHtml;
          ogTitle = extractMeta(rawHtml, "og:title");
          ogDesc = extractMeta(rawHtml, "og:description") || extractMeta(rawHtml, "description");
          htmlTitle = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
        } catch { /* métadonnées non critiques */ }
        if (!ogTitle && browserTitle) htmlTitle = browserTitle;
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

      // Titre de l'étape : og:title, sinon <title>, sinon le 1er vrai titre de
      // la page importée (les pages Systeme.io ont souvent un <title> générique).
      const firstHeading = (() => {
        const flat: ImportedBlock[] = [];
        const walk = (bs: ImportedBlock[]) => bs.forEach((b) => { flat.push(b); if (Array.isArray((b.data as Record<string, unknown>).blocks)) walk((b.data as { blocks: ImportedBlock[] }).blocks); });
        walk(blocks);
        const h = flat.find((b) => b.type === "heading");
        return h ? String((h.data as Record<string, string>).content ?? "") : null;
      })();
      const cleanTitle = (t: string | null) => {
        if (!t) return null;
        const c = decodeEntities(clean(t));
        return /systeme\.io|page|sans titre|untitled/i.test(c) && c.length < 20 ? null : c;
      };
      pages.push({
        url: pageUrl,
        blocks,
        title: (cleanTitle(ogTitle) || cleanTitle(firstHeading) || cleanTitle(htmlTitle) || `Étape ${pages.length + 1}`).slice(0, 60),
        ogTitle, ogDesc, fullImport, engine,
      });
    }

    // Police du thème : celle du <body> si mappée, sinon la police la plus
    // fréquente parmi les blocs de la 1re page (les pages Systeme.io laissent
    // souvent le body en police par défaut alors que tout le texte est stylé).
    if (!funnelFont && pages.length) {
      const fontCounts = new Map<string, number>();
      const countFonts = (bs: ImportedBlock[]) => {
        for (const b of bs) {
          const d = b.data as Record<string, unknown>;
          if (typeof d.font === "string" && d.font) fontCounts.set(d.font, (fontCounts.get(d.font) ?? 0) + 1);
          if (Array.isArray(d.blocks)) countFonts(d.blocks as ImportedBlock[]);
          if (Array.isArray(d.columns)) for (const c of d.columns as Array<{ blocks?: ImportedBlock[] }>) countFonts(c.blocks ?? []);
        }
      };
      countFonts(pages[0].blocks);
      funnelFont = [...fontCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    }

    const name = (pages[0].title || "Tunnel importé").slice(0, 120);
    let slug = slugify(name);
    if (await prisma.salesFunnel.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const funnel = await prisma.salesFunnel.create({
      data: {
        instructeurId: ctx.instructeurId,
        shopId: activeShopId,
        name,
        slug,
        description: `Importé depuis ${parsedUrls[0].hostname} (${pages.length} page${pages.length > 1 ? "s" : ""})`,
        isActive: false, // brouillon : le vendeur relit, attache son produit puis active
        ...(funnelFont || funnelBg
          ? { theme: { ...(funnelFont ? { font: funnelFont } : {}), ...(funnelBg ? { bgColor: funnelBg } : {}) } }
          : {}),
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
    // Compte récursif des rangées (colonnes) reproduites — diagnostic fidélité.
    const countRows = (bs: ImportedBlock[]): number => bs.reduce((n, b) => {
      const d = b.data as Record<string, unknown>;
      let sub = 0;
      if (Array.isArray(d.blocks)) sub += countRows(d.blocks as ImportedBlock[]);
      if (Array.isArray(d.columns)) sub += (d.columns as Array<{ blocks: ImportedBlock[] }>).reduce((m, c) => m + countRows(c.blocks ?? []), 0);
      return n + (b.type === "row" ? 1 : 0) + sub;
    }, 0);
    const rowsCount = pages.reduce((n, p) => n + countRows(p.blocks), 0);
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
        rowsCount,
        engine: pages.every((p) => p.engine === "browser") ? "browser" : pages.some((p) => p.engine === "browser") ? "mixed" : "static",
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
