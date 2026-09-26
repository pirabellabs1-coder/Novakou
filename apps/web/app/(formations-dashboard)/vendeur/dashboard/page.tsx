// Refonte par Augustin Mékongo + Fatou Diallo — bureau 2026-05-26 (votes 7, 8, 13)
// Refonte design "Stitch" — maquettes Google Stitch validées par Lissanon
// (stich/novakou_tableau_de_bord.html), vert Novakou officiel — 2026-06-10.
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { promptAction } from "@/store/prompt";
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  Plus,
  CalendarDays,
  Wallet,
  ShoppingBag,
  Users,
  Star,
  TrendingDown,
  Hourglass,
  AlertTriangle,
  ShieldCheck,
  LineChart,
  Receipt,
  PackageOpen,
  Ticket,
  Sparkles,
  ShoppingCart,
  RefreshCw,
  Megaphone,
  X,
} from "lucide-react";
import { countryName } from "@/lib/tracking/geo";
import { Flag } from "@/components/ui/Flag";
import { CommunityBanner } from "@/components/formations/CommunityBanner";
import { useActiveShop } from "@/components/formations/ShopProvider";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StDeltaChip,
  StKpi,
  StProgressBar,
  StSuggestion,
  StAvatar,
  StSectionTitle,
  StCountUp,
  StChartTooltip,
  StChartSkeleton,
  StChartEmpty,
  useReducedMotion,
  ST,
} from "@/components/stitch";

// Bloc KPI comparable côté API (vote 7) — même shape pour `current` et `previous`
type ShopOverview = {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  themeColor: string | null;
  isPrimary: boolean;
  revenue: number;
  sales: number;
  clients: number;
  products: number;
};

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
  monthlyChart: { month: string; amount: number; sales: number; clients: number }[];
  series?: { month: string; amount: number; sales: number; clients: number }[];
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
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `il y a ${Math.max(1, m)} min`;
  if (h < 24) return `il y a ${h} h`;
  if (d === 1) return "hier";
  return `il y a ${d} j`;
}

/** Delta % entre current et previous — null si incalculable (évite Infinity). */
function deltaPct(current?: number, previous?: number): number | null {
  if (current === undefined || previous === undefined || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Plages de visualisation (doivent correspondre aux clés RANGES de l'API). */
const RANGE_OPTIONS = [
  { key: "7d", label: "7 j" },
  { key: "14d", label: "14 j" },
  { key: "30d", label: "30 j" },
  { key: "3m", label: "3 mois" },
  { key: "6m", label: "6 mois" },
  { key: "9m", label: "9 mois" },
  { key: "12m", label: "1 an" },
] as const;

/** Sélecteur de période — chips compactes, pilote les 3 graphes. */
function RangePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Période affichée">
      {RANGE_OPTIONS.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.key)}
            className={
              "text-[11px] font-extrabold rounded-lg px-2.5 py-1 tabular-nums " +
              "transition-[background-color,color,transform,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] " +
              "active:scale-[.97] active:duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#006e2f] focus-visible:rounded-lg " +
              "motion-reduce:transition-none motion-reduce:active:scale-100 " +
              (active
                ? "bg-[#006e2f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_1px_2px_rgba(0,110,47,.3)]"
                : "bg-[#f1f5f2] text-[#5d7166] hover:bg-[#e6f5eb] hover:text-[#006e2f]")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Montant lisible dans les infobulles : « 12 000 F CFA ». */
const fmtMontant = (v: number) => `${formatFCFA(v)} F CFA`;

/** Courbe lissée (aire dégradée) réutilisée par les 3 graphes du dashboard. */
function TrendChart({
  data,
  dataKey,
  color,
  label,
  isCurrency,
  height = 218,
}: {
  data: Dashboard["monthlyChart"];
  dataKey: "amount" | "sales" | "clients";
  color: string;
  label: string;
  isCurrency?: boolean;
  height?: number;
}) {
  // La montée de l'aire (700 ms) est coupée pour qui demande moins de mouvement.
  const reduceMotion = useReducedMotion();
  const gid = `grad-${dataKey}`;
  const fmt = (v: number) => (isCurrency ? fmtMontant(v) : v.toLocaleString("fr-FR"));
  return (
    // tabular-nums hérite jusqu'aux <text> SVG des axes : colonnes de chiffres alignées.
    <div className="tabular-nums">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={ST.chartGrid} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: ST.chartTick, fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            minTickGap={20}
          />
          <YAxis
            tick={{ fill: ST.chartTick, fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={42}
            allowDecimals={false}
            tickFormatter={(v: number) => (isCurrency && v >= 1000 ? `${(v / 1000).toLocaleString("fr-FR")} k` : `${v}`)}
          />
          <Tooltip
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4", strokeOpacity: 0.55 }}
            content={<StChartTooltip formatValue={fmt} />}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={label}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gid})`}
            dot={false}
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: "#fff", fill: color }}
            isAnimationActive={!reduceMotion}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VendeurDashboard() {
  const { data: sessionData } = useSession();
  const vendorName = sessionData?.user?.name ?? "Créateur";
  const firstName = vendorName.split(" ")[0] || vendorName;

  // Plage de visualisation des graphes (7 j → 1 an).
  const [range, setRange] = useState("6m");
  // Portée boutique : "all" (cumulé) ou un id. Dans la clé → refetch auto au switch.
  const { scope, setScope, shops } = useActiveShop();
  const { data: response, isLoading } = useQuery<{ data: Dashboard | null }>({
    queryKey: ["vendeur-dashboard", range, scope],
    queryFn: () => fetch(`/api/formations/vendeur/dashboard?range=${range}&shopId=${encodeURIComponent(scope)}`).then((r) => r.json()),
    staleTime: 30_000,
  });

  // Vue globale : stats PAR boutique (grille « Mes boutiques »), seulement en
  // mode « Toutes » et s'il y a au moins deux boutiques.
  const showShopsGrid = scope === "all" && shops.length > 1;
  const { data: overviewResp } = useQuery<{ data: ShopOverview[] }>({
    queryKey: ["vendeur-shops-overview"],
    queryFn: () => fetch("/api/formations/vendeur/shops/overview").then((r) => r.json()),
    staleTime: 30_000,
    enabled: showShopsGrid,
  });
  const shopCards = overviewResp?.data ?? [];

  const { data: kycResp } = useQuery<{ data: { currentLevel: number; pending: { id: string } | null } }>({
    queryKey: ["kyc-status"],
    queryFn: () => fetch("/api/formations/kyc").then((r) => r.json()),
    staleTime: 60_000,
  });
  const kycLevel = kycResp?.data?.currentLevel ?? 0;
  const kycPending = !!kycResp?.data?.pending;
  // Ne JAMAIS afficher la bannière tant que la réponse KYC n'est pas arrivée :
  // sinon kycLevel vaut 0 pendant le chargement → flash « vérification requise »
  // d'une seconde chez les vendeurs déjà vérifiés, à chaque visite.
  const needsKyc = !!kycResp?.data && kycLevel < 2;

  const d = response?.data;
  const qc = useQueryClient();

  // Bannière conseil pub : masquable à volonté (mémorisé dans le navigateur).
  const [adBannerDismissed, setAdBannerDismissed] = useState(true);
  useEffect(() => {
    setAdBannerDismissed(localStorage.getItem("nk-vendor-ad-banner-dismissed") === "1");
  }, []);
  function dismissAdBanner() {
    setAdBannerDismissed(true);
    try { localStorage.setItem("nk-vendor-ad-banner-dismissed", "1"); } catch { /* ignore */ }
  }
  const monthly = d?.series ?? d?.monthlyChart ?? [];
  const hasNoProducts = !isLoading && (d?.topProducts ?? []).length === 0 && (d?.kpis.totalProducts ?? 0) === 0;

  // ── Sous-titre dynamique (maquette : "Belle journée — 3 ventes
  //    aujourd'hui, 45 000 FCFA encaissés.") ──────────────────────────
  const todayStr = new Date().toDateString();
  const salesTodayList = (d?.recentSales ?? []).filter(
    (s) => new Date(s.createdAt).toDateString() === todayStr,
  );
  const salesToday = salesTodayList.length;
  const revenueToday = salesTodayList.reduce((s, x) => s + x.amount, 0);
  const hasSales = (d?.current?.sales ?? 0) > 0 || (d?.recentSales ?? []).length > 0;

  // ── Objectif mensuel : fixé par le vendeur, sinon auto (max 50k / mois-1 ×1.2) ───
  const prevRevenue = d?.previous?.revenue ?? 0;
  const currentRevenue = d?.current?.revenue ?? 0;
  const savedGoal = (d as { monthlyGoal?: number | null } | undefined)?.monthlyGoal ?? null;
  const monthlyGoal = savedGoal && savedGoal > 0 ? savedGoal : Math.max(50_000, Math.round(prevRevenue * 1.2));
  const goalPct = monthlyGoal > 0 ? Math.min(100, (currentRevenue / monthlyGoal) * 100) : 0;

  async function editMonthlyGoal() {
    const v = await promptAction({
      title: "Votre objectif mensuel",
      message: "Montant à atteindre ce mois-ci (en FCFA). Laissez vide pour un objectif automatique.",
      placeholder: "Ex : 100000",
      confirmLabel: "Enregistrer",
      cancelLabel: "Annuler",
      icon: "flag",
      defaultValue: savedGoal ? String(savedGoal) : "",
      validate: (s) => (s.trim() !== "" && !/^\d+$/.test(s.trim()) ? "Entrez un nombre en FCFA." : null),
    });
    if (v === null) return;
    const goal = v.trim() === "" ? null : Number(v.trim());
    await fetch("/api/formations/vendeur/goal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyGoal: goal }),
    }).catch(() => null);
    qc.invalidateQueries({ queryKey: ["vendeur-dashboard"] });
  }

  // ── Suggestions "Que faire maintenant ?" selon l'état ──────────────
  const suggestions = hasNoProducts
    ? [
        { tone: "green" as const, icon: Plus, title: "Créer votre premier produit", subtitle: "Formation, ebook ou template — en 5 étapes guidées", href: "/vendeur/produits/creer" },
        { tone: "blue" as const, icon: Sparkles, title: "Explorer les boutiques qui marchent", subtitle: "Inspirez-vous des vendeurs qui réussissent", href: "/explorer" },
        { tone: "amber" as const, icon: ShieldCheck, title: "Vérifier votre identité", subtitle: "Indispensable pour retirer vos gains", href: "/kyc" },
      ]
    : !hasSales
      ? [
          { tone: "green" as const, icon: Megaphone, title: "Partager votre boutique sur WhatsApp", subtitle: "Vos premiers clients sont dans vos contacts", href: "/vendeur/boutiques" },
          { tone: "amber" as const, icon: Ticket, title: "Lancer votre première promo", subtitle: "Un code limité dans le temps attire les curieux", href: "/vendeur/marketing/codes-promo" },
          { tone: "blue" as const, icon: Sparkles, title: "Optimiser votre fiche avec l'IA", subtitle: "L'AI Studio réécrit votre description", href: "/vendeur/ai-studio" },
        ]
      : [
          { tone: "amber" as const, icon: ShoppingCart, title: "Relancer vos paniers abandonnés", subtitle: "De l'argent dort dans vos paniers non finalisés", href: "/vendeur/abandons" },
          { tone: "green" as const, icon: Ticket, title: "Lancer une promo week-end", subtitle: "Boostez vos ventes sur les jours creux", href: "/vendeur/marketing/codes-promo" },
          { tone: "blue" as const, icon: Sparkles, title: "Créer un nouveau produit", subtitle: "Les vendeurs à 3+ produits gagnent 2,4× plus", href: "/vendeur/produits/creer" },
        ];

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        {/* ── Header : "Bonjour {prénom}" + date + CTA (maquette) ── */}
        <StPageHeader
          title={`Bonjour ${firstName}`}
          subtitle={
            salesToday > 0 ? (
              <>
                Belle journée —{" "}
                <span className="font-extrabold" style={{ color: ST.green }}>
                  {salesToday} vente{salesToday > 1 ? "s" : ""} aujourd&apos;hui
                </span>
                , {formatFCFA(revenueToday)} FCFA encaissés.
              </>
            ) : hasNoProducts ? (
              "Créez votre premier produit en 5 minutes — c'est parti."
            ) : (
              "Prêt à vendre ? Votre boutique vous attend."
            )
          }
          actions={
            <>
              <span
                className="hidden md:inline-flex items-center gap-1.5 text-[12px] font-bold rounded-[10px] px-3 py-2 bg-white capitalize"
                style={{ color: ST.textSecondary, border: `1px solid ${ST.cardBorder}` }}
              >
                <CalendarDays size={14} />
                {todayLabel}
              </span>
              <StButton href="/vendeur/produits/creer" icon={Plus}>
                Créer un produit
              </StButton>
            </>
          }
        />

        <CommunityBanner tone="vendeur" />

        {/* ── Alerte ventes en chute (logique préservée) ── */}
        {(() => {
          const curRev = d?.current?.revenue;
          const prevRev = d?.previous?.revenue;
          if (curRev == null || prevRev == null || prevRev <= 0) return null;
          const drop = (curRev - prevRev) / prevRev;
          if (drop > -0.3) return null;
          const dropPct = Math.round(Math.abs(drop) * 100);
          return (
            <StCard className="mb-4 !p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: ST.roseSoft, color: ST.roseText }}>
                  <TrendingDown size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>
                    Vos ventes ont chuté de {dropPct} % vs la période précédente
                  </h3>
                  <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                    Revenu courant : <strong>{formatFCFA(curRev)} FCFA</strong> contre{" "}
                    <strong>{formatFCFA(prevRev)} FCFA</strong> avant. Relancez une campagne ou
                    récupérez vos paniers abandonnés.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <StButton size="sm" href="/vendeur/marketing" icon={Megaphone}>
                      Lancer une campagne
                    </StButton>
                    <StButton size="sm" variant="secondary" href="/vendeur/abandons" icon={RefreshCw}>
                      Paniers abandonnés
                    </StButton>
                  </div>
                </div>
              </div>
            </StCard>
          );
        })()}

        {/* ── KYC banner (logique préservée) ── */}
        {needsKyc && (
          <StCard className="mb-4 !p-5">
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={kycPending ? { background: ST.amberSoft, color: ST.amberText } : { background: ST.roseSoft, color: ST.roseText }}
              >
                {kycPending ? <Hourglass size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>
                  {kycPending ? "Vérification d'identité en cours" : "Vérification d'identité requise avant tout retrait"}
                </h3>
                <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                  {kycPending
                    ? "Votre demande est examinée (24-48 h ouvrées)."
                    : "Vos ventes s'accumulent, mais vous ne pourrez retirer vos gains qu'après validation."}
                </p>
                {!kycPending && (
                  <div className="mt-3">
                    <StButton size="sm" href="/kyc" icon={ShieldCheck}>
                      Soumettre ma pièce d&apos;identité
                    </StButton>
                  </div>
                )}
              </div>
            </div>
          </StCard>
        )}

        {/* ── Conseil pub : produits en ligne mais aucune vente encore ──
            On pousse le vendeur à lancer une publicité pour générer ses
            premières ventes (demande fondateur). Masqué dès qu'il y a du CA. */}
        {!hasNoProducts && (d?.current?.revenue ?? 0) === 0 && !adBannerDismissed && (
          <StCard className="mb-4 !p-5 relative">
            <button
              onClick={dismissAdBanner}
              aria-label="Masquer ce conseil"
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[#8aa092] hover:bg-gray-100 hover:text-[#13241b] transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-start gap-4 pr-6">
              <div
                className="w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={{ background: ST.greenSoft ?? "#e7f5ec", color: ST.green }}
              >
                <Megaphone size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>
                  Vos produits sont en ligne — faites-les connaître pour vendre 🚀
                </h3>
                <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                  Un bon produit ne suffit pas : pour générer vos premières ventes et
                  des revenus, commencez par <strong>lancer une publicité</strong>.
                  Diffusez une annonce sponsorisée, créez une promo ou partagez votre
                  lien sur vos réseaux. C&apos;est l&apos;étape qui transforme vos visiteurs en acheteurs.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <StButton size="sm" href="/vendeur/marketing" icon={Megaphone}>
                    Lancer une publicité
                  </StButton>
                  <StButton size="sm" variant="secondary" href="/vendeur/ai-coach" icon={Sparkles}>
                    Demander conseil à l&apos;IA
                  </StButton>
                </div>
              </div>
            </div>
          </StCard>
        )}

        {/* ── Empty state premier produit ── */}
        {hasNoProducts && (
          <div
            className="relative overflow-hidden rounded-[20px] p-7 md:p-8 mb-4 text-white"
            style={{ background: ST.gradient }}
          >
            <div aria-hidden className="absolute rounded-full" style={{ right: -50, top: -60, width: 210, height: 210, background: "rgba(255,255,255,.08)" }} />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex-1">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] opacity-85 mb-1.5">Bienvenue</div>
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tight mb-1.5">
                  Publiez votre premier produit
                </h3>
                <p className="text-[13px] font-semibold opacity-90 max-w-xl">
                  Formation vidéo, ebook, template ou coaching — vous commencez à vendre dès la
                  publication. 10 % de commission seulement.
                </p>
              </div>
              <StButton variant="white" size="lg" href="/vendeur/produits/creer" icon={Plus}>
                Créer mon premier produit
              </StButton>
            </div>
          </div>
        )}

        {/* ── 4 KPI (maquette : revenus / ventes / visiteurs / objectif) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
          {/* Total depuis la création de la boutique, plus le mois en cours.
              Un vendeur qui a peu vendu ce mois-ci voyait un chiffre décourageant
              en tête de son tableau de bord, alors que son cumul raconte
              l'inverse. Pas d'écart « vs mois préc. » ici : comparer un total
              cumulé au mois précédent n'a aucun sens — il ne peut que monter. */}
          <StKpi
            bezel
            label="Revenus"
            value={isLoading ? "…" : formatFCFA(d?.kpis.netRevenue ?? 0)}
            unit="FCFA"
            icon={Wallet}
          />
          <StKpi
            bezel
            label="Ventes"
            value={isLoading ? "…" : (d?.current?.sales ?? 0).toLocaleString("fr-FR")}
            icon={ShoppingBag}
            chip={<StDeltaChip pct={deltaPct(d?.current?.sales, d?.previous?.sales)} suffix="vs mois préc." />}
          />
          <StKpi
            bezel
            label="Apprenants actifs"
            value={isLoading ? "…" : (d?.kpis.totalStudents ?? 0).toLocaleString("fr-FR")}
            icon={Users}
            chip={<StDeltaChip pct={deltaPct(d?.current?.students, d?.previous?.students)} suffix="sur 30 j" />}
          />
          <StCard bezel className="!p-[16px_18px]">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold" style={{ color: ST.textSecondary }}>Objectif mensuel</span>
              <span className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.green }}>
                <StCountUp value={`${Math.round(goalPct)} %`} />
              </span>
            </div>
            <StProgressBar percent={goalPct} className="my-[14px]" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-bold tabular-nums" style={{ color: ST.textSecondary }}>
                {formatFCFA(currentRevenue)} / {formatFCFA(monthlyGoal)} FCFA
              </span>
              <button
                type="button"
                onClick={editMonthlyGoal}
                className="text-[11px] font-extrabold hover:underline flex-shrink-0 rounded outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006e2f]"
                style={{ color: ST.green }}
              >
                {savedGoal ? "Modifier" : "Définir"}
              </button>
            </div>
          </StCard>
        </div>

        {/* ── Vue globale : Mes boutiques (mode « Toutes ») ── */}
        {showShopsGrid && shopCards.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[15px] font-extrabold" style={{ color: ST.text }}>Mes boutiques</h2>
              <span className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>
                Sélectionnez une boutique pour l&apos;ouvrir
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {shopCards.map((s) => (
                <StCard key={s.id} className="!p-[16px_18px]">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                      style={{ background: s.themeColor || "linear-gradient(135deg, #006e2f, #22c55e)" }}
                    >
                      {s.name[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-extrabold truncate" style={{ color: ST.text }}>{s.name}</p>
                      <p className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>
                        {s.products} produit{s.products > 1 ? "s" : ""} · {s.clients} client{s.clients > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ST.textSecondary }}>Revenus</p>
                      <p className="text-[15px] font-extrabold" style={{ color: ST.green }}>{formatFCFA(s.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ST.textSecondary }}>Ventes</p>
                      <p className="text-[15px] font-extrabold" style={{ color: ST.text }}>{s.sales.toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                  {s.id !== "__none__" && (
                    <button
                      onClick={() => { void setScope(s.id); }}
                      className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-[12.5px] font-bold hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                    >
                      Entrer dans la boutique
                    </button>
                  )}
                </StCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Chart 6 mois + "Que faire maintenant ?" (grille 1.65fr/1fr) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-3.5 mb-4">
          <StCard className="!p-[18px_20px]">
            <div className="flex flex-col gap-2 mb-2 lg:flex-row lg:justify-between lg:items-center">
              <div className="flex items-baseline gap-2">
                <StSectionTitle className="!mb-0">Revenus</StSectionTitle>
                <span className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>FCFA, hors frais</span>
              </div>
              <RangePicker value={range} onChange={setRange} />
            </div>
            {isLoading ? (
              <StChartSkeleton height={218} />
            ) : monthly.every((m) => m.amount === 0) ? (
              <StChartEmpty
                height={218}
                icon={LineChart}
                title="Aucune vente sur la période"
                hint="Vos revenus apparaîtront dès la première transaction."
              />
            ) : (
              <TrendChart data={monthly} dataKey="amount" color={ST.chartRevenue} label="Revenus" isCurrency />
            )}
          </StCard>

          {/* Que faire maintenant ? */}
          <StCard className="!p-[18px_20px]">
            <StSectionTitle>Que faire maintenant ?</StSectionTitle>
            <div className="flex flex-col gap-[9px]">
              {suggestions.map((s) => (
                <StSuggestion key={s.title} tone={s.tone} icon={s.icon} title={s.title} subtitle={s.subtitle} href={s.href} />
              ))}
            </div>
          </StCard>
        </div>

        {/* ── 2 graphes de plus : Ventes + Nouveaux clients (6 mois, courbes lissées) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
          <StCard className="!p-[18px_20px]">
            <div className="flex justify-between items-center mb-2">
              <StSectionTitle className="!mb-0">Ventes</StSectionTitle>
              <span className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>nombre de commandes</span>
            </div>
            {isLoading ? (
              <StChartSkeleton height={200} />
            ) : monthly.every((m) => m.sales === 0) ? (
              <StChartEmpty
                height={200}
                icon={ShoppingBag}
                title="Aucune vente sur la période"
                hint="Changez de période ou lancez une promo pour relancer la courbe."
              />
            ) : (
              <TrendChart data={monthly} dataKey="sales" color={ST.chartSales} label="Ventes" height={200} />
            )}
          </StCard>

          <StCard className="!p-[18px_20px]">
            <div className="flex justify-between items-center mb-2">
              <StSectionTitle className="!mb-0">Nouveaux clients</StSectionTitle>
              <span className="text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>acheteurs uniques</span>
            </div>
            {isLoading ? (
              <StChartSkeleton height={200} />
            ) : monthly.every((m) => m.clients === 0) ? (
              <StChartEmpty
                height={200}
                icon={Users}
                title="Aucun client sur la période"
                hint="Chaque premier achat d'un acheteur apparaîtra ici."
              />
            ) : (
              <TrendChart data={monthly} dataKey="clients" color={ST.chartClients} label="Nouveaux clients" height={200} />
            )}
          </StCard>
        </div>

        {/* ── Ventes récentes + Top produits (grille 1.65fr/1fr) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-3.5 mb-4">
          {/* Ventes récentes */}
          <StCard className="!p-[18px_20px]">
            <div className="flex justify-between items-center mb-2.5">
              <StSectionTitle className="!mb-0">Ventes récentes</StSectionTitle>
              <Link href="/vendeur/transactions" className="text-[12px] font-extrabold hover:underline" style={{ color: ST.green }}>
                Tout voir
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: "#f3f6f4" }} />
                ))}
              </div>
            ) : (d?.recentSales ?? []).length === 0 ? (
              <div className="text-center py-8">
                <Receipt size={36} style={{ color: "#d6e0da" }} className="mx-auto" />
                <p className="text-[12px] font-bold mt-2" style={{ color: ST.textSecondary }}>Aucune vente pour le moment</p>
              </div>
            ) : (
              <div>
                {(d?.recentSales ?? []).slice(0, 5).map((sale, i) => (
                  <div
                    key={sale.id}
                    className="flex items-center gap-3 py-2.5"
                    style={i ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                  >
                    <StAvatar name={sale.buyerName} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-extrabold truncate" style={{ color: ST.text }}>{sale.buyerName}</div>
                      <div className="text-[11.5px] font-semibold truncate" style={{ color: "#7d9486" }}>{sale.productTitle}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[12.5px] font-extrabold tabular-nums" style={{ color: ST.green }}>
                        +{formatFCFA(sale.amount)} FCFA
                      </div>
                      <div className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>{timeAgo(sale.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StCard>

          {/* Top produits */}
          <StCard className="!p-[18px_20px]">
            <StSectionTitle>Top produits</StSectionTitle>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: "#f3f6f4" }} />)}
              </div>
            ) : (d?.topProducts ?? []).length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: "#fbfdfc", border: "2px dashed #bcd6c5" }}>
                <PackageOpen size={32} style={{ color: "#bcd6c5" }} className="mx-auto" />
                <p className="text-[12.5px] font-extrabold mt-2" style={{ color: ST.greenDark }}>Aucun produit publié</p>
                <div className="mt-3">
                  <StButton size="sm" href="/vendeur/produits/creer" icon={Plus}>
                    Créer un produit
                  </StButton>
                </div>
              </div>
            ) : (
              <div>
                {(d?.topProducts ?? []).slice(0, 4).map((p, i) => {
                  const max = Math.max(...(d?.topProducts ?? []).map((x) => x.revenue), 1);
                  return (
                    <div
                      key={p.id}
                      className="py-[9px]"
                      style={i ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                    >
                      <div className="flex justify-between text-[12.5px] font-extrabold" style={{ color: ST.text }}>
                        <span className="truncate max-w-[62%]">
                          <span style={{ color: ST.textFaint }} className="mr-1.5">{i + 1}</span>
                          {p.title}
                        </span>
                        <span className="tabular-nums">
                          {formatFCFA(p.revenue)} <span className="text-[10.5px]" style={{ color: ST.textFaint }}>FCFA</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: ST.divider }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(p.revenue / max) * 100}%`, background: ST.gradientH }}
                          />
                        </div>
                        <span className="text-[10.5px] font-bold w-[70px] text-right" style={{ color: "#7d9486" }}>
                          {p.sales} vente{p.sales > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </StCard>
        </div>

        {/* ── Top pays (si données géo) ── */}
        {(d?.topCountries ?? []).length > 0 && (
          <StCard className="!p-[18px_20px]">
            <StSectionTitle>Top pays</StSectionTitle>
            <div>
              {(d?.topCountries ?? []).map((tc, i) => {
                const max = Math.max(...(d?.topCountries ?? []).map((x) => x.revenue), 1);
                const pct = (tc.revenue / max) * 100;
                return (
                  <div
                    key={tc.country}
                    className="flex items-center gap-3 py-2"
                    style={i ? { borderTop: "1px solid #f3f6f4" } : undefined}
                  >
                    {tc.country === "??" ? (
                      <span className="text-[16px] leading-none">🌍</span>
                    ) : (
                      <Flag code={tc.country} size="md" title={countryName(tc.country)} />
                    )}
                    <span className="text-[12.5px] font-extrabold w-28 truncate" style={{ color: ST.text }}>
                      {tc.country === "??" ? "Autres" : countryName(tc.country)}
                    </span>
                    <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: ST.divider }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ST.gradientH }} />
                    </div>
                    <span className="text-[12px] font-extrabold tabular-nums w-24 text-right" style={{ color: ST.text }}>
                      {formatFCFA(tc.revenue)} <span className="text-[10px]" style={{ color: ST.textFaint }}>FCFA</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </StCard>
        )}

        {/* Note moyenne discrète en bas si présente */}
        {(d?.kpis.avgRating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mt-4 text-[12px] font-bold" style={{ color: ST.textSecondary }}>
            <Star size={14} className="text-amber-400 fill-amber-400" />
            Note moyenne {((d?.kpis.avgRating ?? 0)).toFixed(1)}/5 · {d?.kpis.totalReviews ?? 0} avis
            <StChip tone="green">{d?.kpis.totalProducts ?? 0} produit{(d?.kpis.totalProducts ?? 0) > 1 ? "s" : ""} actif{(d?.kpis.totalProducts ?? 0) > 1 ? "s" : ""}</StChip>
          </div>
        )}
      </main>
    </div>
  );
}
