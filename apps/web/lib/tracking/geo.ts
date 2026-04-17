import type { NextRequest } from "next/server";

/**
 * Extracts the visitor ISO-3166-1 alpha-2 country code from an incoming request.
 *
 * Order of precedence:
 *  1. Vercel edge header `x-vercel-ip-country`
 *  2. Cloudflare edge header `cf-ipcountry`
 *  3. Generic `x-country` header (custom proxies)
 *  4. `undefined` — callers may fall back to a paid IP-geolocation API in prod
 *
 * Returns uppercase 2-letter code, or undefined when unknown / local dev.
 */
export function getCountryFromRequest(req: Request | NextRequest): string | undefined {
  const h = req.headers;
  const raw =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country") ||
    undefined;
  if (!raw) return undefined;
  const code = raw.trim().toUpperCase();
  if (code === "XX" || code === "T1" || code.length !== 2) return undefined;
  return code;
}

/**
 * Converts an ISO-3166-1 alpha-2 code into the corresponding flag emoji.
 * Returns an empty string for unknown / invalid codes.
 */
export function countryToFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const base = 0x1f1e6;
  const up = code.toUpperCase();
  return String.fromCodePoint(base + (up.charCodeAt(0) - 65)) +
         String.fromCodePoint(base + (up.charCodeAt(1) - 65));
}

const COUNTRY_NAMES_FR: Record<string, string> = {
  SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun", ML: "Mali", BF: "Burkina Faso",
  TG: "Togo", BJ: "Bénin", GA: "Gabon", CG: "Congo", CD: "RD Congo", NE: "Niger",
  GN: "Guinée", MG: "Madagascar", MA: "Maroc", TN: "Tunisie", DZ: "Algérie",
  FR: "France", BE: "Belgique", CH: "Suisse", LU: "Luxembourg", CA: "Canada",
  US: "États-Unis", GB: "Royaume-Uni", DE: "Allemagne", ES: "Espagne", IT: "Italie",
  PT: "Portugal", NL: "Pays-Bas", NG: "Nigeria", GH: "Ghana", KE: "Kenya",
  RW: "Rwanda", ZA: "Afrique du Sud", AE: "Émirats arabes unis", SA: "Arabie saoudite",
};

export function countryName(code: string | null | undefined): string {
  if (!code) return "Inconnu";
  return COUNTRY_NAMES_FR[code.toUpperCase()] || code.toUpperCase();
}
