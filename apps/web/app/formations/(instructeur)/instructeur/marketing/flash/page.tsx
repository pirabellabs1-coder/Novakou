"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMarketingFlashOffers, instructorKeys } from "@/lib/formations/hooks";
import Link from "next/link";
import {
  Zap, Calendar, Clock, Plus, Loader2, AlertCircle,
  X, TrendingUp, Users, Timer, Archive, Percent,
  BookOpen, ShoppingBag,
} from "lucide-react";
import SharedStatCard from "@/components/formations/StatCard";

// ── Types ──────────────────────────────────────────────────────────────────

interface FlashOffer {
  id: string;
  formationId: string | null;
  digitalProductId: string | null;
  formationTitle: string | null;
  productTitle: string | null;
  discountPct: number;
  startsAt: string;
  endsAt: string;
  maxUsage: number | null;
  usageCount: number;
  isActive: boolean;
  revenue: number;
  createdAt: string;
}

interface Stats {
  totalOffers: number;
  activeNow: number;
  totalRevenue: number;
  totalUsages: number;
}

interface FormState {
  targetType: "formation" | "product";
  targetId: string;
  discountPct: string;
  startsAt: string;
  endsAt: string;
  maxUsage: string;
}

interface FormErrors {
  targetId?: string;
  discountPct?: string;
  dates?: string;
  general?: string;
}

// Types for real API data
interface FormationItem {
  id: string;
  title: string;
  price: number;
}

interface ProductItem {
  id: string;
  title: string;
  price: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getTimeRemaining(endsAt: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, expired: false };
}

function formatCountdown(r: ReturnType<typeof getTimeRemaining>): string {
  if (r.expired) return "Termine";
  const parts: string[] = [];
  if (r.days > 0) parts.push(`${r.days}j`);
  if (r.hours > 0 || r.days > 0) parts.push(`${r.hours}h`);
  parts.push(`${String(r.minutes).padStart(2, "0")}m`);
  parts.push(`${String(r.seconds).padStart(2, "0")}s`);
  return parts.join(" ");
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function FlashOffersPage() {
  const queryClient = useQueryClient();
  const { data: queryData, isLoading: loading, error: queryError, refetch } = useMarketingFlashOffers();

  // Local state seeded from query data
  const [active, setActive] = useState<FlashOffer[]>([]);
  const [scheduled, setScheduled] = useState<FlashOffer[]>([]);
  const [past, setPast] = useState<FlashOffer[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOffers: 0, activeNow: 0, totalRevenue: 0, totalUsages: 0 });

  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!seeded && queryData && !loading) {
      const d = queryData as { active?: FlashOffer[]; scheduled?: FlashOffer[]; past?: FlashOffer[]; stats?: Stats };
      setActive(d.active ?? []);
      setScheduled(d.scheduled ?? []);
      setPast(d.past ?? []);
      setStats(d.stats ?? { totalOffers: 0, activeNow: 0, totalRevenue: 0, totalUsages: 0 });
      setSeeded(true);
    }
  }, [queryData, loading, seeded]);

  // Real formations and products from API
  const [formations, setFormations] = useState<FormationItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    setItemsLoading(true);
    Promise.all([
      fetch("/api/instructeur/formations").then((r) => r.ok ? r.json() : { formations: [] }),
      fetch("/api/instructeur/produits").then((r) => r.ok ? r.json() : { products: [] }),
    ])
      .then(([formData, prodData]) => {
        const mappedFormations: FormationItem[] = (formData.formations ?? []).map(
          (f: { id: string; title?: string; price?: number }) => ({
            id: f.id,
            title: f.title || "Formation sans titre",
            price: f.price ?? 0,
          })
        );
        const mappedProducts: ProductItem[] = (prodData.products ?? []).map(
          (p: { id: string; title?: string; price?: number }) => ({
            id: p.id,
            title: p.title || "Produit sans titre",
            price: p.price ?? 0,
          })
        );
        setFormations(mappedFormations);
        setProducts(mappedProducts);
      })
      .catch(() => {
        setFormations([]);
        setProducts([]);
      })
      .finally(() => setItemsLoading(false));
  }, []);


  const [showCreateModal, setShowCreateModal] = useState(false);
  const [countdowns, setCountdowns] = useState<Record<string, ReturnType<typeof getTimeRemaining>>>({});

  // Form state
  const [form, setForm] = useState<FormState>({
    targetType: "formation",
    targetId: "",
    discountPct: "",
    startsAt: "",
    endsAt: "",
    maxUsage: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Countdown timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateCountdowns = useCallback(() => {
    const allActive = [...active, ...scheduled];
    const newCountdowns: Record<string, ReturnType<typeof getTimeRemaining>> = {};
    for (const offer of allActive) {
      const isScheduled = new Date(offer.startsAt) > new Date();
      newCountdowns[offer.id] = getTimeRemaining(isScheduled ? offer.startsAt : offer.endsAt);
    }
    setCountdowns(newCountdowns);
  }, [active, scheduled]);

  useEffect(() => {
    updateCountdowns();
    timerRef.current = setInterval(updateCountdowns, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [updateCountdowns]);

  // ── Form handling ──

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in formErrors) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof FormErrors];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!form.targetId) {
      errors.targetId = "Selectionnez une formation ou un produit";
    }

    const pct = parseInt(form.discountPct);
    if (!form.discountPct || isNaN(pct) || pct < 1 || pct > 90) {
      errors.discountPct = "Le pourcentage doit etre entre 1 et 90";
    }

    if (!form.startsAt || !form.endsAt) {
      errors.dates = "Les dates de debut et fin sont requises";
    } else if (new Date(form.endsAt) <= new Date(form.startsAt)) {
      errors.dates = "La date de fin doit etre apres la date de debut";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/marketing/flash-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationId: form.targetType === "formation" ? form.targetId : null,
          digitalProductId: form.targetType === "product" ? form.targetId : null,
          discountPct: parseInt(form.discountPct),
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          maxUsage: form.maxUsage ? parseInt(form.maxUsage) : null,
        }),
      });

      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: instructorKeys.marketingFlashOffers() });
        setSeeded(false); // allow re-seed on next render with fresh data
        setShowCreateModal(false);
        resetForm();
      } else {
        const data = await res.json();
        setFormErrors({ general: data.error || "Erreur lors de la creation" });
      }
    } catch {
      setFormErrors({ general: "Erreur de connexion" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      targetType: "formation",
      targetId: "",
      discountPct: "",
      startsAt: "",
      endsAt: "",
      maxUsage: "",
    });
    setFormErrors({});
  };

  // ── Loading ──

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── Error state ──

  if (queryError) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <Zap className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-slate-500 mb-4">{queryError.message || "Erreur lors du chargement"}</p>
          <button onClick={() => refetch()} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const items = form.targetType === "formation" ? formations : products;

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
            <Zap className="w-6 h-6 text-amber-500" />
            Offres flash
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Creez des promotions temporaires avec compte a rebours
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle offre flash
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SharedStatCard
          icon={Zap}
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-900/20"
          label="Total offres"
          value={stats.totalOffers}
        />
        <SharedStatCard
          icon={Timer}
          color="text-green-600"
          bg="bg-green-50 dark:bg-green-900/20"
          label="Actives"
          value={stats.activeNow}
        />
        <SharedStatCard
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/20"
          label="Utilisations"
          value={stats.totalUsages}
        />
        <SharedStatCard
          icon={TrendingUp}
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          label="Revenus"
          value={`${stats.totalRevenue.toFixed(0)}€`}
        />
      </div>

      {/* Active flash offers with countdown */}
      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Offres en cours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((offer) => {
              const cd = countdowns[offer.id] || getTimeRemaining(offer.endsAt);
              const title = offer.formationTitle || offer.productTitle || "---";
              const isFormation = !!offer.formationId;

              return (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border-2 border-amber-200 dark:border-amber-800/50 p-5 relative overflow-hidden"
                >
                  {/* Flash badge */}
                  <div className="absolute top-0 right-0">
                    <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                      -{offer.discountPct}%
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isFormation
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "bg-purple-50 dark:bg-purple-900/20"
                    }`}>
                      {isFormation ? (
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 truncate pr-12">
                        {title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isFormation ? "Formation" : "Produit"} - {offer.usageCount} utilisation(s)
                        {offer.maxUsage ? ` / ${offer.maxUsage}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Temps restant
                    </p>
                    {cd.expired ? (
                      <p className="text-lg font-bold text-red-500">Termine</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        {cd.days > 0 && (
                          <CountdownBlock value={cd.days} label="j" />
                        )}
                        <CountdownBlock value={cd.hours} label="h" />
                        <CountdownBlock value={cd.minutes} label="m" />
                        <CountdownBlock value={cd.seconds} label="s" />
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                    <span>{formatDateTime(offer.startsAt)}</span>
                    <span>&rarr;</span>
                    <span>{formatDateTime(offer.endsAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduled offers */}
      {scheduled.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Programmees
          </h2>
          <div className="space-y-3">
            {scheduled.map((offer) => {
              const cd = countdowns[offer.id] || getTimeRemaining(offer.startsAt);
              const title = offer.formationTitle || offer.productTitle || "---";

              return (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 truncate">{title}</p>
                      <p className="text-xs text-slate-500">
                        Debut : {formatDateTime(offer.startsAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                      -{offer.discountPct}%
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      Demarre dans {formatCountdown(cd)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past offers */}
      {past.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Archive className="w-4 h-4 text-slate-400" />
            Terminees
          </h2>
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr_80px_100px_100px_100px] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Offre</span>
              <span>Reduction</span>
              <span>Utilisations</span>
              <span>Revenus</span>
              <span>Periode</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {past.map((offer) => {
                const title = offer.formationTitle || offer.productTitle || "---";
                return (
                  <div
                    key={offer.id}
                    className="md:grid md:grid-cols-[1fr_80px_100px_100px_100px] md:gap-4 md:items-center px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1 md:mb-0">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {title}
                      </span>
                    </div>
                    <div className="mb-1 md:mb-0">
                      <span className="bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-bold">
                        -{offer.discountPct}%
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 md:mb-0">
                      {offer.usageCount}{offer.maxUsage ? ` / ${offer.maxUsage}` : ""}
                    </div>
                    <div className="text-sm font-bold text-green-600 mb-1 md:mb-0">
                      {offer.revenue.toFixed(0)}€
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(offer.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      {" - "}
                      {new Date(offer.endsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {active.length === 0 && scheduled.length === 0 && past.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Zap className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-600 dark:text-slate-400">
            Aucune offre flash
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Creez une offre flash pour proposer des reductions temporaires et booster vos ventes.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-colors text-sm mt-6"
          >
            <Plus className="w-4 h-4" />
            Creer une offre flash
          </button>
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowCreateModal(false); resetForm(); }}
          />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Nouvelle offre flash
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreate} className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {formErrors.general && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formErrors.general}
                </div>
              )}

              {/* Target type toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Type de contenu *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { updateField("targetType", "formation"); updateField("targetId", ""); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.targetType === "formation"
                        ? "border-primary bg-primary/5 text-primary dark:bg-primary/10"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Formation
                  </button>
                  <button
                    type="button"
                    onClick={() => { updateField("targetType", "product"); updateField("targetId", ""); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.targetType === "product"
                        ? "border-primary bg-primary/5 text-primary dark:bg-primary/10"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Produit
                  </button>
                </div>
              </div>

              {/* Target selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {form.targetType === "formation" ? "Formation *" : "Produit *"}
                </label>
                <select
                  value={form.targetId}
                  onChange={(e) => updateField("targetId", e.target.value)}
                  disabled={itemsLoading}
                  className={`w-full text-sm border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 transition-colors appearance-none bg-white dark:bg-slate-900 dark:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed ${
                    formErrors.targetId
                      ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                      : "border-slate-300 dark:border-slate-600 focus:ring-primary/20"
                  }`}
                >
                  {itemsLoading ? (
                    <option value="">Chargement...</option>
                  ) : items.length === 0 ? (
                    <option value="">
                      {form.targetType === "formation"
                        ? "Aucune formation disponible"
                        : "Aucun produit disponible"}
                    </option>
                  ) : (
                    <>
                      <option value="">Selectionnez...</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title} ({item.price}€)
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {formErrors.targetId && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.targetId}
                  </p>
                )}
              </div>

              {/* Discount percentage */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Reduction (%) *
                </label>
                <div className="relative w-full max-w-[200px]">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={form.discountPct}
                    onChange={(e) => updateField("discountPct", e.target.value)}
                    placeholder="40"
                    className={`w-full text-sm border rounded-xl pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.discountPct
                        ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                        : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
                </div>
                {formErrors.discountPct && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.discountPct}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1.5">Maximum 90% de reduction</p>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Debut *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => updateField("startsAt", e.target.value)}
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Fin *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => updateField("endsAt", e.target.value)}
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                  />
                </div>
              </div>
              {formErrors.dates && (
                <p className="flex items-center gap-1 text-xs text-red-500 -mt-3">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.dates}
                </p>
              )}

              {/* Max usage */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre max d&apos;utilisations
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.maxUsage}
                  onChange={(e) => updateField("maxUsage", e.target.value)}
                  placeholder="Illimite"
                  className="w-full max-w-[200px] text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                />
                <p className="text-xs text-slate-400 mt-1.5">Laissez vide pour un usage illimite</p>
              </div>

              {/* Preview */}
              {form.targetId && form.discountPct && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-200/50 dark:border-amber-800/30 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apercu</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100">
                      {items.find((i) => i.id === form.targetId)?.title || "---"}
                    </span>
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      -{form.discountPct}%
                    </span>
                  </div>
                  {form.startsAt && form.endsAt && (
                    <p className="text-xs text-slate-500 mt-2">
                      Du {formatDateTime(form.startsAt)} au {formatDateTime(form.endsAt)}
                    </p>
                  )}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center gap-2 bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creation...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Creer l&apos;offre
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="bg-slate-900 dark:bg-slate-100 dark:bg-slate-800 text-white dark:text-slate-900 dark:text-white text-lg font-mono font-bold px-2 py-1 rounded-lg min-w-[40px] text-center">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs text-slate-400 font-semibold">{label}</span>
    </div>
  );
}
