"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "Tous" },
  { key: "actif", label: "Actifs" },
  { key: "termine", label: "Terminés" },
  { key: "brouillon", label: "Brouillons" },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  actif: { label: "Actif", cls: "bg-primary/20 text-primary" },
  ouvert: { label: "Ouvert", cls: "bg-primary/20 text-primary" },
  suspendu: { label: "Suspendu", cls: "bg-amber-500/20 text-amber-400" },
  termine: { label: "Terminé", cls: "bg-slate-500/20 text-slate-400" },
  brouillon: { label: "Brouillon", cls: "bg-slate-600/20 text-slate-500" },
};

function SkeletonCard() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-border-dark rounded-full" />
            <div className="h-5 w-24 bg-border-dark rounded-full" />
          </div>
          <div className="h-5 w-3/4 bg-border-dark rounded" />
          <div className="h-4 w-full bg-border-dark rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-border-dark rounded-full" />
            <div className="h-6 w-16 bg-border-dark rounded-full" />
            <div className="h-6 w-16 bg-border-dark rounded-full" />
          </div>
          <div className="flex gap-6">
            <div className="h-4 w-20 bg-border-dark rounded" />
            <div className="h-4 w-24 bg-border-dark rounded" />
            <div className="h-4 w-28 bg-border-dark rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="h-8 w-24 bg-border-dark rounded-lg" />
          <div className="h-8 w-24 bg-border-dark rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ClientProjects() {
  const router = useRouter();
  const {
    projects,
    projectFilter,
    setProjectFilter,
    syncProjects,
    deleteProject,
    pauseProject,
    resumeProject,
    loading,
  } = useClientStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    syncProjects();
  }, [syncProjects]);

  const safeProjects = projects || [];

  const filtered = useMemo(() => {
    if (projectFilter === "all") return safeProjects;
    return safeProjects.filter((p) => p.status === projectFilter);
  }, [safeProjects, projectFilter]);

  const counts = useMemo(
    () => ({
      all: safeProjects.length,
      actif: safeProjects.filter((p) => p.status === "actif").length,
      termine: safeProjects.filter((p) => p.status === "termine").length,
      brouillon: safeProjects.filter((p) => p.status === "brouillon").length,
    }),
    [safeProjects],
  );

  async function handleDelete(id: string) {
    const ok1 = await confirmAction({
      title: "Supprimer ce projet ?",
      message: "Cette action est irréversible.",
      confirmLabel: "Supprimer",
      confirmVariant: "danger",
      icon: "delete",
    });
    if (!ok1) return;
    const ok = await deleteProject(id);
    if (ok) {
      addToast("success", "Projet supprimé");
    } else {
      addToast("error", "Erreur lors de la suppression");
    }
  }

  async function handlePause(id: string) {
    const ok = await pauseProject(id);
    if (ok) {
      addToast("success", "Projet suspendu");
    } else {
      addToast("error", "Erreur lors de la suspension");
    }
  }

  async function handleResume(id: string) {
    const ok = await resumeProject(id);
    if (ok) {
      addToast("success", "Projet réactivé");
    } else {
      addToast("error", "Erreur lors de la réactivation");
    }
  }

  const isLoading = loading.projects;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Mes Projets</h1>
          <p className="text-slate-400 text-sm mt-1">
            {safeProjects.length} projet{safeProjects.length !== 1 ? "s" : ""} publié{safeProjects.length !== 1 ? "s" : ""} — Gérez vos offres et suivez les candidatures.
          </p>
        </div>
        <Link
          href="/client/projets/nouveau"
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Publier un projet
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all, icon: "folder_open", color: "text-white" },
          { label: "Actifs", value: counts.actif, icon: "play_circle", color: "text-primary" },
          { label: "Terminés", value: counts.termine, icon: "check_circle", color: "text-slate-400" },
          { label: "Brouillons", value: counts.brouillon, icon: "edit_note", color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <span className={cn("material-symbols-outlined text-lg sm:text-xl", s.color)}>{s.icon}</span>
            <div>
              <p className={cn("text-lg sm:text-xl font-black", s.color)}>{isLoading ? "-" : s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 sm:gap-1 bg-neutral-dark rounded-xl p-0.5 sm:p-1 border border-border-dark overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setProjectFilter(t.key)}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
              projectFilter === t.key
                ? "bg-primary text-background-dark shadow"
                : "text-slate-400 hover:text-white",
            )}
          >
            {t.label}
            <span
              className={cn(
                "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full",
                projectFilter === t.key ? "bg-background-dark/20" : "bg-border-dark",
              )}
            >
              {isLoading ? "-" : counts[t.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">inbox</span>
            <p className="text-slate-500 font-semibold">
              {projectFilter === "all"
                ? "Vous n'avez pas encore de projets"
                : "Aucun projet dans cette catégorie"}
            </p>
            <p className="text-slate-600 text-sm mt-1">
              Publiez votre premier projet pour recevoir des propositions de freelances qualifiés.
            </p>
            <Link
              href="/client/projets/nouveau"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-background-dark text-sm font-bold rounded-lg hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Publier un projet
            </Link>
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="bg-neutral-dark rounded-xl border border-border-dark p-5 hover:border-primary/30 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_MAP[p.status]?.cls)}>
                      {STATUS_MAP[p.status]?.label}
                    </span>
                    <span className="text-xs bg-border-dark text-slate-400 px-2.5 py-1 rounded-full">{p.category}</span>
                    {p.urgency === "urgente" && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-semibold">
                        Urgent
                      </span>
                    )}
                    {p.urgency === "tres_urgente" && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full font-semibold">
                        Très urgent
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mt-1 mb-3">{p.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(p.skills || []).map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium border border-primary/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-wrap text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">payments</span>
                      {(p.budget?.min ?? 0).toLocaleString("fr-FR")} - {(p.budget?.max ?? 0).toLocaleString("fr-FR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {p.deadline
                        ? new Date(p.deadline).toLocaleDateString("fr-FR")
                        : "Non défini"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">group</span>
                      {p.candidatures} candidature{p.candidatures !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {p.status === "actif" && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-border-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary">{p.progress}%</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                  <Link
                    href={`/client/projets/${p.id}`}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-background-dark transition-all text-center"
                  >
                    Voir détails
                  </Link>
                  <button
                    onClick={() => router.push(`/client/projets/${p.id}?edit=true`)}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 bg-border-dark text-slate-400 text-xs font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-center"
                  >
                    Modifier
                  </button>
                  {(p.status === "actif" || p.status === "ouvert") && (
                    <button
                      onClick={() => handlePause(p.id)}
                      className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-lg hover:bg-amber-500/20 transition-colors text-center"
                    >
                      Suspendre
                    </button>
                  )}
                  {p.status === "suspendu" && (
                    <button
                      onClick={() => handleResume(p.id)}
                      className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/20 transition-colors text-center"
                    >
                      Reprendre
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/10 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-colors text-center"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
