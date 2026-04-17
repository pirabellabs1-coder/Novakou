"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from "recharts";
import { countryToFlag, countryName } from "@/lib/tracking/geo";

type Dashboard = {
  kpis: {
    totalRevenue: number;
    netRevenue: number;
    totalStudents: number;
    totalProducts: number;
    avgRating: number;
  };
  monthlyChart: { month: string; amount: number }[];
  recentSales: {
    id: string;
    buyerName: string;
    buyerEmail: string;
    productTitle: string;
    amount: number;
    createdAt: string;
  }[];
  topProducts: {
    id: string;
    kind: string;
    title: string;
    revenue: number;
    sales: number;
    completion: number;
    thumbnail: string | null;
  }[];
  sparkline7d?: { date: string; amount: number }[];
  topCountries?: { country: string; sales: number; revenue: number }[];
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

export default function VendeurDashboard() {
  const { data: response, isLoading } = useQuery<{ data: Dashboard | null }>({
    queryKey: ["vendeur-dashboard"],
    queryFn: () => fetch("/api/formations/vendeur/dashboard").then((r) => r.json()),
    staleTime: 30_000,
  });

  // KYC status for onboarding banner
  const { data: kycResp } = useQuery<{ data: { currentLevel: number; pending: { id: string } | null } }>({
    queryKey: ["kyc-status"],
    queryFn: () => fetch("/api/formations/kyc").then((r) => r.json()),
    staleTime: 60_000,
  });
  const kycLevel = kycResp?.data?.currentLevel ?? 0;
  const kycPending = !!kycResp?.data?.pending;
  const needsKyc = kycLevel < 2;

  const d = response?.data;
  const chart = d?.monthlyChart ?? [];
  const maxAmount = Math.max(...chart.map((m) => m.amount), 1);
  const hasNoProducts = !isLoading && (d?.topProducts ?? []).length === 0 && (d?.kpis.totalProducts ?? 0) === 0;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1400px] mx-auto">
        <header className="mb-10 md:mb-14">
          <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">
            Instructor Overview
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-zinc-900">
            Dashboard
          </h1>
        </header>

        {/* Onboarding KYC CTA — visible tant que non vérifié */}
        {needsKyc && (
          <div className={`mb-10 rounded-2xl p-5 flex items-start gap-4 border ${kycPending ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${kycPending ? "bg-amber-500" : "bg-red-500"}`}>
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                {kycPending ? "hourglass_top" : "warning"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#191c1e]">
                {kycPending ? "Vérification d'identité en cours" : "Vérification d'identité requise avant tout retrait"}
              </h3>
              <p className="text-sm text-[#5c647a] mt-1">
                {kycPending
                  ? "Votre demande est examinée par notre équipe (24-48h ouvrées). Vous serez notifié dès validation."
                  : "Vos ventes s'accumulent, mais vous ne pourrez retirer vos gains qu'après validation de votre identité."}
              </p>
              {!kycPending && (
                <Link
                  href="/formations/kyc"
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

        {/* Empty state — onboarding without demo seeding (real vendor flow) */}
        {hasNoProducts && (
          <div className="mb-10 bg-zinc-900 text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <span className="text-[#22c55e] font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">
                Bienvenue
              </span>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                Publiez votre premier produit
              </h3>
              <p className="text-sm text-zinc-400 max-w-xl">
                Créez une formation vidéo, un ebook, un template ou un pack digital en quelques minutes.
                Vous commencez à vendre dès la publication — aucun frais d&apos;abonnement, seulement 5 % de commission sur chaque vente.
              </p>
            </div>
            <div className="flex gap-0 flex-shrink-0">
              <Link
                href="/formations/vendeur/produits/creer"
                className="px-8 py-4 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors"
              >
                Créer mon premier produit
              </Link>
            </div>
          </div>
        )}

        {/* KPI Bento (flat zinc grid lines) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-zinc-100 mb-12 border border-zinc-100">
          {[
            {
              label: "Revenus nets",
              value: isLoading ? "…" : formatFCFA(d?.kpis.netRevenue ?? 0),
              unit: "FCFA",
              sub: `Brut : ${formatFCFA(d?.kpis.totalRevenue ?? 0)} FCFA`,
              accent: "text-[#006e2f]",
              dark: false,
            },
            {
              label: "Apprenants actifs",
              value: isLoading ? "…" : (d?.kpis.totalStudents ?? 0).toLocaleString("fr-FR"),
              unit: "",
              sub: "Tous produits confondus",
              accent: "text-zinc-900",
              dark: false,
            },
            {
              label: "Produits publiés",
              value: isLoading ? "…" : String(d?.kpis.totalProducts ?? 0).padStart(2, "0"),
              unit: "",
              sub: "Formations + digitaux",
              accent: "text-zinc-900",
              dark: false,
            },
            {
              label: "Note moyenne",
              value: isLoading ? "…" : (d?.kpis.avgRating ?? 0) > 0 ? (d?.kpis.avgRating ?? 0).toFixed(2) : "—",
              unit: (d?.kpis.avgRating ?? 0) > 0 ? "/5" : "",
              sub: "Sur tous les avis",
              accent: "text-[#004b1e]",
              dark: true,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={`p-8 flex flex-col justify-between hover:translate-x-1 transition-transform duration-200 ${
                kpi.dark ? "bg-[#22c55e]" : "bg-white"
              }`}
            >
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${kpi.dark ? "text-[#004b1e]/70" : "text-zinc-500"}`}>
                  {kpi.label}
                </p>
                <div className={`flex items-baseline gap-1 ${kpi.accent}`}>
                  <span className="text-3xl md:text-4xl font-extrabold tracking-tighter tabular-nums">{kpi.value}</span>
                  {kpi.unit && <span className="text-sm font-bold">{kpi.unit}</span>}
                </div>
              </div>
              <p className={`text-[10px] uppercase tracking-widest mt-6 ${kpi.dark ? "text-[#004b1e]/60 font-bold" : "text-zinc-400"}`}>
                {kpi.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white border border-zinc-100 p-8 md:p-10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-widest mb-1 block">Performance</span>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900">Revenus 6 derniers mois</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">6 mois</span>
            </div>

            {isLoading ? (
              <div className="h-[280px] bg-zinc-50 animate-pulse" />
            ) : chart.length === 0 || maxAmount === 1 ? (
              <div className="h-[280px] flex items-center justify-center text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Aucune vente</p>
                  <p className="text-sm text-zinc-500">Vos revenus apparaîtront ici dès la première transaction.</p>
                </div>
              </div>
            ) : (
              <div className="h-[280px] w-full flex items-end justify-between px-2 gap-3 md:gap-4 border-l border-b border-zinc-100">
                {chart.map((m, idx) => {
                  const isLast = idx === chart.length - 1;
                  const h = Math.max((m.amount / maxAmount) * 100, 2);
                  return (
                    <div key={idx} className="relative flex-1 flex flex-col justify-end gap-2 group">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 whitespace-nowrap z-10">
                        {formatFCFA(m.amount)}
                      </div>
                      <div
                        className={`w-full transition-colors ${isLast ? "bg-[#22c55e]" : "bg-zinc-100 group-hover:bg-[#22c55e]/40"}`}
                        style={{ height: `${h}%` }}
                      />
                      <span className={`text-[10px] font-bold text-center uppercase ${isLast ? "text-zinc-900" : "text-zinc-400"}`}>
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side */}
          <div className="space-y-8">
            {/* Quick actions */}
            <div className="bg-zinc-900 text-white p-8">
              <h3 className="text-xl font-bold tracking-tight mb-6">Actions rapides</h3>
              <div className="space-y-3">
                {[
                  { href: "/formations/vendeur/produits/creer", title: "Nouveau produit", desc: "Formation · E-book · Template", icon: "add_circle" },
                  { href: "/formations/vendeur/marketing", title: "Marketing", desc: "Codes promo · Campagnes", icon: "campaign" },
                  { href: "/formations/vendeur/statistiques", title: "Statistiques", desc: "Ventes · Revenus · Audience", icon: "bar_chart" },
                ].map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="w-full flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 transition-colors text-left group"
                  >
                    <div>
                      <div className="text-sm font-bold">{a.title}</div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">{a.desc}</div>
                    </div>
                    <span className="material-symbols-outlined text-[#22c55e] group-hover:translate-x-1 transition-transform">
                      {a.icon}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent sales */}
            <div className="bg-[#f3f3f4] p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Ventes récentes</h3>
                <Link
                  href="/formations/vendeur/transactions"
                  className="text-[10px] font-bold text-[#006e2f] uppercase tracking-widest hover:underline"
                >
                  Voir tout
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-200 animate-pulse" />
                        <div className="space-y-1">
                          <div className="h-3 w-24 bg-zinc-200 animate-pulse" />
                          <div className="h-2 w-16 bg-zinc-200 animate-pulse" />
                        </div>
                      </div>
                      <div className="h-3 w-16 bg-zinc-200 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (d?.recentSales ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500 italic">Aucune vente pour le moment.</p>
              ) : (
                <div className="space-y-5">
                  {(d?.recentSales ?? []).slice(0, 4).map((sale) => {
                    const initials = sale.buyerName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div key={sale.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-zinc-900 truncate">{sale.buyerName}</div>
                            <div className="text-[9px] text-zinc-400 uppercase tracking-widest">{timeAgo(sale.createdAt)}</div>
                          </div>
                        </div>
                        <div className="text-sm tabular-nums font-bold text-[#006e2f] whitespace-nowrap">
                          {formatFCFA(sale.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sparkline + Top countries */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-zinc-100 p-6 md:p-8">
            <div className="flex items-end justify-between mb-4">
              <div>
                <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-widest mb-1 block">
                  7 derniers jours
                </span>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900">Revenus quotidiens</h3>
              </div>
              <span className="text-sm tabular-nums font-bold text-[#006e2f]">
                {formatFCFA((d?.sparkline7d ?? []).reduce((s, x) => s + x.amount, 0))} FCFA
              </span>
            </div>
            {isLoading ? (
              <div className="h-[120px] bg-zinc-50 animate-pulse" />
            ) : (d?.sparkline7d ?? []).length === 0 || (d?.sparkline7d ?? []).every((x) => x.amount === 0) ? (
              <div className="h-[120px] flex items-center justify-center">
                <p className="text-xs text-zinc-400 uppercase tracking-widest">Aucune vente cette semaine</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={d?.sparkline7d ?? []}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }}
                    formatter={(v: number) => [`${formatFCFA(v)} FCFA`, "Revenus"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#006e2f" strokeWidth={2} fill="url(#sparkGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-[#f3f3f4] p-6 md:p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-5">Top pays</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-8 bg-zinc-200 animate-pulse" />
                ))}
              </div>
            ) : (d?.topCountries ?? []).length === 0 ? (
              <p className="text-xs text-zinc-500 italic">Pas encore de données par pays.</p>
            ) : (
              <div className="space-y-3">
                {(d?.topCountries ?? []).map((tc) => (
                  <div key={tc.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none">{countryToFlag(tc.country)}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate">{countryName(tc.country)}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{tc.sales} ventes</p>
                      </div>
                    </div>
                    <span className="text-xs tabular-nums font-bold text-[#006e2f] whitespace-nowrap">
                      {formatFCFA(tc.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Top products */}
        <section className="mt-16">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 mb-8 border-l-4 border-[#22c55e] pl-4">
            Produits les plus performants
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <div key={i} className="h-24 bg-[#f3f3f4] animate-pulse" />)}
            </div>
          ) : (d?.topProducts ?? []).length === 0 ? (
            <div className="bg-[#f3f3f4] p-10 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Aucun produit publié</p>
              <p className="text-sm text-zinc-500 mb-6">Créez votre premier produit pour voir vos performances ici.</p>
              <Link
                href="/formations/vendeur/produits/creer"
                className="inline-block px-8 py-3 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors"
              >
                Créer un produit
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(d?.topProducts ?? []).map((product, idx) => (
                <div key={product.id} className="bg-[#f3f3f4] p-6 flex items-center gap-5 hover:translate-x-1 transition-transform duration-200">
                  <span className="text-4xl font-extrabold tabular-nums text-zinc-300">{String(idx + 1).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{product.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{product.sales} ventes</span>
                    </div>
                    <div className="mt-3">
                      <div className="h-[2px] bg-zinc-200 w-full">
                        <div className="h-full bg-[#22c55e]" style={{ width: `${Math.min(100, product.completion)}%` }} />
                      </div>
                      <p className="text-[9px] tabular-nums text-zinc-400 uppercase mt-1">{product.completion}% complétion</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-extrabold tabular-nums text-zinc-900">{formatFCFA(product.revenue)}</p>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest">FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
