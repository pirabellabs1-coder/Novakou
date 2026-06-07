/**
 * Design system KAZA partagé — composants réutilisables pour la refonte
 * des espaces vendeur, apprenant, mentor, admin, agence.
 *
 * Inspiré de la plateforme immobilière KAZA :
 * - Hero card navy gradient 3-stop (#0b2540 → #103057 → #1a4a7d)
 * - Badge pill orange "Pro" ou vert "ACTIF"
 * - Cards bg-white rounded-2xl shadow-sm border-slate-100
 * - Boutons vert plein emerald-500 (primary) ou navy (secondary)
 * - Inputs border-2 slate-200 rounded-xl focus emerald
 * - Typography : Manrope, weights 600-800 pour titres
 * - Aucun emoji — toutes les icônes via Lucide React
 *
 * Usage :
 *   import { KazaHero, KazaCard, KazaKpiCard, KazaButton, KazaInput,
 *            KazaBadge, KazaSection, KazaEmpty } from "@/components/kaza";
 */

"use client";

import { type LucideIcon, ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

/* ───────────────────────── Style tokens ─────────────────────────────── */

export const KAZA_NAVY = "#0b2540";
export const KAZA_GRADIENT =
  "linear-gradient(135deg, #0b2540 0%, #103057 45%, #1a4a7d 100%)";

/* ───────────────────────── Hero navy KAZA ───────────────────────────── */

interface KazaHeroProps {
  /** Badge pill au-dessus du titre. Ex : "Pro", "Apprenant", "Étape 3/8" */
  badge?: string;
  /** Couleur du badge — orange (pro), vert (actif), bleu (info), blanc */
  badgeColor?: "orange" | "green" | "blue" | "white";
  /** Titre principal (h1 4xl extrabold) */
  title: string;
  /** Sous-titre slate-300 sous le titre */
  subtitle?: string;
  /** Avatar à gauche (initiales 64×64 verre dépoli). Ex : "VK" */
  avatar?: string;
  /** Icône Lucide à gauche (alternative à l'avatar) */
  icon?: LucideIcon;
  /** Actions à droite — généralement des KazaButton */
  actions?: ReactNode;
  /** Contenu supplémentaire en dessous (stats inline, badges...) */
  children?: ReactNode;
}

export function KazaHero({
  badge,
  badgeColor = "orange",
  title,
  subtitle,
  avatar,
  icon: Icon,
  actions,
  children,
}: KazaHeroProps) {
  const badgeClasses = {
    orange: "bg-orange-500 text-white",
    green: "bg-emerald-500 text-white",
    blue: "bg-sky-500 text-white",
    white: "bg-white/15 backdrop-blur-md text-white border border-white/20",
  }[badgeColor];

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl"
      style={{ background: KAZA_GRADIENT }}
    >
      {/* Halos décoratifs */}
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)" }}
      />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Bloc gauche : avatar/icon + titre */}
        <div className="flex items-start md:items-center gap-4 md:gap-5">
          {avatar && (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-extrabold tracking-tight flex-shrink-0">
              {avatar.slice(0, 2).toUpperCase()}
            </div>
          )}
          {Icon && !avatar && (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-7 h-7" />
            </div>
          )}
          <div className="min-w-0">
            {badge && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${badgeClasses}`}
              >
                {badge}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-base text-slate-300 mt-1.5 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Bloc droit : actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 md:gap-3">{actions}</div>
        )}
      </div>

      {children && <div className="relative mt-6">{children}</div>}
    </div>
  );
}

/* ───────────────────────── Bouton KAZA ──────────────────────────────── */

interface KazaButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function KazaButton({
  variant = "primary",
  size = "md",
  href,
  onClick,
  disabled,
  type = "button",
  icon: Icon,
  iconRight: IconRight,
  children,
  className = "",
}: KazaButtonProps) {
  const variantClasses = {
    primary:
      "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20",
    secondary:
      "bg-white/15 backdrop-blur-md text-white border border-white/25 hover:bg-white/25",
    ghost:
      "bg-slate-100 hover:bg-slate-200 text-slate-700",
    danger:
      "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20",
  }[variant];

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-5 py-3 text-base gap-2.5",
  }[size];

  const iconSize = { sm: 14, md: 16, lg: 18 }[size];

  const content = (
    <>
      {Icon && <Icon size={iconSize} className="flex-shrink-0" />}
      <span>{children}</span>
      {IconRight && <IconRight size={iconSize} className="flex-shrink-0" />}
    </>
  );

  const base = `inline-flex items-center justify-center rounded-xl font-semibold transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={base}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {content}
    </button>
  );
}

/* ───────────────────────── Card KAZA ────────────────────────────────── */

interface KazaCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  /** Variante visuelle */
  variant?: "default" | "highlighted" | "ghost";
  /** Pas de padding (utile pour cards avec tableaux pleine largeur) */
  noPadding?: boolean;
  className?: string;
  children: ReactNode;
}

export function KazaCard({
  title,
  subtitle,
  action,
  variant = "default",
  noPadding = false,
  className = "",
  children,
}: KazaCardProps) {
  const variantClasses = {
    default: "bg-white border border-slate-100 shadow-sm",
    highlighted:
      "bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 shadow-md",
    ghost: "bg-slate-50 border border-slate-200",
  }[variant];

  return (
    <div className={`rounded-2xl ${variantClasses} ${className}`}>
      {(title || subtitle || action) && (
        <div
          className={`flex items-start justify-between gap-4 ${noPadding ? "p-5 md:p-6 pb-3" : "p-5 md:p-6 pb-3"}`}
        >
          <div className="min-w-0">
            {title && (
              <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs md:text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? "" : title || subtitle ? "p-5 md:p-6 pt-2" : "p-5 md:p-6"}>
        {children}
      </div>
    </div>
  );
}

/* ───────────────────────── KPI Card KAZA ────────────────────────────── */

interface KazaKpiCardProps {
  /** Label en sm-uppercase tracking-wide slate-500 */
  label: string;
  /** Valeur 3xl bold navy */
  value: string | number;
  /** Sous-valeur (ex: "+12% vs semaine dernière") */
  delta?: string;
  deltaTrend?: "up" | "down" | "neutral";
  /** Icône Lucide en haut à droite */
  icon: LucideIcon;
  /** Couleur de l'icône */
  iconColor?: "emerald" | "sky" | "orange" | "violet" | "rose" | "navy";
}

export function KazaKpiCard({
  label,
  value,
  delta,
  deltaTrend = "neutral",
  icon: Icon,
  iconColor = "emerald",
}: KazaKpiCardProps) {
  const iconBg = {
    emerald: "bg-emerald-100 text-emerald-600",
    sky: "bg-sky-100 text-sky-600",
    orange: "bg-orange-100 text-orange-600",
    violet: "bg-violet-100 text-violet-600",
    rose: "bg-rose-100 text-rose-600",
    navy: "bg-slate-100 text-[#0b2540]",
  }[iconColor];

  const deltaColor = {
    up: "text-emerald-600 bg-emerald-50",
    down: "text-rose-600 bg-rose-50",
    neutral: "text-slate-600 bg-slate-50",
  }[deltaTrend];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        {delta && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-md ${deltaColor}`}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-extrabold text-[#0b2540] tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
        {label}
      </div>
    </div>
  );
}

/* ───────────────────────── Input KAZA ───────────────────────────────── */

interface KazaInputProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
}

export function KazaInput({
  label,
  hint,
  error,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  id,
  className = "",
  disabled,
  icon: Icon,
}: KazaInputProps) {
  const inputId = id ?? name;
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full ${Icon ? "pl-11" : "pl-4"} pr-4 py-3 bg-white border-2 ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
          } rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed`}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-600 mt-1.5 font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500 mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

/* ───────────────────────── Badge KAZA ───────────────────────────────── */

interface KazaBadgeProps {
  variant?: "orange" | "green" | "blue" | "violet" | "slate" | "rose";
  size?: "sm" | "md";
  icon?: LucideIcon;
  children: ReactNode;
}

export function KazaBadge({
  variant = "slate",
  size = "sm",
  icon: Icon,
  children,
}: KazaBadgeProps) {
  const variantClasses = {
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    blue: "bg-sky-100 text-sky-700 border-sky-200",
    violet: "bg-violet-100 text-violet-700 border-violet-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
  }[variant];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
  }[size];

  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${variantClasses} ${sizeClasses}`}
    >
      {Icon && <Icon size={iconSize} />}
      {children}
    </span>
  );
}

/* ───────────────────────── Section title ────────────────────────────── */

interface KazaSectionProps {
  /** Label en uppercase tracking-widest slate-500 au-dessus du titre */
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function KazaSection({
  label,
  title,
  description,
  action,
  children,
  className = "",
}: KazaSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          {label && (
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
              {label}
            </div>
          )}
          <h2 className="text-xl md:text-2xl font-extrabold text-[#0b2540] tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/* ───────────────────────── Empty state ──────────────────────────────── */

interface KazaEmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function KazaEmpty({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: KazaEmptyProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 md:p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
        <Icon size={28} />
      </div>
      <h3 className="text-base md:text-lg font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          <KazaButton
            variant="primary"
            href={action.href}
            onClick={action.onClick}
            iconRight={ArrowRight}
          >
            {action.label}
          </KazaButton>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Stepper KAZA ─────────────────────────────── */

interface KazaStepperProps {
  steps: { id: string | number; label: string }[];
  currentIdx: number;
  /** Cliquer une étape déjà complétée pour y revenir */
  onStepClick?: (idx: number) => void;
}

export function KazaStepper({ steps, currentIdx, onStepClick }: KazaStepperProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-1 px-1">
      {steps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isClickable = isDone && onStepClick;

        return (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(idx)}
              className={`flex items-center gap-2.5 ${isClickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  isCurrent
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-4 ring-emerald-100"
                    : isDone
                      ? "bg-[#0b2540] text-white"
                      : "bg-slate-100 text-slate-400 border-2 border-slate-200"
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <span
                className={`text-xs md:text-sm font-semibold whitespace-nowrap hidden md:block ${
                  isCurrent
                    ? "text-[#0b2540]"
                    : isDone
                      ? "text-slate-700"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 md:w-12 mx-2 md:mx-3 ${
                  isDone ? "bg-[#0b2540]" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
