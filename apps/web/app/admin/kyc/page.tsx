"use client";

import { useState, useMemo, useEffect } from "react";
import { useToastStore } from "@/store/dashboard";
import { useAdminStore } from "@/store/admin";
import { cn } from "@/lib/utils";

const LEVEL_MAP: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: "Niveau 1", desc: "Email verifie", color: "text-slate-400" },
  2: { label: "Niveau 2", desc: "Telephone verifie", color: "text-blue-400" },
  3: { label: "Niveau 3", desc: "Identite verifiee", color: "text-amber-400" },
  4: { label: "Niveau 4", desc: "Verification pro", color: "text-emerald-400" },
};

function KycSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-neutral-dark rounded-xl p-5 border border-border-dark">
            <div className="h-6 w-16 bg-border-dark rounded mb-2" />
            <div className="h-4 w-24 bg-border-dark rounded" />
          </div>
        ))}
      </div>
      <div className="h-10 bg-border-dark rounded w-full" />
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-border-dark shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-border-dark rounded" />
              <div className="h-4 w-60 bg-border-dark rounded" />
              <div className="h-4 w-48 bg-border-dark rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminKYC() {
  const [tab, setTab] = useState("all");
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { addToast } = useToastStore();
  const { kycRequests, kycSummary, loading, syncKyc, approveKyc, refuseKyc } = useAdminStore();

  useEffect(() => {
    syncKyc();
  }, [syncKyc]);

  const filtered = useMemo(() => {
    if (tab === "all") return kycRequests;
    const lvl = parseInt(tab);
    if (!isNaN(lvl)) return kycRequests.filter(r => r.nextLevel === lvl);
    return kycRequests;
  }, [tab, kycRequests]);

  const stats = useMemo(() => ({
    total: kycSummary?.total ?? kycRequests.length,
    byLevel: kycSummary?.byLevel ?? {},
  }), [kycSummary, kycRequests]);

  async function handleApprove(userId: string, nextLevel: number) {
    const req = kycRequests.find(r => r.userId === userId);
    setActionLoading(userId);
    const ok = await approveKyc(userId, nextLevel);
    setActionLoading(null);
    if (ok) {
      addToast("success", `KYC de ${req?.name} approuve — niveau ${nextLevel} active`);
    } else {
      addToast("error", "Erreur lors de l'approbation du KYC");
    }
  }

  async function handleRefuse() {
    if (!rejectUserId || !rejectReason.trim()) {
      addToast("warning", "Indiquez un motif de refus");
      return;
    }
    const req = kycRequests.find(r => r.userId === rejectUserId);
    setActionLoading(rejectUserId);
    const ok = await refuseKyc(rejectUserId, rejectReason);
    setActionLoading(null);
    if (ok) {
      addToast("success", `KYC de ${req?.name} refuse`);
    } else {
      addToast("error", "Erreur lors du refus du KYC");
    }
    setRejectUserId(null);
    setRejectReason("");
  }

  if (loading.kyc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">verified</span>
            Verifications KYC
          </h1>
          <p className="text-slate-400 text-sm mt-1">Validez les demandes de verification d&apos;identite.</p>
        </div>
        <KycSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">verified</span>
          Verifications KYC
        </h1>
        <p className="text-slate-400 text-sm mt-1">Validez les demandes de verification d&apos;identite.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total demandes", value: stats.total, color: "text-primary", icon: "assignment" },
          { label: "Niveau 2 (telephone)", value: stats.byLevel["2"] ?? 0, color: "text-blue-400", icon: "phone_android" },
          { label: "Niveau 3 (identite)", value: stats.byLevel["3"] ?? 0, color: "text-amber-400", icon: "badge" },
          { label: "Niveau 4 (pro)", value: stats.byLevel["4"] ?? 0, color: "text-emerald-400", icon: "workspace_premium" },
        ].map(s => (
          <div key={s.label} className="bg-neutral-dark rounded-xl p-5 border border-border-dark">
            <div className="flex items-center gap-3 mb-2">
              <span className={cn("material-symbols-outlined", s.color)}>{s.icon}</span>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            </div>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-border-dark overflow-x-auto">
        {[
          { key: "all", label: "Tous", count: kycRequests.length },
          { key: "2", label: "Niveau 2", count: kycRequests.filter(r => r.nextLevel === 2).length },
          { key: "3", label: "Niveau 3", count: kycRequests.filter(r => r.nextLevel === 3).length },
          { key: "4", label: "Niveau 4", count: kycRequests.filter(r => r.nextLevel === 4).length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5", tab === t.key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300")}>
            {t.label}
            <span className="text-[10px] bg-border-dark px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {filtered.map(r => {
          const levelInfo = LEVEL_MAP[r.nextLevel];
          return (
            <div key={r.userId} className="bg-neutral-dark rounded-xl border border-border-dark p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-white">{r.name}</h3>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", levelInfo?.color === "text-blue-400" ? "bg-blue-500/20 text-blue-400" : levelInfo?.color === "text-amber-400" ? "bg-amber-500/20 text-amber-400" : levelInfo?.color === "text-emerald-400" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400")}>
                        {levelInfo?.label}
                      </span>
                      <span className="text-xs bg-border-dark text-slate-400 px-2 py-0.5 rounded-full">{r.role}</span>
                    </div>
                    <p className="text-sm text-slate-400">{r.email}</p>
                    <p className="text-sm text-slate-400 mt-0.5">Niveau actuel : <b className="text-white">{r.currentLevel}</b> → Demande : <b className="text-white">{r.nextLevel}</b></p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-slate-500">Soumis le {new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(r.userId, r.nextLevel)}
                    disabled={actionLoading === r.userId}
                    className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === r.userId ? "..." : "Approuver"}
                  </button>
                  <button
                    onClick={() => setRejectUserId(r.userId)}
                    disabled={actionLoading === r.userId}
                    className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-600">verified</span>
            <p className="text-slate-500 mt-2">Aucune demande dans cette categorie</p>
          </div>
        )}
      </div>

      {/* Modal refus */}
      {rejectUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectUserId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-md border border-border-dark shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4">Motif de refus</h3>
            <p className="text-sm text-slate-400 mb-3">Ce motif sera communique a l&apos;utilisateur par email et notification.</p>
            {/* Presets de motifs de refus */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                "Document non lisible",
                "Identite ne correspond pas",
                "Document invalide ou expire",
                "Informations incompletes",
                "Selfie ne correspond pas au document",
                "Document non accepte",
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                    rejectReason === reason
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-border-dark text-slate-400 hover:text-white hover:border-slate-500"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Expliquez le motif du refus ou selectionnez un motif ci-dessus..." className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-white placeholder:text-slate-500 outline-none resize-none mb-4 focus:ring-2 focus:ring-primary/30" />
            <div className="flex gap-3">
              <button onClick={() => setRejectUserId(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleRefuse} disabled={actionLoading !== null} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50">Confirmer le refus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
