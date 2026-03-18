"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MousePointerClick, TrendingUp, DollarSign, BarChart3,
  Copy, Check, ExternalLink, ArrowUpRight, Loader2,
  Wallet, ChevronRight, Clock, AlertCircle, Star,
  ArrowLeft,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
  conversionRate: string;
  affiliateCode: string;
  affiliateLink: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  commissionPercent: number;
  cookieDays: number;
  minPayoutAmount: number;
  canRequestPayout: boolean;
  recentCommissions: {
    id: string;
    productName: string;
    productType: string;
    orderAmount: number;
    commissionAmount: number;
    status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
    date: string;
  }[];
  topProducts: {
    id: string;
    name: string;
    type: string;
    clicks: number;
    conversions: number;
    earned: number;
    conversionRate: string;
  }[];
  earningsByMonth: {
    month: string;
    earned: number;
    conversions: number;
  }[];
  payoutHistory: {
    id: string;
    amount: number;
    method: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    requestedAt: string;
    paidAt: string | null;
  }[];
}

const PERIODS = [
  { value: "7d", label: "7j" },
  { value: "30d", label: "30j" },
  { value: "90d", label: "3 mois" },
  { value: "6m", label: "6 mois" },
  { value: "1y", label: "1 an" },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AffiliateDashboardPage() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // ── Load stats ───────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/marketing/affiliate/stats?period=${period}`);
      const data = await res.json();
      if (data.totalClicks !== undefined) {
        setStats(data);
      }
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Copy helpers ─────────────────────────────────────────────────────────

  function copyLink() {
    if (stats?.affiliateLink) {
      navigator.clipboard.writeText(stats.affiliateLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  function copyCode() {
    if (stats?.affiliateCode) {
      navigator.clipboard.writeText(stats.affiliateCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  // ── Payout request ──────────────────────────────────────────────────────

  async function requestPayout() {
    setRequestingPayout(true);
    setPayoutError(null);
    try {
      const res = await fetch("/api/marketing/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: stats?.pendingEarnings }),
      });
      if (res.ok) {
        setPayoutSuccess(true);
        setTimeout(() => setPayoutSuccess(false), 4000);
        // Refresh stats after payout request
        fetchStats();
      } else {
        const data = await res.json().catch(() => ({}));
        setPayoutError(data.error || "La demande de retrait a échoué. Veuillez réessayer.");
        setTimeout(() => setPayoutError(null), 6000);
      }
    } catch {
      setPayoutError("Erreur de connexion. Veuillez vérifier votre connexion et réessayer.");
      setTimeout(() => setPayoutError(null), 6000);
    } finally {
      setRequestingPayout(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">Tableau de bord affilie</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Rejoignez un programme d&apos;affiliation pour commencer a gagner des commissions en promouvant des formations et produits.
        </p>
        <Link
          href="/formations/explorer"
          className="inline-block mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Explorer les formations
        </Link>
      </div>
    );
  }

  const maxMonthEarned = Math.max(...stats.earningsByMonth.map((m) => m.earned), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/formations/instructeur/marketing/affilies"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary mb-1 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Retour au programme
          </Link>
          <h1 className="text-2xl font-bold">Tableau de bord affilie</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Suivez vos performances et vos gains
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                period === p.value ? "bg-white dark:bg-slate-900 dark:bg-slate-700 shadow-sm" : "hover:bg-white/50 dark:hover:bg-slate-700/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status banner */}
      {stats.status !== "ACTIVE" && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
          stats.status === "PENDING"
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {stats.status === "PENDING"
            ? "Votre demande d'affiliation est en cours d'examen. Vous serez notifie une fois approuve."
            : "Votre compte affilie est suspendu. Contactez le support pour plus d'informations."}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<MousePointerClick className="w-5 h-5" />}
          label="Clics totaux"
          value={stats.totalClicks.toLocaleString()}
          sub="Total des visites via votre lien"
          color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Conversions"
          value={stats.totalConversions.toString()}
          sub={`Taux: ${stats.conversionRate}%`}
          color="text-green-600 bg-green-50 dark:bg-green-900/20"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total gagne"
          value={`${stats.totalEarned.toFixed(0)}€`}
          sub={`Commission: ${stats.commissionPercent}%`}
          color="text-violet-600 bg-violet-50 dark:bg-violet-900/20"
        />
        <KpiCard
          icon={<Wallet className="w-5 h-5" />}
          label="En attente"
          value={`${stats.pendingEarnings.toFixed(0)}€`}
          sub={stats.canRequestPayout ? "Eligible au retrait" : `Min. ${stats.minPayoutAmount}€`}
          color="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      {/* Affiliate Link + Code */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-primary" />
          Votre lien d&apos;affiliation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Link */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Lien complet</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={stats.affiliateLink}
                className="flex-1 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Copie !" : "Copier"}
              </button>
            </div>
          </div>
          {/* Code */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Code affilie</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono font-bold text-primary">
                {stats.affiliateCode}
              </div>
              <button
                onClick={copyCode}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copie !" : "Copier"}
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Cookie de suivi valide {stats.cookieDays} jours — Commission de {stats.commissionPercent}% par vente
        </p>
      </div>

      {/* Earnings Chart + Payout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly earnings chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Gains mensuels
          </h3>
          <div className="flex items-end gap-3 h-48">
            {stats.earningsByMonth.map((m) => {
              const heightPercent = maxMonthEarned > 0 ? (m.earned / maxMonthEarned) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {m.earned > 0 ? `${m.earned}€` : ""}
                  </span>
                  <div
                    className="w-full bg-primary/20 rounded-t-lg relative group cursor-default"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                      style={{ height: "100%" }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      <p className="font-bold">{m.earned}€</p>
                      <p>{m.conversions} conv.</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payout card */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-600" />
            Retrait
          </h3>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <p className="text-3xl font-bold text-green-600">{stats.pendingEarnings.toFixed(0)}€</p>
            <p className="text-xs text-slate-400 mt-1">Disponible pour retrait</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Min. {stats.minPayoutAmount}€</p>
          </div>

          {payoutError && (
            <div className="mb-2 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium px-3 py-2.5 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {payoutError}
            </div>
          )}

          {payoutSuccess ? (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold text-center py-2.5 rounded-xl">
              Demande de retrait envoyee !
            </div>
          ) : (
            <button
              onClick={requestPayout}
              disabled={!stats.canRequestPayout || requestingPayout}
              className="mt-3 w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {requestingPayout ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
              Demander un retrait
            </button>
          )}

          {/* Payout history */}
          {stats.payoutHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 mb-2">Historique</p>
              <div className="space-y-1.5">
                {stats.payoutHistory.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{new Date(p.requestedAt).toLocaleDateString("fr-FR")}</span>
                    <span className="font-semibold">{p.amount}€</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      p.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      p.status === "PROCESSING" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      p.status === "FAILED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {p.status === "COMPLETED" ? "Versé" : p.status === "PROCESSING" ? "En cours" : p.status === "FAILED" ? "Échoué" : "En attente"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Commissions Table */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          Commissions recentes
        </h3>

        {stats.recentCommissions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            Aucune commission pour le moment. Partagez votre lien pour commencer a gagner !
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Produit</th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Type</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Vente</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Commission</th>
                  <th className="text-center py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Statut</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCommissions.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-2">
                      <p className="font-semibold text-sm truncate max-w-[200px]">{c.productName}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        c.productType === "formation"
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {c.productType === "formation" ? "Formation" : "Produit"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-medium">{c.orderAmount.toFixed(0)}€</td>
                    <td className="py-3 px-2 text-right font-bold text-green-600">+{c.commissionAmount.toFixed(2)}€</td>
                    <td className="py-3 px-2 text-center">
                      <CommissionStatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-2 text-right text-xs text-slate-400">
                      {new Date(c.date).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Produits les plus performants
        </h3>

        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            Pas encore de donnees de performance
          </p>
        ) : (
          <div className="space-y-3">
            {stats.topProducts.map((prod, idx) => {
              const maxEarned = Math.max(...stats.topProducts.map((p) => p.earned), 1);
              const barWidth = (prod.earned / maxEarned) * 100;

              return (
                <div key={prod.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                      <p className="text-sm font-semibold truncate max-w-[300px]">{prod.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        prod.type === "formation"
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {prod.type === "formation" ? "Formation" : "Produit"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{prod.clicks} clics</span>
                      <span>{prod.conversions} conv.</span>
                      <span className="font-bold text-green-600">{prod.earned.toFixed(0)}€</span>
                      <span className="flex items-center gap-0.5 text-primary font-semibold">
                        <ChevronRight className="w-3 h-3" />
                        {prod.conversionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function CommissionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const labels: Record<string, string> = {
    PENDING: "En attente",
    APPROVED: "Approuvée",
    PAID: "Versée",
    REJECTED: "Refusée",
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
}
