"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";
import { StCard, StPageHeader, StButton, StChip, ST } from "@/components/stitch";
import { Inbox } from "lucide-react";

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

const STATUS_LABEL: Record<Exclude<Status, "ALL">, { label: string; tone: "green" | "amber" | "blue" | "rose" | "neutral" }> = {
  PENDING_COOLDOWN: { label: "Cooldown 72h", tone: "amber" },
  AWAITING_REVIEW: { label: "À traiter", tone: "blue" },
  APPROVED: { label: "Approuvée", tone: "rose" },
  REJECTED: { label: "Refusée", tone: "neutral" },
  CANCELLED: { label: "Annulée", tone: "neutral" },
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
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-5">
        <StPageHeader
          title="Demandes de suppression de compte"
          subtitle="Validez les demandes après le cooldown de 72h. Toute suppression est définitive."
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {(["AWAITING_REVIEW", "PENDING_COOLDOWN", "APPROVED", "REJECTED", "CANCELLED", "ALL"] as Status[]).map((s) => {
            const on = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="px-3.5 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors whitespace-nowrap"
                style={on ? { background: ST.greenDark, color: "#fff" } : { background: "#fff", border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
              >
                {s === "ALL" ? "Tout" : STATUS_LABEL[s as Exclude<Status, "ALL">].label}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-[18px]" style={{ background: ST.divider }} />
            <div className="h-32 animate-pulse rounded-[18px]" style={{ background: ST.divider }} />
          </div>
        ) : items.length === 0 ? (
          <StCard className="!p-16 text-center flex flex-col items-center">
            <Inbox size={40} style={{ color: "#d6e0da" }} />
            <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>Aucune demande</p>
            <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>Aucune demande ne correspond à ce filtre.</p>
          </StCard>
        ) : (
          <div className="space-y-3">
            {items.map((it) => {
              const meta = STATUS_LABEL[it.status];
              const cooldownDone = new Date(it.cooldownUntil).getTime() <= Date.now();
              const canApprove = it.status === "AWAITING_REVIEW" || (it.status === "PENDING_COOLDOWN" && cooldownDone);
              const canReject = it.status === "AWAITING_REVIEW" || it.status === "PENDING_COOLDOWN";
              return (
                <StCard key={it.id}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] font-extrabold" style={{ color: ST.text }}>
                          {it.user.name ?? it.user.email}
                        </p>
                        <StChip tone={meta.tone}>{meta.label}</StChip>
                        {it.user.formationsRole && (
                          <StChip tone="neutral">{it.user.formationsRole}</StChip>
                        )}
                      </div>
                      <p className="text-[12px] mt-1" style={{ color: ST.textSecondary }}>{it.user.email}</p>
                      <p className="text-[11px] mt-1" style={{ color: ST.textMuted }}>
                        Compte créé le {fmt(it.user.createdAt)} · KYC niveau {it.user.kyc}
                      </p>
                    </div>
                    <div className="text-right text-[11px] flex-shrink-0" style={{ color: ST.textSecondary }}>
                      <p>Demande : <strong style={{ color: ST.text }}>{fmt(it.requestedAt)}</strong></p>
                      <p>
                        Fin cooldown :{" "}
                        <strong style={{ color: cooldownDone ? ST.blueText : ST.amberText }}>
                          {fmt(it.cooldownUntil)}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[12px] p-3 mb-3" style={{ background: ST.bg, border: `1px solid ${ST.divider}` }}>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: ST.textMuted }}>Raison</p>
                    <p className="text-[13.5px] leading-relaxed" style={{ color: ST.text }}>{it.reason}</p>
                  </div>

                  {it.adminNote && (
                    <div className="rounded-[12px] p-3 mb-3" style={{ background: ST.blueSoft, border: "1px solid #cfe3f5" }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: ST.blueText }}>Note admin</p>
                      <p className="text-[13.5px] leading-relaxed" style={{ color: "#0c447c" }}>{it.adminNote}</p>
                    </div>
                  )}

                  {(canApprove || canReject) && (
                    <div className="flex gap-2 justify-end">
                      {canReject && (
                        <StButton
                          variant="secondary"
                          size="sm"
                          onClick={() => decide(it.id, "reject", it.user.email)}
                          disabled={acting === it.id}
                        >
                          Refuser
                        </StButton>
                      )}
                      {canApprove && (
                        <button
                          onClick={() => decide(it.id, "approve", it.user.email)}
                          disabled={acting === it.id}
                          className="inline-flex items-center justify-center px-4 py-2.5 rounded-[12px] text-[13px] font-extrabold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                          style={{ background: ST.roseText }}
                        >
                          {acting === it.id ? "…" : "Supprimer le compte"}
                        </button>
                      )}
                    </div>
                  )}
                </StCard>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
