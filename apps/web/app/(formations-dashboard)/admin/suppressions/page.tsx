"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";

type Status = "PENDING_COOLDOWN" | "AWAITING_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED" | "ALL";

interface DeletionRequest {
  id: string;
  reason: string;
  status: Exclude<Status, "ALL">;
  requestedAt: string;
  cooldownUntil: string;
  reviewedAt: string | null;
  adminNote: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    formationsRole: string | null;
    createdAt: string;
    kyc: number;
  };
}

const STATUS_LABEL: Record<Exclude<Status, "ALL">, { label: string; cls: string }> = {
  PENDING_COOLDOWN: { label: "Cooldown 72h", cls: "bg-amber-100 text-amber-700" },
  AWAITING_REVIEW: { label: "À traiter", cls: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "Approuvée", cls: "bg-red-100 text-red-700" },
  REJECTED: { label: "Refusée", cls: "bg-gray-100 text-gray-700" },
  CANCELLED: { label: "Annulée", cls: "bg-gray-100 text-gray-500" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminSuppressionsPage() {
  const [filter, setFilter] = useState<Status>("AWAITING_REVIEW");
  const [items, setItems] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const toast = useToastStore.getState().addToast;

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/suppressions?status=${filter}`);
      const j = await r.json();
      setItems(j.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function decide(id: string, decision: "approve" | "reject", userEmail: string) {
    const note = decision === "reject"
      ? prompt("Motif du refus (sera envoyé au demandeur)")
      : (confirm(`Confirmer la SUPPRESSION DÉFINITIVE du compte ${userEmail} ?\n\nCette action est irréversible.`) ? "" : null);
    if (note === null) return;
    setActing(id);
    try {
      const r = await fetch(`/api/admin/suppressions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast("error", j.error ?? "Erreur");
        return;
      }
      toast("success", decision === "approve" ? "Compte supprimé" : "Demande refusée");
      await load();
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Demandes de suppression de compte</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            Validez les demandes après le cooldown de 72h. Toute suppression est définitive.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["AWAITING_REVIEW", "PENDING_COOLDOWN", "APPROVED", "REJECTED", "CANCELLED", "ALL"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                filter === s ? "bg-[#191c1e] text-white" : "bg-white border border-gray-200 text-[#5c647a] hover:bg-gray-50"
              }`}
            >
              {s === "ALL" ? "Tout" : STATUS_LABEL[s as Exclude<Status, "ALL">].label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-32 bg-white rounded-2xl border border-gray-100" />
            <div className="h-32 bg-white rounded-2xl border border-gray-100" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <span className="material-symbols-outlined text-5xl text-gray-300">inbox</span>
            <p className="text-base font-bold text-[#191c1e] mt-3">Aucune demande</p>
            <p className="text-sm text-[#5c647a] mt-1">Aucune demande ne correspond à ce filtre.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => {
              const meta = STATUS_LABEL[it.status];
              const cooldownDone = new Date(it.cooldownUntil).getTime() <= Date.now();
              const canApprove = it.status === "AWAITING_REVIEW" || (it.status === "PENDING_COOLDOWN" && cooldownDone);
              const canReject = it.status === "AWAITING_REVIEW" || it.status === "PENDING_COOLDOWN";
              return (
                <div key={it.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-extrabold text-[#191c1e]">
                          {it.user.name ?? it.user.email}
                        </p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.cls}`}>
                          {meta.label}
                        </span>
                        {it.user.formationsRole && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {it.user.formationsRole}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5c647a] mt-1">{it.user.email}</p>
                      <p className="text-[11px] text-[#5c647a] mt-1">
                        Compte créé le {fmt(it.user.createdAt)} · KYC niveau {it.user.kyc}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-[#5c647a] flex-shrink-0">
                      <p>Demande : <strong>{fmt(it.requestedAt)}</strong></p>
                      <p>
                        Fin cooldown :{" "}
                        <strong className={cooldownDone ? "text-blue-700" : "text-amber-700"}>
                          {fmt(it.cooldownUntil)}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c647a] mb-1">Raison</p>
                    <p className="text-sm text-[#191c1e] leading-relaxed">{it.reason}</p>
                  </div>

                  {it.adminNote && (
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">Note admin</p>
                      <p className="text-sm text-blue-900 leading-relaxed">{it.adminNote}</p>
                    </div>
                  )}

                  {(canApprove || canReject) && (
                    <div className="flex gap-2 justify-end">
                      {canReject && (
                        <button
                          onClick={() => decide(it.id, "reject", it.user.email)}
                          disabled={acting === it.id}
                          className="px-4 py-2 rounded-xl bg-gray-100 text-[#5c647a] text-sm font-bold hover:bg-gray-200 disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      )}
                      {canApprove && (
                        <button
                          onClick={() => decide(it.id, "approve", it.user.email)}
                          disabled={acting === it.id}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                        >
                          {acting === it.id ? "…" : "Supprimer le compte"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
