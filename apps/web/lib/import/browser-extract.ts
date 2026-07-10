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
export type BrowserExtractResult = { blocks: ExtractedBlock[]; title: string; sections: number; pageFont: string | null; pageBg: string | null };

// Dernière erreur du navigateur (diagnostic — exposé temporairement dans l'API).
export let lastBrowserError: string | null = null;

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
  lastBrowserError = null;
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
    return { ...result, pageFont: result.pageFont ?? null, pageBg: result.pageBg ?? null };
  } catch (err) {
    lastBrowserError = err instanceof Error ? `${err.message}`.slice(0, 300) : String(err).slice(0, 300);
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
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const usable = (v: string | null) => { if (!v) return null; const c = v.trim(); if (c === "transparent" || /rgba?\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c)) return null; return /^(rgb|hsl|#)/.test(c) ? c : null; };
  const lum = (c: string | null) => { const m = (c || "").match(/[\d.]+/g); if (!m) return null; return (0.2126 * +m[0] + 0.7152 * +m[1] + 0.0722 * +m[2]) / 255; };
  const absU = (u: string) => { try { return new URL(u, location.href).href; } catch { return u; } };
  const rid = (t: string) => "b_" + t + "_" + Math.random().toString(36).slice(2, 9);
  const BOIL = /^\s*(cookie|mentions? légales|politique de confidentialité|conditions générales|tous droits réservés|©|propulsé par|powered by)/i;
  const INLINE = new Set(["SPAN", "B", "I", "EM", "STRONG", "A", "BR", "SMALL", "U", "MARK", "SUB", "SUP", "FONT", "SVG", "PATH"]);
  const vis = (el: Element) => { const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.05) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };

  // ── Polices : mapping casse-insensible vers les 12 polices supportées ──
  const FONTS = ["Manrope", "Inter", "DM Sans", "Poppins", "Montserrat", "Raleway", "Playfair Display", "Lora", "Nunito", "Space Grotesk", "Outfit", "Plus Jakarta Sans"];
  const mapFont = (ff: string): string | null => {
    const first = (ff || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    if (!first) return null;
    for (const f of FONTS) { if (f.toLowerCase() === first) return f; }
    return null;
  };
  const fontOf = (el: Element) => mapFont(getComputedStyle(el).fontFamily);
  const pageFont = mapFont(getComputedStyle(document.body).fontFamily);
  // Fond de PAGE → deviendra theme.bgColor du tunnel. Cascade : body → html →
  // wrapper racine pleine page → blanc (rendu réel d'un body transparent).
  let pageBg = usable(getComputedStyle(document.body).backgroundColor) || usable(getComputedStyle(document.documentElement).backgroundColor);
  if (!pageBg) {
    for (const c of document.body.children) {
      if (!vis(c)) continue;
      const r = c.getBoundingClientRect();
      if (r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.6) {
        const b = usable(getComputedStyle(c).backgroundColor);
        if (b) { pageBg = b; break; }
      }
    }
  }
  if (!pageBg) pageBg = "rgb(255, 255, 255)";

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

  // ── Ombre calculée → palier du contrat ("none" | "sm" | "md" | "lg") ──
  const shadowOf = (cs: CSSStyleDeclaration): string => {
    const bs = cs.boxShadow || "";
    if (!bs || bs === "none") return "none";
    let blur = 0;
    const re = /(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(bs))) blur = Math.max(blur, parseFloat(m[3]));
    if (blur < 10) return "sm";
    if (blur < 25) return "md";
    return "lg";
  };

  // ── Texte riche : fragments stylés (couleur/gras/italique) d'un bloc texte ──
  // N'émet un tableau que s'il existe au moins 2 fragments de styles distincts.
  type Span = { t: string; c?: string; b?: boolean; i?: boolean };
  const spanify = (el: Element): Span[] | null => {
    const base = getComputedStyle(el);
    const baseC = usable(base.color);
    const baseW = parseInt(base.fontWeight) || 400;
    const frags: Span[] = [];
    const walk = (n: Node): void => {
      if (n.nodeType === Node.TEXT_NODE) {
        const t = (n.textContent || "").replace(/\s+/g, " ");
        if (!t) return;
        // Espace pur : le rattacher au fragment précédent (le style d'un espace est invisible).
        if (!t.trim()) { const prev = frags[frags.length - 1]; if (prev && !prev.t.endsWith(" ")) prev.t += " "; return; }
        const p = n.parentElement; if (!p) return;
        const cs = getComputedStyle(p);
        const c = usable(cs.color);
        const w = parseInt(cs.fontWeight) || 400;
        const s: Span = { t };
        if (c && c !== baseC) s.c = c;
        if (w >= 600 && w > baseW) s.b = true;
        if (cs.fontStyle === "italic" && base.fontStyle !== "italic") s.i = true;
        const prev = frags[frags.length - 1];
        if (prev && prev.c === s.c && prev.b === s.b && prev.i === s.i) prev.t += s.t;
        else frags.push(s);
        return;
      }
      if (n.nodeType === Node.ELEMENT_NODE) {
        const e = n as Element;
        if (e.tagName === "BR") { const prev = frags[frags.length - 1]; if (prev && !prev.t.endsWith(" ")) prev.t += " "; return; }
        if (e.tagName === "SCRIPT" || e.tagName === "STYLE") return;
        for (const c of e.childNodes) walk(c);
      }
    };
    for (const c of el.childNodes) walk(c);
    while (frags.length && !frags[0].t.trim()) frags.shift();
    if (frags.length) {
      frags[0].t = frags[0].t.replace(/^\s+/, "");
      const last = frags[frags.length - 1];
      last.t = last.t.replace(/\s+$/, "");
      if (!last.t) frags.pop();
    }
    if (frags.length < 2) return null;
    const sig = (s: Span) => (s.c || "") + "|" + (s.b ? 1 : 0) + "|" + (s.i ? 1 : 0);
    if (new Set(frags.map(sig)).size < 2) return null;
    return frags;
  };

  // ── Bouton/CTA : détection partagée (balise, classe ou aspect calculé) ──
  const isBtnEl = (el: Element): boolean => {
    const tag = el.tagName;
    if (tag === "BUTTON") return true;
    if (tag !== "A") return false;
    if (/\b(btn|button|cta)\b/i.test((el as HTMLElement).className || "")) return true;
    const cs = getComputedStyle(el);
    return ["flex", "inline-flex", "inline-block", "block"].includes(cs.display) && (px(cs.paddingTop) ?? 0) >= 8 && !!usable(cs.backgroundColor);
  };

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
  // Répétitions LÉGITIMES (le même CTA « S'INSCRIRE » revient souvent 4-5×
  // sur une page de vente) : compteur avec plafond au lieu d'un dédoublonnage
  // strict. Les variantes desktop/mobile cachées sont déjà écartées par vis().
  const times = new Map<string, number>();
  const over = (k: string, max: number) => { const n = (times.get(k) ?? 0) + 1; times.set(k, n); return n > max; };
  let budget = 240;
  const isTextLeaf = (el: Element) => { for (const c of el.children) { if (INLINE.has(c.tagName)) continue; if (clean(c.textContent || "").length > 0) return false; if (c.querySelector && c.querySelector("img,iframe,video")) return false; } return clean(el.textContent || "").length > 0; };

  type B = { id: string; type: string; data: Record<string, unknown> };

  // ── Feuille de texte → bloc heading/text (avec spans + police par bloc) ──
  const textBlocks = (el: Element, cs: CSSStyleDeclaration): B[] => {
    const t = clean(el.textContent || ""); if (t.length < 2 || t.length > 900 || BOIL.test(t)) return [];
    const k = "t:" + t.slice(0, 80); if (over(k, 3)) return [];
    const size = px(cs.fontSize); const w = parseInt(cs.fontWeight) || 400;
    const heading = (size !== null && size >= 22) || (w >= 600 && t.length <= 70); budget--; const color = colorOf(el);
    const spans = spanify(el); const f = mapFont(cs.fontFamily);
    if (heading) return [{ id: rid("h"), type: "heading", data: { content: t, level: size && size >= 30 ? 2 : 3, align: alignOf(el) ?? "left", ...(color ? { color } : {}), ...(size ? { size } : {}), ...(spans ? { spans } : {}), ...(f ? { font: f } : {}) } }];
    return [{ id: rid("p"), type: "text", data: { content: t, align: alignOf(el) ?? "left", size: size ?? 16, ...(color ? { color } : {}), ...(spans ? { spans } : {}), ...(f && f !== pageFont ? { font: f } : {}) } }];
  };

  // ── Citation : bord gauche marqué + (italique OU fond propre) + texte court ──
  const quoteOf = (el: Element, cs: CSSStyleDeclaration): B[] | null => {
    const blw = px(cs.borderLeftWidth) ?? 0;
    if (blw < 2 || cs.borderLeftStyle === "none" || !usable(cs.borderLeftColor)) return null;
    const t = clean(el.textContent || "");
    if (t.length < 20 || t.length > 500 || BOIL.test(t)) return null;
    const italic = cs.fontStyle === "italic" || !!el.querySelector("em, i");
    const ownBg = usable(cs.backgroundColor);
    const parentBg = el.parentElement ? usable(getComputedStyle(el.parentElement).backgroundColor) : null;
    const bgDiff = !!ownBg && ownBg !== parentBg;
    if (!italic && !bgDiff) return null;
    const k = "t:" + t.slice(0, 80); if (over(k, 2)) return null; budget--;
    return [{ id: rid("q"), type: "quote", data: { text: t, author: "" } }];
  };

  // ── Carte : fond/bordure/ombre + arrondi + padding + contenu, jamais pleine page ──
  const isCard = (el: Element, depth: number): boolean => {
    if (depth < 1 || el.tagName !== "DIV") return false;
    const r = el.getBoundingClientRect();
    if (r.width >= 900 || r.width < 60) return false;
    const cs = getComputedStyle(el);
    if ((px(cs.borderTopLeftRadius) ?? 0) < 6) return false;
    const pads = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) => px(v) ?? 0);
    if (pads.reduce((a, b) => a + b, 0) / 4 < 8) return false;
    const bg = bgOf(el);
    const hasBorder = Math.round(parseFloat(cs.borderTopWidth) || 0) >= 1 && cs.borderTopStyle !== "none" && !!usable(cs.borderTopColor);
    if (!bg.color && !hasBorder && shadowOf(cs) === "none") return false;
    const t = clean(el.textContent || "");
    return (t.length >= 10 && t.length <= 1500) || !!el.querySelector("img");
  };
  const cardData = (el: Element, cs: CSSStyleDeclaration, inner: B[]): Record<string, unknown> => {
    const bg = bgOf(el);
    const bw = Math.round(parseFloat(cs.borderTopWidth) || 0);
    const bc = bw >= 1 && cs.borderTopStyle !== "none" ? usable(cs.borderTopColor) : null;
    const pads = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) => px(v) ?? 0);
    const parentC = el.parentElement ? usable(getComputedStyle(el.parentElement).color) : null;
    const ownC = usable(cs.color);
    return {
      blocks: inner,
      ...(bg.color ? { bgColor: bg.color } : {}),
      ...(bc ? { borderColor: bc } : {}),
      borderWidth: bc ? bw : 0,
      radius: clamp(px(cs.borderTopLeftRadius) ?? 0, 0, 60),
      padding: clamp(Math.round(pads.reduce((a, b) => a + b, 0) / 4), 8, 60),
      shadow: shadowOf(cs),
      ...(ownC && ownC !== parentC ? { textColor: ownC } : {}),
    };
  };

  const extract = (el: Element, allowCols: boolean, depth: number, allowCard = true): B[] => {
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
      if (over("img:" + src, 2)) return []; budget--;
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
    if (isBtnEl(el)) {
      // CTA à 1 ou 2 lignes : la ligne principale = la plus grosse police ;
      // le filtre de longueur (<= 60) ne s'applique QU'À la ligne principale.
      const zones: Array<{ t: string; s: number }> = [];
      const collectZones = (host: Element, d: number): void => {
        for (const c of host.children) {
          if (c.tagName === "SVG" || c.tagName === "PATH") continue;
          const zt = clean(c.textContent || "");
          if (!zt) continue;
          const sub = [...c.children].filter((k) => clean(k.textContent || "").length > 0);
          if (sub.length >= 2 && d < 2) collectZones(c, d + 1);
          else zones.push({ t: zt, s: px(getComputedStyle(c).fontSize) ?? 16 });
        }
      };
      collectZones(el, 0);
      let main = clean(el.textContent || "");
      let subText = "";
      if (zones.length >= 2) {
        const sizes = zones.map((z) => z.s);
        if (Math.max(...sizes) > Math.min(...sizes)) {
          const biggest = zones.reduce((a, b) => (b.s > a.s ? b : a));
          main = biggest.t;
          const rest = zones.filter((z) => z !== biggest).map((z) => z.t).join(" ").trim();
          if (rest && rest.length <= 90) subText = rest;
        }
      }
      if (main.length < 2 || main.length > 60 || BOIL.test(main)) return [];
      if (over("btn:" + main.toLowerCase(), 8)) return [];
      const bg = bgOf(el); budget--;
      return [{ id: rid("btn"), type: "button", data: { text: main, link: "", style: "primary", size: "lg", align: "center", ...(subText ? { subText } : {}), ...(bg.color ? { bgColor: bg.color } : {}), ...(usable(cs.color) ? { textColor: cs.color } : {}), _borderRadius: Math.min(px(cs.borderTopLeftRadius) ?? 8, 60) } }];
    }
    if (tag === "UL" || tag === "OL") {
      const items = [...el.querySelectorAll("li")].map((li) => clean(li.textContent || "")).filter((x) => x.length >= 3 && x.length <= 300 && !BOIL.test(x)).slice(0, 12);
      if (items.length >= 2) { const k = "ul:" + items[0]; if (!seen.has(k)) { seen.add(k); budget--; return [{ id: rid("list"), type: "list", data: { items, icon: "check_circle" } }]; } }
      return [];
    }
    if (/^H[1-6]$/.test(tag)) {
      const t = clean(el.textContent || ""); if (t.length < 2 || t.length > 220 || BOIL.test(t)) return [];
      const k = "t:" + t.slice(0, 80); if (over(k, 3)) return []; const size = px(cs.fontSize); budget--;
      const spans = spanify(el); const f = mapFont(cs.fontFamily);
      return [{ id: rid("h"), type: "heading", data: { content: t, level: +tag[1] <= 2 ? +tag[1] : 3, align: alignOf(el) ?? "left", ...(colorOf(el) ? { color: colorOf(el) } : {}), ...(size ? { size } : {}), ...(spans ? { spans } : {}), ...(f ? { font: f } : {}) } }];
    }
    if (tag === "P" || tag === "DIV" || tag === "BLOCKQUOTE") {
      const q = quoteOf(el, cs);
      if (q) return q;
    }
    if (allowCard && isCard(el, depth)) {
      // Carte : extraire ses enfants (colonnes autorisées, cartes interdites
      // dans sa descendance pour éviter la re-détection en cascade).
      const inner: B[] = [];
      if (isTextLeaf(el)) {
        inner.push(...textBlocks(el, cs));
      } else {
        for (const c of el.children) { if (INLINE.has(c.tagName)) continue; inner.push(...extract(c, true, depth + 1, false)); if (budget <= 0) break; }
      }
      if (inner.length) { budget--; return [{ id: rid("card"), type: "content-box", data: cardData(el, cs, inner) }]; }
    }
    if (allowCols) {
      const cols = detectCols(el);
      if (cols) {
        const columns = cols.map((ce) => ({ blocks: ce.flatMap((c) => extract(c, false, depth + 1, allowCard)) }));
        if (columns.filter((c) => c.blocks.length).length >= 2) { budget--; return [{ id: rid("row"), type: "row", data: { columns, gap: 24, padding: 8, stackMobile: true } }]; }
        const flat = columns.flatMap((c) => c.blocks); if (flat.length) return flat;
      }
    }
    if ((tag === "P" || tag === "DIV" || tag === "SPAN" || tag === "LI" || tag === "LABEL") && isTextLeaf(el)) {
      return textBlocks(el, cs);
    }
    const out: B[] = [];
    for (const c of el.children) { if (INLINE.has(c.tagName)) continue; out.push(...extract(c, allowCols, depth + 1, allowCard)); if (budget <= 0) break; }
    return out;
  };

  // ── En-tête : barre courte (logo/texte/bouton) → rangée simple, sans section ──
  const headerRow = (sec: Element): B | null => {
    const r = sec.getBoundingClientRect();
    if (r.height <= 0 || r.height >= 140) return null;
    let host: Element = sec;
    for (let i = 0; i < 3; i++) { const vk = [...host.children].filter(vis); if (vk.length === 1) host = vk[0]; else break; }
    const kids = [...host.children].filter((c) => vis(c) && (clean(c.textContent || "").length > 0 || !!c.querySelector("img")));
    if (kids.length < 2 || kids.length > 4) return null;
    const hasBtn = [...sec.querySelectorAll("a, button")].some((b) => vis(b) && isBtnEl(b));
    if (!hasBtn) return null;
    const columns = kids.map((k) => ({ blocks: extract(k, false, 1) }));
    if (!columns.some((c) => c.blocks.length)) return null;
    budget--;
    return { id: rid("row"), type: "row", data: { columns, gap: 24, padding: 8, stackMobile: true } };
  };

  let sections: Element[] = [...document.querySelectorAll("section")].filter(vis);
  sections = sections.filter((s) => !sections.some((o) => o !== s && o.contains(s)));
  const root0 = document.querySelector("main") || document.body;
  const root = sections.length && !sections.every((s) => root0.contains(s)) ? document.body : root0;
  if (sections.length >= 2) {
    // Ramasser AUSSI le contenu hors <section> (barres, bandes et pieds en <div>) :
    // descente depuis la racine — un conteneur qui renferme des <section> est
    // traversé, ses frères porteurs de contenu sont gardés, ordre du document.
    const tops: Element[] = [];
    const collectTops = (host: Element, depth: number): void => {
      if (depth > 8) return;
      for (const c of host.children) {
        if (!vis(c) || INLINE.has(c.tagName)) continue;
        if (sections.includes(c)) { tops.push(c); continue; }
        if (sections.some((s) => c.contains(s))) { collectTops(c, depth + 1); continue; }
        if (clean(c.textContent || "").length > 40 || !!c.querySelector("img,iframe,video")) tops.push(c);
      }
    };
    collectTops(root, 0);
    if (tops.length >= sections.length) sections = tops;
  } else {
    sections = [...root.children].filter((c) => vis(c) && clean(c.textContent || "").length > 40);
    sections = sections.filter((s) => !sections.some((o) => o !== s && o.contains(s)));
  }

  const blocks: B[] = [];
  let first = true;
  for (const sec of sections) {
    if (budget <= 0) break;
    if (first) {
      first = false;
      // Barre d'en-tête : rangée à N colonnes, sans habillage ni contraste forcé.
      const hr = headerRow(sec);
      if (hr) { blocks.push(hr); continue; }
    }
    const inner = extract(sec, true, 0);
    if (!inner.length) continue;
    const bg = bgOf(sec);
    let image = bg.image, color = bg.color, overlay = false;
    if (!image) { for (const d of sec.querySelectorAll("div")) { const b = bgOf(d); if (b.image) { image = b.image; break; } } }
    // Fond posé sur un wrapper INTERNE pleine largeur (styled-components pose
    // souvent la couleur sur un div enfant, pas sur la <section> elle-même).
    if (!color) {
      const sr = sec.getBoundingClientRect();
      for (const d of sec.querySelectorAll("div")) {
        if (!vis(d)) continue;
        const b = bgOf(d); if (!b.color) continue;
        const r = d.getBoundingClientRect();
        if (r.width >= sr.width * 0.85 && r.height >= sr.height * 0.6) { color = b.color; break; }
      }
    }
    // Fond posé sur un ANCÊTRE (section transparente dans un wrapper coloré).
    if (!color && !image) {
      let a: Element | null = sec.parentElement;
      while (a && a !== document.body) {
        const b = bgOf(a);
        if (b.color) { color = b.color; break; }
        if (b.image) { image = b.image; break; }
        a = a.parentElement;
      }
    }
    for (const d of sec.querySelectorAll("div")) { const c = usable(getComputedStyle(d).backgroundColor); if (c && /rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0?\.[1-9]/.test(c) && (lum(c) ?? 1) < 0.5) overlay = true; }
    const txtLums: number[] = [];
    // Les content-box ont leur propre fond : ne pas compter leur texte dans le contraste de la section.
    const collect = (bs: B[]) => bs.forEach((b) => { if (b.type === "content-box") return; const d = b.data as Record<string, unknown>; if (d.color && (b.type === "heading" || b.type === "text")) { const l = lum(d.color as string); if (l !== null) txtLums.push(l); } if (Array.isArray(d.columns)) (d.columns as Array<{ blocks: B[] }>).forEach((c) => collect(c.blocks)); if (Array.isArray(d.blocks)) collect(d.blocks as B[]); });
    collect(inner);
    const lightText = txtLums.length > 0 && txtLums.filter((l) => l > 0.6).length >= txtLums.length / 2;
    const bgLum = image ? (overlay ? 0.15 : 0.5) : lum(color);
    if (lightText && !image && (bgLum === null || bgLum > 0.5)) color = "#111827";
    const forceWhite = !!image && (overlay || lightText);
    const scs = getComputedStyle(sec);
    const secText = usable(scs.color);
    // Ne jamais recolorer l'intérieur d'une content-box : son fond est indépendant de la section.
    const fix = (bs: B[], bl: number | null) => { if (bl === null) return; const target = bl < 0.5 ? "#ffffff" : "#111827"; bs.forEach((b) => { if (b.type === "content-box") return; const d = b.data as Record<string, unknown>; if (Array.isArray(d.columns)) { (d.columns as Array<{ blocks: B[] }>).forEach((c) => fix(c.blocks, bl)); return; } if (Array.isArray(d.blocks)) { fix(d.blocks as B[], bl); return; } if ((b.type === "heading" || b.type === "text") && d.color) { const l = lum(d.color as string); if (l !== null && Math.abs(l - bl) < 0.4) d.color = target; } }); };
    fix(inner, image ? (forceWhite ? 0.12 : 0.5) : lum(color));
    const paddingY = clamp(px(scs.paddingTop) ?? 56, 16, 120);
    const paddingX = clamp(px(scs.paddingLeft) ?? 16, 0, 64);
    if (color || image) {
      blocks.push({ id: rid("section"), type: "section", data: { blocks: inner, ...(image ? { bgColor: color || "#111827", bgImage: image } : color ? { bgColor: color } : {}), ...(image && (overlay || forceWhite) ? { overlayColor: "rgba(0,0,0,0.55)" } : {}), ...(forceWhite ? { textColor: "#ffffff" } : secText ? { textColor: secText } : {}), paddingY, paddingX, maxWidth: 1152 } });
    } else {
      blocks.push(...inner);
    }
  }
  return { blocks, title: document.title, sections: sections.length, pageFont, pageBg };
};
