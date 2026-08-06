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

/** Bandes horizontales égales. */
function Horizontal({ colors }: { colors: string[] }) {
  const h = H / colors.length;
  return (
    <>
      {colors.map((c, i) => (
        <rect key={i} x={0} y={i * h} width={W} height={h} fill={c} />
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
  // Niger — trois bandes horizontales égales orange / blanc / vert, disque
  // orange centré dans la bande blanche.
  ne: (
    <>
      <rect x="0" y="0" width="24" height="5.333" fill="#E05206" />
      <rect x="0" y="5.333" width="24" height="5.334" fill="#FFFFFF" />
      <rect x="0" y="10.667" width="24" height="5.333" fill="#0DB02B" />
      <circle cx="12" cy="8" r="2.4" fill="#E05206" />
    </>
  ),
  // Congo-Brazzaville — partagé en diagonale du coin bas-hampe au coin
  // haut-flottant : vert côté hampe, rouge côté flottant, bande jaune entre
  // les deux. Les sommets sont calculés sur la droite x/24 + y/16 = 1 décalée
  // de ±0,28 — dessiner « à peu près » donnait une bande de travers.
  cg: (
    <>
      <rect width="24" height="16" fill="#FBDE4A" />
      <polygon points="0,0 17.28,0 0,11.52" fill="#009543" />
      <polygon points="24,4.48 24,16 6.72,16" fill="#DC241F" />
    </>
  ),
  // Gabon — vert, jaune, bleu horizontaux.
  ga: <Horizontal colors={["#009E60", "#FCD116", "#3A75C4"]} />,
  // Guinée — rouge, jaune, vert verticaux.
  gn: <Vertical colors={["#CE1126", "#FCD116", "#009460"]} />,
  // Tchad — bleu, jaune, rouge verticaux.
  td: <Vertical colors={["#002664", "#FECB00", "#C60C30"]} />,
  // Guinée équatoriale — vert/blanc/rouge + triangle bleu côté hampe.
  gq: (
    <>
      <Horizontal colors={["#3E9A00", "#FFFFFF", "#E32118"]} />
      <polygon points="0,0 6.4,8 0,16" fill="#0073CE" />
    </>
  ),
  // Guinée-Bissau — jaune en haut, vert en bas, bande rouge côté hampe
  // occupant un tiers, étoile noire centrée dessus.
  gw: (
    <>
      <rect x="0" y="0" width="24" height="8" fill="#FCD116" />
      <rect x="0" y="8" width="24" height="8" fill="#009E49" />
      <rect x="0" y="0" width="8" height="16" fill="#CE1126" />
      <Star cx={4} cy={8} r={2.8} fill="#000000" />
    </>
  ),
  // RD Congo — bleu ciel, bande rouge en diagonale bordée de jaune, étoile
  // jaune au canton. La diagonale monte du coin bas-hampe au coin haut-flottant.
  cd: (
    <>
      <rect width="24" height="16" fill="#007FFF" />
      <polygon points="0,16 4.8,16 24,3.2 24,0 19.2,0 0,12.8" fill="#F7D618" />
      <polygon points="0.9,15.1 23.1,0.9 23.1,2.1 2.1,15.1" fill="#CE1021" />
      <Star cx={4.4} cy={3.6} r={2.6} fill="#F7D618" />
    </>
  ),
  // Centrafrique — quatre bandes horizontales barrées d'une bande rouge
  // verticale au centre, étoile jaune au canton.
  cf: (
    <>
      <Horizontal colors={["#003082", "#FFFFFF", "#289728", "#FFCE00"]} />
      <rect x="9.6" y="0" width="4.8" height="16" fill="#D21034" />
      <Star cx={3.2} cy={2.6} r={2.1} fill="#FFCE00" />
    </>
  ),
  // Ouganda — six bandes noir/jaune/rouge, disque blanc centré (la grue
  // couronnée n'est pas lisible à cette taille : on garde le disque seul).
  ug: (
    <>
      <Horizontal colors={["#000000", "#FCDC04", "#D90000", "#000000", "#FCDC04", "#D90000"]} />
      <circle cx="12" cy="8" r="3.4" fill="#FFFFFF" />
    </>
  ),
  // Liberia — onze bandes rouge/blanc et canton bleu à étoile blanche.
  lr: (
    <>
      <rect width="24" height="16" fill="#FFFFFF" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="0" y={(i * 2 * H) / 11} width="24" height={H / 11} fill="#BF0A30" />
      ))}
      <rect x="0" y="0" width={(H * 5) / 11} height={(H * 5) / 11} fill="#002868" />
      <Star cx={3.64} cy={3.64} r={2.4} fill="#FFFFFF" />
    </>
  ),
};

/**
 * Pays réellement DESSINÉS. Exporté pour que les tests puissent vérifier
 * qu'aucun pays proposé au visiteur ne retombe sur la pastille de repli :
 * un code ISO gris au milieu de vrais drapeaux se remarque immédiatement.
 */
export const PAYS_DESSINES = Object.keys(FLAGS);

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
