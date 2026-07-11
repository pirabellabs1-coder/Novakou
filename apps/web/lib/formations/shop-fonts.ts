/**
 * Polices sélectionnables par le vendeur pour SA boutique (pages boutique +
 * pages statiques + pages produit de sa boutique).
 */
export const SHOP_FONTS = [
  "Inter", "Manrope", "Poppins", "Montserrat", "Nunito", "Raleway",
  "DM Sans", "Plus Jakarta Sans", "Outfit", "Space Grotesk",
  "Playfair Display", "Lora",
] as const;

export type ShopFont = (typeof SHOP_FONTS)[number];

const SERIF = new Set(["Playfair Display", "Lora"]);

/** Famille CSS complète (avec repli) pour une police donnée. */
export function shopFontStack(font?: string | null): string {
  const f = font && (SHOP_FONTS as readonly string[]).includes(font) ? font : "Inter";
  return `'${f}', ${SERIF.has(f) ? "serif" : "sans-serif"}`;
}

/**
 * URL Google Fonts à charger pour la police choisie (null pour Inter, déjà
 * embarquée via next/font, ou police inconnue).
 */
export function shopFontHref(font?: string | null): string | null {
  if (!font || !(SHOP_FONTS as readonly string[]).includes(font) || font === "Inter") return null;
  const fam = font.replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${fam}:wght@400;500;600;700;800&display=swap`;
}
