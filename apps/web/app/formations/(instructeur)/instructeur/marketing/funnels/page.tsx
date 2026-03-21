"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInstructorFunnels, useInstructorFunnelAnalytics, instructorKeys } from "@/lib/formations/hooks";
import Link from "next/link";
import {
  Filter, Plus, Loader2, Eye, MousePointerClick, ShoppingCart,
  DollarSign, Trash2, Power, PowerOff, ChevronRight,
  ExternalLink, Copy, CheckCircle, BarChart2, Files, X,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import SharedStatCard from "@/components/formations/StatCard";
import SharedEmptyState from "@/components/formations/EmptyState";

// -- Types ------------------------------------------------------------------

interface FunnelStep {
  id: string;
  type: string;
  title: string;
  order: number;
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  description: string;
  steps: FunnelStep[];
  isActive: boolean;
  totalViews: number;
  totalClicks: number;
  totalPurchases: number;
  totalSkips: number;
  totalRevenue: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalFunnels: number;
  activeFunnels: number;
  totalViews: number;
  totalConversions: number;
  totalRevenue: number;
}

// -- Step type config --------------------------------------------------------

const STEP_TYPE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  LANDING: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600", bar: "bg-blue-500" },
  PRODUCT: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600", bar: "bg-purple-500" },
  CHECKOUT: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600", bar: "bg-amber-500" },
  UPSELL: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600", bar: "bg-green-500" },
  DOWNSELL: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600", bar: "bg-orange-500" },
  CONFIRMATION: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-600", bar: "bg-cyan-500" },
  THANK_YOU: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600", bar: "bg-emerald-500" },
};

const STEP_TYPE_LABELS: Record<string, string> = {
  LANDING: "Landing",
  PRODUCT: "Produit",
  CHECKOUT: "Checkout",
  UPSELL: "Upsell",
  DOWNSELL: "Downsell",
  CONFIRMATION: "Confirmation",
  THANK_YOU: "Merci",
};

// -- Component ---------------------------------------------------------------

export default function FunnelsListPage() {
  const queryClient = useQueryClient();
  const { data: queryData, isLoading: loading, error: queryError, refetch } = useInstructorFunnels();
  const funnels: Funnel[] = (queryData as { funnels?: Funnel[] })?.funnels ?? [];
  const stats: Stats = (queryData as { stats?: Stats })?.stats ?? {
    totalFunnels: 0,
    activeFunnels: 0,
    totalViews: 0,
    totalConversions: 0,
    totalRevenue: 0,
  };

  // Local state for optimistic delete (handled locally in handleDelete)
  const [localFunnels, setLocalFunnels] = useState<Funnel[] | null>(null);
  const [localStats, setLocalStats] = useState<Stats | null>(null);
  const displayFunnels = localFunnels ?? funnels;
  const displayStats = localStats ?? stats;

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [analyticsFunnelId, setAnalyticsFunnelId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // -- Toggle active --

  const handleToggle = async (funnel: Funnel) => {
    setTogglingId(funnel.id);
    try {
      const res = await fetch("/api/marketing/funnels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: funnel.id, isActive: !funnel.isActive }),
      });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: instructorKeys.funnels() });
        setLocalFunnels(null);
        setLocalStats(null);
      } else {
        alert("Erreur lors du changement de statut");
      }
    } catch {
      alert("Erreur lors du changement de statut");
    } finally {
      setTogglingId(null);
    }
  };

  // -- Delete funnel --

  const handleDelete = async (funnel: Funnel) => {
    if (!confirm(`Supprimer le funnel "${funnel.name}" ? Cette action est irréversible.`)) return;

    setDeletingId(funnel.id);
    try {
      const res = await fetch(`/api/marketing/funnels?id=${funnel.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");

      // Only update local state after successful API call
      const baseFunnels = localFunnels ?? funnels;
      const baseStats = localStats ?? stats;
      setLocalFunnels(baseFunnels.filter((f) => f.id !== funnel.id));
      setLocalStats({
        ...baseStats,
        totalFunnels: baseStats.totalFunnels - 1,
        activeFunnels: funnel.isActive ? baseStats.activeFunnels - 1 : baseStats.activeFunnels,
        totalViews: baseStats.totalViews - funnel.totalViews,
        totalConversions: baseStats.totalConversions - funnel.totalPurchases,
        totalRevenue: baseStats.totalRevenue - funnel.totalRevenue,
      });
    } catch {
      // API call failed — do not remove from local state
      alert("Erreur lors de la suppression du funnel");
    } finally {
      setDeletingId(null);
    }
  };

  // -- Copy link --

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/formations/f/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  // -- Duplicate funnel --

  const duplicateFunnel = async (id: string) => {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/marketing/funnels/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: instructorKeys.funnels() });
      } else {
        alert("Erreur lors de la duplication");
      }
    } catch {
      alert("Erreur lors de la duplication");
    } finally {
      setDuplicatingId(null);
    }
  };

  // -- Filtered funnels --

  const filteredFunnels = displayFunnels.filter((f) => {
    if (filterStatus === "active") return f.isActive;
    if (filterStatus === "inactive") return !f.isActive;
    return true;
  });

  // -- Loading --

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <Filter className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-slate-500 mb-4">{queryError.message || "Erreur lors du chargement"}</p>
          <button onClick={() => refetch()} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/formations/instructeur/marketing"
              className="text-sm text-slate-500 hover:text-primary transition-colors"
            >
              Marketing
            </Link>
            <span className="text-slate-300">/</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100 flex items-center gap-2">
            <Filter className="w-6 h-6 text-primary" />
            Tunnels de vente
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Créez des parcours de conversion optimisés pour maximiser vos ventes
          </p>
        </div>
        <Link
          href="/formations/instructeur/marketing/funnels/creer"
          className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau funnel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <SharedStatCard
          icon={Filter}
          color="text-primary"
          bg="bg-primary/10"
          label="Total funnels"
          value={displayStats.totalFunnels}
        />
        <SharedStatCard
          icon={Power}
          color="text-green-600"
          bg="bg-green-50 dark:bg-green-900/20"
          label="Actifs"
          value={displayStats.activeFunnels}
        />
        <SharedStatCard
          icon={Eye}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/20"
          label="Vues totales"
          value={formatNumber(displayStats.totalViews)}
        />
        <SharedStatCard
          icon={ShoppingCart}
          color="text-purple-600"
          bg="bg-purple-50 dark:bg-purple-900/20"
          label="Conversions"
          value={displayStats.totalConversions}
        />
        <SharedStatCard
          icon={DollarSign}
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          label="Revenus"
          value={`${displayStats.totalRevenue.toFixed(0)}€`}
        />
      </div>

      {/* Filter tabs */}
      {displayFunnels.length > 0 && (
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6 w-fit">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === status
                  ? "bg-white dark:bg-slate-900 dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {status === "all" ? "Tous" : status === "active" ? "Actifs" : "Inactifs"}
              {status === "all" && ` (${displayFunnels.length})`}
              {status === "active" && ` (${displayFunnels.filter((f) => f.isActive).length})`}
              {status === "inactive" && ` (${displayFunnels.filter((f) => !f.isActive).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Funnel list */}
      {filteredFunnels.length > 0 ? (
        <div className="space-y-4">
          {filteredFunnels.map((funnel) => (
            <FunnelCard
              key={funnel.id}
              funnel={funnel}
              onToggle={() => handleToggle(funnel)}
              onDelete={() => handleDelete(funnel)}
              onCopyLink={() => handleCopyLink(funnel.slug)}
              onAnalytics={() => setAnalyticsFunnelId(funnel.id)}
              onDuplicate={() => duplicateFunnel(funnel.id)}
              isToggling={togglingId === funnel.id}
              isDeleting={deletingId === funnel.id}
              isCopied={copiedSlug === funnel.slug}
              isDuplicating={duplicatingId === funnel.id}
            />
          ))}
        </div>
      ) : filterStatus !== "all" ? (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <SharedEmptyState
            icon={<Filter className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
            title="Aucun funnel avec ce filtre"
            description="Essayez de changer le filtre ou affichez tous les funnels."
            ctaLabel="Afficher tous les funnels"
            onCtaClick={() => setFilterStatus("all")}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <SharedEmptyState
            icon={<Filter className="w-16 h-16 text-slate-300 dark:text-slate-600" />}
            title="Aucun tunnel de vente"
            description="Créez votre premier tunnel de vente pour guider vos visiteurs vers l'achat avec des upsells, downsells et des pages de confirmation optimisées."
            ctaLabel="Créer un funnel"
            ctaHref="/formations/instructeur/marketing/funnels/creer"
          />
        </div>
      )}

      {/* Analytics Drawer */}
      {analyticsFunnelId && (
        <FunnelAnalyticsPanel
          funnelId={analyticsFunnelId}
          funnelName={displayFunnels.find((f) => f.id === analyticsFunnelId)?.name ?? "Funnel"}
          onClose={() => setAnalyticsFunnelId(null)}
        />
      )}
    </div>
  );
}

// -- FunnelAnalyticsPanel component -------------------------------------------

function FunnelAnalyticsPanel({
  funnelId,
  funnelName,
  onClose,
}: {
  funnelId: string;
  funnelName: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useInstructorFunnelAnalytics(funnelId);
  const analytics = data as {
    summary?: {
      totalViews: number;
      totalClicks: number;
      totalPurchases: number;
      totalSkips: number;
      totalRevenue: number;
      conversionRate: number;
    };
    stepAnalytics?: {
      stepIndex: number;
      stepType: string;
      stepTitle: string;
      views: number;
      clicks: number;
      purchases: number;
      skips: number;
      dropOffRate: number;
      conversionRate: number;
    }[];
    recentEvents?: {
      id: string;
      type: string;
      stepIndex: number;
      stepType: string;
      visitorId: string;
      createdAt: string;
      revenue?: number;
    }[];
  } | undefined;

  const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    VIEW: { label: "Vue", color: "text-blue-600" },
    CLICK: { label: "Clic", color: "text-amber-600" },
    PURCHASE: { label: "Achat", color: "text-green-600" },
    SKIP: { label: "Skip", color: "text-slate-500" },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto border-l border-slate-200 dark:border-slate-700 animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 truncate">
              {funnelName}
            </h2>
            <p className="text-xs text-slate-500">Analytiques du funnel</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : analytics?.summary ? (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-semibold">Vues</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
                    {formatNumber(analytics.summary.totalViews)}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-xs font-semibold">Conversions</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
                    {analytics.summary.totalPurchases}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-semibold">Revenus</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
                    {analytics.summary.totalRevenue.toFixed(0)}€
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <BarChart2 className="w-4 h-4" />
                    <span className="text-xs font-semibold">Taux conversion</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
                    {analytics.summary.conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Step-by-step bar chart */}
              {analytics.stepAnalytics && analytics.stepAnalytics.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-3">
                    Performance par étape
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={analytics.stepAnalytics.map((s) => ({
                          name: STEP_TYPE_LABELS[s.stepType] || s.stepTitle || `Étape ${s.stepIndex + 1}`,
                          Vues: s.views,
                          Clics: s.clicks,
                          Achats: s.purchases,
                        }))}
                        margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="Vues" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Clics" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Achats" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Step funnel breakdown */}
                  <div className="mt-4 space-y-2">
                    {analytics.stepAnalytics.map((step) => {
                      const maxViews = Math.max(
                        ...analytics.stepAnalytics!.map((s) => s.views),
                        1
                      );
                      const barWidth = (step.views / maxViews) * 100;
                      const colors = STEP_TYPE_COLORS[step.stepType] || STEP_TYPE_COLORS.LANDING;
                      return (
                        <div key={step.stepIndex} className="flex items-center gap-3">
                          <span
                            className={`text-[10px] font-bold w-20 truncate ${colors.text}`}
                          >
                            {STEP_TYPE_LABELS[step.stepType] || step.stepTitle}
                          </span>
                          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                              style={{ width: `${barWidth}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200">
                              {formatNumber(step.views)} vues &middot;{" "}
                              {step.conversionRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent events */}
              {analytics.recentEvents && analytics.recentEvents.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-3">
                    Événements récents
                  </h3>
                  <div className="space-y-1.5">
                    {analytics.recentEvents.slice(0, 10).map((event) => {
                      const typeInfo = EVENT_TYPE_LABELS[event.type] || {
                        label: event.type,
                        color: "text-slate-500",
                      };
                      return (
                        <div
                          key={event.id}
                          className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-xs font-bold ${typeInfo.color} w-12 shrink-0`}
                            >
                              {typeInfo.label}
                            </span>
                            <span className="text-xs text-slate-500 truncate">
                              {STEP_TYPE_LABELS[event.stepType] || `Étape ${event.stepIndex + 1}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {event.revenue != null && event.revenue > 0 && (
                              <span className="text-xs font-bold text-green-600">
                                +{event.revenue.toFixed(0)}€
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {new Date(event.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Aucune donnée analytique disponible</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// -- FunnelCard component ----------------------------------------------------

function FunnelCard({
  funnel,
  onToggle,
  onDelete,
  onCopyLink,
  onAnalytics,
  onDuplicate,
  isToggling,
  isDeleting,
  isCopied,
  isDuplicating,
}: {
  funnel: Funnel;
  onToggle: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onAnalytics: () => void;
  onDuplicate: () => void;
  isToggling: boolean;
  isDeleting: boolean;
  isCopied: boolean;
  isDuplicating: boolean;
}) {
  const conversionRate =
    funnel.totalViews > 0
      ? ((funnel.totalPurchases / funnel.totalViews) * 100).toFixed(1)
      : "0.0";

  return (
    <div
      className={`bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border transition-all ${
        funnel.isActive
          ? "border-green-200 dark:border-green-800/50"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      {/* Top section */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white dark:text-slate-100 truncate">
                {funnel.name}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  funnel.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {funnel.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            {funnel.description && (
              <p className="text-sm text-slate-500 line-clamp-1">{funnel.description}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {funnel.steps.length} étape{funnel.steps.length > 1 ? "s" : ""} &middot;
              Créé le{" "}
              {new Date(funnel.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onCopyLink}
              title="Copier le lien du funnel"
              className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
            >
              {isCopied ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onAnalytics}
              title="Analytiques"
              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-slate-400 hover:text-blue-600"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDuplicate}
              disabled={isDuplicating}
              title="Dupliquer"
              className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
            >
              {isDuplicating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Files className="w-4 h-4" />
              )}
            </button>
            {funnel.isActive && (
              <Link
                href={`/formations/f/${funnel.slug}`}
                target="_blank"
                title="Voir le funnel"
                className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={onToggle}
              disabled={isToggling}
              title={funnel.isActive ? "Désactiver" : "Activer"}
              className={`p-2 rounded-lg transition-colors ${
                funnel.isActive
                  ? "hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 hover:text-amber-600"
                  : "hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500 hover:text-green-600"
              }`}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : funnel.isActive ? (
                <PowerOff className="w-4 h-4" />
              ) : (
                <Power className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              title="Supprimer"
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-slate-400 hover:text-red-500"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <MiniStat icon={<Eye className="w-3.5 h-3.5" />} label="Vues" value={formatNumber(funnel.totalViews)} />
          <MiniStat icon={<MousePointerClick className="w-3.5 h-3.5" />} label="Clics" value={formatNumber(funnel.totalClicks)} />
          <MiniStat icon={<ShoppingCart className="w-3.5 h-3.5" />} label="Achats" value={funnel.totalPurchases} />
          <MiniStat icon={<DollarSign className="w-3.5 h-3.5" />} label="Revenus" value={`${funnel.totalRevenue.toFixed(0)}€`} />
        </div>

        {/* Conversion rate bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Taux de conversion global</span>
            <span className="text-sm font-bold text-primary">{conversionRate}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }}
            />
          </div>
        </div>

        {/* Mini funnel diagram */}
        <MiniFunnelDiagram steps={funnel.steps} totalViews={funnel.totalViews} />
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Mis à jour le{" "}
          {new Date(funnel.updatedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <Link
          href={`/formations/instructeur/marketing/funnels/creer?edit=${funnel.id}`}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Modifier
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// -- MiniFunnelDiagram -------------------------------------------------------

function MiniFunnelDiagram({ steps, totalViews }: { steps: FunnelStep[]; totalViews: number }) {
  if (steps.length === 0) return null;

  // Calculate widths: first step is 100%, then each subsequent narrows
  const maxWidth = 100;
  const minWidth = 20;
  const decrement = steps.length > 1 ? (maxWidth - minWidth) / (steps.length - 1) : 0;

  return (
    <div className="flex items-end gap-1.5 h-16">
      {steps
        .sort((a, b) => a.order - b.order)
        .map((step, index) => {
          const colors = STEP_TYPE_COLORS[step.type] || STEP_TYPE_COLORS.LANDING;
          const widthPct = maxWidth - decrement * index;
          const heightPct = 30 + (70 * (steps.length - index)) / steps.length;

          return (
            <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md ${colors.bar} transition-all duration-300 relative group`}
                style={{ height: `${heightPct}%` }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                  <div className="bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap">
                    {STEP_TYPE_LABELS[step.type] || step.type}
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-semibold text-slate-400 truncate w-full text-center">
                {STEP_TYPE_LABELS[step.type] || step.type}
              </span>
            </div>
          );
        })}
    </div>
  );
}

// -- Sub-components ----------------------------------------------------------

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/50 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100">{value}</p>
    </div>
  );
}

// -- Helpers -----------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
