/**
 * Moteur de thèmes & d'harmonisation des tunnels de vente Novakou.
 *
 * À partir d'UNE couleur de marque choisie par le créateur, génère toute la
 * palette harmonieuse d'un tunnel (primaire, survol, profond, nuit, teintes,
 * neutres teintés) et garantit un contraste WCAG AA pour le texte sur la
 * primaire — en assombrissant la primaire si nécessaire.
 *
 * Module PUR (aucune dépendance UI/DOM) : réutilisable côté serveur, dans le
 * builder et au rendu public. Toutes les couleurs sont des chaînes hex `#RRGGBB`.
 */

export interface FunnelPalette {
  /** Couleur d'action principale (boutons, liens, accents). AA garanti avec textOnPrimary. */
  primary: string;
  /** Variante vive de la primaire, pour les dégradés (JAMAIS une 2e couleur concurrente). */
  accent: string;
  /** Survol des boutons (primaire assombrie). */
  primaryHover: string;
  /** Sections sombres / héros de vente. */
  deep: string;
  /** Fonds les plus profonds / footer. */
  night: string;
  /** Fond de sections alternées (très clair). */
  tintLight: string;
  /** Bordures d'accents / badges (clair appuyé). */
  tintStrong: string;
  /** Texte principal (neutre foncé légèrement teinté). */
  ink: string;
  /** Texte secondaire. */
  grey: string;
  /** Bordures 1 px. */
  line: string;
  /** Texte lisible SUR la primaire (blanc ou encre), contraste AA garanti. */
  textOnPrimary: string;
  /** Rouge doux réservé à l'urgence/rareté (prix barrés, compteurs). */
  danger: string;
}

/* ─── Conversions couleur ─────────────────────────────────────── */

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function normalizeHex(input: string): string {
  let h = (input || "").trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#006E2F"; // repli vert Novakou
  return "#" + h.toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return ("#" + to(r) + to(g) + to(b)).toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/* ─── Contraste WCAG ──────────────────────────────────────────── */

function relLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste WCAG entre deux couleurs (1 → 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a), lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ─── Helpers de nuances (via HSL) ────────────────────────────── */

/** Décale la LUMINOSITÉ (points de L HSL). delta<0 assombrit. */
function shiftL(hex: string, deltaL: number): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  return hslToHex(h, s, clamp(l + deltaL, 0, 100));
}

/** Mélange une couleur avec du blanc (whitePct = % de blanc, 0..100). */
function mixWhite(hex: string, whitePct: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = clamp(whitePct, 0, 100) / 100;
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}

/** Neutre teinté vers la primaire : hue de la primaire, faible saturation, L cible. */
function tintedNeutral(primary: string, targetL: number, sat = 10): string {
  const [h] = rgbToHsl(...hexToRgb(primary));
  return hslToHex(h, sat, targetL);
}

const WHITE = "#FFFFFF";
const AA = 4.5;

/**
 * Assombrit la primaire jusqu'à ce que le blanc OU un encre foncé atteigne le
 * contraste AA, puis renvoie la primaire (éventuellement corrigée) + la couleur
 * de texte lisible dessus.
 */
function ensureAaPrimary(brand: string, ink: string): { primary: string; textOnPrimary: string } {
  let primary = brand;
  // 1) Si le blanc passe AA → texte blanc (cas le plus fréquent).
  if (contrastRatio(primary, WHITE) >= AA) return { primary, textOnPrimary: WHITE };
  // 2) Sinon si l'encre foncé passe AA (couleurs claires type jaune/or) → texte encre.
  if (contrastRatio(primary, ink) >= AA) return { primary, textOnPrimary: ink };
  // 3) Ton intermédiaire : on assombrit la primaire jusqu'à ce que le blanc passe AA.
  for (let i = 0; i < 40 && contrastRatio(primary, WHITE) < AA; i++) {
    primary = shiftL(primary, -2);
  }
  return { primary, textOnPrimary: WHITE };
}

/* ─── Génération de la palette ────────────────────────────────── */

/**
 * Génère une palette de tunnel harmonieuse et AA-safe à partir d'une couleur
 * de marque. Idempotent et déterministe.
 */
export function generatePalette(brandColor: string): FunnelPalette {
  const brand = normalizeHex(brandColor);
  const [bh] = rgbToHsl(...hexToRgb(brand));

  // Encre : neutre très foncé légèrement teinté vers la marque.
  const ink = tintedNeutral(brand, 7, 14);
  const { primary, textOnPrimary } = ensureAaPrimary(brand, ink);

  // Accent = même teinte, plus vive/claire (pour les dégradés). Reste dans la
  // même famille → aucune 2e couleur vive concurrente.
  const [ph, ps] = rgbToHsl(...hexToRgb(primary));
  const accent = hslToHex(ph, Math.min(100, ps + 6), Math.min(62, rgbToHsl(...hexToRgb(primary))[2] + 20));

  return {
    primary,
    accent,
    primaryHover: shiftL(primary, -8),
    deep: shiftL(primary, -Math.min(45, Math.max(20, rgbToHsl(...hexToRgb(primary))[2] - 12))),
    night: hslToHex(bh, 40, 9),
    tintLight: mixWhite(primary, 94),
    tintStrong: mixWhite(primary, 86),
    ink,
    grey: tintedNeutral(brand, 42, 8),
    line: tintedNeutral(brand, 91, 10),
    textOnPrimary,
    // Rouge d'urgence harmonisé (teinte chaude fixe, saturation modérée).
    danger: "#B4552F",
  };
}

/* ─── 8 palettes prêtes à l'emploi ────────────────────────────── */

export interface ThemePreset {
  key: string;
  label: string;
  brand: string;
  palette: FunnelPalette;
}

const PRESET_DEFS: Array<{ key: string; label: string; brand: string }> = [
  { key: "novakou", label: "Vert Novakou", brand: "#006E2F" },
  { key: "bleu-nuit", label: "Bleu nuit", brand: "#1D4ED8" },
  { key: "terracotta", label: "Terracotta", brand: "#C0562F" },
  { key: "violet", label: "Violet profond", brand: "#6D28D9" },
  { key: "or-sable", label: "Or sable", brand: "#B7791F" },
  { key: "bordeaux", label: "Bordeaux", brand: "#8B2942" },
  { key: "ocean", label: "Océan", brand: "#0E7490" },
  { key: "noir", label: "Noir premium", brand: "#1A1A1A" },
];

export const THEME_PRESETS: ThemePreset[] = PRESET_DEFS.map((p) => ({
  ...p,
  palette: generatePalette(p.brand),
}));

/** Retourne les variables CSS d'un thème (à injecter via style ou :root). */
export function paletteToCssVars(p: FunnelPalette): Record<string, string> {
  return {
    "--fn-primary": p.primary,
    "--fn-primary-hover": p.primaryHover,
    "--fn-deep": p.deep,
    "--fn-night": p.night,
    "--fn-tint": p.tintLight,
    "--fn-tint-strong": p.tintStrong,
    "--fn-ink": p.ink,
    "--fn-grey": p.grey,
    "--fn-line": p.line,
    "--fn-on-primary": p.textOnPrimary,
    "--fn-danger": p.danger,
  };
}
