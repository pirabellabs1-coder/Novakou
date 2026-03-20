"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Pause, BookOpen, Users, Eye } from "lucide-react";

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
  EN_ATTENTE: "bg-yellow-500/10 text-yellow-400",
  APPROUVE: "bg-green-500/10 text-green-400",
  SUSPENDU: "bg-red-500/10 text-red-400",
};

export default function AdminInstructeursPage() {
  const searchParams = useSearchParams();

  const [instructeurs, setInstructeurs] = useState<InstructeurAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") ?? "");
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInstructeurs();
  }, [filterStatus]);

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-xl font-bold text-white">Instructeurs — Modération</h1>

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
              href.includes("instructeurs") ? "bg-primary text-white" : "text-slate-400 hover:text-white hover:bg-border-dark/50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["", "EN_ATTENTE", "APPROUVE", "SUSPENDU"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filterStatus === s ? "bg-primary text-white" : "bg-border-dark text-slate-400 hover:text-white"
            }`}
          >
            {s === "" ? "Tous" : s === "EN_ATTENTE" ? "En attente" : s === "APPROUVE" ? "Approuvé" : "Suspendu"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Aucun instructeur{filterStatus ? ` avec le statut "${filterStatus}"` : ""}
          </div>
        ) : (
          filtered.map((instr) => {
            const avatar = instr.user.avatar || instr.user.image;
            return (
              <div key={instr.id} className="bg-neutral-dark border border-border-dark rounded-xl p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt={instr.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
                        {(instr.user?.name || "?").charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{instr.user.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[instr.status]}`}>
                        {instr.status === "EN_ATTENTE" ? "En attente" : instr.status === "APPROUVE" ? "Approuvé" : "Suspendu"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{instr.user.email}</p>
                    {instr.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {instr.expertise.slice(0, 5).map((e) => (
                          <span key={e} className="text-xs bg-border-dark text-slate-300 px-2 py-0.5 rounded-full">{e}</span>
                        ))}
                      </div>
                    )}
                    {instr.bioFr && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{instr.bioFr}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{instr._count.formations} formations</span>
                      {instr.linkedin && <a href={instr.linkedin} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">LinkedIn</a>}
                      <span>Candidature : {new Date(instr.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {instr.status === "EN_ATTENTE" && (
                      <>
                        <button
                          onClick={() => approve(instr.id)}
                          disabled={actionLoading === instr.id}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approuver
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: instr.id, name: instr.user.name })}
                          className="flex items-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-medium px-3 py-2 rounded-lg border border-red-500/20 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Refuser
                        </button>
                      </>
                    )}
                    {instr.status === "APPROUVE" && (
                      <button
                        onClick={() => {
                          setRejectModal({ id: instr.id, name: instr.user.name });
                          setRejectReason("Suspension du compte instructeur");
                        }}
                        className="flex items-center gap-1.5 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 text-xs font-medium px-3 py-2 rounded-lg border border-orange-500/20 transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Suspendre
                      </button>
                    )}
                    {instr.status === "SUSPENDU" && (
                      <button
                        onClick={() => approve(instr.id)}
                        disabled={actionLoading === instr.id}
                        className="flex items-center gap-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 text-xs font-medium px-3 py-2 rounded-lg border border-green-500/20 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Réactiver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject/Suspend modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRejectModal(null)} />
          <div className="relative bg-neutral-dark border border-border-dark rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-white mb-2">Action sur {rejectModal.name}</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              minLength={10}
              placeholder="Raison (min. 10 caractères)..."
              className="w-full bg-border-dark border border-border-dark/60 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }} className="flex-1 border border-border-dark text-slate-300 py-2.5 rounded-xl hover:bg-border-dark/50 transition-colors text-sm">Annuler</button>
              <button
                onClick={reject}
                disabled={rejectReason.length < 10 || !!actionLoading}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
