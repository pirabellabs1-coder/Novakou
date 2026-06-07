// Refonte style KAZA — apprenant commandes — 2026-06-07
"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { KazaHero, KazaButton, KazaBadge, KazaEmpty } from "@/components/kaza";
import {
  ShoppingBag,
  Search,
  Play,
  Package,
  Headphones,
  Calendar,
  Receipt,
  MessageSquare,
  HandCoins,
  Loader2,
  X,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

type OrderType = "formation" | "product" | "mentor";

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

function formatFcfa(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}
function toEur(n: number) {
  return Math.round(n / 655.957);
}

const typeBadgeVariant: Record<OrderType, "blue" | "orange" | "violet"> = {
  formation: "blue",
  product: "orange",
  mentor: "violet",
};
const typeLabels: Record<OrderType, string> = {
  formation: "Formation vidéo",
  product: "Produit numérique",
  mentor: "Session mentor",
};
const typeIconMap: Record<OrderType, typeof Play> = {
  formation: Play,
  product: Package,
  mentor: Headphones,
};

const statusConfig: Record<
  string,
  { label: string; variant: "green" | "blue" | "orange" | "rose" | "slate" }
> = {
  COMPLETED: { label: "Terminé", variant: "green" },
  ACTIVE: { label: "En cours", variant: "blue" },
  PENDING: { label: "En attente", variant: "orange" },
  CONFIRMED: { label: "Confirmé", variant: "blue" },
  CANCELLED: { label: "Annulé", variant: "rose" },
  REFUND_PENDING: { label: "Remboursement demandé", variant: "orange" },
  REFUNDED: { label: "Remboursé", variant: "rose" },
};

function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse">
      <div className="flex items-start gap-4 p-4 md:p-5">
        <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
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
      const url =
        activeFilter === "all"
          ? "/api/formations/apprenant/commandes"
          : `/api/formations/apprenant/commandes?type=${activeFilter}`;
      return fetch(url).then((r) => r.json());
    },
    staleTime: 30_000,
  });

  const orders: Order[] = data?.data ?? [];

  const filters: { label: string; value: FilterValue }[] = [
    { label: "Tout", value: "all" },
    { label: "Formations", value: "formation" },
    { label: "Produits", value: "product" },
    { label: "Mentors", value: "mentor" },
  ];

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={ShoppingBag}
        title="Mes commandes"
        subtitle={
          isLoading
            ? "Chargement…"
            : `${orders.length} commande${orders.length > 1 ? "s" : ""} au total`
        }
        actions={
          <>
            <KazaButton variant="secondary" href="/apprenant/dashboard" icon={Receipt}>
              Tableau de bord
            </KazaButton>
            <KazaButton variant="primary" href="/explorer" icon={Search}>
              Explorer le catalogue
            </KazaButton>
          </>
        }
      />

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => {
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#0b2540] text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-[#0b2540]/30 hover:text-[#0b2540]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <KazaEmpty
          icon={Receipt}
          title="Aucune commande"
          description={
            activeFilter === "all"
              ? "Vous n'avez pas encore effectué de commande."
              : "Aucune commande dans cette catégorie."
          }
          action={{ label: "Explorer le catalogue", href: "/explorer" }}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const type = order.type as OrderType;
            const statusKey =
              order.status === "COMPLETED" || order.progress >= 100 ? "COMPLETED" : order.status;
            const status = statusConfig[statusKey] ?? { label: order.status, variant: "slate" };
            const TypeIcon = typeIconMap[type] ?? ShoppingBag;
            const date = new Date(order.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4 p-4 md:p-5">
                  <div
                    className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                    style={{ background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)" }}
                  >
                    <TypeIcon className="w-6 h-6" strokeWidth={2.2} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-500 font-medium mb-1 tabular-nums">
                          #{order.id.slice(0, 12).toUpperCase()}
                        </p>
                        <h3 className="font-bold text-[#0b2540] text-sm leading-snug line-clamp-2 mb-2">
                          {order.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <KazaBadge variant={typeBadgeVariant[type] ?? "slate"} size="sm">
                            {typeLabels[type] ?? type}
                          </KazaBadge>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {date}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap">
                        <div className="text-right">
                          <p className="font-extrabold text-[#0b2540] text-sm whitespace-nowrap tabular-nums">
                            {formatFcfa(order.amount)}
                          </p>
                          <p className="text-[10px] text-slate-500">≈ {toEur(order.amount)} €</p>
                        </div>
                        <KazaBadge variant={status.variant} size="sm">
                          {status.label}
                        </KazaBadge>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <KazaButton
                        variant="ghost"
                        size="sm"
                        href={`/apprenant/commandes/${order.id}`}
                        icon={Receipt}
                      >
                        Voir détails
                      </KazaButton>
                      {type === "formation" && (
                        <KazaButton
                          variant="primary"
                          size="sm"
                          href={`/apprenant/formation/${order.id}`}
                          icon={Play}
                        >
                          Accéder
                        </KazaButton>
                      )}
                      {order.instructeurUserId && (
                        <KazaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContact(order.instructeurUserId!, order.id)}
                          disabled={contactingId === order.id}
                          icon={contactingId === order.id ? Loader2 : MessageSquare}
                        >
                          Contacter l&apos;instructeur
                        </KazaButton>
                      )}
                      {type === "formation" &&
                        !order.refundedAt &&
                        !order.refundRequested &&
                        order.status !== "CANCELLED" && (
                          <KazaButton
                            variant="danger"
                            size="sm"
                            onClick={() => openRefund(order)}
                            icon={HandCoins}
                          >
                            Remboursement
                          </KazaButton>
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
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <HandCoins className="w-5 h-5 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#0b2540] text-base truncate">
                    Demande de remboursement
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{refundOrder.title}</p>
                </div>
              </div>
              <button
                onClick={closeRefund}
                className="p-1 rounded-lg hover:bg-slate-100 flex-shrink-0"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!refundEligibility && !refundError && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification de l&apos;éligibilité…
                </div>
              )}

              {refundEligibility && !refundSuccess && (
                <div
                  className={`p-3 rounded-xl border ${
                    refundEligibility.eligible
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {refundEligibility.eligible ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CircleAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 text-xs">
                      {refundEligibility.eligible ? (
                        <>
                          <p className="font-bold text-emerald-700 mb-1">Demande recevable</p>
                          <p className="text-slate-700">
                            Achat il y a {refundEligibility.details.daysSincePurchase ?? 0} jour
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

              {refundEligibility?.eligible && !refundSuccess && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#0b2540] mb-1.5 uppercase tracking-wider">
                      Motif <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows={4}
                      placeholder="Expliquez pourquoi vous souhaitez être remboursé (au moins 10 caractères)…"
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 resize-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {refundReason.length} / 10 caractères minimum
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Conformément à notre politique : {refundEligibility.config.windowDays} jours
                    après l&apos;achat, contenu consommé ≤ {refundEligibility.config.maxConsumedPct}%,
                    max {refundEligibility.config.maxRefundsPerBuyer30d} remboursement
                    {refundEligibility.config.maxRefundsPerBuyer30d > 1 ? "s" : ""}/30 jours.
                  </p>
                </>
              )}

              {refundError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{refundError}</span>
                </div>
              )}

              {refundSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                  <p className="font-bold mb-1">Demande envoyée</p>
                  <p>
                    Notre équipe l&apos;examinera sous 48h. Vous recevrez un email dès la décision
                    prise.
                  </p>
                </div>
              )}
            </div>

            {!refundSuccess && (
              <div className="p-5 border-t border-slate-100 flex items-center gap-3">
                <KazaButton variant="ghost" onClick={closeRefund} className="flex-1">
                  Annuler
                </KazaButton>
                {refundEligibility?.eligible && (
                  <KazaButton
                    variant="primary"
                    onClick={submitRefund}
                    disabled={refundLoading || refundReason.trim().length < 10}
                    icon={refundLoading ? Loader2 : undefined}
                    className="flex-1"
                  >
                    {refundLoading ? "Envoi…" : "Envoyer la demande"}
                  </KazaButton>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
