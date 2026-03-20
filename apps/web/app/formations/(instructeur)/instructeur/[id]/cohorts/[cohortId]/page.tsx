"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users, MessageSquare, Settings, Award, AlertCircle } from "lucide-react";
import CohortChat from "@/components/formations/CohortChat";

interface Participant {
  id: string;
  progress: number;
  completedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null; image: string | null; country: string | null };
  certificate: { code: string } | null;
}

interface CohortDetail {
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
  schedule: unknown;
  _count?: { enrollments: number; messages: number };
  formation?: { title: string; slug: string };
}

const STATUS_LABELS_FR: Record<string, string> = {
  OUVERT: "Ouvert", COMPLET: "Complet", EN_COURS: "En cours", TERMINE: "Terminé", ANNULE: "Annulé",
};
const STATUS_LABELS_EN: Record<string, string> = {
  OUVERT: "Open", COMPLET: "Full", EN_COURS: "In Progress", TERMINE: "Completed", ANNULE: "Cancelled",
};

export default function InstructeurCohortDetailPage({ params }: { params: Promise<{ id: string; cohortId: string }> }) {
  const { id, cohortId } = use(params);
  const locale = useLocale();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [cohort, setCohort] = useState<CohortDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tab, setTab] = useState<"participants" | "chat" | "settings">("participants");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (authStatus !== "authenticated") return;

    Promise.all([
      fetch(`/api/instructeur/formations/${id}/cohorts/${cohortId}`).then((r) => r.json()),
      fetch(`/api/instructeur/formations/${id}/cohorts/${cohortId}/participants`).then((r) => r.json()),
    ]).then(([cohortData, participantsData]) => {
      setCohort(cohortData);
      setParticipants(participantsData.participants ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authStatus, router, id, cohortId]);

  const updateStatus = async (newStatus: string) => {
    if (!confirm(fr ? `Passer la cohorte en "${newStatus}" ?` : `Set cohort status to "${newStatus}"?`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/instructeur/formations/${id}/cohorts/${cohortId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setCohort(data);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || (fr ? "Erreur lors de la mise à jour du statut" : "Error updating cohort status"));
      }
    } catch {
      alert(fr ? "Erreur réseau" : "Network error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!cohort) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-700">Cohorte introuvable</h2>
      <p className="text-sm text-slate-500">Cette cohorte n&apos;existe pas ou a ete supprimee.</p>
      <Link href={`/formations/instructeur/${id}/cohorts`} className="text-sm text-primary font-medium hover:underline">
        Retour aux cohortes
      </Link>
    </div>
  );

  const title = cohort.title;
  const avgProgress = participants.length > 0
    ? Math.round(participants.reduce((s, p) => s + p.progress, 0) / participants.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/formations/instructeur/${id}/cohorts`} className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500">
            {fr ? STATUS_LABELS_FR[cohort.status] : STATUS_LABELS_EN[cohort.status]} — {cohort.currentCount}/{cohort.maxParticipants} {fr ? "participants" : "participants"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4">
          <p className="text-xs text-slate-500">{fr ? "Participants" : "Participants"}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{cohort.currentCount}/{cohort.maxParticipants}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4">
          <p className="text-xs text-slate-500">{fr ? "Progression moyenne" : "Avg Progress"}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{avgProgress}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4">
          <p className="text-xs text-slate-500">{fr ? "Messages" : "Messages"}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{cohort._count?.messages ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4">
          <p className="text-xs text-slate-500">{fr ? "Revenus" : "Revenue"}</p>
          <p className="text-xl font-bold text-primary">{(cohort.price * cohort.currentCount * 0.7).toFixed(0)}€</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6">
        {([
          ["participants", fr ? "Participants" : "Participants", Users],
          ["chat", fr ? "Chat" : "Chat", MessageSquare],
          ["settings", fr ? "Paramètres" : "Settings", Settings],
        ] as [string, string, typeof Users][]).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === key ? "bg-white dark:bg-slate-900 dark:bg-neutral-dark text-slate-900 dark:text-white dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Participants tab */}
      {tab === "participants" && (
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark overflow-hidden">
          {participants.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>{fr ? "Aucun participant inscrit" : "No participants enrolled"}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 uppercase">
                  <th className="text-left px-4 py-3">{fr ? "Participant" : "Participant"}</th>
                  <th className="text-left px-4 py-3">{fr ? "Progression" : "Progress"}</th>
                  <th className="text-left px-4 py-3">{fr ? "Inscrit le" : "Enrolled"}</th>
                  <th className="text-left px-4 py-3">{fr ? "Certificat" : "Certificate"}</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                          {(p.user.avatar || p.user.image) ? (
                            <img src={p.user.avatar || p.user.image!} alt={p.user.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">
                              {(p.user?.name || "?").charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{p.user.name}</p>
                          {p.user.country && <p className="text-xs text-slate-400">{p.user.country}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${p.progress >= 100 ? "bg-green-500" : "bg-primary"}`}
                            style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{Math.round(p.progress)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                    </td>
                    <td className="px-4 py-3">
                      {p.certificate ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Award className="w-3.5 h-3.5" />
                          {p.certificate.code}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Chat tab */}
      {tab === "chat" && session?.user && (
        <CohortChat
          cohortId={cohortId}
          currentUserId={session.user.id}
          isInstructor={true}
          formationId={id}
          locale={locale}
        />
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 mb-3">{fr ? "Informations" : "Details"}</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">{fr ? "Début" : "Start"}</span>
                <p className="font-medium">{new Date(cohort.startDate).toLocaleString(fr ? "fr-FR" : "en-US")}</p>
              </div>
              <div>
                <span className="text-slate-500">{fr ? "Fin" : "End"}</span>
                <p className="font-medium">{new Date(cohort.endDate).toLocaleString(fr ? "fr-FR" : "en-US")}</p>
              </div>
              <div>
                <span className="text-slate-500">{fr ? "Deadline inscription" : "Enrollment Deadline"}</span>
                <p className="font-medium">{new Date(cohort.enrollmentDeadline).toLocaleString(fr ? "fr-FR" : "en-US")}</p>
              </div>
              <div>
                <span className="text-slate-500">{fr ? "Prix" : "Price"}</span>
                <p className="font-medium">{cohort.price}€</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{fr ? "Actions" : "Actions"}</h3>
            <div className="flex flex-wrap gap-2">
              {cohort.status === "OUVERT" && (
                <>
                  {cohort.currentCount > 0 && (
                    <button onClick={() => updateStatus("EN_COURS")} disabled={updating}
                      className="px-4 py-2 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50">
                      {fr ? "Démarrer maintenant" : "Start Now"}
                    </button>
                  )}
                  <button onClick={() => updateStatus("ANNULE")} disabled={updating}
                    className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                    {fr ? "Annuler la cohorte" : "Cancel Cohort"}
                  </button>
                </>
              )}
              {cohort.status === "COMPLET" && (
                <button onClick={() => updateStatus("EN_COURS")} disabled={updating}
                  className="px-4 py-2 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50">
                  {fr ? "Démarrer maintenant" : "Start Now"}
                </button>
              )}
              {cohort.status === "EN_COURS" && (
                <button onClick={() => updateStatus("TERMINE")} disabled={updating}
                  className="px-4 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50">
                  {fr ? "Terminer la cohorte" : "End Cohort"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
