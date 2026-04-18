"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useToastStore } from "@/store/toast";

type Status = "PENDING_COOLDOWN" | "AWAITING_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";

interface DeletionRequest {
  id: string;
  reason: string;
  status: Status;
  requestedAt: string;
  cooldownUntil: string;
  reviewedAt: string | null;
  adminNote: string | null;
  completedAt: string | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeRemaining(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Cooldown terminé";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}j ${hours % 24}h restantes`;
  }
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  return `${minutes} minutes restantes`;
}

export default function AccountDeletionPanel() {
  const [state, setState] = useState<DeletionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToastStore.getState().addToast;

  async function load() {
    try {
      const r = await fetch("/api/auth/account/deletion-request");
      const j = await r.json();
      setState(j.data ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      toast("warning", "La raison doit comporter au moins 10 caractères.");
      return;
    }
    if (confirmText.trim().toUpperCase() !== "SUPPRIMER") {
      toast("warning", "Tapez exactement « SUPPRIMER » pour confirmer.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/account/deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast("error", j.error ?? "Erreur");
        return;
      }
      toast("success", "Demande enregistrée. Vous avez 72h pour annuler.");
      setShowForm(false);
      setReason("");
      setConfirmText("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelRequest() {
    if (!confirm("Annuler votre demande de suppression de compte ?")) return;
    try {
      const r = await fetch("/api/auth/account/deletion-request", { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) {
        toast("error", j.error ?? "Erreur");
        return;
      }
      toast("success", "Demande annulée. Votre compte reste actif.");
      await load();
    } catch {
      toast("error", "Erreur réseau");
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 animate-pulse">
        <div className="h-5 w-40 bg-zinc-200 rounded" />
      </div>
    );
  }

  // Active request states
  const isActive = state && (state.status === "PENDING_COOLDOWN" || state.status === "AWAITING_REVIEW");

  if (isActive) {
    const cooldownDone = new Date(state.cooldownUntil).getTime() <= Date.now();
    const isPending = state.status === "PENDING_COOLDOWN" && !cooldownDone;
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-600">hourglass_top</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-red-700">Suppression de compte en cours</h2>
            <p className="text-sm text-[#5c647a] mt-1">
              Demande déposée le <strong>{fmtDate(state.requestedAt)}</strong>.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Raison fournie</p>
          <p className="text-sm text-[#191c1e] leading-relaxed">{state.reason}</p>
        </div>

        {isPending ? (
          <>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px] flex-shrink-0">schedule</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-900">{timeRemaining(state.cooldownUntil)}</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Période de réflexion jusqu&apos;au {fmtDate(state.cooldownUntil)}. Vous pouvez encore annuler.
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={cancelRequest}
              className="w-full px-5 py-3 rounded-xl bg-[#006e2f] text-white text-sm font-bold hover:bg-[#005c27]"
            >
              Annuler ma demande de suppression
            </button>
          </>
        ) : (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[20px] flex-shrink-0">verified_user</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-blue-900">En attente de validation admin</p>
                <p className="text-xs text-blue-800 mt-0.5">
                  Le délai de 72h est terminé. Un administrateur Novakou va examiner votre demande sous peu.
                  Vous serez notifié par email du résultat.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Last request was cancelled / rejected (informational)
  const showHistory = state && (state.status === "CANCELLED" || state.status === "REJECTED");

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
      <h2 className="text-base font-bold text-red-600 mb-1">Zone dangereuse</h2>
      <p className="text-sm text-[#5c647a] mb-4">
        La suppression de votre compte est définitive et irréversible. Une période de réflexion de
        <strong> 72 heures</strong> s&apos;applique avant validation par un administrateur.
      </p>

      {showHistory && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-4">
          <p className="text-xs text-[#5c647a]">
            <strong>Demande précédente du {fmtDate(state!.requestedAt)} :</strong>{" "}
            {state!.status === "CANCELLED"
              ? "annulée par vous"
              : `refusée par l'administration${state!.adminNote ? ` — ${state!.adminNote}` : ""}`}
          </p>
        </div>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">delete_forever</span>
          Demander la suppression de mon compte
        </button>
      ) : (
        <form onSubmit={submitRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Raison de la suppression *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={2000}
              required
              placeholder="Expliquez pourquoi vous souhaitez supprimer votre compte (10 caractères minimum)…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
            />
            <p className="text-[11px] text-[#5c647a] mt-1">
              {reason.trim().length}/2000 caractères
            </p>
          </div>

          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-2">Conséquences</p>
            <ul className="text-sm text-red-900 space-y-1 list-disc pl-5">
              <li>Toutes vos boutiques seront supprimées</li>
              <li>Tous vos produits, formations, ventes et statistiques seront effacés</li>
              <li>Les retraits en attente seront annulés</li>
              <li>Cette action est <strong>irréversible</strong> après validation admin</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Pour confirmer, tapez « SUPPRIMER »
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              required
              placeholder="SUPPRIMER"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setReason("");
                setConfirmText("");
              }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#5c647a] hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 10 || confirmText.trim().toUpperCase() !== "SUPPRIMER"}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50 hover:bg-red-700"
            >
              {submitting ? "Envoi…" : "Confirmer la demande"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
