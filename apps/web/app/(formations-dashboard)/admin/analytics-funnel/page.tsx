// Admin Analytics Funnel — Sophie Tremblay (UX) + Fatou Diallo (Data)
// Bureau 2026-05-26 — visualisation du funnel acheteur Novakou
// (vues → CTA → panier → checkout → achat) à partir de TrackingEventLog.

"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, BarChart3 } from "lucide-react";

type Period = "7d" | "30d" | "90d";

type Step = {
  key: string;
  label: string;
  current: number;
  previous: number;
  conversionFromPrev: number | null;
  conversionFromTop: number | null;
  delta: number | null;
};

type FunnelResponse = {
  data: {
    period: Period;
    since: string;
    steps: Step[];
    devices: { device: string; count: number; share: number }[];
    topPaths: { path: string; count: number }[];
    topSearches: { query: string; count: number }[];
  };
};

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}
function fmtPct(n: number | null, digits = 1) {
  if (n == null || !isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)} %`;
}
function fmtDelta(d: number | null) {
  if (d == null || !isFinite(d)) return { text: "—", color: "text-zinc-400" };
  const sign = d >= 0 ? "↑" : "↓";
  const color = d >= 0 ? "text-emerald-600" : "text-rose-600";
  return { text: `${sign} ${(Math.abs(d) * 100).toFixed(1)} %`, color };
}

export default function AdminAnalyticsFunnelPage() {
  const [period, setPeriod] = useState<Period>("30d");

  const { data, isLoading, error } = useQuery<FunnelResponse>({
    queryKey: ["admin-analytics-funnel", period],
    queryFn: () =>
      fetch(`/api/formations/admin/analytics-funnel?period=${period}`).then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      }),
    staleTime: 60_000,
  });

  const steps = data?.data.steps ?? [];
  const topCount = steps[0]?.current ?? 0;
  const maxCount = Math.max(1, ...steps.map((s) => s.current));

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 mb-3"
            >
              <ArrowLeft size={14} />
              Retour au dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Funnel acheteur
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              De la visite à l&apos;achat — drop-off entre étapes, comparaison avec la période précédente.
            </p>
          </div>

          {/* Period picker */}
          <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  period === p.value
                    ? "bg-[#006e2f] text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <Loader2 size={30} className="text-slate-300 animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-2">Chargement du funnel…</p>
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-rose-700">Erreur de chargement.</p>
          </div>
        )}

        {/* Funnel steps */}
        {data && (
          <>
            <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-6">
              <h2 className="text-base font-bold text-slate-900 mb-1">Étapes du funnel</h2>
              <p className="text-xs text-slate-500 mb-5">
                Conversion vs étape précédente (et part du sommet du funnel).
              </p>

              {topCount === 0 ? (
                <div className="py-12 text-center">
                  <BarChart3 size={36} className="text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500 mt-2">
                    Aucun événement collecté sur cette période. Le tracking vient d&apos;être activé — les chiffres apparaîtront avec le trafic.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((s) => {
                    const width = Math.max(2, Math.round((s.current / maxCount) * 100));
                    const delta = fmtDelta(s.delta);
                    return (
                      <div key={s.key} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-bold text-slate-900">{s.label}</span>
                          <div className="flex items-baseline gap-3 text-xs">
                            <span className="text-slate-500">
                              {fmtPct(s.conversionFromPrev)} <span className="text-slate-300">vs étape -1</span>
                            </span>
                            <span className="text-slate-500">
                              {fmtPct(s.conversionFromTop)} <span className="text-slate-300">du top</span>
                            </span>
                            <span className={`font-semibold ${delta.color}`}>{delta.text}</span>
                            <span className="font-extrabold tabular-nums text-slate-900 min-w-[60px] text-right">
                              {fmt(s.current)}
                            </span>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${width}%`,
                              background: "linear-gradient(90deg, #006e2f, #22c55e)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Devices + Top paths + Searches */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Devices */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Devices (visites)</h3>
                {data.data.devices.length === 0 ? (
                  <p className="text-xs text-slate-400">Aucune donnée.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {data.data.devices.map((d) => (
                      <li key={d.device} className="space-y-1">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="capitalize text-slate-700 font-semibold">{d.device}</span>
                          <span className="tabular-nums text-slate-500">
                            {fmt(d.count)} <span className="text-slate-400">({fmtPct(d.share, 0)})</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#006e2f] rounded-full"
                            style={{ width: `${Math.round(d.share * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Top paths */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Top pages vues</h3>
                {data.data.topPaths.length === 0 ? (
                  <p className="text-xs text-slate-400">Aucune donnée.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {data.data.topPaths.map((p) => (
                      <li key={p.path} className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 font-mono truncate min-w-0" title={p.path}>{p.path}</span>
                        <span className="tabular-nums font-semibold text-slate-500 flex-shrink-0">{fmt(p.count)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Top searches */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Top recherches</h3>
                {data.data.topSearches.length === 0 ? (
                  <p className="text-xs text-slate-400">Aucune recherche enregistrée sur cette période.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {data.data.topSearches.map((s) => (
                      <li key={s.query} className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 truncate min-w-0" title={s.query}>«&nbsp;{s.query}&nbsp;»</span>
                        <span className="tabular-nums font-semibold text-slate-500 flex-shrink-0">{fmt(s.count)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer note */}
            <p className="text-[11px] text-slate-400 mt-6 text-center">
              Source : <code>TrackingEventLog</code> · bots exclus · depuis le {new Date(data.data.since).toLocaleDateString("fr-FR")}.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
