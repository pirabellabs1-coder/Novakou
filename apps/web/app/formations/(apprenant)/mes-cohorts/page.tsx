"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, Users, MessageSquare, Play, Award } from "lucide-react";

interface MyCohort {
  enrollmentId: string;
  progress: number;
  completedAt: string | null;
  enrolledAt: string;
  formation: {
    id: string;
    slug: string;
    titleFr: string;
    titleEn: string;
    thumbnail: string | null;
    duration: number;
    level: string;
  };
  cohort: {
    id: string;
    titleFr: string;
    titleEn: string;
    startDate: string;
    endDate: string;
    status: string;
    maxParticipants: number;
    currentCount: number;
    _count?: { messages: number; enrollments: number };
  } | null;
  certificate: { code: string } | null;
  instructeur: {
    user: { name: string; avatar: string | null; image: string | null };
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  OUVERT: "bg-green-100 text-green-700",
  COMPLET: "bg-blue-100 text-blue-700",
  EN_COURS: "bg-yellow-100 text-yellow-700",
  TERMINE: "bg-slate-100 dark:bg-slate-800 text-slate-600",
  ANNULE: "bg-red-100 text-red-600",
};

const STATUS_FR: Record<string, string> = {
  OUVERT: "Ouvert", COMPLET: "Complet", EN_COURS: "En cours", TERMINE: "Terminé", ANNULE: "Annulé",
};
const STATUS_EN: Record<string, string> = {
  OUVERT: "Open", COMPLET: "Full", EN_COURS: "In Progress", TERMINE: "Completed", ANNULE: "Cancelled",
};

export default function MesCohortsPage() {
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [cohorts, setCohorts] = useState<MyCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (status !== "authenticated") return;

    fetch("/api/apprenant/cohorts")
      .then((r) => r.json())
      .then((data) => {
        setCohorts(data.cohorts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, router]);

  const filtered = cohorts.filter((c) => {
    if (!c.cohort) return false;
    if (tab === "active") return ["OUVERT", "COMPLET", "EN_COURS"].includes(c.cohort.status);
    if (tab === "completed") return c.cohort.status === "TERMINE";
    return true;
  });

  const activeCount = cohorts.filter((c) => c.cohort && ["OUVERT", "COMPLET", "EN_COURS"].includes(c.cohort.status)).length;
  const completedCount = cohorts.filter((c) => c.cohort?.status === "TERMINE").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{fr ? "Mes cohortes" : "My Cohorts"}</h1>
          <p className="text-sm text-slate-500">{fr ? "Vos formations en groupe" : "Your group courses"}</p>
        </div>
        <Link href="/formations/explorer"
          className="text-sm text-primary hover:underline flex items-center gap-1">
          {fr ? "Explorer plus" : "Browse more"} →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{cohorts.length}</p>
            <p className="text-xs text-slate-500">{fr ? "Total" : "Total"}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
            <Play className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{activeCount}</p>
            <p className="text-xs text-slate-500">{fr ? "En cours" : "Active"}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{completedCount}</p>
            <p className="text-xs text-slate-500">{fr ? "Terminées" : "Completed"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6">
        {([["all", fr ? "Toutes" : "All"], ["active", fr ? "En cours" : "Active"], ["completed", fr ? "Terminées" : "Completed"]] as [string, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === key ? "bg-white dark:bg-slate-900 dark:bg-neutral-dark text-slate-900 dark:text-white dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4 animate-pulse flex gap-4">
              <div className="w-40 h-24 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-500 mb-4">{fr ? "Aucune cohorte" : "No cohorts"}</p>
          <Link href="/formations/explorer" className="bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors inline-block">
            {fr ? "Explorer les cohortes" : "Explore cohorts"}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            if (!item.cohort) return null;
            const cohortTitle = fr ? item.cohort.titleFr : (item.cohort.titleEn || item.cohort.titleFr);
            const formationTitle = fr ? item.formation.titleFr : (item.formation.titleEn || item.formation.titleFr);
            const isCompleted = item.cohort.status === "TERMINE";

            return (
              <Link
                key={item.enrollmentId}
                href={`/formations/mes-cohorts/${item.cohort.id}`}
                className="block bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark hover:border-primary/20 hover:shadow-sm transition-all p-4"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-40 h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-blue-100 overflow-hidden relative">
                    {item.formation.thumbnail ? (
                      <img src={item.formation.thumbnail} alt={formationTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-30">🎓</div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="bg-primary/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {fr ? "Groupe" : "Group"}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">{cohortTitle}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[item.cohort.status]}`}>
                        {fr ? STATUS_FR[item.cohort.status] : STATUS_EN[item.cohort.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{formationTitle}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.cohort.startDate).toLocaleDateString(fr ? "fr-FR" : "en-US", { day: "numeric", month: "short" })} — {new Date(item.cohort.endDate).toLocaleDateString(fr ? "fr-FR" : "en-US", { day: "numeric", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {item.cohort.currentCount}
                      </span>
                      {item.cohort._count?.messages !== undefined && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {item.cohort._count.messages}
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-primary"}`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${isCompleted ? "text-green-600" : "text-slate-600"}`}>
                        {Math.round(item.progress)}%
                      </span>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="hidden sm:flex flex-col items-end text-right text-xs text-slate-500 gap-1">
                    {item.instructeur && (
                      <span>{item.instructeur.user.name}</span>
                    )}
                    {item.certificate && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Award className="w-3.5 h-3.5" />
                        {fr ? "Certifié" : "Certified"}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
