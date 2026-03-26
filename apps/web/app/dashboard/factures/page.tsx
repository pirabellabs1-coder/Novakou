"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";
import { useDashboardStore } from "@/store/dashboard";
import { AnimatedCounter } from "@/components/ui/animated-counter";

// ============================================================
// Types
// ============================================================
interface Invoice {
  id: string;
  date: string;
  client: string;
  description: string;
  amount: number;
  status: "payee" | "en_attente" | "en_retard";
}

// ============================================================
// Status config
// ============================================================
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  payee: { label: "Payee", color: "text-emerald-400 bg-emerald-500/10" },
  en_attente: { label: "En attente", color: "text-amber-400 bg-amber-500/10" },
  en_retard: { label: "En retard", color: "text-red-400 bg-red-500/10" },
};

// ============================================================
// Month options for filter
// ============================================================
const MONTH_OPTIONS = [
  { value: "all", label: "Tous les mois" },
  { value: "2026-01", label: "Janvier 2026" },
  { value: "2026-02", label: "Fevrier 2026" },
  { value: "2026-03", label: "Mars 2026" },
];

// ============================================================
// Component
// ============================================================
export default function FacturesPage() {
  const addToast = useToastStore((s) => s.addToast);
  const { orders, syncFromApi } = useDashboardStore();

  useEffect(() => { syncFromApi(); }, [syncFromApi]);

  // Generate invoices from orders
  const invoices: Invoice[] = useMemo(() => {
    return orders
      .filter((o) => o.status === "termine" || o.status === "livre" || o.status === "en_cours")
      .map((o) => ({
        id: `FAC-${o.id.slice(-4)}`,
        date: o.createdAt,
        client: o.clientName,
        description: o.serviceTitle,
        amount: o.amount,
        status: (o.status === "termine" ? "payee" : "en_attente") as Invoice["status"],
      }));
  }, [orders]);

  const [filterMonth, setFilterMonth] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  // Filtered invoices
  const filtered = useMemo(() => {
    let result = [...invoices];

    // Month filter
    if (filterMonth !== "all") {
      result = result.filter((inv) => inv.date.startsWith(filterMonth));
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((inv) => inv.status === filterStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.id.toLowerCase().includes(q) ||
          inv.client.toLowerCase().includes(q) ||
          inv.description.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [filterMonth, filterStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = invoices.length;
    const totalAmount = invoices.reduce((s, inv) => s + inv.amount, 0);
    const pendingAmount = invoices.filter((inv) => inv.status === "en_attente" || inv.status === "en_retard")
      .reduce((s, inv) => s + inv.amount, 0);
    return { total, totalAmount, pendingAmount };
  }, [invoices]);

  function handleDownloadPDF(invoice: Invoice) {
    addToast("success", `Facture ${invoice.id} téléchargée en PDF`);
  }

  function handleSendEmail(invoice: Invoice) {
    addToast("success", `Facture ${invoice.id} envoyée par email à ${invoice.client}`);
  }

  function handleViewDetails(invoice: Invoice) {
    setDetailInvoice(invoice);
  }

  return (
    <div className="max-w-full space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">Mes Factures</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Consultez, téléchargez et envoyez vos factures.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Total factures</p>
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">description</span>
            </div>
          </div>
          <AnimatedCounter value={stats.total} className="text-3xl font-extrabold block" />
          <p className="text-xs text-slate-500 mt-1">Factures emises</p>
        </div>

        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Montant total</p>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-lg">payments</span>
            </div>
          </div>
          <AnimatedCounter value={stats.totalAmount} prefix="€" className="text-3xl font-extrabold block" />
          <p className="text-xs text-slate-500 mt-1">Toutes factures confondues</p>
        </div>

        <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">En attente</p>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-lg">schedule</span>
            </div>
          </div>
          <AnimatedCounter value={stats.pendingAmount} prefix="€" className="text-3xl font-extrabold block" />
          <p className="text-xs text-slate-500 mt-1">Paiements en attente ou en retard</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          {MONTH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tous les statuts</option>
          <option value="payee">Payees</option>
          <option value="en_attente">En attente</option>
          <option value="en_retard">En retard</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par numero, client ou description..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-border-dark flex justify-between items-center">
          <h3 className="font-bold">Factures ({filtered.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-primary/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Numero</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">receipt_long</span>
                    Aucune facture trouvee.
                  </td>
                </tr>
              )}
              {filtered.map((invoice) => {
                const s = STATUS_CONFIG[invoice.status];
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-primary">{invoice.id}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(invoice.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                          {invoice.client.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium">{invoice.client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                      {invoice.description}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      €{(invoice.amount ?? 0).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold", s?.color)}>
                        {s?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          title="Telecharger PDF"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                        </button>
                        <button
                          onClick={() => handleSendEmail(invoice)}
                          title="Envoyer par email"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">mail</span>
                        </button>
                        <button
                          onClick={() => handleViewDetails(invoice)}
                          title="Voir les details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailInvoice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailInvoice(null)} />
          <div className="relative bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Facture {detailInvoice.id}</h3>
                  <p className="text-xs text-slate-500">{new Date(detailInvoice.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-border-dark">
                <span className="text-sm text-slate-500">Client</span>
                <span className="text-sm font-semibold">{detailInvoice.client}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-border-dark">
                <span className="text-sm text-slate-500">Description</span>
                <span className="text-sm font-semibold">{detailInvoice.description}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-border-dark">
                <span className="text-sm text-slate-500">Montant HT</span>
                <span className="text-sm font-semibold">€{(detailInvoice.amount * 0.8).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-border-dark">
                <span className="text-sm text-slate-500">TVA (20%)</span>
                <span className="text-sm font-semibold">€{(detailInvoice.amount * 0.2).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-border-dark">
                <span className="text-sm text-slate-500">Montant TTC</span>
                <span className="text-lg font-extrabold text-primary">€{(detailInvoice.amount ?? 0).toLocaleString("fr-FR")}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-slate-500">Statut</span>
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold", STATUS_CONFIG[detailInvoice.status]?.color)}>
                  {STATUS_CONFIG[detailInvoice.status]?.label}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  handleDownloadPDF(detailInvoice);
                  setDetailInvoice(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Telecharger PDF
              </button>
              <button
                onClick={() => {
                  handleSendEmail(detailInvoice);
                  setDetailInvoice(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-border-dark font-bold rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:border-primary/50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
                Envoyer par email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
