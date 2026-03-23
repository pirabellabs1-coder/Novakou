"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useClientStore, type ClientProject } from "@/store/client";
import { useToastStore } from "@/store/toast";
import { candidaturesApi } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectCandidate {
  id: string;
  name: string;
  title: string;
  country: string;
  rating: number;
  proposedPrice: number;
  deliveryDays: number;
  motivation: string;
  status: "en_attente" | "acceptee" | "refusee";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  actif: { label: "Actif", cls: "bg-primary/20 text-primary" },
  termine: { label: "Terminé", cls: "bg-slate-500/20 text-slate-400" },
  brouillon: { label: "Brouillon", cls: "bg-amber-500/20 text-amber-400" },
};

const URGENCY_MAP: Record<string, { label: string; cls: string }> = {
  normale: { label: "Normale", cls: "bg-slate-500/20 text-slate-400" },
  urgente: { label: "Urgent", cls: "bg-amber-500/20 text-amber-400" },
  tres_urgente: { label: "Très urgent", cls: "bg-red-500/20 text-red-400" },
};

const CAND_STATUS: Record<string, { label: string; cls: string; icon: string }> = {
  en_attente: { label: "En attente", cls: "bg-blue-500/10 text-blue-400", icon: "schedule" },
  acceptee: { label: "Acceptée", cls: "bg-emerald-500/10 text-emerald-400", icon: "check_circle" },
  refusee: { label: "Refusée", cls: "bg-red-500/10 text-red-400", icon: "cancel" },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-border-dark rounded" />
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-border-dark rounded-full" />
          <div className="h-5 w-16 bg-border-dark rounded-full" />
          <div className="h-5 w-24 bg-border-dark rounded-full" />
        </div>
        <div className="h-8 w-2/3 bg-border-dark rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-4 h-20" />
        ))}
      </div>
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 h-40" />
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 h-24" />
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 h-60" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);
  const {
    projects,
    syncProjects,
    acceptCandidature,
    rejectCandidature,
    deleteProject,
    loading,
  } = useClientStore();

  const [candidatures, setCandidatures] = useState<ProjectCandidate[]>([]);
  const [candidaturesLoading, setCandidaturesLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sync projects on mount if needed
  useEffect(() => {
    if (projects.length === 0) {
      syncProjects();
    }
  }, [projects.length, syncProjects]);

  // Fetch candidatures for this project
  useEffect(() => {
    async function fetchCandidatures() {
      setCandidaturesLoading(true);
      try {
        const { candidatures: data } = await candidaturesApi.getByProject(id);
        setCandidatures(
          (data || []).map((c: Record<string, unknown>) => ({
            id: (c.id as string) || "",
            name: (c.name as string) || (c.freelanceName as string) || "",
            title: (c.title as string) || (c.freelanceTitle as string) || "",
            country: (c.country as string) || "",
            rating: (c.rating as number) || 0,
            proposedPrice: (c.proposedPrice as number) || (c.amount as number) || 0,
            deliveryDays: (c.deliveryDays as number) || 0,
            motivation: (c.motivation as string) || "",
            status: ((c.status as string) || "en_attente") as ProjectCandidate["status"],
          })),
        );
      } catch {
        // Fallback: empty list if API not available
        setCandidatures([]);
      } finally {
        setCandidaturesLoading(false);
      }
    }
    fetchCandidatures();
  }, [id]);

  const project: ClientProject | undefined = useMemo(
    () => projects.find((p) => p.id === id),
    [projects, id],
  );

  const isLoading = loading.projects && projects.length === 0;

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-slate-600 block mb-3">error</span>
        <p className="text-slate-400 font-semibold text-lg">Projet introuvable</p>
        <p className="text-slate-600 text-sm mt-1">
          Ce projet n&apos;existe pas ou a ete supprime.
        </p>
        <Link
          href="/client/projets"
          className="inline-flex items-center gap-2 mt-4 text-primary text-sm font-bold hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour aux projets
        </Link>
      </div>
    );
  }

  const status = STATUS_MAP[project.status];
  const urgency = URGENCY_MAP[project.urgency];

  async function handleAccept(candidateId: string) {
    setActionLoading(candidateId);
    const ok = await acceptCandidature(id, candidateId);
    setActionLoading(null);
    if (ok) {
      setCandidatures((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: "acceptee" as const } : c)),
      );
      addToast("success", "Candidature acceptee !");
    } else {
      addToast("error", "Erreur lors de l'acceptation");
    }
  }

  async function handleReject(candidateId: string) {
    setActionLoading(candidateId);
    const ok = await rejectCandidature(id, candidateId);
    setActionLoading(null);
    if (ok) {
      setCandidatures((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: "refusee" as const } : c)),
      );
      addToast("success", "Candidature refusee");
    } else {
      addToast("error", "Erreur lors du refus");
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce projet ?")) return;
    const ok = await deleteProject(id);
    if (ok) {
      addToast("success", "Projet supprime");
    } else {
      addToast("error", "Erreur lors de la suppression");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/client/projets"
        className="inline-flex items-center gap-2 text-slate-400 text-sm font-semibold hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Retour aux projets
      </Link>

      {/* Title + badges */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", status?.cls)}>
            {status?.label}
          </span>
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", urgency?.cls)}>
            {urgency?.label}
          </span>
          <span className="text-xs bg-border-dark text-slate-400 px-2.5 py-1 rounded-full">
            {project.category}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">{project.title}</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Budget",
            value: `${project.budget.min.toLocaleString("fr-FR")} - ${project.budget.max.toLocaleString("fr-FR")} EUR`,
            icon: "payments",
            color: "text-primary",
          },
          {
            label: "Deadline",
            value: project.deadline
              ? new Date(project.deadline).toLocaleDateString("fr-FR")
              : "Non defini",
            icon: "calendar_today",
            color: "text-amber-400",
          },
          {
            label: "Visibilite",
            value: project.visibility === "public" ? "Public" : "Prive",
            icon: project.visibility === "public" ? "public" : "lock",
            color: "text-blue-400",
          },
          {
            label: "Candidatures",
            value: String(candidatures.length || project.candidatures),
            icon: "group",
            color: "text-emerald-400",
          },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-dark rounded-xl border border-border-dark p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {s.label}
              </span>
            </div>
            <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar (active projects) */}
      {project.status === "actif" && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-300">Progression</span>
            <span className="text-sm font-black text-primary">{project.progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-border-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
        <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">description</span>
          Description du projet
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {project.description}
        </p>
      </div>

      {/* Skills */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
        <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">code</span>
          Competences requises
        </h3>
        <div className="flex flex-wrap gap-2">
          {project.skills.map((s) => (
            <span
              key={s}
              className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-full border border-primary/20"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Candidatures */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
        <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">group</span>
          Candidatures recues
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold ml-1">
            {candidaturesLoading ? "..." : candidatures.length}
          </span>
        </h3>

        {candidaturesLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-background-dark/50 border border-border-dark rounded-xl p-4 h-28" />
            ))}
          </div>
        ) : candidatures.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-4xl text-slate-600 block mb-2">
              person_search
            </span>
            <p className="text-slate-500 text-sm font-semibold">
              Aucune candidature recue pour le moment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidatures.map((c) => {
              const candStatus = CAND_STATUS[c.status];
              const initials = c.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2);
              return (
                <div
                  key={c.id}
                  className="bg-background-dark/50 border border-border-dark rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-primary">{initials}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white">{c.name}</p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg",
                            candStatus.cls,
                          )}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {candStatus.icon}
                          </span>
                          {candStatus.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {c.title} -- {c.country}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-amber-400 text-xs">
                          star
                        </span>
                        <span className="text-xs font-bold text-amber-400">{c.rating}</span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-primary">
                            payments
                          </span>
                          <span className="font-bold text-white">
                            {c.proposedPrice.toLocaleString("fr-FR")} EUR
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {c.deliveryDays} jours
                        </span>
                      </div>

                      {c.motivation && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">
                          &ldquo;{c.motivation}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {c.status === "en_attente" && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAccept(c.id)}
                          disabled={actionLoading === c.id}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === c.id ? "..." : "Accepter"}
                        </button>
                        <button
                          onClick={() => handleReject(c.id)}
                          disabled={actionLoading === c.id}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === c.id ? "..." : "Refuser"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => addToast("info", "Modification du projet en cours de développement")}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Modifier le projet
        </button>
        <button
          onClick={() => addToast("info", "Projet ferme avec succes")}
          className="flex items-center gap-2 px-5 py-2.5 bg-border-dark text-slate-300 text-sm font-bold rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-lg">block</span>
          Fermer le projet
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-all"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
          Supprimer
        </button>
      </div>
    </div>
  );
}
