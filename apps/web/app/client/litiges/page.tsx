"use client";

import { useState, useEffect } from "react";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  en_cours: { label: "En cours d'examen", cls: "bg-blue-500/20 text-blue-400", icon: "pending" },
  en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-400", icon: "schedule" },
  resolu: { label: "Résolu", cls: "bg-primary/20 text-primary", icon: "check_circle" },
  rejete: { label: "Rejeté", cls: "bg-red-500/20 text-red-400", icon: "cancel" },
};

const CATEGORIES = [
  { key: "retard", label: "Retard de livraison", icon: "schedule" },
  { key: "qualite", label: "Qualité non conforme", icon: "report_problem" },
  { key: "non_livraison", label: "Non-livraison", icon: "block" },
  { key: "communication", label: "Problème de communication", icon: "chat_error" },
  { key: "autre", label: "Autre", icon: "more_horiz" },
];

function DisputeListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-border-dark" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-border-dark rounded" />
              <div className="h-3 w-1/3 bg-border-dark rounded" />
            </div>
            <div className="h-6 w-20 bg-border-dark rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClientDisputes() {
  const [view, setView] = useState<"list" | "detail" | "new">("list");
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const {
    disputes,
    orders,
    disputeFilter,
    setDisputeFilter,
    syncDisputes,
    syncOrders,
    openDispute,
    loading,
  } = useClientStore();

  // New dispute form state
  const [newDispute, setNewDispute] = useState({
    orderId: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    syncOrders().then(() => syncDisputes());
  }, [syncOrders, syncDisputes]);

  const selected = disputes.find((d) => d.id === selectedDisputeId);

  const filtered =
    disputeFilter === "all" || disputeFilter === "tous"
      ? disputes
      : disputes.filter((d) => d.status === disputeFilter);

  const isLoading = loading.disputes || loading.orders;

  async function submitDispute() {
    if (!newDispute.orderId) {
      addToast("error", "Veuillez sélectionner une commande");
      return;
    }
    if (!newDispute.category) {
      addToast("error", "Veuillez sélectionner une catégorie");
      return;
    }
    if (!newDispute.description.trim()) {
      addToast("error", "Veuillez fournir une description détaillée");
      return;
    }
    const success = await openDispute(newDispute.orderId, {
      category: newDispute.category,
      description: newDispute.description,
    });
    if (success) {
      addToast("success", "Litige soumis avec succès. Notre équipe l'examinera sous 48h.");
      setView("list");
      setNewDispute({ orderId: "", category: "", description: "" });
      await syncDisputes();
    } else {
      addToast("error", "Une erreur est survenue lors de la soumission du litige");
    }
  }

  // ─── DETAIL VIEW ───
  if (view === "detail" && selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setView("list")} className="text-primary hover:underline">Litiges</button>
          <span className="text-slate-500">&rsaquo;</span>
          <span className="text-slate-400">Cas {selected.id}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">{selected.orderTitle}</h1>
            <p className="text-slate-400 text-sm mt-1">
              Cas {selected.id} &middot; Commande : {selected.orderId} &middot; Catégorie : {selected.category}
            </p>
          </div>
          <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1", STATUS_MAP[selected.status]?.cls)}>
            <span className="material-symbols-outlined text-sm">{STATUS_MAP[selected.status]?.icon}</span>
            {STATUS_MAP[selected.status]?.label}
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">description</span>
                Description du litige
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {selected.description || "Aucune description fournie."}
              </p>
            </div>

            {/* Timeline */}
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
              <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">timeline</span>
                Suivi de la résolution
              </h3>
              <div className="space-y-6">
                {selected.timeline.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        i === selected.timeline.length - 1
                          ? "bg-primary/20 text-primary ring-4 ring-primary/10"
                          : "bg-primary text-background-dark"
                      )}>
                        <span className="material-symbols-outlined text-lg">
                          {i === 0 ? "flag" : i === selected.timeline.length - 1 ? "pending" : "check"}
                        </span>
                      </div>
                      {i < selected.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 mt-2 bg-primary" />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={cn("font-semibold text-sm", i === selected.timeline.length - 1 ? "text-primary" : "text-white")}>
                        {step.event}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(step.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} &middot; Par : {step.by}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preuves */}
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">upload_file</span>
                Preuves soumises
              </h3>
              <p className="text-sm text-slate-500">Aucun fichier soumis pour le moment.</p>
              <button
                onClick={() => addToast("info", "Upload de fichiers bientôt disponible")}
                className="mt-3 w-full py-2.5 border-2 border-dashed border-border-dark rounded-lg text-sm font-semibold text-slate-400 hover:border-primary/40 hover:text-primary transition-colors"
              >
                + Ajouter une preuve
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-4">
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 space-y-4">
              <h3 className="font-bold text-white text-sm">Actions</h3>
              <button
                onClick={() => addToast("info", "Ouverture du chat avec le support...")}
                className="w-full py-2.5 bg-primary text-background-dark text-sm font-bold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">support_agent</span>
                Contacter le support
              </button>
              <button className="w-full py-2.5 border border-border-dark text-white text-sm font-semibold rounded-lg hover:bg-neutral-dark transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">chat</span>
                Envoyer un message au freelance
              </button>
              <button className="w-full py-2.5 text-red-400 text-sm font-semibold hover:text-red-300 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">cancel</span>
                Annuler le litige
              </button>
            </div>

            <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Informations</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Référence</span>
                  <span className="text-white font-mono">{selected.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="text-white">{new Date(selected.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commande</span>
                  <span className="text-white">{selected.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Catégorie</span>
                  <span className="text-white capitalize">{selected.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── NEW DISPUTE FORM ───
  if (view === "new") {
    // Filter orders that could be disputed (not already in dispute)
    const disputeableOrders = orders.filter(
      (o) => o.status !== "litige" && o.status !== "annule"
    );

    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setView("list")} className="text-primary hover:underline">Litiges</button>
          <span className="text-slate-500">&rsaquo;</span>
          <span className="text-slate-400">Nouveau signalement</span>
        </div>

        <div>
          <h1 className="text-2xl font-black text-white">Signaler un problème</h1>
          <p className="text-slate-400 text-sm mt-1">Décrivez votre problème en détail. Notre équipe examinera votre demande sous 48h.</p>
        </div>

        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-5">
          {/* Order Selection */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
              Commande concernée *
            </label>
            {disputeableOrders.length > 0 ? (
              <select
                value={newDispute.orderId}
                onChange={(e) => setNewDispute((p) => ({ ...p, orderId: e.target.value }))}
                className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Sélectionnez une commande --</option>
                {disputeableOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id.slice(-6).toUpperCase()} - {o.serviceTitle} ({o.amount} EUR)
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-500 px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl">
                Aucune commande disponible pour un litige.
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Catégorie du problème *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setNewDispute((p) => ({ ...p, category: c.key }))}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                    newDispute.category === c.key
                      ? "border-primary bg-primary/5"
                      : "border-border-dark hover:border-primary/30"
                  )}
                >
                  <span className={cn("material-symbols-outlined", newDispute.category === c.key ? "text-primary" : "text-slate-500")}>{c.icon}</span>
                  <span className={cn("text-sm font-medium", newDispute.category === c.key ? "text-white" : "text-slate-400")}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Description détaillée *</label>
            <textarea
              value={newDispute.description}
              onChange={(e) => setNewDispute((p) => ({ ...p, description: e.target.value }))}
              rows={5}
              placeholder="Expliquez en détail ce qui s'est passé, ce que vous attendiez et ce qui a été livré..."
              className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Pièces jointes</label>
            <button
              onClick={() => addToast("info", "Upload de fichiers bientôt disponible")}
              className="w-full py-8 border-2 border-dashed border-border-dark rounded-xl text-center hover:border-primary/40 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl text-slate-500 mb-1">cloud_upload</span>
              <p className="text-sm text-slate-400 font-medium">Glissez vos fichiers ou cliquez pour parcourir</p>
              <p className="text-xs text-slate-500 mt-1">Captures d&apos;écran, documents, fichiers (max 50 MB)</p>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={submitDispute} className="px-6 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">gavel</span>
            Soumettre le litige
          </button>
          <button onClick={() => setView("list")} className="px-6 py-2.5 border border-border-dark text-slate-400 text-sm font-semibold rounded-xl hover:text-white transition-colors">
            Annuler
          </button>
        </div>

        <div className="bg-blue-500/5 rounded-xl border border-blue-500/10 p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-400 text-lg mt-0.5">info</span>
          <div>
            <p className="text-sm text-white font-semibold">Avant de soumettre un litige</p>
            <p className="text-xs text-slate-400 mt-1">Nous vous recommandons d&apos;essayer de résoudre le problème directement avec le freelance via la messagerie. 80% des litiges sont résolus par la discussion.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ───
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Litiges & Signalements</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos réclamations et suivez la résolution de vos litiges.</p>
        </div>
        <button
          onClick={() => setView("new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-lg">flag</span>
          Signaler un problème
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: disputes.length, icon: "gavel", color: "text-white" },
          { label: "En cours", value: disputes.filter((d) => d.status === "en_cours").length, icon: "pending", color: "text-blue-400" },
          { label: "En attente", value: disputes.filter((d) => d.status === "en_attente").length, icon: "schedule", color: "text-amber-400" },
          { label: "Résolus", value: disputes.filter((d) => d.status === "resolu").length, icon: "check_circle", color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3">
            <span className={cn("material-symbols-outlined text-xl", s.color)}>{s.icon}</span>
            <div>
              <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "tous", label: "Tous" },
          { key: "en_cours", label: "En cours" },
          { key: "en_attente", label: "En attente" },
          { key: "resolu", label: "Résolus" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setDisputeFilter(f.key === "tous" ? "all" : f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              (disputeFilter === "all" && f.key === "tous") || disputeFilter === f.key
                ? "bg-primary text-background-dark"
                : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Dispute Cards */}
      {isLoading ? (
        <DisputeListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">gavel</span>
          <p className="text-slate-500 font-semibold">
            {disputes.length === 0
              ? "Aucun litige en cours. Bonne nouvelle !"
              : "Aucun litige dans cette catégorie"}
          </p>
          {disputes.length === 0 && (
            <p className="text-slate-600 text-sm mt-1">
              Si vous rencontrez un problème avec une commande, vous pouvez signaler un litige.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => { setSelectedDisputeId(d.id); setView("detail"); }}
              className="w-full bg-neutral-dark rounded-xl border border-border-dark p-5 hover:border-primary/30 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    d.status === "en_cours" ? "bg-blue-500/10" : d.status === "resolu" ? "bg-primary/10" : "bg-amber-500/10"
                  )}>
                    <span className={cn(
                      "material-symbols-outlined",
                      d.status === "en_cours" ? "text-blue-400" : d.status === "resolu" ? "text-primary" : "text-amber-400"
                    )}>gavel</span>
                  </div>
                  <div>
                    <p className="font-bold text-white">{d.orderTitle}</p>
                    <p className="text-xs text-slate-500">
                      {d.id} &middot; {d.category} &middot; {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_MAP[d.status]?.cls)}>
                    {STATUS_MAP[d.status]?.label}
                  </span>
                  <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
