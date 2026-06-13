"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StButton,
  StChip,
  ST,
} from "@/components/stitch";
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
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-5">
        <StPageHeader
          title="Vérification KYC"
          subtitle={`${counts.pending} demandes en attente · ${counts.history} dans l'historique. Les retraits sont bloqués sans KYC validé.`}
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <StKpiCompact
            label="En attente"
            value={counts.pending}
            icon={Clock}
            tone="amber"
          />
          <StKpiCompact
            label="Historique"
            value={counts.history}
            icon={History}
            tone="green"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-[13px] w-fit" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
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
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSelected(null);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors whitespace-nowrap"
                style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
              >
                <Icon size={14} />
                {t.label}
                <span className="text-[10px] tabular-nums">· {t.count}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-40 rounded-[18px] animate-pulse"
                style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <StCard className="flex flex-col items-center text-center py-12">
            <Inbox size={40} style={{ color: "#d6e0da" }} />
            <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>
              {tab === "pending" ? "Aucune demande en attente" : "Aucune demande archivée"}
            </p>
            <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
              {tab === "pending"
                ? "Toutes les demandes ont été traitées."
                : "L'historique des décisions KYC apparaîtra ici."}
            </p>
          </StCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {items.map((k) => {
              const on = selected?.id === k.id;
              return (
                <button
                  key={k.id}
                  onClick={() => {
                    setSelected(k);
                    setRefuseReason("");
                  }}
                  className="text-left bg-white rounded-[18px] p-5 transition-all hover:shadow-md"
                  style={{
                    border: on ? `2px solid ${ST.greenBright}` : `1px solid ${ST.cardBorder}`,
                    boxShadow: on ? `0 0 0 4px ${ST.greenSoft}` : "0 1px 3px rgba(16,52,32,.05)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold truncate" style={{ color: ST.text }}>
                        {k.user.name ?? k.user.email}
                      </p>
                      <p className="text-[11.5px] truncate" style={{ color: ST.textSecondary }}>
                        {k.user.email}
                      </p>
                    </div>
                    {k.status === "EN_ATTENTE" ? (
                      <StChip tone="amber" icon={Clock}>En attente</StChip>
                    ) : k.status === "APPROUVE" ? (
                      <StChip tone="green" icon={CheckCircle}>Validée</StChip>
                    ) : (
                      <StChip tone="rose" icon={XCircle}>Refusée</StChip>
                    )}
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>
                    {DOC_LABELS[k.documentType]} ·{" "}
                    {k.user.formationsRole ?? k.user.role}
                  </p>
                  <p className="text-[11px] mt-2" style={{ color: ST.textFaint }}>
                    Soumis le {formatDate(k.createdAt)}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <StCard className="!p-[18px_20px]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h3 className="text-[15px] font-extrabold" style={{ color: ST.text }}>Détail de la demande KYC</h3>
                <p className="text-[12px] font-semibold mt-0.5 truncate" style={{ color: ST.textSecondary }}>
                  {selected.user.name ?? selected.user.email} · {DOC_LABELS[selected.documentType]}
                </p>
              </div>
              <StButton variant="secondary" size="sm" icon={X} onClick={() => setSelected(null)}>
                Fermer
              </StButton>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl p-4" style={{ background: ST.bg }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ST.textMuted }}>
                  Utilisateur
                </p>
                <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                  {selected.user.name ?? "—"}
                </p>
                <p className="text-[12px]" style={{ color: ST.textSecondary }}>{selected.user.email}</p>
                <p className="text-[12px] mt-1" style={{ color: ST.textSecondary }}>
                  Rôle : {selected.user.formationsRole ?? selected.user.role}
                </p>
                <p className="text-[12px]" style={{ color: ST.textSecondary }}>
                  Demande :{" "}
                  {selected.requestedLevel === 4
                    ? "Certification pro"
                    : "Vérification d'identité"}
                  {(selected.user.kyc ?? 0) > 0 &&
                    selected.requestedLevel === 4 &&
                    " (identité déjà vérifiée)"}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ background: ST.bg }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ST.textMuted }}>
                  Document
                </p>
                <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                  {DOC_LABELS[selected.documentType]}
                </p>
                {selected.documentUrl && (
                  <a
                    href={selected.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[12px] font-extrabold hover:underline"
                    style={{ color: ST.green }}
                  >
                    <ExternalLink size={14} />
                    Voir le document
                  </a>
                )}
              </div>
            </div>

            {selected.documentUrl && (
              <div className="mb-6">
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ST.textMuted }}>
                  Aperçu document
                </p>
                <div
                  className="rounded-xl overflow-hidden max-h-[500px] overflow-y-auto"
                  style={{ border: `1px solid ${ST.cardBorder}`, background: ST.bg }}
                >
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
                  <label className="block text-[12px] font-extrabold mb-2" style={{ color: ST.textLabel }}>
                    Motif de refus{" "}
                    <span className="text-[11px] font-semibold" style={{ color: ST.textMuted }}>
                      (obligatoire si refus, min 10 car.)
                    </span>
                  </label>
                  <textarea
                    value={refuseReason}
                    onChange={(e) => setRefuseReason(e.target.value)}
                    rows={2}
                    placeholder="Document illisible, photo de mauvaise qualité, etc."
                    className="w-full px-4 py-3 rounded-xl text-[13.5px] font-medium focus:outline-none transition-all resize-none"
                    style={{ color: "#33453b", border: "1px solid #dde6e0", background: "#fff" }}
                  />
                </div>

                <div className="flex gap-3 flex-wrap">
                  <StButton
                    variant="primary"
                    icon={CheckCircle}
                    onClick={handleApprove}
                    disabled={decideMutation.isPending}
                  >
                    Valider le KYC
                  </StButton>
                  <StButton
                    variant="secondary"
                    icon={XCircle}
                    className="!text-[#993556]"
                    onClick={handleRefuse}
                    disabled={
                      decideMutation.isPending ||
                      refuseReason.trim().length < 10
                    }
                  >
                    Refuser
                  </StButton>
                </div>
              </>
            ) : (
              <div className="rounded-xl p-4" style={{ background: ST.bg }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ST.textMuted }}>
                  Décision
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {selected.status === "APPROUVE" ? (
                    <StChip tone="green" icon={CheckCircle}>Validée</StChip>
                  ) : (
                    <StChip tone="rose" icon={XCircle}>Refusée</StChip>
                  )}
                  {selected.reviewedAt && (
                    <span className="text-[12px]" style={{ color: ST.textSecondary }}>
                      Le {formatDate(selected.reviewedAt)}
                    </span>
                  )}
                </div>
                {selected.refuseReason && (
                  <p className="text-[13px] mt-2 flex items-start gap-1" style={{ color: ST.roseText }}>
                    <FileText size={14} className="mt-0.5 flex-shrink-0" />
                    Motif : {selected.refuseReason}
                  </p>
                )}
              </div>
            )}
          </StCard>
        )}
      </main>
    </div>
  );
}
