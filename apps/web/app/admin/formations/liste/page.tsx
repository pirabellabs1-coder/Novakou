"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Archive, Trash2, Eye, Star, Users, Filter } from "lucide-react";

interface AdminFormation {
  id: string;
  slug: string;
  title: string;
  title: string;
  status: string;
  price: number;
  isFree: boolean;
  rating: number;
  studentsCount: number;
  reviewsCount: number;
  category: { name: string };
  instructeur: { user: { name: string } };
  createdAt: string;
  publishedAt: string | null;
  refuseReason: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  BROUILLON: "bg-slate-800 text-slate-300",
  EN_ATTENTE: "bg-yellow-500/10 text-yellow-400",
  ACTIF: "bg-green-500/10 text-green-400",
  ARCHIVE: "bg-red-500/10 text-red-400",
};

export default function AdminFormationsListePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [formations, setFormations] = useState<AdminFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") ?? "");
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFormations();
  }, [filterStatus]);

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
    <div className="p-8 space-y-6">
      <h1 className="text-xl font-bold text-white">Formations — Modération</h1>

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
              href.includes("liste") ? "bg-primary text-white" : "text-slate-400 hover:text-white hover:bg-border-dark/50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "ACTIF", "EN_ATTENTE", "BROUILLON", "ARCHIVE"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filterStatus === s ? "bg-primary text-white" : "bg-border-dark text-slate-400 hover:text-white"
            }`}
          >
            {s === "" ? "Toutes" : s === "EN_ATTENTE" ? "En attente" : s === "BROUILLON" ? "Brouillon" : s === "ACTIF" ? "Actif" : "Archivé"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border-dark">
            <tr className="text-slate-400 text-xs uppercase">
              <th className="p-4 text-left">Formation</th>
              <th className="p-4 text-left">Instructeur</th>
              <th className="p-4 text-left">Statut</th>
              <th className="p-4 text-left">Stats</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">Chargement...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">Aucune formation</td>
              </tr>
            ) : (
              filtered.map((f) => (
                <tr key={f.id} className="hover:bg-border-dark/30 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="text-white font-medium text-sm line-clamp-2 max-w-xs">{f.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{f.category.name} · {f.isFree ? "Gratuit" : `${f.price.toFixed(0)}€`}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300 text-sm">{f.instructeur.user.name}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[f.status] ?? "bg-slate-800 text-slate-300"}`}>
                      {f.status === "EN_ATTENTE" ? "En attente" : f.status === "ACTIF" ? "Actif" : f.status === "BROUILLON" ? "Brouillon" : "Archivé"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{f.studentsCount}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{f.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-slate-400">
                      {new Date(f.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/formations/${f.slug}`} target="_blank" className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {f.status === "EN_ATTENTE" && (
                        <>
                          <button
                            onClick={() => approve(f.id)}
                            disabled={actionLoading === f.id}
                            className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Approuver"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: f.id, title: f.title })}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Refuser"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {f.status === "ACTIF" && (
                        <button
                          onClick={async () => {
                            setActionLoading(f.id);
                            await fetch(`/api/admin/formations/reject/${f.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Archivé par l'admin" }) });
                            fetchFormations();
                            setActionLoading(null);
                          }}
                          disabled={actionLoading === f.id}
                          className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                          title="Archiver"
                        >
                          <Archive className="w-4 h-4" />
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
          <div className="absolute inset-0 bg-black/60" onClick={() => setRejectModal(null)} />
          <div className="relative bg-neutral-dark border border-border-dark rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-white mb-2">Refuser la formation</h2>
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{rejectModal.title}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              minLength={10}
              placeholder="Raison du refus (min. 10 caractères)..."
              className="w-full bg-border-dark border border-border-dark/60 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 border border-border-dark text-slate-300 py-2.5 rounded-xl hover:bg-border-dark/50 transition-colors text-sm">Annuler</button>
              <button
                onClick={reject}
                disabled={rejectReason.length < 10 || !!actionLoading}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
