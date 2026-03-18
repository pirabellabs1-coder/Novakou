"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AdminCertificate {
  id: string;
  code: string;
  score: number;
  issuedAt: string;
  revokedAt: string | null;
  user: { name: string; email: string };
  formation: { titleFr: string; slug: string };
}

export default function AdminFormationsCertificatsPage() {
  const t = useTranslations("formations_nav");
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [revokeModal, setRevokeModal] = useState<AdminCertificate | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCertificates = () => {
    fetch("/api/admin/formations/certificats")
      .then((r) => r.json())
      .then((d) => { setCertificates(d.certificates ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchCertificates(); }, []);

  const revoke = async (id: string) => {
    setActionLoading(id);
    await fetch(`/api/admin/formations/certificats/revoke/${id}`, { method: "POST" });
    setRevokeModal(null);
    fetchCertificates();
    setActionLoading(null);
  };

  const unrevoke = async (id: string) => {
    setActionLoading(id);
    await fetch(`/api/admin/formations/certificats/revoke/${id}`, { method: "DELETE" });
    fetchCertificates();
    setActionLoading(null);
  };

  const filtered = certificates.filter((c) =>
    !search ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.user.name.toLowerCase().includes(search.toLowerCase()) ||
    c.formation.titleFr.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t("admin_certificates_title")}</h1>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin_search_certificates")} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="text-sm text-slate-500 flex items-center">{filtered.length} {t("admin_certificates_count")}</div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="border-b border-slate-200 dark:border-slate-700">
            <tr className="text-slate-500 text-xs uppercase">
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">{t("admin_col_student")}</th>
              <th className="p-4 text-left">Formation</th>
              <th className="p-4 text-left">Score</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">{t("admin_col_status")}</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">{t("loading")}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">{t("admin_no_certificates")}</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4"><Link href={`/formations/verification/${c.code}`} target="_blank" className="font-mono text-xs text-primary hover:underline">{c.code}</Link></td>
                  <td className="p-4">
                    <p className="text-sm">{c.user.name}</p>
                    <p className="text-xs text-slate-500">{c.user.email}</p>
                  </td>
                  <td className="p-4"><p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xs">{c.formation.titleFr}</p></td>
                  <td className="p-4"><span className="text-sm font-medium">{c.score}%</span></td>
                  <td className="p-4"><p className="text-xs text-slate-500">{new Date(c.issuedAt).toLocaleDateString("fr-FR")}</p></td>
                  <td className="p-4">
                    {c.revokedAt ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">{t("admin_revoked")}</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">{t("admin_authentic")}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-end">
                      {c.revokedAt ? (
                        <button onClick={() => unrevoke(c.id)} disabled={actionLoading === c.id} className="flex items-center gap-1 text-xs text-green-600 hover:bg-green-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          <span className="material-symbols-outlined text-sm">shield</span>{t("admin_reactivate")}
                        </button>
                      ) : (
                        <button onClick={() => setRevokeModal(c)} className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-sm">gpp_bad</span>{t("admin_revoke")}
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

      {/* Revoke modal */}
      {revokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRevokeModal(null)} />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold mb-2">{t("admin_revoke_certificate_title")}</h2>
            <p className="text-sm text-slate-500 mb-1">{revokeModal.user.name} — {revokeModal.formation.titleFr}</p>
            <p className="font-mono text-xs text-slate-400 mb-4">{revokeModal.code}</p>
            <p className="text-sm text-red-600 mb-4">{t("admin_revoke_warning")}</p>
            <div className="flex gap-3">
              <button onClick={() => setRevokeModal(null)} className="flex-1 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 transition-colors text-sm">{t("cancel")}</button>
              <button onClick={() => revoke(revokeModal.id)} disabled={!!actionLoading} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50">{t("admin_revoke")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
