/**
 * Geo utilities — country flags and names.
 * Minimal version kept for formations dashboard usage.
 */

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: "\u{1F1E7}\u{1F1EF}", SN: "\u{1F1F8}\u{1F1F3}", CI: "\u{1F1E8}\u{1F1EE}",
  TG: "\u{1F1F9}\u{1F1EC}", ML: "\u{1F1F2}\u{1F1F1}", BF: "\u{1F1E7}\u{1F1EB}",
  CM: "\u{1F1E8}\u{1F1F2}", GN: "\u{1F1EC}\u{1F1F3}", NE: "\u{1F1F3}\u{1F1EA}",
  TD: "\u{1F1F9}\u{1F1E9}", GA: "\u{1F1EC}\u{1F1E6}", CG: "\u{1F1E8}\u{1F1EC}",
  CD: "\u{1F1E8}\u{1F1E9}", MG: "\u{1F1F2}\u{1F1EC}", FR: "\u{1F1EB}\u{1F1F7}",
  BE: "\u{1F1E7}\u{1F1EA}", CH: "\u{1F1E8}\u{1F1ED}", CA: "\u{1F1E8}\u{1F1E6}",
  US: "\u{1F1FA}\u{1F1F8}", GB: "\u{1F1EC}\u{1F1E7}", DE: "\u{1F1E9}\u{1F1EA}",
  MA: "\u{1F1F2}\u{1F1E6}", TN: "\u{1F1F9}\u{1F1F3}", DZ: "\u{1F1E9}\u{1F1FF}",
  NG: "\u{1F1F3}\u{1F1EC}", GH: "\u{1F1EC}\u{1F1ED}", KE: "\u{1F1F0}\u{1F1EA}",
  RW: "\u{1F1F7}\u{1F1FC}",
};

const COUNTRY_NAMES: Record<string, string> = {
  BJ: "Bénin", SN: "Sénégal", CI: "Côte d'Ivoire", TG: "Togo", ML: "Mali",
  BF: "Burkina Faso", CM: "Cameroun", GN: "Guinée", NE: "Niger", TD: "Tchad",
  GA: "Gabon", CG: "Congo", CD: "RD Congo", MG: "Madagascar", FR: "France",
  BE: "Belgique", CH: "Suisse", CA: "Canada", US: "États-Unis", GB: "Royaume-Uni",
  DE: "Allemagne", MA: "Maroc", TN: "Tunisie", DZ: "Algérie", NG: "Nigeria",
  GH: "Ghana", KE: "Kenya", RW: "Rwanda",
};

export function countryToFlag(code: string | null | undefined): string {
  if (!code) return "\u{1F30D}";
  return COUNTRY_FLAGS[code.toUpperCase()] ?? "\u{1F30D}";
}

export function countryName(code: string | null | undefined): string {
  if (!code) return "Inconnu";
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

/** Nom -> forme comparable : sans accents, minuscule, lettres seules. */
function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

// Table inverse nom -> code ISO-2, construite depuis COUNTRY_NAMES + alias
// fréquents (variantes FR/EN, sans accent). Sert à réconcilier des valeurs
// `country` hétérogènes (certaines en code « CI », d'autres en nom « Cameroun »).
const NAME_TO_CODE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [code, name] of Object.entries(COUNTRY_NAMES)) m[normalizeName(name)] = code;
  Object.assign(m, {
    "cote d ivoire": "CI", "ivory coast": "CI",
    "benin": "BJ", "senegal": "SN", "cameroun": "CM", "cameroon": "CM",
    "guinee": "GN", "guinea": "GN", "rd congo": "CD", "republique democratique du congo": "CD",
    "congo brazzaville": "CG", "congo": "CG",
    "etats unis": "US", "united states": "US", "usa": "US", "us": "US",
    "royaume uni": "GB", "united kingdom": "GB", "uk": "GB",
    "allemagne": "DE", "germany": "DE", "belgique": "BE", "belgium": "BE",
    "suisse": "CH", "switzerland": "CH", "maroc": "MA", "morocco": "MA",
    "nigeria": "NG", "ghana": "GH", "kenya": "KE", "rwanda": "RW",
    "burkina faso": "BF", "mali": "ML", "niger": "NE", "tchad": "TD", "chad": "TD",
    "gabon": "GA", "togo": "TG", "france": "FR", "canada": "CA",
  });
  return m;
})();

/**
 * Normalise une valeur `country` (code ISO-2 « CI » OU nom « Côte d'Ivoire »,
 * FR/EN, avec ou sans accents) vers un CODE ISO-2 majuscule, ou null si inconnu.
 * Indispensable pour fusionner les doublons et afficher un vrai drapeau.
 */
export function toIso2(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw || raw === "??") return null;
  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper; // déjà un code ISO-2
  return NAME_TO_CODE[normalizeName(raw)] ?? null;
}
