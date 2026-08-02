// Pastilles d'opérateurs pour l'écran de paiement.
//
// Dessinées en SVG inline, aux couleurs officielles de chaque marque, sans
// reproduire de logo protégé : on reste reconnaissable sans copier l'oeuvre
// graphique du fournisseur (et sans dépendre d'un asset externe qui casserait
// la page s'il disparaissait).
//
// Un opérateur inconnu retombe sur une pastille neutre plutôt que sur un trou
// visuel — ajouter un moyen au registre ne doit jamais casser l'affichage.

type Props = { code: string; size?: number };

/** Couleur de marque + monogramme, par famille d'opérateur. */
const BRANDS: Array<{ match: RegExp; bg: string; fg: string; text: string }> = [
  { match: /^orange_/, bg: "#FF7900", fg: "#ffffff", text: "OM" },   // Orange Money
  { match: /^wave_/, bg: "#1DC8FF", fg: "#04263a", text: "W" },      // Wave
  { match: /^mtn_/, bg: "#FFCB05", fg: "#1a1a1a", text: "MTN" },     // MTN MoMo
  { match: /^moov_/, bg: "#0B57A4", fg: "#ffffff", text: "MV" },     // Moov Money
  { match: /^freemoney_/, bg: "#E4002B", fg: "#ffffff", text: "FM" },// Free Money
  { match: /^e_money_/, bg: "#00A651", fg: "#ffffff", text: "EM" },  // E-Money
  { match: /^wizall_/, bg: "#8DC63F", fg: "#0d2b00", text: "WZ" },   // Wizall
  { match: /^djamo_/, bg: "#111827", fg: "#ffffff", text: "DJ" },    // Djamo
  { match: /^togocel/, bg: "#0057B8", fg: "#ffffff", text: "TG" },   // Togocel
];

/** Marque « carte bancaire » : deux disques entrelacés, universellement lus. */
function CardMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#F4F6F8" />
      <circle cx="16.5" cy="20" r="8" fill="#EB001B" />
      <circle cx="23.5" cy="20" r="8" fill="#F79E1B" fillOpacity="0.85" />
    </svg>
  );
}

export function OperatorLogo({ code, size = 34 }: Props) {
  if (code.startsWith("card_")) return <CardMark size={size} />;

  const brand = BRANDS.find((b) => b.match.test(code));
  const bg = brand?.bg ?? "#E7EBEF";
  const fg = brand?.fg ?? "#5c647a";
  const text = brand?.text ?? code.slice(0, 2).toUpperCase();
  // Le monogramme rétrécit avec la longueur pour rester dans la pastille.
  const fontSize = text.length >= 3 ? 11 : 14;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill={bg} />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fill={fg}
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {text}
      </text>
    </svg>
  );
}

/** Drapeau emoji depuis un code ISO-2 — évite d'embarquer 180 images. */
export function flagEmoji(iso2: string): string {
  const c = (iso2 || "").trim().toUpperCase();
  if (c.length !== 2) return "🏳️";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}
