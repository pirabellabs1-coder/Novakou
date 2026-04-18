"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";

type Dispute = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  paidAmount: number;
  status: string;
  escrowStatus: string;
  cancelledBy: string | null;
  cancelRequestedAt: string | null;
  cancellationReason: string | null;
  studentGoals: string | null;
  adminDecisionAt: string | null;
  adminDecisionBy: string | null;
  adminDecisionOutcome: string | null;
  adminDecisionNote: string | null;
  mentor: { user: { id: string; name: string | null; email: string; image: string | null } };
  student: { id: string; name: string | null; email: string; image: string | null };
  adminResolver?: { id: string; name: string | null; email: string } | null;
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

const OUTCOME_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  refund_student: { label: "Remboursé à l'apprenant", color: "bg-blue-100 text-blue-700", icon: "undo" },
  release_to_mentor: { label: "Libéré au mentor", color: "bg-[#006e2f]/10 text-[#006e2f]", icon: "payments" },
  split_50_50: { label: "Partage 50/50", color: "bg-amber-100 text-amber-700", icon: "balance" },
};

export default function MentorDisputesAdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"open" | "history">("open");
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery<{ data: Dispute[]; counts?: { open: number; history: number } }>({
    queryKey: ["admin-mentor-disputes", tab],
    queryFn: () => fetch(`/api/formations/admin/mentor-disputes?scope=${tab}`).then((r) => r.json()),
    staleTime: 30_000,
  });

  const { data: countsData } = useQuery<{ counts: { open: number; history: number } }>({
    queryKey: ["admin-mentor-disputes-counts"],
    queryFn: () => fetch("/api/formations/admin/mentor-disputes?scope=all").then((r) => r.json()),
    staleTime: 60_000,
  });

  const counts = countsData?.counts ?? data?.counts ?? { open: 0, history: 0 };

  const decideMutation = useMutation({
    mutationFn: async (args: { id: string; outcome: "refund_student" | "release_to_mentor" | "split_50_50"; note: string }) => {
      const res = await fetch(`/api/formations/admin/mentor-disputes/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: args.outcome, note: args.note }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      return res.json();
    },
    onSuccess: () => {
      useToastStore.getState().addToast("success", "Décision enregistrée — archivée dans l'historique");
      qc.invalidateQueries({ queryKey: ["admin-mentor-disputes"] });
      qc.invalidateQueries({ queryKey: ["admin-mentor-disputes-counts"] });
      setSelected(null);
      setNote("");
    },
    onError: (e) => useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur"),
  });

  async function handleDecide(outcome: "refund_student" | "release_to_mentor" | "split_50_50") {
    if (!selected) return;
    const labels = {
      refund_student: "Rembourser intégralement l'apprenant",
      release_to_mentor: "Libérer les fonds vers le mentor",
      split_50_50: "Partager 50/50 entre les deux parties",
    };
    const ok = await confirmAction({
      title: "Confirmer la décision",
      message: `${labels[outcome]} ?\n\nMontant : ${formatFCFA(selected.paidAmount)} FCFA\nMotif admin : ${note || "Aucun"}`,
      confirmVariant: outcome === "refund_student" ? "default" : "warning",
      confirmLabel: "Confirmer",
    });
    if (!ok) return;
    decideMutation.mutate({ id: selected.id, outcome, note });
  }

  const items = data?.data ?? [];

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Disputes mentor</h1>
        <p className="text-sm text-[#5c647a] mt-1">
          Annulations de sessions. Chaque décision est archivée et consultable.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100">
        {[
          { id: "open" as const, label: "En cours", count: counts.open, icon: "gavel" },
          { id: "history" as const, label: "Historique", count: counts.history, icon: "history" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelected(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[1px] transition-colors ${
              tab === t.id ? "border-[#006e2f] text-[#006e2f]" : "border-transparent text-[#5c647a] hover:text-[#191c1e]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              tab === t.id ? "bg-[#006e2f]/10 text-[#006e2f]" : "bg-gray-100 text-[#5c647a]"
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-52 bg-white border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-gray-300 block mb-3">
            {tab === "open" ? "gavel" : "history"}
          </span>
          <p className="font-semibold text-[#191c1e]">
            {tab === "open" ? "Aucune dispute en cours" : "Aucune dispute archivée"}
          </p>
          <p className="text-sm text-[#5c647a] mt-1">
            {tab === "open" ? "Toutes les annulations ont été traitées." : "Les décisions apparaîtront ici après chaque jugement."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((d) => {
            const isResolved = !!d.adminDecisionAt;
            const outcome = d.adminDecisionOutcome ? OUTCOME_LABELS[d.adminDecisionOutcome] : null;
            return (
              <button
                key={d.id}
                onClick={() => { setSelected(d); setNote(""); }}
                className={`text-left bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${selected?.id === d.id ? "border-[#006e2f] shadow-md" : "border-gray-100"}`}
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.cancelledBy === "mentor" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {d.cancelledBy === "mentor" ? "Annul. mentor" : "Annul. apprenant"}
                  </span>
                  {isResolved && outcome ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${outcome.color}`}>
                      <span className="material-symbols-outlined text-[12px]">{outcome.icon}</span>
                      {outcome.label}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600">ESCROW DISPUTED</span>
                  )}
                </div>
                <p className="text-sm font-bold text-[#191c1e]">{d.student.name ?? d.student.email}</p>
                <p className="text-[11px] text-[#5c647a]">vs {d.mentor.user.name ?? d.mentor.user.email}</p>
                <p className="text-sm font-extrabold text-[#006e2f] mt-3 tabular-nums">{formatFCFA(d.paidAmount)} FCFA</p>
                <p className="text-[11px] text-[#5c647a] mt-0.5">Session : {formatDate(d.scheduledAt)}</p>
                {isResolved ? (
                  <p className="text-[11px] text-[#5c647a] mt-0.5">
                    Décidé il y a {d.adminDecisionAt ? Math.floor((Date.now() - new Date(d.adminDecisionAt).getTime()) / 3600000) : "?"}h
                  </p>
                ) : (
                  <p className="text-[11px] text-[#5c647a] mt-0.5">
                    Demandé il y a {d.cancelRequestedAt ? Math.floor((Date.now() - new Date(d.cancelRequestedAt).getTime()) / 3600000) : "?"}h
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Detail / Decision panel */}
      {selected && (
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#191c1e]">
                {selected.adminDecisionAt ? "Détail de la décision" : "Détail de la dispute"}
              </h2>
              <p className="text-sm text-[#5c647a]">
                {selected.adminDecisionAt
                  ? `Jugée le ${formatDate(selected.adminDecisionAt)}`
                  : `Décision à rendre — ${formatFCFA(selected.paidAmount)} FCFA en escrow`}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-sm text-[#5c647a] hover:text-[#191c1e]">
              Fermer
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Apprenant</p>
              <p className="text-sm font-bold text-[#191c1e]">{selected.student.name ?? "—"}</p>
              <p className="text-xs text-[#5c647a]">{selected.student.email}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Mentor</p>
              <p className="text-sm font-bold text-[#191c1e]">{selected.mentor.user.name ?? "—"}</p>
              <p className="text-xs text-[#5c647a]">{selected.mentor.user.email}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">
              Motif d&apos;annulation ({selected.cancelledBy === "mentor" ? "du mentor" : "de l'apprenant"})
            </p>
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-sm text-[#191c1e] whitespace-pre-wrap">
              {selected.cancellationReason ?? "Aucun motif fourni"}
            </div>
          </div>

          {selected.studentGoals && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Objectifs initiaux de l&apos;apprenant</p>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-[#5c647a] whitespace-pre-wrap">
                {selected.studentGoals}
              </div>
            </div>
          )}

          {selected.adminDecisionAt ? (
            // ── DECIDED : read-only summary ──
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Décision admin</p>
                {selected.adminDecisionOutcome && OUTCOME_LABELS[selected.adminDecisionOutcome] && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${OUTCOME_LABELS[selected.adminDecisionOutcome].color}`}>
                    <span className="material-symbols-outlined text-[16px]">{OUTCOME_LABELS[selected.adminDecisionOutcome].icon}</span>
                    <span className="text-xs font-bold">{OUTCOME_LABELS[selected.adminDecisionOutcome].label}</span>
                  </div>
                )}
              </div>
              {selected.adminDecisionNote && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Note admin (publique)</p>
                  <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 text-sm text-[#191c1e] whitespace-pre-wrap">
                    {selected.adminDecisionNote}
                  </div>
                </div>
              )}
              {selected.adminResolver && (
                <p className="text-[11px] text-[#5c647a]">
                  Décidé par <span className="font-semibold">{selected.adminResolver.name ?? selected.adminResolver.email}</span>
                </p>
              )}
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-[#5c647a]">
                <p><span className="font-semibold text-[#191c1e]">Statut final :</span> {selected.status}</p>
                <p><span className="font-semibold text-[#191c1e]">Escrow :</span> {selected.escrowStatus}</p>
                <p><span className="font-semibold text-[#191c1e]">Montant :</span> {formatFCFA(selected.paidAmount)} FCFA</p>
              </div>
            </div>
          ) : (
            // ── OPEN : decision panel ──
            <>
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase text-[#5c647a] mb-2 block">Note admin (visible des deux parties)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Explication de votre décision…"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => handleDecide("refund_student")}
                  disabled={decideMutation.isPending}
                  className="flex flex-col items-center gap-1 p-4 rounded-xl border border-gray-200 hover:border-[#006e2f]/40 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[24px] text-[#006e2f]">undo</span>
                  <span className="text-sm font-bold text-[#191c1e]">Rembourser l&apos;apprenant</span>
                  <span className="text-[11px] text-[#5c647a] tabular-nums">{formatFCFA(selected.paidAmount)} FCFA remboursés</span>
                </button>
                <button
                  onClick={() => handleDecide("split_50_50")}
                  disabled={decideMutation.isPending}
                  className="flex flex-col items-center gap-1 p-4 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[24px] text-amber-500">balance</span>
                  <span className="text-sm font-bold text-[#191c1e]">Partage 50/50</span>
                  <span className="text-[11px] text-[#5c647a] tabular-nums">{formatFCFA(selected.paidAmount / 2)} FCFA chacun</span>
                </button>
                <button
                  onClick={() => handleDecide("release_to_mentor")}
                  disabled={decideMutation.isPending}
                  className="flex flex-col items-center gap-1 p-4 rounded-xl border border-gray-200 hover:border-[#006e2f]/40 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[24px] text-[#006e2f]">payments</span>
                  <span className="text-sm font-bold text-[#191c1e]">Libérer au mentor</span>
                  <span className="text-[11px] text-[#5c647a] tabular-nums">{formatFCFA(selected.paidAmount * 0.95)} FCFA net</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
