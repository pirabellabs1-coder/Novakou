// Refonte par Augustin Mékongo + Fatou Diallo — bureau 2026-05-26 (votes 7, 8, 13)
// Refonte hero/KPI style KAZA — Sophie Tremblay + Léa Moreau, 2026-06-07
// Refonte TOTALE design NOVA "joyeux" — bento grid, gradients vifs,
// compteurs animés, suggestions intelligentes — 2026-06-10.
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
import {
  Plus,
  BarChart3,
  Flame,
  Rocket,
  Sparkles,
  Trophy,
  Wallet,
  Eye,
  ShoppingBag,
  Share2,
  Zap,
  Megaphone,
  Users,
  Star,
  TrendingDown,
  Hourglass,
  AlertTriangle,
  ShieldCheck,
  LineChart,
  Globe2,
  Receipt,
  PackageOpen,
  Target,
  RefreshCw,
} from "lucide-react";
import { countryName } from "@/lib/tracking/geo";
import { Flag } from "@/components/ui/Flag";
import { CommunityBanner } from "@/components/formations/CommunityBanner";
import {
  NovaTile,
  NovaBigStat,
  NovaProgressRing,
  NovaActionCard,
  NovaButton,
  NovaBadge,
  NovaConfettiHeader,
  NOVA_PALETTES,
} from "@/components/nova";

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

/** Delta % entre current et previous — null si incalculable (évite Infinity). */
function deltaPct(current?: number, previous?: number): number | null {
  if (current === undefined || previous === undefined || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function deltaProps(current?: number, previous?: number) {
  const pct = deltaPct(current, previous);
  if (pct === null) return undefined;
  const trend: "up" | "down" | "flat" = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
  const formatted = Math.abs(pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return { value: `${pct >= 0 ? "+" : "−"}${formatted}%`, trend };
}

const PIE_COLORS = ["#7c3aed", "#10b981", "#f59e0b", "#0ea5e9"];

export default function VendeurDashboard() {
  const { data: sessionData } = useSession();
  const vendorName = sessionData?.user?.name ?? "Créateur";
  const firstName = vendorName.split(" ")[0] || vendorName;

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

  // ── Tagline dynamique selon l'état du vendeur ──────────────────────
  const todayStr = new Date().toDateString();
  const salesToday = (d?.recentSales ?? []).filter(
    (s) => new Date(s.createdAt).toDateString() === todayStr,
  ).length;
  const hasSales = (d?.current?.sales ?? 0) > 0 || (d?.recentSales ?? []).length > 0;

  let tagline = "Crée ton premier produit en 5 minutes, c'est parti.";
  let TaglineIcon = Sparkles;
  if (!hasNoProducts && salesToday > 0) {
    tagline = `${salesToday} vente${salesToday > 1 ? "s" : ""} aujourd'hui — continue comme ça !`;
    TaglineIcon = Flame;
  } else if (!hasNoProducts && hasSales) {
    tagline = "Ta boutique tourne. Et si on visait plus haut ce mois-ci ?";
    TaglineIcon = Rocket;
  } else if (!hasNoProducts) {
    tagline = "Prêt à vendre ? Ta boutique t'attend.";
    TaglineIcon = Rocket;
  }

  // ── Objectif du mois : max(50 000, revenus mois précédent × 1.2) ───
  const prevRevenue = d?.previous?.revenue ?? 0;
  const currentRevenue = d?.current?.revenue ?? 0;
  const monthlyGoal = Math.max(50_000, Math.round(prevRevenue * 1.2));
  const goalPct = monthlyGoal > 0 ? Math.min(100, (currentRevenue / monthlyGoal) * 100) : 0;

  // ── Suggestions "Que faire maintenant ?" selon l'état ──────────────
  const suggestions = hasNoProducts
    ? [
        {
          icon: Plus,
          title: "Crée ton premier produit",
          description: "Formation, ebook ou template — publie en 5 étapes guidées.",
          flavor: "violet" as const,
          href: "/vendeur/produits/creer",
          badge: "Commencer",
        },
        {
          icon: Eye,
          title: "Explore les boutiques qui marchent",
          description: "Inspire-toi des vendeurs qui cartonnent sur Novakou.",
          flavor: "ciel" as const,
          href: "/explorer",
        },
        {
          icon: ShieldCheck,
          title: "Vérifie ton identité",
          description: "Indispensable pour retirer tes gains dès la première vente.",
          flavor: "menthe" as const,
          href: "/kyc",
        },
      ]
    : !hasSales
      ? [
          {
            icon: Share2,
            title: "Partage ta boutique sur WhatsApp",
            description: "Tes premiers clients sont déjà dans tes contacts.",
            flavor: "menthe" as const,
            href: "/vendeur/boutiques",
            badge: "Conseillé",
          },
          {
            icon: Megaphone,
            title: "Lance ta première campagne",
            description: "Emails, codes promo, retargeting — tout est prêt.",
            flavor: "corail" as const,
            href: "/vendeur/marketing",
          },
          {
            icon: Sparkles,
            title: "Optimise ta fiche produit avec l'IA",
            description: "L'AI Studio réécrit ta description pour mieux convertir.",
            flavor: "violet" as const,
            href: "/vendeur/ai-studio",
            badge: "IA",
          },
        ]
      : [
          {
            icon: Zap,
            title: "Lance une promo flash",
            description: "Un code promo limité dans le temps booste les ventes de 30%.",
            flavor: "mangue" as const,
            href: "/vendeur/marketing/codes-promo",
            badge: "Boost",
          },
          {
            icon: RefreshCw,
            title: "Relance tes paniers abandonnés",
            description: "De l'argent dort dans tes paniers non finalisés.",
            flavor: "corail" as const,
            href: "/vendeur/abandons",
          },
          {
            icon: Plus,
            title: "Ajoute un nouveau produit",
            description: "Les vendeurs à 3+ produits gagnent 2,4× plus.",
            flavor: "violet" as const,
            href: "/vendeur/produits/creer",
          },
        ];

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto space-y-6">
        {/* ── Header NOVA : salutation gradient + tagline dynamique ── */}
        <NovaConfettiHeader
          name={firstName}
          tagline={tagline}
          actions={
            <>
              <NovaButton flavor="violet" href="/vendeur/produits/creer" icon={Plus}>
                Nouveau produit
              </NovaButton>
              <NovaButton flavor="ciel" variant="soft" href="/vendeur/statistiques" icon={BarChart3}>
                Analytics
              </NovaButton>
            </>
          }
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <TaglineIcon size={16} className="text-orange-500" />
            <span>
              {(d?.kpis?.totalProducts ?? 0)} produit{(d?.kpis?.totalProducts ?? 0) > 1 ? "s" : ""} actif{(d?.kpis?.totalProducts ?? 0) > 1 ? "s" : ""}
            </span>
            {(d?.kpis?.avgRating ?? 0) > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span>{(d?.kpis.avgRating ?? 0).toFixed(1)}/5 ({d?.kpis.totalReviews ?? 0} avis)</span>
              </>
            )}
          </div>
        </NovaConfettiHeader>

        <CommunityBanner tone="vendeur" />

        {/* ── Alerte ventes en chute (logique préservée, re-skin NOVA) ── */}
        {(() => {
          const curRev = d?.current?.revenue;
          const prevRev = d?.previous?.revenue;
          if (curRev == null || prevRev == null || prevRev <= 0) return null;
          const drop = (curRev - prevRev) / prevRev;
          if (drop > -0.3) return null;
          const dropPct = Math.round(Math.abs(drop) * 100);
          return (
            <NovaTile flavor="corail" style="soft" className="!p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white" style={{ background: NOVA_PALETTES.corail.bg }}>
                  <TrendingDown size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-slate-900">
                    Tes ventes ont chuté de {dropPct} % vs la période précédente
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Revenu courant : <strong>{formatFCFA(curRev)} FCFA</strong> contre <strong>{formatFCFA(prevRev)} FCFA</strong> avant.
                    Relance une campagne ou récupère tes paniers abandonnés.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <NovaButton flavor="corail" size="sm" href="/vendeur/marketing" icon={Megaphone}>
                      Lancer une campagne
                    </NovaButton>
                    <NovaButton flavor="corail" variant="outline" size="sm" href="/vendeur/abandons" icon={RefreshCw}>
                      Paniers abandonnés
                    </NovaButton>
                  </div>
                </div>
              </div>
            </NovaTile>
          );
        })()}

        {/* ── KYC banner (logique préservée, re-skin NOVA) ── */}
        {needsKyc && (
          <NovaTile flavor={kycPending ? "mangue" : "corail"} style="soft" className="!p-5">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: kycPending ? NOVA_PALETTES.mangue.bg : NOVA_PALETTES.corail.bg }}
              >
                {kycPending ? <Hourglass size={22} /> : <AlertTriangle size={22} />}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-slate-900">
                  {kycPending ? "Vérification d'identité en cours" : "Vérification d'identité requise avant tout retrait"}
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {kycPending
                    ? "Ta demande est examinée (24-48h ouvrées)."
                    : "Tes ventes s'accumulent, mais tu ne pourras retirer tes gains qu'après validation."}
                </p>
                {!kycPending && (
                  <div className="mt-3">
                    <NovaButton flavor="menthe" size="sm" href="/kyc" icon={ShieldCheck}>
                      Soumettre ma pièce d&apos;identité
                    </NovaButton>
                  </div>
                )}
              </div>
            </div>
          </NovaTile>
        )}

        {/* ── Empty state premier produit (re-skin NOVA vivid) ── */}
        {hasNoProducts && (
          <NovaTile flavor="violet" style="vivid" className="!p-8 md:!p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <NovaBadge flavor="mangue" vivid>Bienvenue</NovaBadge>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight mt-3 mb-2">
                  Publie ton premier produit
                </h3>
                <p className="text-sm text-white/80 max-w-xl font-medium">
                  Formation vidéo, ebook, template ou pack — tu commences à vendre dès la
                  publication. 10 % de commission seulement.
                </p>
              </div>
              <Link
                href="/vendeur/produits/creer"
                className="px-7 py-4 rounded-2xl bg-white text-violet-700 text-sm font-black hover:scale-105 active:scale-100 transition-transform shadow-xl flex-shrink-0 inline-flex items-center gap-2"
              >
                <Rocket size={18} />
                Créer mon premier produit
              </Link>
            </div>
          </NovaTile>
        )}

        {/* ── Bento stats : revenus (star, vivid) + ventes + apprenants + objectif ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <NovaBigStat
              label="Revenus nets (30 derniers jours)"
              value={isLoading ? 0 : Math.round(d?.kpis.netRevenue ?? 0)}
              format={(n) => `${formatFCFA(n)} FCFA`}
              delta={deltaProps(d?.current?.revenue, d?.previous?.revenue)}
              icon={Wallet}
              flavor="violet"
              vivid
              href="/wallet"
            />
          </div>
          <NovaBigStat
            label="Ventes (30j)"
            value={isLoading ? 0 : (d?.current?.sales ?? d?.recentSales?.length ?? 0)}
            delta={deltaProps(d?.current?.sales, d?.previous?.sales)}
            icon={ShoppingBag}
            flavor="menthe"
            href="/vendeur/transactions"
          />
          <NovaBigStat
            label="Apprenants actifs"
            value={isLoading ? 0 : (d?.kpis.totalStudents ?? 0)}
            delta={deltaProps(d?.current?.students, d?.previous?.students)}
            icon={Users}
            flavor="ciel"
          />
        </div>

        {/* ── Chart revenus + Objectif du mois ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart principal (Recharts préservé, wrap NovaTile) */}
          <NovaTile style="white" className="lg:col-span-2 !p-6 md:!p-7">
            <div className="flex items-end justify-between mb-6">
              <div>
                <NovaBadge flavor="violet">Performance</NovaBadge>
                <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mt-2">
                  Revenus & ventes — 6 derniers mois
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#7c3aed" }} /> Revenus
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Ventes
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="h-[300px] bg-slate-50 animate-pulse rounded-2xl" />
            ) : monthly.every((m) => m.amount === 0) ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <LineChart size={48} className="text-slate-200" />
                <p className="text-sm font-bold text-slate-500 mt-3">Aucune vente sur la période</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Tes revenus apparaîtront dès la première transaction.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                  <Tooltip
                    cursor={{ fill: "rgba(124,58,237,0.05)" }}
                    contentStyle={{
                      borderRadius: 16,
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
                  <Bar dataKey="amount" name="Revenus" fill="url(#barGrad)" radius={[10, 10, 0, 0]} />
                  <Line type="monotone" dataKey="sales" name="Ventes" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 4, fill: "#0f172a" }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </NovaTile>

          {/* Objectif du mois — NovaProgressRing */}
          <NovaTile flavor="mangue" style="soft" className="!p-6 md:!p-7 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} className="text-amber-600" />
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-700">Objectif du mois</span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-slate-900 mb-4">
              Cap sur {formatFCFA(monthlyGoal)} FCFA
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <NovaProgressRing percent={goalPct} size={140} strokeWidth={14} flavor="mangue">
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900 tabular-nums">{Math.round(goalPct)}%</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">atteint</div>
                </div>
              </NovaProgressRing>
              <p className="text-xs text-center text-slate-600 font-semibold">
                {goalPct >= 100 ? (
                  <span className="inline-flex items-center gap-1">
                    <Trophy size={14} className="text-amber-500" />
                    Objectif atteint — bravo !
                  </span>
                ) : (
                  <>
                    {formatFCFA(currentRevenue)} / {formatFCFA(monthlyGoal)} FCFA
                    <br />
                    <span className="text-slate-400 font-medium">
                      Encore {formatFCFA(Math.max(0, monthlyGoal - currentRevenue))} FCFA
                    </span>
                  </>
                )}
              </p>
            </div>
          </NovaTile>
        </div>

        {/* ── Que faire maintenant ? — 3 suggestions intelligentes ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-violet-500" />
            <h2 className="text-xl font-black tracking-tight text-slate-900">Que faire maintenant ?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestions.map((s) => (
              <NovaActionCard
                key={s.title}
                icon={s.icon}
                title={s.title}
                description={s.description}
                flavor={s.flavor}
                href={s.href}
                badge={s.badge}
              />
            ))}
          </div>
        </section>

        {/* ── 7 jours + Top pays ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <NovaTile style="white" className="lg:col-span-2 !p-6 md:!p-7">
            <div className="flex items-end justify-between mb-4">
              <div>
                <NovaBadge flavor="menthe">7 derniers jours</NovaBadge>
                <h3 className="text-lg font-black tracking-tight text-slate-900 mt-2">Revenus quotidiens</h3>
              </div>
              <span className="text-base tabular-nums font-black text-emerald-600">
                {formatFCFA((d?.sparkline7d ?? []).reduce((s, x) => s + x.amount, 0))} FCFA
              </span>
            </div>
            {isLoading ? (
              <div className="h-[140px] bg-slate-50 animate-pulse rounded-2xl" />
            ) : (d?.sparkline7d ?? []).every((x) => x.amount === 0) ? (
              <div className="h-[140px] flex items-center justify-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Aucune vente cette semaine</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={d?.sparkline7d ?? []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
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
                    contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number) => [`${formatFCFA(v)} FCFA`, "Revenus"]}
                    labelFormatter={(l) => new Date(l).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#sparkGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </NovaTile>

          {/* Top pays */}
          <NovaTile style="white" className="!p-6 md:!p-7">
            <NovaBadge flavor="ciel">Audience</NovaBadge>
            <h3 className="text-lg font-black tracking-tight text-slate-900 mt-2 mb-4">Top pays</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-9 bg-slate-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (d?.topCountries ?? []).length === 0 ? (
              <div className="text-center py-8">
                <Globe2 size={40} className="text-slate-200 mx-auto" />
                <p className="text-xs text-slate-500 mt-2 font-semibold">Pas encore de données géo</p>
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
                          <span className="text-xs font-black text-slate-900 truncate">{countryName(tc.country)}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{tc.sales}</span>
                        </div>
                        <span className="text-xs tabular-nums font-black text-violet-600">
                          {formatFCFA(tc.revenue)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
          </NovaTile>
        </div>

        {/* ── Ventes récentes + Produits performants + Mix ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ventes récentes */}
          <NovaTile style="white" className="!p-6 md:!p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <NovaBadge flavor="menthe">Activité</NovaBadge>
                <h3 className="text-lg font-black tracking-tight text-slate-900 mt-2">Ventes récentes</h3>
              </div>
              <Link
                href="/vendeur/transactions"
                className="text-[11px] font-black text-violet-600 uppercase tracking-wider hover:underline"
              >
                Voir tout →
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 bg-slate-100 animate-pulse rounded" />
                      <div className="h-2 w-16 bg-slate-100 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (d?.recentSales ?? []).length === 0 ? (
              <div className="text-center py-8">
                <Receipt size={40} className="text-slate-200 mx-auto" />
                <p className="text-xs text-slate-500 mt-2 font-semibold">Aucune vente pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(d?.recentSales ?? []).slice(0, 5).map((sale, i) => {
                  const initials = sale.buyerName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  const flavors = ["violet", "menthe", "ciel", "corail", "mangue"] as const;
                  const palette = NOVA_PALETTES[flavors[i % flavors.length]];
                  return (
                    <div key={sale.id} className="flex items-center gap-3 group">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3"
                        style={{ background: palette.bg }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{sale.buyerName}</p>
                        <p className="text-[10px] text-slate-500 truncate font-medium">{sale.productTitle}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-black text-emerald-600 tabular-nums">+{formatFCFA(sale.amount)}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{timeAgo(sale.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </NovaTile>

          {/* Produits performants — ranking blobs */}
          <NovaTile style="white" className="lg:col-span-2 !p-6 md:!p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <NovaBadge flavor="violet">Catalogue</NovaBadge>
                <h3 className="text-lg font-black tracking-tight text-slate-900 mt-2">Produits performants</h3>
              </div>
              <Link
                href="/vendeur/produits"
                className="text-[11px] font-black text-violet-600 uppercase tracking-wider hover:underline"
              >
                Tous mes produits →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-2xl" />)}
              </div>
            ) : (d?.topProducts ?? []).length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center">
                <PackageOpen size={40} className="text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700 mt-2">Aucun produit publié</p>
                <p className="text-xs text-slate-500 mt-1 mb-4 font-medium">Crée ton premier produit pour voir tes performances ici.</p>
                <NovaButton flavor="violet" size="sm" href="/vendeur/produits/creer" icon={Plus}>
                  Créer un produit
                </NovaButton>
              </div>
            ) : (
              <div className="space-y-3">
                {(d?.topProducts ?? []).slice(0, 5).map((p, i) => {
                  const rankFlavors = ["mangue", "ciel", "violet", "menthe", "corail"] as const;
                  const palette = NOVA_PALETTES[rankFlavors[i % rankFlavors.length]];
                  return (
                    <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-transform group-hover:scale-110 ${
                          i === 0 ? "text-white shadow-md" : ""
                        }`}
                        style={i === 0 ? { background: palette.bg } : { background: palette.soft, color: palette.text }}
                      >
                        {i === 0 ? <Trophy size={18} /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{p.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-semibold">
                          <span className="inline-flex items-center gap-0.5">
                            <ShoppingBag size={11} />
                            {p.sales} ventes
                          </span>
                          {p.rating > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <Star size={11} className="text-amber-400 fill-amber-400" />
                              {p.rating.toFixed(1)} ({p.reviewsCount})
                            </span>
                          )}
                          {p.engagement > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              {p.engagement}% complétion
                            </span>
                          )}
                        </div>
                        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[280px]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(p.revenue / Math.max(...(d?.topProducts ?? []).map((x) => x.revenue), 1)) * 100}%`,
                              background: palette.bg,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-black text-slate-900 tabular-nums">{formatFCFA(p.revenue)}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">FCFA</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </NovaTile>
        </div>

        {/* ── Mix produits (donut conservé, re-skin) ── */}
        {splitTotal > 0 && (
          <NovaTile style="white" className="!p-6 md:!p-7">
            <NovaBadge flavor="corail">Mix produits</NovaBadge>
            <h3 className="text-lg font-black tracking-tight text-slate-900 mt-2 mb-4">
              Revenus par type — 90 jours
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={split}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {split.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number) => [`${formatFCFA(v)} FCFA`, ""]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {split.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm font-bold text-slate-700">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 tabular-nums">{formatFCFA(s.value)} FCFA</span>
                      <span className="text-xs text-slate-400 font-bold ml-2">
                        {Math.round((s.value / splitTotal) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </NovaTile>
        )}
      </main>
    </div>
  );
}
