// Utilitaires PDF partagés (pdf-lib) — palette Novakou, texte sûr, helpers de
// tracé. Extraits de la route facture (apprenant/commandes/[id]/invoice) pour
// être réutilisés par le reçu de paiement, sans dupliquer la mise en page.

import { rgb, type PDFPage, type PDFFont } from "pdf-lib";

// ── Palette Novakou ────────────────────────────────────────────────────
export const FOREST = rgb(0 / 255, 110 / 255, 47 / 255); // #006e2f
export const FOREST_LIGHT = rgb(34 / 255, 197 / 255, 94 / 255); // #22c55e
export const TEXT_DARK = rgb(25 / 255, 28 / 255, 30 / 255); // #191c1e
export const TEXT_MUTED = rgb(92 / 255, 100 / 255, 122 / 255); // #5c647a
export const TEXT_BORDER = rgb(220 / 255, 222 / 255, 230 / 255);
export const ROW_BG = rgb(245 / 255, 250 / 255, 247 / 255);
export const WHITE = rgb(1, 1, 1);

/**
 * Les fontes Standard (Helvetica/Times) ne portent pas tous les accents : on
 * translittère en ASCII pour les libellés, sinon pdf-lib jette « WinAnsi cannot
 * encode ». Le contenu variable (titre produit, référence) passe aussi par ici.
 */
export function asciiSafe(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/'/g, "'")
    .replace(/«|»/g, '"')
    .replace(/€/g, "EUR")
    // Tout caractère hors Latin-1 imprimable → remplacé, pour ne jamais planter.
    .replace(/[^\x20-\xFF]/g, "?");
}

export function formatXof(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
}

export function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  options: {
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
    align?: "left" | "right" | "center";
    maxWidth?: number;
  },
) {
  const { font, size, color = TEXT_DARK, align = "left", maxWidth } = options;
  let textToDraw = asciiSafe(text);
  if (maxWidth) {
    while (font.widthOfTextAtSize(textToDraw, size) > maxWidth && textToDraw.length > 4) {
      textToDraw = textToDraw.slice(0, -2) + "…";
    }
  }
  let drawX = x;
  if (align === "right") drawX = x - font.widthOfTextAtSize(textToDraw, size);
  else if (align === "center") drawX = x - font.widthOfTextAtSize(textToDraw, size) / 2;
  page.drawText(textToDraw, { x: drawX, y, size, font, color });
}
