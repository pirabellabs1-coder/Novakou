"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, MessageSquare, BookOpen, Calendar, Users,
  Award, BarChart, Clock,
} from "lucide-react";
import DynamicIcon from "@/components/ui/DynamicIcon";
import CohortChat from "@/components/formations/CohortChat";

interface CohortDetailData {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  enrollmentDeadline: string;
  maxParticipants: number;
  currentCount: number;
  price: number;
  status: string;
  schedule: ScheduleItem[] | null;
  formation: {
    id: string;
    slug: string;
    title: string;
    thumbnail: string | null;
    duration: number;
  };
  instructeur: {
    user: { name: string; avatar: string | null; image: string | null };
  };
  enrollment: {
    id: string;
    progress: number;
    completedAt: string | null;
    certificate: { code: string } | null;
  };
  participants: ParticipantInfo[];
}

interface ScheduleItem {
  week?: number;
  title?: string;
  topics?: string[];
  description?: string;
}

interface ParticipantInfo {
  id: string;
  progress: number;
  user: { name: string; avatar: string | null; image: string | null };
}

const STATUS_FR: Record<string, string> = {
  OUVERT: "Ouvert", COMPLET: "Complet", EN_COURS: "En cours", TERMINE: "Terminé", ANNULE: "Annulé",
};
const STATUS_EN: Record<string, string> = {
  OUVERT: "Open", COMPLET: "Full", EN_COURS: "In Progress", TERMINE: "Completed", ANNULE: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  OUVERT: "bg-green-100 text-green-700",
  COMPLET: "bg-blue-100 text-blue-700",
  EN_COURS: "bg-yellow-100 text-yellow-700",
  TERMINE: "bg-slate-100 dark:bg-slate-800 text-slate-600",
  ANNULE: "bg-red-100 text-red-600",
};

export default function ApprenantCohortDetailPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const { cohortId } = use(params);
  const locale = useLocale();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [data, setData] = useState<CohortDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"chat" | "content" | "schedule" | "progress" | "participants">("chat");

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (authStatus !== "authenticated") return;

    fetch(`/api/apprenant/cohorts/${cohortId}`)
      .then((r) => {
        if (!r.ok) { router.replace("/formations/mes-cohorts"); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authStatus, router, cohortId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cohortTitle = data.title;
  const formationTitle = data.formation.title;
  const desc = data.description;
  const isCompleted = data.enrollment.progress >= 100;
  const schedule = Array.isArray(data.schedule) ? data.schedule : [];

  // Sort participants by progress desc for ranking
  const sortedParticipants = [...(data.participants || [])].sort((a, b) => b.progress - a.progress);
  const myRank = sortedParticipants.findIndex((p) => p.id === data.enrollment.id) + 1;
  const avgProgress = data.participants.length > 0
    ? Math.round(data.participants.reduce((s, p) => s + p.progress, 0) / data.participants.length)
    : 0;

  const tabs = [
    { key: "chat", label: fr ? "Chat" : "Chat", icon: MessageSquare },
    { key: "content", label: fr ? "Contenu" : "Content", icon: BookOpen },
    { key: "schedule", label: fr ? "Programme" : "Schedule", icon: Calendar },
    { key: "progress", label: fr ? "Progression" : "Progress", icon: BarChart },
    { key: "participants", label: fr ? "Participants" : "Participants", icon: Users },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/formations/mes-cohorts" className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">{cohortTitle}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[data.status]}`}>
              {fr ? STATUS_FR[data.status] : STATUS_EN[data.status]}
            </span>
          </div>
          <p className="text-sm text-slate-500 truncate">{formationTitle}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4">
          <p className="text-xs text-slate-500">{fr ? "Ma progression" : "My Progress"}</p>
          <p className={`text-xl font-bold ${isCompleted ? "text-green-600" : "text-slate-900 dark:text-white dark:text-slate-100"}`}>
            {Math.round(data.enrollment.progress)}%
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4">
          <p className="text-xs text-slate-500">{fr ? "Moyenne groupe" : "Group Avg"}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{avgProgress}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4">
          <p className="text-xs text-slate-500">{fr ? "Classement" : "Ranking"}</p>
          <p className="text-xl font-bold text-primary">{myRank > 0 ? `#${myRank}` : "—"}/{data.participants.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4">
          <p className="text-xs text-slate-500">{fr ? "Participants" : "Participants"}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{data.currentCount}/{data.maxParticipants}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-900 dark:text-white dark:text-slate-100">{fr ? "Ma progression" : "My Progress"}</span>
          <span className={`font-bold ${isCompleted ? "text-green-600" : "text-primary"}`}>
            {Math.round(data.enrollment.progress)}%
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-primary"}`}
            style={{ width: `${data.enrollment.progress}%` }}
          />
        </div>
        {data.enrollment.certificate && (
          <div className="mt-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-green-600" />
            <Link
              href={`/formations/certificats/${data.enrollment.certificate.id}`}
              className="text-sm text-green-600 hover:underline font-medium"
            >
              {fr ? "Voir mon certificat" : "View my certificate"}
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              tab === key ? "bg-white dark:bg-slate-900 dark:bg-neutral-dark text-slate-900 dark:text-white dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Chat tab */}
      {tab === "chat" && session?.user && (
        <CohortChat
          cohortId={cohortId}
          currentUserId={session.user.id}
          isInstructor={false}
          locale={locale}
        />
      )}

      {/* Content tab */}
      {tab === "content" && (
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-blue-100 overflow-hidden flex-shrink-0">
              {data.formation.thumbnail ? (
                <img src={data.formation.thumbnail} alt={formationTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><DynamicIcon name="school" className="w-6 h-6 opacity-30" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{formationTitle}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.floor(data.formation.duration / 60)}h
                </span>
                <span>{data.instructeur.user.name}</span>
              </div>
            </div>
          </div>

          {desc && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{fr ? "Description" : "Description"}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(data.startDate).toLocaleDateString(fr ? "fr-FR" : "en-US")} — {new Date(data.endDate).toLocaleDateString(fr ? "fr-FR" : "en-US")}
            </span>
          </div>

          <Link
            href={`/formations/apprendre/${data.formation.id}`}
            className="inline-flex items-center gap-2 bg-primary text-white font-medium px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            <BookOpen className="w-4 h-4" />
            {isCompleted
              ? (fr ? "Revoir le contenu" : "Review content")
              : (fr ? "Continuer l'apprentissage" : "Continue learning")}
          </Link>
        </div>
      )}

      {/* Schedule tab */}
      {tab === "schedule" && (
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-6">
          {schedule.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>{fr ? "Aucun programme défini" : "No schedule defined"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">{fr ? "Programme de la cohorte" : "Cohort Schedule"}</h3>
              {schedule.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{item.week ?? i + 1}</span>
                  </div>
                  <div className="flex-1 border-b pb-4 last:border-0">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                      {item.title ?? `${fr ? "Semaine" : "Week"} ${item.week ?? i + 1}`}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                    )}
                    {item.topics && item.topics.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {item.topics.map((topic, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress tab */}
      {tab === "progress" && (
        <div className="space-y-6">
          {/* My progress card */}
          <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 mb-4">{fr ? "Ma progression" : "My Progress"}</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{Math.round(data.enrollment.progress)}%</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500">{fr ? "Classement" : "Rank"}</span>
                  <span className="font-bold text-primary">#{myRank} / {data.participants.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500">{fr ? "Moyenne du groupe" : "Group average"}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{avgProgress}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{fr ? "Statut" : "Status"}</span>
                  <span className={`font-medium ${isCompleted ? "text-green-600" : "text-yellow-600"}`}>
                    {isCompleted ? (fr ? "Terminé" : "Completed") : (fr ? "En cours" : "In progress")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-b dark:border-border-dark">
              <h3 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 text-sm">{fr ? "Classement de la cohorte" : "Cohort Leaderboard"}</h3>
            </div>
            <div className="divide-y">
              {sortedParticipants.map((p, idx) => {
                const isMe = p.id === data.enrollment.id;
                const avatar = p.user.avatar || p.user.image;
                return (
                  <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-primary/5" : "hover:bg-slate-50 dark:bg-slate-800/50"}`}>
                    <span className={`w-6 text-center text-xs font-bold ${idx < 3 ? "text-primary" : "text-slate-400"}`}>
                      {idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                      {avatar ? (
                        <img src={avatar} alt={p.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">
                          {(p.user?.name || "?").charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className={`flex-1 text-sm ${isMe ? "font-bold text-primary" : "text-slate-900 dark:text-white"}`}>
                      {p.user.name} {isMe ? (fr ? "(vous)" : "(you)") : ""}
                    </span>
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.progress >= 100 ? "bg-green-500" : "bg-primary"}`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{Math.round(p.progress)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Participants tab */}
      {tab === "participants" && (
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 mb-4">
            {data.participants.length} {fr ? "participants" : "participants"}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.participants.map((p) => {
              const avatar = p.user.avatar || p.user.image;
              const isMe = p.id === data.enrollment.id;
              return (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? "border-primary/30 bg-primary/5" : ""}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                    {avatar ? (
                      <img src={avatar} alt={p.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary text-sm font-bold">
                        {(p.user?.name || "?").charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : "text-slate-900 dark:text-white"}`}>
                      {p.user.name} {isMe ? (fr ? "(vous)" : "(you)") : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.progress >= 100 ? "bg-green-500" : "bg-primary"}`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{Math.round(p.progress)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
