import type { CSSProperties } from "react";

/**
 * Couleur d'accent du vendeur (`VendorShop.themeColor`) déclinée en variables
 * CSS pour la vitrine. Tout est calculé ici, une fois, côté rendu : le CSS ne
 * fait ensuite que lire `--nkb-accent*`.
 *
 * Pourquoi calculer : un vendeur peut choisir un jaune pâle. Sans garde-fou,
 * ses boutons afficheraient du blanc sur jaune (illisible) et ses liens du
 * jaune sur blanc. On choisit donc la couleur du texte posé SUR l'accent, et
 * on assombrit l'accent quand il sert de texte, jusqu'à 4,5:1 (WCAG AA).
 */

export const ACCENT_DEFAUT = "#006e2f";

/** Style inline acceptant des variables `--x` en plus des propriétés standard. */
export type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

type Rgb = [number, number, number];

function hexVersRgb(hex: string): Rgb | null {
  const brut = hex.trim().replace(/^#/, "");
  const complet = brut.length === 3 ? brut.split("").map((c) => c + c).join("") : brut;
  if (!/^[0-9a-f]{6}$/i.test(complet)) return null;
  const n = parseInt(complet, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbVersHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Mélange `part` (0–1) de noir dans la couleur. */
function assombrir([r, g, b]: Rgb, part: number): Rgb {
  return [r * (1 - part), g * (1 - part), b * (1 - part)];
}

/** Luminance relative WCAG (0 = noir, 1 = blanc). */
function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contraste(l1: number, l2: number): number {
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

const LUM_BLANC = 1;
const LUM_ENCRE = luminance([14, 21, 18]); // #0e1512

/** Hex valide ou l'accent Novakou par défaut. */
export function normaliserAccent(couleur?: string | null): string {
  const rgb = couleur ? hexVersRgb(couleur) : null;
  return rgb ? rgbVersHex(rgb) : ACCENT_DEFAUT;
}

/** Variables CSS de l'accent, à poser sur la racine `.nkb`. */
export function accentVars(couleur?: string | null): StyleVars {
  const hex = normaliserAccent(couleur);
  const rgb = hexVersRgb(hex) as Rgb;
  const lum = luminance(rgb);

  // Texte posé SUR l'accent : blanc dès que le contraste le permet, sinon encre.
  const surAccent = contraste(LUM_BLANC, lum) >= 4.5 ? "#ffffff" : "#0e1512";

  // Accent utilisé COMME texte sur fond blanc : assombri par paliers jusqu'à AA.
  let encre = rgb;
  for (let i = 0; i < 8 && contraste(LUM_BLANC, luminance(encre)) < 4.5; i++) {
    encre = assombrir(encre, 0.12);
  }

  return {
    "--nkb-accent": hex,
    "--nkb-accent-rgb": rgb.map(Math.round).join(","),
    "--nkb-on-accent": surAccent,
    "--nkb-accent-hover": rgbVersHex(assombrir(rgb, 0.14)),
    "--nkb-accent-deep": rgbVersHex(assombrir(rgb, 0.58)),
    "--nkb-accent-ink": rgbVersHex(encre),
    // Anneau de focus : l'accent s'il se détache du blanc, sinon l'encre.
    "--nkb-focus": contraste(LUM_BLANC, lum) >= 3 ? hex : rgbVersHex([14, 21, 18]),
  };
}

// Exporté pour d'éventuels tests ; sans usage direct dans les composants.
export const _interne = { luminance, contraste, LUM_ENCRE };
