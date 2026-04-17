"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";
import { safeFetch } from "@/lib/safe-fetch";
import { SequenceAction } from "./types";

const BRAND = "#006e2f";

type ApiSequence = {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  isActive: boolean;
  _count?: { steps: number; enrollments: number };
};

const TRIGGERS = [
  { value: "MANUAL", label: "Manuel (déclenché par workflow)" },
  { value: "PURCHASE", label: "Après achat" },
  { value: "ENROLLMENT", label: "Inscription formation" },
  { value: "ABANDONED_CART", label: "Panier abandonné" },
  { value: "USER_INACTIVITY", label: "Inactivité" },
  { value: "SIGNUP", label: "Inscription liste" },
];

export default function ActionSequenceModal({
  action,
  onSave,
  onCancel,
}: {
  action: SequenceAction | null;
  onSave: (action: SequenceAction) => void;
  onCancel: () => void;
}) {
  const [sequences, setSequences] = useState<ApiSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(action?.config.sequenceId ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSeq, setNewSeq] = useState({ name: "", description: "", trigger: "MANUAL" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    safeFetch<{ data: { sequences?: ApiSequence[] } }>("/api/formations/vendeur/automatisations")
      .then(({ data }) => {
        setSequences(data?.data?.sequences ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function createSequence() {
    if (!newSeq.name.trim()) {
      useToastStore.getState().addToast("error", "Nom de la séquence requis");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await safeFetch<{ data: ApiSequence }>(
        "/api/formations/vendeur/marketing/sequences",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSeq),
        }
      );
      if (error || !data?.data) {
        useToastStore.getState().addToast("error", error ?? "Erreur création séquence");
        return;
      }
      const created: ApiSequence = data.data;
      setSequences((s) => [created, ...s]);
      setSelectedId(created.id);
      setShowCreate(false);
      useToastStore
        .getState()
        .addToast(
          "success",
          "Séquence créée. Ajoutez ses emails depuis l'onglet Marketing."
        );
    } catch (err) {
      useToastStore
        .getState()
        .addToast("error", err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  function handleSave() {
    if (!selectedId) {
      useToastStore.getState().addToast("error", "Sélectionnez une séquence");
      return;
    }
    const found = sequences.find((s) => s.id === selectedId);
    onSave({
      id: action?.id ?? `seq-${Date.now()}`,
      type: "ENROLL_SEQUENCE",
      config: { sequenceId: selectedId, sequenceName: found?.name },
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-100 text-pink-600">
              <span className="material-symbols-outlined text-[20px]">alt_route</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Démarrer une séquence</h2>
              <p className="text-xs text-gray-500">Inscrire le client à une séquence email</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!showCreate ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Séquences disponibles
                </label>
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-xs font-semibold text-[#006e2f] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Créer une séquence
                </button>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500 py-6 text-center">Chargement…</p>
              ) : sequences.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-500 mb-3">Aucune séquence pour l'instant</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                    style={{ background: `linear-gradient(to right, ${BRAND}, #22c55e)` }}
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Créer ma première séquence
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {sequences.map((seq) => {
                    const selected = selectedId === seq.id;
                    return (
                      <button
                        key={seq.id}
                        onClick={() => setSelectedId(seq.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? "border-[#006e2f] bg-[#006e2f]/5"
                            : "border-gray-200 bg-white hover:border-[#006e2f]/40"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            selected ? "bg-[#006e2f] text-white" : "bg-pink-50 text-pink-600"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {selected ? "check" : "mark_email_read"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{seq.name}</p>
                          <p className="text-[11px] text-gray-500">
                            {seq._count?.steps ?? 0} étapes · {seq.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <a
                href="/formations/vendeur/marketing/sequences"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#006e2f]"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                Gérer en détail les séquences (ajouter emails, conditions d'arrêt)
              </a>
            </>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowCreate(false)}
                className="text-xs font-semibold text-gray-600 hover:text-[#006e2f] flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Retour aux séquences existantes
              </button>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Nom de la séquence
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newSeq.name}
                  onChange={(e) => setNewSeq((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Ex: Onboarding après achat"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Déclencheur
                </label>
                <select
                  value={newSeq.trigger}
                  onChange={(e) => setNewSeq((s) => ({ ...s, trigger: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f] bg-white"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Description (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={newSeq.description}
                  onChange={(e) => setNewSeq((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Décrivez le but de cette séquence"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f] resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-0.5">À savoir</p>
                <p className="text-[11px] text-amber-700">
                  La séquence est créée vide. Ajoutez ses emails, délais et conditions d'arrêt depuis{" "}
                  <span className="font-semibold">Marketing → Séquences</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
          >
            Annuler
          </button>
          {showCreate ? (
            <button
              onClick={createSequence}
              disabled={creating}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(to right, ${BRAND}, #22c55e)` }}
            >
              {creating ? "Création…" : "Créer la séquence"}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!selectedId}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(to right, ${BRAND}, #22c55e)` }}
            >
              Enregistrer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
