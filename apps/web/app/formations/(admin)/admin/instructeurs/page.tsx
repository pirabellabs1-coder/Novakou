"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface InstructeurAdmin {
  id: string;
  status: string;
  expertise: string[];
  bioFr: string | null;
  linkedin: string | null;
  website: string | null;
  createdAt: string;
  user: { name: string; email: string; avatar: string | null; image: string | null };
  _count: { formations: number };
}

const STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
  APPROUVE: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  SUSPENDU: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
};

export default function AdminInstructeursPage() {
  const searchParams = useSearchParams();
  const t = useTranslations("formations_nav");
  const [instructeurs, setInstructeurs] = useState<InstructeurAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") ?? "");
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchInstructeurs(); }, [filterStatus]);

  const fetchInstructeurs = async () => {
    const params = filterStatus ? `?status=${filterStatus}` : "";
    const res = await fetch(`/api/admin/instructeurs/list${params}`);
    const data = await res.json();
    setInstructeurs(data.instructeurs ?? []);
    setLoading(false);
  };

  const approve = async (id: string) => {
    setActionLoading(id);
    await fetch(`/api/admin/instructeurs/approve/${id}`, { method: "POST" });
    fetchInstructeurs();
    setActionLoading(null);
  };

  const reject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    await fetch(`/api/admin/instructeurs/reject/${rejectModal.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setRejectModal(null);
    setRejectReason("");
    fetchInstructeurs();
    setActionLoading(null);
  };

  const filtered = instructeurs.filter((i) => !filterStatus || i.status === filterStatus);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t("admin_instructors_title")}</h1>

      {/* Filters */}
      <div className="flex gap-2">
        {["", "EN_ATTENTE", "APPROUVE", "SUSPENDU"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filterStatus === s
                ? "bg-primary text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {s === "" ? t("filter_all") : s === "EN_ATTENTE" ? t("filter_pending") : s === "APPROUVE" ? t("filter_approved") : t("filter_suspended")}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-slate-400">{t("loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">{t("admin_no_instructors")}</div>
        ) : (
          filtered.map((instr) => {
            const avatar = instr.user.avatar || instr.user.image;
            return (
              <div key={instr.id} className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt={instr.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">{instr.user.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900 dark:text-white">{instr.user.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[instr.status]}`}>
                        {instr.status === "EN_ATTENTE" ? t("filter_pending") : instr.status === "APPROUVE" ? t("filter_approved") : t("filter_suspended")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{instr.user.email}</p>
                    {instr.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {instr.expertise.slice(0, 5).map((e) => (
                          <span key={e} className="text-xs bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{e}</span>
                        ))}
                      </div>
                    )}
                    {instr.bioFr && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{instr.bioFr}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">library_books</span>{instr._count.formations} formations</span>
                      {instr.linkedin && <a href={instr.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>}
                      <span>{new Date(instr.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {instr.status === "EN_ATTENTE" && (
                      <>
                        <button onClick={() => approve(instr.id)} disabled={actionLoading === instr.id} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                          <span className="material-symbols-outlined text-sm">check_circle</span>{t("admin_approve")}
                        </button>
                        <button onClick={() => setRejectModal({ id: instr.id, name: instr.user.name })} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 transition-colors">
                          <span className="material-symbols-outlined text-sm">cancel</span>{t("admin_reject")}
                        </button>
                      </>
                    )}
                    {instr.status === "APPROUVE" && (
                      <button
                        onClick={() => { setRejectModal({ id: instr.id, name: instr.user.name }); setRejectReason("Suspension du compte instructeur"); }}
                        className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xs font-medium px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">pause_circle</span>{t("admin_suspend")}
                      </button>
                    )}
                    {instr.status === "SUSPENDU" && (
                      <button onClick={() => approve(instr.id)} disabled={actionLoading === instr.id} className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-600 text-xs font-medium px-3 py-2 rounded-lg border border-green-200 dark:border-green-800 transition-colors">
                        <span className="material-symbols-outlined text-sm">check_circle</span>{t("admin_reactivate")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold mb-2 text-slate-900 dark:text-white">{rejectModal.name}</h2>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} minLength={10} placeholder={t("admin_reject_reason_placeholder")} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }} className="flex-1 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm text-slate-700 dark:text-slate-300">{t("cancel")}</button>
              <button onClick={reject} disabled={rejectReason.length < 10 || !!actionLoading} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50">{t("confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
