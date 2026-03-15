// ══════════════════════════════════════════════════════════════════════════
// Design Tokens Centralises — FreelanceHigh
// Source unique de verite pour couleurs, styles et utilitaires UI
// ══════════════════════════════════════════════════════════════════════════

// ── Couleurs semantiques (utilisees dans les charts, badges, indicateurs) ──
export const COLORS = {
  primary: "#22C55E",
  primaryHover: "#16A34A",
  secondary: "#0EA5E9",
  accent: "#6C2BD9",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  muted: "#64748B",
} as const;

// ── Couleurs de fond et surface ──
export const SURFACE = {
  background: "#0F172A",
  card: "#111827",
  sidebar: "#111827",
  border: "#1F2937",
  overlay: "rgba(0, 0, 0, 0.5)",
} as const;

// ── Couleurs de texte ──
export const TEXT = {
  primary: "#FFFFFF",
  secondary: "#9CA3AF",
  muted: "#6B7280",
  disabled: "#4B5563",
  link: "#22C55E",
} as const;

// ── Palette de graphiques multi-series ──
export const CHART_COLORS = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.danger,
  info: COLORS.info,
  muted: COLORS.muted,
  series: [
    "#22C55E", // vert (primary)
    "#0EA5E9", // bleu
    "#6C2BD9", // violet
    "#F59E0B", // orange
    "#EF4444", // rouge
    "#6366F1", // indigo
    "#EC4899", // rose
    "#14B8A6", // teal
  ],
} as const;

// ── Styles des tooltips de graphiques ──
export const TOOLTIP_STYLES = {
  backgroundColor: "#1E293B",
  borderColor: "rgba(255, 255, 255, 0.1)",
  textColor: "#FFFFFF",
  labelColor: "#94A3B8",
} as const;

// ── Styles des axes de graphiques ──
export const CHART_AXIS = {
  stroke: "#64748b",
  fontSize: 12,
  gridStroke: "rgba(255, 255, 255, 0.05)",
} as const;

// ── Indicateurs de tendance ──
export const STAT_CARD_TRENDS = {
  positive: {
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    icon: "trending_up",
  },
  negative: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    icon: "trending_down",
  },
  neutral: {
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    icon: "trending_flat",
  },
} as const;

// ── Couleurs de statut de commande ──
export const ORDER_STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: "En attente", color: "text-amber-400", bg: "bg-amber-400/10" },
  en_cours: { label: "En cours", color: "text-blue-400", bg: "bg-blue-400/10" },
  revision: { label: "Revision", color: "text-orange-400", bg: "bg-orange-400/10" },
  livre: { label: "Livre", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  termine: { label: "Termine", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  annule: { label: "Annule", color: "text-red-400", bg: "bg-red-400/10" },
  litige: { label: "Litige", color: "text-red-400", bg: "bg-red-400/10" },
};

// ── Couleurs de statut utilisateur ──
export const USER_STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIF: { label: "Actif", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  suspendu: { label: "Suspendu", color: "text-amber-400", bg: "bg-amber-400/10" },
  banni: { label: "Banni", color: "text-red-400", bg: "bg-red-400/10" },
};

// ── Couleurs de badge ──
export const BADGE_COLORS = {
  verified: { color: "text-blue-400", bg: "bg-blue-400/10", icon: "verified" },
  topRated: { color: "text-amber-400", bg: "bg-amber-400/10", icon: "star" },
  risingTalent: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: "trending_up" },
  pro: { color: "text-purple-400", bg: "bg-purple-400/10", icon: "workspace_premium" },
  elite: { color: "text-orange-400", bg: "bg-orange-400/10", icon: "diamond" },
} as const;

// ── Utilitaires ──

export function getTrendStyle(value: number) {
  if (value > 0) return STAT_CARD_TRENDS.positive;
  if (value < 0) return STAT_CARD_TRENDS.negative;
  return STAT_CARD_TRENDS.neutral;
}

export function formatTrend(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  const symbols: Record<string, string> = {
    EUR: "\u20AC",
    USD: "$",
    GBP: "\u00A3",
    FCFA: "FCFA",
    MAD: "MAD",
  };
  const symbol = symbols[currency] || currency;
  const formatted = amount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return currency === "FCFA" || currency === "MAD"
    ? `${formatted} ${symbol}`
    : `${symbol}${formatted}`;
}

// ── Breakpoints responsive (miroir de tailwind) ──
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// ── Constantes de pagination ──
export const PAGINATION = {
  defaultPageSize: 20,
  listingPageSize: 24,
  dashboardPageSize: 10,
  maxPageSize: 100,
} as const;
