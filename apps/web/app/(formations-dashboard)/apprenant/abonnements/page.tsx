// Refonte design "Stitch" — apprenant abonnements — vert Novakou — 2026-06-13
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToastStore } from "@/store/toast";
import { ReviewModal } from "@/components/formations/ReviewModal";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StSectionTitle,
  ST,
} from "@/components/stitch";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  GraduationCap,
  Package,
  Sparkles,
} from "lucide-react";

type Subscription = {
  id: string;
  status: "active" | "trialing" | "past_due" | "cancelled" | "expired";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  totalPaid: number;
  renewalCount: number;
  plan?: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    currency: string;
    interval: "monthly" | "yearly";
    linkedFormationIds: string[];
    linkedProductIds: string[];
    instructeur?: { user?: { id: string; name: string | null; image: string | null } };
  };
  invoices: {
    id: string;
    amount: number;
    status: string;
    periodStart: string;
    periodEnd: string;
    paidAt: string | null;
    createdAt: string;
  }[];
};

const STATUS_BADGE: Record<Subscription["status"], { label: string; tone: "green" | "blue" | "amber" | "neutral" | "rose" }> = {
  active: { label: "Actif", tone: "green" },
  trialing: { label: "Essai gratuit", tone: "blue" },
  past_due: { label: "Paiement en retard", tone: "amber" },
  cancelled: { label: "Annulé", tone: "neutral" },
  expired: { label: "Expiré", tone: "rose" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function AbonnementsPage() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ planId: string; planName: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-subscriptions"],
    queryFn: () => fetch("/api/formations/apprenant/subscriptions").then((r) => r.json()),
    staleTime: 30_000,
  });
  const subscriptions: Subscription[] = data?.data ?? [];

  const cancelMutation = useMutation({
    mutationFn: async (subId: string) => {
      const r = await fetch(`/api/formations/apprenant/subscriptions/${subId}/cancel`, {
        method: "POST",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Erreur");
      return j;
    },
    onSuccess: () => {
      addToast("success", "Abonnement annulé. L'accès reste actif jusqu'à la fin de la période.");
      qc.invalidateQueries({ queryKey: ["apprenant-subscriptions"] });
      setConfirmCancel(null);
    },
    onError: (err: Error) => addToast("error", err.message),
  });

  const active = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  const inactive = subscriptions.filter((s) => s.status !== "active" && s.status !== "trialing");

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes abonnements"
          subtitle={
            isLoading
              ? "Chargement…"
              : `${active.length} abonnement${active.length > 1 ? "s" : ""} actif${active.length > 1 ? "s" : ""}`
          }
          actions={
            <StButton href="/explorer" icon={Search}>
              Explorer le catalogue
            </StButton>
          }
        />

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 bg-white rounded-[18px] animate-pulse" style={{ border: `1px solid ${ST.cardBorder}` }} />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <CreditCard size={32} style={{ color: ST.green }} strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucun abonnement</h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Vous n&apos;avez pas encore souscrit à un abonnement vendeur. Découvrez les offres récurrentes des créateurs Novakou.
            </p>
            <StButton href="/explorer" icon={Search}>Explorer le catalogue</StButton>
          </StCard>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <StSectionTitle>Abonnements actifs</StSectionTitle>
                <div className="space-y-4">
                  {active.map((sub) => (
                    <SubscriptionCard
                      key={sub.id}
                      sub={sub}
                      onAskCancel={() => setConfirmCancel(sub.id)}
                      canceling={cancelMutation.isPending && confirmCancel === sub.id}
                      confirmCancel={confirmCancel === sub.id}
                      onConfirmCancel={() => cancelMutation.mutate(sub.id)}
                      onAbortCancel={() => setConfirmCancel(null)}
                      onReview={(planId, planName) => setReviewTarget({ planId, planName })}
                    />
                  ))}
                </div>
              </section>
            )}

            {inactive.length > 0 && (
              <section>
                <StSectionTitle>Historique</StSectionTitle>
                <div className="space-y-4">
                  {inactive.map((sub) => (
                    <SubscriptionCard
                      key={sub.id}
                      sub={sub}
                      onAskCancel={() => {}}
                      canceling={false}
                      confirmCancel={false}
                      onConfirmCancel={() => {}}
                      onAbortCancel={() => {}}
                      onReview={(planId, planName) => setReviewTarget({ planId, planName })}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {reviewTarget && (
          <ReviewModal
            open={!!reviewTarget}
            onClose={() => setReviewTarget(null)}
            onSuccess={() => qc.invalidateQueries({ queryKey: ["apprenant-subscriptions"] })}
            kind="subscription"
            itemId={reviewTarget.planId}
            itemTitle={reviewTarget.planName}
          />
        )}
      </main>
    </div>
  );
}

function SubscriptionCard({
  sub,
  onAskCancel,
  canceling,
  confirmCancel,
  onConfirmCancel,
  onAbortCancel,
  onReview,
}: {
  sub: Subscription;
  onAskCancel: () => void;
  canceling: boolean;
  confirmCancel: boolean;
  onConfirmCancel: () => void;
  onAbortCancel: () => void;
  onReview: (planId: string, planName: string) => void;
}) {
  const status = STATUS_BADGE[sub.status];
  const isActive = sub.status === "active" || sub.status === "trialing";
  const formationCount = sub.plan?.linkedFormationIds.length ?? 0;
  const productCount = sub.plan?.linkedProductIds.length ?? 0;
  const itemCount = formationCount + productCount;

  return (
    <StCard noPadding className="overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {sub.plan?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sub.plan.imageUrl}
                alt=""
                className="w-14 h-14 rounded-[13px] object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-[13px] flex items-center justify-center flex-shrink-0" style={{ background: ST.gradient }}>
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StChip tone={status.tone}>{status.label}</StChip>
                {sub.cancelAtPeriodEnd && isActive && (
                  <StChip tone="amber">Annulation programmée</StChip>
                )}
                {sub.plan?.interval && (
                  <span className="text-[10px] font-bold" style={{ color: ST.textMuted }}>
                    {sub.plan.interval === "yearly" ? "Annuel" : "Mensuel"}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-[15px] leading-tight" style={{ color: ST.text }}>
                {sub.plan?.name ?? "Abonnement"}
              </h3>
              {sub.plan?.instructeur?.user?.name && (
                <p className="text-[12px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>par {sub.plan.instructeur.user.name}</p>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-[18px] font-extrabold tabular-nums" style={{ color: ST.text }}>
              {fmt(sub.plan?.price ?? 0)} {sub.plan?.currency ?? "FCFA"}
            </p>
            <p className="text-[11px] font-semibold" style={{ color: ST.textMuted }}>
              / {sub.plan?.interval === "yearly" ? "an" : "mois"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-[12px] p-3" style={{ background: "#f7faf8" }}>
            <p className="text-[10px] uppercase font-extrabold mb-0.5" style={{ color: ST.textMuted }}>Période en cours</p>
            <p className="text-[12px] font-bold" style={{ color: ST.text }}>
              {fmtDate(sub.currentPeriodStart)} → {fmtDate(sub.currentPeriodEnd)}
            </p>
          </div>
          <div className="rounded-[12px] p-3" style={{ background: "#f7faf8" }}>
            <p className="text-[10px] uppercase font-extrabold mb-0.5" style={{ color: ST.textMuted }}>Contenu débloqué</p>
            <p className="text-[12px] font-bold" style={{ color: ST.text }}>
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-[12px] p-3" style={{ background: "#f7faf8" }}>
            <p className="text-[10px] uppercase font-extrabold mb-0.5" style={{ color: ST.textMuted }}>Total payé</p>
            <p className="text-[12px] font-bold" style={{ color: ST.text }}>{fmt(sub.totalPaid)} FCFA</p>
          </div>
        </div>

        {isActive && itemCount > 0 && (
          <div className="rounded-[12px] p-3 mb-4 flex items-start gap-2" style={{ background: ST.greenSoft, border: "1px solid #d7ecde" }}>
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: ST.green }} />
            <div className="flex-1">
              <p className="text-[12px] font-extrabold mb-1" style={{ color: ST.green }}>Votre contenu est disponible</p>
              <p className="text-[11px] mb-2" style={{ color: "#2f7a4c" }}>
                {formationCount > 0 && `${formationCount} formation${formationCount > 1 ? "s" : ""}`}
                {formationCount > 0 && productCount > 0 && " et "}
                {productCount > 0 && `${productCount} produit${productCount > 1 ? "s" : ""}`}
                {" débloqué"}{itemCount > 1 ? "s" : ""} pendant la durée de votre abonnement.
              </p>
              <div className="flex flex-wrap gap-2">
                {formationCount > 0 && (
                  <StButton variant="secondary" size="sm" href="/apprenant/mes-formations" icon={GraduationCap}>
                    Voir les formations
                  </StButton>
                )}
                {productCount > 0 && (
                  <StButton variant="secondary" size="sm" href="/apprenant/mes-produits" icon={Package}>
                    Voir les produits
                  </StButton>
                )}
              </div>
            </div>
          </div>
        )}

        {sub.trialEndsAt && sub.status === "trialing" && (
          <div className="rounded-[12px] p-3 mb-4 flex items-start gap-2" style={{ background: ST.blueSoft, border: "1px solid #cfe3f5" }}>
            <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: ST.blueText }} />
            <p className="text-[11px]" style={{ color: "#0c447c" }}>
              Essai gratuit jusqu&apos;au <strong>{fmtDate(sub.trialEndsAt)}</strong>. Vous serez prélevé(e)
              ce jour-là sauf si vous annulez avant.
            </p>
          </div>
        )}

        {sub.invoices.length > 0 && (
          <details className="mb-3">
            <summary className="cursor-pointer text-[12px] font-extrabold uppercase tracking-wider transition-colors" style={{ color: ST.textSecondary }}>
              Historique de paiement ({sub.invoices.length})
            </summary>
            <ul className="mt-2 space-y-1.5">
              {sub.invoices.slice(0, 6).map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between text-[11px] py-2 px-3 rounded-lg"
                  style={{ background: "#f7faf8" }}
                >
                  <span style={{ color: ST.textSecondary }}>
                    {inv.paidAt ? fmtDate(inv.paidAt) : fmtDate(inv.createdAt)}
                  </span>
                  <span className="font-extrabold" style={{ color: ST.text }}>{fmt(inv.amount)} FCFA</span>
                  <StChip tone={inv.status === "paid" ? "green" : "neutral"}>
                    {inv.status}
                  </StChip>
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {sub.plan?.id && (
            <button
              onClick={() => onReview(sub.plan!.id, sub.plan!.name)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-extrabold transition-colors hover:opacity-90"
              style={{ background: ST.amberSoft, color: ST.amberText }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Donner mon avis
            </button>
          )}

          {isActive && !sub.cancelAtPeriodEnd && (
            <div>
              {confirmCancel ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>
                    Annuler ? Accès jusqu&apos;au {fmtDate(sub.currentPeriodEnd)}.
                  </span>
                  <StButton variant="secondary" size="sm" onClick={onAbortCancel} disabled={canceling}>
                    Non
                  </StButton>
                  <button
                    type="button"
                    onClick={onConfirmCancel}
                    disabled={canceling}
                    className="inline-flex items-center justify-center gap-2 font-extrabold transition-all whitespace-nowrap px-3 py-2 text-[12px] rounded-[10px] hover:opacity-90 disabled:opacity-50"
                    style={{ background: ST.roseSoft, color: ST.roseText }}
                  >
                    {canceling ? "…" : "Oui, annuler"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={onAskCancel}
                  className="text-[12px] font-extrabold transition-colors hover:opacity-80"
                  style={{ color: ST.textSecondary }}
                >
                  Annuler l&apos;abonnement
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </StCard>
  );
}
