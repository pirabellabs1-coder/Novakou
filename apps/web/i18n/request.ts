import { getRequestConfig } from "next-intl/server";

const SUPPORTED_LOCALES = ["fr", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupported(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Locale du rendu serveur : le français, sauf si une page la fixe elle-même
 * via `setRequestLocale()`.
 *
 * ⚠️ NE JAMAIS lire `cookies()` (ni `headers()`) ici. Ce fichier est exécuté
 * par le layout racine, donc pour TOUTES les pages : une seule lecture de
 * cookie rendait l'intégralité du site dynamique. Chaque visite — y compris
 * celles des pubs et des robots — recalculait la page sur une fonction
 * Vercel : ~72 h de CPU et 104 Go de transfert sur un mois (facture du
 * 2026-10), alors que les `revalidate` déjà posés sur l'accueil, les
 * boutiques et les guides n'avaient AUCUN effet.
 *
 * Aucun composant n'affiche de texte traduit (le contenu est en français dans
 * le code) : la locale ne pilote que le titre et la description par défaut du
 * site. Le français est la langue du produit et de son marché.
 */
//
// ⚠️ Ne pas lire non plus `requestLocale` : dans next-intl 3.x, sans appel à
// `setRequestLocale()`, ce getter lit l'en-tête X-NEXT-INTL-LOCALE via
// `headers()` — même effet que le cookie, tout redevient dynamique.
const LOCALE: SupportedLocale = "fr";

export default getRequestConfig(async () => {
  const locale: SupportedLocale = isSupported(LOCALE) ? LOCALE : "fr";

  const messages = (await import(`../messages/${locale}.json`)).default;
  const fallbackMessages = locale !== "fr"
    ? (await import(`../messages/fr.json`)).default
    : undefined;

  return {
    locale,
    messages: fallbackMessages ? { ...fallbackMessages, ...messages } : messages,
  };
});
