/**
 * Canonical list of all ISO-3166-1 countries with French names and flags.
 * Used in country selectors (profile settings, KYC, address forms, etc.).
 *
 * Order: African countries first (our primary market), then Europe/North America,
 * then the rest alphabetically. Keeps the UX fast for the typical user.
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  region: "Afrique" | "Europe" | "Amériques" | "Asie" | "Océanie" | "Moyen-Orient";
  dial: string; // e.g. "+221"
}

export const COUNTRIES: Country[] = [
  // ─── Afrique francophone (priorité) ─────────────────────────────────────
  { code: "SN", name: "Sénégal", region: "Afrique", dial: "+221" },
  { code: "CI", name: "Côte d'Ivoire", region: "Afrique", dial: "+225" },
  { code: "BJ", name: "Bénin", region: "Afrique", dial: "+229" },
  { code: "TG", name: "Togo", region: "Afrique", dial: "+228" },
  { code: "ML", name: "Mali", region: "Afrique", dial: "+223" },
  { code: "BF", name: "Burkina Faso", region: "Afrique", dial: "+226" },
  { code: "NE", name: "Niger", region: "Afrique", dial: "+227" },
  { code: "GN", name: "Guinée", region: "Afrique", dial: "+224" },
  { code: "CM", name: "Cameroun", region: "Afrique", dial: "+237" },
  { code: "GA", name: "Gabon", region: "Afrique", dial: "+241" },
  { code: "CG", name: "Congo", region: "Afrique", dial: "+242" },
  { code: "CD", name: "République démocratique du Congo", region: "Afrique", dial: "+243" },
  { code: "TD", name: "Tchad", region: "Afrique", dial: "+235" },
  { code: "CF", name: "République centrafricaine", region: "Afrique", dial: "+236" },
  { code: "GQ", name: "Guinée équatoriale", region: "Afrique", dial: "+240" },
  { code: "MG", name: "Madagascar", region: "Afrique", dial: "+261" },
  { code: "KM", name: "Comores", region: "Afrique", dial: "+269" },
  { code: "DJ", name: "Djibouti", region: "Afrique", dial: "+253" },
  { code: "BI", name: "Burundi", region: "Afrique", dial: "+257" },
  { code: "RW", name: "Rwanda", region: "Afrique", dial: "+250" },
  { code: "MR", name: "Mauritanie", region: "Afrique", dial: "+222" },
  // ─── Afrique du Nord ───────────────────────────────────────────────────
  { code: "MA", name: "Maroc", region: "Afrique", dial: "+212" },
  { code: "DZ", name: "Algérie", region: "Afrique", dial: "+213" },
  { code: "TN", name: "Tunisie", region: "Afrique", dial: "+216" },
  { code: "LY", name: "Libye", region: "Afrique", dial: "+218" },
  { code: "EG", name: "Égypte", region: "Afrique", dial: "+20" },
  { code: "SD", name: "Soudan", region: "Afrique", dial: "+249" },
  { code: "SS", name: "Soudan du Sud", region: "Afrique", dial: "+211" },
  // ─── Afrique anglophone / autres ──────────────────────────────────────
  { code: "NG", name: "Nigeria", region: "Afrique", dial: "+234" },
  { code: "GH", name: "Ghana", region: "Afrique", dial: "+233" },
  { code: "LR", name: "Liberia", region: "Afrique", dial: "+231" },
  { code: "SL", name: "Sierra Leone", region: "Afrique", dial: "+232" },
  { code: "GM", name: "Gambie", region: "Afrique", dial: "+220" },
  { code: "GW", name: "Guinée-Bissau", region: "Afrique", dial: "+245" },
  { code: "CV", name: "Cap-Vert", region: "Afrique", dial: "+238" },
  { code: "KE", name: "Kenya", region: "Afrique", dial: "+254" },
  { code: "UG", name: "Ouganda", region: "Afrique", dial: "+256" },
  { code: "TZ", name: "Tanzanie", region: "Afrique", dial: "+255" },
  { code: "ET", name: "Éthiopie", region: "Afrique", dial: "+251" },
  { code: "ER", name: "Érythrée", region: "Afrique", dial: "+291" },
  { code: "SO", name: "Somalie", region: "Afrique", dial: "+252" },
  { code: "ZA", name: "Afrique du Sud", region: "Afrique", dial: "+27" },
  { code: "NA", name: "Namibie", region: "Afrique", dial: "+264" },
  { code: "BW", name: "Botswana", region: "Afrique", dial: "+267" },
  { code: "ZW", name: "Zimbabwe", region: "Afrique", dial: "+263" },
  { code: "ZM", name: "Zambie", region: "Afrique", dial: "+260" },
  { code: "MW", name: "Malawi", region: "Afrique", dial: "+265" },
  { code: "MZ", name: "Mozambique", region: "Afrique", dial: "+258" },
  { code: "AO", name: "Angola", region: "Afrique", dial: "+244" },
  { code: "ST", name: "Sao Tomé-et-Principe", region: "Afrique", dial: "+239" },
  { code: "SZ", name: "Eswatini", region: "Afrique", dial: "+268" },
  { code: "LS", name: "Lesotho", region: "Afrique", dial: "+266" },
  { code: "MU", name: "Maurice", region: "Afrique", dial: "+230" },
  { code: "SC", name: "Seychelles", region: "Afrique", dial: "+248" },

  // ─── Europe francophone ────────────────────────────────────────────────
  { code: "FR", name: "France", region: "Europe", dial: "+33" },
  { code: "BE", name: "Belgique", region: "Europe", dial: "+32" },
  { code: "CH", name: "Suisse", region: "Europe", dial: "+41" },
  { code: "LU", name: "Luxembourg", region: "Europe", dial: "+352" },
  { code: "MC", name: "Monaco", region: "Europe", dial: "+377" },
  // ─── Europe ────────────────────────────────────────────────────────────
  { code: "DE", name: "Allemagne", region: "Europe", dial: "+49" },
  { code: "ES", name: "Espagne", region: "Europe", dial: "+34" },
  { code: "IT", name: "Italie", region: "Europe", dial: "+39" },
  { code: "PT", name: "Portugal", region: "Europe", dial: "+351" },
  { code: "NL", name: "Pays-Bas", region: "Europe", dial: "+31" },
  { code: "GB", name: "Royaume-Uni", region: "Europe", dial: "+44" },
  { code: "IE", name: "Irlande", region: "Europe", dial: "+353" },
  { code: "AT", name: "Autriche", region: "Europe", dial: "+43" },
  { code: "DK", name: "Danemark", region: "Europe", dial: "+45" },
  { code: "SE", name: "Suède", region: "Europe", dial: "+46" },
  { code: "NO", name: "Norvège", region: "Europe", dial: "+47" },
  { code: "FI", name: "Finlande", region: "Europe", dial: "+358" },
  { code: "IS", name: "Islande", region: "Europe", dial: "+354" },
  { code: "PL", name: "Pologne", region: "Europe", dial: "+48" },
  { code: "CZ", name: "Tchéquie", region: "Europe", dial: "+420" },
  { code: "SK", name: "Slovaquie", region: "Europe", dial: "+421" },
  { code: "HU", name: "Hongrie", region: "Europe", dial: "+36" },
  { code: "RO", name: "Roumanie", region: "Europe", dial: "+40" },
  { code: "BG", name: "Bulgarie", region: "Europe", dial: "+359" },
  { code: "GR", name: "Grèce", region: "Europe", dial: "+30" },
  { code: "HR", name: "Croatie", region: "Europe", dial: "+385" },
  { code: "SI", name: "Slovénie", region: "Europe", dial: "+386" },
  { code: "RS", name: "Serbie", region: "Europe", dial: "+381" },
  { code: "BA", name: "Bosnie-Herzégovine", region: "Europe", dial: "+387" },
  { code: "MK", name: "Macédoine du Nord", region: "Europe", dial: "+389" },
  { code: "AL", name: "Albanie", region: "Europe", dial: "+355" },
  { code: "ME", name: "Monténégro", region: "Europe", dial: "+382" },
  { code: "EE", name: "Estonie", region: "Europe", dial: "+372" },
  { code: "LV", name: "Lettonie", region: "Europe", dial: "+371" },
  { code: "LT", name: "Lituanie", region: "Europe", dial: "+370" },
  { code: "BY", name: "Biélorussie", region: "Europe", dial: "+375" },
  { code: "UA", name: "Ukraine", region: "Europe", dial: "+380" },
  { code: "MD", name: "Moldavie", region: "Europe", dial: "+373" },
  { code: "RU", name: "Russie", region: "Europe", dial: "+7" },
  { code: "TR", name: "Turquie", region: "Europe", dial: "+90" },
  { code: "CY", name: "Chypre", region: "Europe", dial: "+357" },
  { code: "MT", name: "Malte", region: "Europe", dial: "+356" },

  // ─── Amériques ─────────────────────────────────────────────────────────
  { code: "CA", name: "Canada", region: "Amériques", dial: "+1" },
  { code: "US", name: "États-Unis", region: "Amériques", dial: "+1" },
  { code: "MX", name: "Mexique", region: "Amériques", dial: "+52" },
  { code: "BR", name: "Brésil", region: "Amériques", dial: "+55" },
  { code: "AR", name: "Argentine", region: "Amériques", dial: "+54" },
  { code: "CL", name: "Chili", region: "Amériques", dial: "+56" },
  { code: "CO", name: "Colombie", region: "Amériques", dial: "+57" },
  { code: "PE", name: "Pérou", region: "Amériques", dial: "+51" },
  { code: "VE", name: "Venezuela", region: "Amériques", dial: "+58" },
  { code: "EC", name: "Équateur", region: "Amériques", dial: "+593" },
  { code: "BO", name: "Bolivie", region: "Amériques", dial: "+591" },
  { code: "PY", name: "Paraguay", region: "Amériques", dial: "+595" },
  { code: "UY", name: "Uruguay", region: "Amériques", dial: "+598" },
  { code: "GY", name: "Guyana", region: "Amériques", dial: "+592" },
  { code: "SR", name: "Suriname", region: "Amériques", dial: "+597" },
  { code: "GT", name: "Guatemala", region: "Amériques", dial: "+502" },
  { code: "HN", name: "Honduras", region: "Amériques", dial: "+504" },
  { code: "SV", name: "Salvador", region: "Amériques", dial: "+503" },
  { code: "NI", name: "Nicaragua", region: "Amériques", dial: "+505" },
  { code: "CR", name: "Costa Rica", region: "Amériques", dial: "+506" },
  { code: "PA", name: "Panama", region: "Amériques", dial: "+507" },
  { code: "CU", name: "Cuba", region: "Amériques", dial: "+53" },
  { code: "DO", name: "République dominicaine", region: "Amériques", dial: "+1" },
  { code: "HT", name: "Haïti", region: "Amériques", dial: "+509" },
  { code: "JM", name: "Jamaïque", region: "Amériques", dial: "+1" },
  { code: "TT", name: "Trinité-et-Tobago", region: "Amériques", dial: "+1" },
  { code: "BS", name: "Bahamas", region: "Amériques", dial: "+1" },
  { code: "BB", name: "Barbade", region: "Amériques", dial: "+1" },

  // ─── Moyen-Orient ──────────────────────────────────────────────────────
  { code: "AE", name: "Émirats arabes unis", region: "Moyen-Orient", dial: "+971" },
  { code: "SA", name: "Arabie saoudite", region: "Moyen-Orient", dial: "+966" },
  { code: "QA", name: "Qatar", region: "Moyen-Orient", dial: "+974" },
  { code: "KW", name: "Koweït", region: "Moyen-Orient", dial: "+965" },
  { code: "BH", name: "Bahreïn", region: "Moyen-Orient", dial: "+973" },
  { code: "OM", name: "Oman", region: "Moyen-Orient", dial: "+968" },
  { code: "YE", name: "Yémen", region: "Moyen-Orient", dial: "+967" },
  { code: "JO", name: "Jordanie", region: "Moyen-Orient", dial: "+962" },
  { code: "LB", name: "Liban", region: "Moyen-Orient", dial: "+961" },
  { code: "SY", name: "Syrie", region: "Moyen-Orient", dial: "+963" },
  { code: "IQ", name: "Irak", region: "Moyen-Orient", dial: "+964" },
  { code: "IR", name: "Iran", region: "Moyen-Orient", dial: "+98" },
  { code: "IL", name: "Israël", region: "Moyen-Orient", dial: "+972" },
  { code: "PS", name: "Palestine", region: "Moyen-Orient", dial: "+970" },
  { code: "AF", name: "Afghanistan", region: "Moyen-Orient", dial: "+93" },

  // ─── Asie ──────────────────────────────────────────────────────────────
  { code: "CN", name: "Chine", region: "Asie", dial: "+86" },
  { code: "JP", name: "Japon", region: "Asie", dial: "+81" },
  { code: "KR", name: "Corée du Sud", region: "Asie", dial: "+82" },
  { code: "KP", name: "Corée du Nord", region: "Asie", dial: "+850" },
  { code: "IN", name: "Inde", region: "Asie", dial: "+91" },
  { code: "PK", name: "Pakistan", region: "Asie", dial: "+92" },
  { code: "BD", name: "Bangladesh", region: "Asie", dial: "+880" },
  { code: "LK", name: "Sri Lanka", region: "Asie", dial: "+94" },
  { code: "NP", name: "Népal", region: "Asie", dial: "+977" },
  { code: "BT", name: "Bhoutan", region: "Asie", dial: "+975" },
  { code: "MV", name: "Maldives", region: "Asie", dial: "+960" },
  { code: "MM", name: "Myanmar", region: "Asie", dial: "+95" },
  { code: "TH", name: "Thaïlande", region: "Asie", dial: "+66" },
  { code: "VN", name: "Vietnam", region: "Asie", dial: "+84" },
  { code: "LA", name: "Laos", region: "Asie", dial: "+856" },
  { code: "KH", name: "Cambodge", region: "Asie", dial: "+855" },
  { code: "MY", name: "Malaisie", region: "Asie", dial: "+60" },
  { code: "SG", name: "Singapour", region: "Asie", dial: "+65" },
  { code: "ID", name: "Indonésie", region: "Asie", dial: "+62" },
  { code: "PH", name: "Philippines", region: "Asie", dial: "+63" },
  { code: "BN", name: "Brunei", region: "Asie", dial: "+673" },
  { code: "TW", name: "Taïwan", region: "Asie", dial: "+886" },
  { code: "HK", name: "Hong Kong", region: "Asie", dial: "+852" },
  { code: "MO", name: "Macao", region: "Asie", dial: "+853" },
  { code: "MN", name: "Mongolie", region: "Asie", dial: "+976" },
  { code: "KZ", name: "Kazakhstan", region: "Asie", dial: "+7" },
  { code: "UZ", name: "Ouzbékistan", region: "Asie", dial: "+998" },
  { code: "KG", name: "Kirghizistan", region: "Asie", dial: "+996" },
  { code: "TJ", name: "Tadjikistan", region: "Asie", dial: "+992" },
  { code: "TM", name: "Turkménistan", region: "Asie", dial: "+993" },
  { code: "AZ", name: "Azerbaïdjan", region: "Asie", dial: "+994" },
  { code: "AM", name: "Arménie", region: "Asie", dial: "+374" },
  { code: "GE", name: "Géorgie", region: "Asie", dial: "+995" },

  // ─── Océanie ───────────────────────────────────────────────────────────
  { code: "AU", name: "Australie", region: "Océanie", dial: "+61" },
  { code: "NZ", name: "Nouvelle-Zélande", region: "Océanie", dial: "+64" },
  { code: "FJ", name: "Fidji", region: "Océanie", dial: "+679" },
  { code: "PG", name: "Papouasie-Nouvelle-Guinée", region: "Océanie", dial: "+675" },
  { code: "SB", name: "Îles Salomon", region: "Océanie", dial: "+677" },
  { code: "VU", name: "Vanuatu", region: "Océanie", dial: "+678" },
  { code: "WS", name: "Samoa", region: "Océanie", dial: "+685" },
  { code: "TO", name: "Tonga", region: "Océanie", dial: "+676" },
  { code: "PF", name: "Polynésie française", region: "Océanie", dial: "+689" },
  { code: "NC", name: "Nouvelle-Calédonie", region: "Océanie", dial: "+687" },
];

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

export function countryByName(name: string): Country | undefined {
  const n = name.trim().toLowerCase();
  return COUNTRIES.find((c) => c.name.toLowerCase() === n);
}

/** Return countries grouped by region (for an optgroup <select>). */
export function groupCountriesByRegion(): Record<Country["region"], Country[]> {
  const groups: Record<string, Country[]> = {};
  for (const c of COUNTRIES) {
    (groups[c.region] ||= []).push(c);
  }
  return groups as Record<Country["region"], Country[]>;
}
