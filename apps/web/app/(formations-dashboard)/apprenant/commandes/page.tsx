// Refonte design "Stitch" — apprenant commandes — vert Novakou — 2026-06-13
"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { StCard, StPageHeader, StButton, StChip, StStatusPill, StTabs, ST } from "@/components/stitch";
import {
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
  ShoppingBag,
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

const typeBadgeTone: Record<OrderType, "blue" | "amber" | "green"> = {
  formation: "blue",
  product: "amber",
  mentor: "green",
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
  { label: string; tone: "green" | "blue" | "amber" | "rose" | "neutral" }
> = {
  COMPLETED: { label: "Terminé", tone: "green" },
  ACTIVE: { label: "En cours", tone: "blue" },
  PENDING: { label: "En attente", tone: "amber" },
  CONFIRMED: { label: "Confirmé", tone: "blue" },
  CANCELLED: { label: "Annulé", tone: "rose" },
  REFUND_PENDING: { label: "Remboursement demandé", tone: "amber" },
  REFUNDED: { label: "Remboursé", tone: "rose" },
};

function SkeletonRow() {
  return (
    <div className="rounded-[18px] bg-white animate-pulse" style={{ border: `1px solid ${ST.cardBorder}` }}>
      <div className="flex items-start gap-4 p-4 md:p-5">
        <div className="w-16 h-16 rounded-xl flex-shrink-0" style={{ background: "#f3f6f4" }} />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 rounded w-3/4" style={{ background: "#f3f6f4" }} />
          <div className="h-3 rounded w-1/2" style={{ background: "#f3f6f4" }} />
          <div className="h-3 rounded w-2/3" style={{ background: "#f3f6f4" }} />
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

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes commandes"
          subtitle={
            isLoading
              ? "Chargement…"
              : `${orders.length} commande${orders.length > 1 ? "s" : ""} au total`
          }
          actions={
            <>
              <StButton variant="secondary" href="/apprenant/dashboard" icon={Receipt}>
                Tableau de bord
              </StButton>
              <StButton href="/explorer" icon={Search}>
                Explorer le catalogue
              </StButton>
            </>
          }
        />

        {/* Filter tabs */}
        <div className="mb-4">
          <StTabs
            tabs={[
              { key: "all", label: "Tout" },
              { key: "formation", label: "Formations" },
              { key: "product", label: "Produits" },
              { key: "mentor", label: "Mentors" },
            ]}
            active={activeFilter}
            onChange={(k) => setActiveFilter(k as FilterValue)}
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <Receipt size={32} style={{ color: ST.green }} strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucune commande</h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              {activeFilter === "all"
                ? "Vous n'avez pas encore effectué de commande."
                : "Aucune commande dans cette catégorie."}
            </p>
            <StButton href="/explorer" icon={Search}>Explorer le catalogue</StButton>
          </StCard>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const type = order.type as OrderType;
              const statusKey =
                order.status === "COMPLETED" || order.progress >= 100 ? "COMPLETED" : order.status;
              const status = statusConfig[statusKey] ?? { label: order.status, tone: "neutral" as const };
              const TypeIcon = typeIconMap[type] ?? ShoppingBag;
              const date = new Date(order.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <StCard key={order.id} noPadding className="hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start gap-4 p-4 md:p-5">
                    <div
                      className="w-14 h-14 md:w-16 md:h-16 rounded-[13px] flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: ST.gradient }}
                    >
                      <TypeIcon className="w-6 h-6" strokeWidth={2.2} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold mb-1 tabular-nums" style={{ color: ST.textMuted }}>
                            #{order.id.slice(0, 12).toUpperCase()}
                          </p>
                          <h3 className="font-extrabold text-[13.5px] leading-snug line-clamp-2 mb-2" style={{ color: ST.text }}>
                            {order.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold" style={{ color: ST.textSecondary }}>
                            <StChip tone={typeBadgeTone[type] ?? "neutral"}>{typeLabels[type] ?? type}</StChip>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {date}
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap">
                          <div className="text-right">
                            <p className="font-extrabold text-[13.5px] whitespace-nowrap tabular-nums" style={{ color: ST.text }}>
                              {formatFcfa(order.amount)}
                            </p>
                          </div>
                          <StStatusPill status={statusKey} label={status.label} />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <StButton variant="secondary" size="sm" href={`/apprenant/commandes/${order.id}`} icon={Receipt}>
                          Voir détails
                        </StButton>
                        {type === "formation" && (
                          <StButton size="sm" href={`/apprenant/formation/${order.id}`} icon={Play}>
                            Accéder
                          </StButton>
                        )}
                        {order.instructeurUserId && (
                          <StButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleContact(order.instructeurUserId!, order.id)}
                            disabled={contactingId === order.id}
                            icon={contactingId === order.id ? Loader2 : MessageSquare}
                          >
                            Contacter l&apos;instructeur
                          </StButton>
                        )}
                        {type === "formation" &&
                          !order.refundedAt &&
                          !order.refundRequested &&
                          order.status !== "CANCELLED" && (
                            <button
                              type="button"
                              onClick={() => openRefund(order)}
                              className="inline-flex items-center justify-center gap-2 font-extrabold transition-all whitespace-nowrap px-3 py-2 text-[12px] rounded-[10px] hover:opacity-90"
                              style={{ background: ST.roseSoft, color: ST.roseText }}
                            >
                              <HandCoins size={14} />
                              Remboursement
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </StCard>
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
              className="bg-white rounded-[20px] shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 flex items-start justify-between gap-4" style={{ borderBottom: `1px solid ${ST.divider}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: ST.roseSoft }}>
                    <HandCoins className="w-5 h-5" style={{ color: ST.roseText }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[15px] truncate" style={{ color: ST.text }}>
                      Demande de remboursement
                    </h3>
                    <p className="text-[12px] font-semibold truncate" style={{ color: ST.textSecondary }}>{refundOrder.title}</p>
                  </div>
                </div>
                <button
                  onClick={closeRefund}
                  className="p-1 rounded-lg hover:bg-[#f1f5f3] flex-shrink-0"
                >
                  <X className="w-5 h-5" style={{ color: ST.textSecondary }} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {!refundEligibility && !refundError && (
                  <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: ST.textSecondary }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification de l&apos;éligibilité…
                  </div>
                )}

                {refundEligibility && !refundSuccess && (
                  <div
                    className="p-3 rounded-[12px]"
                    style={
                      refundEligibility.eligible
                        ? { background: ST.greenSoft, border: "1px solid #d7ecde" }
                        : { background: ST.amberSoft, border: "1px solid #f3e2bd" }
                    }
                  >
                    <div className="flex items-start gap-2">
                      {refundEligibility.eligible ? (
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: ST.green }} />
                      ) : (
                        <CircleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: ST.amberText }} />
                      )}
                      <div className="flex-1 text-[12px]">
                        {refundEligibility.eligible ? (
                          <>
                            <p className="font-extrabold mb-1" style={{ color: ST.green }}>Demande recevable</p>
                            <p style={{ color: ST.textLabel }}>
                              Achat il y a {refundEligibility.details.daysSincePurchase ?? 0} jour
                              {(refundEligibility.details.daysSincePurchase ?? 0) > 1 ? "s" : ""} ·
                              Contenu consommé : {refundEligibility.details.consumedPct ?? 0}%
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-extrabold mb-1" style={{ color: ST.amberText }}>Demande non recevable</p>
                            <p style={{ color: ST.amberText }}>{refundEligibility.reason}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {refundEligibility?.eligible && !refundSuccess && (
                  <>
                    <div>
                      <label className="block text-[12px] font-extrabold mb-1.5 uppercase tracking-wider" style={{ color: ST.textLabel }}>
                        Motif <span style={{ color: ST.roseText }}>*</span>
                      </label>
                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        rows={4}
                        placeholder="Expliquez pourquoi vous souhaitez être remboursé (au moins 10 caractères)…"
                        className="w-full px-3 py-2.5 rounded-[12px] text-[13.5px] focus:outline-none resize-none"
                        style={{ border: "1px solid #dde6e0", color: "#33453b" }}
                      />
                      <p className="text-[10px] font-semibold mt-1" style={{ color: ST.textMuted }}>
                        {refundReason.length} / 10 caractères minimum
                      </p>
                    </div>
                    <p className="text-[11px] font-semibold leading-relaxed" style={{ color: ST.textSecondary }}>
                      Conformément à notre politique : {refundEligibility.config.windowDays} jours
                      après l&apos;achat, contenu consommé ≤ {refundEligibility.config.maxConsumedPct}%,
                      max {refundEligibility.config.maxRefundsPerBuyer30d} remboursement
                      {refundEligibility.config.maxRefundsPerBuyer30d > 1 ? "s" : ""}/30 jours.
                    </p>
                  </>
                )}

                {refundError && (
                  <div className="p-3 rounded-[12px] text-[12px] flex items-start gap-2" style={{ background: ST.roseSoft, border: "1px solid #f3cdd8", color: ST.roseText }}>
                    <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{refundError}</span>
                  </div>
                )}

                {refundSuccess && (
                  <div className="p-3 rounded-[12px] text-[12px]" style={{ background: ST.greenSoft, border: "1px solid #d7ecde", color: ST.green }}>
                    <p className="font-extrabold mb-1">Demande envoyée</p>
                    <p>
                      Notre équipe l&apos;examinera sous 48h. Vous recevrez un email dès la décision
                      prise.
                    </p>
                  </div>
                )}
              </div>

              {!refundSuccess && (
                <div className="p-5 flex items-center gap-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                  <StButton variant="secondary" onClick={closeRefund} className="flex-1">
                    Annuler
                  </StButton>
                  {refundEligibility?.eligible && (
                    <StButton
                      onClick={submitRefund}
                      disabled={refundLoading || refundReason.trim().length < 10}
                      icon={refundLoading ? Loader2 : undefined}
                      className="flex-1"
                    >
                      {refundLoading ? "Envoi…" : "Envoyer la demande"}
                    </StButton>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
