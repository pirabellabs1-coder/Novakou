"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";

// ============================================================
// Types
// ============================================================

type BoostTier = "standard" | "premium" | "ultime";

interface TierConfig {
  name: string;
  duration: number;
  price: number;
  estimatedViews: number;
}

interface BoostRecord {
  id: string;
  serviceId: string;
  userId: string;
  tier: BoostTier;
  price: number;
  startedAt: string;
  expiresAt: string;
  viewsGenerated: number;
  clicksGenerated: number;
  ordersGenerated: number;
}

interface BoostStats {
  totalSpent: number;
  totalViews: number;
  totalClicks: number;
  totalOrders: number;
}

interface BoostApiResponse {
  activeBoost: BoostRecord | null;
  history: BoostRecord[];
  stats: BoostStats;
  availableTiers: Record<BoostTier, TierConfig>;
}

// ============================================================
// Tier display data (for the cards — values aligned with API)
// ============================================================

const TIER_CARDS: {
  tier: BoostTier;
  name: string;
  price: number;
  duration: number;
  estimatedViews: string;
  recommended: boolean;
  icon: string;
  color: string;
  features: string[];
}[] = [
  {
    tier: "standard",
    name: "Standard",
    price: 9.99,
    duration: 3,
    estimatedViews: "~500 vues",
    recommended: false,
    icon: "bolt",
    color: "text-blue-400",
    features: [
      "Mise en avant dans le marketplace",
      "Badge \"Booste\" sur le service",
      "Statistiques de boost basiques",
    ],
  },
  {
    tier: "premium",
    name: "Premium",
    price: 24.99,
    duration: 7,
    estimatedViews: "~2 000 vues",
    recommended: true,
    icon: "rocket_launch",
    color: "text-primary",
    features: [
      "Position prioritaire dans les resultats",
      "Badge \"Booste\" premium dore",
      "Statistiques detaillees en temps reel",
      "Mise en avant sur la page d'accueil",
    ],
  },
  {
    tier: "ultime",
    name: "Ultime",
    price: 79.99,
    duration: 30,
    estimatedViews: "~10 000 vues",
    recommended: false,
    icon: "diamond",
    color: "text-amber-400",
    features: [
      "Visibilite maximale pendant 30 jours",
      "Placement en tete du marketplace",
      "Badge \"Ultime\" exclusif anime",
      "Recommandation IA prioritaire",
      "Statistiques avancees avec ROI",
    ],
  },
];

// ============================================================
// Helpers
// ============================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function daysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function tierLabel(tier: BoostTier): string {
  return tier === "standard"
    ? "Standard"
    : tier === "premium"
      ? "Premium"
      : "Ultime";
}

function tierBadgeClass(tier: BoostTier): string {
  return tier === "standard"
    ? "bg-blue-500/20 text-blue-400"
    : tier === "premium"
      ? "bg-primary/20 text-primary"
      : "bg-amber-500/20 text-amber-400";
}

// ============================================================
// Page Component
// ============================================================

export default function BoostPage() {
  const { services } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);

  // Only show active services for boosting
  const activeServices = useMemo(
    () => services.filter((s) => s.status === "actif"),
    [services]
  );

  // State
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedTier, setSelectedTier] = useState<BoostTier>("premium");
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [boostData, setBoostData] = useState<BoostApiResponse | null>(null);

  // Set default service when active services load
  useEffect(() => {
    if (activeServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(activeServices[0].id);
    }
  }, [activeServices, selectedServiceId]);

  // Fetch boost data when service changes
  const fetchBoostData = useCallback(async (serviceId: string) => {
    if (!serviceId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/services/${serviceId}/boost`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors du chargement");
      }
      const data: BoostApiResponse = await res.json();
      setBoostData(data);
    } catch (err) {
      console.error("[Boost] Fetch error:", err);
      // If the fetch fails (e.g., no session), set empty state
      setBoostData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      fetchBoostData(selectedServiceId);
    }
  }, [selectedServiceId, fetchBoostData]);

  // Activate boost
  const handleActivateBoost = async () => {
    if (!selectedServiceId || !selectedTier) return;
    if (boostData?.activeBoost) {
      addToast("warning", "Ce service a deja un boost actif. Attendez son expiration.");
      return;
    }

    setIsActivating(true);
    try {
      const res = await fetch(`/api/services/${selectedServiceId}/boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast("error", data.error || "Erreur lors de l'activation du boost");
        return;
      }

      addToast("success", data.message || "Boost active avec succes !");
      // Refresh boost data
      await fetchBoostData(selectedServiceId);
    } catch (err) {
      console.error("[Boost] Activate error:", err);
      addToast("error", "Erreur reseau. Veuillez reessayer.");
    } finally {
      setIsActivating(false);
    }
  };

  const selectedService = activeServices.find((s) => s.id === selectedServiceId);
  const activeBoost = boostData?.activeBoost ?? null;
  const history = boostData?.history ?? [];
  const stats = boostData?.stats ?? { totalSpent: 0, totalViews: 0, totalClicks: 0, totalOrders: 0 };

  // Calculate ROI
  const roi = stats.totalSpent > 0
    ? ((stats.totalOrders * (selectedService?.price ?? 0) - stats.totalSpent) / stats.totalSpent * 100)
    : 0;

  // Build chart data from history (group by day of week for performance view)
  const chartData = useMemo(() => {
    if (history.length === 0) {
      return [
        { day: "LUN", views: 0, clicks: 0 },
        { day: "MAR", views: 0, clicks: 0 },
        { day: "MER", views: 0, clicks: 0 },
        { day: "JEU", views: 0, clicks: 0 },
        { day: "VEN", views: 0, clicks: 0 },
        { day: "SAM", views: 0, clicks: 0 },
        { day: "DIM", views: 0, clicks: 0 },
      ];
    }
    // Distribute total stats across days proportionally
    const totalViews = stats.totalViews;
    const totalClicks = stats.totalClicks;
    const weights = [0.18, 0.16, 0.17, 0.12, 0.15, 0.12, 0.10];
    const days = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
    return days.map((day, i) => ({
      day,
      views: Math.round(totalViews * weights[i]),
      clicks: Math.round(totalClicks * weights[i]),
    }));
  }, [history.length, stats.totalViews, stats.totalClicks]);

  const maxChartValue = Math.max(1, ...chartData.map((d) => d.views));

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Boost de Services</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Boostez la visibilite de vos services et atteignez plus de clients potentiels.
          </p>
        </div>
        <Link
          href="/dashboard/services"
          className="text-sm text-slate-400 hover:text-primary flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Retour aux services
        </Link>
      </div>

      {/* No active services */}
      {activeServices.length === 0 && (
        <div className="bg-primary/5 rounded-2xl border border-primary/10 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-400 mb-4 block">
            rocket_launch
          </span>
          <h3 className="text-lg font-bold mb-2">Aucun service actif</h3>
          <p className="text-sm text-slate-400 mb-6">
            Vous devez avoir au moins un service actif pour pouvoir le booster.
          </p>
          <Link
            href="/dashboard/services/creer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Creer un service
          </Link>
        </div>
      )}

      {activeServices.length > 0 && (
        <div className="space-y-8">
          {/* Service Selector */}
          <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              Choisir un service a booster
            </h3>
            <select
              className="w-full bg-primary/10 border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.price} EUR)
                </option>
              ))}
            </select>
          </div>

          {/* Active Boost Banner */}
          {activeBoost && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      rocket_launch
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">Boost {tierLabel(activeBoost.tier)} actif</h3>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Active le {formatDate(activeBoost.startedAt)} — Expire le {formatDate(activeBoost.expiresAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xl font-black text-primary">{daysRemaining(activeBoost.expiresAt)}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Jours restants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black">{activeBoost.viewsGenerated.toLocaleString("fr-FR")}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Vues</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black">{activeBoost.clicksGenerated.toLocaleString("fr-FR")}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Clics</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-emerald-400">{activeBoost.ordersGenerated}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Commandes</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading state for tier cards */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-400">Chargement des informations de boost...</span>
              </div>
            </div>
          )}

          {/* Tier Cards */}
          {!isLoading && !activeBoost && (
            <>
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_offer</span>
                  Choisir un plan de boost
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {TIER_CARDS.map((card) => (
                    <button
                      key={card.tier}
                      onClick={() => setSelectedTier(card.tier)}
                      className={cn(
                        "relative bg-primary/5 rounded-2xl border-2 p-6 text-left transition-all hover:scale-[1.02]",
                        selectedTier === card.tier
                          ? "border-primary shadow-lg shadow-primary/10"
                          : "border-primary/10 hover:border-primary/30"
                      )}
                    >
                      {/* Recommended badge */}
                      {card.recommended && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Recommande
                        </span>
                      )}

                      {/* Icon */}
                      <div className={cn("size-12 rounded-xl flex items-center justify-center mb-4", card.tier === "standard" ? "bg-blue-500/10" : card.tier === "premium" ? "bg-primary/10" : "bg-amber-500/10")}>
                        <span className={cn("material-symbols-outlined text-2xl", card.color)}>
                          {card.icon}
                        </span>
                      </div>

                      {/* Info */}
                      <h4 className="text-lg font-bold mb-1">{card.name}</h4>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-2xl font-black">{card.price} EUR</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">
                        {card.duration} jour{card.duration > 1 ? "s" : ""} — {card.estimatedViews} estimees
                      </p>

                      {/* Features */}
                      <ul className="space-y-2">
                        {card.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                            <span className="material-symbols-outlined text-primary text-sm mt-0.5 shrink-0">
                              check_circle
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* Selected indicator */}
                      {selectedTier === card.tier && (
                        <div className="absolute top-4 right-4 size-6 rounded-full bg-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-sm">check</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activate Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 rounded-2xl border border-primary/10 p-6">
                <div>
                  <p className="font-bold">
                    {selectedService?.title ?? "Service selectionne"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Boost {tierLabel(selectedTier)} — {TIER_CARDS.find((c) => c.tier === selectedTier)?.price} EUR pour{" "}
                    {TIER_CARDS.find((c) => c.tier === selectedTier)?.duration} jours
                  </p>
                </div>
                <button
                  onClick={handleActivateBoost}
                  disabled={!selectedServiceId || isActivating}
                  className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-colors disabled:opacity-40 shadow-lg shadow-primary/20"
                >
                  {isActivating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activation...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      Lancer le boost
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Stats & Chart Section */}
          {!isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Stats cards */}
              <div className="lg:col-span-1 space-y-4">
                {/* Stats Row */}
                {[
                  {
                    icon: "visibility",
                    label: "Vues totales",
                    value: stats.totalViews.toLocaleString("fr-FR"),
                    bg: "bg-blue-500/10",
                    iconColor: "text-blue-400",
                  },
                  {
                    icon: "ads_click",
                    label: "Clics totaux",
                    value: stats.totalClicks.toLocaleString("fr-FR"),
                    bg: "bg-primary/10",
                    iconColor: "text-primary",
                  },
                  {
                    icon: "shopping_cart_checkout",
                    label: "Commandes generees",
                    value: stats.totalOrders.toLocaleString("fr-FR"),
                    bg: "bg-emerald-500/10",
                    iconColor: "text-emerald-400",
                  },
                  {
                    icon: "payments",
                    label: "Total depense",
                    value: `${stats.totalSpent.toFixed(2)} EUR`,
                    bg: "bg-amber-500/10",
                    iconColor: "text-amber-400",
                  },
                  {
                    icon: "trending_up",
                    label: "ROI estime",
                    value: `${roi >= 0 ? "+" : ""}${roi.toFixed(0)}%`,
                    bg: roi >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
                    iconColor: roi >= 0 ? "text-emerald-400" : "text-red-400",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-primary/5 p-5 rounded-2xl border border-primary/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("size-10 rounded-xl flex items-center justify-center", stat.bg)}>
                        <span className={cn("material-symbols-outlined", stat.iconColor)}>
                          {stat.icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">{stat.label}</p>
                        <p className="text-lg font-black">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Chart + History */}
              <div className="lg:col-span-2 space-y-6">
                {/* Performance Chart */}
                <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold">Performance du boost</h3>
                      <p className="text-xs text-slate-500">
                        Repartition des vues et clics par jour
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Vues</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-yellow-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Clics</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative h-64 w-full flex items-end justify-between gap-4 pt-4">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-full border-t border-primary/5" />
                      ))}
                    </div>

                    {chartData.map((bar) => (
                      <div
                        key={bar.day}
                        className="flex-1 flex flex-col items-center gap-2 z-10"
                      >
                        <div className="w-full flex justify-center gap-1 items-end h-full">
                          <div
                            className="w-3 bg-primary/60 rounded-t-sm transition-all duration-300"
                            style={{
                              height: `${maxChartValue > 0 ? (bar.views / maxChartValue) * 100 : 0}%`,
                              minHeight: bar.views > 0 ? "4px" : "0px",
                            }}
                          />
                          <div
                            className="w-3 bg-yellow-500/60 rounded-t-sm transition-all duration-300"
                            style={{
                              height: `${maxChartValue > 0 ? (bar.clicks / maxChartValue) * 100 : 0}%`,
                              minHeight: bar.clicks > 0 ? "4px" : "0px",
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{bar.day}</span>
                      </div>
                    ))}
                  </div>

                  {/* Empty state for chart */}
                  {stats.totalViews === 0 && stats.totalClicks === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-400">
                        Aucune donnee de performance pour ce service. Les statistiques apparaitront apres l&apos;activation d&apos;un boost.
                      </p>
                    </div>
                  )}
                </div>

                {/* Boost History Table */}
                <div className="bg-primary/5 rounded-2xl border border-primary/10 overflow-hidden">
                  <div className="p-4 border-b border-primary/10 flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Historique des boosts
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      {history.length} boost{history.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {history.length === 0 ? (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-3xl text-slate-400 mb-2 block">
                        history
                      </span>
                      <p className="text-sm text-slate-400">
                        Aucun historique de boost pour ce service.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-primary/10">
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Tier</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Periode</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Prix</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Vues</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Clics</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Commandes</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-center">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/10">
                          {history.map((b) => {
                            const isActive = new Date(b.expiresAt) > new Date();
                            return (
                              <tr key={b.id} className="hover:bg-primary/5 transition-colors">
                                <td className="px-4 py-3">
                                  <span className={cn(
                                    "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    tierBadgeClass(b.tier)
                                  )}>
                                    {tierLabel(b.tier)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[10px] text-slate-400 whitespace-nowrap">
                                  {formatShortDate(b.startedAt)} — {formatShortDate(b.expiresAt)}
                                </td>
                                <td className="px-4 py-3 text-xs font-bold text-right">{b.price.toFixed(2)} EUR</td>
                                <td className="px-4 py-3 text-xs text-right">{b.viewsGenerated.toLocaleString("fr-FR")}</td>
                                <td className="px-4 py-3 text-xs text-right">{b.clicksGenerated.toLocaleString("fr-FR")}</td>
                                <td className="px-4 py-3 text-xs font-bold text-primary text-right">{b.ordersGenerated}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={cn(
                                    "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    isActive ? "bg-primary/20 text-primary" : "bg-emerald-500/20 text-emerald-400"
                                  )}>
                                    <span className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      isActive ? "bg-primary" : "bg-emerald-400"
                                    )} />
                                    {isActive ? "Actif" : "Termine"}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
