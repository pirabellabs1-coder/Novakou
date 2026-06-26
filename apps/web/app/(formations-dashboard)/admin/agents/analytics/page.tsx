"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ST, StPageHeader, StCard, StTabs } from "@/components/stitch";
import { ArrowLeft } from "lucide-react";

interface Analytics {
  days: number;
  totals: { runs: number; tasks: number; actions: number; tokens: number; approvalRate: number | null; autoRate: number; errors: number };
  series: { date: string; runs: number; tasks: number; actions: number; tokens: number }[];
  perAgent: { key: string; name: string; emoji: string; runs: number; tasks: number; actions: number; errors: number }[];
  statusCounts: Record<string, number>;
}

const STATUS_LABEL: Record<string, string> = {
  proposed: "À valider", approved: "Validées", rejected: "Rejetées", auto_executed: "Auto", executed: "Exécutées", failed: "Échecs",
};
const STATUS_COLOR: Record<string, string> = {
  proposed: "#f59e0b", approved: "#006e2f", rejected: "#dc2626", auto_executed: "#22c55e", executed: "#16a34a", failed: "#9ca3af",
};
const PERIODS = [{ key: "7", label: "7 j" }, { key: "30", label: "30 j" }, { key: "90", label: "90 j" }];

function shortDay(d: string) { const [, m, day] = d.split("-"); return `${day}/${m}`; }

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <StCard className="!p-[14px_16px]">
      <p className="text-[12px] font-bold" style={{ color: ST.textSecondary }}>{label}</p>
      <p className="text-[22px] font-extrabold mt-1 tabular-nums" style={{ color: ST.text }}>{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: ST.textMuted }}>{sub}</p>}
    </StCard>
  );
}
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <StCard>
      <p className="text-[14px] font-extrabold mb-3" style={{ color: ST.text }}>{title}</p>
      <div style={{ width: "100%", height: 240 }}>{children}</div>
    </StCard>
  );
}

export default function AgentsAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/formations/admin/agents/analytics?days=${days}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const t = data?.totals;
  const pie = Object.entries(data?.statusCounts ?? {}).map(([k, v]) => ({ name: STATUS_LABEL[k] ?? k, key: k, value: v }));
  const perAgent = (data?.perAgent ?? []).filter((a) => a.runs > 0 || a.actions > 0);

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1100px] mx-auto">
        <Link href="/admin/agents" className="inline-flex items-center gap-1.5 text-[12.5px] font-bold mb-3 hover:underline" style={{ color: ST.green }}>
          <ArrowLeft size={15} /> Agents IA
        </Link>
        <StPageHeader
          title="Statistiques des agents"
          subtitle="Rythme, évolution et tâches effectuées par vos agents IA."
          actions={<StTabs tabs={PERIODS} active={days} onChange={setDays} />}
        />

        {/* Cartes de stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Stat label="Exécutions" value={loading ? "…" : String(t?.runs ?? 0)} sub={`sur ${data?.days ?? 30} j`} />
          <Stat label="Tâches traitées" value={loading ? "…" : (t?.tasks ?? 0).toLocaleString("fr-FR")} />
          <Stat label="Actions générées" value={loading ? "…" : String(t?.actions ?? 0)} />
          <Stat label="Auto-exécutées" value={loading ? "…" : `${t?.autoRate ?? 0} %`} sub="sans intervention" />
          <Stat label="Taux d'approbation" value={loading ? "…" : t?.approvalRate == null ? "—" : `${t.approvalRate} %`} sub="de vos validations" />
          <Stat label="Erreurs" value={loading ? "…" : String(t?.errors ?? 0)} />
          <Stat label="Tokens IA" value={loading ? "…" : (t?.tokens ?? 0).toLocaleString("fr-FR")} sub="consommés" />
          <Stat label="Agents actifs" value={loading ? "…" : String(perAgent.length)} sub="ayant tourné" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Tâches effectuées par jour */}
          <ChartCard title="Tâches effectuées par jour">
            <ResponsiveContainer>
              <AreaChart data={data?.series ?? []} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDay} tick={{ fontSize: 10, fill: ST.textMuted }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: ST.textMuted }} allowDecimals={false} />
                <Tooltip labelFormatter={shortDay} />
                <Area type="monotone" dataKey="tasks" name="Tâches" stroke="#006e2f" strokeWidth={2} fill="url(#gTasks)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Rythme d'exécution (runs/jour) */}
          <ChartCard title="Rythme d'exécution (runs / jour)">
            <ResponsiveContainer>
              <LineChart data={data?.series ?? []} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDay} tick={{ fontSize: 10, fill: ST.textMuted }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: ST.textMuted }} allowDecimals={false} />
                <Tooltip labelFormatter={shortDay} />
                <Line type="monotone" dataKey="runs" name="Exécutions" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Actions créées par jour */}
          <ChartCard title="Actions générées par jour">
            <ResponsiveContainer>
              <BarChart data={data?.series ?? []} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDay} tick={{ fontSize: 10, fill: ST.textMuted }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: ST.textMuted }} allowDecimals={false} />
                <Tooltip labelFormatter={shortDay} />
                <Bar dataKey="actions" name="Actions" fill="#006e2f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Répartition des statuts */}
          <ChartCard title="Répartition des actions">
            {pie.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[13px]" style={{ color: ST.textMuted }}>Pas encore de données.</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={88} paddingAngle={2}>
                    {pie.map((p) => <Cell key={p.key} fill={STATUS_COLOR[p.key] ?? "#9ca3af"} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Tâches par agent */}
          <ChartCard title="Tâches par agent">
            <ResponsiveContainer>
              <BarChart data={perAgent} layout="vertical" margin={{ top: 6, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: ST.textMuted }} allowDecimals={false} />
                <YAxis type="category" dataKey="emoji" width={28} tick={{ fontSize: 16 }} />
                <Tooltip formatter={(v: number, _n, p) => [v, (p?.payload as { name?: string })?.name ?? ""]} />
                <Bar dataKey="tasks" name="Tâches" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Actions par agent */}
          <ChartCard title="Actions par agent">
            <ResponsiveContainer>
              <BarChart data={perAgent} layout="vertical" margin={{ top: 6, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: ST.textMuted }} allowDecimals={false} />
                <YAxis type="category" dataKey="emoji" width={28} tick={{ fontSize: 16 }} />
                <Tooltip formatter={(v: number, _n, p) => [v, (p?.payload as { name?: string })?.name ?? ""]} />
                <Bar dataKey="actions" name="Actions" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </main>
    </div>
  );
}
