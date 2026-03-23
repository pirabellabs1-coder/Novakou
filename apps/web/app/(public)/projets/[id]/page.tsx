"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useCurrencyStore } from "@/store/currency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Urgency = "normale" | "urgente" | "tres_urgente";
type ContractType = "ponctuel" | "long_terme" | "recurrent";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  urgency: Urgency;
  contractType: ContractType;
  skills: string[];
  clientName: string;
  clientCountry: string;
  clientAvatar?: string;
  proposals: number;
  status: string;
  visibility?: string;
  postedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const URGENCY_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  normale: { label: "Normale", cls: "bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400", icon: "schedule" },
  urgente: { label: "Urgent", cls: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400", icon: "priority_high" },
  tres_urgente: { label: "Tres urgent", cls: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400", icon: "warning" },
};

const CONTRACT_MAP: Record<string, string> = {
  ponctuel: "Ponctuel",
  long_terme: "Long terme",
  recurrent: "Recurrent",
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ouvert: { label: "Ouvert", cls: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" },
  pourvu: { label: "Pourvu", cls: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" },
  ferme: { label: "Ferme", cls: "bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400" },
  en_cours: { label: "En cours", cls: "bg-primary/10 text-primary" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysUntilDeadline(deadline: string): string {
  const diff = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "Expire";
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  return `${diff} jours`;
}

function daysAgo(dateStr: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  return `Il y a ${diff} jours`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
      <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const { format } = useCurrencyStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    fetch(`/api/public/projects/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setProject(data.project || null);
        if (!data.project) setError(true);
      })
      .catch(() => {
        setProject(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 block mb-4">
          search_off
        </span>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Projet introuvable
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Ce projet n&apos;existe pas ou a ete supprime.
        </p>
        <Link
          href="/offres-projets"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Retour aux projets
        </Link>
      </div>
    );
  }

  const urgency = URGENCY_MAP[project.urgency] || URGENCY_MAP.normale;
  const status = STATUS_MAP[project.status] || STATUS_MAP.ouvert;
  const contractLabel = CONTRACT_MAP[project.contractType] || project.contractType;
  const deadlineRemaining = daysUntilDeadline(project.deadline);
  const postedLabel = daysAgo(project.postedAt);

  const initials = project.clientName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
        <Link href="/offres-projets" className="hover:text-primary transition-colors">
          Offres & Projets
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 dark:text-white font-medium truncate">
          {project.title}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", status.cls)}>
            {status.label}
          </span>
          <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full", urgency.cls)}>
            <span className="material-symbols-outlined text-sm">{urgency.icon}</span>
            {urgency.label}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
            {project.category}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
            {contractLabel}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {project.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Publie {postedLabel} · {project.proposals} candidature{project.proposals !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Budget",
            value: `${format(project.budgetMin)} - ${format(project.budgetMax)}`,
            icon: "payments",
            color: "text-primary",
          },
          {
            label: "Deadline",
            value: new Date(project.deadline).toLocaleDateString(
              locale === "en" ? "en-US" : "fr-FR",
              { day: "numeric", month: "short", year: "numeric" }
            ),
            icon: "calendar_today",
            color: "text-amber-500 dark:text-amber-400",
          },
          {
            label: "Temps restant",
            value: deadlineRemaining,
            icon: "timer",
            color: deadlineRemaining === "Expire" ? "text-red-500" : "text-emerald-500 dark:text-emerald-400",
          },
          {
            label: "Candidatures",
            value: String(project.proposals),
            icon: "group",
            color: "text-blue-500 dark:text-blue-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("material-symbols-outlined text-lg", s.color)}>
                {s.icon}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                {s.label}
              </span>
            </div>
            <p className={cn("text-sm sm:text-base font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              Description du projet
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </div>

          {/* Skills */}
          {project.skills && project.skills.length > 0 && (
            <div className="bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">code</span>
                Competences requises
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-full border border-primary/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Project details */}
          <div className="bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Details du projet
            </h3>
            <div className="space-y-3">
              {[
                { icon: "description", label: "Type de contrat", value: contractLabel },
                { icon: "priority_high", label: "Urgence", value: urgency.label },
                { icon: "visibility", label: "Visibilite", value: project.visibility === "prive" ? "Prive" : "Public" },
                { icon: "calendar_today", label: "Date de publication", value: new Date(project.postedAt).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">
                      {item.icon}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* CTA Card */}
            <div className="bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Budget estime</p>
                <p className="text-2xl font-bold text-primary">
                  {format(project.budgetMin)} - {format(project.budgetMax)}
                </p>
              </div>

              <Link
                href={`/connexion?redirect=${encodeURIComponent(`/dashboard/candidatures?apply=${project.id}`)}`}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl",
                  "bg-primary hover:bg-primary/90 text-white text-sm font-bold",
                  "shadow-lg shadow-primary/20 transition-all"
                )}
              >
                <span className="material-symbols-outlined text-lg">send</span>
                Postuler a ce projet
              </Link>

              <Link
                href={`/connexion?redirect=${encodeURIComponent(`/messages?to=${project.clientName}`)}`}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
                  "bg-slate-100 dark:bg-background-dark",
                  "text-slate-700 dark:text-slate-300 text-sm font-bold",
                  "border border-slate-200 dark:border-border-dark",
                  "hover:bg-slate-200 dark:hover:bg-border-dark transition-all"
                )}
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                Contacter le client
              </Link>
            </div>

            {/* Client card */}
            <div className="bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-5">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                A propos du client
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {project.clientAvatar ? (
                    <img
                      src={project.clientAvatar}
                      alt={project.clientName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary">{initials}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {project.clientName}
                  </p>
                  {project.clientCountry && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {project.clientCountry}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Share */}
            <button
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-border-dark text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-border-dark transition-colors"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              Partager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
