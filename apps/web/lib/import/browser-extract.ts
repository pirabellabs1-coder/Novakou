// ─────────────────────────────────────────────────────────────────────────
// Extraction d'une page via un VRAI navigateur (Chromium) : lit les styles
// CALCULÉS de chaque élément (le navigateur résout tout le CSS, charge les
// images et le contenu JS). C'est la seule méthode fidèle pour importer les
// couleurs, fonds, bordures, images et vidéos exactes d'un tunnel externe.
//
// Local : Chrome installé (channel "chrome"). Prod (Vercel) : @sparticuz/chromium.
// ─────────────────────────────────────────────────────────────────────────
import type { Browser } from "playwright-core";

export type ExtractedBlock = { id: string; type: string; data: Record<string, unknown> };
export type BrowserExtractResult = { blocks: ExtractedBlock[]; title: string; sections: number };

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core");
  const serverless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL === "1";
  if (serverless) {
    const chromiumPkg = (await import("@sparticuz/chromium")).default as {
      args: string[];
      executablePath: () => Promise<string>;
      setGraphicsMode?: boolean;
    };
    // Réduire l'empreinte mémoire (pas de WebGL/graphique).
    try { chromiumPkg.setGraphicsMode = false; } catch { /* noop */ }
    const executablePath = await chromiumPkg.executablePath();
    return chromium.launch({
      args: [...chromiumPkg.args, "--disable-dev-shm-usage", "--no-sandbox"],
      executablePath,
      headless: true,
    });
  }
  // Environnement local : Chrome du système.
  return chromium.launch({ channel: "chrome", headless: true });
}

/**
 * Rend `url` dans un navigateur, attend le chargement + le lazy-load des
 * images/vidéos, puis extrait un arbre de blocs Novakou depuis les styles
 * calculés. Renvoie null si le navigateur échoue (l'appelant retombe alors sur
 * l'analyse HTML statique).
 */
export async function extractViaBrowser(url: string): Promise<BrowserExtractResult | null> {
  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      locale: "fr-FR",
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 }).catch(async () => {
      await page.goto(url, { waitUntil: "load", timeout: 45_000 });
    });
    await page.waitForTimeout(2500);
    // Défilement pour déclencher le lazy-load (images/vidéos), puis retour en haut.
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);

    const result = (await page.evaluate(EXTRACT_FN)) as BrowserExtractResult;
    await browser.close();
    browser = null;
    if (!result || !Array.isArray(result.blocks) || result.blocks.length < 2) return null;
    return result;
  } catch (err) {
    console.error("[browser-extract]", err);
    try { await browser?.close(); } catch { /* noop */ }
    return null;
  }
}

// ── Fonction exécutée DANS la page (contexte navigateur, accès à document/CSS) ──
// Autonome (pas d'imports). Doit rester sérialisable par Playwright.
const EXTRACT_FN = () => {
  const clean = (s: string) => (s || "").replace(/\s+/g, " ").trim();
  const px = (v: string) => { const m = (v || "").match(/([\d.]+)px/); return m ? Math.round(parseFloat(m[1])) : null; };
  const usable = (v: string | null) => { if (!v) return null; const c = v.trim(); if (c === "transparent" || /rgba?\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c)) return null; return /^(rgb|hsl|#)/.test(c) ? c : null; };
  const lum = (c: string | null) => { const m = (c || "").match(/[\d.]+/g); if (!m) return null; return (0.2126 * +m[0] + 0.7152 * +m[1] + 0.0722 * +m[2]) / 255; };
  const absU = (u: string) => { try { return new URL(u, location.href).href; } catch { return u; } };
  const rid = (t: string) => "b_" + t + "_" + Math.random().toString(36).slice(2, 9);
  const BOIL = /^\s*(cookie|mentions? légales|politique de confidentialité|conditions générales|tous droits réservés|©|propulsé par|powered by)/i;
  const INLINE = new Set(["SPAN", "B", "I", "EM", "STRONG", "A", "BR", "SMALL", "U", "MARK", "SUB", "SUP", "FONT", "SVG", "PATH"]);
  const vis = (el: Element) => { const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.05) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };

  const bgOf = (el: Element) => {
    const cs = getComputedStyle(el);
    const color = usable(cs.backgroundColor);
    const bi = cs.backgroundImage || "";
    let image: string | null = null, gradient: string | null = null;
    if (bi && bi !== "none") {
      for (const L of bi.split(/,(?![^(]*\))/)) {
        const g = L.match(/(?:linear|radial)-gradient\([^]*\)/); if (g && !gradient) gradient = g[0];
        const u = L.match(/url\(["']?([^"')]+)["']?\)/);
        if (u && !image && !/gradient/.test(L)) { const a = absU(u[1]); if (!/logo|favicon|sprite/i.test(a) && !a.startsWith("data:")) image = a; }
      }
    }
    return { color: gradient || color, image };
  };
  const colorOf = (el: Element) => { let cur: Element | null = el; for (let i = 0; i < 6 && cur; i++) { const c = usable(getComputedStyle(cur).color); if (c) return c; cur = cur.parentElement; } return null; };
  const alignOf = (el: Element) => { const a = getComputedStyle(el).textAlign; return ["center", "right", "left"].includes(a) ? a : null; };

  const detectCols = (el: Element): Element[][] | null => {
    const cs = getComputedStyle(el);
    const kids = [...el.children].filter((c) => vis(c) && (clean(c.textContent || "").length > 6 || c.querySelector("img,iframe,video")));
    if (kids.length < 2) return null;
    if (cs.display.includes("grid")) {
      const tracks = cs.gridTemplateColumns.split(" ").filter((x) => x && x !== "0px").length;
      if (tracks >= 2 && tracks <= 4) { const cols: Element[][] = Array.from({ length: tracks }, () => []); kids.forEach((k, i) => cols[i % tracks].push(k)); return cols; }
      return null;
    }
    if (cs.display.includes("flex") && !cs.flexDirection.includes("column") && kids.length >= 2 && kids.length <= 4) return kids.map((k) => [k]);
    return null;
  };

  const seen = new Set<string>();
  let budget = 140;
  const isTextLeaf = (el: Element) => { for (const c of el.children) { if (INLINE.has(c.tagName)) continue; if (clean(c.textContent || "").length > 0) return false; if (c.querySelector && c.querySelector("img,iframe,video")) return false; } return clean(el.textContent || "").length > 0; };

  type B = { id: string; type: string; data: Record<string, unknown> };
  const extract = (el: Element, allowCols: boolean, depth: number): B[] => {
    if (budget <= 0 || depth > 45 || !vis(el)) return [];
    const tag = el.tagName;
    const cs = getComputedStyle(el);

    if (tag === "IMG") {
      const img = el as HTMLImageElement;
      let src = img.currentSrc || img.src || img.getAttribute("data-src") || "";
      if (!src || src.startsWith("data:")) return [];
      src = absU(src);
      if (/logo|favicon|sprite|pixel/i.test(src)) return [];
      const r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 40) return [];
      if (seen.has("img:" + src)) return []; seen.add("img:" + src); budget--;
      return [{ id: rid("image"), type: "image", data: { url: src, alt: clean(img.alt), align: "center", radius: px(cs.borderTopLeftRadius) ?? 12 } }];
    }
    if (tag === "IFRAME") {
      const s = (el as HTMLIFrameElement).src || "";
      if (/youtube|youtu\.be|vimeo|wistia|loom/i.test(s)) { budget--; return [{ id: rid("video"), type: "video", data: { url: s.startsWith("//") ? "https:" + s : s } }]; }
      return [];
    }
    if (tag === "VIDEO") {
      const s = (el as HTMLVideoElement).currentSrc || el.querySelector("source")?.getAttribute("src");
      if (s) { budget--; return [{ id: rid("video"), type: "video", data: { url: absU(s) } }]; }
      return [];
    }
    if (tag === "INPUT") {
      const inp = el as HTMLInputElement;
      if (inp.type === "email" || (inp.name || "").includes("email")) { if (seen.has("form")) return []; seen.add("form"); budget--; return [{ id: rid("lf"), type: "lead-form", data: { title: "Recevez votre accès", buttonText: "Je m'inscris", collectName: true, collectPhone: false, confetti: true } }]; }
      return [];
    }
    const looksBtn = tag === "BUTTON" || (tag === "A" && /\b(btn|button|cta)\b/i.test((el as HTMLElement).className || "")) || (tag === "A" && ["flex", "inline-flex", "inline-block", "block"].includes(cs.display) && (px(cs.paddingTop) ?? 0) >= 8 && !!usable(cs.backgroundColor));
    if (looksBtn) {
      const t = clean(el.textContent || ""); if (t.length < 2 || t.length > 60 || BOIL.test(t)) return [];
      if (seen.has("btn:" + t.toLowerCase())) return []; seen.add("btn:" + t.toLowerCase());
      const bg = bgOf(el); budget--;
      return [{ id: rid("btn"), type: "button", data: { text: t, link: "", style: "primary", size: "lg", align: "center", ...(bg.color ? { bgColor: bg.color } : {}), ...(usable(cs.color) ? { textColor: cs.color } : {}), _borderRadius: Math.min(px(cs.borderTopLeftRadius) ?? 8, 60) } }];
    }
    if (tag === "UL" || tag === "OL") {
      const items = [...el.querySelectorAll("li")].map((li) => clean(li.textContent || "")).filter((x) => x.length >= 3 && x.length <= 300 && !BOIL.test(x)).slice(0, 12);
      if (items.length >= 2) { const k = "ul:" + items[0]; if (!seen.has(k)) { seen.add(k); budget--; return [{ id: rid("list"), type: "list", data: { items, icon: "check_circle" } }]; } }
      return [];
    }
    if (/^H[1-6]$/.test(tag)) {
      const t = clean(el.textContent || ""); if (t.length < 2 || t.length > 220 || BOIL.test(t)) return [];
      const k = "t:" + t.slice(0, 80); if (seen.has(k)) return []; seen.add(k); const size = px(cs.fontSize); budget--;
      return [{ id: rid("h"), type: "heading", data: { content: t, level: +tag[1] <= 2 ? +tag[1] : 3, align: alignOf(el) ?? "left", ...(colorOf(el) ? { color: colorOf(el) } : {}), ...(size ? { size } : {}) } }];
    }
    if (allowCols) {
      const cols = detectCols(el);
      if (cols) {
        const columns = cols.map((ce) => ({ blocks: ce.flatMap((c) => extract(c, false, depth + 1)) }));
        if (columns.filter((c) => c.blocks.length).length >= 2) { budget--; return [{ id: rid("row"), type: "row", data: { columns, gap: 24, padding: 8, stackMobile: true } }]; }
        const flat = columns.flatMap((c) => c.blocks); if (flat.length) return flat;
      }
    }
    if ((tag === "P" || tag === "DIV" || tag === "SPAN" || tag === "LI" || tag === "LABEL") && isTextLeaf(el)) {
      const t = clean(el.textContent || ""); if (t.length < 2 || t.length > 900 || BOIL.test(t)) return [];
      const k = "t:" + t.slice(0, 80); if (seen.has(k)) return []; seen.add(k);
      const size = px(cs.fontSize); const w = parseInt(cs.fontWeight) || 400;
      const heading = (size !== null && size >= 22) || (w >= 600 && t.length <= 70); budget--; const color = colorOf(el);
      if (heading) return [{ id: rid("h"), type: "heading", data: { content: t, level: size && size >= 30 ? 2 : 3, align: alignOf(el) ?? "left", ...(color ? { color } : {}), ...(size ? { size } : {}) } }];
      return [{ id: rid("p"), type: "text", data: { content: t, align: alignOf(el) ?? "left", size: size ?? 16, ...(color ? { color } : {}) } }];
    }
    const out: B[] = [];
    for (const c of el.children) { if (INLINE.has(c.tagName)) continue; out.push(...extract(c, allowCols, depth + 1)); if (budget <= 0) break; }
    return out;
  };

  let sections: Element[] = [...document.querySelectorAll("section")].filter(vis);
  if (sections.length < 2) {
    const root = document.querySelector("main") || document.body;
    sections = [...root.children].filter((c) => vis(c) && clean(c.textContent || "").length > 40);
  }
  sections = sections.filter((s) => !sections.some((o) => o !== s && o.contains(s)));

  const blocks: B[] = [];
  for (const sec of sections) {
    if (budget <= 0) break;
    const inner = extract(sec, true, 0);
    if (!inner.length) continue;
    const bg = bgOf(sec);
    let image = bg.image, color = bg.color, overlay = false;
    if (!image) { for (const d of sec.querySelectorAll("div")) { const b = bgOf(d); if (b.image) { image = b.image; break; } } }
    for (const d of sec.querySelectorAll("div")) { const c = usable(getComputedStyle(d).backgroundColor); if (c && /rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0?\.[1-9]/.test(c) && (lum(c) ?? 1) < 0.5) overlay = true; }
    const txtLums: number[] = [];
    const collect = (bs: B[]) => bs.forEach((b) => { const d = b.data as Record<string, unknown>; if (d.color && (b.type === "heading" || b.type === "text")) { const l = lum(d.color as string); if (l !== null) txtLums.push(l); } if (Array.isArray(d.columns)) (d.columns as Array<{ blocks: B[] }>).forEach((c) => collect(c.blocks)); if (Array.isArray(d.blocks)) collect(d.blocks as B[]); });
    collect(inner);
    const lightText = txtLums.length > 0 && txtLums.filter((l) => l > 0.6).length >= txtLums.length / 2;
    const bgLum = image ? (overlay ? 0.15 : 0.5) : lum(color);
    if (lightText && !image && (bgLum === null || bgLum > 0.5)) color = "#111827";
    const forceWhite = !!image && (overlay || lightText);
    const secText = usable(getComputedStyle(sec).color);
    const fix = (bs: B[], bl: number | null) => { if (bl === null) return; const target = bl < 0.5 ? "#ffffff" : "#111827"; bs.forEach((b) => { const d = b.data as Record<string, unknown>; if (Array.isArray(d.columns)) { (d.columns as Array<{ blocks: B[] }>).forEach((c) => fix(c.blocks, bl)); return; } if (Array.isArray(d.blocks)) { fix(d.blocks as B[], bl); return; } if ((b.type === "heading" || b.type === "text") && d.color) { const l = lum(d.color as string); if (l !== null && Math.abs(l - bl) < 0.4) d.color = target; } }); };
    fix(inner, image ? (forceWhite ? 0.12 : 0.5) : lum(color));
    if (color || image) {
      blocks.push({ id: rid("section"), type: "section", data: { blocks: inner, ...(image ? { bgColor: color || "#111827", bgImage: image } : color ? { bgColor: color } : {}), ...(image && (overlay || forceWhite) ? { overlayColor: "rgba(0,0,0,0.55)" } : {}), ...(forceWhite ? { textColor: "#ffffff" } : secText ? { textColor: secText } : {}), paddingY: 56, paddingX: 16, maxWidth: 1152 } });
    } else {
      blocks.push(...inner);
    }
  }
  return { blocks, title: document.title, sections: sections.length };
};
