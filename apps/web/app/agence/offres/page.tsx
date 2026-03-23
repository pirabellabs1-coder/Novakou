"use client";

import { useState, useEffect, useMemo } from "react";
import { useToastStore } from "@/store/toast";
import { useAgencyStore } from "@/store/agency";
import { cn } from "@/lib/utils";

type OfferStatus = "en_attente" | "acceptee" | "refusee" | "expiree";

interface CustomOffer {
  id: string;
  client: string;
  clientInitials: string;
  projectTitle: string;
  description: string;
  amount: number;
  deadline: string;
  status: OfferStatus;
  createdAt: string;
}

const STATUS_MAP: Record<OfferStatus, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-400" },
  acceptee: { label: "Acceptée", cls: "bg-emerald-500/20 text-emerald-400" },
  refusee: { label: "Refusée", cls: "bg-red-500/20 text-red-400" },
  expiree: { label: "Expirée", cls: "bg-slate-500/20 text-slate-400" },
};

const FILTER_TABS = [
  { key: "toutes", label: "Toutes" },
  { key: "en_attente", label: "En attente" },
  { key: "acceptee", label: "Acceptées" },
  { key: "refusee", label: "Refusées" },
  { key: "expiree", label: "Expirées" },
];

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function AgenceOffres() {
  const { orders, clients, syncAll, isLoading } = useAgencyStore();
  const { addToast } = useToastStore();
  const [filter, setFilter] = useState("toutes");
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailOffer, setDetailOffer] = useState<CustomOffer | null>(null);

  // Create form state
  const [formClient, setFormClient] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDeadline, setFormDeadline] = useState("");

  useEffect(() => { syncAll(); }, [syncAll]);

  // Derive offers from orders (each order can represent a custom offer from the agency)
  const offers = useMemo<CustomOffer[]>(() => {
    return orders.map((o) => {
      let status: OfferStatus = "en_attente";
      if (o.status === "en_cours" || o.status === "termine" || o.status === "livre") status = "acceptee";
      else if (o.status === "annule") status = "refusee";
      return {
        id: `OFF-${o.id.slice(-4).toUpperCase()}`,
        client: o.clientName,
        clientInitials: getInitials(o.clientName),
        projectTitle: o.serviceTitle,
        description: `Commande pour le service "${o.serviceTitle}" — forfait ${o.packageType}`,
        amount: o.amount,
        deadline: o.deadline.slice(0, 10),
        status,
        createdAt: o.createdAt.slice(0, 10),
      };
    });
  }, [orders]);

  const filtered = filter === "toutes" ? offers : offers.filter((o) => o.status === filter);

  const stats = useMemo(() => {
    const total = offers.length;
    const enAttente = offers.filter((o) => o.status === "en_attente").length;
    const acceptees = offers.filter((o) => o.status === "acceptee").length;
    const caTotal = offers.filter((o) => o.status === "acceptee").reduce((s, o) => s + o.amount, 0);
    return [
      { label: "Offres envoyées", value: total.toString(), icon: "local_offer", color: "text-primary" },
      { label: "En attente", value: enAttente.toString(), icon: "hourglass_top", color: "text-amber-400" },
      { label: "Acceptées", value: acceptees.toString(), icon: "check_circle", color: "text-emerald-400" },
      { label: "CA potentiel", value: `\u20AC${caTotal.toLocaleString("fr-FR")}`, icon: "payments", color: "text-blue-400" },
    ];
  }, [offers]);

  const clientNames = useMemo(() => clients.map((c) => c.name), [clients]);

  function resetForm() {
    setFormClient(""); setFormTitle(""); setFormDescription(""); setFormAmount(""); setFormDeadline("");
  }

  function submitCreate() {
    if (!formClient.trim()) { addToast("error", "Sélectionnez un client."); return; }
    if (!formTitle.trim()) { addToast("error", "Saisissez un titre."); return; }
    if (!formAmount.trim()) { addToast("error", "Saisissez un montant."); return; }
    addToast("success", `Offre "${formTitle}" envoyée à ${formClient} !`);
    resetForm();
    setShowCreate(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Offres personnalisées</h1>
          <p className="text-slate-400 text-sm mt-1">Envoyez des devis sur mesure à vos clients.</p>
        </div>
        <button onClick={() => { resetForm(); setShowCreate(true); }}
          className="px-4 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          Nouvelle offre
        </button>
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

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              filter === f.key ? "bg-primary text-background-dark" : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Offer cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">local_offer</span>
            <p className="text-slate-500 font-semibold">Aucune offre personnalisée</p>
            <p className="text-slate-600 text-xs mt-1">Créez une offre sur mesure pour vos clients</p>
          </div>
        ) : (
          filtered.map((o) => (
            <div key={o.id} className="bg-neutral-dark rounded-xl border border-border-dark p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                    {o.clientInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-bold text-white truncate">{o.projectTitle}</p>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", STATUS_MAP[o.status]?.cls)}>
                        {STATUS_MAP[o.status]?.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{o.client} · {o.id}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-white">&euro;{o.amount.toLocaleString("fr-FR")}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Montant</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{o.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Deadline : {new Date(o.deadline).toLocaleDateString("fr-FR")}
                </span>
                <button onClick={() => { setDetailOffer(o); setShowDetail(true); }}
                  className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors" title="Voir">
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      {showDetail && detailOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-white pr-4">{detailOffer.projectTitle}</h3>
              <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">{detailOffer.clientInitials}</div>
                <div>
                  <p className="font-semibold text-white">{detailOffer.client}</p>
                  <p className="text-xs text-slate-500">{detailOffer.id}</p>
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto", STATUS_MAP[detailOffer.status]?.cls)}>
                  {STATUS_MAP[detailOffer.status]?.label}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{detailOffer.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                  <p className="text-lg font-black text-white">&euro;{detailOffer.amount.toLocaleString("fr-FR")}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Montant</p>
                </div>
                <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                  <p className="text-sm font-black text-white">{new Date(detailOffer.deadline).toLocaleDateString("fr-FR")}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Deadline</p>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} className="w-full py-2.5 text-slate-400 text-sm font-semibold hover:text-white">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Nouvelle offre personnalisée</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Client</label>
                {clientNames.length > 0 ? (
                  <select value={formClient} onChange={(e) => setFormClient(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50">
                    <option value="">Sélectionner un client...</option>
                    {clientNames.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input value={formClient} onChange={(e) => setFormClient(e.target.value)} placeholder="Nom du client..."
                    className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50" />
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Titre du projet</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex : Refonte site e-commerce"
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Décrivez la prestation..." rows={3}
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Montant (EUR)</label>
                  <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="5000"
                    className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Délai</label>
                  <input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white">Annuler</button>
                <button onClick={submitCreate} className="flex-1 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all">Envoyer l&apos;offre</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
