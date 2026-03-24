"use client";

import { useEffect, useState, useMemo } from "react";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/client/EmptyState";

const STATUS_TABS = [
  { key: "all", label: "Toutes" },
  { key: "payee", label: "Payées" },
  { key: "en_attente", label: "En attente" },
  { key: "remboursee", label: "Remboursées" },
];

const PERIOD_OPTIONS = [
  { key: "3m", label: "3 derniers mois" },
  { key: "6m", label: "6 derniers mois" },
  { key: "year", label: "Cette année" },
  { key: "all", label: "Tout" },
];

const STATUS_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  payee: { label: "Payée", cls: "bg-primary/20 text-primary", icon: "check_circle" },
  en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-400", icon: "schedule" },
  remboursee: { label: "Remboursée", cls: "bg-red-500/20 text-red-400", icon: "undo" },
};

function SkeletonRow() {
  return (
    <tr className="border-b border-border-dark/50 animate-pulse">
      <td className="px-5 py-4"><div className="h-3 w-20 bg-border-dark rounded" /></td>
      <td className="px-5 py-4"><div className="h-3 w-24 bg-border-dark rounded" /></td>
      <td className="px-5 py-4"><div className="h-3 w-40 bg-border-dark rounded" /></td>
      <td className="px-5 py-4"><div className="h-3 w-20 bg-border-dark rounded ml-auto" /></td>
      <td className="px-5 py-4 text-center"><div className="h-5 w-20 bg-border-dark rounded-full mx-auto" /></td>
      <td className="px-5 py-4"><div className="flex gap-2 justify-center"><div className="h-7 w-7 bg-border-dark rounded" /><div className="h-7 w-7 bg-border-dark rounded" /></div></td>
    </tr>
  );
}

export default function ClientInvoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { addToast } = useToastStore();

  const {
    invoices,
    loading,
    invoicePeriod,
    setInvoicePeriod,
    syncInvoices,
    syncOrders,
    sendInvoiceByEmail,
  } = useClientStore();

  useEffect(() => {
    // syncInvoices depends on orders being loaded first
    syncOrders().then(() => syncInvoices());
  }, [syncOrders, syncInvoices]);

  const isLoading = loading.invoices || loading.orders;

  // Filter by status
  const statusFiltered = useMemo(() => {
    if (statusFilter === "all") return invoices;
    return invoices.filter(inv => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  // Filter by period
  const filteredInvoices = useMemo(() => {
    if (invoicePeriod === "all") return statusFiltered;
    const now = new Date();
    let cutoff: Date;
    switch (invoicePeriod) {
      case "3m":
        cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "6m":
        cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case "year":
        cutoff = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return statusFiltered;
    }
    return statusFiltered.filter(inv => new Date(inv.date) >= cutoff);
  }, [statusFiltered, invoicePeriod]);

  // Counts per status
  const counts = useMemo(() => ({
    all: invoices.length,
    payee: invoices.filter(i => i.status === "payee").length,
    en_attente: invoices.filter(i => i.status === "en_attente").length,
    remboursee: invoices.filter(i => i.status === "remboursee").length,
  }), [invoices]);

  // Total visible
  const totalVisible = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  function exportCSV() {
    if (filteredInvoices.length === 0) {
      addToast("info", "Aucune facture à exporter");
      return;
    }
    const headers = ["Date", "N Facture", "Service", "Montant (EUR)", "Statut"];
    const rows = filteredInvoices.map(inv => [
      new Date(inv.date).toLocaleDateString("fr-FR"),
      inv.id,
      inv.serviceTitle,
      inv.amount.toFixed(2),
      STATUS_MAP[inv.status]?.label || inv.status,
    ]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factures_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Export CSV téléchargé");
  }

  async function handleSendEmail(invoiceId: string) {
    const success = await sendInvoiceByEmail(invoiceId);
    if (success) {
      addToast("success", "Facture envoyée par email");
    } else {
      addToast("error", "Erreur lors de l'envoi de la facture par email");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Factures</h1>
          <p className="text-slate-400 text-sm mt-1">Consultez, téléchargez et exportez toutes vos factures.</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary text-background-dark text-xs sm:text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">download</span>
          <span className="hidden sm:inline">Exporter</span> CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-base sm:text-2xl">receipt_long</span>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-xl font-black text-white">{isLoading ? "-" : counts.all}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total</p>
          </div>
        </div>
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-base sm:text-2xl">check_circle</span>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-xl font-black text-primary">{isLoading ? "-" : counts.payee}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Payées</p>
          </div>
        </div>
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-amber-400 text-base sm:text-2xl">schedule</span>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-xl font-black text-amber-400">{isLoading ? "-" : counts.en_attente}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Attente</p>
          </div>
        </div>
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-base sm:text-2xl">payments</span>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-xl font-black text-white truncate">{isLoading ? "-" : `${totalVisible.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} \u20ac`}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Montant</p>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Status tabs */}
        <div className="flex gap-0.5 sm:gap-1 bg-neutral-dark rounded-xl p-0.5 sm:p-1 border border-border-dark overflow-x-auto w-full sm:w-auto">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                statusFilter === t.key
                  ? "bg-primary text-background-dark shadow"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {t.label}
              <span className={cn(
                "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full",
                statusFilter === t.key ? "bg-background-dark/20" : "bg-border-dark"
              )}>
                {counts[t.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* Period filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Période :</span>
          <select
            value={invoicePeriod}
            onChange={e => setInvoicePeriod(e.target.value)}
            className="px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm text-white outline-none focus:border-primary/50 appearance-none cursor-pointer"
          >
            {PERIOD_OPTIONS.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoice table */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
        {isLoading ? (
          <table className="w-full hidden sm:table">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                <th className="px-3 sm:px-5 py-3 text-left font-semibold">Date</th>
                <th className="hidden md:table-cell px-3 sm:px-5 py-3 text-left font-semibold">N&deg; Facture</th>
                <th className="px-3 sm:px-5 py-3 text-left font-semibold">Service</th>
                <th className="px-3 sm:px-5 py-3 text-right font-semibold">Montant</th>
                <th className="px-3 sm:px-5 py-3 text-center font-semibold">Statut</th>
                <th className="px-3 sm:px-5 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="Aucune facture trouvée"
            description={statusFilter !== "all" || invoicePeriod !== "all"
              ? "Essayez de modifier vos filtres."
              : "Vos factures apparaîtront ici après votre première commande."}
            actionLabel="Explorer les services"
            actionHref="/client/explorer"
          />
        ) : (
          {/* Desktop table */}
          <table className="w-full hidden sm:table">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                <th className="px-3 sm:px-5 py-3 text-left font-semibold">Date</th>
                <th className="hidden md:table-cell px-3 sm:px-5 py-3 text-left font-semibold">N&deg; Facture</th>
                <th className="px-3 sm:px-5 py-3 text-left font-semibold">Service</th>
                <th className="px-3 sm:px-5 py-3 text-right font-semibold">Montant</th>
                <th className="px-3 sm:px-5 py-3 text-center font-semibold">Statut</th>
                <th className="px-3 sm:px-5 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => {
                const statusInfo = STATUS_MAP[inv.status] || STATUS_MAP.en_attente;
                return (
                  <tr key={inv.id} className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors">
                    <td className="px-3 sm:px-5 py-3 text-xs sm:text-sm text-slate-400">{new Date(inv.date).toLocaleDateString("fr-FR")}</td>
                    <td className="hidden md:table-cell px-3 sm:px-5 py-3 text-xs font-mono text-primary font-semibold">{inv.id}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <p className="text-xs sm:text-sm font-medium text-white truncate max-w-[200px]">{inv.serviceTitle}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">#{inv.orderId.slice(-6)}</p>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-xs sm:text-sm font-bold text-white text-right">
                      {(inv.amount ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} &euro;
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-center">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5", statusInfo.cls)}>
                        <span className="material-symbols-outlined text-[10px]">{statusInfo.icon}</span>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-500 hover:text-primary transition-colors"
                          title="Télécharger PDF"
                        >
                          <span className="material-symbols-outlined text-base sm:text-lg">download</span>
                        </a>
                        <button
                          onClick={() => handleSendEmail(inv.id)}
                          className="p-1 text-slate-500 hover:text-primary transition-colors"
                          title="Envoyer par email"
                        >
                          <span className="material-symbols-outlined text-base sm:text-lg">mail</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Mobile card layout */}
          <div className="sm:hidden divide-y divide-border-dark">
            {filteredInvoices.map(inv => {
              const statusInfo = STATUS_MAP[inv.status] || STATUS_MAP.en_attente;
              return (
                <div key={inv.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{inv.serviceTitle}</p>
                      <p className="text-[10px] text-slate-500">{new Date(inv.date).toLocaleDateString("fr-FR")} · #{inv.orderId.slice(-6)}</p>
                    </div>
                    <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-0.5", statusInfo.cls)}>
                      <span className="material-symbols-outlined text-[9px]">{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">{(inv.amount ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} &euro;</p>
                    <div className="flex gap-1">
                      <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 hover:text-primary rounded-lg bg-border-dark/50">
                        <span className="material-symbols-outlined text-base">download</span>
                      </a>
                      <button onClick={() => handleSendEmail(inv.id)} className="p-1.5 text-slate-500 hover:text-primary rounded-lg bg-border-dark/50">
                        <span className="material-symbols-outlined text-base">mail</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info */}
      {!isLoading && filteredInvoices.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {filteredInvoices.length} facture{filteredInvoices.length > 1 ? "s" : ""} affichée{filteredInvoices.length > 1 ? "s" : ""} &mdash; Total : {totalVisible.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} &euro;
        </p>
      )}
    </div>
  );
}
