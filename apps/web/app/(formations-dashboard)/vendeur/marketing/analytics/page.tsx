"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ST,
  StPageHeader,
  StCard,
  StKpi,
  StDeltaChip,
  StSectionTitle,
  StProgressBar,
  StTabs,
} from "@/components/stitch";
import {
  Banknote,
  ShoppingCart,
  Percent,
  Receipt,
  ArrowLeft,
  Globe,
  Megaphone,
  FileText,
} from "lucide-react";

// ── Types (miroir de /api/marketing/analytics) ──────────────────────────────
interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueChange: number;
    totalSales: number;
    salesChange: number;
    conversionRate: number;
    conversionChange: number;
    averageOrderValue: number;
    avgOrderChange: number;
  };
  revenueByMonth: { month: string; formations: number; products: number }[];
  salesByProduct: { name: string; type: "formation" | "product"; sales: number; revenue: number }[];
  trafficSources: { source: string; visits: number; conversions: number; revenue: number }[];
  conversionFunnel: { pageViews: number; addToCart: number; checkout: number; purchased: number };
  topPages: { path: string; views: number; conversions: number }[];
  geographicData: { country: string; revenue: number; sales: number }[];
}

const PERIODS = [
  { key: "7d", label: "7 j" },
  { key: "30d", label: "30 j" },
  { key: "3m", label: "3 mois" },
  { key: "6m", label: "6 mois" },
  { key: "1y", label: "1 an" },
];

function fcfa(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n || 0))} FCFA`;
}

function monthLabel(ym: string): string {
  // "2026-06" → "juin 26"
  const [y, m] = ym.split("-");
  const names = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  return `${names[idx]} ${y?.slice(2) ?? ""}`;
}

export default function MarketingAnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data: resp, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["marketing-analytics", period],
    queryFn: () => fetch(`/api/marketing/analytics?period=${period}`).then((r) => r.json()),
  });

  const d = resp;
  const ov = d?.overview;
  const maxMonth = Math.max(1, ...(d?.revenueByMonth ?? []).map((m) => m.formations + m.products));
  const funnel = d?.conversionFunnel;
  const funnelMax = Math.max(1, funnel?.pageViews ?? 1);
  const maxTraffic = Math.max(1, ...(d?.trafficSources ?? []).map((t) => t.visits));
  const maxGeo = Math.max(1, ...(d?.geographicData ?? []).map((g) => g.revenue));

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <Link
          href="/vendeur/marketing"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold mb-3 hover:underline"
          style={{ color: ST.green }}
        >
          <ArrowLeft size={15} /> Marketing
        </Link>

        <StPageHeader
          title="Analytics marketing"
          subtitle="Revenus, conversions, canaux d'acquisition et géographie de vos ventes"
          actions={<StTabs tabs={PERIODS} active={period} onChange={setPeriod} />}
        />

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <StKpi
            label="Revenu total"
            value={isLoading ? "…" : fcfa(ov?.totalRevenue ?? 0)}
            icon={Banknote}
            chip={<StDeltaChip pct={ov?.revenueChange ?? null} />}
          />
          <StKpi
            label="Ventes"
            value={isLoading ? "…" : (ov?.totalSales ?? 0).toLocaleString("fr-FR")}
            icon={ShoppingCart}
            chip={<StDeltaChip pct={ov?.salesChange ?? null} />}
          />
          <StKpi
            label="Taux de conversion"
            value={isLoading ? "…" : `${ov?.conversionRate ?? 0}`}
            unit="%"
            icon={Percent}
            chip={<StDeltaChip pct={ov?.conversionChange ?? null} />}
          />
          <StKpi
            label="Panier moyen"
            value={isLoading ? "…" : fcfa(ov?.averageOrderValue ?? 0)}
            icon={Receipt}
            chip={<StDeltaChip pct={ov?.avgOrderChange ?? null} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* ── Revenus par mois ── */}
          <StCard>
            <StSectionTitle>Revenus par mois</StSectionTitle>
            {(d?.revenueByMonth ?? []).length === 0 ? (
              <p className="text-[13px]" style={{ color: ST.textMuted }}>Aucune vente sur la période.</p>
            ) : (
              <div className="flex items-end gap-2 h-[180px] mt-2">
                {(d?.revenueByMonth ?? []).map((m) => {
                  const total = m.formations + m.products;
                  const h = Math.round((total / maxMonth) * 150);
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full rounded-t-lg flex flex-col justify-end" style={{ height: 150 }}>
                        <div
                          className="w-full rounded-t-lg"
                          style={{ height: `${h}px`, background: ST.gradient, minHeight: total > 0 ? 4 : 0 }}
                          title={fcfa(total)}
                        />
                      </div>
                      <span className="text-[10.5px] font-bold" style={{ color: ST.textMuted }}>{monthLabel(m.month)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </StCard>

          {/* ── Tunnel de conversion ── */}
          <StCard>
            <StSectionTitle>Tunnel de conversion</StSectionTitle>
            {[
              { label: "Vues des tunnels", val: funnel?.pageViews ?? 0 },
              { label: "Clics (CTA)", val: funnel?.addToCart ?? 0 },
              { label: "Ventes finalisées", val: funnel?.purchased ?? 0 },
            ].map((row) => (
              <div key={row.label} className="mb-3 last:mb-0">
                <div className="flex justify-between text-[12.5px] font-bold mb-1" style={{ color: ST.textSecondary }}>
                  <span>{row.label}</span>
                  <span style={{ color: ST.text }}>{row.val.toLocaleString("fr-FR")}</span>
                </div>
                <StProgressBar percent={(row.val / funnelMax) * 100} />
              </div>
            ))}
          </StCard>

          {/* ── Sources de trafic ── */}
          <StCard>
            <StSectionTitle>
              <span className="inline-flex items-center gap-1.5"><Megaphone size={15} style={{ color: ST.green }} /> Sources de trafic (campagnes)</span>
            </StSectionTitle>
            {(d?.trafficSources ?? []).length === 0 ? (
              <p className="text-[13px]" style={{ color: ST.textMuted }}>Aucune campagne trackée. Créez un lien dans « Campagnes ».</p>
            ) : (
              <div className="space-y-2.5">
                {(d?.trafficSources ?? []).map((t) => (
                  <div key={t.source}>
                    <div className="flex justify-between text-[12.5px] font-bold mb-1">
                      <span className="capitalize" style={{ color: ST.text }}>{t.source}</span>
                      <span style={{ color: ST.textSecondary }}>{t.visits.toLocaleString("fr-FR")} clics · {t.conversions} ventes · {fcfa(t.revenue)}</span>
                    </div>
                    <StProgressBar percent={(t.visits / maxTraffic) * 100} />
                  </div>
                ))}
              </div>
            )}
          </StCard>

          {/* ── Répartition géographique ── */}
          <StCard>
            <StSectionTitle>
              <span className="inline-flex items-center gap-1.5"><Globe size={15} style={{ color: ST.green }} /> Pays des acheteurs</span>
            </StSectionTitle>
            {(d?.geographicData ?? []).length === 0 ? (
              <p className="text-[13px]" style={{ color: ST.textMuted }}>Aucune donnée sur la période.</p>
            ) : (
              <div className="space-y-2.5">
                {(d?.geographicData ?? []).slice(0, 8).map((g) => (
                  <div key={g.country}>
                    <div className="flex justify-between text-[12.5px] font-bold mb-1">
                      <span style={{ color: ST.text }}>{g.country}</span>
                      <span style={{ color: ST.textSecondary }}>{fcfa(g.revenue)} · {g.sales} vente{g.sales > 1 ? "s" : ""}</span>
                    </div>
                    <StProgressBar percent={(g.revenue / maxGeo) * 100} />
                  </div>
                ))}
              </div>
            )}
          </StCard>

          {/* ── Ventes par produit ── */}
          <StCard>
            <StSectionTitle>Ventes par produit</StSectionTitle>
            {(d?.salesByProduct ?? []).length === 0 ? (
              <p className="text-[13px]" style={{ color: ST.textMuted }}>Aucune vente sur la période.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: ST.divider }}>
                {(d?.salesByProduct ?? []).slice(0, 8).map((p) => (
                  <div key={p.name} className="flex justify-between items-center py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold truncate" style={{ color: ST.text }}>{p.name}</p>
                      <p className="text-[11px]" style={{ color: ST.textMuted }}>{p.type === "formation" ? "Formation" : "Produit"} · {p.sales} vente{p.sales > 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-[13px] font-extrabold flex-shrink-0 ml-3" style={{ color: ST.green }}>{fcfa(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </StCard>

          {/* ── Top tunnels ── */}
          <StCard>
            <StSectionTitle>
              <span className="inline-flex items-center gap-1.5"><FileText size={15} style={{ color: ST.green }} /> Top tunnels</span>
            </StSectionTitle>
            {(d?.topPages ?? []).length === 0 ? (
              <p className="text-[13px]" style={{ color: ST.textMuted }}>Aucun tunnel publié pour l'instant.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: ST.divider }}>
                {(d?.topPages ?? []).map((p) => (
                  <div key={p.path} className="flex justify-between items-center py-2.5">
                    <span className="text-[12.5px] font-bold truncate" style={{ color: ST.text }}>{p.path}</span>
                    <span className="text-[11.5px] font-bold flex-shrink-0 ml-3" style={{ color: ST.textSecondary }}>
                      {p.views.toLocaleString("fr-FR")} vues · {p.conversions} conv.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </StCard>
        </div>
      </main>
    </div>
  );
}
