"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

type FilterStatus = "tous" | "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

type Commission = {
  id: string;
  orderId: string;
  orderType: string;
  orderAmount: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  landingPage: string | null;
};

type Summary = {
  total: number;
  approved: number;
  pending: number;
  paid: number;
  cancelled: number;
  count: number;
};

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
function toEur(n: number)      { return Math.round(n / 655.957); }

const statusConfig: Record<string, { label: string; cls: string }> = {
  APPROVED: { label: "confirmé",  cls: "bg-[#22c55e]/20 text-[#22c55e]" },
  PENDING:  { label: "en attente", cls: "bg-amber-500/20 text-amber-400" },
  PAID:     { label: "versé",     cls: "bg-blue-500/20 text-blue-400" },
  CANCELLED: { label: "annulé",   cls: "bg-red-500/20 text-red-400" },
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1e3a2f]/60 rounded-xl ${className ?? ""}`} />;
}

export default function CommissionsPage() {
  const [filter, setFilter] = useState<FilterStatus>("tous");

  const { data, isLoading } = useQuery({
    queryKey: ["affilie-commissions", filter],
    queryFn: () => {
      const url = filter === "tous"
        ? "/api/formations/affilie/commissions"
        : `/api/formations/affilie/commissions?status=${filter}`;
      return fetch(url).then((r) => r.json());
    },
    staleTime: 30_000,
  });

  const commissions: Commission[] = data?.data ?? [];
  const summary: Summary = data?.summary ?? { total: 0, approved: 0, pending: 0, paid: 0, cancelled: 0, count: 0 };

  const filters: { value: FilterStatus; label: string }[] = [
    { value: "tous",     label: "Toutes" },
    { value: "APPROVED", label: "Confirmées" },
    { value: "PENDING",  label: "En attente" },
    { value: "PAID",     label: "Versées" },
    { value: "CANCELLED", label: "Annulées" },
  ];

  return (
    <div className="p-5 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-white">Commissions</h1>
        <p className="text-sm text-[#5c9e7a] mt-0.5">Historique complet de vos gains d&apos;affiliation</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          [0,1,2,3].map((i) => <SkeletonBlock key={i} className="h-24" />)
        ) : [
          {
            label: "Total cumulé",
            value: formatFcfa(summary.total),
            sub: `≈ ${toEur(summary.total)} €`,
            color: "text-white",
          },
          {
            label: "Confirmées",
            value: formatFcfa(summary.approved),
            sub: `${commissions.filter((c) => c.status === "APPROVED").length} vente(s) confirmée(s)`,
            color: "text-[#22c55e]",
          },
          {
            label: "En attente",
            value: formatFcfa(summary.pending),
            sub: `${commissions.filter((c) => c.status === "PENDING").length} en attente`,
            color: "text-amber-400",
          },
          {
            label: "Versées",
            value: formatFcfa(summary.paid),
            sub: `≈ ${toEur(summary.paid)} €`,
            color: "text-blue-400",
          },
        ].map((s, i) => (
          <div key={i} className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-4">
            <p className={`text-lg font-extrabold mb-0.5 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#5c9e7a]">{s.label}</p>
            <p className="text-[10px] text-[#5c9e7a] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="material-symbols-outlined text-[18px] text-[#22c55e] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
        <p className="text-xs text-[#5c9e7a] leading-relaxed">
          Les commissions <strong className="text-white">confirmées</strong> sont versées le dernier jour ouvré de chaque mois.
          Les commissions <strong className="text-amber-400">en attente</strong> sont soumises à un délai de rétractation de 14 jours après l&apos;achat.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f.value ? "bg-[#22c55e] text-white" : "bg-[#0d1f17] border border-[#1e3a2f] text-[#5c9e7a] hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[0,1,2,3,4].map((i) => <SkeletonBlock key={i} className="h-14" />)}</div>
        ) : commissions.length === 0 ? (
          <div className="py-12 text-center text-[#5c9e7a] text-sm">
            Aucune commission dans cette catégorie.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#1e3a2f]">
                  {["Référence", "Formation", "Date", "Vente", "Commission", "Statut"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-[#5c9e7a] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => {
                  const st = statusConfig[c.status] ?? { label: c.status, cls: "bg-gray-500/20 text-gray-400" };
                  const date = new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                  const typeLabel = c.orderType === "formation" ? "Formation" : c.orderType === "product" ? "Produit" : c.orderType ?? "Vente";
                  return (
                    <tr key={c.id} className="border-b border-[#1e3a2f] last:border-0 hover:bg-[#1e3a2f]/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-mono text-[#5c9e7a]">#{c.id.slice(0, 10).toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-white font-medium max-w-[200px] leading-snug">{typeLabel}</p>
                        <p className="text-[10px] text-[#5c9e7a] font-mono">#{c.orderId?.slice(0, 8).toUpperCase()}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-[#5c9e7a] whitespace-nowrap">{date}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-white font-medium whitespace-nowrap">{formatFcfa(c.orderAmount)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold whitespace-nowrap ${c.status === "CANCELLED" ? "text-red-400" : "text-[#22c55e]"}`}>
                          {c.status === "CANCELLED" ? "-" : "+"}{formatFcfa(c.commissionAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
