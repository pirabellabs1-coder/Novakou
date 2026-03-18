"use client";

import { useState, useEffect } from "react";
import { useMarketingDiscounts } from "@/lib/formations/hooks";
import Link from "next/link";
import {
  Tag, Percent, DollarSign, Calendar, Copy, Plus, Check,
  Trash2, ToggleLeft, ToggleRight, Loader2, Sparkles,
  AlertCircle, X, Hash, ShoppingBag, BookOpen, Target,
  TrendingUp, Users, Infinity as InfinityIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
type DiscountScope = "ALL" | "FORMATIONS" | "PRODUCTS" | "SPECIFIC";

interface DiscountCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  scope: DiscountScope;
  formationIds: string[];
  productIds: string[];
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  minOrderAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  totalDiscounted: number;
  revenue: number;
  createdAt: string;
}

interface Stats {
  totalCodes: number;
  activeCodes: number;
  totalUses: number;
  totalRevenue: number;
}

interface FormState {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  scope: DiscountScope;
  maxUses: string;
  maxUsesPerUser: string;
  minOrderAmount: string;
  expiresAt: string;
}

interface FormErrors {
  code?: string;
  discountValue?: string;
  general?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getStatus(d: DiscountCode): { label: string; color: string } {
  if (d.maxUses !== null && d.usedCount >= d.maxUses) {
    return { label: "Epuise", color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:bg-slate-700 dark:text-slate-300" };
  }
  if (d.expiresAt && new Date(d.expiresAt) < new Date()) {
    return { label: "Expire", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  }
  if (!d.isActive) {
    return { label: "Inactif", color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:bg-slate-700 dark:text-slate-300" };
  }
  return { label: "Actif", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
}

function scopeLabel(scope: DiscountScope): string {
  switch (scope) {
    case "FORMATIONS": return "Formations";
    case "PRODUCTS": return "Produits";
    case "SPECIFIC": return "Spécifique";
    default: return "Tout";
  }
}

function scopeIcon(scope: DiscountScope) {
  switch (scope) {
    case "FORMATIONS": return <BookOpen className="w-3 h-3" />;
    case "PRODUCTS": return <ShoppingBag className="w-3 h-3" />;
    case "SPECIFIC": return <Target className="w-3 h-3" />;
    default: return <Tag className="w-3 h-3" />;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ReductionsPage() {
  const { data: queryData, isLoading: loading } = useMarketingDiscounts();

  // Local state for optimistic mutation updates — seeded from query data
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCodes: 0, activeCodes: 0, totalUses: 0, totalRevenue: 0 });

  // Seed local state from query data on first successful load
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!seeded && queryData && !loading) {
      const d = queryData as { discounts?: DiscountCode[]; stats?: Stats };
      setDiscounts(d.discounts ?? []);
      setStats(d.stats ?? { totalCodes: 0, activeCodes: 0, totalUses: 0, totalRevenue: 0 });
      setSeeded(true);
    }
  }, [queryData, loading, seeded]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [form, setForm] = useState<FormState>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    scope: "ALL",
    maxUses: "",
    maxUsesPerUser: "",
    minOrderAmount: "",
    expiresAt: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Actions ──

  const copyCode = async (discount: DiscountCode) => {
    try {
      await navigator.clipboard.writeText(discount.code);
      setCopiedId(discount.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const toggleActive = async (id: string) => {
    const target = discounts.find((d) => d.id === id);
    if (!target) return;

    // Optimistic update
    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)),
    );

    try {
      const res = await fetch("/api/marketing/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !target.isActive }),
      });
      if (!res.ok) {
        // Revert on failure
        setDiscounts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, isActive: target.isActive } : d)),
        );
      }
    } catch {
      // Revert on error
      setDiscounts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isActive: target.isActive } : d)),
      );
    }
  };

  const deleteDiscount = async (id: string) => {
    try {
      await fetch(`/api/marketing/discounts?id=${id}`, { method: "DELETE" });
    } catch {
      // continue with local removal even on error
    }
    const target = discounts.find((d) => d.id === id);
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
    setStats((prev) => ({
      ...prev,
      totalCodes: prev.totalCodes - 1,
      activeCodes: target?.isActive ? prev.activeCodes - 1 : prev.activeCodes,
    }));
  };

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

  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    updateField("code", cleaned);
  };

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!form.code || form.code.length < 3) {
      errors.code = "Le code doit contenir au moins 3 caracteres";
    }
    if (form.code.length > 20) {
      errors.code = "Le code ne peut pas depasser 20 caracteres";
    }

    const val = parseFloat(form.discountValue);
    if (!form.discountValue || isNaN(val) || val <= 0) {
      errors.discountValue = "Valeur de reduction invalide";
    }
    if (form.discountType === "PERCENTAGE" && val > 100) {
      errors.discountValue = "Le pourcentage ne peut pas depasser 100";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/marketing/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: parseFloat(form.discountValue),
          scope: form.scope,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          maxUsesPerUser: form.maxUsesPerUser ? parseInt(form.maxUsesPerUser) : null,
          minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiscounts((prev) => [data.discount, ...prev]);
        setStats((prev) => ({
          ...prev,
          totalCodes: prev.totalCodes + 1,
          activeCodes: prev.activeCodes + 1,
        }));
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
      code: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      scope: "ALL",
      maxUses: "",
      maxUsesPerUser: "",
      minOrderAmount: "",
      expiresAt: "",
    });
    setFormErrors({});
  };

  // ── Loading state ──

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
            Codes de reduction
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Creez et gerez vos codes promo avec controle avance
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau code
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Tag className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50 dark:bg-purple-900/20"
          label="Total codes"
          value={stats.totalCodes}
        />
        <StatCard
          icon={<Check className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50 dark:bg-green-900/20"
          label="Codes actifs"
          value={stats.activeCodes}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          label="Utilisations"
          value={stats.totalUses}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          label="Revenus generes"
          value={`${stats.totalRevenue.toFixed(0)}€`}
        />
      </div>

      {/* Discount codes list */}
      {discounts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Tag className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-600 dark:text-slate-400">
            Aucun code de reduction
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Creez votre premier code de reduction pour attirer plus d&apos;apprenants et booster vos ventes.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm mt-6"
          >
            <Plus className="w-4 h-4" />
            Creer un code
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Table header (desktop) */}
          <div className="hidden lg:grid grid-cols-[1fr_100px_90px_110px_100px_90px_80px_80px] gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Code</span>
            <span>Type</span>
            <span>Valeur</span>
            <span>Utilisations</span>
            <span>Expiration</span>
            <span>Portee</span>
            <span>Statut</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {discounts.map((d) => {
              const status = getStatus(d);
              return (
                <div
                  key={d.id}
                  className="lg:grid lg:grid-cols-[1fr_100px_90px_110px_100px_90px_80px_80px] lg:gap-3 lg:items-center px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  {/* Code */}
                  <div className="flex items-center gap-2 mb-2 lg:mb-0">
                    <code className="font-mono text-sm font-bold text-primary bg-primary/5 dark:bg-primary/10 px-2.5 py-1 rounded-lg">
                      {d.code}
                    </code>
                    <button
                      onClick={() => copyCode(d)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
                      title="Copier le code"
                    >
                      {copiedId === d.id ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Type badge */}
                  <div className="mb-1 lg:mb-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      d.discountType === "PERCENTAGE"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {d.discountType === "PERCENTAGE" ? (
                        <><Percent className="w-2.5 h-2.5" /> %</>
                      ) : (
                        <><DollarSign className="w-2.5 h-2.5" /> Fixe</>
                      )}
                    </span>
                  </div>

                  {/* Value */}
                  <div className="flex items-center gap-1 mb-1 lg:mb-0">
                    <span className="lg:hidden text-xs text-slate-400 mr-1">Valeur:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100">
                      {d.discountType === "PERCENTAGE" ? `-${d.discountValue}%` : `-${d.discountValue}€`}
                    </span>
                  </div>

                  {/* Uses */}
                  <div className="flex items-center gap-1 mb-1 lg:mb-0">
                    <span className="lg:hidden text-xs text-slate-400 mr-1">Utilisations:</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {d.usedCount}
                      <span className="text-slate-400">
                        /{" "}
                        {d.maxUses !== null ? (
                          d.maxUses
                        ) : (
                          <InfinityIcon className="w-3.5 h-3.5 inline-block" />
                        )}
                      </span>
                    </span>
                  </div>

                  {/* Expiration */}
                  <div className="flex items-center gap-1 mb-1 lg:mb-0">
                    <span className="lg:hidden text-xs text-slate-400 mr-1">Expire:</span>
                    {d.expiresAt ? (
                      <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(d.expiresAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Illimite</span>
                    )}
                  </div>

                  {/* Scope */}
                  <div className="mb-1 lg:mb-0">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                      {scopeIcon(d.scope)}
                      {scopeLabel(d.scope)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="mb-2 lg:mb-0">
                    <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => toggleActive(d.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      title={d.isActive ? "Desactiver" : "Activer"}
                    >
                      {d.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeletingId(d.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-slate-400 hover:text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue footer */}
          <div className="hidden lg:flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <span>{discounts.length} code(s) au total</span>
            <span className="font-bold text-green-600">
              Revenus generes : {stats.totalRevenue.toFixed(0)}€
            </span>
          </div>
        </div>
      )}

      {/* ── Create discount modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowCreateModal(false); resetForm(); }}
          />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Nouveau code de reduction
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreate} className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {formErrors.general && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formErrors.general}
                </div>
              )}

              {/* Code input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Code *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="Ex: BIENVENUE20"
                      maxLength={20}
                      className={`w-full font-mono text-sm font-bold uppercase border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.code
                          ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                          : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700"
                      }`}
                    />
                    {form.code.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {form.code.length}/20
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField("code", generateCode())}
                    className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                    title="Generer automatiquement"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </button>
                </div>
                {formErrors.code && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.code}
                  </p>
                )}
              </div>

              {/* Type toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Type de reduction *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("discountType", "PERCENTAGE")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.discountType === "PERCENTAGE"
                        ? "border-primary bg-primary/5 text-primary dark:bg-primary/10"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                    Pourcentage
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("discountType", "FIXED_AMOUNT")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.discountType === "FIXED_AMOUNT"
                        ? "border-primary bg-primary/5 text-primary dark:bg-primary/10"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Montant fixe
                  </button>
                </div>
              </div>

              {/* Value input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {form.discountType === "PERCENTAGE" ? "Reduction (%) *" : "Montant (€) *"}
                </label>
                <div className="relative w-full max-w-[200px]">
                  {form.discountType === "PERCENTAGE" ? (
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  ) : (
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  )}
                  <input
                    type="number"
                    min={0.01}
                    max={form.discountType === "PERCENTAGE" ? 100 : 99999}
                    step={form.discountType === "PERCENTAGE" ? 1 : 0.01}
                    value={form.discountValue}
                    onChange={(e) => updateField("discountValue", e.target.value)}
                    placeholder={form.discountType === "PERCENTAGE" ? "20" : "10.00"}
                    className={`w-full text-sm border rounded-xl pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.discountValue
                        ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                        : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    {form.discountType === "PERCENTAGE" ? "%" : "€"}
                  </span>
                </div>
                {formErrors.discountValue && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.discountValue}
                  </p>
                )}
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Portee
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "ALL" as DiscountScope, label: "Tout", icon: <Tag className="w-3.5 h-3.5" /> },
                      { value: "FORMATIONS" as DiscountScope, label: "Formations", icon: <BookOpen className="w-3.5 h-3.5" /> },
                      { value: "PRODUCTS" as DiscountScope, label: "Produits", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                      { value: "SPECIFIC" as DiscountScope, label: "Spécifique", icon: <Target className="w-3.5 h-3.5" /> },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField("scope", opt.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                        form.scope === opt.value
                          ? "border-primary bg-primary/5 text-primary dark:bg-primary/10"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limits row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-400" />
                    Max utilisations
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUses}
                    onChange={(e) => updateField("maxUses", e.target.value)}
                    placeholder="Illimite"
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    Max / utilisateur
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxUsesPerUser}
                    onChange={(e) => updateField("maxUsesPerUser", e.target.value)}
                    placeholder="Illimite"
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                  />
                </div>
              </div>

              {/* Min order + Expiration row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    Montant min.
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.minOrderAmount}
                    onChange={(e) => updateField("minOrderAmount", e.target.value)}
                    placeholder="Aucun"
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Expiration
                  </label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => updateField("expiresAt", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                  />
                </div>
              </div>

              {/* Preview */}
              {form.code && form.discountValue && (
                <div className="bg-gradient-to-r from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-900/20 rounded-xl border border-primary/20 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apercu</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-base font-bold text-primary bg-white dark:bg-slate-900 dark:bg-slate-800 px-3 py-1 rounded-lg border border-primary/20">
                      {form.code}
                    </code>
                    <span className="text-sm text-slate-500">&rarr;</span>
                    <span className="text-base font-bold text-green-600">
                      {form.discountType === "PERCENTAGE"
                        ? `-${form.discountValue}%`
                        : `-${form.discountValue}€`}
                    </span>
                    <span className="text-xs text-slate-400">
                      sur {scopeLabel(form.scope).toLowerCase()}
                    </span>
                  </div>
                </div>
              )}
            </form>

            {/* Modal footer */}
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
                className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creation...
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4" />
                    Creer le code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletingId(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-2">
                Supprimer ce code ?
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Cette action est irreversible. Le code ne pourra plus etre utilise.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteDiscount(deletingId)}
                  className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
