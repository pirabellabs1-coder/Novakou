"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Search, RefreshCw, Download } from "lucide-react";

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

export default function AdminApprenantsFomationsPage() {
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
    <div className="p-8 space-y-6">
      <h1 className="text-xl font-bold text-white">Apprenants — Formations</h1>

      {/* Sub-nav */}
      <div className="flex gap-1 bg-border-dark/30 rounded-xl p-1 w-fit">
        {([
          ["/admin/formations/dashboard", "Dashboard"],
          ["/admin/formations/liste", "Formations"],
          ["/admin/formations/instructeurs", "Instructeurs"],
          ["/admin/formations/apprenants", "Apprenants"],
          ["/admin/formations/finances", "Finances"],
          ["/admin/formations/certificats", "Certificats"],
          ["/admin/formations/categories", "Catégories"],
        ] as [string, string][]).map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              href.includes("apprenants") ? "bg-primary text-white" : "text-slate-400 hover:text-white hover:bg-border-dark/50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou formation..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-sm text-slate-400 flex items-center">{filtered.length} inscriptions</div>
      </div>

      {/* Table */}
      <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border-dark">
            <tr className="text-slate-400 text-xs uppercase">
              <th className="p-4 text-left">Apprenant</th>
              <th className="p-4 text-left">Formation</th>
              <th className="p-4 text-left">Progression</th>
              <th className="p-4 text-left">Paiement</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Certificat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">Chargement...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">Aucun apprenant trouvé</td>
              </tr>
            ) : (
              filtered.map((e) => {
                const avatar = e.user.avatar || e.user.image;
                return (
                  <tr key={e.id} className="hover:bg-border-dark/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {avatar ? (
                            <img src={avatar} alt={e.user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary font-bold text-sm">{e.user.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{e.user.name}</p>
                          <p className="text-xs text-slate-500">{e.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-300 text-sm line-clamp-1 max-w-xs">{e.formation.title}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-border-dark rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.round(e.progress * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{Math.round(e.progress * 100)}%</span>
                      </div>
                      {e.completedAt && (
                        <span className="text-xs text-green-400">✓ Terminé</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-white">
                        {e.paidAmount === 0 ? "Gratuit" : `${e.paidAmount.toFixed(0)}€`}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-slate-400">{new Date(e.createdAt).toLocaleDateString("fr-FR")}</p>
                    </td>
                    <td className="p-4">
                      {e.certificate ? (
                        <Link
                          href={`/formations/verification/${e.certificate.code}`}
                          target="_blank"
                          className="text-xs text-green-400 hover:underline font-mono"
                        >
                          {e.certificate.code}
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
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
