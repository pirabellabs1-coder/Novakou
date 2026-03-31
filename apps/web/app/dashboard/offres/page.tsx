"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";
import { useMessagingStore } from "@/store/messaging";

interface Offre {
  id: string;
  client: string;
  clientId?: string;
  clientEmail?: string;
  title: string;
  amount: number;
  delay: string;
  revisions: number;
  description: string;
  validityDays: number;
  status: "en_attente" | "vue" | "acceptee" | "refusee" | "expiree";
  sentAt: string;
  expiresAt: string;
}

const STATUS_CONFIG = {
  en_attente: { label: "En attente", color: "bg-blue-500/10 text-blue-400", iconName: "schedule" },
  vue: { label: "Vue", color: "bg-primary/10 text-primary", iconName: "visibility" },
  acceptee: { label: "Acceptée", color: "bg-emerald-500/10 text-emerald-400", iconName: "check_circle" },
  refusee: { label: "Refusée", color: "bg-red-500/10 text-red-400", iconName: "cancel" },
  expiree: { label: "Expirée", color: "bg-slate-500/10 text-slate-500", iconName: "schedule" },
};

const TABS = [
  { label: "Toutes", statuses: ["en_attente", "vue", "acceptee", "refusee", "expiree"] },
  { label: "En attente", statuses: ["en_attente", "vue"] },
  { label: "Acceptées", statuses: ["acceptee"] },
  { label: "Archivées", statuses: ["refusee", "expiree"] },
];

type NewOffer = {
  client: string;
  clientId: string;
  clientEmail: string;
  title: string;
  amount: string;
  delay: string;
  revisions: string;
  description: string;
  expiry: string;
};

const EMPTY_FORM: NewOffer = {
  client: "",
  clientId: "",
  clientEmail: "",
  title: "",
  amount: "",
  delay: "",
  revisions: "2",
  description: "",
  expiry: "14",
};

export default function OffresPage() {
  const addToast = useToastStore((s) => s.addToast);
  const { conversations, syncFromApi: syncMessages } = useMessagingStore();
  const [activeTab, setActiveTab] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewOffer>({ ...EMPTY_FORM });
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Extract unique client contacts from messaging conversations
  const clientContacts = useMemo(() => {
    const seen = new Set<string>();
    const contacts: { id: string; name: string; avatar?: string }[] = [];
    (conversations || []).forEach((conv) => {
      (conv.participants || []).forEach((p) => {
        if ((p.role === "client" || p.role === "CLIENT") && !seen.has(p.id)) {
          seen.add(p.id);
          contacts.push({ id: p.id, name: p.name, avatar: p.avatar });
        }
      });
    });
    return contacts;
  }, [conversations]);

  // Load messaging contacts on mount
  useEffect(() => {
    if (!conversations || conversations.length === 0) {
      syncMessages();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOffres = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offres");
      if (res.ok) {
        const data = await res.json();
        setOffres(data.offres || data.offers || []);
      }
    } catch (err) {
      console.error("Erreur chargement offres:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffres();
  }, [fetchOffres]);

  const activeStatuses = TABS.find((t) => t.label === activeTab)?.statuses ?? [];
  const filtered = offres.filter(
    (o) =>
      activeStatuses.includes(o.status) &&
      (o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.client.toLowerCase().includes(search.toLowerCase()))
  );

  function handleChange(field: keyof NewOffer, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.clientId || !form.client || !form.title || !form.amount || !form.delay || !form.description) {
      addToast("warning", "Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/offres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: form.client,
          clientId: form.clientId,
          title: form.title,
          amount: Number(form.amount),
          delay: form.delay,
          revisions: Number(form.revisions),
          description: form.description,
          validityDays: Number(form.expiry),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOffres((prev) => [data.offre, ...prev]);
        setForm({ ...EMPTY_FORM });
        setShowForm(false);
        addToast("success", "Offre envoyée avec succès !");
      } else {
        const err = await res.json();
        addToast("error", err.error || "Erreur lors de l'envoi");
      }
    } catch {
      addToast("error", "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/offres/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOffres((prev) => prev.filter((o) => o.id !== id));
        addToast("success", "Offre supprimée");
      } else {
        addToast("error", "Erreur lors de la suppression");
      }
    } catch {
      addToast("error", "Erreur réseau");
    }
  }

  function handleDuplicate(offre: Offre) {
    setForm({
      client: offre.client,
      clientId: offre.clientId || "",
      clientEmail: offre.clientEmail || "",
      title: offre.title,
      amount: String(offre.amount),
      delay: offre.delay,
      revisions: String(offre.revisions),
      description: offre.description,
      expiry: String(offre.validityDays),
    });
    setShowForm(true);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100">Offres personnalisées</h2>
          <p className="text-sm text-slate-400 mt-0.5">Devis sur mesure envoyés à vos clients</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-base leading-none">add</span>
          Nouvelle offre
        </button>
      </div>

      {/* New offer form */}
      {showForm && (
        <div className="bg-background-dark/50 rounded-2xl border border-border-dark p-6">
          <h3 className="text-base font-black text-slate-100 mb-5">Créer une offre personnalisée</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Client *</label>
              {clientContacts.length > 0 ? (
                <select
                  value={form.clientId}
                  onChange={(e) => {
                    const contact = clientContacts.find((c) => c.id === e.target.value);
                    setForm((prev) => ({ ...prev, clientId: e.target.value, client: contact?.name || "" }));
                  }}
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Sélectionner un client...</option>
                  {clientContacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-background-dark border border-amber-500/30 rounded-xl px-3 py-2.5 text-sm text-amber-400">
                  Aucun contact — démarrez une conversation avec un client d&apos;abord
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Titre de l&apos;offre *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Ex: Développement API REST"
                className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Montant (€) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="Ex: 1200"
                className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Délai de livraison *</label>
              <input
                type="text"
                value={form.delay}
                onChange={(e) => handleChange("delay", e.target.value)}
                placeholder="Ex: 10 jours"
                className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Révisions incluses</label>
              <select
                value={form.revisions}
                onChange={(e) => handleChange("revisions", e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {["1", "2", "3", "5"].map((v) => (
                  <option key={v} value={v}>{v} révision{v === "1" ? "" : "s"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Durée de validité</label>
              <select
                value={form.expiry}
                onChange={(e) => handleChange("expiry", e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {["7", "14", "30"].map((v) => (
                  <option key={v} value={v}>{v} jours</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Description de la prestation *</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Décrivez précisément ce que vous allez livrer, les technologies utilisées, les livrables attendus…"
                rows={4}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-primary hover:opacity-90 text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
              {submitting ? "Envoi..." : "Envoyer l'offre"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
              className="px-4 py-2.5 border border-border-dark rounded-xl text-sm font-bold text-slate-400 hover:bg-primary/5 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Tabs + search */}
      <div className="bg-background-dark/50 rounded-2xl border border-border-dark overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-border-dark">
          <div className="flex gap-1 bg-neutral-dark rounded-xl p-1">
            {TABS.map((t) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(t.label)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                  activeTab === t.label ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-neutral-dark rounded-xl px-3 py-2 flex-1 sm:max-w-xs sm:ml-auto">
            <span className="material-symbols-outlined text-base leading-none text-slate-500">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl leading-none text-slate-600 mx-auto mb-3 block">sell</span>
            <p className="text-slate-500 font-semibold">Aucune offre dans cette catégorie</p>
          </div>
        ) : (
          <div className="divide-y divide-border-dark">
            {filtered.map((o) => {
              const s = STATUS_CONFIG[o.status];
              const isActive = ["en_attente", "vue"].includes(o.status);
              const daysLeft = isActive
                ? Math.max(0, Math.ceil((new Date(o.expiresAt).getTime() - Date.now()) / 86400000))
                : 0;

              return (
                <div key={o.id} className="px-5 py-5 hover:bg-primary/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-100 line-clamp-1">{o.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                            <span>{o.id}</span>
                            <span>·</span>
                            <span>{o.client}</span>
                            <span>·</span>
                            <span>Envoyée le {new Date(o.sentAt).toLocaleDateString("fr-FR")}</span>
                            {isActive && daysLeft <= 3 && (
                              <>
                                <span>·</span>
                                <span className="text-amber-400 font-semibold">Expire dans {daysLeft}j</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${s.color}`}>
                          <span className="material-symbols-outlined text-sm leading-none">{s.iconName}</span>
                          {s.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{o.description}</p>

                      <div className="flex items-center gap-2 sm:gap-4 text-xs text-slate-500 flex-wrap">
                        <span>Montant : <span className="font-black text-slate-100">€{(o.amount ?? 0).toLocaleString("fr-FR")}</span></span>
                        <span className="hidden sm:inline">·</span>
                        <span>Délai : <span className="font-semibold text-slate-300">{o.delay}</span></span>
                        <span className="hidden sm:inline">·</span>
                        <span>{o.revisions} révisions</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleDuplicate(o)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        title="Dupliquer"
                      >
                        <span className="material-symbols-outlined text-sm leading-none">content_copy</span>
                      </button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Supprimer"
                      >
                        <span className="material-symbols-outlined text-sm leading-none">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
