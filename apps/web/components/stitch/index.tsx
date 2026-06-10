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
 * Usage :
 *   import { StCard, StPageHeader, StButton, StChip, StKpi, StKpiCompact,
 *            StStatusPill, StTabs, StProgressBar, StSuggestion, StStepper,
 *            StInput, StTextarea, StGhostCard, StAvatar, StSectionTitle,
 *            ST } from "@/components/stitch";
 */

"use client";

import Link from "next/link";
import { type LucideIcon, ArrowRight, TrendingUp, TrendingDown, Check, CheckCircle2, Clock, XCircle } from "lucide-react";
import { type ReactNode } from "react";

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
} as const;

/* ───────────────────────── StCard ────────────────────────────────────── */

export function StCard({
  className = "",
  noPadding = false,
  children,
  style,
}: {
  className?: string;
  noPadding?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-white rounded-[18px] ${noPadding ? "" : "p-5"} ${className}`}
      style={{
        border: `1px solid ${ST.cardBorder}`,
        boxShadow: "0 1px 3px rgba(16,52,32,.05)",
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

export function StButton({
  variant = "primary",
  size = "md",
  href,
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
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  const sizes = {
    sm: "px-3 py-2 text-[12px] gap-1.5 rounded-[10px]",
    md: "px-4 py-2.5 text-[13px] gap-2 rounded-[12px]",
    lg: "px-5.5 py-3 text-[13.5px] gap-2 rounded-[12px] px-6",
  }[size];
  const iconSize = { sm: 14, md: 16, lg: 17 }[size];

  const base = `inline-flex items-center justify-center font-extrabold transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] ${sizes} ${className}`;

  let styleProps: React.CSSProperties = {};
  let variantClass = "";
  switch (variant) {
    case "primary":
      styleProps = { background: ST.gradient, color: "#fff" };
      break;
    case "secondary":
      styleProps = { border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary, background: "#fff" };
      break;
    case "dark":
      styleProps = { background: ST.greenDark, color: "#fff" };
      break;
    case "white":
      styleProps = { background: "#fff", color: ST.green };
      break;
    case "ghost-green":
      styleProps = { background: ST.greenSoft, color: ST.green };
      break;
  }

  const content = (
    <>
      {Icon && <Icon size={iconSize} />}
      <span>{children}</span>
      {IconRight && <IconRight size={iconSize} />}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={`${base} ${variantClass}`} style={styleProps}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variantClass}`} style={styleProps}>
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
      className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-[3px] rounded-full"
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

/* ───────────────────────── StKpi — card dashboard ────────────────────── */

export function StKpi({
  label,
  value,
  unit,
  icon: Icon,
  chip,
  children,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: LucideIcon;
  chip?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <StCard className="!p-[16px_18px]">
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold" style={{ color: ST.textSecondary }}>{label}</span>
        {Icon && <Icon size={18} style={{ color: ST.green }} />}
      </div>
      <div className="text-[21px] md:text-[23px] font-extrabold my-2 tabular-nums" style={{ color: ST.text }}>
        {value}
        {unit && <span className="text-[13px] ml-1" style={{ color: ST.textMuted }}>{unit}</span>}
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
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon: LucideIcon;
  tone?: "green" | "amber" | "blue" | "rose";
}) {
  const tones = {
    green: { background: ST.greenSoft, color: ST.green },
    amber: { background: ST.amberSoft, color: ST.amberText },
    blue: { background: ST.blueSoft, color: ST.blueText },
    rose: { background: ST.roseSoft, color: ST.roseText },
  }[tone];
  return (
    <StCard className="!p-[14px_18px] flex items-center gap-[13px]">
      <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0" style={tones}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <div className="text-[17px] md:text-[19px] font-extrabold tabular-nums truncate" style={{ color: ST.text }}>
          {value}
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
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold px-[9px] py-[3px] rounded-full whitespace-nowrap" style={tones}>
      {cfg.dot && <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: ST.greenBright }} />}
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
    <div className="inline-flex gap-1 bg-white rounded-[13px] p-1" style={{ border: `1px solid ${ST.cardBorder}` }}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className="text-[12.5px] font-extrabold px-3.5 py-2 rounded-[10px] transition-colors whitespace-nowrap"
            style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
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
  return (
    <div className={`rounded-full overflow-hidden ${className}`} style={{ height, background: "#e9efeb" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: ST.gradientH }}
      />
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
      className="flex gap-[11px] items-center rounded-[13px] px-3 py-[11px] transition-transform hover:-translate-y-0.5 cursor-pointer"
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

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <button type="button" onClick={onClick} className="block w-full text-left">{inner}</button>;
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
      <StCard className="!p-[17px] relative flex flex-col gap-2.5 min-h-[148px] h-full transition-transform hover:-translate-y-0.5">
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
