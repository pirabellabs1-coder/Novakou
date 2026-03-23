"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useInstructorFormations, instructorKeys } from "@/lib/formations/hooks";
import {
  Plus, Eye, Edit, BarChart2, Trash2, Copy, Archive,
  Star, Users, DollarSign, Clock, ChevronRight,
} from "lucide-react";
import DynamicIcon from "@/components/ui/DynamicIcon";

interface InstructorFormation {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  status: string;
  price: number;
  isFree: boolean;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  duration: number;
  updatedAt: string;
  _count?: { enrollments: number };
}

const STATUS_COLORS: Record<string, string> = {
  BROUILLON: "bg-slate-100 dark:bg-slate-800 text-slate-600",
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  ACTIF: "bg-green-100 text-green-700",
  ARCHIVE: "bg-red-100 text-red-700",
};

const STATUS_LABELS_FR: Record<string, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE: "En attente",
  ACTIF: "Actif",
  ARCHIVE: "Archivée",
};

const STATUS_LABELS_EN: Record<string, string> = {
  BROUILLON: "Draft",
  EN_ATTENTE: "Pending",
  ACTIF: "Active",
  ARCHIVE: "Archived",
};

export default function InstructeurMesFormationsPage() {
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: formationsData, isLoading: loading, isError: fetchError, refetch: refetchFormations } = useInstructorFormations();
  const formations: InstructorFormation[] = Array.isArray(formationsData)
    ? (formationsData as InstructorFormation[])
    : ((formationsData as { formations?: InstructorFormation[] } | undefined)?.formations ?? []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
  }, [status, router]);

  const deleteFormation = async (id: string) => {
    if (!confirm(fr ? "Supprimer cette formation ?" : "Delete this course?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/instructeur/formations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || (fr ? "Erreur lors de la suppression" : "Error deleting course"));
      } else {
        refetchFormations();
      }
    } catch {
      alert(fr ? "Erreur réseau" : "Network error");
    }
    setDeleting(null);
  };

  const duplicateFormation = async (id: string) => {
    try {
      const res = await fetch(`/api/instructeur/formations/${id}/duplicate`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || (fr ? "Erreur lors de la duplication" : "Error duplicating course"));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: instructorKeys.formations() });
    } catch {
      alert(fr ? "Erreur réseau" : "Network error");
    }
  };

  const archiveFormation = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ARCHIVE" ? "BROUILLON" : "ARCHIVE";
    try {
      const res = await fetch(`/api/instructeur/formations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || (fr ? "Erreur lors de l'archivage" : "Error archiving course"));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: instructorKeys.formations() });
    } catch {
      alert(fr ? "Erreur réseau" : "Network error");
    }
  };

  const filtered = formations.filter((f) => !filterStatus || f.status === filterStatus);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{fr ? "Mes formations" : "My Courses"}</h1>
        <Link
          href="/formations/instructeur/creer"
          className="flex items-center gap-2 bg-primary text-white font-medium px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          {fr ? "Nouvelle formation" : "New course"}
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["", "ACTIF", "BROUILLON", "EN_ATTENTE", "ARCHIVE"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filterStatus === s ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {s === "" ? (fr ? "Toutes" : "All") : (fr ? STATUS_LABELS_FR[s] : STATUS_LABELS_EN[s])}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4 animate-pulse flex gap-4">
              <div className="w-28 h-20 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">
            {fr ? "Impossible de charger vos formations" : "Failed to load your courses"}
          </p>
          <button onClick={() => refetchFormations()} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm">
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark">
          <div className="mb-4"><DynamicIcon name="library_books" className="w-12 h-12 mx-auto" /></div>
          <p className="text-slate-500 mb-4">{fr ? "Aucune formation pour l'instant" : "No courses yet"}</p>
          <Link href="/formations/instructeur/creer" className="bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors inline-block">
            {fr ? "Créer ma première formation" : "Create my first course"}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const title = f.title;
            return (
              <div key={f.id} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark hover:border-slate-300 transition-colors p-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-28 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-blue-100 overflow-hidden">
                    {f.thumbnail ? (
                      <img src={f.thumbnail} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><DynamicIcon name="school" className="w-6 h-6 opacity-30" /></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 flex-1">{title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[f.status]}`}>
                        {fr ? STATUS_LABELS_FR[f.status] : STATUS_LABELS_EN[f.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {f.studentsCount.toLocaleString()} {fr ? "apprenants" : "students"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {f.rating.toFixed(1)} ({f.reviewsCount})
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {f.isFree ? (fr ? "Gratuit" : "Free") : `${f.price.toFixed(0)}€`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(f.duration / 60)}h
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {fr ? "Mis à jour :" : "Updated:"} {new Date(f.updatedAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      href={`/formations/${f.slug}`}
                      target="_blank"
                      title={fr ? "Voir" : "View"}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/formations/instructeur/${f.id}/cohorts`}
                      title={fr ? "Cohortes" : "Cohorts"}
                      className="p-2 text-slate-400 hover:text-teal-500 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      <Users className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/formations/instructeur/${f.id}/modifier`}
                      title={fr ? "Modifier" : "Edit"}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/formations/instructeur/${f.id}/statistiques`}
                      title={fr ? "Statistiques" : "Stats"}
                      className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => duplicateFormation(f.id)}
                      title={fr ? "Dupliquer" : "Duplicate"}
                      className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => archiveFormation(f.id, f.status)}
                      title={f.status === "ARCHIVE" ? (fr ? "Désarchiver" : "Unarchive") : (fr ? "Archiver" : "Archive")}
                      className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFormation(f.id)}
                      disabled={deleting === f.id}
                      title={fr ? "Supprimer" : "Delete"}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
