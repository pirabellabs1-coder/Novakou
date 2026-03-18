"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

interface AdminDiscussion {
  id: string;
  title: string;
  formationTitle: string;
  authorName: string;
  authorAvatar: string | null;
  reportCount: number;
  repliesCount: number;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIF: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  VERROUILLE: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
  SUPPRIME: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIF: "Actif",
  VERROUILLE: "Verrouill\u00e9",
  SUPPRIME: "Supprim\u00e9",
};

export default function AdminDiscussionsPage() {
  const locale = useLocale();
  const t = useTranslations("formations_nav");
  const [discussions, setDiscussions] = useState<AdminDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reported" | "all">("reported");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    id: string;
    title: string;
    action: "delete" | "restore";
  } | null>(null);

  useEffect(() => {
    fetchDiscussions();
  }, [activeTab]);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const params = activeTab === "reported" ? "?filter=reported" : "";
      const res = await fetch(`/api/admin/formations/discussions${params}`);
      const data = await res.json();
      setDiscussions(data.discussions ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (id: string, action: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/formations/discussions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchDiscussions();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const handleDestructiveAction = (
    id: string,
    title: string,
    action: "delete" | "restore"
  ) => {
    setConfirmModal({ id, title, action });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        Mod\u00e9ration des discussions
      </h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("reported")}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            activeTab === "reported"
              ? "bg-primary text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span className="material-symbols-outlined text-sm">flag</span>
          Signal\u00e9es
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            activeTab === "all"
              ? "bg-primary text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span className="material-symbols-outlined text-sm">forum</span>
          Toutes
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[850px]">
            <thead className="border-b border-slate-200 dark:border-slate-700">
              <tr className="text-slate-500 text-xs uppercase">
                <th className="p-4 text-left">Titre</th>
                <th className="p-4 text-left">Formation</th>
                <th className="p-4 text-left">Auteur</th>
                <th className="p-4 text-center">Signalements</th>
                <th className="p-4 text-center">R\u00e9ponses</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {discussions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    {activeTab === "reported"
                      ? "Aucune discussion signal\u00e9e"
                      : "Aucune discussion trouv\u00e9e"}
                  </td>
                </tr>
              ) : (
                discussions.map((disc) => (
                  <tr
                    key={disc.id}
                    className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-medium text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                        {disc.title}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xs">
                        {disc.formationTitle}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {disc.authorAvatar ? (
                            <img
                              src={disc.authorAvatar}
                              alt={disc.authorName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-primary font-bold text-xs">
                              {disc.authorName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {disc.authorName}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {disc.reportCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-xs">flag</span>
                          {disc.reportCount}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">0</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="flex items-center justify-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <span className="material-symbols-outlined text-sm">chat</span>
                        {disc.repliesCount}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[disc.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}
                      >
                        {STATUS_LABELS[disc.status] ?? disc.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(disc.createdAt).toLocaleDateString(
                        locale === "en" ? "en-GB" : "fr-FR"
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Lock / Unlock */}
                        {disc.status === "ACTIF" && (
                          <button
                            onClick={() => performAction(disc.id, "lock")}
                            disabled={actionLoading === disc.id}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Verrouiller"
                          >
                            <span className="material-symbols-outlined text-lg">lock</span>
                          </button>
                        )}
                        {disc.status === "VERROUILLE" && (
                          <button
                            onClick={() => performAction(disc.id, "unlock")}
                            disabled={actionLoading === disc.id}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="D\u00e9verrouiller"
                          >
                            <span className="material-symbols-outlined text-lg">
                              lock_open
                            </span>
                          </button>
                        )}

                        {/* Delete */}
                        {disc.status !== "SUPPRIME" && (
                          <button
                            onClick={() =>
                              handleDestructiveAction(disc.id, disc.title, "delete")
                            }
                            disabled={actionLoading === disc.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            <span className="material-symbols-outlined text-lg">
                              delete
                            </span>
                          </button>
                        )}

                        {/* Restore */}
                        {disc.status === "SUPPRIME" && (
                          <button
                            onClick={() =>
                              handleDestructiveAction(disc.id, disc.title, "restore")
                            }
                            disabled={actionLoading === disc.id}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Restaurer"
                          >
                            <span className="material-symbols-outlined text-lg">
                              restore
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmModal.action === "delete"
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    confirmModal.action === "delete" ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {confirmModal.action === "delete" ? "delete" : "restore"}
                </span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  {confirmModal.action === "delete"
                    ? "Supprimer la discussion"
                    : "Restaurer la discussion"}
                </h2>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-2 line-clamp-2">
              {confirmModal.title}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {confirmModal.action === "delete"
                ? "Cette discussion sera masqu\u00e9e pour tous les utilisateurs."
                : "Cette discussion redeviendra visible pour les utilisateurs."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() =>
                  performAction(confirmModal.id, confirmModal.action)
                }
                disabled={!!actionLoading}
                className={`flex-1 text-white font-bold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50 ${
                  confirmModal.action === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmModal.action === "delete" ? "Supprimer" : "Restaurer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
