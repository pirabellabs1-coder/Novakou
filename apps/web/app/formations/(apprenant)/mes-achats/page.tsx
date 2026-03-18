"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  BookOpen,
  Package,
  Users,
  Calendar,
  Download,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import StatCard from "@/components/formations/StatCard";
import EmptyState from "@/components/formations/EmptyState";

type PurchaseType = "formation" | "product" | "cohort";
type PurchaseStatus = "COMPLETED" | "PENDING" | "REFUNDED";
type FilterTab = "all" | "formation" | "product" | "cohort" | "refunds";

type RefundStatus = "pending" | "approved" | "rejected";

interface RefundRequest {
  id: string;
  formationTitle: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  adminNote: string | null;
  createdAt: string;
}

type RefundReason = "quality" | "description" | "technical" | "other";

interface Purchase {
  id: string;
  type: PurchaseType;
  title: string;
  amount: number;
  currency: string;
  status: PurchaseStatus;
  createdAt: string;
  paymentMethod: "card" | "mobile_money";
  formation?: {
    id: string;
    slug: string;
    thumbnail: string | null;
    instructeur: string;
  };
  product?: {
    id: string;
    type: string;
    fileCount: number;
  };
}

interface PurchaseStats {
  totalSpent: number;
  totalFormations: number;
  totalProducts: number;
  thisMonth: number;
}

export default function MesAchatsPage() {
  const locale = useLocale();
  const t = useTranslations("formations_nav");
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Refund state
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundsLoaded, setRefundsLoaded] = useState(false);

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundEnrollmentId, setRefundEnrollmentId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState<RefundReason>("quality");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/formations/connexion");
      return;
    }
  }, [status, router]);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/apprenant/achats");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setPurchases(data.purchases ?? []);
      setStats(data.stats ?? null);
    } catch {
      setError(fr ? "Impossible de charger l'historique d'achats" : "Failed to load purchase history");
    } finally {
      setLoading(false);
    }
  }, [fr]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPurchases();
    }
  }, [status, fetchPurchases]);

  // Fetch refunds when the tab switches to "refunds"
  const fetchRefunds = useCallback(async () => {
    setRefundsLoading(true);
    try {
      const res = await fetch("/api/apprenant/refunds");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setRefunds(data.refunds ?? []);
      setRefundsLoaded(true);
    } catch {
      // silently fail, will show empty state
    } finally {
      setRefundsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "refunds" && !refundsLoaded && status === "authenticated") {
      fetchRefunds();
    }
  }, [activeTab, refundsLoaded, status, fetchRefunds]);

  // Submit refund request
  async function submitRefundRequest() {
    if (!refundEnrollmentId) return;
    setSubmittingRefund(true);
    try {
      const res = await fetch("/api/apprenant/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: refundEnrollmentId,
          reason: refundReason,
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      setRefundModalOpen(false);
      setRefundEnrollmentId(null);
      setRefundReason("quality");
      // Refresh refunds and purchases
      setRefundsLoaded(false);
      fetchPurchases();
      if (activeTab === "refunds") fetchRefunds();
    } catch {
      // Keep modal open on error
    } finally {
      setSubmittingRefund(false);
    }
  }

  // Check if a purchase is eligible for refund (within 14 days and < 30% progress)
  function isRefundEligible(purchase: Purchase): boolean {
    if (purchase.status !== "COMPLETED" || purchase.type !== "formation") return false;
    const daysSince = (Date.now() - new Date(purchase.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 14;
  }

  const filteredPurchases =
    activeTab === "all"
      ? purchases
      : activeTab === "refunds"
      ? [] // refunds tab shows its own content
      : purchases.filter((p) => p.type === activeTab);

  const statusLabel = (s: PurchaseStatus) =>
    ({
      COMPLETED: fr ? "Complété" : "Completed",
      PENDING: fr ? "En attente" : "Pending",
      REFUNDED: fr ? "Remboursé" : "Refunded",
    }[s]);

  const statusColor = (s: PurchaseStatus) =>
    ({
      COMPLETED: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      REFUNDED: "bg-red-100 text-red-700",
    }[s]);

  const typeIcon = (type: PurchaseType) => {
    switch (type) {
      case "formation":
        return <BookOpen className="w-4 h-4 text-violet-600" />;
      case "product":
        return <Package className="w-4 h-4 text-sky-600" />;
      case "cohort":
        return <Users className="w-4 h-4 text-emerald-600" />;
    }
  };

  const typeIconBg = (type: PurchaseType) =>
    ({
      formation: "bg-violet-100",
      product: "bg-sky-100",
      cohort: "bg-emerald-100",
    }[type]);

  const typeLabel = (type: PurchaseType) =>
    ({
      formation: "Formation",
      product: fr ? "Produit" : "Product",
      cohort: fr ? "Cohorte" : "Cohort",
    }[type]);

  const downloadCSV = () => {
    const rows = filteredPurchases.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      date: p.createdAt,
      paymentMethod: p.paymentMethod,
    }));

    const headers = ["id", "type", "title", "amount", "currency", "status", "date", "paymentMethod"];
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const value = String(row[h as keyof typeof row] ?? "");
            return value.includes(",") || value.includes('"') || value.includes("\n")
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `achats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: fr ? "Tous" : "All" },
    { key: "formation", label: "Formations" },
    { key: "product", label: fr ? "Produits" : "Products" },
    { key: "cohort", label: fr ? "Cohortes" : "Cohorts" },
    { key: "refunds", label: t("refunds") },
  ];

  // Refund status helpers
  const refundStatusLabel = (s: RefundStatus) =>
    ({
      pending: t("refund_status_pending"),
      approved: t("refund_status_approved"),
      rejected: t("refund_status_rejected"),
    }[s]);

  const refundStatusColor = (s: RefundStatus) =>
    ({
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    }[s]);

  const refundReasonLabel = (reason: string) =>
    ({
      quality: t("refund_reason_quality"),
      description: t("refund_reason_description"),
      technical: t("refund_reason_technical"),
      other: t("refund_reason_other"),
    }[reason] ?? reason);

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-10 bg-slate-200 rounded-lg w-80 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {fr ? "Erreur de chargement" : "Loading error"}
          </h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={fetchPurchases}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {fr ? "Historique d'achats" : "Purchase History"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {fr
              ? "Retrouvez toutes vos transactions et achats"
              : "View all your transactions and purchases"}
          </p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={filteredPurchases.length === 0}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark text-slate-700 dark:text-slate-300 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-white/5 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {fr ? "Exporter CSV" : "Export CSV"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label={fr ? "Total dépensé" : "Total spent"}
          value={`${(stats?.totalSpent ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          icon={BookOpen}
          label={fr ? "Formations achetées" : "Courses purchased"}
          value={stats?.totalFormations ?? 0}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <StatCard
          icon={Package}
          label={fr ? "Produits achetés" : "Products purchased"}
          value={stats?.totalProducts ?? 0}
          color="text-sky-600"
          bg="bg-sky-50"
        />
        <StatCard
          icon={Calendar}
          label={fr ? "Ce mois" : "This month"}
          value={`${(stats?.thisMonth ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-900 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Refund modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !submittingRefund && setRefundModalOpen(false)}
          />
          <div className="relative z-50 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-orange-500">
                  undo
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {t("refund_request")}
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
                  {t("refund_reason")}
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value as RefundReason)}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:border-slate-600 bg-white dark:bg-slate-900 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="quality">{t("refund_reason_quality")}</option>
                  <option value="description">{t("refund_reason_description")}</option>
                  <option value="technical">{t("refund_reason_technical")}</option>
                  <option value="other">{t("refund_reason_other")}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setRefundModalOpen(false)}
                disabled={submittingRefund}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={submitRefundRequest}
                disabled={submittingRefund}
                className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {submittingRefund ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {fr ? "Envoi..." : "Submitting..."}
                  </span>
                ) : (
                  t("refund_confirm")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction list or Refunds tab */}
      {activeTab === "refunds" ? (
        /* ── Refunds tab content ───────────────────────────────── */
        refundsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : refunds.length === 0 ? (
          <EmptyState
            icon={
              <span className="material-symbols-outlined text-4xl text-slate-400">
                undo
              </span>
            }
            title={fr ? "Aucun remboursement" : "No refunds"}
            description={
              fr
                ? "Vous n'avez pas encore effectue de demande de remboursement."
                : "You haven't submitted any refund requests yet."
            }
          />
        ) : (
          <div className="space-y-3">
            {refunds.map((refund) => (
              <div
                key={refund.id}
                className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-slate-700 dark:border-border-dark p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-lg text-orange-500">
                      undo
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white dark:text-slate-100 truncate mb-0.5">
                      {refund.formationTitle}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>
                        {new Date(refund.createdAt).toLocaleDateString(
                          fr ? "fr-FR" : "en-US",
                          { year: "numeric", month: "short", day: "numeric" }
                        )}
                      </span>
                      <span>{refundReasonLabel(refund.reason)}</span>
                    </div>
                    {refund.status === "rejected" && refund.adminNote && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">info</span>
                        {refund.adminNote}
                      </p>
                    )}
                  </div>

                  {/* Status + Amount */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${refundStatusColor(
                        refund.status
                      )}`}
                    >
                      {refundStatusLabel(refund.status)}
                    </span>
                    <p className="font-bold text-sm tabular-nums text-slate-900 dark:text-white dark:text-slate-100">
                      {refund.amount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {refund.currency === "EUR" ? "\u00A0\u20AC" : ` ${refund.currency}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredPurchases.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 text-slate-400" />}
          title={fr ? "Aucun achat" : "No purchases"}
          description={
            fr
              ? "Vous n'avez pas encore effectue d'achat. Explorez nos formations et produits !"
              : "You haven't made any purchases yet. Explore our courses and products!"
          }
          ctaLabel={fr ? "Explorer les formations" : "Explore courses"}
          ctaHref="/formations/explorer"
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-slate-700 dark:border-border-dark">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 dark:border-border-dark flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100">
              {fr ? "Transactions" : "Transactions"}{" "}
              <span className="text-slate-400 font-normal text-sm">
                ({filteredPurchases.length})
              </span>
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-border-dark">
            {filteredPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Type icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeIconBg(purchase.type)}`}
                >
                  {typeIcon(purchase.type)}
                </div>

                {/* Title & meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white dark:text-slate-100 truncate">
                      {purchase.title}
                    </p>
                    <span
                      className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        purchase.type === "product"
                          ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10"
                          : purchase.type === "cohort"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                          : "bg-violet-50 text-violet-600 dark:bg-violet-500/10"
                      }`}
                    >
                      {typeLabel(purchase.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      {new Date(purchase.createdAt).toLocaleDateString(
                        fr ? "fr-FR" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </span>
                    <span className="capitalize">
                      {purchase.paymentMethod === "mobile_money"
                        ? "Mobile Money"
                        : fr
                        ? "Carte"
                        : "Card"}
                    </span>
                  </div>
                </div>

                {/* Amount + Status + Refund button */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isRefundEligible(purchase) && (
                    <button
                      onClick={() => {
                        setRefundEnrollmentId(purchase.formation?.id ?? purchase.id);
                        setRefundModalOpen(true);
                      }}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">undo</span>
                      {t("refund_request")}
                    </button>
                  )}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(purchase.status)}`}
                  >
                    {statusLabel(purchase.status)}
                  </span>
                  <p
                    className={`font-bold text-sm tabular-nums ${
                      purchase.status === "REFUNDED"
                        ? "text-red-600 line-through"
                        : "text-slate-900 dark:text-white dark:text-slate-100"
                    }`}
                  >
                    {purchase.amount.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
