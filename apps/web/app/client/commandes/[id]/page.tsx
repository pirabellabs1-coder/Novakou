"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/toast";
import { ordersApi, type ApiOrder } from "@/lib/api-client";
import { OrderPhasePipeline } from "@/components/ui/order-phase-pipeline";

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

  // Chat
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [order?.messages?.length]);

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
    const ok = await validateDelivery(id);
    setActionLoading(false);
    if (ok) {
      addToast("success", "Livraison validee ! Les fonds ont ete liberes.");
      syncOrders();
    } else {
      addToast("error", "Erreur lors de la validation");
    }
  }

  async function handleRequestRevision() {
    if (!revisionComment.trim()) {
      addToast("error", "Veuillez decrire les modifications souhaitees");
      return;
    }
    setActionLoading(true);
    const ok = await requestRevision(id, revisionComment);
    setActionLoading(false);
    if (ok) {
      addToast("success", "Demande de revision envoyee");
      setShowRevisionModal(false);
      setRevisionComment("");
      syncOrders();
    } else {
      addToast("error", "Erreur lors de la demande de revision");
    }
  }

  async function handleOpenDispute() {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      addToast("error", "Veuillez remplir tous les champs");
      return;
    }
    setActionLoading(true);
    const ok = await openDispute(id, {
      reason: disputeReason,
      description: disputeDescription,
    });
    setActionLoading(false);
    if (ok) {
      addToast("success", "Litige ouvert. Notre équipe va examiner le cas.");
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputeDescription("");
      syncOrders();
    } else {
      addToast("error", "Erreur lors de l'ouverture du litige");
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const updatedOrder = await ordersApi.sendMessage(id, {
        content: newMessage,
        type: "text",
      });
      setLocalOrder(updatedOrder);
      setNewMessage("");
    } catch {
      addToast("error", "Erreur lors de l'envoi du message");
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <div className="space-y-6">
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
              {order.amount.toLocaleString("fr-FR")} EUR
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Deadline: {new Date(order.deadline).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

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
                    onClick={handleValidateDelivery}
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

        {/* Right column: chat */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark flex flex-col h-[700px]">
          <div className="p-4 border-b border-border-dark flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
              {order.clientName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{order.clientName}</p>
              <p className="text-xs text-slate-400">Commande #{order.id.slice(-4)}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {order.messages && order.messages.length > 0 ? (
              order.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.sender === "client" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-2.5 text-sm leading-relaxed",
                      m.sender === "client"
                        ? "bg-primary text-background-dark rounded-2xl rounded-tr-none"
                        : "bg-background-dark text-slate-200 rounded-2xl rounded-tl-none border border-border-dark",
                    )}
                  >
                    {m.type === "file" ? (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">attach_file</span>
                        <span className="font-medium">{m.fileName || "Fichier"}</span>
                        {m.fileSize && (
                          <span className="text-xs opacity-60">({m.fileSize})</span>
                        )}
                      </div>
                    ) : m.type === "system" ? (
                      <p className="italic opacity-70">{m.content}</p>
                    ) : (
                      <p>{m.content}</p>
                    )}
                    <p
                      className={cn(
                        "text-[10px] mt-1 text-right",
                        m.sender === "client" ? "text-background-dark/60" : "text-slate-500",
                      )}
                    >
                      {m.senderName} --{" "}
                      {new Date(m.timestamp).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-3xl text-slate-600 block mb-2">
                  chat
                </span>
                <p className="text-slate-500 text-sm">Aucun message pour le moment</p>
                <p className="text-slate-600 text-xs mt-1">
                  Envoyez un message pour demarrer la conversation
                </p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-border-dark flex items-center gap-2">
            <button className="text-slate-500 hover:text-primary">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Votre message..."
              disabled={sendingMessage}
              className="flex-1 px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !newMessage.trim()}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-background-dark hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined text-lg">
                {sendingMessage ? "progress_activity" : "send"}
              </span>
            </button>
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
