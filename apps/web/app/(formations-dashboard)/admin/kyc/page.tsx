"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
import {
  ShieldCheck,
  Clock,
  History,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  X,
  Inbox,
} from "lucide-react";

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
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    kyc: number;
    role: string;
    formationsRole: string | null;
  };
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
  return new Date(s).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminKycPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [selected, setSelected] = useState<KycItem | null>(null);
  const [refuseReason, setRefuseReason] = useState("");

  const { data, isLoading } = useQuery<{
    data: KycItem[];
    counts?: { pending: number; history: number };
  }>({
    queryKey: ["admin-kyc", tab],
    queryFn: () =>
      fetch(`/api/formations/admin/kyc?scope=${tab}`).then((r) => r.json()),
    staleTime: 30_000,
  });

  const counts = data?.counts ?? { pending: 0, history: 0 };

  const decideMutation = useMutation({
    mutationFn: async (args: {
      id: string;
      action: "approve" | "refuse";
      refuseReason?: string;
    }) => {
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
    onError: (e) =>
      useToastStore
        .getState()
        .addToast("error", e instanceof Error ? e.message : "Erreur"),
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
      useToastStore
        .getState()
        .addToast("error", "Motif de refus obligatoire (10 car. min)");
      return;
    }
    const ok = await confirmAction({
      title: "Refuser cette demande KYC ?",
      message: `Motif : ${refuseReason.trim()}\n\nL'utilisateur pourra soumettre une nouvelle demande.`,
      confirmVariant: "danger",
      confirmLabel: "Refuser",
    });
    if (!ok) return;
    decideMutation.mutate({
      id: selected.id,
      action: "refuse",
      refuseReason: refuseReason.trim(),
    });
  }

  const items = data?.data ?? [];

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto space-y-8">
        <KazaHero
          badge="Admin"
          badgeColor="orange"
          icon={ShieldCheck}
          title="Vérification KYC"
          subtitle={`${counts.pending} demandes en attente · ${counts.history} dans l'historique. Les retraits sont bloqués sans KYC validé.`}
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KazaKpiCard
            label="En attente"
            value={counts.pending}
            icon={Clock}
            iconColor="orange"
          />
          <KazaKpiCard
            label="Historique"
            value={counts.history}
            icon={History}
            iconColor="navy"
          />
        </div>

        {/* Tabs */}
        <KazaCard>
          <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl w-fit">
            {[
              {
                id: "pending" as const,
                label: "En attente",
                count: counts.pending,
                icon: Clock,
              },
              {
                id: "history" as const,
                label: "Historique",
                count: counts.history,
                icon: History,
              },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    setSelected(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    tab === t.id
                      ? "bg-[#0b2540] text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                  <span
                    className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${
                      tab === t.id
                        ? "bg-white/15 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </KazaCard>

        {/* List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-40 bg-white border border-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <KazaEmpty
            icon={Inbox}
            title={
              tab === "pending"
                ? "Aucune demande en attente"
                : "Aucune demande archivée"
            }
            description={
              tab === "pending"
                ? "Toutes les demandes ont été traitées."
                : "L'historique des décisions KYC apparaîtra ici."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((k) => (
              <button
                key={k.id}
                onClick={() => {
                  setSelected(k);
                  setRefuseReason("");
                }}
                className={`text-left bg-white border-2 rounded-2xl p-5 transition-all hover:shadow-md ${
                  selected?.id === k.id
                    ? "border-emerald-500 shadow-md ring-4 ring-emerald-100"
                    : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {k.user.name ?? k.user.email}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {k.user.email}
                    </p>
                  </div>
                  {k.status === "EN_ATTENTE" ? (
                    <KazaBadge variant="orange" icon={Clock}>
                      En attente
                    </KazaBadge>
                  ) : k.status === "APPROUVE" ? (
                    <KazaBadge variant="green" icon={CheckCircle}>
                      Validée
                    </KazaBadge>
                  ) : (
                    <KazaBadge variant="rose" icon={XCircle}>
                      Refusée
                    </KazaBadge>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {DOC_LABELS[k.documentType]} ·{" "}
                  {k.user.formationsRole ?? k.user.role}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Soumis le {formatDate(k.createdAt)}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <KazaCard
            title="Détail de la demande KYC"
            subtitle={`${selected.user.name ?? selected.user.email} · ${DOC_LABELS[selected.documentType]}`}
            action={
              <KazaButton
                variant="ghost"
                size="sm"
                icon={X}
                onClick={() => setSelected(null)}
              >
                Fermer
              </KazaButton>
            }
          >
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Utilisateur
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {selected.user.name ?? "—"}
                </p>
                <p className="text-xs text-slate-500">{selected.user.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Rôle : {selected.user.formationsRole ?? selected.user.role}
                </p>
                <p className="text-xs text-slate-500">
                  Demande :{" "}
                  {selected.requestedLevel === 4
                    ? "Certification pro"
                    : "Vérification d'identité"}
                  {(selected.user.kyc ?? 0) > 0 &&
                    selected.requestedLevel === 4 &&
                    " (identité déjà vérifiée)"}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Document
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {DOC_LABELS[selected.documentType]}
                </p>
                {selected.documentUrl && (
                  <a
                    href={selected.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <ExternalLink size={14} />
                    Voir le document
                  </a>
                )}
              </div>
            </div>

            {selected.documentUrl && (
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Aperçu document
                </p>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 max-h-[500px] overflow-y-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.documentUrl}
                    alt="Document KYC"
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent)
                        parent.innerHTML =
                          '<p class="p-6 text-center text-sm text-slate-500">L\'aperçu n\'a pas pu être chargé. Ouvrez le lien pour voir le document.</p>';
                    }}
                  />
                </div>
              </div>
            )}

            {selected.status === "EN_ATTENTE" ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Motif de refus{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (obligatoire si refus, min 10 car.)
                    </span>
                  </label>
                  <textarea
                    value={refuseReason}
                    onChange={(e) => setRefuseReason(e.target.value)}
                    rows={2}
                    placeholder="Document illisible, photo de mauvaise qualité, etc."
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm focus:outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 flex-wrap">
                  <KazaButton
                    variant="primary"
                    icon={CheckCircle}
                    onClick={handleApprove}
                    disabled={decideMutation.isPending}
                  >
                    Valider le KYC
                  </KazaButton>
                  <KazaButton
                    variant="danger"
                    icon={XCircle}
                    onClick={handleRefuse}
                    disabled={
                      decideMutation.isPending ||
                      refuseReason.trim().length < 10
                    }
                  >
                    Refuser
                  </KazaButton>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Décision
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {selected.status === "APPROUVE" ? (
                    <KazaBadge variant="green" icon={CheckCircle}>
                      Validée
                    </KazaBadge>
                  ) : (
                    <KazaBadge variant="rose" icon={XCircle}>
                      Refusée
                    </KazaBadge>
                  )}
                  {selected.reviewedAt && (
                    <span className="text-xs text-slate-500">
                      Le {formatDate(selected.reviewedAt)}
                    </span>
                  )}
                </div>
                {selected.refuseReason && (
                  <p className="text-sm text-rose-600 mt-2 flex items-start gap-1">
                    <FileText
                      size={14}
                      className="mt-0.5 flex-shrink-0"
                    />
                    Motif : {selected.refuseReason}
                  </p>
                )}
              </div>
            )}
          </KazaCard>
        )}
      </main>
    </div>
  );
}
