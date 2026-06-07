// Refonte style KAZA — apprenant abonnements — 2026-06-07
"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToastStore } from "@/store/toast";
import { ReviewModal } from "@/components/formations/ReviewModal";
import {
  KazaHero,
  KazaButton,
  KazaBadge,
  KazaEmpty,
  KazaSection,
} from "@/components/kaza";
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

const STATUS_BADGE: Record<Subscription["status"], { label: string; variant: "green" | "blue" | "orange" | "slate" | "rose" }> = {
  active: { label: "Actif", variant: "green" },
  trialing: { label: "Essai gratuit", variant: "blue" },
  past_due: { label: "Paiement en retard", variant: "orange" },
  cancelled: { label: "Annulé", variant: "slate" },
  expired: { label: "Expiré", variant: "rose" },
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
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={CreditCard}
        title="Mes abonnements"
        subtitle={
          isLoading
            ? "Chargement…"
            : `${active.length} abonnement${active.length > 1 ? "s" : ""} actif${active.length > 1 ? "s" : ""}`
        }
        actions={
          <KazaButton variant="primary" href="/explorer" icon={Search}>
            Explorer le catalogue
          </KazaButton>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <KazaEmpty
          icon={CreditCard}
          title="Aucun abonnement"
          description="Vous n'avez pas encore souscrit à un abonnement vendeur. Découvrez les offres récurrentes des créateurs Novakou."
          action={{ label: "Explorer le catalogue", href: "/explorer" }}
        />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <KazaSection label="En cours" title="Abonnements actifs">
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
            </KazaSection>
          )}

          {inactive.length > 0 && (
            <KazaSection label="Archive" title="Historique">
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
            </KazaSection>
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {sub.plan?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sub.plan.imageUrl}
                alt=""
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <KazaBadge variant={status.variant} size="sm">{status.label}</KazaBadge>
                {sub.cancelAtPeriodEnd && isActive && (
                  <KazaBadge variant="orange" size="sm">Annulation programmée</KazaBadge>
                )}
                {sub.plan?.interval && (
                  <span className="text-[10px] font-medium text-slate-500">
                    {sub.plan.interval === "yearly" ? "Annuel" : "Mensuel"}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-[#0b2540] text-base leading-tight">
                {sub.plan?.name ?? "Abonnement"}
              </h3>
              {sub.plan?.instructeur?.user?.name && (
                <p className="text-xs text-slate-500 mt-0.5">par {sub.plan.instructeur.user.name}</p>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg font-extrabold text-[#0b2540]">
              {fmt(sub.plan?.price ?? 0)} {sub.plan?.currency ?? "FCFA"}
            </p>
            <p className="text-[11px] text-slate-500">
              / {sub.plan?.interval === "yearly" ? "an" : "mois"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Période en cours</p>
            <p className="text-xs font-semibold text-[#0b2540]">
              {fmtDate(sub.currentPeriodStart)} → {fmtDate(sub.currentPeriodEnd)}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Contenu débloqué</p>
            <p className="text-xs font-semibold text-[#0b2540]">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Total payé</p>
            <p className="text-xs font-semibold text-[#0b2540]">{fmt(sub.totalPaid)} FCFA</p>
          </div>
        </div>

        {isActive && itemCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-700 mb-1">Votre contenu est disponible</p>
              <p className="text-[11px] text-emerald-800 mb-2">
                {formationCount > 0 && `${formationCount} formation${formationCount > 1 ? "s" : ""}`}
                {formationCount > 0 && productCount > 0 && " et "}
                {productCount > 0 && `${productCount} produit${productCount > 1 ? "s" : ""}`}
                {" débloqué"}{itemCount > 1 ? "s" : ""} pendant la durée de votre abonnement.
              </p>
              <div className="flex flex-wrap gap-2">
                {formationCount > 0 && (
                  <KazaButton variant="ghost" size="sm" href="/apprenant/mes-formations" icon={GraduationCap}>
                    Voir les formations
                  </KazaButton>
                )}
                {productCount > 0 && (
                  <KazaButton variant="ghost" size="sm" href="/apprenant/mes-produits" icon={Package}>
                    Voir les produits
                  </KazaButton>
                )}
              </div>
            </div>
          </div>
        )}

        {sub.trialEndsAt && sub.status === "trialing" && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 mb-4 flex items-start gap-2">
            <Clock className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-sky-900">
              Essai gratuit jusqu&apos;au <strong>{fmtDate(sub.trialEndsAt)}</strong>. Vous serez prélevé(e)
              ce jour-là sauf si vous annulez avant.
            </p>
          </div>
        )}

        {sub.invoices.length > 0 && (
          <details className="mb-3">
            <summary className="cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-[#0b2540]">
              Historique de paiement ({sub.invoices.length})
            </summary>
            <ul className="mt-2 space-y-1.5">
              {sub.invoices.slice(0, 6).map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between text-[11px] py-2 px-3 bg-slate-50 rounded-lg"
                >
                  <span className="text-slate-500">
                    {inv.paidAt ? fmtDate(inv.paidAt) : fmtDate(inv.createdAt)}
                  </span>
                  <span className="font-semibold text-[#0b2540]">{fmt(inv.amount)} FCFA</span>
                  <KazaBadge variant={inv.status === "paid" ? "green" : "slate"} size="sm">
                    {inv.status}
                  </KazaBadge>
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {sub.plan?.id && (
            <button
              onClick={() => onReview(sub.plan!.id, sub.plan!.name)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Donner mon avis
            </button>
          )}

          {isActive && !sub.cancelAtPeriodEnd && (
            <div>
              {confirmCancel ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">
                    Annuler ? Accès jusqu&apos;au {fmtDate(sub.currentPeriodEnd)}.
                  </span>
                  <KazaButton variant="ghost" size="sm" onClick={onAbortCancel} disabled={canceling}>
                    Non
                  </KazaButton>
                  <KazaButton variant="danger" size="sm" onClick={onConfirmCancel} disabled={canceling}>
                    {canceling ? "…" : "Oui, annuler"}
                  </KazaButton>
                </div>
              ) : (
                <button
                  onClick={onAskCancel}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Annuler l&apos;abonnement
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
