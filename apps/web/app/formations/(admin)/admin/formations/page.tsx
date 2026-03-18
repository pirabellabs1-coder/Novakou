"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface AdminFormation {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  status: string;
  price: number;
  isFree: boolean;
  rating: number;
  studentsCount: number;
  reviewsCount: number;
  category: { nameFr: string };
  instructeur: { user: { name: string } };
  createdAt: string;
  publishedAt: string | null;
  refuseReason: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  BROUILLON: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
  EN_ATTENTE: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
  ACTIF: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  ARCHIVE: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
};

export default function AdminFormationsListPage() {
  const searchParams = useSearchParams();
  const t = useTranslations("formations_nav");
  const [formations, setFormations] = useState<AdminFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") ?? "");
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchFormations(); }, [filterStatus]);

  const fetchFormations = async () => {
    const params = filterStatus ? `?status=${filterStatus}` : "";
    const res = await fetch(`/api/admin/formations/list${params}`);
    const data = await res.json();
    setFormations(data.formations ?? []);
    setLoading(false);
  };

  const approve = async (id: string) => {
    setActionLoading(id);
    await fetch(`/api/admin/formations/approve/${id}`, { method: "POST" });
    fetchFormations();
    setActionLoading(null);
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    await fetch(`/api/admin/formations/reject/${rejectModal.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setRejectModal(null);
    setRejectReason("");
    fetchFormations();
    setActionLoading(null);
  };

  const filtered = formations.filter((f) => !filterStatus || f.status === filterStatus);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t("admin_formations_title")}</h1>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "ACTIF", "EN_ATTENTE", "BROUILLON", "ARCHIVE"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filterStatus === s
                ? "bg-primary text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {s === "" ? t("filter_all") : s === "EN_ATTENTE" ? t("filter_pending") : s === "BROUILLON" ? t("filter_draft") : s === "ACTIF" ? t("filter_active") : t("filter_archived")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="border-b border-slate-200 dark:border-slate-700">
            <tr className="text-slate-500 text-xs uppercase">
              <th className="p-4 text-left">Formation</th>
              <th className="p-4 text-left">{t("admin_col_instructor")}</th>
              <th className="p-4 text-left">{t("admin_col_status")}</th>
              <th className="p-4 text-left">Stats</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t("loading")}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t("admin_no_formations")}</td></tr>
            ) : (
              filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-sm line-clamp-2 max-w-xs">{f.titleFr}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{f.category.nameFr} · {f.isFree ? "Gratuit" : `${f.price.toFixed(0)}€`}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{f.instructeur.user.name}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[f.status] ?? ""}`}>
                      {f.status === "EN_ATTENTE" ? t("filter_pending") : f.status === "ACTIF" ? t("filter_active") : f.status === "BROUILLON" ? t("filter_draft") : t("filter_archived")}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">groups</span>{f.studentsCount}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm fill-amber-400 text-amber-500">star</span>{f.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-500">{new Date(f.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/formations/${f.slug}`} target="_blank" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </Link>
                      {f.status === "EN_ATTENTE" && (
                        <>
                          <button onClick={() => approve(f.id)} disabled={actionLoading === f.id} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title={t("admin_approve")}>
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </button>
                          <button onClick={() => setRejectModal({ id: f.id, title: f.titleFr })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t("admin_reject")}>
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                        </>
                      )}
                      {f.status === "ACTIF" && (
                        <button
                          onClick={async () => {
                            setActionLoading(f.id);
                            await fetch(`/api/admin/formations/reject/${f.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Archivé par l'admin", status: "ARCHIVE" }) });
                            fetchFormations();
                            setActionLoading(null);
                          }}
                          disabled={actionLoading === f.id}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title={t("admin_archive")}
                        >
                          <span className="material-symbols-outlined text-lg">archive</span>
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

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold mb-2">{t("admin_reject_formation")}</h2>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{rejectModal.title}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              minLength={10}
              placeholder={t("admin_reject_reason_placeholder")}
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 transition-colors text-sm">{t("cancel")}</button>
              <button onClick={reject} disabled={rejectReason.length < 10 || !!actionLoading} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50">{t("admin_reject")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
