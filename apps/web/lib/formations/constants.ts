// Novakou — Constantes centralisées
// Valeur unique de la commission plateforme — utilisée partout

/** Pourcentage de commission prélevé par la plateforme sur chaque vente (5%). */
export const PLATFORM_COMMISSION_RATE = 0.05;

/** Pourcentage net reversé au vendeur (95%). */
export const VENDOR_NET_RATE = 1 - PLATFORM_COMMISSION_RATE;

/** Calcule le montant net que touche le vendeur sur une vente. */
export function vendorNetAmount(grossAmount: number): number {
  return Math.round(grossAmount * VENDOR_NET_RATE);
}

/** Calcule la commission plateforme. */
export function platformCommission(grossAmount: number): number {
  return Math.round(grossAmount * PLATFORM_COMMISSION_RATE);
}

/** Pourcentage affiché à l'humain. */
export const COMMISSION_PCT_DISPLAY = `${PLATFORM_COMMISSION_RATE * 100}%`;
export const VENDOR_PCT_DISPLAY = `${VENDOR_NET_RATE * 100}%`;
