/**
 * Polices auto-hébergées (next/font/local), déclarées UNE fois.
 *
 * Elles passaient par next/font/google, appelé séparément dans quatre
 * layouts/pages : Google Fonts devait répondre à chaque build, et la CI
 * GitHub échouait à tous les coups depuis le 4 septembre 2026 (« Cannot read
 * properties of null » dans le chargeur Google). Fichiers variables, sous-
 * ensemble latin (accents français, œ, €, guillemets inclus), servis depuis
 * notre domaine : plus de dépendance réseau au build, plus de requête tierce
 * pour le visiteur.
 */
import localFont from "next/font/local";

/** Corps de texte des espaces (variable --font-inter, cf. globals.css). */
export const inter = localFont({
  src: "../app/fonts/inter-latin-wght.woff2",
  weight: "400 800",
  display: "swap",
  variable: "--font-inter",
});

/** Police par défaut du site (layout racine). */
export const manrope = localFont({
  src: "../app/fonts/manrope-latin-wght.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope",
});

/** Titres de la page d'accueil. */
export const sora = localFont({
  src: "../app/fonts/sora-latin-wght.woff2",
  weight: "100 800",
  display: "swap",
  variable: "--font-sora",
});
