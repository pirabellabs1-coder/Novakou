"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";

type KycItem = {
  id: string;
  requestedLevel: number;
  currentLevel: number;
  documentType: string;
  documentUrl: string | null;
  status: "EN_ATTENTE" | "APPROUVE" | "REFUSE";
  refuseReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; name: string | null; email: string; image: string | null; kyc: number; role: string; formationsRole: string | null };
};

const DOC_LABELS: Record<string, string> = {
  CNI: "Carte Nationale d'Identité",
  CIP: "CIP (Bénin)",
  PASSEPORT: "Passeport",
  PERMIS_CONDUIRE: "Permis de conduire",
  CARTE_CONSULAIRE: "Carte consulaire",
  RECEPISSE: "Récépissé d'identité",
  CARTE_ELECTEUR: "Carte d'électeur",
  CARTE_RESIDENT: "Carte de résident",
  DIPLOME: "Diplôme",
  CERTIFICAT_PRO: "Certificat professionnel",
  ATTESTATION_EMPLOYEUR: "Attestation employeur",
  PORTFOLIO_PRO: "Portfolio professionnel",
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminKycPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [selected, setSelected] = useState<KycItem | null>(null);
  const [refuseReason, setRefuseReason] = useState("");

  const { data, isLoading } = useQuery<{ data: KycItem[]; counts?: { pending: number; history: number } }>({
    queryKey: ["admin-kyc", tab],
    queryFn: () => fetch(`/api/formations/admin/kyc?scope=${tab}`).then((r) => r.json()),
    staleTime: 30_000,
  });

  const counts = data?.counts ?? { pending: 0, history: 0 };

  const decideMutation = useMutation({
    mutationFn: async (args: { id: string; action: "approve" | "refuse"; refuseReason?: string }) => {
      const res = await fetch(`/api/formations/admin/kyc/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      return res.json();
    },
    onSuccess: () => {
      useToastStore.getState().addToast("success", "Décision KYC enregistrée");
      qc.invalidateQueries({ queryKey: ["admin-kyc"] });
      setSelected(null);
      setRefuseReason("");
    },
    onError: (e) => useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur"),
  });

  async function handleApprove() {
    if (!selected) return;
    const ok = await confirmAction({
      title: "Valider cette demande KYC ?",
      message: `L'utilisateur ${selected.user.name ?? selected.user.email} passera au niveau ${selected.requestedLevel} et pourra demander des retraits.`,
      confirmVariant: "default",
      confirmLabel: "Valider",
    });
    if (!ok) return;
    decideMutation.mutate({ id: selected.id, action: "approve" });
  }

  async function handleRefuse() {
    if (!selected) return;
    if (refuseReason.trim().length < 10) {
      useToastStore.getState().addToast("error", "Motif de refus obligatoire (10 car. min)");
      return;
    }
    const ok = await confirmAction({
      title: "Refuser cette demande KYC ?",
      message: `Motif : ${refuseReason.trim()}\n\nL'utilisateur pourra soumettre une nouvelle demande.`,
      confirmVariant: "danger",
      confirmLabel: "Refuser",
    });
    if (!ok) return;
    decideMutation.mutate({ id: selected.id, action: "refuse", refuseReason: refuseReason.trim() });
  }

  const items = data?.data ?? [];

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Vérification KYC</h1>
        <p className="text-sm text-[#5c647a] mt-1">
          Validez ou refusez les demandes de vérification d&apos;identité. Les retraits sont bloqués sans KYC validé.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100">
        {[
          { id: "pending" as const, label: "En attente", count: counts.pending, icon: "hourglass_top" },
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => <div key={i} className="h-40 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-gray-300 block mb-3">
            {tab === "pending" ? "hourglass_empty" : "history"}
          </span>
          <p className="font-semibold text-[#191c1e]">
            {tab === "pending" ? "Aucune demande en attente" : "Aucune demande archivée"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((k) => (
            <button
              key={k.id}
              onClick={() => { setSelected(k); setRefuseReason(""); }}
              className={`text-left bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${selected?.id === k.id ? "border-[#006e2f] shadow-md" : "border-gray-100"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-[#191c1e]">{k.user.name ?? k.user.email}</p>
                  <p className="text-[11px] text-[#5c647a]">{k.user.email}</p>
                </div>
                {k.status === "EN_ATTENTE" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">En attente</span>
                ) : k.status === "APPROUVE" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">Validée</span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Refusée</span>
                )}
              </div>
              <p className="text-[12px] text-[#5c647a]">
                {DOC_LABELS[k.documentType]} · {k.user.formationsRole ?? k.user.role}
              </p>
              <p className="text-[11px] text-[#5c647a] mt-2">
                Soumis le {formatDate(k.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#191c1e]">Détail de la demande KYC</h2>
              <p className="text-sm text-[#5c647a]">
                {selected.user.name ?? selected.user.email} · {DOC_LABELS[selected.documentType]}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-sm text-[#5c647a] hover:text-[#191c1e]">Fermer</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Utilisateur</p>
              <p className="text-sm font-bold text-[#191c1e]">{selected.user.name ?? "—"}</p>
              <p className="text-xs text-[#5c647a]">{selected.user.email}</p>
              <p className="text-[11px] text-[#5c647a] mt-1">Rôle : {selected.user.formationsRole ?? selected.user.role}</p>
              <p className="text-[11px] text-[#5c647a]">
                Demande : {selected.requestedLevel === 4 ? "Certification pro" : "Vérification d'identité"}
                {(selected.user.kyc ?? 0) > 0 && selected.requestedLevel === 4 && " (identité déjà vérifiée)"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Document</p>
              <p className="text-sm font-bold text-[#191c1e]">{DOC_LABELS[selected.documentType]}</p>
              {selected.documentUrl && (
                <a
                  href={selected.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#006e2f] hover:underline"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  Voir le document
                </a>
              )}
            </div>
          </div>

          {selected.documentUrl && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Aperçu document</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 max-h-[500px] overflow-y-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.documentUrl}
                  alt="Document KYC"
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.style.display = "none";
                    const parent = img.parentElement;
                    if (parent) parent.innerHTML = '<p class="p-6 text-center text-sm text-[#5c647a]">L\'aperçu n\'a pas pu être chargé. Ouvrez le lien pour voir le document.</p>';
                  }}
                />
              </div>
            </div>
          )}

          {selected.status === "EN_ATTENTE" ? (
            <>
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase text-[#5c647a] block mb-2">
                  Motif de refus (obligatoire si refus, min 10 car.)
                </label>
                <textarea
                  value={refuseReason}
                  onChange={(e) => setRefuseReason(e.target.value)}
                  rows={2}
                  placeholder="Document illisible, photo de mauvaise qualité, etc."
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleApprove}
                  disabled={decideMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Valider le KYC
                </button>
                <button
                  onClick={handleRefuse}
                  disabled={decideMutation.isPending || refuseReason.trim().length < 10}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  Refuser
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Décision</p>
              <p className="text-sm font-bold text-[#191c1e]">
                {selected.status === "APPROUVE" ? "✓ Validée" : "✗ Refusée"}
                {selected.reviewedAt && ` · ${formatDate(selected.reviewedAt)}`}
              </p>
              {selected.refuseReason && (
                <p className="text-sm text-red-600 mt-2">Motif : {selected.refuseReason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
