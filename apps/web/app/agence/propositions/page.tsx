"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Proposition {
  id: string;
  title: string;
  description: string;
  amount: number;
  deliveryDays: number;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
  service?: { id: string; title: string; slug: string } | null;
  client?: { id: string; name: string; image?: string | null } | null;
  order?: { id: string; status: string } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: "En attente", color: "bg-yellow-500/10 text-yellow-400", icon: "schedule" },
  SENT: { label: "Envoyee", color: "bg-blue-500/10 text-blue-400", icon: "send" },
  VIEWED: { label: "Vue", color: "bg-indigo-500/10 text-indigo-400", icon: "visibility" },
  ACCEPTED: { label: "Acceptee", color: "bg-emerald-500/10 text-emerald-400", icon: "check_circle" },
  REJECTED: { label: "Refusee", color: "bg-red-500/10 text-red-400", icon: "cancel" },
  EXPIRED: { label: "Expiree", color: "bg-slate-500/10 text-slate-400", icon: "timer_off" },
  WITHDRAWN: { label: "Retiree", color: "bg-slate-500/10 text-slate-400", icon: "undo" },
};

const FILTERS = ["Toutes", "En attente", "Acceptees", "Refusees", "Expirees"];

export default function AgencePropositionsPage() {
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Toutes");

  const fetchPropositions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/propositions?role=freelance");
      if (res.ok) {
        const data = await res.json();
        setPropositions(data.propositions || []);
      }
    } catch (err) {
      console.error("Erreur chargement propositions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPropositions();
  }, [fetchPropositions]);

  const filtered = useMemo(() => {
    if (filter === "Toutes") return propositions;
    if (filter === "En attente") return propositions.filter((p) => ["PENDING", "SENT", "VIEWED"].includes(p.status));
    if (filter === "Acceptees") return propositions.filter((p) => p.status === "ACCEPTED");
    if (filter === "Refusees") return propositions.filter((p) => p.status === "REJECTED");
    if (filter === "Expirees") return propositions.filter((p) => p.status === "EXPIRED");
    return propositions;
  }, [propositions, filter]);

  const counts = useMemo(() => ({
    total: propositions.length,
    pending: propositions.filter((p) => ["PENDING", "SENT", "VIEWED"].includes(p.status)).length,
    accepted: propositions.filter((p) => p.status === "ACCEPTED").length,
    rejected: propositions.filter((p) => p.status === "REJECTED").length,
  }), [propositions]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">Propositions Envoyees</h1>
        <p className="text-slate-400 mt-1">Suivez les propositions envoyees par votre agence aux clients.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, icon: "send", color: "text-blue-400" },
          { label: "En attente", value: counts.pending, icon: "schedule", color: "text-amber-400" },
          { label: "Acceptees", value: counts.accepted, icon: "check_circle", color: "text-emerald-400" },
          { label: "Refusees", value: counts.rejected, icon: "cancel", color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-background-dark/50 border border-border-dark rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
              <span className="text-xs font-semibold text-slate-500">{s.label}</span>
            </div>
            <p className="text-2xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === f ? "bg-primary/10 text-primary" : "bg-background-dark/50 text-slate-500 hover:text-slate-300"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-background-dark/50 rounded-xl border border-border-dark">
          <span className="material-symbols-outlined text-4xl text-slate-500 mb-2 block">local_offer</span>
          <p className="text-sm text-slate-400">Aucune proposition trouvee.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const st = STATUS_MAP[p.status] || STATUS_MAP.PENDING;
            return (
              <div key={p.id} className="bg-background-dark/50 border border-border-dark rounded-xl p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-sm truncate">{p.title}</h3>
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", st.color)}>
                        <span className="material-symbols-outlined text-xs">{st.icon}</span>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      {p.client?.name && <span>Client : {p.client.name}</span>}
                      {p.service?.title && <span> — Service : {p.service.title}</span>}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">payments</span>
                        {p.amount.toFixed(2)} EUR
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {p.deliveryDays}j
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  {p.order && (
                    <Link href={`/agence/commandes/${p.order.id}`} className="text-xs text-primary font-bold hover:underline flex items-center gap-1 whitespace-nowrap">
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Voir commande
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
