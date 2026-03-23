"use client";

import { useEffect, useState, useMemo } from "react";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "toutes", label: "Toutes" },
  { key: "en_attente", label: "En attente" },
  { key: "acceptee", label: "Acceptees" },
  { key: "refusee", label: "Refusees" },
  { key: "expiree", label: "Expirees" },
];

const STATUS_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-400", icon: "schedule" },
  acceptee: { label: "Acceptee", cls: "bg-primary/20 text-primary", icon: "check_circle" },
  refusee: { label: "Refusee", cls: "bg-red-500/20 text-red-400", icon: "cancel" },
  expiree: { label: "Expiree", cls: "bg-slate-500/20 text-slate-400", icon: "timer_off" },
};

function SkeletonCard() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-border-dark rounded-full" />
            <div className="h-5 w-16 bg-border-dark rounded-full" />
          </div>
          <div className="h-5 w-3/4 bg-border-dark rounded" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-border-dark" />
            <div className="space-y-1">
              <div className="h-3 w-28 bg-border-dark rounded" />
              <div className="h-2 w-16 bg-border-dark rounded" />
            </div>
          </div>
          <div className="h-3 w-full bg-border-dark rounded" />
          <div className="h-3 w-2/3 bg-border-dark rounded" />
          <div className="flex gap-1.5">
            <div className="h-6 w-16 bg-border-dark rounded-full" />
            <div className="h-6 w-20 bg-border-dark rounded-full" />
            <div className="h-6 w-14 bg-border-dark rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-2 w-28">
          <div className="h-8 w-full bg-border-dark rounded-lg" />
          <div className="h-8 w-full bg-border-dark rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-border-dark" />
      <div className="space-y-2">
        <div className="h-5 w-8 bg-border-dark rounded" />
        <div className="h-2 w-16 bg-border-dark rounded" />
      </div>
    </div>
  );
}

export default function ClientProposals() {
  const [tab, setTab] = useState("toutes");
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const {
    proposals,
    loading,
    syncProposals,
    acceptProposal,
    rejectProposal,
  } = useClientStore();

  useEffect(() => {
    syncProposals();
  }, [syncProposals]);

  const isLoading = loading.proposals;

  // Counts
  const counts = useMemo(() => ({
    toutes: proposals.length,
    en_attente: proposals.filter(p => p.status === "en_attente").length,
    acceptee: proposals.filter(p => p.status === "acceptee").length,
    refusee: proposals.filter(p => p.status === "refusee").length,
    expiree: proposals.filter(p => p.status === "expiree").length,
  }), [proposals]);

  const filtered = useMemo(() => {
    if (tab === "toutes") return proposals;
    return proposals.filter(p => p.status === tab);
  }, [proposals, tab]);

  const detailProposal = showDetailModal ? proposals.find(p => p.id === showDetailModal) : null;

  async function handleAccept(id: string) {
    setActionLoading(id);
    const ok = await acceptProposal(id);
    setActionLoading(null);
    if (ok) {
      addToast("success", "Proposition acceptee !");
      setShowDetailModal(null);
    } else {
      addToast("error", "Erreur lors de l'acceptation");
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    const ok = await rejectProposal(id);
    setActionLoading(null);
    if (ok) {
      addToast("success", "Proposition refusee");
      setShowDetailModal(null);
    } else {
      addToast("error", "Erreur lors du refus");
    }
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Propositions</h1>
        <p className="text-slate-400 text-sm mt-1">
          Propositions recues de freelances et agences pour vos projets.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          [
            { label: "Recues", value: counts.toutes, icon: "inbox", color: "text-white", bg: "bg-white/5" },
            { label: "En attente", value: counts.en_attente, icon: "schedule", color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Acceptees", value: counts.acceptee, icon: "check_circle", color: "text-primary", bg: "bg-primary/10" },
            { label: "Refusees", value: counts.refusee, icon: "cancel", color: "text-red-400", bg: "bg-red-500/10" },
          ].map(s => (
            <div
              key={s.label}
              className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3"
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", s.bg)}>
                <span className={cn("material-symbols-outlined", s.color)}>{s.icon}</span>
              </div>
              <div>
                <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-dark rounded-xl p-1 border border-border-dark">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === t.key
                ? "bg-primary text-background-dark shadow"
                : "text-slate-400 hover:text-white"
            )}
          >
            {t.label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              tab === t.key ? "bg-background-dark/20" : "bg-border-dark"
            )}>
              {counts[t.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Proposal cards */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">inbox</span>
            <p className="text-slate-500 font-semibold">Aucune proposition dans cette categorie</p>
            <p className="text-slate-600 text-sm mt-1">Les propositions envoyees par les freelances et agences apparaitront ici.</p>
          </div>
        ) : (
          filtered.map(p => {
            const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.en_attente;
            const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date() && p.status === "en_attente";
            return (
              <div
                key={p.id}
                className="bg-neutral-dark rounded-xl border border-border-dark p-5 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status + meta */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1", statusInfo.cls)}>
                        <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                        {isExpired ? "Expiree" : statusInfo.label}
                      </span>
                      <span className="text-xs bg-border-dark text-slate-400 px-2.5 py-1 rounded-full">
                        {p.freelanceType === "agence" ? "Agence" : "Freelance"}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{p.id}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors">
                      {p.projectTitle}
                    </h3>

                    {/* Freelancer */}
                    <div className="flex items-center gap-2 mt-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold overflow-hidden">
                        {p.freelanceAvatar ? (
                          <img src={p.freelanceAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(p.freelanceName)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{p.freelanceName}</p>
                        <p className="text-[11px] text-slate-500">
                          {p.freelanceType === "agence" ? "Agence" : "Freelance"}
                        </p>
                      </div>
                    </div>

                    {/* Description excerpt */}
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{p.description}</p>

                    {/* Skills */}
                    {p.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.skills.map(s => (
                          <span
                            key={s}
                            className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium border border-primary/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-6 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">payments</span>
                        {p.amount.toLocaleString("fr-FR")} EUR
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {p.delay}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        Recue le {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      {p.expiresAt && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">timer</span>
                          Expire le {new Date(p.expiresAt).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowDetailModal(p.id)}
                      className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-background-dark transition-all text-center"
                    >
                      Voir details
                    </button>
                    {p.status === "en_attente" && !isExpired && (
                      <>
                        <button
                          onClick={() => handleAccept(p.id)}
                          disabled={actionLoading === p.id}
                          className={cn(
                            "px-4 py-2 bg-primary text-background-dark text-xs font-bold rounded-lg hover:brightness-110 transition-all text-center",
                            actionLoading === p.id && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          disabled={actionLoading === p.id}
                          className={cn(
                            "px-4 py-2 bg-red-500/10 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-colors text-center",
                            actionLoading === p.id && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    <Link
                      href="/client/messages"
                      className="px-4 py-2 bg-border-dark text-slate-400 text-xs font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-center"
                    >
                      Contacter
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && detailProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetailModal(null)}
          />
          <div className="relative w-full max-w-2xl bg-neutral-dark rounded-2xl border border-border-dark shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-dark">
              <div>
                <h2 className="text-xl font-bold text-white">Details de la proposition</h2>
                <p className="text-sm text-slate-500 font-mono mt-0.5">{detailProposal.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                className="w-8 h-8 rounded-lg bg-border-dark flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={cn("text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5", STATUS_MAP[detailProposal.status].cls)}>
                  <span className="material-symbols-outlined text-sm">{STATUS_MAP[detailProposal.status].icon}</span>
                  {STATUS_MAP[detailProposal.status].label}
                </span>
              </div>

              {/* Freelancer */}
              <div className="flex items-center gap-3 p-4 bg-background-dark rounded-xl border border-border-dark">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold overflow-hidden">
                  {detailProposal.freelanceAvatar ? (
                    <img src={detailProposal.freelanceAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(detailProposal.freelanceName)
                  )}
                </div>
                <div>
                  <p className="font-bold text-white">{detailProposal.freelanceName}</p>
                  <p className="text-xs text-slate-500">
                    {detailProposal.freelanceType === "agence" ? "Agence" : "Freelance"}
                  </p>
                </div>
              </div>

              {/* Project */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Projet</h3>
                <p className="text-lg font-bold text-white">{detailProposal.projectTitle}</p>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{detailProposal.description}</p>
              </div>

              {/* Budget + Delay */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background-dark rounded-xl border border-border-dark">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Montant propose</p>
                  <p className="text-xl font-black text-primary">{detailProposal.amount.toLocaleString("fr-FR")} EUR</p>
                </div>
                <div className="p-4 bg-background-dark rounded-xl border border-border-dark">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Delai</p>
                  <p className="text-xl font-black text-white">{detailProposal.delay}</p>
                </div>
              </div>

              {/* Skills */}
              {detailProposal.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Competences</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailProposal.skills.map(s => (
                      <span key={s} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium border border-primary/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Recue le {new Date(detailProposal.createdAt).toLocaleDateString("fr-FR")}
                </span>
                {detailProposal.expiresAt && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">timer</span>
                    Expire le {new Date(detailProposal.expiresAt).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border-dark">
                {detailProposal.status === "en_attente" && (
                  <>
                    <button
                      onClick={() => handleAccept(detailProposal.id)}
                      disabled={actionLoading === detailProposal.id}
                      className={cn(
                        "px-5 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all",
                        actionLoading === detailProposal.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleReject(detailProposal.id)}
                      disabled={actionLoading === detailProposal.id}
                      className={cn(
                        "px-5 py-2.5 bg-red-500/10 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-colors",
                        actionLoading === detailProposal.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      Refuser
                    </button>
                  </>
                )}
                <Link
                  href="/client/messages"
                  className="px-5 py-2.5 bg-border-dark text-white text-sm font-semibold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  Contacter
                </Link>
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="px-5 py-2.5 bg-border-dark text-slate-400 text-sm font-semibold rounded-xl hover:text-white transition-colors ml-auto"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
