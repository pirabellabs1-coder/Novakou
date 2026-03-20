"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Award, Search, Shield, ShieldOff } from "lucide-react";

interface AdminCertificate {
  id: string;
  code: string;
  score: number;
  issuedAt: string;
  revokedAt: string | null;
  user: { name: string; email: string };
  formation: { title: string; slug: string };
}

export default function AdminFormationsCertificatsPage() {
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
    c.user.email.toLowerCase().includes(search.toLowerCase()) ||
    c.formation.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-xl font-bold text-white">Certificats — Formations</h1>

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
              href.includes("certificats") ? "bg-primary text-white" : "text-slate-400 hover:text-white hover:bg-border-dark/50"
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
            placeholder="Rechercher par code, apprenant, formation..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-sm text-slate-400 flex items-center">
          {filtered.length} certificat{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border-dark">
            <tr className="text-slate-400 text-xs uppercase">
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Apprenant</th>
              <th className="p-4 text-left">Formation</th>
              <th className="p-4 text-left">Score</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Statut</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">Chargement...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">Aucun certificat</td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-border-dark/30 transition-colors">
                  <td className="p-4">
                    <Link
                      href={`/formations/verification/${c.code}`}
                      target="_blank"
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {c.code}
                    </Link>
                  </td>
                  <td className="p-4">
                    <p className="text-white text-sm">{c.user.name}</p>
                    <p className="text-xs text-slate-500">{c.user.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300 text-sm line-clamp-1 max-w-xs">{c.formation.title}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-white">{c.score}%</span>
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-slate-400">{new Date(c.issuedAt).toLocaleDateString("fr-FR")}</p>
                  </td>
                  <td className="p-4">
                    {c.revokedAt ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                        Révoqué
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                        Authentique
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-end">
                      {c.revokedAt ? (
                        <button
                          onClick={() => unrevoke(c.id)}
                          disabled={actionLoading === c.id}
                          className="flex items-center gap-1 text-xs text-green-400 hover:bg-green-500/10 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          title="Réactiver"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Réactiver
                        </button>
                      ) : (
                        <button
                          onClick={() => setRevokeModal(c)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:bg-red-500/10 px-2 py-1.5 rounded-lg transition-colors"
                          title="Révoquer"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                          Révoquer
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
          <div className="absolute inset-0 bg-black/60" onClick={() => setRevokeModal(null)} />
          <div className="relative bg-neutral-dark border border-border-dark rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-white mb-2">Révoquer ce certificat ?</h2>
            <p className="text-sm text-slate-400 mb-1">{revokeModal.user.name} — {revokeModal.formation.title}</p>
            <p className="font-mono text-xs text-slate-500 mb-4">{revokeModal.code}</p>
            <p className="text-sm text-red-400 mb-4">
              ⚠️ Le certificat sera marqué comme invalide sur la page de vérification publique.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeModal(null)}
                className="flex-1 border border-border-dark text-slate-300 py-2.5 rounded-xl hover:bg-border-dark/50 transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => revoke(revokeModal.id)}
                disabled={!!actionLoading}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                Révoquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
