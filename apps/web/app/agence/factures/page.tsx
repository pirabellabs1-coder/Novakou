"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";
import type { ApiOrder } from "@/lib/api-client";

// ── Types ──

interface InvoiceView {
  invoiceNumber: string;
  orderId: string;
  clientName: string;
  clientAvatar: string;
  serviceTitle: string;
  date: string;
  amount: number;
  commission: number;
  status: "payee" | "en_attente";
}

// ── Filter tabs ──

const FILTER_TABS = [
  { key: "all", label: "Toutes", icon: "receipt_long" },
  { key: "payee", label: "Payees", icon: "check_circle" },
  { key: "en_attente", label: "En attente", icon: "schedule" },
] as const;

// ── Helpers ──

function orderToInvoice(order: ApiOrder): InvoiceView {
  const isPaid = order.status === "termine";
  return {
    invoiceNumber: `FH-2026-${order.id.slice(-4).toUpperCase()}`,
    orderId: order.id,
    clientName: order.clientName,
    clientAvatar: order.clientAvatar,
    serviceTitle: order.serviceTitle,
    date: order.completedAt || order.createdAt,
    amount: order.amount,
    commission: order.commission,
    status: isPaid ? "payee" : "en_attente",
  };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateLong(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── CSV export ──

function generateCsv(invoices: InvoiceView[]): void {
  const headers = [
    "Numero facture",
    "Client",
    "Service",
    "Date",
    "Montant HT (EUR)",
    "TVA 20% (EUR)",
    "Montant TTC (EUR)",
    "Commission (EUR)",
    "Net (EUR)",
    "Statut",
  ];

  const rows = invoices.map((inv) => {
    const ht = inv.amount;
    const tva = ht * 0.2;
    const ttc = ht + tva;
    const net = ht - inv.commission;
    return [
      inv.invoiceNumber,
      inv.clientName,
      inv.serviceTitle,
      inv.date,
      ht.toFixed(2),
      tva.toFixed(2),
      ttc.toFixed(2),
      inv.commission.toFixed(2),
      net.toFixed(2),
      inv.status === "payee" ? "Payee" : "En attente",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `factures-agence-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── PDF download ──

async function downloadPdf(
  orderId: string,
  invoiceNumber: string,
  addToast: (type: "success" | "error", msg: string) => void
): Promise<void> {
  try {
    const res = await fetch(`/api/invoices/${orderId}/pdf`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FreelanceHigh-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("success", `Facture ${invoiceNumber} téléchargée en PDF`);
  } catch {
    addToast("error", `Erreur lors du téléchargement de la facture ${invoiceNumber}`);
  }
}

// ── Component ──

export default function AgenceFacturesPage() {
  const { orders, syncAll, isLoading } = useAgencyStore();
  const addToast = useToastStore((s) => s.addToast);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceView | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Sync data on mount
  useEffect(() => {
    syncAll();
  }, [syncAll]);

  // Derive invoices from orders
  const allInvoices = useMemo<InvoiceView[]>(() => {
    return orders
      .filter(
        (o) =>
          o.status === "termine" ||
          o.status === "livre" ||
          o.status === "en_cours"
      )
      .map(orderToInvoice)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    let result = allInvoices;

    if (filterStatus !== "all") {
      result = result.filter((inv) => inv.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.clientName.toLowerCase().includes(q) ||
          inv.serviceTitle.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allInvoices, filterStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = allInvoices.length;
    const totalAmount = allInvoices.reduce((s, inv) => s + inv.amount, 0);
    const paidAmount = allInvoices
      .filter((inv) => inv.status === "payee")
      .reduce((s, inv) => s + inv.amount, 0);
    const pendingAmount = allInvoices
      .filter((inv) => inv.status === "en_attente")
      .reduce((s, inv) => s + inv.amount, 0);
    const paidCount = allInvoices.filter((inv) => inv.status === "payee").length;
    const pendingCount = allInvoices.filter((inv) => inv.status === "en_attente").length;
    return { total, totalAmount, paidAmount, pendingAmount, paidCount, pendingCount };
  }, [allInvoices]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: allInvoices.length,
      payee: stats.paidCount,
      en_attente: stats.pendingCount,
    };
  }, [allInvoices.length, stats.paidCount, stats.pendingCount]);

  // Handlers
  const handleExportCsv = useCallback(() => {
    if (filteredInvoices.length === 0) return;
    generateCsv(filteredInvoices);
    addToast("success", `${filteredInvoices.length} facture(s) exportee(s) en CSV`);
  }, [filteredInvoices, addToast]);

  const handleDownloadPdf = useCallback(
    async (inv: InvoiceView) => {
      setDownloadingId(inv.orderId);
      await downloadPdf(inv.orderId, inv.invoiceNumber, addToast);
      setDownloadingId(null);
    },
    [addToast]
  );

  const handleSendEmail = useCallback(
    (inv: InvoiceView) => {
      addToast("success", `Facture ${inv.invoiceNumber} envoyee par email`);
    },
    [addToast]
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Factures
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Consultez et gérez les factures de l&apos;agence.
            </p>
          </div>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={filteredInvoices.length === 0}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
            filteredInvoices.length > 0
              ? "bg-primary text-background-dark hover:opacity-90"
              : "bg-neutral-dark text-slate-500 cursor-not-allowed border border-border-dark"
          )}
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Exporter CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-dark border border-border-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Total factures
            </p>
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">description</span>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Factures emises</p>
        </div>

        <div className="bg-neutral-dark border border-border-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Montant paye
            </p>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-lg">payments</span>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {formatAmount(stats.paidAmount)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.paidCount} facture{stats.paidCount !== 1 ? "s" : ""} payee{stats.paidCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-neutral-dark border border-border-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              En attente
            </p>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-lg">schedule</span>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {formatAmount(stats.pendingAmount)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.pendingCount} facture{stats.pendingCount !== 1 ? "s" : ""} en attente
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              filterStatus === tab.key
                ? "bg-primary text-background-dark"
                : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
            {(tabCounts[tab.key as keyof typeof tabCounts] ?? 0) > 0 && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  filterStatus === tab.key
                    ? "bg-background-dark/20 text-background-dark"
                    : "bg-border-dark text-slate-400"
                )}
              >
                {tabCounts[tab.key as keyof typeof tabCounts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="Rechercher par numero, client ou service..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && allInvoices.length === 0 && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-12 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-slate-400 text-sm">Chargement des factures...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allInvoices.length === 0 && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-16 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-5xl text-slate-600">
            receipt_long
          </span>
          <p className="text-slate-400 text-sm font-medium text-center">
            Aucune facture
          </p>
          <p className="text-slate-500 text-xs text-center max-w-sm">
            Les factures seront generees automatiquement apres chaque commande terminee.
          </p>
        </div>
      )}

      {/* Filtered empty state */}
      {!isLoading && allInvoices.length > 0 && filteredInvoices.length === 0 && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-12 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-5xl text-slate-600">
            search_off
          </span>
          <p className="text-slate-400 text-sm font-medium">
            Aucune facture trouvee
          </p>
          {searchQuery && (
            <p className="text-slate-500 text-xs">
              Aucun resultat pour &quot;{searchQuery}&quot;.{" "}
              <button
                onClick={() => setSearchQuery("")}
                className="text-primary hover:underline"
              >
                Effacer la recherche
              </button>
            </p>
          )}
        </div>
      )}

      {/* Invoice table */}
      {!isLoading && filteredInvoices.length > 0 && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                  <th className="px-5 py-3 text-left font-semibold">Numero</th>
                  <th className="px-5 py-3 text-left font-semibold">Client</th>
                  <th className="px-5 py-3 text-left font-semibold">Service</th>
                  <th className="px-5 py-3 text-left font-semibold">Date</th>
                  <th className="px-5 py-3 text-left font-semibold">Montant</th>
                  <th className="px-5 py-3 text-left font-semibold">Statut</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.orderId}
                    className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors"
                  >
                    {/* Invoice number */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm font-bold text-primary">
                        {inv.invoiceNumber}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        {inv.clientAvatar ? (
                          <Image
                            src={inv.clientAvatar}
                            alt={inv.clientName}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                            {getInitials(inv.clientName)}
                          </div>
                        )}
                        <span className="text-sm text-slate-300 font-medium truncate max-w-[140px]">
                          {inv.clientName}
                        </span>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-5 py-3">
                      <span className="text-sm text-white font-semibold truncate block max-w-[200px]">
                        {inv.serviceTitle}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-400">
                        {formatDate(inv.date)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-white">
                        {formatAmount(inv.amount)}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                          inv.status === "payee"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-amber-400 bg-amber-500/10"
                        )}
                      >
                        {inv.status === "payee" ? "Payee" : "En attente"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          disabled={downloadingId === inv.orderId}
                          title="Telecharger PDF"
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            downloadingId === inv.orderId
                              ? "text-slate-600 cursor-wait"
                              : "text-slate-400 hover:text-primary hover:bg-primary/10"
                          )}
                        >
                          <span
                            className={cn(
                              "material-symbols-outlined text-lg",
                              downloadingId === inv.orderId && "animate-spin"
                            )}
                          >
                            {downloadingId === inv.orderId
                              ? "progress_activity"
                              : "download"}
                          </span>
                        </button>

                        {/* Send by email */}
                        <button
                          onClick={() => handleSendEmail(inv)}
                          title="Envoyer par email"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            mail
                          </span>
                        </button>

                        {/* Preview */}
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          title="Previsualiser"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                        </button>

                        {/* Print */}
                        <button
                          onClick={handlePrint}
                          title="Imprimer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            print
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border-dark">
            <p className="text-xs text-slate-500">
              {filteredInvoices.length} facture
              {filteredInvoices.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Total :{" "}
              <span className="text-white font-bold">
                {formatAmount(
                  filteredInvoices.reduce((s, inv) => s + inv.amount, 0)
                )}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewInvoice(null)}
          />
          <div className="relative bg-neutral-dark border border-border-dark rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">
                    receipt_long
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {previewInvoice.invoiceNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Facture FreelanceHigh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Agency info */}
            <div className="bg-background-dark/50 rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">
                Emetteur
              </p>
              <p className="text-sm text-white font-semibold">
                FreelanceHigh SAS
              </p>
              <p className="text-xs text-slate-400">
                123 Avenue de la Tech, 75001 Paris, France
              </p>
              <p className="text-xs text-slate-400">
                contact@freelancehigh.com
              </p>
            </div>

            {/* Client info */}
            <div className="bg-background-dark/50 rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">
                Client
              </p>
              <div className="flex items-center gap-2">
                {previewInvoice.clientAvatar ? (
                  <Image
                    src={previewInvoice.clientAvatar}
                    alt={previewInvoice.clientName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {getInitials(previewInvoice.clientName)}
                  </div>
                )}
                <span className="text-sm text-white font-semibold">
                  {previewInvoice.clientName}
                </span>
              </div>
            </div>

            {/* Service details */}
            <div className="space-y-3 mb-4">
              {(
                [
                  ["Service", previewInvoice.serviceTitle],
                  ["Date", formatDateLong(previewInvoice.date)],
                  [
                    "Statut",
                    previewInvoice.status === "payee" ? "Payee" : "En attente",
                  ],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2 border-b border-border-dark"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial breakdown */}
            <div className="bg-background-dark/50 rounded-lg p-4 space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
                Detail financier
              </p>

              {(
                [
                  ["Montant HT", formatAmount(previewInvoice.amount)],
                  [
                    "TVA (20%)",
                    formatAmount(previewInvoice.amount * 0.2),
                  ],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-300">
                    {value}
                  </span>
                </div>
              ))}

              <div className="border-t border-border-dark pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-white">
                  Total TTC
                </span>
                <span className="text-lg font-extrabold text-primary">
                  {formatAmount(previewInvoice.amount * 1.2)}
                </span>
              </div>

              <div className="border-t border-border-dark pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Commission plateforme
                  </span>
                  <span className="text-xs font-semibold text-red-400">
                    -{formatAmount(previewInvoice.commission)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-400">
                    Net agence
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {formatAmount(
                      previewInvoice.amount - previewInvoice.commission
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  handleDownloadPdf(previewInvoice);
                  setPreviewInvoice(null);
                }}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  download
                </span>
                Telecharger PDF
              </button>
              <button
                onClick={() => {
                  handleSendEmail(previewInvoice);
                  setPreviewInvoice(null);
                }}
                className="flex-1 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-lg hover:bg-blue-500/20 flex items-center justify-center gap-2 transition-colors"
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
