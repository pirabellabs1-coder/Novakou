"use client";

// Logos d'opérateurs pour l'écran de paiement.
//
// On tente d'abord le LOGO OFFICIEL, servi depuis notre domaine (voir
// /api/operateurs/logo). S'il n'existe pas ou ne charge pas, on retombe sur la
// pastille dessinée ci-dessous — un repli discret plutôt qu'une image cassée
// au moment precis ou l'acheteur decide de payer.
//
// Dessinées en SVG inline, aux couleurs officielles de chaque marque, sans
// reproduire de logo protégé : on reste reconnaissable sans copier l'oeuvre
// graphique du fournisseur (et sans dépendre d'un asset externe qui casserait
// la page s'il disparaissait).
//
// Un opérateur inconnu retombe sur une pastille neutre plutôt que sur un trou
// visuel — ajouter un moyen au registre ne doit jamais casser l'affichage.

import { useState } from "react";

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
  { match: /^celtiis_/, bg: "#0C2C84", fg: "#ffffff", text: "CT" },  // Celtiis Cash
  { match: /^coris_/, bg: "#00A0DF", fg: "#ffffff", text: "CO" },    // Coris Money
  { match: /^airtel_/, bg: "#E40000", fg: "#ffffff", text: "AM" },   // Airtel Money
  // Operateurs ouverts par PawaPay. Sans ces entrees ils retombaient sur les
  // deux premieres lettres de leur CODE INTERNE : M-Pesa s'affichait « VO »
  // (vodacom_mz) et Movitel « MO ». Deux lettres qui ne correspondent a rien
  // de ce que l'acheteur voit ecrit a l'ecran.
  { match: /^(mpesa_|vodacom_)/, bg: "#E30613", fg: "#ffffff", text: "M-P" }, // M-Pesa / Vodacom
  { match: /^movitel_/, bg: "#F7A800", fg: "#1a1a1a", text: "MVT" }, // Movitel
  { match: /^tigo_/, bg: "#1E3A8A", fg: "#ffffff", text: "TG" },     // Tigo Pesa
  { match: /^halotel_/, bg: "#F58220", fg: "#ffffff", text: "HP" },  // Halopesa
  { match: /^zamtel_/, bg: "#009639", fg: "#ffffff", text: "ZM" },   // Zamtel Kwacha
  { match: /^tnm_/, bg: "#00A94F", fg: "#ffffff", text: "TNM" },     // TNM Mpamba
  { match: /^airteltigo_/, bg: "#E40000", fg: "#ffffff", text: "AT" },// AirtelTigo
  { match: /^vodafone_/, bg: "#E60000", fg: "#ffffff", text: "VF" }, // Vodafone Cash
  { match: /^africell_/, bg: "#7B2D8E", fg: "#ffffff", text: "AF" }, // Africell
  { match: /^eu_/, bg: "#0B3D91", fg: "#ffffff", text: "EU" },       // Express Union
  { match: /^zamani_/, bg: "#00843D", fg: "#ffffff", text: "ZA" },   // Zamani Money
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
  // La carte n'a pas de logo d'operateur : sa marque universelle vaut mieux
  // qu'un logo de banque particuliere.
  const [logoKo, setLogoKo] = useState(false);
  if (code.startsWith("card_")) return <CardMark size={size} />;

  if (!logoKo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/operateurs/logo/${encodeURIComponent(code)}`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setLogoKo(true)}
        className="rounded-[8px] object-contain bg-white flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

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
