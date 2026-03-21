"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus, Users, Calendar, Trash2, Eye, ChevronLeft,
} from "lucide-react";
import { useInstructorCohorts, useInstructorMutation, instructorKeys } from "@/lib/formations/hooks";
import dynamic from "next/dynamic";

const FormationRichEditor = dynamic(
  () => import("@/components/formations/FormationRichEditor").then((m) => m.FormationRichEditor),
  { ssr: false, loading: () => <div className="h-[120px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

interface Cohort {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  enrollmentDeadline: string;
  durationDays: number;
  maxParticipants: number;
  currentCount: number;
  price: number;
  originalPrice: number | null;
  status: string;
  schedule: unknown;
  _count?: { enrollments: number; messages: number };
}

const STATUS_COLORS: Record<string, string> = {
  OUVERT: "bg-green-100 text-green-700",
  COMPLET: "bg-blue-100 text-blue-700",
  EN_COURS: "bg-yellow-100 text-yellow-700",
  TERMINE: "bg-slate-100 dark:bg-slate-800 text-slate-600",
  ANNULE: "bg-red-100 text-red-600",
};

const STATUS_LABELS_FR: Record<string, string> = {
  OUVERT: "Ouvert", COMPLET: "Complet", EN_COURS: "En cours", TERMINE: "Terminé", ANNULE: "Annulé",
};
const STATUS_LABELS_EN: Record<string, string> = {
  OUVERT: "Open", COMPLET: "Full", EN_COURS: "In Progress", TERMINE: "Completed", ANNULE: "Cancelled",
};

interface FormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  enrollmentDeadline: string;
  maxParticipants: number;
  price: number;
  originalPrice: string;
  schedule: string;
}

const emptyForm: FormData = {
  title: "", description: "",
  startDate: "", endDate: "", enrollmentDeadline: "",
  maxParticipants: 20, price: 0, originalPrice: "", schedule: "",
};

export default function InstructeurCohortsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const { data: cohortsData, isLoading: loading, error: queryError, refetch } = useInstructorCohorts(id);
  const cohorts: Cohort[] = (cohortsData as { cohorts?: Cohort[] } | null)?.cohorts ?? [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
  }, [status, router]);

  useEffect(() => {
    if (queryError) setError(fr ? "Erreur lors du chargement" : "Loading error");
  }, [queryError, fr]);

  const createMutation = useInstructorMutation(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/instructeur/formations/${id}/cohorts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? (fr ? "Erreur" : "Error"));
      }
      return res.json();
    },
    [instructorKeys.cohorts(id)]
  );

  const deleteMutation = useInstructorMutation(
    async (cohortId: string) => {
      const res = await fetch(`/api/instructeur/formations/${id}/cohorts/${cohortId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? (fr ? "Erreur" : "Error"));
      }
    },
    [instructorKeys.cohorts(id)]
  );

  const saving = createMutation.isPending;

  const createCohort = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let parsedSchedule = null;
    if (form.schedule.trim()) {
      try { parsedSchedule = JSON.parse(form.schedule); }
      catch { setError(fr ? "JSON du programme invalide" : "Invalid schedule JSON"); return; }
    }

    createMutation.mutate(
      {
        ...form,
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        schedule: parsedSchedule,
      },
      {
        onSuccess: () => { setShowForm(false); setForm(emptyForm); },
        onError: (err) => setError(err instanceof Error ? err.message : (fr ? "Erreur" : "Error")),
      }
    );
  };

  const deleteCohort = (cohortId: string) => {
    if (!confirm(fr ? "Supprimer cette cohorte ?" : "Delete this cohort?")) return;
    deleteMutation.mutate(cohortId, {
      onError: (err) => alert(err instanceof Error ? err.message : (fr ? "Erreur" : "Error")),
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/formations/instructeur/mes-formations`} className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{fr ? "Gestion des cohortes" : "Cohort Management"}</h1>
          <p className="text-sm text-slate-500">{fr ? "Créez et gérez vos sessions de groupe" : "Create and manage your group sessions"}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          {fr ? "Nouvelle cohorte" : "New Cohort"}
        </button>
      </div>

      {/* Query error */}
      {queryError && !error && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400 mb-6">
          <span>{fr ? "Erreur lors du chargement des cohortes" : "Error loading cohorts"}</span>
          <button
            onClick={() => refetch()}
            className="ml-4 px-3 py-1.5 bg-red-100 dark:bg-red-800/40 hover:bg-red-200 dark:hover:bg-red-800/60 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={createCohort} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark border dark:border-border-dark rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-bold text-lg">{fr ? "Créer une cohorte" : "Create a Cohort"}</h2>

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{fr ? "Titre" : "Title"}</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{fr ? "Description" : "Description"}</label>
            <FormationRichEditor
              content={form.description}
              onChange={(html) => setForm({ ...form, description: html })}
              placeholder={fr ? "Description de la cohorte..." : "Cohort description..."}
              minHeight={120}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{fr ? "Date de début" : "Start Date"}</label>
              <input required type="datetime-local" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{fr ? "Date de fin" : "End Date"}</label>
              <input required type="datetime-local" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{fr ? "Deadline inscription" : "Enrollment Deadline"}</label>
              <input required type="datetime-local" value={form.enrollmentDeadline}
                onChange={(e) => setForm({ ...form, enrollmentDeadline: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{fr ? "Max participants" : "Max Participants"}</label>
              <input required type="number" min={2} max={500} value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{fr ? "Prix (€)" : "Price (€)"}</label>
              <input required type="number" min={0} step={0.01} value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{fr ? "Prix barré (€)" : "Original Price (€)"}</label>
              <input type="number" min={0} step={0.01} value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                placeholder={fr ? "Optionnel" : "Optional"}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{fr ? "Programme (JSON, optionnel)" : "Schedule (JSON, optional)"}</label>
            <textarea value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              rows={3} placeholder='[{"week": 1, "title": "Introduction", "topics": ["..."]}]'
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setError(""); }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
              {fr ? "Annuler" : "Cancel"}
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "..." : (fr ? "Créer la cohorte" : "Create Cohort")}
            </button>
          </div>
        </form>
      )}

      {/* Cohorts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-5 animate-pulse">
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : cohorts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-500 mb-4">{fr ? "Aucune cohorte pour l'instant" : "No cohorts yet"}</p>
          <button onClick={() => setShowForm(true)}
            className="bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {fr ? "Créer ma première cohorte" : "Create my first cohort"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cohorts.map((c) => {
            const title = c.title;
            const placesLeft = c.maxParticipants - c.currentCount;

            return (
              <div key={c.id} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark hover:border-slate-300 transition-colors p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>
                        {fr ? STATUS_LABELS_FR[c.status] : STATUS_LABELS_EN[c.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.startDate).toLocaleDateString(fr ? "fr-FR" : "en-US")} — {new Date(c.endDate).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.currentCount}/{c.maxParticipants} ({placesLeft} {fr ? "restantes" : "remaining"})
                      </span>
                      <span className="font-medium text-primary">{c.price}€</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/formations/instructeur/${id}/cohorts/${c.id}`}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      title={fr ? "Gérer" : "Manage"}>
                      <Eye className="w-4 h-4" />
                    </Link>
                    {c.status === "OUVERT" && c.currentCount === 0 && (
                      <button onClick={() => deleteCohort(c.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={fr ? "Supprimer" : "Delete"}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(c.currentCount / c.maxParticipants) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-400">{Math.round((c.currentCount / c.maxParticipants) * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
