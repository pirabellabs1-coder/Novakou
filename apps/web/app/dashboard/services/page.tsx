"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const TABS = ["Actifs", "En attente", "En pause", "Brouillons", "Refusés"];
const STATUS_MAP: Record<string, string> = {
  Actifs: "actif",
  "En attente": "en_attente",
  "En pause": "pause",
  Brouillons: "brouillon",
  "Refusés": "refuse",
};

export default function ServicesPage() {
  const { services, toggleServiceStatus, deleteService, addService, apiToggleService, apiDeleteService } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState("Actifs");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [statsModal, setStatsModal] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const perPage = 4;

  const filtered = useMemo(() => {
    let result = services.filter((s) => s.status === STATUS_MAP[activeTab]);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    }
    return result;
  }, [services, activeTab, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const totals = useMemo(() =>
    services.reduce(
      (acc, s) => ({
        views: acc.views + s.views,
        clicks: acc.clicks + s.clicks,
        revenue: acc.revenue + s.revenue,
        orders: acc.orders + s.orders,
      }),
      { views: 0, clicks: 0, revenue: 0, orders: 0 }
    ), [services]);

  // Stats pour tendances (simule un delta)
  const trends = useMemo(() => ({
    views: 15,
    clicks: 5.2,
    revenue: 0,
  }), []);

  async function handleToggle(id: string) {
    const svc = services.find((s) => s.id === id);
    const success = await apiToggleService(id);
    if (success) {
      addToast("success", svc?.status === "actif" ? "Service mis en pause" : "Service activé !");
    } else {
      // Fallback to local toggle
      toggleServiceStatus(id);
      addToast("success", svc?.status === "actif" ? "Service mis en pause" : "Service activé !");
    }
  }

  async function handleDelete(id: string) {
    const success = await apiDeleteService(id);
    if (success) {
      addToast("success", "Service supprimé avec succès");
    } else {
      // Fallback to local delete
      deleteService(id);
      addToast("success", "Service supprimé avec succès");
    }
    setDeleteModal(null);
  }

  function handleDuplicate(id: string) {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    addService({
      title: svc.title + " (copie)",
      category: svc.category,
      subcategory: svc.subcategory,
      description: svc.description,
      tags: svc.tags,
      image: svc.image,
      status: "brouillon",
      price: svc.price,
      deliveryDays: svc.deliveryDays,
      revisions: svc.revisions,
      packages: svc.packages,
      faq: svc.faq,
      extras: svc.extras,
    });
    addToast("success", "Service duplique en brouillon !");
  }

  const statsService = services.find((s) => s.id === statsModal);

  return (
    <div className="max-w-full space-y-8">
      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={!!deleteModal}
        title="Supprimer le service"
        message="Etes-vous sur de vouloir supprimer ce service ? Cette action est irreversible."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => deleteModal && handleDelete(deleteModal)}
        onCancel={() => setDeleteModal(null)}
      />

      {/* Stats Modal */}
      {statsService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setStatsModal(null)} />
          <div className="relative bg-background-dark border border-border-dark rounded-2xl w-full max-w-lg p-6 animate-scale-in shadow-2xl">
            <button onClick={() => setStatsModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <img src={statsService.image} alt={statsService.title} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <h3 className="font-bold text-sm">{statsService.title}</h3>
                <p className="text-xs text-primary">{statsService.category}</p>
              </div>
            </div>
            <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Statistiques detaillees
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-neutral-dark border border-border-dark rounded-xl p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Vues</p>
                <p className="text-2xl font-extrabold">{statsService.views >= 1000 ? `${(statsService.views / 1000).toFixed(1)}k` : statsService.views}</p>
              </div>
              <div className="bg-neutral-dark border border-border-dark rounded-xl p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Clics</p>
                <p className="text-2xl font-extrabold">{statsService.clicks}</p>
              </div>
              <div className="bg-neutral-dark border border-border-dark rounded-xl p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Commandes</p>
                <p className="text-2xl font-extrabold">{statsService.orders}</p>
              </div>
              <div className="bg-neutral-dark border border-border-dark rounded-xl p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Revenus</p>
                <p className="text-2xl font-extrabold text-primary">{statsService.revenue} €</p>
              </div>
            </div>
            {/* Performance Metrics */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-400">Taux de conversion</p>
                  <p className="text-xs font-bold text-primary">{statsService.conversionRate}%</p>
                </div>
                <div className="w-full h-2 bg-border-dark rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(statsService.conversionRate * 10, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-400">Taux de clics (CTR)</p>
                  <p className="text-xs font-bold text-primary">{statsService.views > 0 ? ((statsService.clicks / statsService.views) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="w-full h-2 bg-border-dark rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${statsService.views > 0 ? Math.min((statsService.clicks / statsService.views) * 100, 100) : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-400">Revenu moyen par commande</p>
                  <p className="text-xs font-bold">{statsService.orders > 0 ? Math.round(statsService.revenue / statsService.orders) : 0} €</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">Date de creation</p>
                <p className="text-xs font-bold">{new Date(statsService.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border-dark flex gap-3">
              <Link href={`/dashboard/services/creer?edit=${statsService.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">
                <span className="material-symbols-outlined text-sm">edit</span> Modifier le service
              </Link>
              <button onClick={() => setStatsModal(null)}
                className="px-4 py-2.5 border border-border-dark text-slate-300 rounded-xl text-sm font-bold hover:bg-primary/10 transition-all">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Mes Services</h1>
          <p className="text-primary/60 mt-1">Gerez, analysez et optimisez vos offres pour maximiser vos revenus.</p>
        </div>
        <Link
          href="/dashboard/services/creer"
          className="inline-flex items-center gap-2 bg-primary hover:scale-105 active:scale-95 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Creer un service
        </Link>
      </div>

      {/* Stats Cards — 3 cards matching mockup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-primary/60 text-sm font-semibold uppercase tracking-wider">Total Vues</p>
            <span className="material-symbols-outlined text-primary">visibility</span>
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter value={totals.views} className="text-3xl font-black block" />
            <p className="text-primary text-sm font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">trending_up</span> {trends.views}%
            </p>
          </div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-primary/60 text-sm font-semibold uppercase tracking-wider">Total Clics</p>
            <span className="material-symbols-outlined text-primary">ads_click</span>
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter value={totals.clicks} className="text-3xl font-black block" />
            <p className="text-primary text-sm font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">trending_up</span> {trends.clicks}%
            </p>
          </div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-primary/60 text-sm font-semibold uppercase tracking-wider">Revenus Estimes</p>
            <span className="material-symbols-outlined text-primary">payments</span>
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter value={totals.revenue} suffix=" €" className="text-3xl font-black block" />
            {trends.revenue > 0 ? (
              <p className="text-primary text-sm font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">trending_up</span> {trends.revenue}%
              </p>
            ) : (
              <p className="text-amber-500 text-sm font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">trending_flat</span> 0%
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Services Table Card */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden shadow-xl">
        {/* Tabs */}
        <div className="px-6 flex gap-8 border-b border-primary/20">
          {TABS.map((tab) => {
            const count = services.filter((s) => s.status === STATUS_MAP[tab]).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={cn(
                  "flex items-center gap-2 pb-4 pt-5 text-sm font-bold transition-colors border-b-2",
                  isActive ? "border-primary text-primary" : "border-transparent text-primary/40 hover:text-primary/70"
                )}
              >
                {tab}{" "}
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs",
                  isActive ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary/40"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary/10">
                <th className="px-6 py-4 text-primary/80 font-bold text-xs uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-primary/80 font-bold text-xs uppercase tracking-wider">Stats</th>
                <th className="px-6 py-4 text-primary/80 font-bold text-xs uppercase tracking-wider">Ventes</th>
                <th className="px-6 py-4 text-primary/80 font-bold text-xs uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-primary/80 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">inventory_2</span>
                    <p className="text-slate-400 font-semibold">Aucun service {activeTab.toLowerCase()} trouve.</p>
                    <p className="text-xs text-slate-500 mt-1">Creez votre premier service pour commencer.</p>
                  </td>
                </tr>
              )}
              {paginated.map((s) => {
                const isPaused = s.status === "pause";
                const progressPct = s.views > 0 ? Math.min((s.clicks / s.views) * 100, 100) : 0;
                return (
                  <tr key={s.id} className={cn(
                    "hover:bg-primary/5 transition-colors group",
                    isPaused && "opacity-70"
                  )}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-lg overflow-hidden flex-shrink-0",
                          isPaused && "grayscale"
                        )}>
                          <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-primary transition-colors">{s.title}</p>
                          <p className="text-xs text-primary/50 mt-0.5">A partir de {s.price}€ · {s.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <span className={cn("text-xs font-semibold flex items-center gap-1", isPaused ? "text-primary/40" : "text-primary/60")}>
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            {s.views >= 1000 ? `${(s.views / 1000).toFixed(1)}k` : s.views}
                          </span>
                          <span className={cn("text-xs font-semibold flex items-center gap-1", isPaused ? "text-primary/40" : "text-primary/60")}>
                            <span className="material-symbols-outlined text-[14px]">ads_click</span>
                            {s.clicks}
                          </span>
                        </div>
                        <div className="w-24 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", isPaused ? "bg-primary/40" : "bg-primary")} style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn("flex flex-col", isPaused && s.orders === 0 && "opacity-70")}>
                        <p className="text-sm font-bold text-slate-100">{s.orders} commande{s.orders !== 1 ? "s" : ""}</p>
                        <p className={cn("text-xs font-medium", s.revenue > 0 ? "text-primary" : "text-slate-500")}>{s.revenue}€ generes</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border",
                        s.status === "actif" && "bg-primary/20 text-primary border-primary/30",
                        s.status === "pause" && "bg-primary/10 text-primary/40 border-primary/20",
                        s.status === "brouillon" && "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          s.status === "actif" && "bg-primary",
                          s.status === "pause" && "bg-primary/40",
                          s.status === "brouillon" && "bg-slate-400"
                        )} />
                        {s.status === "actif" ? "Actif" : s.status === "pause" ? "En pause" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === "actif" && (
                          <Link
                            href={`/services/${s.id}`}
                            target="_blank"
                            className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                            title="Voir en ligne"
                          >
                            <span className="material-symbols-outlined">open_in_new</span>
                          </Link>
                        )}
                        {isPaused && (
                          <button
                            onClick={() => handleToggle(s.id)}
                            className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                            title="Activer"
                          >
                            <span className="material-symbols-outlined">play_circle</span>
                          </button>
                        )}
                        {s.status === "actif" && (
                          <button
                            onClick={() => handleToggle(s.id)}
                            className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                            title="Mettre en pause"
                          >
                            <span className="material-symbols-outlined">pause_circle</span>
                          </button>
                        )}
                        <Link
                          href={`/dashboard/services/creer?edit=${s.id}`}
                          className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                          title="Modifier"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </Link>
                        <Link
                          href="/dashboard/services/seo"
                          className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                          title="Optimiser le SEO"
                        >
                          <span className="material-symbols-outlined">search_check</span>
                        </Link>
                        <Link
                          href="/dashboard/boost"
                          className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"
                          title="Booster"
                        >
                          <span className="material-symbols-outlined">rocket_launch</span>
                        </Link>
                        <button
                          onClick={() => setStatsModal(s.id)}
                          className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                          title="Statistiques"
                        >
                          <span className="material-symbols-outlined">bar_chart</span>
                        </button>
                        <button
                          onClick={() => handleDuplicate(s.id)}
                          className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                          title="Dupliquer"
                        >
                          <span className="material-symbols-outlined">content_copy</span>
                        </button>
                        <button
                          onClick={() => setDeleteModal(s.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-primary/20">
            <p className="text-sm text-primary/60">
              Affichage de {(currentPage - 1) * perPage + 1} a{" "}
              {Math.min(currentPage * perPage, filtered.length)} sur {filtered.length} services {activeTab.toLowerCase()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-primary/20 text-sm font-semibold hover:bg-primary/10 disabled:opacity-50 transition-colors"
              >
                Precedent
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-primary/20 text-sm font-semibold hover:bg-primary/10 disabled:opacity-50 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tips / Upsell Section — from mockup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary/10 to-transparent p-8 rounded-2xl border border-primary/20">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4">
            <span className="material-symbols-outlined">lightbulb</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Booster vos services</h3>
          <p className="text-primary/70 mb-4 text-sm leading-relaxed">
            Les services avec une video de presentation recoivent en moyenne 35% de commandes en plus. Pensez a ajouter un media engageant !
          </p>
          <button className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
            En savoir plus <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/20">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Rapport Mensuel</h3>
          <p className="text-primary/70 mb-4 text-sm leading-relaxed">
            Votre taux de conversion a augmente de 2.4% ce mois-ci. Continuez ainsi pour atteindre le niveau de &quot;Top Seller&quot;.
          </p>
          <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all">
            Voir les insights complets
          </button>
        </div>
      </div>
    </div>
  );
}
