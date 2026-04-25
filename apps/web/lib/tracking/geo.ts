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
