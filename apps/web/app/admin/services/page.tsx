"use client";

import { useState, useMemo, useEffect } from "react";
import { useToastStore } from "@/store/dashboard";
import { usePlatformDataStore } from "@/store/platform-data";
import { cn } from "@/lib/utils";

async function adminServiceAction(id: string, action: string, reason?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  actif: { label: "Actif", cls: "bg-emerald-500/20 text-emerald-400" },
  en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-400" },
  refuse: { label: "Refusé", cls: "bg-red-500/20 text-red-400" },
  pause: { label: "En pause", cls: "bg-slate-500/20 text-slate-400" },
  vedette: { label: "En vedette", cls: "bg-purple-500/20 text-purple-400" },
};

export default function AdminServices() {
  const [tab, setTab] = useState("en_attente");
  const [refuseId, setRefuseId] = useState<string | null>(null);
  const [refuseReason, setRefuseReason] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addToast } = useToastStore();
  const { services, categories, approveService, refuseService, deleteService, featureService, unfeatureService, pauseService } = usePlatformDataStore();
  const setServices = usePlatformDataStore((s) => s.setServices);

  // Load services from API on mount and merge with local data
  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.services?.length > 0) {
          // Merge: API services + local-only services (avoid duplicates)
          const apiIds = new Set(data.services.map((s: { id: string }) => s.id));
          const localOnly = services.filter((s) => !apiIds.has(s.id));
          setServices([...data.services, ...localOnly]);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (tab === "tous") return services;
    return services.filter(s => s.status === tab);
  }, [tab, services]);

  const stats = useMemo(() => ({
    en_attente: services.filter(s => s.status === "en_attente").length,
    actif: services.filter(s => s.status === "actif").length,
    refuse: services.filter(s => s.status === "refuse").length,
    vedette: services.filter(s => s.status === "vedette").length,
    pause: services.filter(s => s.status === "pause").length,
  }), [services]);

  async function handleApprove(id: string) {
    const svc = services.find(s => s.id === id);
    approveService(id);
    await adminServiceAction(id, "approve");
    addToast("success", `"${svc?.title}" approuvé — visible sur la marketplace`);
  }

  async function handleRefuse() {
    if (!refuseId || !refuseReason.trim()) { addToast("warning", "Indiquez un motif de refus"); return; }
    const svc = services.find(s => s.id === refuseId);
    refuseService(refuseId, refuseReason);
    await adminServiceAction(refuseId, "refuse", refuseReason);
    addToast("success", `"${svc?.title}" refusé`);
    setRefuseId(null);
    setRefuseReason("");
  }

  async function handleDelete() {
    if (!deleteId) return;
    const svc = services.find(s => s.id === deleteId);
    deleteService(deleteId);
    await adminServiceAction(deleteId, "delete");
    addToast("success", `"${svc?.title}" supprimé définitivement`);
    setDeleteId(null);
  }

  async function handleFeature(id: string) {
    const svc = services.find(s => s.id === id);
    featureService(id);
    await adminServiceAction(id, "feature");
    addToast("success", `"${svc?.title}" mis en vedette sur la marketplace`);
  }

  async function handleUnfeature(id: string) {
    const svc = services.find(s => s.id === id);
    unfeatureService(id);
    await adminServiceAction(id, "unfeature");
    addToast("success", `"${svc?.title}" retiré de la vedette`);
  }

  async function handlePause(id: string) {
    const svc = services.find(s => s.id === id);
    pauseService(id);
    await adminServiceAction(id, "pause");
    addToast("success", `"${svc?.title}" mis en pause`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">work</span>
          Modération des Services
        </h1>
        <p className="text-slate-400 text-sm mt-1">{services.length} services sur la plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: "En attente", value: stats.en_attente, color: "text-amber-400", icon: "hourglass_top" },
          { label: "Actifs", value: stats.actif, color: "text-emerald-400", icon: "check_circle" },
          { label: "En vedette", value: stats.vedette, color: "text-purple-400", icon: "star" },
          { label: "En pause", value: stats.pause, color: "text-slate-400", icon: "pause_circle" },
          { label: "Refusés", value: stats.refuse, color: "text-red-400", icon: "cancel" },
        ].map(s => (
          <div key={s.label} className="bg-neutral-dark rounded-xl p-4 border border-border-dark">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
              <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-dark overflow-x-auto">
        {[
          { key: "en_attente", label: "En attente", count: stats.en_attente },
          { key: "actif", label: "Actifs", count: stats.actif },
          { key: "vedette", label: "En vedette", count: stats.vedette },
          { key: "refuse", label: "Refusés", count: stats.refuse },
          { key: "pause", label: "En pause", count: stats.pause },
          { key: "tous", label: "Tous", count: services.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5", tab === t.key ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-white")}>
            {t.label}
            <span className="text-[10px] bg-border-dark px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Service cards */}
      <div className="space-y-3">
        {filtered.map(s => {
          const cat = categories.find(c => c.name === s.category);
          return (
            <div key={s.id} className="bg-neutral-dark rounded-xl border border-border-dark p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-white">{s.title}</h3>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_MAP[s.status]?.cls)}>{STATUS_MAP[s.status]?.label}</span>
                    {cat && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                        {cat.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-2 line-clamp-1">{s.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                    <span>par <b className="text-slate-300">{s.freelanceName}</b></span>
                    <span className="font-bold text-primary">€{s.price}</span>
                    {s.views > 0 && <span>{s.views.toLocaleString()} vues</span>}
                    {s.orders > 0 && <span>{s.orders} commandes</span>}
                    {s.rating > 0 && <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-amber-400 text-sm">star</span>{s.rating}</span>}
                    <span>Créé le {new Date(s.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {s.refuseReason && <p className="text-xs text-red-400/80 mt-1">Motif : {s.refuseReason}</p>}
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {s.status === "en_attente" && (
                    <>
                      <button onClick={() => handleApprove(s.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors">Approuver</button>
                      <button onClick={() => setRefuseId(s.id)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">Refuser</button>
                    </>
                  )}
                  {s.status === "actif" && (
                    <>
                      <button onClick={() => handleFeature(s.id)} className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">star</span>Vedette
                      </button>
                      <button onClick={() => handlePause(s.id)} className="px-3 py-1.5 bg-border-dark text-slate-300 text-xs font-bold rounded-lg hover:bg-border-dark/80 transition-colors">Pause</button>
                    </>
                  )}
                  {s.status === "vedette" && (
                    <button onClick={() => handleUnfeature(s.id)} className="px-3 py-1.5 bg-border-dark text-slate-300 text-xs font-bold rounded-lg hover:bg-border-dark/80 transition-colors">Retirer vedette</button>
                  )}
                  {(s.status === "pause" || s.status === "refuse") && (
                    <button onClick={() => handleApprove(s.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors">Réactiver</button>
                  )}
                  <button onClick={() => setDeleteId(s.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-600">check_circle</span>
            <p className="text-slate-400 mt-2">Aucun service dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* Modal Refus */}
      {refuseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRefuseId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-md border border-border-dark shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4">Motif de refus</h3>
            <textarea value={refuseReason} onChange={e => setRefuseReason(e.target.value)} rows={3} placeholder="Expliquez pourquoi ce service est refusé..." className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-white placeholder:text-slate-500 outline-none resize-none mb-4 focus:ring-2 focus:ring-primary/30" />
            <div className="flex gap-3">
              <button onClick={() => setRefuseId(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleRefuse} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">Confirmer le refus</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-sm border border-border-dark shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><span className="material-symbols-outlined text-red-400">warning</span></div>
              <h3 className="font-bold text-lg text-white">Supprimer ce service ?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">Cette action est irréversible. Le service sera retiré de la plateforme.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
