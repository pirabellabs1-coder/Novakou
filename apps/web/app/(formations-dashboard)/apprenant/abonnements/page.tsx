"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToastStore } from "@/store/toast";

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

const STATUS_LABELS: Record<Subscription["status"], { label: string; color: string }> = {
  active: { label: "Actif", color: "bg-green-100 text-green-700" },
  trialing: { label: "Essai gratuit", color: "bg-blue-100 text-blue-700" },
  past_due: { label: "Paiement en retard", color: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Annulé", color: "bg-gray-100 text-gray-600" },
  expired: { label: "Expiré", color: "bg-red-100 text-red-700" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function AbonnementsPage() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

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
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes abonnements</h1>
        <p className="text-sm text-[#5c647a] mt-1">
          {isLoading
            ? "Chargement…"
            : `${active.length} abonnement${active.length > 1 ? "s" : ""} actif${active.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#5c647a]">card_membership</span>
          </div>
          <h3 className="font-bold text-[#191c1e] mb-1">Aucun abonnement</h3>
          <p className="text-sm text-[#5c647a] mb-4">
            Vous n&apos;avez pas encore souscrit à un abonnement vendeur.
          </p>
          <Link
            href="/explorer"
            className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#5c647a] uppercase tracking-wider mb-3">
                Abonnements actifs
              </h2>
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
                  />
                ))}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#5c647a] uppercase tracking-wider mb-3">
                Historique
              </h2>
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
                  />
                ))}
              </div>
            </div>
          )}
        </div>
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
}: {
  sub: Subscription;
  onAskCancel: () => void;
  canceling: boolean;
  confirmCancel: boolean;
  onConfirmCancel: () => void;
  onAbortCancel: () => void;
}) {
  const status = STATUS_LABELS[sub.status];
  const isActive = sub.status === "active" || sub.status === "trialing";
  const formationCount = sub.plan?.linkedFormationIds.length ?? 0;
  const productCount = sub.plan?.linkedProductIds.length ?? 0;
  const itemCount = formationCount + productCount;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-[26px]">card_membership</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${status.color}`}>
                  {status.label}
                </span>
                {sub.cancelAtPeriodEnd && isActive && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Annulation programmée
                  </span>
                )}
                {sub.plan?.interval && (
                  <span className="text-[10px] font-medium text-[#5c647a]">
                    {sub.plan.interval === "yearly" ? "Annuel" : "Mensuel"}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-[#191c1e] text-base leading-tight">
                {sub.plan?.name ?? "Abonnement"}
              </h3>
              {sub.plan?.instructeur?.user?.name && (
                <p className="text-xs text-[#5c647a] mt-0.5">par {sub.plan.instructeur.user.name}</p>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg font-extrabold text-[#191c1e]">
              {fmt(sub.plan?.price ?? 0)} {sub.plan?.currency ?? "FCFA"}
            </p>
            <p className="text-[11px] text-[#5c647a]">
              / {sub.plan?.interval === "yearly" ? "an" : "mois"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-[#f7f9fb] rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-[#5c647a] mb-0.5">Période en cours</p>
            <p className="text-xs font-semibold text-[#191c1e]">
              {fmtDate(sub.currentPeriodStart)} → {fmtDate(sub.currentPeriodEnd)}
            </p>
          </div>
          <div className="bg-[#f7f9fb] rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-[#5c647a] mb-0.5">Contenu débloqué</p>
            <p className="text-xs font-semibold text-[#191c1e]">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-[#f7f9fb] rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-[#5c647a] mb-0.5">Total payé</p>
            <p className="text-xs font-semibold text-[#191c1e]">
              {fmt(sub.totalPaid)} FCFA
            </p>
          </div>
        </div>

        {isActive && itemCount > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex items-start gap-2">
            <span
              className="material-symbols-outlined text-[#006e2f] text-[18px] mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <div className="flex-1">
              <p className="text-xs font-bold text-[#006e2f] mb-1">
                Votre contenu est disponible
              </p>
              <p className="text-[11px] text-[#005a26] mb-2">
                {formationCount > 0 && `${formationCount} formation${formationCount > 1 ? "s" : ""}`}
                {formationCount > 0 && productCount > 0 && " et "}
                {productCount > 0 && `${productCount} produit${productCount > 1 ? "s" : ""}`}
                {" débloqué"}{itemCount > 1 ? "s" : ""} pendant la durée de votre abonnement.
              </p>
              <div className="flex flex-wrap gap-2">
                {formationCount > 0 && (
                  <Link
                    href="/apprenant/mes-formations"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006e2f] bg-white border border-[#006e2f]/20 px-2.5 py-1 rounded-full hover:bg-[#006e2f] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    Voir les formations
                  </Link>
                )}
                {productCount > 0 && (
                  <Link
                    href="/apprenant/mes-produits"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006e2f] bg-white border border-[#006e2f]/20 px-2.5 py-1 rounded-full hover:bg-[#006e2f] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                    Voir les produits
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {sub.trialEndsAt && sub.status === "trialing" && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px] mt-0.5">schedule</span>
            <p className="text-[11px] text-blue-900">
              Essai gratuit jusqu&apos;au <strong>{fmtDate(sub.trialEndsAt)}</strong>. Vous serez prélevé(e)
              ce jour-là sauf si vous annulez avant.
            </p>
          </div>
        )}

        {/* Invoices toggle (last 3) */}
        {sub.invoices.length > 0 && (
          <details className="mb-3">
            <summary className="cursor-pointer text-xs font-bold text-[#5c647a] uppercase tracking-wider hover:text-[#191c1e]">
              Historique de paiement ({sub.invoices.length})
            </summary>
            <ul className="mt-2 space-y-1.5">
              {sub.invoices.slice(0, 6).map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between text-[11px] py-2 px-3 bg-[#f7f9fb] rounded-lg"
                >
                  <span className="text-[#5c647a]">
                    {inv.paidAt ? fmtDate(inv.paidAt) : fmtDate(inv.createdAt)}
                  </span>
                  <span className="font-semibold text-[#191c1e]">{fmt(inv.amount)} FCFA</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {isActive && !sub.cancelAtPeriodEnd && (
          <div className="flex justify-end">
            {confirmCancel ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5c647a]">
                  Annuler vraiment ? Accès maintenu jusqu&apos;au {fmtDate(sub.currentPeriodEnd)}.
                </span>
                <button
                  onClick={onAbortCancel}
                  disabled={canceling}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-[#191c1e] hover:bg-gray-200 transition-colors"
                >
                  Non
                </button>
                <button
                  onClick={onConfirmCancel}
                  disabled={canceling}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {canceling ? "…" : "Oui, annuler"}
                </button>
              </div>
            ) : (
              <button
                onClick={onAskCancel}
                className="text-xs font-bold text-[#5c647a] hover:text-red-600 transition-colors"
              >
                Annuler l&apos;abonnement
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
