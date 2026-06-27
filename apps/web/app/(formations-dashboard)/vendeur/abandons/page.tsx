"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MessageCircle,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Wallet,
  Sparkles,
  TrendingUp,
  Percent,
} from "lucide-react";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StKpiCompact,
  StTabs,
  ST,
} from "@/components/stitch";

type Attempt = {
  id: string;
  status: "STARTED" | "ABANDONED" | "FAILED" | "COMPLETED" | "RECOVERED";
  visitorEmail: string | null;
  visitorName: string | null;
  visitorPhone: string | null;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  failureReason: string | null;
  failureCode: string | null;
  providerRef: string | null;
  reminder1SentAt: string | null;
  reminder2SentAt: string | null;
  vendorContactedAt: string | null;
  recoveredAt: string | null;
  createdAt: string;
  formation: { id: string; title: string; slug: string; price: number } | null;
  product: { id: string; title: string; slug: string; price: number } | null;
};

type StatusFilter = "unresolved" | "failed" | "abandoned" | "recovered" | "all";

const fmtFCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

function statusBadgeProps(s: Attempt["status"]): { label: string; tone: "blue" | "amber" | "rose" | "green" } {
  const map: Record<Attempt["status"], { label: string; tone: "blue" | "amber" | "rose" | "green" }> = {
    STARTED: { label: "Démarré", tone: "blue" },
    ABANDONED: { label: "Abandonné", tone: "amber" },
    FAILED: { label: "Échoué", tone: "rose" },
    COMPLETED: { label: "Payé", tone: "green" },
    RECOVERED: { label: "Récupéré", tone: "green" },
  };
  return map[s];
}

function waLink(phone: string, message: string): string {
  const clean = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export default function AbandonsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<Record<string, { count: number; amount: number }>>({});
  const [status, setStatus] = useState<StatusFilter>("unresolved");
  const [loading, setLoading] = useState(true);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ id: string; ok: boolean; message: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/formations/vendeur/checkout-attempts?status=${status}`);
      const json = await res.json();
      setAttempts(json.data ?? []);
      setStats(json.stats ?? {});
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  async function markContacted(id: string) {
    await fetch("/api/formations/vendeur/checkout-attempts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "mark_contacted" }),
    });
    load();
  }

  async function sendRecoveryEmail(id: string) {
    if (sendingEmailId) return;
    setSendingEmailId(id);
    setSendResult(null);
    try {
      const res = await fetch(`/api/formations/vendeur/checkout-attempts/${id}/send-email`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setSendResult({ id, ok: false, message: json.error || "Échec d'envoi" });
      } else {
        setSendResult({ id, ok: true, message: `Email envoyé à ${json.sentTo}` });
        load();
      }
    } catch {
      setSendResult({ id, ok: false, message: "Erreur réseau" });
    } finally {
      setSendingEmailId(null);
      setTimeout(() => setSendResult(null), 4000);
    }
  }

  const totalLost = (stats.FAILED?.amount ?? 0) + (stats.ABANDONED?.amount ?? 0);
  const totalRecovered = stats.RECOVERED?.amount ?? 0;
  const totalCompleted = stats.COMPLETED?.amount ?? 0;
  // Taux de conversion = tentatives abouties (payées + récupérées) sur l'ensemble
  // des tentatives résolues (payées + récupérées + échouées + abandonnées).
  const convSuccess = (stats.COMPLETED?.count ?? 0) + (stats.RECOVERED?.count ?? 0);
  const convDenom = convSuccess + (stats.FAILED?.count ?? 0) + (stats.ABANDONED?.count ?? 0);
  const conversionRate = convDenom ? Math.round((convSuccess / convDenom) * 100) : 0;

  const filters: Array<{ id: StatusFilter; label: string }> = [
    { id: "unresolved", label: "À relancer" },
    { id: "failed", label: "Échecs" },
    { id: "abandoned", label: "Abandons" },
    { id: "recovered", label: "Récupérés" },
    { id: "all", label: "Tout" },
  ];

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Abandons et paiements échoués"
          subtitle="Relancez les visiteurs qui ont tenté d'acheter sans finaliser"
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <StKpiCompact
            label={`Potentiel perdu · ${(stats.FAILED?.count ?? 0) + (stats.ABANDONED?.count ?? 0)} tentatives`}
            value={fmtFCFA(totalLost)}
            icon={Wallet}
            tone="rose"
          />
          <StKpiCompact
            label={`Récupéré · ${stats.RECOVERED?.count ?? 0} récup.`}
            value={fmtFCFA(totalRecovered)}
            icon={Sparkles}
            tone="green"
          />
          <StKpiCompact
            label={`Paiements réussis · ${stats.COMPLETED?.count ?? 0} cmd.`}
            value={fmtFCFA(totalCompleted)}
            icon={TrendingUp}
            tone="blue"
          />
          <StKpiCompact
            label="Taux conversion"
            value={`${conversionRate}%`}
            icon={Percent}
            tone="amber"
          />
        </div>

        {/* Filters */}
        <div className="mb-4">
          <StTabs
            tabs={filters.map((f) => ({ key: f.id, label: f.label }))}
            active={status}
            onChange={(key) => setStatus(key as StatusFilter)}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-[18px] animate-pulse" style={{ background: "#f3f6f4" }} />)}
          </div>
        ) : attempts.length === 0 ? (
          <StCard className="text-center py-12">
            <ShoppingCart size={44} style={{ color: "#d6e0da" }} className="mx-auto" />
            <h3 className="text-[15px] font-extrabold mt-3" style={{ color: ST.text }}>Aucun abandon dans cette catégorie</h3>
            <p className="text-[12.5px] font-semibold mt-1.5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Les abandons apparaissent ici quand un visiteur clique sur « Payer » sans finaliser (timeout 1h). Les paiements échoués s&apos;affichent immédiatement dans « Échecs ».
            </p>
            <div className="mt-4 flex justify-center">
              <StButton onClick={() => load()}>Actualiser</StButton>
            </div>
          </StCard>
        ) : (
          <div className="space-y-3">
            {attempts.map((a) => {
              const item = a.formation || a.product;
              const itemTitle = item?.title ?? "Produit supprimé";
              const itemType = a.formation ? "formation" : a.product ? "produit" : "inconnu";
              const visitorIdentity = a.visitorName || a.visitorEmail || "Visiteur anonyme";
              const st = statusBadgeProps(a.status);
              const alreadyContacted = !!a.vendorContactedAt;
              const waMessage = `Bonjour ${a.visitorName || ""}, vous avez tenté d'acheter "${itemTitle}" sur notre boutique. Je suis là si vous avez besoin d'aide pour finaliser votre achat.`;

              return (
                <StCard key={a.id}>
                  <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <StChip tone={st.tone}>{st.label}</StChip>
                        {alreadyContacted && (
                          <StChip tone="neutral" icon={Check}>Contacté</StChip>
                        )}
                        {a.reminder1SentAt && <StChip tone="blue">Rappel 1 envoyé</StChip>}
                        {a.reminder2SentAt && <StChip tone="blue">Rappel 2 envoyé</StChip>}
                        <span className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>{timeAgo(a.createdAt)}</span>
                      </div>
                      <p className="text-[15px] font-extrabold" style={{ color: ST.text }}>{visitorIdentity}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                        {a.visitorEmail && (
                          <span className="inline-flex items-center gap-1"><Mail size={14} />{a.visitorEmail}</span>
                        )}
                        {a.visitorPhone && (
                          <span className="inline-flex items-center gap-1"><Phone size={14} />{a.visitorPhone}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[18px] font-extrabold tabular-nums" style={{ color: ST.text }}>{fmtFCFA(a.amount)}</p>
                      <p className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>{a.paymentMethod ?? "Moyen inconnu"}</p>
                    </div>
                  </div>

                  <div className="rounded-[12px] p-3 mb-3 text-[12px]" style={{ background: "#f6f9f7" }}>
                    <p style={{ color: ST.textSecondary }}>
                      <span className="font-extrabold" style={{ color: ST.text }}>{itemType === "formation" ? "Formation" : "Produit"} :</span> {itemTitle}
                    </p>
                    {a.failureReason && (
                      <p className="mt-1" style={{ color: ST.roseText }}>
                        <span className="font-extrabold">Raison de l&apos;échec :</span> {a.failureReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {a.visitorEmail && (
                      <StButton
                        size="sm"
                        onClick={() => sendRecoveryEmail(a.id)}
                        disabled={sendingEmailId === a.id}
                        icon={sendingEmailId === a.id ? Loader2 : Mail}
                      >
                        {sendingEmailId === a.id ? "Envoi…" : "Envoyer un email"}
                      </StButton>
                    )}
                    {sendResult?.id === a.id && (
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: sendResult.ok ? ST.green : ST.roseText }}>
                        {sendResult.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {sendResult.message}
                      </span>
                    )}
                    {a.visitorPhone && (
                      <a
                        href={waLink(a.visitorPhone, waMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markContacted(a.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-white text-[12px] font-extrabold"
                        style={{ background: ST.green }}
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </a>
                    )}
                    {!alreadyContacted && (a.visitorEmail || a.visitorPhone) && (
                      <StButton
                        variant="secondary"
                        size="sm"
                        onClick={() => markContacted(a.id)}
                        icon={Check}
                      >
                        Marquer contacté
                      </StButton>
                    )}
                  </div>
                </StCard>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
