"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatServiceTitle } from "@/lib/format-service-title";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SeoEditor } from "@/components/dashboard/SeoEditor";
import type { ApiService } from "@/lib/api-client";

// ── Status helpers ──

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  actif: { label: "Actif", cls: "bg-emerald-500/20 text-emerald-400" },
  pause: { label: "En pause", cls: "bg-amber-500/20 text-amber-400" },
  en_attente: { label: "En attente", cls: "bg-blue-500/20 text-blue-400" },
  refuse: { label: "Refusé", cls: "bg-red-500/20 text-red-400" },
  brouillon: { label: "Brouillon", cls: "bg-slate-500/20 text-slate-400" },
};

const FILTER_TABS = [
  { key: "all", label: "Tous" },
  { key: "actif", label: "Actifs" },
  { key: "pause", label: "En pause" },
  { key: "en_attente", label: "En attente" },
  { key: "refuse", label: "Refusés" },
];

function statusBadge(status: string) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-slate-500/20 text-slate-400" };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function formatEur(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function conversionRate(s: ApiService) {
  return s.clicks > 0 ? ((s.orderCount / s.clicks) * 100).toFixed(1) : "0.0";
}

// ── Component ──

export default function AgenceServicesPage() {
  const {
    services,
    serviceFilter,
    setServiceFilter,
    syncServices,
    toggleService,
    deleteService,
    isLoading,
  } = useAgencyStore();
  const { addToast } = useToastStore();

  const [deleteTarget, setDeleteTarget] = useState<ApiService | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [seoService, setSeoService] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    syncServices();
  }, [syncServices]);

  // ── Filtered services ──

  const filtered = useMemo(
    () => (serviceFilter === "all" ? services : services.filter((s) => s.status === serviceFilter)),
    [services, serviceFilter],
  );

  // ── Computed stats ──

  const stats = useMemo(() => {
    const total = services.length;
    const actifs = services.filter((s) => s.status === "actif").length;
    const caTotal = services.reduce((sum, s) => sum + s.revenue, 0);

    const totalClicks = services.reduce((sum, s) => sum + s.clicks, 0);
    const totalOrders = services.reduce((sum, s) => sum + s.orderCount, 0);
    const tauxConversion = totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(1) : "0.0";

    return { total, actifs, caTotal, tauxConversion };
  }, [services]);

  // ── Actions ──

  async function handleToggle(s: ApiService) {
    setActionLoading(s.id);
    const ok = await toggleService(s.id);
    setActionLoading(null);
    if (ok) {
      addToast("success", s.status === "actif" ? `"${s.title}" mis en pause` : `"${s.title}" activé`);
    } else {
      addToast("error", "Impossible de modifier le statut");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    const ok = await deleteService(deleteTarget.id);
    setActionLoading(null);
    setDeleteTarget(null);
    if (ok) {
      addToast("success", `"${deleteTarget.title}" supprimé`);
    } else {
      addToast("error", "Impossible de supprimer le service");
    }
  }

  function handleDuplicate(s: ApiService) {
    addToast("info", `Duplication de "${s.title}" — redirection vers le wizard`);
    // Future: navigate to /agence/services/creer?duplicate=ID
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Services</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez les services publiés par votre agence.
          </p>
        </div>
        <Link
          href="/agence/services/creer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-background-dark font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouveau service
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total services", value: String(stats.total), icon: "inventory_2", color: "text-primary" },
          { label: "Services actifs", value: String(stats.actifs), icon: "check_circle", color: "text-emerald-400" },
          { label: "CA total services", value: formatEur(stats.caTotal), icon: "payments", color: "text-amber-400" },
          { label: "Taux conversion moyen", value: `${stats.tauxConversion}%`, icon: "trending_up", color: "text-blue-400" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-neutral-dark rounded-xl border border-border-dark p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={cn("material-symbols-outlined text-xl", card.color)}>
                {card.icon}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-black text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? services.length
              : services.filter((s) => s.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setServiceFilter(tab.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                serviceFilter === tab.key
                  ? "bg-primary text-background-dark"
                  : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white",
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && services.length === 0 && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <span className="material-symbols-outlined animate-spin mr-3">progress_activity</span>
          Chargement des services...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">
            design_services
          </span>
          <h2 className="text-lg font-bold text-white mb-1">Aucun service</h2>
          <p className="text-slate-400 text-sm mb-6">
            {serviceFilter === "all"
              ? "Créez votre premier service pour commencer à recevoir des commandes."
              : "Aucun service dans cette catégorie."}
          </p>
          {serviceFilter === "all" && (
            <Link
              href="/agence/services/creer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-background-dark font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Créer un service
            </Link>
          )}
        </div>
      )}

      {/* Service grid */}
      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-background-dark">
                {s.mainImage ? (
                  <Image
                    src={s.mainImage}
                    alt={s.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="material-symbols-outlined text-4xl text-slate-700">
                      image
                    </span>
                  </div>
                )}
                {s.isBoosted && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">bolt</span>
                    Boosté
                  </span>
                )}
                <div className="absolute top-2 right-2">{statusBadge(s.status)}</div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col">
                {/* Title + category */}
                <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1">
                  {formatServiceTitle(s.title)}
                </h3>
                <p className="text-[11px] text-slate-500 mb-2">
                  {s.categoryName}
                  {s.subCategoryName ? ` / ${s.subCategoryName}` : ""}
                </p>

                {/* Price */}
                <p className="text-primary font-black text-lg mb-2">
                  {formatEur(s.basePrice)}
                </p>

                {/* Tags */}
                {s.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {s.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-background-dark text-[10px] text-slate-400 border border-border-dark"
                      >
                        {tag}
                      </span>
                    ))}
                    {s.tags.length > 4 && (
                      <span className="px-2 py-0.5 text-[10px] text-slate-500">
                        +{s.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mt-auto mb-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    <span>{(s.views ?? 0).toLocaleString("fr-FR")} vues</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
                    <span>{s.orderCount} commande{s.orderCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">payments</span>
                    <span>{formatEur(s.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    <span>{conversionRate(s)}% conv.</span>
                  </div>
                </div>

                {/* Rating */}
                {s.ratingCount > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-400 mb-3">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    <span className="font-semibold">{s.rating.toFixed(1)}</span>
                    <span className="text-slate-500">({s.ratingCount} avis)</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border-dark/50">
                  <Link
                    href={`/agence/services/creer?edit=${s.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-background-dark text-slate-300 text-xs font-semibold hover:text-white hover:bg-background-dark/80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Modifier
                  </Link>

                  <button
                    onClick={() => setSeoService({ id: s.id, title: s.title })}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                    title="Optimiser le SEO"
                  >
                    <span className="material-symbols-outlined text-[14px]">search_check</span>
                  </button>

                  <button
                    onClick={() => handleToggle(s)}
                    disabled={actionLoading === s.id}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50",
                      s.status === "actif"
                        ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                    )}
                    title={s.status === "actif" ? "Mettre en pause" : "Activer"}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {s.status === "actif" ? "pause" : "play_arrow"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDuplicate(s)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-background-dark text-slate-400 text-xs font-semibold hover:text-white transition-colors"
                    title="Dupliquer"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  </button>

                  <button
                    onClick={() => setDeleteTarget(s)}
                    disabled={actionLoading === s.id}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <ConfirmModal
          open
          title="Supprimer le service"
          message={`Voulez-vous vraiment supprimer "${deleteTarget.title}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* SEO Editor Modal */}
      {seoService && (
        <SeoEditor
          serviceId={seoService.id}
          serviceTitle={seoService.title}
          onClose={() => setSeoService(null)}
        />
      )}
    </div>
  );
}
