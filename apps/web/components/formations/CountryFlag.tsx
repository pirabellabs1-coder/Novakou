// Drapeaux nationaux en SVG inline.
//
// POURQUOI PAS D'EMOJI : Windows ne rend PAS les emoji drapeaux — il affiche
// les deux lettres du pays à la place (« CI », « SN »). Comme une grande partie
// des acheteurs et le fondateur sont sous Windows, l'écran de paiement
// paraissait bâclé. Les emoji sont aussi inutilisables dans un <option>.
//
// On ne sert qu'une poignée de pays : les dessiner à la main évite une
// dépendance externe et garantit un rendu identique partout.
// Un pays inconnu retombe sur une pastille neutre avec son code ISO.

type Props = { code: string; className?: string };

const W = 24;
const H = 16;

/** Bandes verticales égales. */
function Vertical({ colors }: { colors: string[] }) {
  const w = W / colors.length;
  return (
    <>
      {colors.map((c, i) => (
        <rect key={i} x={i * w} y={0} width={w} height={H} fill={c} />
      ))}
    </>
  );
}

/** Étoile à 5 branches centrée. */
function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r / 2.5;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} />;
}

const FLAGS: Record<string, React.ReactNode> = {
  // Bénin — bande verte verticale, jaune en haut, rouge en bas.
  bj: (
    <>
      <rect x="0" y="0" width="24" height="8" fill="#FCD116" />
      <rect x="0" y="8" width="24" height="8" fill="#E8112D" />
      <rect x="0" y="0" width="9.6" height="16" fill="#008751" />
    </>
  ),
  // Côte d'Ivoire — orange, blanc, vert.
  ci: <Vertical colors={["#F77F00", "#FFFFFF", "#009E60"]} />,
  // Sénégal — vert, jaune, rouge + étoile verte au centre.
  sn: (
    <>
      <Vertical colors={["#00853F", "#FDEF42", "#E31B23"]} />
      <Star cx={12} cy={8} r={3.6} fill="#00853F" />
    </>
  ),
  // Mali — vert, jaune, rouge.
  ml: <Vertical colors={["#14B53A", "#FCD116", "#CE1126"]} />,
  // Burkina Faso — rouge sur vert + étoile jaune.
  bf: (
    <>
      <rect x="0" y="0" width="24" height="8" fill="#EF2B2D" />
      <rect x="0" y="8" width="24" height="8" fill="#009E49" />
      <Star cx={12} cy={8} r={3.4} fill="#FCD116" />
    </>
  ),
  // Togo — 5 bandes vert/jaune + canton rouge à étoile blanche.
  tg: (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="0" y={i * 3.2} width="24" height="3.2" fill={i % 2 === 0 ? "#006A4E" : "#FFCE00"} />
      ))}
      <rect x="0" y="0" width="9.6" height="9.6" fill="#D21034" />
      <Star cx={4.8} cy={4.8} r={3.1} fill="#FFFFFF" />
    </>
  ),
  // Cameroun — vert, rouge, jaune + étoile jaune au centre.
  cm: (
    <>
      <Vertical colors={["#007A5E", "#CE1126", "#FCD116"]} />
      <Star cx={12} cy={8} r={3.4} fill="#FCD116" />
    </>
  ),
};

export function CountryFlag({ code, className = "" }: Props) {
  const iso = (code || "").trim().toLowerCase();
  const flag = FLAGS[iso];

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={`rounded-[3px] flex-shrink-0 ${className}`}
      style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)" }}
      aria-hidden="true"
    >
      {flag ?? (
        <>
          <rect width={W} height={H} fill="#E7EBEF" />
          <text
            x={W / 2}
            y={H / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#5c647a"
            fontSize="8"
            fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {iso.toUpperCase()}
          </text>
        </>
      )}
    </svg>
  );
}

/** Logo Novakou (même marque que le favicon : « N » sur dégradé vert). */
export function NovakouLogo({ size = 32 }: { size?: number }) {
  const gid = "nk-logo-grad";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Novakou">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#006e2f" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gid})`} />
      <path d="M 9 24 V 8 h 3 l 8 12 V 8 h 3 v 16 h -3 L 12 12 v 12 z" fill="white" />
    </svg>
  );
}
