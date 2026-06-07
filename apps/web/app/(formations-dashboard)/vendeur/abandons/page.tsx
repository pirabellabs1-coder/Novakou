"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Mail,
  Phone,
  MessageCircle,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingCart,
  RefreshCw,
  Clock,
  Info,
  Wallet,
  Sparkles,
  TrendingUp,
  Percent,
} from "lucide-react";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";

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

function statusBadgeProps(s: Attempt["status"]): { label: string; variant: "blue" | "orange" | "rose" | "green" } {
  const map: Record<Attempt["status"], { label: string; variant: "blue" | "orange" | "rose" | "green" }> = {
    STARTED: { label: "Démarré", variant: "blue" },
    ABANDONED: { label: "Abandonné", variant: "orange" },
    FAILED: { label: "Échoué", variant: "rose" },
    COMPLETED: { label: "Payé", variant: "green" },
    RECOVERED: { label: "Récupéré", variant: "green" },
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
  const conversionRate = stats.COMPLETED?.count
    ? Math.round((stats.COMPLETED.count / ((stats.COMPLETED?.count ?? 0) + (stats.FAILED?.count ?? 0) + (stats.ABANDONED?.count ?? 0))) * 100)
    : 0;

  const filters: Array<{ id: StatusFilter; label: string }> = [
    { id: "unresolved", label: "À relancer" },
    { id: "failed", label: "Échecs" },
    { id: "abandoned", label: "Abandons" },
    { id: "recovered", label: "Récupérés" },
    { id: "all", label: "Tout" },
  ];

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">
      <KazaHero
        badge="Pro"
        badgeColor="orange"
        title="Abandons et paiements échoués"
        subtitle="Relancez les visiteurs qui ont tenté d'acheter sans finaliser"
        icon={CreditCard}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KazaKpiCard
          label="Potentiel perdu"
          value={fmtFCFA(totalLost)}
          delta={`${(stats.FAILED?.count ?? 0) + (stats.ABANDONED?.count ?? 0)} tentatives`}
          deltaTrend="down"
          icon={Wallet}
          iconColor="rose"
        />
        <KazaKpiCard
          label="Récupéré"
          value={fmtFCFA(totalRecovered)}
          delta={`${stats.RECOVERED?.count ?? 0} récup.`}
          deltaTrend="up"
          icon={Sparkles}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="Paiements réussis"
          value={fmtFCFA(totalCompleted)}
          delta={`${stats.COMPLETED?.count ?? 0} cmd.`}
          deltaTrend="up"
          icon={TrendingUp}
          iconColor="sky"
        />
        <KazaKpiCard
          label="Taux conversion"
          value={`${conversionRate}%`}
          icon={Percent}
          iconColor="violet"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-100 w-fit overflow-x-auto">
        {filters.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatus(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              status === t.id ? "bg-[#0b2540] text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : attempts.length === 0 ? (
        <KazaEmpty
          icon={ShoppingCart}
          title="Aucun abandon dans cette catégorie"
          description="Les abandons apparaissent ici quand un visiteur clique sur « Payer » sans finaliser (timeout 1h). Les paiements échoués s'affichent immédiatement dans « Échecs »."
          action={{ label: "Actualiser", onClick: () => load() }}
        />
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
              <KazaCard key={a.id}>
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <KazaBadge variant={st.variant}>{st.label}</KazaBadge>
                      {alreadyContacted && (
                        <KazaBadge variant="violet" icon={Check}>Contacté</KazaBadge>
                      )}
                      {a.reminder1SentAt && <KazaBadge variant="blue">Rappel 1 envoyé</KazaBadge>}
                      {a.reminder2SentAt && <KazaBadge variant="blue">Rappel 2 envoyé</KazaBadge>}
                      <span className="text-[10px] text-slate-500">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="text-base font-bold text-slate-900">{visitorIdentity}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      {a.visitorEmail && (
                        <span className="inline-flex items-center gap-1"><Mail size={14} />{a.visitorEmail}</span>
                      )}
                      {a.visitorPhone && (
                        <span className="inline-flex items-center gap-1"><Phone size={14} />{a.visitorPhone}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-[#0b2540] tabular-nums">{fmtFCFA(a.amount)}</p>
                    <p className="text-[10px] text-slate-500">{a.paymentMethod ?? "Moyen inconnu"}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-3 text-xs">
                  <p className="text-slate-600">
                    <span className="font-bold">{itemType === "formation" ? "Formation" : "Produit"} :</span> {itemTitle}
                  </p>
                  {a.failureReason && (
                    <p className="text-rose-700 mt-1">
                      <span className="font-bold">Raison de l&apos;échec :</span> {a.failureReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {a.visitorEmail && (
                    <KazaButton
                      variant="primary"
                      size="sm"
                      onClick={() => sendRecoveryEmail(a.id)}
                      disabled={sendingEmailId === a.id}
                      icon={sendingEmailId === a.id ? Loader2 : Mail}
                    >
                      {sendingEmailId === a.id ? "Envoi…" : "Envoyer un email"}
                    </KazaButton>
                  )}
                  {sendResult?.id === a.id && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${sendResult.ok ? "text-emerald-600" : "text-rose-600"}`}>
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>
                  )}
                  {!alreadyContacted && (a.visitorEmail || a.visitorPhone) && (
                    <KazaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => markContacted(a.id)}
                      icon={Check}
                    >
                      Marquer contacté
                    </KazaButton>
                  )}
                </div>
              </KazaCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
