"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AdminApprenant {
  id: string;
  createdAt: string;
  progress: number;
  completedAt: string | null;
  paidAmount: number;
  user: { name: string; email: string; avatar: string | null; image: string | null };
  formation: { title: string; slug: string };
  certificate: { code: string } | null;
}

export default function AdminApprenantsPage() {
  const t = useTranslations("formations_nav");
  const [enrollments, setEnrollments] = useState<AdminApprenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/formations/apprenants")
      .then((r) => r.json())
      .then((d) => { setEnrollments(d.enrollments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = enrollments.filter((e) =>
    !search ||
    e.user.name.toLowerCase().includes(search.toLowerCase()) ||
    e.user.email.toLowerCase().includes(search.toLowerCase()) ||
    e.formation.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t("admin_students_title")}</h1>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin_search_students")}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-sm text-slate-500 flex items-center">{filtered.length} {t("admin_enrollments")}</div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="border-b border-slate-200 dark:border-slate-700">
            <tr className="text-slate-500 text-xs uppercase">
              <th className="p-4 text-left">{t("admin_col_student")}</th>
              <th className="p-4 text-left">Formation</th>
              <th className="p-4 text-left">{t("admin_col_progress")}</th>
              <th className="p-4 text-left">{t("admin_col_payment")}</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">{t("admin_col_certificate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t("loading")}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t("admin_no_students")}</td></tr>
            ) : (
              filtered.map((e) => {
                const avatar = e.user.avatar || e.user.image;
                return (
                  <tr key={e.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {avatar ? <img src={avatar} alt={e.user.name} className="w-full h-full object-cover" /> : <span className="text-primary font-bold text-sm">{(e.user?.name || "?").charAt(0)}</span>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{e.user.name}</p>
                          <p className="text-xs text-slate-500">{e.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xs">{e.formation.title}</p></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(e.progress * 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{Math.round(e.progress * 100)}%</span>
                      </div>
                      {e.completedAt && <span className="text-xs text-green-600">{t("admin_completed")}</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{e.paidAmount === 0 ? t("free") : `${e.paidAmount.toFixed(0)}€`}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(e.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="p-4">
                      {e.certificate ? (
                        <Link href={`/formations/verification/${e.certificate.code}`} target="_blank" className="text-xs text-green-600 hover:underline font-mono">{e.certificate.code}</Link>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
