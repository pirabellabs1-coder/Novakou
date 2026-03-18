"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

interface CohortParticipant {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  progress: number;
}

interface AdminCohort {
  id: string;
  name: string;
  formationTitle: string;
  formationSlug: string;
  instructorName: string;
  enrolledCount: number;
  maxParticipants: number;
  startDate: string;
  status: string;
  completionRate: number;
  participants: CohortParticipant[];
}

const STATUS_COLORS: Record<string, string> = {
  PLANIFIE: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
  ACTIF: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  FERME: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
};

const STATUS_LABELS: Record<string, string> = {
  PLANIFIE: "Planifi\u00e9",
  ACTIF: "Actif",
  FERME: "Ferm\u00e9",
};

export default function AdminCohortsPage() {
  const locale = useLocale();
  const t = useTranslations("formations_nav");
  const [cohorts, setCohorts] = useState<AdminCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [closeModal, setCloseModal] = useState<{ id: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCohorts();
  }, []);

  const fetchCohorts = async () => {
    try {
      const res = await fetch("/api/admin/formations/cohorts");
      const data = await res.json();
      setCohorts(data.cohorts ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const closeCohort = async () => {
    if (!closeModal) return;
    setActionLoading(closeModal.id);
    try {
      await fetch(`/api/admin/formations/cohorts/${closeModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FERME" }),
      });
      setCohorts((prev) =>
        prev.map((c) => (c.id === closeModal.id ? { ...c, status: "FERME" } : c))
      );
    } catch {
      // silent
    } finally {
      setCloseModal(null);
      setActionLoading(null);
    }
  };

  const filtered = cohorts.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        c.formationTitle.toLowerCase().includes(s) ||
        c.instructorName.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const statusTabs = [
    { value: "", label: t("filter_all") },
    { value: "PLANIFIE", label: "Planifi\u00e9" },
    { value: "ACTIF", label: "Actif" },
    { value: "FERME", label: "Ferm\u00e9" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
          ))}
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-80" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        Gestion des cohortes
      </h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filterStatus === tab.value
                ? "bg-primary text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, formation ou instructeur..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="text-sm text-slate-500">
          {filtered.length} cohorte{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="border-b border-slate-200 dark:border-slate-700">
            <tr className="text-slate-500 text-xs uppercase">
              <th className="p-4 text-left w-8" />
              <th className="p-4 text-left">Nom</th>
              <th className="p-4 text-left">Formation</th>
              <th className="p-4 text-left">Instructeur</th>
              <th className="p-4 text-center">Inscrits</th>
              <th className="p-4 text-left">D\u00e9but</th>
              <th className="p-4 text-center">Statut</th>
              <th className="p-4 text-center">Compl\u00e9tion</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  Aucune cohorte trouv\u00e9e
                </td>
              </tr>
            ) : (
              filtered.map((cohort) => (
                <>
                  <tr
                    key={cohort.id}
                    className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === cohort.id ? null : cohort.id)
                        }
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {expandedId === cohort.id ? "expand_less" : "expand_more"}
                        </span>
                      </button>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {cohort.name}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xs">
                        {cohort.formationTitle}
                      </p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {cohort.instructorName}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {cohort.enrolledCount}
                      </span>
                      <span className="text-xs text-slate-400">
                        /{cohort.maxParticipants}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(cohort.startDate).toLocaleDateString(
                        locale === "en" ? "en-GB" : "fr-FR"
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[cohort.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}
                      >
                        {STATUS_LABELS[cohort.status] ?? cohort.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${Math.round(cohort.completionRate * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {Math.round(cohort.completionRate * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        {cohort.status !== "FERME" && (
                          <button
                            onClick={() =>
                              setCloseModal({ id: cohort.id, name: cohort.name })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Fermer la cohorte"
                          >
                            <span className="material-symbols-outlined text-lg">
                              lock
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded participant details */}
                  {expandedId === cohort.id && (
                    <tr key={`${cohort.id}-detail`}>
                      <td colSpan={9} className="bg-slate-50 dark:bg-slate-800/50 px-8 py-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">
                          Participants ({cohort.participants.length})
                        </p>
                        {cohort.participants.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            Aucun participant dans cette cohorte
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {cohort.participants.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                              >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                  {p.avatar ? (
                                    <img
                                      src={p.avatar}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-primary font-bold text-sm">
                                      {p.name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {p.name}
                                  </p>
                                  <p className="text-xs text-slate-500">{p.email}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full transition-all"
                                      style={{
                                        width: `${Math.round(p.progress * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-10 text-right">
                                    {Math.round(p.progress * 100)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Close cohort confirmation modal */}
      {closeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCloseModal(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600">lock</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Fermer la cohorte
                </h2>
                <p className="text-sm text-slate-500">{closeModal.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Cette action est irr\u00e9versible. Les nouveaux participants ne pourront plus
              s&apos;inscrire \u00e0 cette cohorte.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCloseModal(null)}
                className="flex-1 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300"
              >
                {t("cancel")}
              </button>
              <button
                onClick={closeCohort}
                disabled={!!actionLoading}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                Confirmer la fermeture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
