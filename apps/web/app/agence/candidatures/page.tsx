"use client";

import { useState, useEffect, useMemo } from "react";
import { useToastStore } from "@/store/toast";
import { useAgencyStore } from "@/store/agency";
import { cn } from "@/lib/utils";
import { feedApi } from "@/lib/api-client";
import type { ApiService } from "@/lib/api-client";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-400" },
  vue: { label: "Vue", cls: "bg-blue-500/20 text-blue-400" },
  acceptee: { label: "Acceptee", cls: "bg-emerald-500/20 text-emerald-400" },
  refusee: { label: "Refusee", cls: "bg-red-500/20 text-red-400" },
};

const URGENCY_MAP: Record<string, { cls: string }> = {
  Normale: { cls: "bg-slate-500/20 text-slate-400" },
  Urgente: { cls: "bg-amber-500/20 text-amber-400" },
  "Tres urgente": { cls: "bg-red-500/20 text-red-400" },
};

export default function AgenceCandidatures() {
  const { orders, syncAll, isLoading } = useAgencyStore();
  const { addToast } = useToastStore();
  const [tab, setTab] = useState<"offres" | "candidatures">("offres");
  const [feedServices, setFeedServices] = useState<ApiService[]>([]);
  const [showApply, setShowApply] = useState(false);
  const [selectedService, setSelectedService] = useState<ApiService | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedDeadline, setProposedDeadline] = useState("");

  useEffect(() => { syncAll(); }, [syncAll]);

  // Load available services/projects from feed
  useEffect(() => {
    feedApi.list().then((d) => setFeedServices(d.services || [])).catch(() => {});
  }, []);

  // Derive candidatures from orders where agency applied
  const candidatures = useMemo(() => {
    return orders.filter((o) => ["en_attente", "en_cours"].includes(o.status)).map((o) => ({
      id: o.id,
      offerTitle: o.serviceTitle,
      client: o.clientName,
      proposedPrice: o.amount,
      proposedDeadline: o.deadline,
      status: o.status === "en_cours" ? "acceptee" : "en_attente",
      submittedAt: o.createdAt,
    }));
  }, [orders]);

  const stats = useMemo(() => {
    const total = candidatures.length;
    const enAttente = candidatures.filter((c) => c.status === "en_attente").length;
    const acceptees = candidatures.filter((c) => c.status === "acceptee").length;
    const taux = total > 0 ? Math.round((acceptees / total) * 100) : 0;
    return [
      { label: "Candidatures envoyees", value: total.toString(), icon: "send", color: "text-primary" },
      { label: "En attente", value: enAttente.toString(), icon: "hourglass_top", color: "text-amber-400" },
      { label: "Acceptees", value: acceptees.toString(), icon: "check_circle", color: "text-emerald-400" },
      { label: "Taux acceptation", value: `${taux}%`, icon: "trending_up", color: "text-blue-400" },
    ];
  }, [candidatures]);

  function openApply(service: ApiService) {
    setSelectedService(service);
    setCoverLetter("");
    setProposedPrice("");
    setProposedDeadline("");
    setShowApply(true);
  }

  function submitApplication() {
    if (!coverLetter.trim()) { addToast("error", "Veuillez rediger une lettre de motivation."); return; }
    if (!proposedPrice.trim()) { addToast("error", "Veuillez indiquer un prix propose."); return; }
    addToast("success", `Candidature envoyee pour "${selectedService?.title}" !`);
    setShowApply(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Candidatures</h1>
        <p className="text-slate-400 text-sm mt-1">Postulez aux offres et suivez vos candidatures.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
            <span className={cn("material-symbols-outlined text-xl", s.color)}>{s.icon}</span>
            <div>
              <p className="text-xl font-black text-white">{isLoading ? "..." : s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "offres" as const, label: "Offres disponibles" },
          { key: "candidatures" as const, label: `Nos candidatures (${candidatures.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              tab === t.key ? "bg-primary text-background-dark" : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Offres tab */}
      {tab === "offres" && (
        <div className="space-y-3">
          {feedServices.length === 0 ? (
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">work</span>
              <p className="text-slate-500 font-semibold">Aucune offre disponible pour le moment</p>
              <p className="text-slate-600 text-xs mt-1">Les projets clients apparaitront ici</p>
            </div>
          ) : (
            feedServices.slice(0, 10).map((s) => (
              <div key={s.id} className="bg-neutral-dark rounded-xl border border-border-dark p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-bold text-white">{s.title}</p>
                    <p className="text-xs text-slate-500">{s.vendorName} · {s.categoryName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-white">&euro;{(s.basePrice ?? 0).toLocaleString("fr-FR")}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Prix</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {s.tags.slice(0, 4).map((t) => (
                    <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{s.deliveryDays}j de livraison</span>
                  <button onClick={() => openApply(s)}
                    className="px-3 py-1.5 bg-primary text-background-dark text-xs font-bold rounded-lg hover:brightness-110 transition-all">
                    Postuler
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Candidatures tab */}
      {tab === "candidatures" && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
          {candidatures.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">send</span>
              <p className="text-slate-500 font-semibold">Aucune candidature envoyee</p>
              <p className="text-slate-600 text-xs mt-1">Postez aux offres pour voir vos candidatures ici</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                  <th className="px-5 py-3 text-left font-semibold">Offre</th>
                  <th className="px-5 py-3 text-left font-semibold">Client</th>
                  <th className="px-5 py-3 text-left font-semibold">Prix</th>
                  <th className="px-5 py-3 text-left font-semibold">Statut</th>
                  <th className="px-5 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {candidatures.map((a) => (
                  <tr key={a.id} className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-white truncate max-w-[220px]">{a.offerTitle}</td>
                    <td className="px-5 py-3 text-sm text-slate-300">{a.client}</td>
                    <td className="px-5 py-3 text-sm font-bold text-white">&euro;{(a.proposedPrice ?? 0).toLocaleString("fr-FR")}</td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_MAP[a.status]?.cls)}>
                        {STATUS_MAP[a.status]?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{new Date(a.submittedAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Apply modal */}
      {showApply && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowApply(false)} />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Postuler</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedService.title}</p>
              </div>
              <button onClick={() => setShowApply(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Lettre de motivation</label>
                <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Presentez votre agence..." rows={5}
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Prix propose (EUR)</label>
                  <input type="number" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder={selectedService.basePrice.toString()}
                    className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Delai propose</label>
                  <input type="date" value={proposedDeadline} onChange={(e) => setProposedDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowApply(false)} className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white">Annuler</button>
                <button onClick={submitApplication} className="flex-1 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all">Envoyer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
