/**
 * Design system "Stitch" — langage visuel officiel Novakou (juin 2026).
 *
 * Extrait pixel-perfect des maquettes Google Stitch validées par Lissanon
 * (dossier /stich à la racine du repo) :
 *   - novakou_tableau_de_bord.html
 *   - novakou_mes_produits.html
 *   - novakou_wizard_creation_produit.html
 *   - novakou_revenus_retraits.html
 *   - novakou_statistiques.html
 *   - novakou_marketing.html
 *
 * Identité : VERT Novakou (#006e2f → #22c55e), cartes blanches douces,
 * Manrope, chiffres tabulaires, chips pastel, niveau de polish
 * Stripe/Shopify Admin.
 *
 * Polish « verre » (septembre 2026) : même langue que la page d'accueil
 * (home.css) — boutons pilule translucides avec liseré interne et disque
 * « bouton dans le bouton », cartes double-bezel en option, compteurs animés,
 * courbe d'easing unique cubic-bezier(.22,1,.36,1). Tout est additif : aucune
 * prop ni export existant n'a changé.
 *
 * Usage :
 *   import { StCard, StPageHeader, StButton, StChip, StKpi, StKpiCompact,
 *            StStatusPill, StTabs, StProgressBar, StSuggestion, StStepper,
 *            StInput, StTextarea, StGhostCard, StAvatar, StSectionTitle,
 *            StCountUp, StChartTooltip, StChartSkeleton, StChartEmpty,
 *            useReducedMotion, ST } from "@/components/stitch";
 */

"use client";

import Link from "next/link";
import { type LucideIcon, ArrowRight, TrendingUp, TrendingDown, Check, CheckCircle2, Clock, XCircle } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

/* ───────────────────────── Tokens ────────────────────────────────────── */

export const ST = {
  gradient: "linear-gradient(135deg,#006e2f,#22c55e)",
  gradientH: "linear-gradient(90deg,#006e2f,#22c55e)",
  bg: "#f7f9fb",
  cardBorder: "#e4eae6",
  divider: "#eef2ef",
  text: "#13241b",
  textSecondary: "#5d7166",
  textLabel: "#41544a",
  textMuted: "#8aa092",
  textFaint: "#9baba1",
  green: "#006e2f",
  greenBright: "#22c55e",
  greenSoft: "#e6f5eb",
  greenDark: "#0b3b20",
  avatarBg: "#dcefe2",
  amberSoft: "#fdf3df",
  amberText: "#854f0b",
  blueSoft: "#e8f3fc",
  blueText: "#185fa5",
  roseSoft: "#fceef2",
  roseText: "#993556",
  // Motion : la même courbe de sortie douce que la page d'accueil (home.css).
  ease: "cubic-bezier(.22,1,.36,1)",
  // Graphiques : un seul accent (le vert de marque) ; les autres séries sont
  // désaturées (< 80 % de saturation) pour ne pas concurrencer les revenus.
  chartRevenue: "#006e2f",
  chartSales: "#3e8998",
  chartClients: "#7c64b4",
  chartGrid: "#e9efeb",
  // ≥ 4,5:1 sur blanc (les anciens ticks #7d9486 / #9baba1 étaient sous le seuil).
  chartTick: "#5d7166",
} as const;

// Classe Tailwind de la courbe — littérale pour que le JIT la détecte.
const EASE_CLS = "ease-[cubic-bezier(.22,1,.36,1)]";

/* ───────────────────────── useReducedMotion ──────────────────────────── */

/** Vrai si l'utilisateur demande moins d'animations (faux au premier rendu, SSR compris). */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const maj = () => setReduce(mq.matches);
    maj();
    mq.addEventListener("change", maj);
    return () => mq.removeEventListener("change", maj);
  }, []);
  return reduce;
}

/* ───────────────────────── StCard ────────────────────────────────────── */

export function StCard({
  className = "",
  noPadding = false,
  bezel = false,
  children,
  style,
}: {
  className?: string;
  noPadding?: boolean;
  /**
   * Double-bezel : coque externe (teinte + liseré) autour d'un cœur blanc,
   * rayons concentriques. Opt-in pour ne pas changer l'existant d'un coup.
   * `className` et `style` s'appliquent au cœur (padding, fond), comme avant.
   */
  bezel?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  const core = `bg-white ${noPadding ? "" : "p-5"}`;
  if (bezel) {
    return (
      <div className="h-full rounded-[1.25rem] bg-black/[.03] p-1.5 ring-1 ring-black/[.05]">
        <div
          className={`${core} h-full rounded-[calc(1.25rem-.375rem)] shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_1px_2px_rgba(16,52,32,.05)] ${className}`}
          style={style}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div
      className={`${core} rounded-[18px] ${className}`}
      style={{
        border: `1px solid ${ST.cardBorder}`,
        // Liseré clair en haut : la carte « attrape » la lumière, comme sur l'accueil.
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(16,52,32,.04), 0 1px 3px rgba(16,52,32,.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── StPageHeader ──────────────────────────────── */

export function StPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
      <div>
        <h1 className="text-[22px] md:text-[25px] font-extrabold tracking-[-0.02em]" style={{ color: ST.text }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] md:text-[13.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/* ───────────────────────── StSectionTitle ────────────────────────────── */

export function StSectionTitle({
  children,
  action,
  className = "",
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <span className="text-[15px] font-extrabold" style={{ color: ST.text }}>{children}</span>
      {action}
    </div>
  );
}

/* ───────────────────────── StButton ──────────────────────────────────── */

// Base commune : pilule, transitions sur transform/ombre/couleur uniquement,
// légère lévitation au survol, pression au clic, anneau de focus net.
// Le reflet diagonal (::before) est un calque sous le contenu mais au-dessus
// du fond (z -10 dans le contexte isolé du bouton).
const BTN_BASE =
  "group relative isolate inline-flex items-center justify-center rounded-full font-extrabold whitespace-nowrap select-none " +
  `transition-[transform,box-shadow,background-color,color] duration-300 ${EASE_CLS} ` +
  "hover:-translate-y-[2px] active:translate-y-0 active:scale-[.98] active:duration-150 " +
  // focus-visible:rounded-full : globals.css pose `:focus-visible { border-radius: 4px }`,
  // la pilule redeviendrait un rectangle pendant le focus clavier.
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:rounded-full " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 " +
  "before:content-[''] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-full";

// Le flou d'arrière-plan n'est posé que sur les variantes rares (CTA) : la
// variante `secondary` apparaît par dizaines dans les listes — un calque
// composité par bouton ferait ramer le défilement sur téléphone. Sans
// backdrop-filter (vieux navigateurs), le fond redevient opaque : même contraste.
const BTN_VARIANTS: Record<"primary" | "secondary" | "dark" | "white" | "ghost-green", string> = {
  primary:
    "text-white bg-[#006e2f] hover:bg-[#005c27] " +
    "supports-[backdrop-filter]:bg-[rgba(0,110,47,.9)] supports-[backdrop-filter]:hover:bg-[rgba(0,92,39,.94)] supports-[backdrop-filter]:backdrop-blur-md " +
    "shadow-[inset_0_0_0_1px_rgba(255,255,255,.22),inset_0_1px_0_rgba(255,255,255,.3),inset_0_-1px_1px_rgba(0,40,17,.35),0_1px_2px_rgba(3,35,20,.2),0_10px_24px_-10px_rgba(0,110,47,.55)] " +
    "hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,.3),inset_0_1px_0_rgba(255,255,255,.38),inset_0_-1px_1px_rgba(0,40,17,.35),0_2px_4px_rgba(3,35,20,.18),0_16px_32px_-12px_rgba(0,110,47,.6)] " +
    "focus-visible:outline-[#006e2f] " +
    "before:bg-[linear-gradient(115deg,rgba(255,255,255,.34)_0%,rgba(255,255,255,.06)_42%,rgba(255,255,255,0)_60%)]",
  secondary:
    "text-[#41544a] bg-white/80 hover:bg-white hover:text-[#13241b] " +
    "shadow-[inset_0_0_0_1px_rgba(14,21,18,.08),inset_0_1px_0_rgba(255,255,255,.95),0_1px_2px_rgba(14,21,18,.05),0_8px_20px_-12px_rgba(3,35,20,.22)] " +
    "hover:shadow-[inset_0_0_0_1px_rgba(14,21,18,.1),inset_0_1px_0_#fff,0_2px_4px_rgba(14,21,18,.05),0_14px_28px_-14px_rgba(3,35,20,.28)] " +
    "focus-visible:outline-[#006e2f] " +
    "before:bg-[linear-gradient(115deg,rgba(255,255,255,.7)_0%,rgba(255,255,255,.12)_42%,rgba(255,255,255,0)_60%)]",
  dark:
    "text-white bg-[#0b3b20] hover:bg-[#0f4a29] " +
    "supports-[backdrop-filter]:bg-[rgba(11,59,32,.92)] supports-[backdrop-filter]:hover:bg-[rgba(15,74,41,.94)] supports-[backdrop-filter]:backdrop-blur-md " +
    "shadow-[inset_0_0_0_1px_rgba(255,255,255,.14),inset_0_1px_0_rgba(255,255,255,.18),inset_0_-1px_1px_rgba(0,20,8,.4),0_1px_2px_rgba(3,35,20,.25),0_10px_24px_-10px_rgba(11,59,32,.6)] " +
    "hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,.2),inset_0_1px_0_rgba(255,255,255,.24),inset_0_-1px_1px_rgba(0,20,8,.4),0_2px_4px_rgba(3,35,20,.2),0_16px_32px_-12px_rgba(11,59,32,.65)] " +
    "focus-visible:outline-[#0b3b20] " +
    "before:bg-[linear-gradient(115deg,rgba(255,255,255,.18)_0%,rgba(255,255,255,.04)_42%,rgba(255,255,255,0)_60%)]",
  // Posé sur les surfaces vertes : un anneau vert serait invisible, il passe au blanc.
  white:
    "text-[#006e2f] bg-white " +
    "supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:hover:bg-white supports-[backdrop-filter]:backdrop-blur-md " +
    "shadow-[inset_0_0_0_1px_rgba(255,255,255,.85),inset_0_1px_0_#fff,inset_0_-1px_1px_rgba(14,21,18,.06),0_1px_2px_rgba(3,35,20,.15),0_10px_24px_-12px_rgba(3,35,20,.35)] " +
    "hover:shadow-[inset_0_0_0_1px_#fff,inset_0_1px_0_#fff,inset_0_-1px_1px_rgba(14,21,18,.06),0_2px_4px_rgba(3,35,20,.15),0_16px_32px_-14px_rgba(3,35,20,.4)] " +
    "focus-visible:outline-white " +
    "before:bg-[linear-gradient(115deg,rgba(255,255,255,.7)_0%,rgba(255,255,255,.1)_42%,rgba(255,255,255,0)_60%)]",
  "ghost-green":
    "text-[#006e2f] bg-[#e6f5eb] hover:bg-[#dcefe2] " +
    "shadow-[inset_0_0_0_1px_rgba(0,110,47,.12),inset_0_1px_0_rgba(255,255,255,.7),0_1px_2px_rgba(14,21,18,.04)] " +
    "hover:shadow-[inset_0_0_0_1px_rgba(0,110,47,.18),inset_0_1px_0_rgba(255,255,255,.8),0_8px_20px_-12px_rgba(0,110,47,.35)] " +
    "focus-visible:outline-[#006e2f] " +
    "before:bg-[linear-gradient(115deg,rgba(255,255,255,.55)_0%,rgba(255,255,255,.1)_42%,rgba(255,255,255,0)_60%)]",
};

// Disque « bouton dans le bouton » qui porte l'icône de droite.
const BTN_DISC: Record<keyof typeof BTN_VARIANTS, string> = {
  primary: "bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,.22)] group-hover:bg-white/25",
  dark: "bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,.22)] group-hover:bg-white/25",
  secondary: "bg-[rgba(14,21,18,.06)] shadow-[inset_0_0_0_1px_rgba(14,21,18,.05)] group-hover:bg-[rgba(14,21,18,.09)]",
  white: "bg-[rgba(0,110,47,.1)] shadow-[inset_0_0_0_1px_rgba(0,110,47,.12)] group-hover:bg-[rgba(0,110,47,.16)]",
  "ghost-green": "bg-[rgba(0,110,47,.1)] shadow-[inset_0_0_0_1px_rgba(0,110,47,.12)] group-hover:bg-[rgba(0,110,47,.16)]",
};

// Mêmes hauteurs qu'avant (padding inchangé) ; `discPad` réduit le padding
// droit pour que le disque vienne affleurer le bord.
const BTN_SIZES = {
  sm: { btn: "px-3 py-2 text-[12px] gap-1.5", discPad: "pr-[5px]", disc: "w-6 h-6", icon: 14, discIcon: 12 },
  md: { btn: "px-4 py-2.5 text-[13px] gap-2", discPad: "pr-1", disc: "w-8 h-8", icon: 16, discIcon: 14 },
  lg: { btn: "px-6 py-3 text-[13.5px] gap-2", discPad: "pr-1.5", disc: "w-8 h-8", icon: 17, discIcon: 15 },
} as const;

export function StButton({
  variant = "primary",
  size = "md",
  href,
  target,
  onClick,
  disabled,
  type = "button",
  icon: Icon,
  iconRight: IconRight,
  className = "",
  children,
}: {
  variant?: "primary" | "secondary" | "dark" | "white" | "ghost-green";
  size?: "sm" | "md" | "lg";
  href?: string;
  // Ouvrir dans un nouvel onglet (ex. l'admin consulte un produit sans
  // quitter sa liste de validation). rel sécurisé ajouté automatiquement.
  target?: "_blank" | "_self";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  const s = BTN_SIZES[size];
  const cls = `${BTN_BASE} ${BTN_VARIANTS[variant]} ${s.btn} ${IconRight ? s.discPad : ""} ${className}`;

  const content = (
    <>
      {Icon && <Icon size={s.icon} />}
      <span>{children}</span>
      {IconRight && (
        <span
          aria-hidden
          className={
            `ml-1 inline-flex shrink-0 items-center justify-center rounded-full ${s.disc} ${BTN_DISC[variant]} ` +
            `transition-[transform,background-color] duration-300 ${EASE_CLS} ` +
            "group-hover:translate-x-px group-hover:-translate-y-px " +
            "motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
          }
        >
          <IconRight size={s.discIcon} />
        </span>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={cls}
      >
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {content}
    </button>
  );
}

/* ───────────────────────── StChip ────────────────────────────────────── */

export function StChip({
  tone = "green",
  icon: Icon,
  children,
}: {
  tone?: "green" | "amber" | "blue" | "rose" | "neutral";
  icon?: LucideIcon;
  children: ReactNode;
}) {
  const tones = {
    green: { background: ST.greenSoft, color: ST.green },
    amber: { background: ST.amberSoft, color: ST.amberText },
    blue: { background: ST.blueSoft, color: ST.blueText },
    rose: { background: ST.roseSoft, color: ST.roseText },
    neutral: { background: "#f1efe8", color: "#5f5e5a" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-[3px] rounded-full tabular-nums shadow-[inset_0_0_0_1px_rgba(14,21,18,.04)]"
      style={tones}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

/* ───────────────────────── StDeltaChip — "+18,2 % vs mai" ────────────── */

export function StDeltaChip({ pct, suffix = "vs période préc." }: { pct: number | null; suffix?: string }) {
  if (pct === null) return null;
  const up = pct >= 0;
  const formatted = Math.abs(pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return (
    <StChip tone={up ? "green" : "rose"} icon={up ? TrendingUp : TrendingDown}>
      {up ? "+" : "−"}{formatted} % {suffix}
    </StChip>
  );
}

/* ───────────────────────── StCountUp — compteur additif ──────────────── */

const DUREE_COMPTEUR_MS = 500;

type Anime = {
  animate: typeof import("animejs/animation").animate;
  ease: (t: number) => number;
};

let animePromise: Promise<Anime> | null = null;

// anime.js n'est chargé (sous-chemins uniquement) qu'au premier compteur
// visible ; la courbe est celle de ST.ease.
function chargerAnime(): Promise<Anime> {
  animePromise ??= Promise.all([import("animejs/animation"), import("animejs/easings/cubic-bezier")]).then(
    ([{ animate }, { cubicBezier }]) => ({ animate, ease: cubicBezier(0.22, 1, 0.36, 1) }),
  );
  return animePromise;
}

type NombreDecompose = {
  prefix: string;
  suffix: string;
  target: number;
  decimales: number;
  sepDecimal: string;
  sepGroupe: string;
};

// Premier nombre du texte (chiffres, espaces de groupe, décimale « , » ou « . »).
const RE_NOMBRE = /-?\d(?:[\d\s  ]*\d)?(?:[.,]\d+)?/;

/**
 * « 12 000,5 FCFA » → { prefix:"", target:12000.5, decimales:1, suffix:" FCFA" }.
 * Null si rien à compter, ou si le nombre fait partie d'une date/heure
 * (« 12/05 », « 10:30 ») : animer un jour du mois n'aurait aucun sens.
 */
function decomposerNombre(texte: string): NombreDecompose | null {
  const m = RE_NOMBRE.exec(texte);
  if (!m) return null;
  const brut = m[0];
  const apres = texte.slice(m.index + brut.length);
  if (/^[/:\-.]\d/.test(apres)) return null;
  const sansEspaces = brut.replace(/[\s  ]/g, "");
  const sepDecimal = sansEspaces.includes(",") ? "," : ".";
  const normalise = sansEspaces.replace(",", ".");
  const target = Number(normalise);
  if (!Number.isFinite(target)) return null;
  const fraction = normalise.split(".")[1];
  const groupe = /[\s  ]/.exec(brut);
  return {
    prefix: texte.slice(0, m.index),
    suffix: apres,
    target,
    decimales: fraction ? fraction.length : 0,
    sepDecimal,
    sepGroupe: groupe ? groupe[0] : "",
  };
}

// Reproduit la mise en forme d'origine (mêmes séparateurs), pas celle d'Intl :
// le compteur ne doit pas changer d'aspect entre deux images.
function formaterNombre(n: number, d: NombreDecompose): string {
  const [entier, fraction] = Math.abs(n).toFixed(d.decimales).split(".");
  const groupe = d.sepGroupe ? entier.replace(/\B(?=(\d{3})+(?!\d))/g, d.sepGroupe) : entier;
  return (n < 0 ? "-" : "") + groupe + (fraction ? d.sepDecimal + fraction : "");
}

/**
 * Affiche `value` telle quelle (le HTML porte la valeur finale dès le rendu
 * serveur) et, si c'est un texte numérique, compte jusqu'à elle quand elle
 * devient visible. Additif : sans JS, sans anime.js ou en reduced-motion,
 * rien ne bouge. Un ReactNode non textuel est rendu sans traitement.
 */
export function StCountUp({ value, className = "" }: { value: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Dernière valeur affichée : un changement de période repart d'elle, pas de zéro.
  const courant = useRef<number | null>(null);
  const texte = typeof value === "string" || typeof value === "number" ? String(value) : null;

  useEffect(() => {
    const el = ref.current;
    if (!el || texte === null) return;
    // On écrit dans le nœud texte que React possède (nodeValue), jamais via
    // textContent : ce dernier remplacerait le nœud et React perdrait la main.
    const noeud = el.firstChild;
    if (!noeud || noeud.nodeType !== Node.TEXT_NODE) return;

    const parsed = decomposerNombre(texte);
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const depart = courant.current ?? 0;
    if (!parsed || reduit || depart === parsed.target) {
      // Pas d'animation : on s'assure que la valeur finale est bien affichée
      // (une animation précédente a pu écrire une image intermédiaire).
      noeud.nodeValue = texte;
      if (parsed) courant.current = parsed.target;
      return;
    }

    let arrete = false;
    let anim: { pause(): unknown } | null = null;
    const lancer = () => {
      chargerAnime()
        .then(({ animate, ease }) => {
          if (arrete) return;
          const v = { n: depart };
          anim = animate(v, {
            n: parsed.target,
            duration: DUREE_COMPTEUR_MS,
            ease,
            onUpdate: () => {
              courant.current = v.n;
              noeud.nodeValue = parsed.prefix + formaterNombre(v.n, parsed) + parsed.suffix;
            },
            onComplete: () => {
              courant.current = parsed.target;
              noeud.nodeValue = texte;
            },
          });
        })
        // anime.js indisponible (réseau) : le HTML porte déjà la valeur finale.
        .catch(() => {
          courant.current = parsed.target;
        });
    };

    if (!("IntersectionObserver" in window)) {
      lancer();
      return () => {
        arrete = true;
        anim?.pause();
      };
    }
    const io = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting)) return;
        io.disconnect();
        lancer();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      arrete = true;
      io.disconnect();
      anim?.pause();
    };
  }, [texte]);

  if (texte === null) return <>{value}</>;
  return (
    <span ref={ref} className={className}>
      {texte}
    </span>
  );
}

/* ───────────────────────── StKpi — card dashboard ────────────────────── */

export function StKpi({
  label,
  value,
  unit,
  icon: Icon,
  chip,
  bezel = false,
  children,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: LucideIcon;
  chip?: ReactNode;
  /** Coque double-bezel (voir StCard). */
  bezel?: boolean;
  children?: ReactNode;
}) {
  return (
    <StCard className="!p-[16px_18px]" bezel={bezel}>
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold" style={{ color: ST.textSecondary }}>{label}</span>
        {Icon && <Icon size={18} style={{ color: ST.green }} />}
      </div>
      <div className="text-[21px] md:text-[23px] font-extrabold my-2 tabular-nums tracking-[-0.01em]" style={{ color: ST.text }}>
        <StCountUp value={value} />
        {unit && <span className="text-[13px] ml-1 tracking-normal" style={{ color: ST.textMuted }}>{unit}</span>}
      </div>
      {chip}
      {children}
    </StCard>
  );
}

/* ───────────────────────── StKpiCompact — icône box + valeur ─────────── */

export function StKpiCompact({
  label,
  value,
  unit,
  icon: Icon,
  tone = "green",
  bezel = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon: LucideIcon;
  tone?: "green" | "amber" | "blue" | "rose";
  /** Coque double-bezel (voir StCard). */
  bezel?: boolean;
}) {
  const tones = {
    green: { background: ST.greenSoft, color: ST.green },
    amber: { background: ST.amberSoft, color: ST.amberText },
    blue: { background: ST.blueSoft, color: ST.blueText },
    rose: { background: ST.roseSoft, color: ST.roseText },
  }[tone];
  return (
    <StCard className="!p-[14px_18px] flex items-center gap-[13px]" bezel={bezel}>
      <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0" style={tones}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <div className="text-[17px] md:text-[19px] font-extrabold tabular-nums truncate" style={{ color: ST.text }}>
          <StCountUp value={value} />
          {unit && <span className="text-[12px] ml-1" style={{ color: ST.textMuted }}>{unit}</span>}
        </div>
        <div className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>{label}</div>
      </div>
    </StCard>
  );
}

/* ───────────────────────── StStatusPill ──────────────────────────────── */

const STATUS_MAP: Record<string, { label: string; tone: "green" | "amber" | "rose" | "neutral"; icon?: LucideIcon; dot?: boolean }> = {
  ACTIF: { label: "Actif", tone: "green", dot: true },
  ACTIVE: { label: "Actif", tone: "green", dot: true },
  TRAITE: { label: "Traité", tone: "green", icon: CheckCircle2 },
  EN_ATTENTE: { label: "En attente", tone: "amber", icon: Clock },
  PENDING: { label: "En attente", tone: "amber", icon: Clock },
  REFUSE: { label: "Refusé", tone: "rose", icon: XCircle },
  BROUILLON: { label: "Brouillon", tone: "neutral" },
  DRAFT: { label: "Brouillon", tone: "neutral" },
  ARCHIVE: { label: "Archivé", tone: "neutral" },
};

export function StStatusPill({ status, label }: { status: string; label?: string }) {
  const cfg = STATUS_MAP[status.toUpperCase()] ?? { label: label ?? status, tone: "neutral" as const };
  const tones = {
    green: { background: ST.greenSoft, color: ST.green },
    amber: { background: ST.amberSoft, color: ST.amberText },
    rose: { background: ST.roseSoft, color: ST.roseText },
    neutral: { background: "#f1efe8", color: "#5f5e5a" },
  }[cfg.tone];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold px-[9px] py-[3px] rounded-full whitespace-nowrap tabular-nums shadow-[inset_0_0_0_1px_rgba(14,21,18,.04)]"
      style={tones}
    >
      {cfg.dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: ST.greenBright, boxShadow: "0 0 0 2px rgba(34,197,94,.18)" }}
        />
      )}
      {Icon && <Icon size={12} />}
      {label ?? cfg.label}
    </span>
  );
}

/* ───────────────────────── StTabs — pills avec actif vert sombre ─────── */

export function StTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    // max-w-full + défilement interne : cinq onglets sur un petit écran ne
    // doivent jamais faire déborder la page.
    <div
      role="group"
      className="inline-flex max-w-full gap-1 overflow-x-auto bg-white rounded-[13px] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ border: `1px solid ${ST.cardBorder}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(16,52,32,.04)" }}
    >
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.key)}
            className={
              "text-[12.5px] font-extrabold px-3.5 py-2 rounded-[10px] whitespace-nowrap tabular-nums " +
              `transition-[background-color,color,transform,box-shadow] duration-300 ${EASE_CLS} ` +
              "active:scale-[.97] active:duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:rounded-[10px] " +
              "motion-reduce:transition-none motion-reduce:active:scale-100 " +
              (on
                ? "bg-[#0b3b20] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_1px_2px_rgba(11,59,32,.25)] focus-visible:outline-[#006e2f]"
                : "text-[#5d7166] hover:bg-[#f1f5f2] hover:text-[#13241b] focus-visible:outline-[#006e2f]")
            }
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1">· {t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── StProgressBar ─────────────────────────────── */

export function StProgressBar({
  percent,
  height = 9,
  className = "",
}: {
  percent: number;
  height?: number;
  className?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(p)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`rounded-full overflow-hidden ${className}`}
      style={{ height, background: "#e9efeb", boxShadow: "inset 0 1px 1px rgba(14,21,18,.05)" }}
    >
      {/* Barre pleine largeur découpée par clip-path (animable sans layout) :
          le dégradé et les bouts ronds restent intacts à tous les pourcentages. */}
      <div
        className={`h-full w-full rounded-full transition-[clip-path] duration-700 ${EASE_CLS} motion-reduce:transition-none`}
        style={{
          clipPath: `inset(0 ${100 - p}% 0 0 round 9999px)`,
          background: ST.gradientH,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)",
        }}
      />
    </div>
  );
}

/* ───────────────────────── Graphiques — tooltip verre, squelette, vide ── */

type PointTooltip = { value?: unknown; name?: unknown; color?: string; stroke?: string; dataKey?: unknown };

/**
 * Contenu de <Tooltip content={<StChartTooltip … />} /> (recharts injecte
 * active/payload/label). Typé structurellement : ce fichier n'importe pas
 * recharts, pour ne pas l'embarquer dans les pages sans graphique.
 */
export function StChartTooltip({
  active,
  payload,
  label,
  formatValue,
  formatLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<PointTooltip>;
  label?: unknown;
  /** Formate une valeur selon sa série (ex. « 12 000 F CFA »). */
  formatValue?: (value: number, name: string) => string;
  /** Formate l'en-tête (le libellé de l'axe X par défaut). */
  formatLabel?: (label: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const titre = label === undefined || label === null ? "" : String(label);
  return (
    <div
      className={
        "min-w-[136px] rounded-[14px] px-3.5 py-2.5 bg-white supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:backdrop-blur-md " +
        "ring-1 ring-black/[.06] shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_1px_2px_rgba(14,21,18,.05),0_12px_28px_-12px_rgba(3,35,20,.3)]"
      }
    >
      {titre && (
        <div className="text-[11px] font-bold mb-1.5" style={{ color: ST.textSecondary }}>
          {formatLabel ? formatLabel(titre) : titre}
        </div>
      )}
      <ul className="m-0 p-0 list-none space-y-1">
        {payload.map((p, i) => {
          const nom = typeof p.name === "string" ? p.name : String(p.dataKey ?? "");
          const brut = typeof p.value === "number" ? p.value : Number(p.value);
          const valeur = Number.isFinite(brut)
            ? formatValue
              ? formatValue(brut, nom)
              : brut.toLocaleString("fr-FR")
            : "—";
          return (
            <li key={`${nom}-${i}`} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>
                <span aria-hidden className="inline-block w-2 h-2 rounded-full" style={{ background: p.color ?? p.stroke ?? ST.green }} />
                {nom}
              </span>
              <span className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>{valeur}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Squelette à la hauteur exacte du graphique : grille + aire fantôme, aucun saut de mise en page. */
export function StChartSkeleton({ height = 218 }: { height?: number }) {
  return (
    <div role="status" aria-label="Chargement du graphique" className="relative overflow-hidden motion-safe:animate-pulse" style={{ height }}>
      <div aria-hidden className="absolute inset-x-0 top-3 bottom-7 flex flex-col justify-between">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-px" style={{ background: ST.chartGrid }} />
        ))}
      </div>
      <svg aria-hidden className="absolute inset-x-0 bottom-7 w-full" style={{ height: "58%" }} viewBox="0 0 100 40" preserveAspectRatio="none">
        <path d="M0 33 C 10 31, 18 20, 28 23 S 46 12, 56 15 S 76 4, 100 7 V 40 H 0 Z" fill="#e9efeb" />
      </svg>
      <div aria-hidden className="absolute inset-x-1 bottom-0 flex justify-between">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="h-2 w-6 rounded-full" style={{ background: ST.chartGrid }} />
        ))}
      </div>
    </div>
  );
}

/** État vide d'un graphique, même hauteur, avec une explication (jamais un axe nu). */
export function StChartEmpty({
  icon: Icon,
  title,
  hint,
  height = 218,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  height?: number;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4" style={{ height }}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#f1f5f2", color: "#a9bab0" }}>
        <Icon size={22} />
      </div>
      <p className="text-[13px] font-bold mt-3" style={{ color: ST.textSecondary }}>{title}</p>
      {hint && (
        <p className="text-[11.5px] font-semibold mt-1 max-w-[260px]" style={{ color: ST.textMuted }}>
          {hint}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ───────────────────────── StSuggestion — cards pastel "Que faire" ───── */

export function StSuggestion({
  tone = "green",
  icon: Icon,
  title,
  subtitle,
  href,
  onClick,
}: {
  tone?: "green" | "amber" | "blue";
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
}) {
  const tones = {
    amber: { border: "1px solid #f3e2bd", background: "#fdf8ec", icon: "#854f0b", title: "#633806", sub: "#854f0b" },
    green: { border: "1px solid #d7ecde", background: "#f0faf3", icon: ST.green, title: "#0b3b20", sub: "#2f7a4c" },
    blue: { border: "1px solid #cfe3f5", background: "#f1f8fe", icon: ST.blueText, title: "#0c447c", sub: "#3a78b5" },
  }[tone];

  const inner = (
    <div
      className={`flex gap-[11px] items-center rounded-[13px] px-3 py-[11px] transition-transform duration-300 ${EASE_CLS} hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 cursor-pointer`}
      style={{ border: tones.border, background: tones.background }}
    >
      <Icon size={19} style={{ color: tones.icon }} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-extrabold" style={{ color: tones.title }}>{title}</div>
        {subtitle && <div className="text-[11px] font-semibold" style={{ color: tones.sub }}>{subtitle}</div>}
      </div>
      <ArrowRight size={15} style={{ color: tones.icon }} className="flex-shrink-0" />
    </div>
  );

  if (href) return <Link href={href} className="block rounded-[13px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006e2f] focus-visible:rounded-[13px]">{inner}</Link>;
  return (
    <button type="button" onClick={onClick} className="block w-full text-left rounded-[13px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006e2f] focus-visible:rounded-[13px]">
      {inner}
    </button>
  );
}

/* ───────────────────────── StStepper — wizard 5 étapes ───────────────── */

export function StStepper({
  steps,
  currentIdx,
  onStepClick,
}: {
  steps: { id: string | number; label: string }[];
  currentIdx: number;
  onStepClick?: (idx: number) => void;
}) {
  return (
    <div className="flex items-start justify-center w-full">
      {steps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const clickable = isDone && onStepClick;
        return (
          <div key={step.id} className="contents">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(idx)}
              className={`flex flex-col items-center gap-2 w-[72px] md:w-[84px] flex-shrink-0 ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold transition-all"
                style={
                  isDone
                    ? { background: ST.gradient, color: "#fff" }
                    : isCurrent
                      ? { background: "#fff", border: `3px solid ${ST.green}`, color: ST.green, boxShadow: `0 0 0 5px ${ST.greenSoft}` }
                      : { background: "#fff", border: "1.5px solid #d6e0da", color: ST.textFaint }
                }
              >
                {isDone ? <Check size={15} strokeWidth={3} /> : idx + 1}
              </div>
              <span
                className="text-[10.5px] md:text-[11.5px] font-extrabold whitespace-nowrap"
                style={{ color: isDone || isCurrent ? ST.green : ST.textFaint, fontWeight: isDone || isCurrent ? 800 : 700 }}
              >
                {step.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div
                className="flex-1 h-1 rounded-full mt-[14px] min-w-[16px]"
                style={{
                  background: isDone
                    ? ST.gradientH
                    : isCurrent
                      ? `linear-gradient(90deg,${ST.greenBright} 38%,#e4eae6 38%)`
                      : "#e4eae6",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── StInput / StTextarea ──────────────────────── */

const FIELD_BASE =
  "w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold transition-all focus:outline-none";

export function StInput({
  label,
  hint,
  error,
  valid,
  required,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  valid?: boolean;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
          {label}
          {required && <span style={{ color: ST.roseText }}> *</span>}
        </label>
      )}
      <input
        {...props}
        className={FIELD_BASE}
        style={{
          color: ST.text,
          border: error
            ? `1px solid ${ST.roseText}`
            : valid
              ? `1px solid ${ST.greenBright}`
              : "1px solid #dde6e0",
          boxShadow: valid ? `0 0 0 3px ${ST.greenSoft}` : undefined,
        }}
      />
      {error ? (
        <p className="text-[11.5px] font-bold mt-1.5" style={{ color: ST.roseText }}>{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] font-bold mt-1.5" style={{ color: ST.textMuted }}>{hint}</p>
      ) : null}
    </div>
  );
}

export function StTextarea({
  label,
  hint,
  error,
  counter,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  counter?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`${FIELD_BASE} min-h-[108px] !font-medium leading-relaxed`}
        style={{
          color: "#33453b",
          border: error ? `1px solid ${ST.roseText}` : "1px solid #dde6e0",
        }}
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-[11.5px] font-bold" style={{ color: error ? ST.roseText : ST.textMuted }}>
          {error ?? counter ?? hint ?? ""}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── StGhostCard — "Créer un produit" ──────────── */

export function StGhostCard({
  icon: Icon,
  title,
  subtitle,
  href,
  onClick,
  minHeight = 230,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  minHeight?: number;
}) {
  const inner = (
    <div
      className="flex flex-col items-center justify-center gap-[9px] rounded-[18px] transition-colors hover:bg-white cursor-pointer h-full"
      style={{ border: "2px dashed #bcd6c5", background: "#fbfdfc", minHeight }}
    >
      <div className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white" style={{ background: ST.gradient }}>
        <Icon size={22} />
      </div>
      <div className="text-[13.5px] font-extrabold" style={{ color: ST.greenDark }}>{title}</div>
      {subtitle && (
        <div className="text-[11.5px] font-semibold text-center max-w-[200px]" style={{ color: ST.textMuted }}>
          {subtitle}
        </div>
      )}
    </div>
  );
  if (href) return <Link href={href} className="block h-full">{inner}</Link>;
  return <button type="button" onClick={onClick} className="block w-full h-full text-left">{inner}</button>;
}

/* ───────────────────────── StAvatar — initiales vertes ───────────────── */

export function StAvatar({
  name,
  size = 32,
  src,
}: {
  name: string;
  size?: number;
  src?: string | null;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-extrabold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: ST.avatarBg,
        color: ST.green,
        fontSize: Math.max(10, Math.round(size * 0.34)),
      }}
    >
      {initials || "NV"}
    </div>
  );
}

/* ───────────────────────── StHeroGradient — bloc gradient vert ───────── */

export function StHeroGradient({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] p-6 text-white ${className}`}
      style={{ background: ST.gradient }}
    >
      {/* Cercles décoratifs blancs translucides (signature maquette wallet) */}
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{ right: -50, top: -60, width: 210, height: 210, background: "rgba(255,255,255,.08)" }}
      />
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{ right: 60, bottom: -90, width: 170, height: 170, background: "rgba(255,255,255,.07)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ───────────────────────── StToolCard — grille marketing ─────────────── */

export function StToolCard({
  icon: Icon,
  title,
  description,
  badge,
  href,
  tone = "green",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  href: string;
  tone?: "green" | "blue" | "amber";
}) {
  const tones = {
    green: { background: ST.greenSoft, color: ST.green },
    blue: { background: ST.blueSoft, color: ST.blueText },
    amber: { background: ST.amberSoft, color: ST.amberText },
  }[tone];
  return (
    <Link href={href} className="block h-full">
      <StCard className={`!p-[17px] relative flex flex-col gap-2.5 min-h-[148px] h-full transition-transform duration-300 ${EASE_CLS} hover:-translate-y-0.5 motion-reduce:hover:translate-y-0`}>
        {badge && (
          <span
            className="absolute top-[13px] right-[13px] text-[10px] font-extrabold px-[9px] py-[3px] rounded-full"
            style={{ background: ST.amberSoft, color: ST.amberText }}
          >
            {badge}
          </span>
        )}
        <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center" style={tones}>
          <Icon size={19} />
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>{title}</div>
          <div className="text-[11.5px] font-semibold leading-normal mt-1" style={{ color: ST.textSecondary }}>
            {description}
          </div>
        </div>
        <div className="text-[11.5px] font-extrabold flex items-center gap-1" style={{ color: ST.green }}>
          Ouvrir <ArrowRight size={13} />
        </div>
      </StCard>
    </Link>
  );
}
