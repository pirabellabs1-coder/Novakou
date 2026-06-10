/**
 * Design system NOVA — le langage visuel "joyeux" de Novakou (juin 2026).
 *
 * Direction artistique : VIBRANT, COOL, JOYEUX. Rupture totale avec le
 * look sobre précédent. Inspirations : Duolingo (jeu + joie), Notion
 * (bento), Stripe (gradients), Headspace (douceur).
 *
 * Principes :
 *  1. COULEURS VIVES — palette électrique : violet électrique, corail,
 *     mangue, menthe, ciel. Le navy ne sert que d'ancrage typographique.
 *  2. BENTO GRID — les dashboards sont des mosaïques de tuiles aux
 *     tailles variées, chacune avec sa personnalité.
 *  3. FORMES DOUCES — rounded-3xl partout, blobs décoratifs, pas un
 *     seul angle dur.
 *  4. MOUVEMENT — hover lift (translate-y), pop des chiffres, progress
 *     rings animés, transitions spring.
 *  5. GROS & GRAS — chiffres énormes (text-5xl+), titres extrabold,
 *     pas de timidité typographique.
 *
 * Usage :
 *   import { NovaTile, NovaBigStat, NovaProgressRing, NovaStepLine,
 *            NovaActionCard, NovaBadge, NovaButton, NovaConfettiHeader,
 *            NOVA_PALETTES } from "@/components/nova";
 */

"use client";

import { type LucideIcon, ArrowRight, ArrowUpRight, TrendingUp, TrendingDown, Check } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";

/* ───────────────────────── Palettes NOVA ─────────────────────────────
 * Chaque tuile bento choisit une "saveur". Les gradients sont assez
 * saturés pour être joyeux mais le texte reste lisible (contraste AA).
 */

export const NOVA_PALETTES = {
  violet: {
    bg: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c084fc 100%)",
    soft: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    text: "#7c3aed",
    ring: "#a855f7",
  },
  corail: {
    bg: "linear-gradient(135deg, #f43f5e 0%, #fb7185 60%, #fda4af 100%)",
    soft: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
    text: "#e11d48",
    ring: "#fb7185",
  },
  mangue: {
    bg: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 60%, #fde047 100%)",
    soft: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    text: "#d97706",
    ring: "#fbbf24",
  },
  menthe: {
    bg: "linear-gradient(135deg, #10b981 0%, #34d399 60%, #6ee7b7 100%)",
    soft: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    text: "#059669",
    ring: "#34d399",
  },
  ciel: {
    bg: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 60%, #7dd3fc 100%)",
    soft: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    text: "#0284c7",
    ring: "#38bdf8",
  },
  nuit: {
    bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%)",
    soft: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    text: "#4338ca",
    ring: "#6366f1",
  },
} as const;

export type NovaFlavor = keyof typeof NOVA_PALETTES;

/* ───────────────────── Compteur animé (pop des chiffres) ───────────── */

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current && value === target) return;
    startedRef.current = true;
    const start = performance.now();
    const from = 0;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      // ease-out-cubic — le chiffre "atterrit" en douceur
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}

/* ───────────────────────── NovaTile (bento) ──────────────────────────
 * La brique de base du bento grid. Trois styles :
 *  - "vivid"  : fond gradient plein, texte blanc — pour LA tuile star
 *  - "soft"   : fond gradient pastel — pour les tuiles secondaires
 *  - "white"  : fond blanc bordure — pour le contenu dense (listes, charts)
 */

interface NovaTileProps {
  flavor?: NovaFlavor;
  style?: "vivid" | "soft" | "white";
  /** Span de colonnes dans le bento (utiliser avec une grid parent) */
  className?: string;
  /** Lien optionnel — toute la tuile devient cliquable avec hover lift */
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}

export function NovaTile({
  flavor = "violet",
  style = "white",
  className = "",
  href,
  onClick,
  children,
}: NovaTileProps) {
  const palette = NOVA_PALETTES[flavor];
  const base =
    "relative overflow-hidden rounded-3xl p-6 transition-all duration-300 ease-out";
  const styleClasses = {
    vivid: "text-white shadow-xl",
    soft: "text-slate-900",
    white: "bg-white border border-slate-100 shadow-sm text-slate-900",
  }[style];
  const interactive = href || onClick
    ? "cursor-pointer hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 active:shadow-lg"
    : "";

  const inlineStyle =
    style === "vivid"
      ? { background: palette.bg }
      : style === "soft"
        ? { background: palette.soft }
        : undefined;

  const content = (
    <div className={`${base} ${styleClasses} ${interactive} ${className}`} style={inlineStyle} onClick={onClick}>
      {/* Blob décoratif en haut à droite pour les tuiles vivid */}
      {style === "vivid" && (
        <div
          aria-hidden
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)" }}
        />
      )}
      {children}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }
  return content;
}

/* ───────────────────────── NovaBigStat ───────────────────────────────
 * LE gros chiffre joyeux. Compteur animé + delta + icône dans pastille.
 */

interface NovaBigStatProps {
  label: string;
  value: number;
  /** Format du chiffre (ex : (n) => `${n.toLocaleString("fr-FR")} FCFA`) */
  format?: (n: number) => string;
  delta?: { value: string; trend: "up" | "down" | "flat" };
  icon: LucideIcon;
  flavor?: NovaFlavor;
  /** true = tuile gradient pleine (texte blanc) */
  vivid?: boolean;
  href?: string;
}

export function NovaBigStat({
  label,
  value,
  format = (n) => n.toLocaleString("fr-FR"),
  delta,
  icon: Icon,
  flavor = "violet",
  vivid = false,
  href,
}: NovaBigStatProps) {
  const animated = useCountUp(value);
  const palette = NOVA_PALETTES[flavor];

  return (
    <NovaTile flavor={flavor} style={vivid ? "vivid" : "white"} href={href} className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            vivid ? "bg-white/20 backdrop-blur-sm" : ""
          }`}
          style={vivid ? undefined : { background: palette.soft }}
        >
          <Icon size={22} style={vivid ? undefined : { color: palette.text }} className={vivid ? "text-white" : ""} />
        </div>
        {delta && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              vivid
                ? "bg-white/20 text-white"
                : delta.trend === "up"
                  ? "bg-emerald-50 text-emerald-600"
                  : delta.trend === "down"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-100 text-slate-600"
            }`}
          >
            {delta.trend === "up" ? <TrendingUp size={12} /> : delta.trend === "down" ? <TrendingDown size={12} /> : null}
            {delta.value}
          </span>
        )}
      </div>
      <div className={`text-4xl md:text-5xl font-black tracking-tight tabular-nums leading-none ${vivid ? "text-white" : "text-slate-900"}`}>
        {format(animated)}
      </div>
      <div className={`text-sm font-semibold mt-2 ${vivid ? "text-white/80" : "text-slate-500"}`}>
        {label}
      </div>
      {href && (
        <ArrowUpRight
          size={18}
          className={`absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity ${vivid ? "text-white" : "text-slate-400"}`}
        />
      )}
    </NovaTile>
  );
}

/* ───────────────────────── NovaProgressRing ──────────────────────────
 * Anneau de progression animé (SVG). Pour les objectifs, complétion
 * profil, progression formation…
 */

interface NovaProgressRingProps {
  /** 0 à 100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  flavor?: NovaFlavor;
  /** Contenu au centre (par défaut le %) */
  children?: ReactNode;
}

export function NovaProgressRing({
  percent,
  size = 96,
  strokeWidth = 10,
  flavor = "menthe",
  children,
}: NovaProgressRingProps) {
  const palette = NOVA_PALETTES[flavor];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    // Petit délai pour que la transition CSS du dashoffset soit visible
    const t = setTimeout(() => setAnimatedPct(clamped), 80);
    return () => clearTimeout(t);
  }, [clamped]);

  const dashOffset = circumference * (1 - animatedPct / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={palette.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="text-xl font-black text-slate-900 tabular-nums">{Math.round(animatedPct)}%</span>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── NovaStepLine ──────────────────────────────
 * LA ligne d'avancement du wizard de création. Ligne horizontale avec
 * remplissage gradient animé + pastilles par étape. L'étape courante
 * "respire" (pulse ring).
 */

interface NovaStepLineProps {
  steps: { id: string | number; label: string; optional?: boolean }[];
  currentIdx: number;
  onStepClick?: (idx: number) => void;
  flavor?: NovaFlavor;
}

export function NovaStepLine({ steps, currentIdx, onStepClick, flavor = "violet" }: NovaStepLineProps) {
  const palette = NOVA_PALETTES[flavor];
  // % de remplissage de la ligne : centre de l'étape courante
  const fillPercent = steps.length > 1 ? (currentIdx / (steps.length - 1)) * 100 : 0;

  return (
    <div className="w-full">
      <div className="relative px-5">
        {/* Ligne de fond */}
        <div className="absolute top-1/2 left-5 right-5 h-2 -translate-y-1/2 rounded-full bg-slate-100" />
        {/* Ligne de remplissage gradient animée */}
        <div
          className="absolute top-1/2 left-5 h-2 -translate-y-1/2 rounded-full"
          style={{
            width: `calc(${fillPercent}% * (100% - 40px) / 100%)`,
            maxWidth: "calc(100% - 40px)",
            background: palette.bg,
            transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        {/* Pastilles */}
        <div className="relative flex justify-between">
          {steps.map((step, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const clickable = isDone && onStepClick;
            return (
              <button
                key={step.id}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(idx)}
                className={`relative flex flex-col items-center ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                {/* Pulse ring sur l'étape courante */}
                {isCurrent && (
                  <span
                    aria-hidden
                    className="absolute top-0 w-10 h-10 rounded-full animate-ping opacity-20"
                    style={{ background: palette.ring }}
                  />
                )}
                <span
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                    isDone
                      ? "text-white scale-100"
                      : isCurrent
                        ? "text-white scale-110 shadow-lg"
                        : "bg-white border-2 border-slate-200 text-slate-400"
                  }`}
                  style={isDone || isCurrent ? { background: palette.bg } : undefined}
                >
                  {isDone ? <Check size={18} strokeWidth={3} /> : idx + 1}
                </span>
                <span
                  className={`mt-2 text-[11px] md:text-xs font-bold whitespace-nowrap hidden sm:block ${
                    isCurrent ? "text-slate-900" : isDone ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {step.label}
                  {step.optional && <span className="text-amber-500 ml-0.5">·opt</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── NovaActionCard ────────────────────────────
 * Carte d'action joyeuse — pour les "que faire ensuite ?". Icône dans
 * blob coloré, titre, flèche qui glisse au hover.
 */

interface NovaActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  flavor?: NovaFlavor;
  href?: string;
  onClick?: () => void;
  badge?: string;
}

export function NovaActionCard({
  icon: Icon,
  title,
  description,
  flavor = "ciel",
  href,
  onClick,
  badge,
}: NovaActionCardProps) {
  const palette = NOVA_PALETTES[flavor];
  const inner = (
    <div className="group relative bg-white border border-slate-100 rounded-3xl p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-transparent cursor-pointer">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ background: palette.soft }}
      >
        <Icon size={24} style={{ color: palette.text }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-slate-900 text-sm md:text-base truncate">{title}</h3>
          {badge && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
              style={{ background: palette.bg }}
            >
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{description}</p>}
      </div>
      <ArrowRight
        size={18}
        className="flex-shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1"
        style={{ color: undefined }}
      />
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return <button type="button" onClick={onClick} className="w-full text-left">{inner}</button>;
}

/* ───────────────────────── NovaButton ────────────────────────────────
 * Bouton joyeux : gradient plein, lift au hover, press au clic.
 */

interface NovaButtonProps {
  flavor?: NovaFlavor;
  variant?: "vivid" | "soft" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  className?: string;
  children: ReactNode;
}

export function NovaButton({
  flavor = "violet",
  variant = "vivid",
  size = "md",
  href,
  onClick,
  disabled,
  type = "button",
  icon: Icon,
  iconRight: IconRight,
  className = "",
  children,
}: NovaButtonProps) {
  const palette = NOVA_PALETTES[flavor];
  const sizeClasses = {
    sm: "px-3.5 py-2 text-xs gap-1.5 rounded-xl",
    md: "px-5 py-2.5 text-sm gap-2 rounded-2xl",
    lg: "px-7 py-3.5 text-base gap-2.5 rounded-2xl",
  }[size];
  const iconSize = { sm: 14, md: 16, lg: 20 }[size];

  const base = `inline-flex items-center justify-center font-extrabold transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${sizeClasses} ${className}`;
  const variantClass = {
    vivid: "text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md",
    soft: "hover:-translate-y-0.5",
    outline: "bg-white border-2 hover:-translate-y-0.5 hover:shadow-md",
  }[variant];

  const inlineStyle =
    variant === "vivid"
      ? { background: palette.bg }
      : variant === "soft"
        ? { background: palette.soft, color: palette.text }
        : { borderColor: palette.ring, color: palette.text };

  const content = (
    <>
      {Icon && <Icon size={iconSize} />}
      <span>{children}</span>
      {IconRight && <IconRight size={iconSize} />}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={`${base} ${variantClass}`} style={inlineStyle}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variantClass}`} style={inlineStyle}>
      {content}
    </button>
  );
}

/* ───────────────────────── NovaBadge ─────────────────────────────────
 * Badge gradient mini.
 */

export function NovaBadge({
  flavor = "violet",
  vivid = false,
  children,
}: {
  flavor?: NovaFlavor;
  vivid?: boolean;
  children: ReactNode;
}) {
  const palette = NOVA_PALETTES[flavor];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full ${vivid ? "text-white" : ""}`}
      style={vivid ? { background: palette.bg } : { background: palette.soft, color: palette.text }}
    >
      {children}
    </span>
  );
}

/* ───────────────────────── NovaConfettiHeader ────────────────────────
 * Le header de dashboard joyeux : salutation contextuelle + blobs
 * colorés flottants en fond + grosse typo.
 */

interface NovaConfettiHeaderProps {
  /** Prénom de l'utilisateur */
  name: string;
  /** Phrase d'accroche dynamique (ex: "3 ventes aujourd'hui, continue !") */
  tagline?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function NovaConfettiHeader({ name, tagline, actions, children }: NovaConfettiHeaderProps) {
  // Salutation selon l'heure (joyeux et personnel)
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
      {/* Blobs décoratifs flottants */}
      <div aria-hidden className="absolute -top-12 -right-8 w-48 h-48 rounded-full opacity-60 blur-2xl" style={{ background: NOVA_PALETTES.violet.soft }} />
      <div aria-hidden className="absolute -bottom-16 right-32 w-40 h-40 rounded-full opacity-60 blur-2xl" style={{ background: NOVA_PALETTES.mangue.soft }} />
      <div aria-hidden className="absolute top-4 right-64 w-24 h-24 rounded-full opacity-50 blur-xl" style={{ background: NOVA_PALETTES.menthe.soft }} />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
            {greeting}, <span className="bg-clip-text text-transparent" style={{ backgroundImage: NOVA_PALETTES.violet.bg }}>{name}</span>
          </h1>
          {tagline && <p className="text-sm md:text-base text-slate-500 font-semibold mt-2">{tagline}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children && <div className="relative mt-6">{children}</div>}
    </div>
  );
}

/* ───────────────────────── NovaEmpty ─────────────────────────────────
 * Empty state joyeux — blob gradient + icône + CTA.
 */

export function NovaEmpty({
  icon: Icon,
  title,
  description,
  flavor = "violet",
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  flavor?: NovaFlavor;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  const palette = NOVA_PALETTES[flavor];
  return (
    <div className="relative overflow-hidden bg-white rounded-3xl border-2 border-dashed border-slate-200 p-10 md:p-14 text-center">
      <div aria-hidden className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full opacity-40 blur-3xl" style={{ background: palette.soft }} />
      <div
        className="relative w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3"
        style={{ background: palette.soft }}
      >
        <Icon size={32} style={{ color: palette.text }} />
      </div>
      <h3 className="relative text-lg md:text-xl font-black text-slate-900">{title}</h3>
      {description && <p className="relative text-sm text-slate-500 mt-2 max-w-md mx-auto font-medium">{description}</p>}
      {action && (
        <div className="relative mt-6">
          <NovaButton flavor={flavor} href={action.href} onClick={action.onClick} iconRight={ArrowRight}>
            {action.label}
          </NovaButton>
        </div>
      )}
    </div>
  );
}
