"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/toast";
import { ordersApi, reviewsApi, type ApiOrder } from "@/lib/api-client";
import { OrderPhasePipeline } from "@/components/ui/order-phase-pipeline";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CountdownTimer } from "@/components/ui/countdown-timer";

// ---------------------------------------------------------------------------
// Status badge mapping
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-slate-500/20 text-slate-400" },
  en_cours: { label: "En cours", cls: "bg-blue-500/20 text-blue-400" },
  livre: { label: "Livré", cls: "bg-primary/20 text-primary" },
  revision: { label: "Révision", cls: "bg-orange-500/20 text-orange-400" },
  termine: { label: "Terminé", cls: "bg-emerald-500/20 text-emerald-400" },
  litige: { label: "Litige", cls: "bg-red-500/20 text-red-400" },
  annule: { label: "Annulé", cls: "bg-red-500/20 text-red-400" },
};

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-border-dark rounded" />
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 h-28" />
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 h-40" />
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 h-60" />
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 h-48" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClientOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);
  const { orders, syncOrders, validateDelivery, requestRevision, openDispute, loading } =
    useClientStore();

  const [localOrder, setLocalOrder] = useState<ApiOrder | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Modal states
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");

  // Action loading
  const [actionLoading, setActionLoading] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);

  // Review
  const [reviewQualite, setReviewQualite] = useState(5);
  const [reviewCommunication, setReviewCommunication] = useState(5);
  const [reviewDelai, setReviewDelai] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  // Sync orders on mount if needed
  useEffect(() => {
    if (orders.length === 0) {
      syncOrders();
    }
  }, [orders.length, syncOrders]);

  // Try to find the order from the store, otherwise fetch directly
  const storeOrder = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  useEffect(() => {
    if (!storeOrder && !fetchLoading && !localOrder) {
      setFetchLoading(true);
      ordersApi
        .get(id)
        .then((order) => setLocalOrder(order))
        .catch(() => {
          /* order not found */
        })
        .finally(() => setFetchLoading(false));
    }
  }, [storeOrder, id, fetchLoading, localOrder]);

  const order = storeOrder || localOrder;
  const isLoading = (loading.orders && orders.length === 0) || fetchLoading;

  // Check existing review
  useEffect(() => {
    if (order?.status === "termine") {
      reviewsApi.getByOrder(id).then((data) => {
        if ((data.reviews ?? []).length > 0) setHasExistingReview(true);
      }).catch(() => {});
    }
  }, [order?.status, id]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-slate-600 block mb-3">error</span>
        <p className="text-slate-400 font-semibold text-lg">Commande introuvable</p>
        <p className="text-slate-600 text-sm mt-1">
          Cette commande n&apos;existe pas ou a ete supprimee.
        </p>
        <Link
          href="/client/commandes"
          className="inline-flex items-center gap-2 mt-4 text-primary text-sm font-bold hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.en_cours;

  // Actions
  async function handleValidateDelivery() {
    setActionLoading(true);
    const result = await validateDelivery(id);
    setActionLoading(false);
    setShowValidateModal(false);
    if (result.success) {
      addToast("success", "Livraison validee ! Les fonds ont ete liberes.");
    } else {
      addToast("error", result.error || "Erreur lors de la validation");
    }
  }

  async function handleRequestRevision() {
    if (!revisionComment.trim()) {
      addToast("error", "Veuillez decrire les modifications souhaitees");
      return;
    }
    setActionLoading(true);
    const result = await requestRevision(id, revisionComment);
    setActionLoading(false);
    if (result.success) {
      addToast("success", "Demande de revision envoyee");
      setShowRevisionModal(false);
      setRevisionComment("");
    } else {
      addToast("error", result.error || "Erreur lors de la demande de revision");
    }
  }

  async function handleOpenDispute() {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      addToast("error", "Veuillez remplir tous les champs");
      return;
    }
    setActionLoading(true);
    const result = await openDispute(id, {
      reason: disputeReason,
      description: disputeDescription,
    });
    setActionLoading(false);
    if (result.success) {
      addToast("success", "Litige ouvert. Notre equipe va examiner le cas.");
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputeDescription("");
    } else {
      addToast("error", result.error || "Erreur lors de l'ouverture du litige");
    }
  }

  async function handleSubmitReview() {
    setReviewSubmitting(true);
    try {
      await reviewsApi.create({
        orderId: id,
        qualite: reviewQualite,
        communication: reviewCommunication,
        delai: reviewDelai,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
      addToast("success", "Avis publie avec succes !");
    } catch {
      addToast("error", "Erreur lors de la publication de l'avis");
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={showValidateModal}
        title="Valider la livraison"
        message="Vous confirmez que le travail est conforme a vos attentes. Les fonds seront liberes au freelance. Cette action est irreversible."
        confirmLabel="Valider et liberer les fonds"
        onConfirm={handleValidateDelivery}
        onCancel={() => setShowValidateModal(false)}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/client/commandes" className="text-primary hover:underline">
          Commandes
        </Link>
        <span className="text-slate-500">/</span>
        <span className="text-slate-400">#{order.id.slice(-4)}</span>
      </div>

      {/* Header card */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", statusInfo.cls)}>
                {statusInfo.label}
              </span>
              <span className="text-xs bg-border-dark text-slate-400 px-2.5 py-1 rounded-full">
                {order.category}
              </span>
              <span className="text-xs bg-border-dark text-slate-400 px-2.5 py-1 rounded-full">
                {order.packageType}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">{order.serviceTitle}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Commande #{order.id.slice(-4)} -- Client: {order.clientName}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-black text-primary">
              {(order.amount ?? 0).toLocaleString("fr-FR")} EUR
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Deadline: {new Date(order.deadline).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ETAPES D'ACTION CLIENT — Ligne de progression + boutons      */}
      {/* TOUJOURS VISIBLE                                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="bg-neutral-dark border-2 border-primary/20 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-primary">timeline</span>
          Suivi de la commande
        </h3>

        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {/* Step 1: Commande passee */}
          <div className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-emerald-500 border-emerald-500 text-white">
                <span className="material-symbols-outlined text-lg">check</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 text-center whitespace-nowrap">Commandee</span>
            </div>
            <div className="w-8 h-0.5 mx-1 bg-emerald-500" />
          </div>

          {/* Step 2: Acceptation freelance */}
          {(() => {
            const done = ["en_cours", "livre", "revision", "termine"].includes(order.status);
            const active = order.status === "en_attente";
            return (
              <div className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    done ? "bg-emerald-500 border-emerald-500 text-white" :
                    active ? "bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse" :
                    "bg-slate-800 border-slate-600 text-slate-500"
                  )}>
                    <span className="material-symbols-outlined text-lg">{done ? "check" : "hourglass_top"}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold text-center whitespace-nowrap", active ? "text-amber-400" : done ? "text-emerald-400" : "text-slate-500")}>
                    {active ? "En attente" : "Acceptee"}
                  </span>
                  {active && <span className="text-[9px] text-amber-400/70 font-semibold">3j max</span>}
                </div>
                <div className={cn("w-8 h-0.5 mx-1", done ? "bg-emerald-500" : "bg-slate-700")} />
              </div>
            );
          })()}

          {/* Step 3: Travail en cours */}
          {(() => {
            const done = ["livre", "termine"].includes(order.status);
            const active = order.status === "en_cours" || order.status === "revision";
            return (
              <div className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    done ? "bg-emerald-500 border-emerald-500 text-white" :
                    active ? "bg-blue-500 border-blue-500 text-white" :
                    "bg-slate-800 border-slate-600 text-slate-500"
                  )}>
                    <span className="material-symbols-outlined text-lg">{done ? "check" : "construction"}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold text-center whitespace-nowrap", active ? "text-blue-400" : done ? "text-emerald-400" : "text-slate-500")}>
                    {active ? "En cours" : done ? "Travaille" : "Travail"}
                  </span>
                </div>
                <div className={cn("w-8 h-0.5 mx-1", done ? "bg-emerald-500" : "bg-slate-700")} />
              </div>
            );
          })()}

          {/* Step 4: Livre */}
          {(() => {
            const done = order.status === "termine";
            const active = order.status === "livre";
            return (
              <div className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    done ? "bg-emerald-500 border-emerald-500 text-white" :
                    active ? "bg-primary border-primary text-white animate-pulse" :
                    "bg-slate-800 border-slate-600 text-slate-500"
                  )}>
                    <span className="material-symbols-outlined text-lg">{done ? "check" : "local_shipping"}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold text-center whitespace-nowrap", active ? "text-primary" : done ? "text-emerald-400" : "text-slate-500")}>Livre</span>
                  {active && (
                    <div className="flex gap-1.5 mt-1">
                      <button onClick={() => setShowValidateModal(true)} disabled={actionLoading}
                        className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1">
                        {actionLoading ? <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-xs">check_circle</span>}
                        Valider
                      </button>
                      <button onClick={() => setShowRevisionModal(true)} disabled={actionLoading}
                        className="px-3 py-1.5 border border-orange-500/30 text-orange-400 text-[10px] font-bold rounded-lg hover:bg-orange-500/10 disabled:opacity-50 transition-all flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">edit_note</span>
                        Revision
                      </button>
                    </div>
                  )}
                </div>
                <div className={cn("w-8 h-0.5 mx-1", done ? "bg-emerald-500" : "bg-slate-700")} />
              </div>
            );
          })()}

          {/* Step 5: Termine */}
          {(() => {
            const done = order.status === "termine";
            return (
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  done ? "bg-emerald-500 border-emerald-500 text-white" :
                  "bg-slate-800 border-slate-600 text-slate-500"
                )}>
                  <span className="material-symbols-outlined text-lg">{done ? "celebration" : "flag"}</span>
                </div>
                <span className={cn("text-[10px] font-bold text-center whitespace-nowrap", done ? "text-emerald-400" : "text-slate-500")}>Termine</span>
                {done && <span className="text-[9px] text-emerald-400 font-semibold">Fonds liberes</span>}
              </div>
            );
          })()}
        </div>

        {order.status === "annule" && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg text-red-400 text-sm font-bold">
            <span className="material-symbols-outlined">cancel</span>
            Commande annulee
          </div>
        )}
      </div>

      {/* Countdown Timers */}
      {order.status === "en_attente" && (
        <CountdownTimer
          deadline={order.deadline}
          totalDurationMs={3 * 24 * 60 * 60 * 1000}
          label="Attente de validation freelance"
          description="Le freelance a 3 jours pour accepter votre commande. Passe ce delai, la commande sera automatiquement annulee et vous serez rembourse."
          expiredText="Delai depasse — annulation automatique en cours"
          variant="amber"
        />
      )}

      {order.status === "livre" && (
        <CountdownTimer
          deadline={new Date(new Date(order.deliveredAt || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()}
          totalDurationMs={7 * 24 * 60 * 60 * 1000}
          label="Delai pour valider la livraison"
          description="Vous avez 7 jours pour valider la livraison ou demander une revision. Passe ce delai, la commande sera automatiquement validee et les fonds liberes au freelance."
          expiredText="Delai depasse — validation automatique en cours, les fonds vont etre liberes"
          variant="blue"
        />
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: pipeline, timeline, files, actions */}
        <div className="xl:col-span-2 space-y-6">
          {/* Phase pipeline */}
          <OrderPhasePipeline
            status={order.status}
            revisionsLeft={order.revisionsLeft}
            timeline={order.timeline}
          />

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Historique
              </h3>
              <div className="space-y-3">
                {order.timeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-sm text-primary">
                        {event.type === "created"
                          ? "receipt_long"
                          : event.type === "started"
                            ? "construction"
                            : event.type === "delivered"
                              ? "local_shipping"
                              : event.type === "completed"
                                ? "check_circle"
                                : event.type === "revision"
                                  ? "replay"
                                  : "info"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{event.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {new Date(event.timestamp).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files / Deliverables */}
          {order.files && order.files.length > 0 && (
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder</span>
                Fichiers & Livrables
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold ml-1">
                  {order.files.length}
                </span>
              </h3>
              <div className="space-y-2">
                {order.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-background-dark rounded-lg border border-border-dark"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary">
                        {file.type.includes("image")
                          ? "image"
                          : file.type.includes("pdf")
                            ? "picture_as_pdf"
                            : "description"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {file.size} -- {file.uploadedBy === "freelance" ? "Freelance" : "Client"} --{" "}
                        {new Date(file.uploadedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <a
                      href={file.url}
                      download
                      className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Télécharger
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons based on status */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">touch_app</span>
              Actions
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              {order.status === "livre" && (
                <>
                  <button
                    onClick={() => setShowValidateModal(true)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    {actionLoading ? "Validation..." : "Valider la livraison"}
                  </button>
                  <button
                    onClick={() => setShowRevisionModal(true)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500/10 text-orange-400 text-sm font-bold rounded-xl hover:bg-orange-500/20 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">replay</span>
                    Demander une revision
                  </button>
                </>
              )}
              {(order.status === "en_cours" || order.status === "livre") && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">gavel</span>
                  Ouvrir un litige
                </button>
              )}
              {order.status === "termine" && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <span className="material-symbols-outlined">celebration</span>
                  Commande terminee et validee
                </div>
              )}
              {order.status === "litige" && (
                <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                  <span className="material-symbols-outlined">gavel</span>
                  Litige en cours d&apos;examen
                </div>
              )}
              {order.status === "revision" && (
                <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold">
                  <span className="material-symbols-outlined">replay</span>
                  Révision en cours -- {order.revisionsLeft} révision(s) restante(s)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: review + info */}
        <div className="space-y-6">
          {/* Review section — after order is completed */}
          {order.status === "termine" && !hasExistingReview && !reviewSubmitted && (
            <div className="bg-neutral-dark rounded-xl border border-primary/30 p-6 space-y-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rate_review</span>
                Laisser un avis
              </h3>
              <p className="text-sm text-slate-400">Evaluez cette prestation sur 3 criteres.</p>
              <div className="space-y-4">
                {[
                  { label: "Qualite", value: reviewQualite, setter: setReviewQualite, icon: "workspace_premium" },
                  { label: "Communication", value: reviewCommunication, setter: setReviewCommunication, icon: "forum" },
                  { label: "Delai", value: reviewDelai, setter: setReviewDelai, icon: "schedule" },
                ].map(({ label, value, setter, icon }) => (
                  <div key={label} className="bg-primary/5 rounded-xl border border-primary/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                      <span className="text-sm font-bold">{label}</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setter(star)} className="transition-transform hover:scale-110">
                          <span className={cn("material-symbols-outlined text-2xl", star <= value ? "text-amber-400" : "text-slate-600")}
                            style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Partagez votre experience..." rows={3}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-slate-500" />
              <button onClick={handleSubmitReview} disabled={reviewSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all">
                {reviewSubmitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">send</span>}
                {reviewSubmitting ? "Publication..." : "Publier l'avis"}
              </button>
            </div>
          )}

          {(reviewSubmitted || hasExistingReview) && order.status === "termine" && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex items-center gap-4">
              <span className="material-symbols-outlined text-emerald-400 text-3xl">check_circle</span>
              <div>
                <p className="font-bold text-emerald-400">Avis publie</p>
                <p className="text-sm text-slate-400">Merci pour votre evaluation !</p>
              </div>
            </div>
          )}

          {/* Freelance info */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">person</span>
              Freelance
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                {(order.freelanceName || "FL").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{order.freelanceName || "Freelance"}</p>
                <Link href="/client/messages" className="text-xs text-primary hover:underline">Envoyer un message</Link>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">info</span>
              Resume
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Montant</span><span className="font-bold">{(order.amount ?? 0).toLocaleString("fr-FR")} EUR</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Forfait</span><span className="capitalize">{order.packageType}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Progression</span><span className="text-primary font-bold">{order.progress}%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Revisions</span><span>{order.revisionsLeft} restante(s)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Deadline</span><span>{new Date(order.deadline).toLocaleDateString("fr-FR")}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-400">replay</span>
                Demander une revision
              </h3>
              <button
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Décrivez les modifications que vous souhaitez.
              {order.revisionsLeft != null && (
                <span className="text-orange-400 font-semibold ml-1">
                  ({order.revisionsLeft} revision(s) restante(s))
                </span>
              )}
            </p>
            <textarea
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              rows={5}
              placeholder="Décrivez précisément les modifications souhaitées..."
              className="w-full px-4 py-3 rounded-xl border border-border-dark bg-background-dark text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={actionLoading || !revisionComment.trim()}
                className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">
                      progress_activity
                    </span>
                    Envoi...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">replay</span>
                    Envoyer la demande
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400">gavel</span>
                Ouvrir un litige
              </h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Un litige gèlera les fonds en escrow jusqu&apos;à résolution par notre équipe.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Motif du litige
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border-dark bg-background-dark text-sm text-white outline-none focus:border-primary/50"
                >
                  <option value="">Sélectionnez un motif</option>
                  <option value="qualite">Qualite non conforme</option>
                  <option value="delai">Non-respect des delais</option>
                  <option value="communication">Absence de communication</option>
                  <option value="incomplet">Livraison incomplete</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Description detaillee
                </label>
                <textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  rows={4}
                  placeholder="Décrivez le problème rencontré en détail..."
                  className="w-full px-4 py-3 rounded-xl border border-border-dark bg-background-dark text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleOpenDispute}
                disabled={actionLoading || !disputeReason || !disputeDescription.trim()}
                className="px-5 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">
                      progress_activity
                    </span>
                    Envoi...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">gavel</span>
                    Confirmer le litige
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
