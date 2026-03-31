"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToastStore } from "@/store/toast";
import { AdminPermissionGuard } from "@/components/admin/AdminPermissionGuard";
import { cn } from "@/lib/utils";

// ── Types ──
interface KPIs {
  revenueServices: number;
  totalCommissions: number;
  revenueBoosts: number;
  revenueAbonnements: number;
  totalRefunds: number;
  netResult: number;
  operationsCount: number;
}

interface Operation {
  id: string;
  date: string;
  type: "achat" | "abonnement" | "boost" | "remboursement" | "commission";
  reference: string;
  payer: string;
  amount: number;
  commission: number;
  status: string;
}

interface AccountingData {
  kpis: KPIs;
  operations: Operation[];
  period: string;
  startDate: string;
  endDate: string;
}

// ── Constants ──
const PERIODS = [
  { key: "1m", label: "1 mois" },
  { key: "3m", label: "3 mois" },
  { key: "6m", label: "6 mois" },
  { key: "1y", label: "1 an" },
  { key: "5y", label: "5 ans" },
];

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  achat: { label: "Achat service", color: "bg-emerald-500/10 text-emerald-400", icon: "shopping_bag" },
  abonnement: { label: "Abonnement", color: "bg-blue-500/10 text-blue-400", icon: "card_membership" },
  boost: { label: "Boost", color: "bg-amber-500/10 text-amber-400", icon: "rocket_launch" },
  remboursement: { label: "Remboursement", color: "bg-red-500/10 text-red-400", icon: "undo" },
  commission: { label: "Commission", color: "bg-purple-500/10 text-purple-400", icon: "payments" },
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  paye: { label: "Payé", cls: "bg-emerald-500/10 text-emerald-400" },
  en_attente: { label: "En attente", cls: "bg-amber-500/10 text-amber-400" },
  rembourse: { label: "Remboursé", cls: "bg-red-500/10 text-red-400" },
};

const PER_PAGE = 10;

// ── Helpers ──
function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ──
export default function AdminComptabilite() {
  const { addToast } = useToastStore();
  const [period, setPeriod] = useState("1m");
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comptabilite?period=${p}`);
      if (!res.ok) throw new Error("Erreur API");
      const json: AccountingData = await res.json();
      setData(json);
    } catch {
      addToast("error", "Erreur lors du chargement de la comptabilite");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  // Filtered operations
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.operations.filter((op) => {
      if (typeFilter && op.type !== typeFilter) return false;
      if (statusFilter && op.status !== statusFilter) return false;
      return true;
    });
  }, [data, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, period]);

  // ── CSV Export ──
  function exportCSV() {
    if (!data || filtered.length === 0) {
      addToast("info", "Aucune donnee a exporter");
      return;
    }
    const headers = ["Date", "Type", "Reference", "Payeur", "Montant HT (EUR)", "TVA 20% (EUR)", "Montant TTC (EUR)", "Commission (EUR)", "Statut"];
    const rows = filtered.map((op) => {
      const ht = op.amount;
      const tva = Math.round(ht * 0.2 * 100) / 100;
      const ttc = Math.round((ht + tva) * 100) / 100;
      return [
        fmtDate(op.date),
        TYPE_LABELS[op.type]?.label || op.type,
        op.reference,
        op.payer,
        ht.toFixed(2),
        tva.toFixed(2),
        ttc.toFixed(2),
        op.commission.toFixed(2),
        STATUS_LABELS[op.status]?.label || op.status,
      ].join(";");
    });
    const csv = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comptabilite_FreelanceHigh_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", `CSV exporte (${filtered.length} operations)`);
  }

  // ── PDF Export ──
  async function exportPDF() {
    if (!data) return;
    try {
      const { generateAccountingReport } = await import("@/lib/pdf/accounting-report");
      const bytes = generateAccountingReport({
        period: PERIODS.find((p) => p.key === period)?.label || period,
        startDate: data.startDate,
        endDate: data.endDate,
        kpis: data.kpis,
        operationsCount: filtered.length,
      });
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recapitulatif_FreelanceHigh_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("success", "Recapitulatif PDF telecharge");
    } catch (err) {
      console.error("[Comptabilite] PDF export error:", err);
      addToast("error", "Erreur lors de la generation du PDF");
    }
  }

  const kpis = data?.kpis;

  const KPI_CARDS = [
    { label: "Recettes services", value: kpis ? `${fmt(kpis.revenueServices)} \u20ac` : "—", icon: "shopping_bag", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Commissions percues", value: kpis ? `${fmt(kpis.totalCommissions)} \u20ac` : "—", icon: "payments", color: "text-primary", bg: "bg-primary/10" },
    { label: "Revenus boosts", value: kpis ? `${fmt(kpis.revenueBoosts)} \u20ac` : "—", icon: "rocket_launch", color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Abonnements", value: kpis ? `${fmt(kpis.revenueAbonnements)} \u20ac` : "—", icon: "card_membership", color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Remboursements", value: kpis ? `${fmt(kpis.totalRefunds)} \u20ac` : "—", icon: "undo", color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Resultat net", value: kpis ? `${fmt(kpis.netResult)} \u20ac` : "—", icon: "account_balance", color: kpis && kpis.netResult >= 0 ? "text-emerald-400" : "text-red-400", bg: kpis && kpis.netResult >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
  ];

  return (
    <AdminPermissionGuard permission="comptabilite.view">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_balance</span>
            Comptabilite generale
          </h1>
          <p className="text-sm text-slate-400 mt-1">Vue consolidee de toutes les operations financieres de la plateforme.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            PDF
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-colors",
              period === p.key ? "bg-primary text-white" : "bg-neutral-dark text-slate-400 hover:text-white border border-border-dark"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[0,1,2,3,4,5].map((i) => (
            <div key={i} className="bg-neutral-dark rounded-xl p-4 border border-border-dark animate-pulse">
              <div className="h-4 w-20 bg-border-dark rounded mb-3" />
              <div className="h-7 w-24 bg-border-dark rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {KPI_CARDS.map((card) => (
            <div key={card.label} className="bg-neutral-dark rounded-xl p-4 border border-border-dark">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.bg)}>
                  <span className={cn("material-symbols-outlined text-lg", card.color)}>{card.icon}</span>
                </div>
              </div>
              <p className="text-lg font-black text-white">{card.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-neutral-dark border border-border-dark text-white text-xs font-semibold focus:outline-none focus:border-primary"
        >
          <option value="">Tous les types</option>
          <option value="achat">Achats services</option>
          <option value="abonnement">Abonnements</option>
          <option value="boost">Boosts</option>
          <option value="remboursement">Remboursements</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-neutral-dark border border-border-dark text-white text-xs font-semibold focus:outline-none focus:border-primary"
        >
          <option value="">Tous les statuts</option>
          <option value="paye">Payé</option>
          <option value="en_attente">En attente</option>
          <option value="rembourse">Remboursé</option>
        </select>
        <span className="text-xs text-slate-500">{filtered.length} opération{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Operations table */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">receipt_long</span>
            <p className="text-sm text-slate-500">Aucune operation pour cette periode</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border-dark">
                    <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Référence</th>
                    <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Date</th>
                    <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Type</th>
                    <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Payeur</th>
                    <th className="px-5 py-3 text-right text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Montant</th>
                    <th className="px-5 py-3 text-right text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Commission</th>
                    <th className="px-5 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark/50">
                  {paginated.map((op) => {
                    const typeInfo = TYPE_LABELS[op.type] || { label: op.type, color: "bg-slate-500/10 text-slate-400", icon: "receipt" };
                    const statusInfo = STATUS_LABELS[op.status] || { label: op.status, cls: "bg-slate-500/10 text-slate-400" };
                    return (
                      <tr key={op.id} className="hover:bg-background-dark/30 transition-colors">
                        <td className="px-5 py-3 text-sm font-mono text-primary font-semibold">{op.reference}</td>
                        <td className="px-5 py-3 text-sm text-slate-400">{fmtDate(op.date)}</td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold", typeInfo.color)}>
                            <span className="material-symbols-outlined text-xs">{typeInfo.icon}</span>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-300 max-w-[200px] truncate">{op.payer}</td>
                        <td className="px-5 py-3 text-sm font-bold text-white text-right">{fmt(op.amount)} &euro;</td>
                        <td className="px-5 py-3 text-sm text-emerald-400 text-right">{op.commission > 0 ? `+${fmt(op.commission)} \u20ac` : "—"}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", statusInfo.cls)}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border-dark">
                <p className="text-xs text-slate-500">
                  Page {page}/{totalPages} — {filtered.length} operation{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 text-xs font-semibold rounded bg-border-dark text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                    Prec.
                  </button>
                  <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 text-xs font-semibold rounded bg-border-dark text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                    Suiv.
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </AdminPermissionGuard>
  );
}
