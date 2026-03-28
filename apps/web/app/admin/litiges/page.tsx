"use client";

import { useState, useMemo, useEffect } from "react";
import { useToastStore } from "@/store/toast";
import { useAdminStore } from "@/store/admin";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ouvert: { label: "Ouvert", cls: "bg-red-500/20 text-red-400" },
  en_examen: { label: "En examen", cls: "bg-amber-500/20 text-amber-400" },
  resolu: { label: "Résolu", cls: "bg-emerald-500/20 text-emerald-400" },
};

const VERDICT_MAP: Record<string, { label: string; cls: string }> = {
  client: { label: "En faveur du client", cls: "text-blue-400" },
  freelance: { label: "En faveur du freelance", cls: "text-primary" },
  partiel: { label: "Remboursement partiel", cls: "text-amber-400" },
};

function DisputesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-neutral-dark rounded-xl p-4 border border-border-dark">
            <div className="h-5 w-12 bg-border-dark rounded mb-2" />
            <div className="h-3 w-20 bg-border-dark rounded" />
          </div>
        ))}
      </div>
      <div className="h-10 bg-border-dark rounded w-full" />
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <div className="space-y-3">
            <div className="h-5 w-48 bg-border-dark rounded" />
            <div className="h-4 w-full bg-border-dark rounded" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-border-dark rounded-lg" />
              <div className="h-20 bg-border-dark rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDisputes() {
  const [tab, setTab] = useState("all");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"freelance" | "client" | "partiel">("freelance");
  const [verdictNote, setVerdictNote] = useState("");
  const [partialPercent, setPartialPercent] = useState(50);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { addToast } = useToastStore();
  const { disputes, disputeSummary, loading, syncDisputes, examineDispute, resolveDispute } = useAdminStore();

  useEffect(() => {
    syncDisputes();
  }, [syncDisputes]);

  const filtered = useMemo(() => {
    if (tab === "all") return disputes;
    return disputes.filter(d => d.status === tab);
  }, [tab, disputes]);

  const stats = useMemo(() => ({
    ouvert: disputes.filter(d => d.status === "ouvert").length,
    en_examen: disputes.filter(d => d.status === "en_examen").length,
    resolu: disputes.filter(d => d.status === "resolu").length,
    total: disputeSummary?.total ?? disputes.length,
    totalAmount: disputeSummary?.totalAmountInDispute ?? disputes.filter(d => d.status !== "resolu").reduce((s, d) => s + (d.amount ?? 0), 0),
  }), [disputes, disputeSummary]);

  const dispute = disputes.find(d => d.id === resolveId);

  async function handleStartExamine(id: string) {
    setActionLoading(id);
    const ok = await examineDispute(id);
    setActionLoading(null);
    if (ok) {
      addToast("info", "Litige passé en examen");
    } else {
      addToast("error", "Erreur lors du passage en examen");
    }
  }

  async function handleResolve() {
    if (!resolveId || !verdict) return;
    if (!verdictNote.trim()) {
      addToast("warning", "Ajoutez un commentaire pour le verdict");
      return;
    }
    setActionLoading(resolveId);
    const ok = await resolveDispute(resolveId, verdict, verdictNote, verdict === "partiel" ? partialPercent : undefined);
    setActionLoading(null);

    if (ok) {
      const d = disputes.find(x => x.id === resolveId);
      if (verdict === "client") addToast("success", `Litige résolu — ${(d?.amount ?? 0).toLocaleString()} € remboursé au client`);
      else if (verdict === "freelance") addToast("success", `Litige résolu — fonds libérés au freelance`);
      else if (verdict === "partiel") addToast("success", `Litige résolu — remboursement partiel (${partialPercent}%)`);
    } else {
      addToast("error", "Erreur lors de la résolution du litige");
    }

    setResolveId(null);
    setVerdictNote("");
    setVerdict("freelance");
    setPartialPercent(50);
  }

  if (loading.disputes) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">gavel</span>
            Litiges
          </h1>
          <p className="text-slate-400 text-sm mt-1">Chargement des litiges...</p>
        </div>
        <DisputesSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">gavel</span>
          Litiges
        </h1>
        <p className="text-slate-400 text-sm mt-1">Gérez les litiges entre clients et freelances. {(stats.totalAmount ?? 0).toLocaleString()} &euro; en jeu.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Ouverts", value: stats.ouvert, color: "text-red-400", icon: "error" },
          { label: "En examen", value: stats.en_examen, color: "text-amber-400", icon: "pending" },
          { label: "Résolus", value: disputeSummary?.resolved ?? stats.resolu, color: "text-emerald-400", icon: "check_circle" },
          { label: "Montant en jeu", value: `${stats.totalAmount.toLocaleString()} \u20AC`, color: "text-blue-400", icon: "payments" },
        ].map(s => (
          <div key={s.label} className="bg-neutral-dark rounded-xl p-4 border border-border-dark">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
              <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-dark overflow-x-auto">
        {[
          { key: "ouvert", label: "Ouverts", count: stats.ouvert },
          { key: "en_examen", label: "En examen", count: stats.en_examen },
          { key: "resolu", label: "Résolus", count: stats.resolu },
          { key: "all", label: "Tous", count: stats.total },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("px-3 sm:px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5", tab === t.key ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-white")}>
            {t.label}
            <span className="text-[10px] bg-border-dark px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Dispute list */}
      <div className="space-y-3 sm:space-y-4">
        {filtered.map(d => (
          <div key={d.id} className={cn("bg-neutral-dark rounded-xl border p-3 sm:p-4 lg:p-5 transition-colors", d.status === "resolu" ? "border-border-dark/50 opacity-75" : "border-border-dark hover:border-border-dark/80")}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-mono font-bold text-primary">{d.id}</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_MAP[d.status]?.cls)}>{STATUS_MAP[d.status]?.label}</span>
                </div>
                <p className="font-semibold text-white mb-1">{d.serviceTitle || "Service inconnu"}</p>
                {d.reason && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{d.reason}</p>}

                {/* Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <p className="text-xs font-bold text-blue-400 mb-1">Client : {d.clientName}</p>
                    <p className="text-xs text-slate-400">ID : {d.clientId}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs font-bold text-primary mb-1">Freelance : {d.freelanceName || "Inconnu"}</p>
                    <p className="text-xs text-slate-400">ID : {d.freelanceId}</p>
                  </div>
                </div>

                {/* Timeline */}
                {d.timeline && d.timeline.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {d.timeline.slice(0, 3).map((t, idx) => (
                      <div key={t.id || idx} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-300">{t.title || "Evénement"}</span>
                        <span>{t.timestamp ? new Date(t.timestamp).toLocaleDateString("fr-FR") : ""}</span>
                      </div>
                    ))}
                    {d.timeline.length > 3 && (
                      <p className="text-xs text-slate-500 pl-3.5">+ {d.timeline.length - 3} événement(s)</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                  <span className="font-bold text-primary">{(d.amount ?? 0).toLocaleString()} €</span>
                  <span>{d.createdAt ? `Ouvert le ${new Date(d.createdAt).toLocaleDateString("fr-FR")}` : ""}</span>
                  {d.updatedAt && d.updatedAt !== d.createdAt && <span className="text-slate-500">Mis à jour le {new Date(d.updatedAt).toLocaleDateString("fr-FR")}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                {d.status === "ouvert" && (
                  <>
                    <button
                      onClick={() => handleStartExamine(d.id)}
                      disabled={actionLoading === d.id}
                      className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 w-full sm:w-auto"
                    >
                      {actionLoading === d.id ? "..." : "Examiner"}
                    </button>
                    <button
                      onClick={() => { setResolveId(d.id); setVerdict("freelance"); }}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto"
                    >
                      Résoudre
                    </button>
                  </>
                )}
                {d.status === "en_examen" && (
                  <button
                    onClick={() => { setResolveId(d.id); setVerdict("freelance"); }}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto"
                  >
                    Rendre le verdict
                  </button>
                )}
                {d.status === "resolu" && d.verdict && (
                  <div className="text-right">
                    <span className={cn("text-xs font-bold", VERDICT_MAP[d.verdict]?.cls)}>{VERDICT_MAP[d.verdict]?.label || d.verdict}</span>
                    {d.verdictNote && <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] truncate">{d.verdictNote}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-600">gavel</span>
            <p className="text-slate-500 mt-2">Aucun litige dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* Modal Resolution */}
      {resolveId && dispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setResolveId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-5 sm:p-6 w-full max-w-lg border border-border-dark shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-white mb-4">Résoudre le litige {dispute.id}</h3>

            {/* Resume */}
            <div className="bg-background-dark rounded-xl p-4 mb-4 border border-border-dark/50 space-y-2">
              <p className="text-sm text-slate-300"><b className="text-white">Service :</b> {dispute.serviceTitle}</p>
              <p className="text-sm text-slate-300"><b className="text-white">Montant :</b> <span className="text-primary font-bold">{(dispute.amount ?? 0).toLocaleString()} €</span></p>
              <p className="text-sm text-slate-300"><b className="text-white">Client :</b> {dispute.clientName || "—"}</p>
              <p className="text-sm text-slate-300"><b className="text-white">Freelance :</b> {dispute.freelanceName || "Inconnu"}</p>
              {dispute.reason && <p className="text-sm text-slate-300"><b className="text-white">Raison :</b> {dispute.reason}</p>}
            </div>

            {/* Arguments des parties */}
            {(dispute.clientArgument || dispute.freelanceArgument) && (
              <div className="grid grid-cols-1 gap-2 mb-4">
                {dispute.clientArgument && (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-blue-400 mb-1">Argument du client</p>
                    <p className="text-xs text-slate-300 line-clamp-4">{dispute.clientArgument}</p>
                  </div>
                )}
                {dispute.freelanceArgument && (
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">Argument du freelance</p>
                    <p className="text-xs text-slate-300 line-clamp-4">{dispute.freelanceArgument}</p>
                  </div>
                )}
              </div>
            )}

            {/* Choix du verdict */}
            <label className="text-xs font-semibold text-slate-400 mb-2 block">Verdict</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {([
                { key: "freelance" as const, label: "Freelance", desc: "Fonds libérés au freelance", icon: "person", color: "border-primary text-primary bg-primary/10" },
                { key: "client" as const, label: "Client", desc: "Remboursement total au client", icon: "person", color: "border-blue-500 text-blue-400 bg-blue-500/10" },
                { key: "partiel" as const, label: "Partiel", desc: "Remboursement partiel", icon: "pie_chart", color: "border-amber-500 text-amber-400 bg-amber-500/10" },
              ]).map(v => (
                <button key={v.key} onClick={() => setVerdict(v.key)} className={cn("p-3 rounded-xl border-2 text-left transition-all", verdict === v.key ? v.color : "border-border-dark text-slate-400 hover:border-slate-500")}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="material-symbols-outlined text-sm">{v.icon}</span>
                    <span className="text-sm font-bold">{v.label}</span>
                  </div>
                  <p className="text-xs opacity-70">{v.desc}</p>
                </button>
              ))}
            </div>

            {/* Partial percentage */}
            {verdict === "partiel" && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Pourcentage remboursé au client : {partialPercent}%</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={95}
                    step={5}
                    value={partialPercent}
                    onChange={e => setPartialPercent(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-sm font-bold text-amber-400 w-12 text-right">{partialPercent}%</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Client : {((dispute.amount ?? 0) * partialPercent / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} &euro;</span>
                  <span>Freelance : {((dispute.amount ?? 0) * (100 - partialPercent) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} &euro;</span>
                </div>
              </div>
            )}

            {/* Note */}
            <textarea value={verdictNote} onChange={e => setVerdictNote(e.target.value)} rows={3} placeholder="Commentaire du verdict (obligatoire)..." className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-white placeholder:text-slate-500 outline-none resize-none mb-4 focus:ring-2 focus:ring-primary/30" />

            <div className="flex gap-3">
              <button onClick={() => setResolveId(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleResolve} disabled={actionLoading !== null} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">Appliquer le verdict</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
