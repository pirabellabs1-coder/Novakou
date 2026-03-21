"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useInstructorPromotions, instructorKeys } from "@/lib/formations/hooks";
import {
  Tag, Percent, Calendar, Plus, Check,
  Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";

// ── Types ──

interface FlashPromotion {
  id: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
  maxUsage: number | null;
  usageCount: number;
  isActive: boolean;
  formation: { id: string; title: string } | null;
  digitalProduct: { id: string; title: string } | null;
}

// ── Helpers ──

function getStatus(
  promo: FlashPromotion,
  fr: boolean,
): { label: string; color: string } {
  const now = new Date();
  if (promo.maxUsage !== null && promo.usageCount >= promo.maxUsage) {
    return {
      label: fr ? "Épuisé" : "Exhausted",
      color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    };
  }
  if (new Date(promo.endsAt) < now) {
    return {
      label: fr ? "Expiré" : "Expired",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
  }
  if (!promo.isActive) {
    return {
      label: fr ? "Inactif" : "Inactive",
      color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    };
  }
  if (new Date(promo.startsAt) > now) {
    return {
      label: fr ? "Programmé" : "Scheduled",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
  }
  return {
    label: fr ? "Actif" : "Active",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
}

function getTargetLabel(promo: FlashPromotion, fr: boolean): string {
  if (promo.formation) {
    return promo.formation.title;
  }
  if (promo.digitalProduct) {
    return promo.digitalProduct.title;
  }
  return fr ? "Inconnu" : "Unknown";
}

function getTargetType(promo: FlashPromotion, fr: boolean): string {
  if (promo.formation) return fr ? "Formation" : "Course";
  if (promo.digitalProduct) return fr ? "Produit" : "Product";
  return "—";
}

// ── Component ──

export default function PromotionsListPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const queryClient = useQueryClient();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading: loading, isError, error: queryError, refetch } = useInstructorPromotions();
  const promos: FlashPromotion[] = (data as { promotions?: FlashPromotion[] } | null)?.promotions ?? [];
  const error = isError ? ((queryError as Error)?.message || "Erreur réseau") : "";

  // Derived stats
  const totalCodes = promos.length;
  const now = new Date();
  const activeCodes = promos.filter(
    (p) =>
      p.isActive &&
      !(p.maxUsage !== null && p.usageCount >= p.maxUsage) &&
      new Date(p.endsAt) > now &&
      new Date(p.startsAt) <= now,
  ).length;
  const totalUses = promos.reduce((sum, p) => sum + p.usageCount, 0);

  const toggleActive = async (id: string) => {
    const promo = promos.find((p) => p.id === id);
    if (!promo) return;

    const newActive = !promo.isActive;

    try {
      const res = await fetch(`/api/instructeur/promotions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: instructorKeys.promotions() });
    } catch {
      alert(fr ? "Erreur lors du changement de statut" : "Error toggling status");
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
  };

  const deletePromo = async (id: string) => {
    try {
      const res = await fetch(`/api/instructeur/promotions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: instructorKeys.promotions() });
    } catch {
      alert(fr ? "Erreur lors de la suppression" : "Error deleting promotion");
    }
    setDeletingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
            {fr ? "Mes promotions flash" : "My flash promotions"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {fr
              ? "Créez et gérez vos promotions temporaires"
              : "Create and manage your temporary promotions"}
          </p>
        </div>
        <Link
          href="/formations/instructeur/promotions/creer"
          className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          {fr ? "Nouvelle promotion" : "New promotion"}
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400 mb-4">
          <span>{error}</span>
          <button
            onClick={() => refetch()}
            className="ml-4 px-3 py-1.5 bg-red-100 dark:bg-red-800/40 hover:bg-red-200 dark:hover:bg-red-800/60 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
                {totalCodes}
              </p>
              <p className="text-xs text-slate-500">
                {fr ? "Total promotions" : "Total promotions"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
                {activeCodes}
              </p>
              <p className="text-xs text-slate-500">
                {fr ? "Promotions actives" : "Active promotions"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
                {totalUses}
              </p>
              <p className="text-xs text-slate-500">
                {fr ? "Utilisations totales" : "Total uses"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Promotions list */}
      {!loading && promos.length === 0 && !error && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Tag className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-600 dark:text-slate-400">
            {fr ? "Aucune promotion" : "No promotions"}
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            {fr
              ? "Créez votre première promotion flash pour booster les ventes de vos formations et produits."
              : "Create your first flash promotion to boost sales of your courses and products."}
          </p>
          <Link
            href="/formations/instructeur/promotions/creer"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm mt-6"
          >
            <Plus className="w-4 h-4" />
            {fr ? "Créer une promotion" : "Create a promotion"}
          </Link>
        </div>
      )}

      {!loading && promos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Table header (desktop) */}
          <div className="hidden md:grid grid-cols-[1fr_80px_100px_140px_100px_80px] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>{fr ? "Cible" : "Target"}</span>
            <span>{fr ? "Reduction" : "Discount"}</span>
            <span>{fr ? "Utilisations" : "Uses"}</span>
            <span>{fr ? "Periode" : "Period"}</span>
            <span>{fr ? "Statut" : "Status"}</span>
            <span className="text-right">{fr ? "Actions" : "Actions"}</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {promos.map((promo) => {
              const status = getStatus(promo, fr);
              return (
                <div
                  key={promo.id}
                  className="md:grid md:grid-cols-[1fr_80px_100px_140px_100px_80px] md:gap-4 md:items-center px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  {/* Target */}
                  <div className="mb-2 md:mb-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {getTargetLabel(promo, fr)}
                    </p>
                    <span className="text-xs text-slate-400">
                      {getTargetType(promo, fr)}
                    </span>
                  </div>

                  {/* Discount */}
                  <div className="flex items-center gap-1 mb-1 md:mb-0">
                    <span className="md:hidden text-xs text-slate-400 mr-1">
                      {fr ? "Reduction:" : "Discount:"}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100">
                      -{promo.discountPct}%
                    </span>
                  </div>

                  {/* Uses */}
                  <div className="flex items-center gap-1 mb-1 md:mb-0">
                    <span className="md:hidden text-xs text-slate-400 mr-1">
                      {fr ? "Utilisations:" : "Uses:"}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {promo.usageCount}
                      {promo.maxUsage !== null && (
                        <span className="text-slate-400">/ {promo.maxUsage}</span>
                      )}
                    </span>
                  </div>

                  {/* Period */}
                  <div className="flex items-center gap-1 mb-2 md:mb-0">
                    <span className="md:hidden text-xs text-slate-400 mr-1">
                      {fr ? "Periode:" : "Period:"}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(promo.startsAt).toLocaleDateString(
                        fr ? "fr-FR" : "en-US",
                        { day: "numeric", month: "short" },
                      )}
                      {" — "}
                      {new Date(promo.endsAt).toLocaleDateString(
                        fr ? "fr-FR" : "en-US",
                        { day: "numeric", month: "short" },
                      )}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="mb-2 md:mb-0">
                    <span
                      className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => toggleActive(promo.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      title={
                        promo.isActive
                          ? fr
                            ? "Désactiver"
                            : "Deactivate"
                          : fr
                            ? "Activer"
                            : "Activate"
                      }
                    >
                      {promo.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => confirmDelete(promo.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-slate-400 hover:text-red-500"
                      title={fr ? "Supprimer" : "Delete"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
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
                {fr ? "Supprimer cette promotion ?" : "Delete this promotion?"}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {fr
                  ? "Cette action est irréversible. La promotion sera désactivée."
                  : "This action is irreversible. The promotion will be deactivated."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  {fr ? "Annuler" : "Cancel"}
                </button>
                <button
                  onClick={() => deletePromo(deletingId)}
                  className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"
                >
                  {fr ? "Supprimer" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
