"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Users, Search, Download } from "lucide-react";
import { useInstructorStudents } from "@/lib/formations/hooks";

interface InstructeurApprenant {
  id: string;
  createdAt: string;
  progress: number;
  completedAt: string | null;
  paidAmount: number;
  user: { name: string; email: string; avatar: string | null; image: string | null };
  formation: { titleFr: string; slug: string };
}

export default function InstructeurApprenantsPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const [search, setSearch] = useState("");

  const { data, isLoading: loading, error: queryError, refetch } = useInstructorStudents();
  const apprenants: InstructeurApprenant[] = (data as { apprenants?: InstructeurApprenant[] } | null)?.apprenants ?? [];
  const error = queryError ? (queryError as Error).message || (fr ? "Erreur lors du chargement des apprenants" : "Error loading students") : "";

  const filtered = apprenants.filter((a) =>
    !search ||
    a.user.name.toLowerCase().includes(search.toLowerCase()) ||
    a.user.email.toLowerCase().includes(search.toLowerCase()) ||
    a.formation.titleFr.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const rows = [
      fr
        ? ["Nom", "Email", "Formation", "Progression (%)", "Paiement (€)", "Date inscription", "Complété"]
        : ["Name", "Email", "Course", "Progress (%)", "Payment (€)", "Enrollment date", "Completed"],
      ...filtered.map((a) => [
        a.user.name,
        a.user.email,
        a.formation.titleFr,
        Math.round(a.progress * 100).toString(),
        a.paidAmount.toFixed(2),
        new Date(a.createdAt).toLocaleDateString(fr ? "fr-FR" : "en-US"),
        a.completedAt ? (fr ? "Oui" : "Yes") : (fr ? "Non" : "No"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apprenants.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{fr ? "Mes apprenants" : "My students"}</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white dark:hover:text-white border border-slate-200 dark:border-slate-700 dark:border-border-dark hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-border-dark/50 px-3 py-2 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search + count */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={fr ? "Rechercher par nom, email ou formation..." : "Search by name, email or course..."}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Users className="w-4 h-4" />
          {filtered.length} {fr ? `apprenant${filtered.length > 1 ? "s" : ""}` : `student${filtered.length > 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
          <span>{error}</span>
          <button
            onClick={() => refetch()}
            className="ml-4 px-3 py-1.5 bg-red-100 dark:bg-red-800/40 hover:bg-red-200 dark:hover:bg-red-800/60 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-700 dark:border-border-dark">
            <tr className="text-slate-500 dark:text-slate-400 text-xs uppercase">
              <th className="p-4 text-left">{fr ? "Apprenant" : "Student"}</th>
              <th className="p-4 text-left">{fr ? "Formation" : "Course"}</th>
              <th className="p-4 text-left">{fr ? "Progression" : "Progress"}</th>
              <th className="p-4 text-left">{fr ? "Paiement" : "Payment"}</th>
              <th className="p-4 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">{fr ? "Chargement..." : "Loading..."}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">{fr ? "Aucun apprenant trouvé" : "No students found"}</td></tr>
            ) : (
              filtered.map((a) => {
                const avatar = a.user.avatar || a.user.image;
                return (
                  <tr key={a.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-border-dark/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {avatar ? (
                            <img src={avatar} alt={a.user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary font-bold text-xs">{a.user.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white text-sm">{a.user.name}</p>
                          <p className="text-xs text-slate-500">{a.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-1 max-w-xs">{a.formation.titleFr}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 dark:bg-border-dark rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.round(a.progress * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{Math.round(a.progress * 100)}%</span>
                      </div>
                      {a.completedAt && <span className="text-xs text-green-500 dark:text-green-400">{fr ? "Terminé" : "Completed"}</span>}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-900 dark:text-white">
                        {a.paidAmount === 0 ? (fr ? "Gratuit" : "Free") : `${a.paidAmount.toFixed(0)}\u20AC`}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
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
