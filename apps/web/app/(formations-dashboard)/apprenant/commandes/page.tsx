"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type OrderType = "formation" | "product" | "mentor";
type OrderStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "PENDING" | "CONFIRMED" | "REFUND_PENDING" | "REFUNDED";

type Order = {
  id: string;
  type: OrderType;
  title: string;
  thumbnail: string | null;
  category: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  progress: number;
  refundRequested?: boolean;
  refundedAt?: string | null;
  instructeurUserId: string | null;
};

type FilterValue = "all" | OrderType;

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
function toEur(n: number)      { return Math.round(n / 655.957); }

const typeColors: Record<OrderType, string> = {
  formation: "bg-blue-100 text-blue-700",
  product:   "bg-amber-100 text-amber-700",
  mentor:    "bg-purple-100 text-purple-700",
};
const typeLabels: Record<OrderType, string> = {
  formation: "Formation vidéo",
  product:   "Produit numérique",
  mentor:    "Session mentor",
};
const typeIcons: Record<OrderType, string> = {
  formation: "play_circle",
  product:   "inventory_2",
  mentor:    "support_agent",
};

const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
  COMPLETED:       { label: "Terminé",            className: "bg-[#006e2f]/10 text-[#006e2f]", icon: "check_circle" },
  ACTIVE:          { label: "En cours",           className: "bg-blue-100 text-blue-700",      icon: "schedule" },
  PENDING:         { label: "En attente",         className: "bg-amber-100 text-amber-700",    icon: "hourglass_empty" },
  CONFIRMED:       { label: "Confirmé",           className: "bg-blue-100 text-blue-700",      icon: "check" },
  CANCELLED:       { label: "Annulé",             className: "bg-red-100 text-red-600",        icon: "cancel" },
  REFUND_PENDING:  { label: "Remboursement demandé", className: "bg-amber-100 text-amber-700", icon: "hourglass_empty" },
  REFUNDED:        { label: "Remboursé",          className: "bg-red-100 text-red-600",        icon: "money_off" },
  100:             { label: "Terminé",            className: "bg-[#006e2f]/10 text-[#006e2f]", icon: "check_circle" },
};

function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-start gap-4 p-4 md:p-5">
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

type RefundEligibility = {
  eligible: boolean;
  reason?: string;
  details: {
    purchasedAt?: string;
    daysSincePurchase?: number;
    consumedPct?: number;
    recentRefundsCount?: number;
  };
  config: {
    windowDays: number;
    maxConsumedPct: number;
    maxRefundsPerBuyer30d: number;
  };
};

export default function CommandesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [contactingId, setContactingId] = useState<string | null>(null);

  // ── Refund modal state ──
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundEligibility, setRefundEligibility] = useState<RefundEligibility | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState(false);

  async function openRefund(order: Order) {
    setRefundOrder(order);
    setRefundEligibility(null);
    setRefundReason("");
    setRefundError(null);
    setRefundSuccess(false);
    try {
      const res = await fetch(
        `/api/formations/apprenant/refund-request?type=${order.type === "formation" ? "enrollment" : order.type}&id=${order.id}`,
      );
      const json = await res.json();
      setRefundEligibility(json.data ?? null);
    } catch {
      setRefundError("Impossible de vérifier l'éligibilité.");
    }
  }

  function closeRefund() {
    setRefundOrder(null);
    setRefundEligibility(null);
    setRefundReason("");
    setRefundError(null);
    setRefundSuccess(false);
    setRefundLoading(false);
  }

  async function submitRefund() {
    if (!refundOrder || !refundEligibility?.eligible) return;
    if (refundReason.trim().length < 10) {
      setRefundError("Indiquez un motif d'au moins 10 caractères.");
      return;
    }
    setRefundLoading(true);
    setRefundError(null);
    try {
      const res = await fetch("/api/formations/apprenant/refund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: refundOrder.type === "formation" ? "enrollment" : refundOrder.type,
          id: refundOrder.id,
          reason: refundReason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRefundError(json.error || "Demande refusée.");
        setRefundLoading(false);
        return;
      }
      setRefundSuccess(true);
      qc.invalidateQueries({ queryKey: ["apprenant-commandes"] });
      setTimeout(closeRefund, 2500);
    } catch {
      setRefundError("Erreur réseau, réessayez.");
    } finally {
      setRefundLoading(false);
    }
  }

  async function handleContact(instructeurUserId: string, orderId: string) {
    setContactingId(orderId);
    try {
      const res = await fetch("/api/formations/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: instructeurUserId }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      router.push(`/messages/${json.data.id}`);
    } catch {
      router.push("/messages");
    } finally {
      setContactingId(null);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-commandes", activeFilter],
    queryFn: () => {
      const url = activeFilter === "all"
        ? "/api/formations/apprenant/commandes"
        : `/api/formations/apprenant/commandes?type=${activeFilter}`;
      return fetch(url).then((r) => r.json());
    },
    staleTime: 30_000,
  });

  const orders: Order[] = data?.data ?? [];

  const filters: { label: string; value: FilterValue }[] = [
    { label: "Tout",       value: "all" },
    { label: "Formations", value: "formation" },
    { label: "Produits",   value: "product" },
    { label: "Mentors",    value: "mentor" },
  ];

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes Commandes</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            {isLoading ? "Chargement…" : `${orders.length} commande${orders.length > 1 ? "s" : ""} au total`}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button key={f.value} onClick={() => setActiveFilter(f.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeFilter === f.value ? "text-white shadow-sm" : "bg-white border border-gray-200 text-[#5c647a] hover:border-[#006e2f]/30 hover:text-[#006e2f]"
            }`}
            style={activeFilter === f.value ? { background: "linear-gradient(to right, #006e2f, #22c55e)" } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[0,1,2,3].map((i) => <SkeletonRow key={i} />)}</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#5c647a]">receipt_long</span>
          </div>
          <h3 className="font-bold text-[#191c1e] mb-1">Aucune commande</h3>
          <p className="text-sm text-[#5c647a] mb-4">
            {activeFilter === "all" ? "Vous n'avez pas encore effectué de commande." : "Aucune commande dans cette catégorie."}
          </p>
          <Link href="/explorer"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const type = order.type as OrderType;
            const statusKey = order.status === "COMPLETED" || order.progress >= 100 ? "COMPLETED" : order.status;
            const status = statusConfig[statusKey] ?? { label: order.status, className: "bg-gray-100 text-gray-700", icon: "info" };
            const icon = typeIcons[type] ?? "shopping_bag";
            const date = new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

            return (
              <div key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-start gap-4 p-4 md:p-5">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #006e2f 0%, #22c55e 100%)" }}>
                    <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-[#5c647a] font-medium mb-1 tabular-nums">#{order.id.slice(0, 12).toUpperCase()}</p>
                        <h3 className="font-bold text-[#191c1e] text-sm leading-snug line-clamp-2 mb-1">{order.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#5c647a]">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${typeColors[type] ?? "bg-gray-100 text-gray-700"}`}>
                            {typeLabels[type] ?? type}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                            {date}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap">
                        <div className="text-right">
                          <p className="font-extrabold text-[#191c1e] text-sm whitespace-nowrap">{formatFcfa(order.amount)}</p>
                          <p className="text-[10px] text-[#5c647a]">≈ {toEur(order.amount)} €</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${status.className}`}>
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{status.icon}</span>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/apprenant/commandes/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-[14px] text-[#5c647a]">receipt_long</span>
                        Voir détails
                      </Link>
                      {type === "formation" && (
                        <Link href={`/apprenant/formation/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                          <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                          Accéder
                        </Link>
                      )}
                      {order.instructeurUserId && (
                        <button
                          onClick={() => handleContact(order.instructeurUserId!, order.id)}
                          disabled={contactingId === order.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#006e2f]/30 text-xs font-semibold text-[#006e2f] hover:bg-[#006e2f]/5 transition-colors disabled:opacity-50">
                          {contactingId === order.id ? (
                            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-[14px]">forum</span>
                          )}
                          Contacter l'instructeur
                        </button>
                      )}
                      {type === "formation" &&
                        !order.refundedAt &&
                        !order.refundRequested &&
                        order.status !== "CANCELLED" && (
                          <button
                            onClick={() => openRefund(order)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">money_off</span>
                            Demander un remboursement
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Refund modal ────────────────────────────────────────────── */}
      {refundOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={closeRefund}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-red-600 text-[20px]">money_off</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#191c1e] text-base truncate">
                    Demande de remboursement
                  </h3>
                  <p className="text-xs text-[#5c647a] truncate">{refundOrder.title}</p>
                </div>
              </div>
              <button onClick={closeRefund} className="p-1 rounded-lg hover:bg-gray-100 flex-shrink-0">
                <span className="material-symbols-outlined text-[20px] text-[#5c647a]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Eligibility loading */}
              {!refundEligibility && !refundError && (
                <div className="flex items-center gap-2 text-sm text-[#5c647a]">
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  Vérification de l&apos;éligibilité…
                </div>
              )}

              {/* Eligibility result */}
              {refundEligibility && !refundSuccess && (
                <div
                  className={`p-3 rounded-xl border ${
                    refundEligibility.eligible
                      ? "bg-[#006e2f]/5 border-[#006e2f]/20"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`material-symbols-outlined text-[18px] mt-0.5 ${
                        refundEligibility.eligible ? "text-[#006e2f]" : "text-amber-600"
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {refundEligibility.eligible ? "check_circle" : "info"}
                    </span>
                    <div className="flex-1 text-xs">
                      {refundEligibility.eligible ? (
                        <>
                          <p className="font-bold text-[#006e2f] mb-1">Demande recevable</p>
                          <p className="text-[#191c1e]">
                            Achat il y a{" "}
                            {refundEligibility.details.daysSincePurchase ?? 0} jour
                            {(refundEligibility.details.daysSincePurchase ?? 0) > 1 ? "s" : ""} ·
                            Contenu consommé : {refundEligibility.details.consumedPct ?? 0}%
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-amber-900 mb-1">Demande non recevable</p>
                          <p className="text-amber-800">{refundEligibility.reason}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reason form (only if eligible) */}
              {refundEligibility?.eligible && !refundSuccess && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#191c1e] mb-1.5 uppercase tracking-wider">
                      Motif <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows={4}
                      placeholder="Expliquez pourquoi vous souhaitez être remboursé (au moins 10 caractères)…"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 focus:border-[#006e2f] resize-none"
                    />
                    <p className="text-[10px] text-[#5c647a] mt-1">
                      {refundReason.length} / 10 caractères minimum
                    </p>
                  </div>
                  <p className="text-[11px] text-[#5c647a] leading-relaxed">
                    Conformément à notre politique :{" "}
                    {refundEligibility.config.windowDays} jours après l&apos;achat,
                    contenu consommé ≤ {refundEligibility.config.maxConsumedPct}%, max{" "}
                    {refundEligibility.config.maxRefundsPerBuyer30d} remboursement
                    {refundEligibility.config.maxRefundsPerBuyer30d > 1 ? "s" : ""}/30 jours.
                  </p>
                </>
              )}

              {refundError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">error</span>
                  <span>{refundError}</span>
                </div>
              )}

              {refundSuccess && (
                <div className="p-3 rounded-xl bg-[#006e2f]/5 border border-[#006e2f]/20 text-xs text-[#006e2f]">
                  <p className="font-bold mb-1">Demande envoyée ✓</p>
                  <p>
                    Notre équipe l&apos;examinera sous 48h. Vous recevrez un email
                    dès la décision prise.
                  </p>
                </div>
              )}
            </div>

            {!refundSuccess && (
              <div className="p-5 border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={closeRefund}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#5c647a] hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                {refundEligibility?.eligible && (
                  <button
                    onClick={submitRefund}
                    disabled={refundLoading || refundReason.trim().length < 10}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                  >
                    {refundLoading ? (
                      <>
                        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                        Envoi…
                      </>
                    ) : (
                      "Envoyer la demande"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
