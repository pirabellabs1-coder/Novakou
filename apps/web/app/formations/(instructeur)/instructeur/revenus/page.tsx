"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useInstructorRevenue, useInstructorProductStats } from "@/lib/formations/hooks";
import {
  DollarSign, TrendingUp, Clock, Download,
  ArrowDownCircle, CheckCircle, AlertCircle, ChevronRight, Package, BookOpen, Wallet,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import StatCard from "@/components/formations/StatCard";
import ChartContainer from "@/components/formations/ChartContainer";

interface Revenue {
  totalEarned: number;
  available: number;
  pending: number;
  withdrawn: number;
  transactions: {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    description: string;
    formation?: { title: string };
  }[];
  monthlyRevenue: { month: string; gross: number; net: number }[];
  withdrawals: {
    id: string;
    amount: number;
    method: string;
    status: string;
    requestedAt: string;
  }[];
}

interface WithdrawForm {
  amount: string;
  method: string;
  details: string;
}

interface ProductStats {
  totalRevenue: number;
  revenueThisWeek: number;
  totalClients: number;
  totalSales: number;
  revenueTrend: number;
  salesTrend: number;
  revenueByMonth: { month: string; revenue: number }[];
  topProducts: { id: string; title: string; type: string; sales: number; revenue: number; rating: number }[];
  recentPurchases: { buyerName: string; productTitle: string; amount: number; date: string }[];
  clients: { name: string; email: string; totalSpent: number; productsCount: number }[];
}

type RevenueView = "all" | "formations" | "products";

const WITHDRAW_METHODS = [
  "Virement IBAN",
  "PayPal",
  "Wave",
  "Orange Money",
  "MTN Mobile Money",
];

export default function InstructeurRevenusPage() {
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [revenueView, setRevenueView] = useState<RevenueView>("all");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState<WithdrawForm>({ amount: "", method: WITHDRAW_METHODS[0], details: "" });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const { data: revenueData, isLoading: revenueLoading, error: revenueError, refetch: refetchRevenue } = useInstructorRevenue();
  const { data: productStatsData, isLoading: productStatsLoading, error: productStatsError, refetch: refetchProducts } = useInstructorProductStats("all");

  const revenue = revenueData as Revenue | null | undefined;
  const productStats = productStatsData as ProductStats | null | undefined;
  const loading = revenueLoading || productStatsLoading;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
  }, [status, router]);

  // ── Computed values based on revenueView ──────────────────────────────
  const formationTotal = revenue?.totalEarned ?? 0;
  const productTotal = productStats?.totalRevenue ?? 0;
  const formationAvailable = revenue?.available ?? 0;
  const formationPending = revenue?.pending ?? 0;
  const formationWithdrawn = revenue?.withdrawn ?? 0;
  // productPending: placeholder at 0 until a real API field is available
  const productPending = 0;
  const productAvailable = Math.max(0, productTotal - productPending);

  const displayTotalEarned = revenueView === "formations" ? formationTotal : revenueView === "products" ? productTotal : formationTotal + productTotal;
  const displayAvailable = revenueView === "formations" ? formationAvailable : revenueView === "products" ? productAvailable : formationAvailable + productAvailable;
  const displayPending = revenueView === "formations" ? formationPending : revenueView === "products" ? productPending : formationPending + productPending;
  const displayWithdrawn = revenueView === "formations" ? formationWithdrawn : revenueView === "products" ? 0 : formationWithdrawn;

  // ── Merge monthly chart data ──────────────────────────────────────────
  const mergedMonthlyData = (() => {
    const formMonths = revenue?.monthlyRevenue ?? [];
    const prodMonths = productStats?.revenueByMonth ?? [];
    // Build a map of all months
    const monthMap = new Map<string, { month: string; formationNet: number; productNet: number; gross: number }>();
    formMonths.forEach((m) => {
      monthMap.set(m.month, { month: m.month, formationNet: m.net, productNet: 0, gross: m.gross });
    });
    prodMonths.forEach((m) => {
      const existing = monthMap.get(m.month);
      if (existing) {
        existing.productNet = m.revenue;
      } else {
        monthMap.set(m.month, { month: m.month, formationNet: 0, productNet: m.revenue, gross: 0 });
      }
    });
    return Array.from(monthMap.values());
  })();

  // ── Merge transactions ────────────────────────────────────────────────
  const mergedTransactions = (() => {
    const formTx = (revenue?.transactions ?? []).map((tx) => ({
      ...tx,
      source: "formation" as const,
    }));
    const prodTx = (productStats?.recentPurchases ?? []).map((p, idx) => ({
      id: `prod-tx-${idx}`,
      type: "SALE" as const,
      amount: p.amount,
      status: "COMPLETED",
      createdAt: p.date,
      description: p.productTitle,
      source: "product" as const,
    }));
    let combined = [...formTx, ...prodTx];
    if (revenueView === "formations") combined = formTx;
    if (revenueView === "products") combined = prodTx;
    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  const requestWithdrawal = async () => {
    setWithdrawError("");
    const amount = parseFloat(withdrawForm.amount);
    if (isNaN(amount) || amount < 20) {
      setWithdrawError(fr ? "Montant minimum : 20€" : "Minimum amount: €20");
      return;
    }
    if (amount > (revenue?.available ?? 0)) {
      setWithdrawError(fr ? "Solde insuffisant" : "Insufficient balance");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/instructeur/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: withdrawForm.method, details: withdrawForm.details }),
      });
      if (res.ok) {
        setWithdrawSuccess(true);
        setTimeout(() => { setShowWithdrawModal(false); setWithdrawSuccess(false); }, 2000);
      } else {
        const d = await res.json();
        setWithdrawError(d.error ?? (fr ? "Erreur" : "Error"));
      }
    } catch { setWithdrawError(fr ? "Erreur réseau" : "Network error"); }
    finally { setWithdrawing(false); }
  };

  const downloadTransactionsCSV = () => {
    const rows = mergedTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      date: tx.createdAt,
      description: tx.description,
      source: tx.source,
    }));

    const headers = ["id", "type", "amount", "status", "date", "description", "source"];
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const value = String(row[h as keyof typeof row] ?? "");
            // Escape double-quotes and wrap in quotes if the value contains commas or quotes
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
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusLabel = (s: string) => ({
    PENDING: fr ? "En attente" : "Pending",
    PROCESSING: fr ? "En cours" : "Processing",
    COMPLETED: fr ? "Complété" : "Completed",
    FAILED: fr ? "Échoué" : "Failed",
  }[s] ?? s);

  const statusColor = (s: string) => ({
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  }[s] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600");

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (revenueError || productStatsError) {
    const errorMsg = (revenueError as Error)?.message || (productStatsError as Error)?.message || (fr ? "Erreur lors du chargement" : "Loading error");
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-slate-500 mb-4">{errorMsg}</p>
          <button onClick={() => { refetchRevenue(); refetchProducts(); }} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{fr ? "Revenus & Finances" : "Revenue & Finances"}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {fr ? "Gérez vos revenus et demandez des retraits" : "Manage your revenue and request withdrawals"}
          </p>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={!revenue?.available || revenue.available < 20}
          className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          <ArrowDownCircle className="w-4 h-4" />
          {fr ? "Demander un retrait" : "Request withdrawal"}
        </button>
      </div>

      {/* Revenue view tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 w-fit">
        {([
          { key: "all" as RevenueView, label: fr ? "Tout" : "All" },
          { key: "formations" as RevenueView, label: "Formations" },
          { key: "products" as RevenueView, label: fr ? "Produits" : "Products" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRevenueView(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              revenueView === tab.key
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label={fr ? "Total gagné" : "Total earned"}
          value={`${displayTotalEarned.toLocaleString("fr-FR")}€`}
          color="text-green-600"
          bg="bg-green-50"
          sparkData={(mergedMonthlyData ?? []).map((m) => ({ value: m.formationNet + m.productNet }))}
        />
        <StatCard
          icon={DollarSign}
          label={fr ? "Disponible" : "Available"}
          value={`${displayAvailable.toLocaleString("fr-FR")}€`}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={Clock}
          label={fr ? "En attente" : "Pending"}
          value={`${displayPending.toLocaleString("fr-FR")}€`}
          color="text-yellow-600"
          bg="bg-yellow-50"
        />
        <StatCard
          icon={ArrowDownCircle}
          label={fr ? "Retiré" : "Withdrawn"}
          value={`${displayWithdrawn.toLocaleString("fr-FR")}€`}
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>

      {/* Commission info */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 mb-6 text-sm text-blue-700 dark:text-blue-300">
        <strong>{fr ? "Commission :" : "Commission:"}</strong>{" "}
        {revenueView === "products" ? (
          fr
            ? "Produits numériques : FreelanceHigh prélève 8% de chaque vente. Vous recevez 92% net."
            : "Digital products: FreelanceHigh takes 8% of each sale. You receive 92% net."
        ) : revenueView === "formations" ? (
          fr
            ? "Formations : FreelanceHigh prélève 30% de chaque vente. Vous recevez 70% net."
            : "Courses: FreelanceHigh takes 30% of each sale. You receive 70% net."
        ) : (
          fr
            ? "Formations : 30% plateforme / 70% instructeur. Produits numériques : 8% plateforme / 92% instructeur."
            : "Courses: 30% platform / 70% instructor. Digital products: 8% platform / 92% instructor."
        )}
      </div>

      {/* Revenue chart */}
      {mergedMonthlyData.length > 0 && (
        <ChartContainer
          title={fr ? "Revenus mensuels" : "Monthly revenue"}
          exportData={mergedMonthlyData as unknown as Record<string, unknown>[]}
          exportFilename="revenus-mensuels"
        >
          <ResponsiveContainer width="100%" height={260}>
            {revenueView === "all" ? (
              <BarChart data={mergedMonthlyData} barGap={2}>
                <defs>
                  <linearGradient id="revGradForm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C2BD9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6C2BD9" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="revGradProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(v: number, name: string) => [`${v.toLocaleString("fr-FR")}€`, name === "formationNet" ? (fr ? "Formations (70%)" : "Courses (70%)") : (fr ? "Produits (92%)" : "Products (92%)")]}
                />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="formationNet" stackId="revenue" fill="url(#revGradForm)" name={fr ? "Formations" : "Courses"} radius={[0, 0, 0, 0]} />
                <Bar dataKey="productNet" stackId="revenue" fill="url(#revGradProd)" name={fr ? "Produits" : "Products"} radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : revenueView === "formations" ? (
              <BarChart data={revenue?.monthlyRevenue ?? []} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  formatter={(v: number, name: string) => [`${v.toLocaleString("fr-FR")}€`, name === "gross" ? (fr ? "Brut" : "Gross") : (fr ? "Net (70%)" : "Net (70%)")]}
                />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="gross" fill="#e5e7eb" name={fr ? "Brut" : "Gross"} radius={[6, 6, 0, 0]} />
                <Bar dataKey="net" fill="#6C2BD9" name={fr ? "Net (70%)" : "Net (70%)"} radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={productStats?.revenueByMonth ?? []}>
                <defs>
                  <linearGradient id="revGradProdOnly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  formatter={(v: number) => [`${v.toLocaleString("fr-FR")}€`, fr ? "Net (92%)" : "Net (92%)"]}
                />
                <Bar dataKey="revenue" fill="url(#revGradProdOnly)" name={fr ? "Net (92%)" : "Net (92%)"} radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Transactions */}
      <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark mb-6">
        <div className="p-5 border-b dark:border-border-dark flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100">{fr ? "Transactions récentes" : "Recent transactions"}</h2>
          <button
            onClick={downloadTransactionsCSV}
            disabled={mergedTransactions.length === 0}
            className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {fr ? "Télécharger CSV" : "Download CSV"}
          </button>
        </div>
        <div className="divide-y">
          {mergedTransactions.slice(0, 20).map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 p-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                tx.type === "SALE" ? "bg-green-100" : "bg-purple-100"
              }`}>
                {tx.type === "SALE" ? <DollarSign className="w-4 h-4 text-green-600" /> : <ArrowDownCircle className="w-4 h-4 text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white dark:text-slate-100 truncate">{tx.description}</p>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    tx.source === "product"
                      ? "bg-sky-50 text-sky-600"
                      : "bg-violet-50 text-violet-600"
                  }`}>
                    {tx.source === "product" ? <Package className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
                    {tx.source === "product" ? (fr ? "Produit" : "Product") : "Formation"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(tx.createdAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-bold text-sm ${tx.type === "WITHDRAWAL" ? "text-red-600" : "text-green-600"}`}>
                  {tx.type === "WITHDRAWAL" ? "-" : "+"}{tx.amount.toFixed(2)}€
                </p>
              </div>
            </div>
          ))}
          {mergedTransactions.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">
              {fr ? "Aucune transaction" : "No transactions yet"}
            </p>
          )}
        </div>
      </div>

      {/* Withdrawal history */}
      {revenue?.withdrawals && revenue.withdrawals.length > 0 && (
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark">
          <div className="p-5 border-b dark:border-border-dark">
            <h2 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100">{fr ? "Historique des retraits" : "Withdrawal history"}</h2>
          </div>
          <div className="divide-y">
            {revenue.withdrawals.map((w) => (
              <div key={w.id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white dark:text-slate-100">{w.method}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(w.requestedAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(w.status)}`}>
                  {statusLabel(w.status)}
                </span>
                <span className="font-bold text-slate-900 dark:text-white dark:text-slate-100">{w.amount.toFixed(2)}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-4">
              {fr ? "Demander un retrait" : "Request withdrawal"}
            </h2>

            {withdrawSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-slate-900 dark:text-white dark:text-slate-100">{fr ? "Demande envoyée !" : "Request sent!"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {fr ? "Montant (min. 20€)" : "Amount (min. €20)"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="20"
                      max={revenue?.available ?? 0}
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-slate-300 dark:border-border-dark dark:bg-neutral-dark dark:text-slate-100 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {fr ? `Disponible : ${(revenue?.available ?? 0).toFixed(2)}€` : `Available: €${(revenue?.available ?? 0).toFixed(2)}`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {fr ? "Méthode de retrait" : "Withdrawal method"}
                  </label>
                  <select
                    value={withdrawForm.method}
                    onChange={(e) => setWithdrawForm((p) => ({ ...p, method: e.target.value }))}
                    className="w-full border border-slate-300 dark:border-border-dark dark:bg-neutral-dark dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {WITHDRAW_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {fr ? "Coordonnées bancaires / Numéro" : "Bank details / Number"}
                  </label>
                  <input
                    type="text"
                    value={withdrawForm.details}
                    onChange={(e) => setWithdrawForm((p) => ({ ...p, details: e.target.value }))}
                    placeholder={fr ? "IBAN, email PayPal, numéro..." : "IBAN, PayPal email, number..."}
                    className="w-full border border-slate-300 dark:border-border-dark dark:bg-neutral-dark dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {withdrawError && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {withdrawError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowWithdrawModal(false)} className="flex-1 border border-slate-300 dark:border-border-dark text-slate-700 dark:text-slate-300 font-medium py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-white/5 transition-colors text-sm">
                    {fr ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    onClick={requestWithdrawal}
                    disabled={withdrawing}
                    className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                  >
                    {withdrawing ? "..." : (fr ? "Confirmer" : "Confirm")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
