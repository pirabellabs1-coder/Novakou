// Refonte par Augustin Mékongo + Fatou Diallo — bureau 2026-05-26 (votes 7, 8, 13)
// Refonte hero/KPI style KAZA — Sophie Tremblay + Léa Moreau, 2026-06-07
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { countryName } from "@/lib/tracking/geo";
import { Flag } from "@/components/ui/Flag";
import { CommunityBanner } from "@/components/formations/CommunityBanner";

// Bloc KPI comparable côté API (vote 7) — même shape pour `current` et `previous`
type PeriodKpis = {
  revenue: number;
  sales: number;
  students: number;
  aov: number;
};

type Dashboard = {
  kpis: {
    totalRevenue: number;
    netRevenue: number;
    totalStudents: number;
    totalProducts: number;
    avgRating: number;
    totalReviews: number;
  };
  monthlyChart: { month: string; amount: number; sales: number }[];
  recentSales: {
    id: string;
    buyerName: string;
    productTitle: string;
    productType: string;
    amount: number;
    createdAt: string;
  }[];
  topProducts: {
    id: string;
    title: string;
    type: string;
    revenue: number;
    sales: number;
    rating: number;
    reviewsCount: number;
    status: string;
    engagement: number;
  }[];
  sparkline7d?: { date: string; amount: number }[];
  topCountries?: { country: string; sales: number; revenue: number }[];
  deltas?: { revenue: number; sales: number; students: number };
  split90?: { name: string; value: number }[];
  spark14?: { date: string; amount: number }[];
  current?: PeriodKpis;
  previous?: PeriodKpis;
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "À l'instant";
  if (h < 24) return `Il y a ${h}h`;
  if (d === 1) return "Hier";
  return `Il y a ${d}j`;
}

function DeltaBadge({ value, suffix = "%" }: { value?: number; suffix?: string }) {
  if (value === undefined) return null;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <span className="material-symbols-outlined text-[12px] leading-none">
        {positive ? "trending_up" : "trending_down"}
      </span>
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

/**
 * Ligne delta sous le chiffre principal d'une card KPI.
 * Vote 7 — format strict : "↑ 12,3 % vs 30 jours précédents" (vert) ou "↓ 4,1 % …" (rouge).
 * Quand `previous = 0` → on affiche "—" pour ne pas calculer Infinity/NaN.
 */
function DeltaLine({
  current,
  previous,
}: {
  current?: number;
  previous?: number;
}) {
  if (current === undefined || previous === undefined) {
    return (
      <p className="text-[10px] text-slate-400 mt-1 leading-tight">
        — vs 30 jours précédents
      </p>
    );
  }
  if (previous === 0) {
    return (
      <p className="text-[10px] text-slate-400 mt-1 leading-tight">
        — vs 30 jours précédents
      </p>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const positive = pct >= 0;
  // Format français avec virgule + 1 décimale
  const formatted = Math.abs(pct).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return (
    <p
      className={`text-[10px] mt-1 leading-tight font-semibold ${
        positive ? "text-emerald-700" : "text-rose-700"
      }`}
    >
      <span aria-hidden>{positive ? "↑" : "↓"}</span>{" "}
      {formatted}&nbsp;%{" "}
      <span className="font-normal text-slate-400">vs 30 jours précédents</span>
    </p>
  );
}

/**
 * Sparkline SVG maison (poly-line) — pas de dépendance Recharts pour les 14j de la card revenue.
 * Vote 8 : ≤ 60 lignes, dégradé sous la courbe pour cohérence visuelle avec les autres cards.
 * Si la série est absente / vide → on ne rend rien (composant skippé sans crasher).
 */
function SvgSparkline({
  data,
  color = "#006e2f",
  height = 40,
}: {
  data?: { date: string; amount: number }[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length === 0) return null;
  const values = data.map((d) => d.amount);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 100; // viewBox unitless, le SVG se stretch en 100 %
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = i * stepX;
    // marge top/bottom de 10 % pour ne pas coller au bord
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return { x, y };
  });
  const linePath = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
  const gradId = `spark-svg-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full block"
      style={{ height: `${height}px` }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function MiniSpark({ data, color = "#22c55e" }: { data: { date: string; amount: number }[]; color?: string }) {
  if (!data || data.length === 0) return <div className="h-10" />;
  const id = `spark-${color.replace(/[^a-z0-9]/gi, "")}-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <div className="h-10 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="amount" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  delta,
  current,
  previous,
  showDeltaLine,
  spark,
  svgSpark,
  accent,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  /** Valeur courante (J-30 → J) du KPI — utilisée par la ligne "vs 30 jours précédents". */
  current?: number;
  /** Valeur précédente (J-60 → J-30) du KPI. Si 0 → on affiche "—" au lieu de Infinity. */
  previous?: number;
  /** Active la ligne delta sous le chiffre (uniquement KPI principaux : revenue, ventes, étudiants). */
  showDeltaLine?: boolean;
  spark?: { date: string; amount: number }[];
  /** Si true, on rend un SVG maison à la place de MiniSpark (Recharts). Vote 8 : revenue card. */
  svgSpark?: boolean;
  accent: string;
  icon: string;
}) {
  // Refonte style KAZA : icône en boîte claire ronde, label discret en haut,
  // grand nombre proéminent, delta + sparkline en bas. Carte plus blanche,
  // hover plus subtil, padding plus généreux.
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-0.5 transition-all duration-300 group">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `${accent}12`, color: accent }}
      >
        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-500 mb-1.5">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight break-all">{value}</span>
        {unit && <span className="text-sm font-bold text-slate-400">{unit}</span>}
      </div>
      {(showDeltaLine || delta !== undefined) && (
        <div className="mt-3 flex items-center gap-2">
          {delta !== undefined && <DeltaBadge value={delta} />}
          {showDeltaLine && <DeltaLine current={current} previous={previous} />}
        </div>
      )}
      {spark && spark.length > 0 && (
        svgSpark ? (
          <div className="mt-3 -mx-1">
            <SvgSparkline data={spark} color={accent} />
          </div>
        ) : (
          <div className="mt-3">
            <MiniSpark data={spark} color={accent} />
          </div>
        )
      )}
    </div>
  );
}

const PIE_COLORS = ["#006e2f", "#22c55e", "#86efac", "#bbf7d0"];

export default function VendeurDashboard() {
  const { data: sessionData } = useSession();
  const vendorName = sessionData?.user?.name ?? "Créateur";
  const vendorInitials = vendorName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "CR";
  const { data: response, isLoading } = useQuery<{ data: Dashboard | null }>({
    queryKey: ["vendeur-dashboard"],
    queryFn: () => fetch("/api/formations/vendeur/dashboard").then((r) => r.json()),
    staleTime: 30_000,
  });

  const { data: kycResp } = useQuery<{ data: { currentLevel: number; pending: { id: string } | null } }>({
    queryKey: ["kyc-status"],
    queryFn: () => fetch("/api/formations/kyc").then((r) => r.json()),
    staleTime: 60_000,
  });
  const kycLevel = kycResp?.data?.currentLevel ?? 0;
  const kycPending = !!kycResp?.data?.pending;
  const needsKyc = kycLevel < 2;

  const d = response?.data;
  const monthly = d?.monthlyChart ?? [];
  const hasNoProducts = !isLoading && (d?.topProducts ?? []).length === 0 && (d?.kpis.totalProducts ?? 0) === 0;
  const split = (d?.split90 ?? []).filter((s) => s.value > 0);
  const splitTotal = split.reduce((s, x) => s + x.value, 0);

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto">
        {/* ── Hero style KAZA Pro — gradient navy + badge Pro + actions premium ── */}
        <header
          className="relative overflow-hidden rounded-3xl mb-8 p-7 md:p-10 text-white"
          style={{
            background:
              "linear-gradient(135deg, #0b2540 0%, #103057 45%, #1a4a7d 100%)",
          }}
        >
          {/* Halos décoratifs subtils */}
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-12 w-[360px] h-[360px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #006e2f 0%, transparent 70%)" }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="min-w-0 flex items-center gap-4 md:gap-5">
              {/* Avatar avec initiales */}
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-extrabold text-lg md:text-xl flex-shrink-0 shadow-lg">
                {vendorInitials}
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-500 text-white shadow-md">
                  Pro
                </span>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight truncate">
                  {vendorName}
                </h1>
                <p className="text-xs md:text-sm text-white/70 mt-1">
                  {(d?.kpis?.totalProducts ?? 0)} produit{(d?.kpis?.totalProducts ?? 0) > 1 ? "s" : ""} actif{(d?.kpis?.totalProducts ?? 0) > 1 ? "s" : ""} · Espace Novakou Pro
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <Link
                href="/vendeur/produits/creer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Nouveau produit
              </Link>
              <Link
                href="/vendeur/statistiques"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)" }}
              >
                <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                Analytics complètes
              </Link>
            </div>
          </div>
        </header>

        <CommunityBanner tone="vendeur" />

        {/* Alerte "ventes en chute" — bureau 2026-05-26 (suivi rapport final) */}
        {(() => {
          const curRev = d?.current?.revenue;
          const prevRev = d?.previous?.revenue;
          if (curRev == null || prevRev == null || prevRev <= 0) return null;
          const drop = (curRev - prevRev) / prevRev; // négatif si baisse
          if (drop > -0.3) return null; // seuil : baisse > 30%
          const dropPct = Math.round(Math.abs(drop) * 100);
          return (
            <div className="mb-6 rounded-2xl p-5 flex items-start gap-4 border bg-rose-50 border-rose-200">
              <div className="w-11 h-11 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Vos ventes ont chuté de {dropPct} % vs la période précédente
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Revenu courant : <strong>{formatFCFA(curRev)} FCFA</strong> contre <strong>{formatFCFA(prevRev)} FCFA</strong> sur la période d&apos;avant.
                  Pensez à relancer une campagne marketing, à booster une formation ou à activer une séquence email vers vos paniers abandonnés.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    href="/vendeur/marketing"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">campaign</span>
                    Lancer une campagne
                  </Link>
                  <Link
                    href="/vendeur/abandons"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">restore</span>
                    Voir les paniers abandonnés
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* KYC banner */}
        {needsKyc && (
          <div className={`mb-8 rounded-2xl p-5 flex items-start gap-4 border ${kycPending ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${kycPending ? "bg-amber-500" : "bg-rose-500"}`}>
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                {kycPending ? "hourglass_top" : "warning"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">
                {kycPending ? "Vérification d'identité en cours" : "Vérification d'identité requise avant tout retrait"}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {kycPending
                  ? "Votre demande est examinée (24-48h ouvrées)."
                  : "Vos ventes s'accumulent, mais vous ne pourrez retirer vos gains qu'après validation."}
              </p>
              {!kycPending && (
                <Link
                  href="/kyc"
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-white text-xs font-bold"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  Soumettre ma pièce d&apos;identité
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {hasNoProducts && (
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="flex-1">
              <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">
                Bienvenue
              </span>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                Publiez votre premier produit
              </h3>
              <p className="text-sm text-slate-400 max-w-xl">
                Formation vidéo, ebook, template ou pack — vous commencez à vendre dès la publication.
                10 % de commission seulement.
              </p>
            </div>
            <Link
              href="/vendeur/produits/creer"
              className="px-6 py-3.5 rounded-xl bg-emerald-400 text-emerald-950 text-sm font-bold hover:bg-emerald-300 transition-colors shadow-lg flex-shrink-0"
            >
              Créer mon premier produit →
            </Link>
          </div>
        )}

        {/* KPI grid — vote 7 : delta line "↑ 12,3 % vs 30 jours précédents" sous les 3 KPI principaux.
            Source de vérité : d.current (J-30→J) vs d.previous (J-60→J-30). Si previous=0 → "—".
            Vote 8 : svgSpark activé uniquement sur la card revenue (SVG maison, pas Recharts). */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Revenus nets"
            value={isLoading ? "…" : formatFCFA(d?.kpis.netRevenue ?? 0)}
            unit="FCFA"
            current={d?.current?.revenue}
            previous={d?.previous?.revenue}
            showDeltaLine
            spark={d?.spark14}
            svgSpark
            accent="#006e2f"
            icon="payments"
          />
          <KpiCard
            label="Ventes (30j)"
            value={isLoading ? "…" : (d?.current?.sales ?? d?.recentSales?.length ?? 0).toLocaleString("fr-FR")}
            current={d?.current?.sales}
            previous={d?.previous?.sales}
            showDeltaLine
            spark={d?.spark14}
            accent="#0ea5e9"
            icon="shopping_bag"
          />
          <KpiCard
            label="Apprenants actifs"
            value={isLoading ? "…" : (d?.kpis.totalStudents ?? 0).toLocaleString("fr-FR")}
            current={d?.current?.students}
            previous={d?.previous?.students}
            showDeltaLine
            accent="#a855f7"
            icon="group"
          />
          <KpiCard
            label="Note moyenne"
            value={isLoading ? "…" : (d?.kpis.avgRating ?? 0) > 0 ? (d?.kpis.avgRating ?? 0).toFixed(2) : "—"}
            unit={(d?.kpis.avgRating ?? 0) > 0 ? `/5 · ${d?.kpis.totalReviews ?? 0} avis` : ""}
            accent="#f59e0b"
            icon="star"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue chart (composed) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-7">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-widest mb-1 block">
                  Performance
                </span>
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
                  Revenus & ventes — 6 derniers mois
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Revenus
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-900" /> Ventes
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="h-[300px] bg-slate-50 animate-pulse rounded-xl" />
            ) : monthly.every((m) => m.amount === 0) ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">show_chart</span>
                <p className="text-sm font-semibold text-slate-500 mt-2">Aucune vente sur la période</p>
                <p className="text-xs text-slate-400 mt-1">Vos revenus apparaîtront dès la première transaction.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#006e2f" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                  <Tooltip
                    cursor={{ fill: "rgba(34,197,94,0.05)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      fontWeight: 600,
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "Revenus") return [`${formatFCFA(value)} FCFA`, name];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="amount" name="Revenus" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="sales" name="Ventes" stroke="#064e3b" strokeWidth={2.5} dot={{ r: 4, fill: "#064e3b" }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue split donut */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-7">
            <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-widest mb-1 block">
              Mix produits
            </span>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-4">
              Revenus par type — 90j
            </h3>
            {isLoading ? (
              <div className="h-[220px] bg-slate-50 animate-pulse rounded-xl" />
            ) : splitTotal === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">donut_large</span>
                <p className="text-sm font-semibold text-slate-500 mt-2">Pas encore de données</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={split}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {split.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(v: number) => [`${formatFCFA(v)} FCFA`, ""]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center -mt-[120px] pointer-events-none mb-12">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
                  <p className="text-base font-extrabold text-slate-900 tabular-nums">
                    {formatFCFA(splitTotal / 1000)}k
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sparkline 7j + Top countries + Recent sales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* 7d sparkline */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-7">
            <div className="flex items-end justify-between mb-4">
              <div>
                <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-widest mb-1 block">
                  7 derniers jours
                </span>
                <h3 className="text-lg font-bold tracking-tight text-slate-900">Revenus quotidiens</h3>
              </div>
              <span className="text-base tabular-nums font-extrabold text-emerald-700">
                {formatFCFA((d?.sparkline7d ?? []).reduce((s, x) => s + x.amount, 0))} FCFA
              </span>
            </div>
            {isLoading ? (
              <div className="h-[140px] bg-slate-50 animate-pulse rounded-xl" />
            ) : (d?.sparkline7d ?? []).every((x) => x.amount === 0) ? (
              <div className="h-[140px] flex items-center justify-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Aucune vente cette semaine</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={d?.sparkline7d ?? []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  />
                  <YAxis tick={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number) => [`${formatFCFA(v)} FCFA`, "Revenus"]}
                    labelFormatter={(l) => new Date(l).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#006e2f" strokeWidth={2.5} fill="url(#sparkGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top countries */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-7">
            <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-widest mb-1 block">
              Audience
            </span>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-4">Top pays</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-9 bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (d?.topCountries ?? []).length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-300">public</span>
                <p className="text-xs text-slate-500 mt-2">Pas encore de données géo</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(d?.topCountries ?? []).map((tc, i) => {
                  const max = Math.max(...(d?.topCountries ?? []).map((x) => x.revenue), 1);
                  const pct = (tc.revenue / max) * 100;
                  return (
                    <div key={tc.country} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Flag code={tc.country} size="md" />
                          <span className="text-xs font-bold text-slate-900 truncate">{countryName(tc.country)}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tc.sales}</span>
                        </div>
                        <span className="text-xs tabular-nums font-bold text-emerald-700">
                          {formatFCFA(tc.revenue)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${PIE_COLORS[i % PIE_COLORS.length]}, ${PIE_COLORS[(i + 1) % PIE_COLORS.length]})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent sales + Top products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Recent sales */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-widest mb-1 block">
                  Activité
                </span>
                <h3 className="text-lg font-bold tracking-tight text-slate-900">Ventes récentes</h3>
              </div>
              <Link
                href="/vendeur/transactions"
                className="text-[11px] font-bold text-[#006e2f] uppercase tracking-wider hover:underline"
              >
                Voir tout →
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 bg-slate-100 animate-pulse rounded" />
                      <div className="h-2 w-16 bg-slate-100 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (d?.recentSales ?? []).length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                <p className="text-xs text-slate-500 mt-2">Aucune vente pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(d?.recentSales ?? []).slice(0, 5).map((sale) => {
                  const initials = sale.buyerName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={sale.id} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{sale.buyerName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{sale.productTitle}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-extrabold text-emerald-700 tabular-nums">+{formatFCFA(sale.amount)}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">{timeAgo(sale.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top products */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-widest mb-1 block">
                  Catalogue
                </span>
                <h3 className="text-lg font-bold tracking-tight text-slate-900">Produits performants</h3>
              </div>
              <Link
                href="/vendeur/produits"
                className="text-[11px] font-bold text-[#006e2f] uppercase tracking-wider hover:underline"
              >
                Tous mes produits →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}
              </div>
            ) : (d?.topProducts ?? []).length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                <p className="text-sm font-semibold text-slate-700 mt-2">Aucun produit publié</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Créez votre premier produit pour voir vos performances ici.</p>
                <Link
                  href="/vendeur/produits/creer"
                  className="inline-block px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md"
                  style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                >
                  Créer un produit
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(d?.topProducts ?? []).slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                    <span className="text-2xl font-extrabold tabular-nums text-slate-200 w-8 text-center group-hover:text-emerald-300 transition-colors">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{p.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">shopping_bag</span>
                          {p.sales} ventes
                        </span>
                        {p.rating > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            {p.rating.toFixed(1)} ({p.reviewsCount})
                          </span>
                        )}
                        {p.engagement > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            {p.engagement}% complétion
                          </span>
                        )}
                      </div>
                      <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[280px]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(p.revenue / Math.max(...(d?.topProducts ?? []).map((x) => x.revenue), 1)) * 100}%`,
                            background: "linear-gradient(90deg, #006e2f, #22c55e)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-extrabold text-slate-900 tabular-nums">{formatFCFA(p.revenue)}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">FCFA</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
