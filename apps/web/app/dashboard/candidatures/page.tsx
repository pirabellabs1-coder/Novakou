"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Project {
  id: string;
  clientName: string;
  clientCountry: string;
  clientRating: number;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  urgency: "normale" | "urgente" | "tres_urgente";
  contractType: "ponctuel" | "long_terme" | "recurrent";
  skills: string[];
  proposals: number;
  postedAt: string;
}

interface Candidature {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  proposedPrice: number;
  deliveryDays: number;
  status: "en_attente" | "vue" | "acceptee" | "refusee";
  submittedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CFG: Record<string, { label: string; color: string; icon: string }> = {
  en_attente: { label: "En attente", color: "bg-blue-500/10 text-blue-400", icon: "schedule" },
  vue: { label: "Vue", color: "bg-amber-500/10 text-amber-400", icon: "visibility" },
  acceptee: { label: "Acceptée", color: "bg-emerald-500/10 text-emerald-400", icon: "check_circle" },
  refusee: { label: "Refusée", color: "bg-red-500/10 text-red-400", icon: "cancel" },
};

const URGENCY_CFG: Record<string, { label: string; color: string }> = {
  normale: { label: "Normale", color: "text-slate-400" },
  urgente: { label: "Urgent", color: "text-amber-400" },
  tres_urgente: { label: "Très urgent", color: "text-red-400" },
};

const BUDGETS = ["Tous les budgets", "< €500", "€500 – €1000", "> €1000"];
const CATEGORIES = ["Toutes", "Développement", "Design", "Rédaction", "Marketing", "Vidéo"];
const CONTRATS = ["Tous", "Ponctuel", "Long terme", "Récurrent"];
const FILTER_STATUSES = ["Toutes", "En attente", "Acceptées", "Refusées"];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CandidaturesPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [tab, setTab] = useState<"candidatures" | "explorer">("candidatures");

  // Candidatures state
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [statusFilter, setStatusFilter] = useState("Toutes");
  const [loadingCandidatures, setLoadingCandidatures] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [budget, setBudget] = useState(BUDGETS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [contrat, setContrat] = useState(CONTRATS[0]);

  // Modal state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [motivation, setMotivation] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch candidatures
  const fetchCandidatures = useCallback(async () => {
    setLoadingCandidatures(true);
    try {
      const res = await fetch("/api/candidatures");
      if (res.ok) {
        const data = await res.json();
        setCandidatures(data.candidatures);
      }
    } catch (err) {
      console.error("Erreur chargement candidatures:", err);
    } finally {
      setLoadingCandidatures(false);
    }
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Erreur chargement projets:", err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidatures();
    fetchProjects();
  }, [fetchCandidatures, fetchProjects]);

  // Submit candidature
  async function handleSubmit() {
    if (!selectedProject || !motivation.trim() || !proposedPrice || !deliveryDays) {
      addToast("warning", "Veuillez remplir tous les champs");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/candidatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          motivation: motivation.trim(),
          proposedPrice: Number(proposedPrice),
          deliveryDays: Number(deliveryDays),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCandidatures((prev) => [data.candidature, ...prev]);
        // Update proposal count locally
        setProjects((prev) =>
          prev.map((p) => p.id === selectedProject.id ? { ...p, proposals: p.proposals + 1 } : p)
        );
        addToast("success", "Candidature envoyée avec succès !");
        closeModal();
        setTab("candidatures");
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

  function closeModal() {
    setSelectedProject(null);
    setMotivation("");
    setProposedPrice("");
    setDeliveryDays("");
  }

  // Filter candidatures
  const filteredCandidatures = candidatures.filter((c) => {
    if (statusFilter === "Toutes") return true;
    if (statusFilter === "En attente") return c.status === "en_attente" || c.status === "vue";
    if (statusFilter === "Acceptées") return c.status === "acceptee";
    if (statusFilter === "Refusées") return c.status === "refusee";
    return true;
  });

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (budget === "< €500" && p.budgetMax >= 500) return false;
    if (budget === "€500 – €1000" && (p.budgetMin > 1000 || p.budgetMax < 500)) return false;
    if (budget === "> €1000" && p.budgetMax <= 1000) return false;
    if (category !== "Toutes" && p.category !== category) return false;
    if (contrat === "Ponctuel" && p.contractType !== "ponctuel") return false;
    if (contrat === "Long terme" && p.contractType !== "long_terme") return false;
    if (contrat === "Récurrent" && p.contractType !== "recurrent") return false;
    return true;
  });

  // Stats
  const totalCandidatures = candidatures.length;
  const accepted = candidatures.filter((c) => c.status === "acceptee").length;
  const pending = candidatures.filter((c) => c.status === "en_attente" || c.status === "vue").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Candidatures</h1>
        <p className="text-slate-400 mt-1">Postulez aux offres clients et suivez vos candidatures.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-dark rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("candidatures")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            tab === "candidatures" ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1.5">assignment</span>
          Mes candidatures
        </button>
        <button
          onClick={() => setTab("explorer")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            tab === "explorer" ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1.5">explore</span>
          Explorer les offres
        </button>
      </div>

      {/* ================================================================== */}
      {/* TAB 1: Mes candidatures                                            */}
      {/* ================================================================== */}
      {tab === "candidatures" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total soumises", value: totalCandidatures, icon: "send", color: "text-blue-400" },
              { label: "Acceptées", value: accepted, icon: "check_circle", color: "text-emerald-400" },
              { label: "En attente", value: pending, icon: "schedule", color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="bg-background-dark/50 border border-border-dark rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
                  <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                </div>
                <p className="text-2xl font-black">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1 bg-neutral-dark rounded-xl p-1 w-fit">
            {FILTER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  statusFilter === s ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* List */}
          {loadingCandidatures ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            </div>
          ) : filteredCandidatures.length === 0 ? (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 block mb-3">assignment</span>
              <p className="text-slate-500 font-semibold">Aucune candidature</p>
              <p className="text-slate-600 text-sm mt-1">Explorez les offres pour commencer</p>
              <button
                onClick={() => setTab("explorer")}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90"
              >
                Explorer les offres
              </button>
            </div>
          ) : (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden divide-y divide-border-dark">
              {filteredCandidatures.map((c) => {
                const cfg = STATUS_CFG[c.status];
                return (
                  <div key={c.id} className="px-5 py-4 hover:bg-primary/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-100 line-clamp-1">{c.projectTitle}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                          <span>{c.clientName}</span>
                          <span>·</span>
                          <span>€{c.proposedPrice.toLocaleString("fr-FR")}</span>
                          <span>·</span>
                          <span>{c.deliveryDays} jours</span>
                          <span>·</span>
                          <span>{new Date(c.submittedAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0", cfg.color)}>
                        <span className="material-symbols-outlined text-sm leading-none">{cfg.icon}</span>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 2: Explorer les offres                                         */}
      {/* ================================================================== */}
      {tab === "explorer" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "Budget", options: BUDGETS, value: budget, onChange: setBudget },
              { label: "Catégorie", options: CATEGORIES, value: category, onChange: setCategory },
              { label: "Contrat", options: CONTRATS, value: contrat, onChange: setContrat },
            ].map((f) => (
              <select
                key={f.label}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="h-10 px-3 bg-neutral-dark border border-border-dark rounded-xl text-sm text-slate-200 outline-none focus:ring-1 focus:ring-primary"
              >
                {f.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ))}
          </div>

          {/* Projects grid */}
          {loadingProjects ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 block mb-3">work</span>
              <p className="text-slate-500 font-semibold">Aucun projet disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredProjects.map((p) => {
                const urgCfg = URGENCY_CFG[p.urgency];
                return (
                  <div key={p.id} className="bg-background-dark/50 border border-border-dark rounded-xl p-5 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-100">{p.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                          <span>{p.clientName}</span>
                          <span>·</span>
                          <span>{p.clientCountry}</span>
                          <span>·</span>
                          <span className={urgCfg.color}>{urgCfg.label}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-primary font-black text-lg">€{p.budgetMin.toLocaleString("fr-FR")} – €{p.budgetMax.toLocaleString("fr-FR")}</p>
                        <p className="text-xs text-slate-500">{p.contractType === "ponctuel" ? "Ponctuel" : p.contractType === "long_terme" ? "Long terme" : "Récurrent"}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{p.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {p.skills.map((skill) => (
                        <span key={skill} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-dark">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {new Date(p.deadline).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">group</span>
                          {p.proposals} candidature{p.proposals !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedProject(p)}
                        className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                      >
                        Postuler
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: Postuler                                                    */}
      {/* ================================================================== */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          {/* Content */}
          <div className="relative bg-[#0d1b16] border border-border-dark rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-black text-slate-100">Postuler</h3>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Project summary */}
            <div className="bg-neutral-dark rounded-xl p-4">
              <p className="text-sm font-bold text-slate-200">{selectedProject.title}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span>{selectedProject.clientName}</span>
                <span>·</span>
                <span className="text-primary font-bold">€{selectedProject.budgetMin} – €{selectedProject.budgetMax}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Lettre de motivation *</label>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Expliquez pourquoi vous êtes le bon candidat pour cette mission..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-slate-200 outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Prix proposé (€) *</label>
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="Ex: 1200"
                    className="w-full px-3 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-slate-200 outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Délai (jours) *</label>
                  <input
                    type="number"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    placeholder="Ex: 15"
                    className="w-full px-3 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-slate-200 outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {submitting && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                {submitting ? "Envoi..." : "Envoyer ma candidature"}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2.5 border border-border-dark rounded-xl text-sm font-bold text-slate-400 hover:bg-primary/5 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
