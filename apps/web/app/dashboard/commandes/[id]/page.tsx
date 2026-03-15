"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { OrderPhasePipeline } from "@/components/ui/order-phase-pipeline";
import { reviewsApi } from "@/lib/api-client";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  en_attente: { label: "En attente", color: "bg-amber-500/10 text-amber-400", icon: "schedule" },
  en_cours: { label: "En cours", color: "bg-blue-500/10 text-blue-400", icon: "play_circle" },
  livre: { label: "Livré", color: "bg-emerald-500/10 text-emerald-400", icon: "local_shipping" },
  revision: { label: "Révision", color: "bg-orange-500/10 text-orange-400", icon: "edit_note" },
  termine: { label: "Terminé", color: "bg-emerald-500/10 text-emerald-400", icon: "check_circle" },
  annule: { label: "Annulé", color: "bg-red-500/10 text-red-400", icon: "cancel" },
};

const TIMELINE_ICONS: Record<string, { icon: string; color: string }> = {
  created: { icon: "add_circle", color: "text-blue-400" },
  started: { icon: "play_circle", color: "text-primary" },
  delivered: { icon: "local_shipping", color: "text-emerald-400" },
  revision: { icon: "edit_note", color: "text-orange-400" },
  completed: { icon: "check_circle", color: "text-emerald-400" },
  cancelled: { icon: "cancel", color: "text-red-400" },
  message: { icon: "chat_bubble", color: "text-slate-400" },
};


export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { orders, updateOrderStatus, addOrderMessage, addOrderFile, apiAcceptOrder, apiDeliverOrder, apiSendOrderMessage } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);
  const [activeTab, setActiveTab] = useState<"chat" | "fichiers">("chat");
  const [message, setMessage] = useState("");
  const [delivering, setDelivering] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review state (for client after completion)
  const [reviewQualite, setReviewQualite] = useState(5);
  const [reviewCommunication, setReviewCommunication] = useState(5);
  const [reviewDelai, setReviewDelai] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  // Check for existing review when order is completed
  useEffect(() => {
    if (order?.status === "termine") {
      reviewsApi.getByOrder(orderId).then((data) => {
        if (data.reviews.length > 0) {
          setHasExistingReview(true);
        }
      }).catch(() => {});
    }
  }, [order?.status, orderId]);

  async function handleSubmitReview() {
    if (!order) return;
    setReviewSubmitting(true);
    try {
      await reviewsApi.create({
        orderId: order.id,
        qualite: reviewQualite,
        communication: reviewCommunication,
        delai: reviewDelai,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
      addToast("success", "Avis publie avec succes !");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Erreur lors de la publication de l'avis");
    } finally {
      setReviewSubmitting(false);
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [order?.messages]);

  if (!order) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-4xl text-slate-600 mb-4">error</span>
        <p className="text-slate-400 mb-4">Commande introuvable</p>
        <Link href="/dashboard/commandes" className="text-primary font-bold hover:underline">Retour aux commandes</Link>
      </div>
    );
  }

  const sc = STATUS_CONFIG[order.status];
  const daysLeft = Math.ceil((new Date(order.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  async function handleSendMessage() {
    if (!message.trim() || !order) return;
    const content = message.trim();
    setMessage("");
    const success = await apiSendOrderMessage(order.id, content);
    if (!success) {
      // Fallback to local store if API fails
      addOrderMessage(order.id, {
        sender: "freelance",
        senderName: "Vous",
        content,
        timestamp: new Date().toISOString(),
        type: "text",
      });
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || !order) return;
    for (const f of Array.from(files)) {
      const fileSize = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
      addOrderFile(order.id, {
        name: f.name,
        size: fileSize,
        type: f.name.split(".").pop() || "file",
        uploadedBy: "freelance",
        uploadedAt: new Date().toISOString(),
        url: "#",
      });
      // Send file message via API, fallback to local
      const success = await apiSendOrderMessage(order.id, `Fichier envoye : ${f.name}`);
      if (!success) {
        addOrderMessage(order.id, {
          sender: "freelance",
          senderName: "Vous",
          content: `Fichier envoye : ${f.name}`,
          timestamp: new Date().toISOString(),
          type: "file",
          fileName: f.name,
          fileSize,
        });
      }
    }
    addToast("success", "Fichier(s) envoye(s)");
  }

  async function handleDeliver() {
    if (!order) return;
    setDelivering(true);
    const success = await apiDeliverOrder(order.id, "Livraison effectuee", order.files.filter((f) => f.uploadedBy === "freelance"));
    if (!success) {
      // Fallback to local store if API fails
      updateOrderStatus(order.id, "livre");
    }
    setDelivering(false);
    addToast("success", "Commande livree avec succes !");
  }

  async function handleStart() {
    if (!order) return;
    const success = await apiAcceptOrder(order.id);
    if (!success) {
      // Fallback to local store if API fails
      updateOrderStatus(order.id, "en_cours");
    }
    addToast("success", "Travail demarre !");
  }

  function handleCancel() {
    if (!order) return;
    updateOrderStatus(order.id, "annule");
    setCancelModal(false);
    addToast("info", "Commande annulee");
  }

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="max-w-full space-y-6">
      <ConfirmModal
        open={cancelModal}
        title="Annuler la commande"
        message="Etes-vous sur de vouloir annuler cette commande ? Les fonds seront rembourses au client."
        confirmLabel="Annuler la commande"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelModal(false)}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold">{order.serviceTitle}</h2>
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", sc?.color)}>
              <span className="material-symbols-outlined text-sm">{sc?.icon}</span>
              {sc?.label}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{order.id} · {order.clientName} · {order.category}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-4">
          <p className="text-xs text-slate-500 font-semibold">Montant</p>
          <p className="text-lg font-bold mt-1">€{order.amount.toLocaleString("fr-FR")}</p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-4">
          <p className="text-xs text-slate-500 font-semibold">Forfait</p>
          <p className="text-lg font-bold mt-1 capitalize">{order.packageType}</p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-4">
          <p className="text-xs text-slate-500 font-semibold">Deadline</p>
          <p className={cn("text-lg font-bold mt-1", daysLeft <= 2 ? "text-red-400" : "")}>
            {daysLeft > 0 ? `${daysLeft}j` : "Expire"}
          </p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-4">
          <p className="text-xs text-slate-500 font-semibold">Progression</p>
          <p className="text-lg font-bold mt-1 text-primary">{order.progress}%</p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-4">
          <p className="text-xs text-slate-500 font-semibold">Revisions</p>
          <p className="text-lg font-bold mt-1">{order.revisionsLeft} restantes</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-border-dark rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${order.progress}%` }} />
      </div>

      {/* ================================================================ */}
      {/* PIPELINE DE SUIVI — Phases fixes                                  */}
      {/* ================================================================ */}
      <OrderPhasePipeline
        status={order.status}
        revisionsLeft={order.revisionsLeft}
        timeline={order.timeline}
      />

      {/* ================================================================ */}
      {/* HISTORIQUE DÉTAILLÉ (événements)                                  */}
      {/* ================================================================ */}
      {order.timeline.length > 0 && (
        <details className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden group/details">
          <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">history</span>
              <h3 className="text-sm font-bold">Historique détaillé</h3>
              <span className="text-xs text-slate-500 bg-border-dark px-1.5 py-0.5 rounded">{order.timeline.length}</span>
            </div>
            <span className="material-symbols-outlined text-slate-500 transition-transform group-open/details:rotate-180">expand_more</span>
          </summary>
          <div className="px-5 pb-5 space-y-0">
            {order.timeline.map((event, i) => {
              const tc = TIMELINE_ICONS[event.type] ?? { icon: "circle", color: "text-slate-400" };
              const isLast = i === order.timeline.length - 1;
              return (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <span className={cn("material-symbols-outlined text-lg", tc.color)}>{tc.icon}</span>
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-border-dark my-1" />}
                  </div>
                  <div className={cn("pb-4", isLast && "pb-0")}>
                    <p className="font-bold text-sm text-slate-200">{event.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(event.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Buyer actions when order is delivered */}
      {order.status === "livre" && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">local_shipping</span>
            <p className="font-bold text-sm">La commande a été livrée</p>
          </div>
          <p className="text-sm text-slate-400">Vérifiez le travail livré et validez ou demandez une révision.</p>
          <div className="flex gap-3">
            <button
              onClick={() => { updateOrderStatus(order.id, "termine"); addToast("success", "Commande validée ! Les fonds seront libérés."); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-lg text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Valider la livraison
            </button>
            <button
              onClick={() => { updateOrderStatus(order.id, "revision"); addToast("info", "Révision demandée au freelance."); }}
              className="flex items-center gap-2 px-5 py-2.5 border border-orange-500/30 text-orange-400 font-bold rounded-lg text-sm hover:bg-orange-500/10"
            >
              <span className="material-symbols-outlined text-lg">edit_note</span>
              Demander une révision
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {order.status === "en_attente" && (
          <button onClick={handleStart} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg">play_arrow</span> Demarrer le travail
          </button>
        )}
        {order.status === "en_cours" && (
          <button onClick={handleDeliver} disabled={delivering}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-lg text-sm hover:bg-emerald-600 disabled:opacity-50 shadow-lg shadow-emerald-500/20">
            {delivering ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">local_shipping</span>}
            {delivering ? "Livraison..." : "Marquer comme livre"}
          </button>
        )}
        {["en_cours", "en_attente"].includes(order.status) && (
          <button onClick={() => setCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-400 font-semibold rounded-lg text-sm hover:bg-red-500/10">
            <span className="material-symbols-outlined text-lg">cancel</span> Annuler
          </button>
        )}
        <button onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 border border-border-dark text-slate-300 font-semibold rounded-lg text-sm hover:border-primary/50">
          <span className="material-symbols-outlined text-lg">attach_file</span> Joindre un fichier
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border-dark">
        {(["chat", "fichiers"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("pb-3 text-sm font-bold capitalize relative transition-colors",
              activeTab === tab ? "text-primary" : "text-slate-500 hover:text-slate-300"
            )}>
            {tab === "chat" ? "Messagerie" : `Fichiers (${order.files.length})`}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {order.messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.sender === "freelance" ? "flex-row-reverse" : "")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  msg.sender === "freelance" ? "bg-primary/20 text-primary" : "bg-slate-700 text-slate-300"
                )}>
                  {msg.sender === "freelance" ? "V" : order.clientAvatar}
                </div>
                <div className={cn("max-w-[70%] rounded-2xl px-4 py-3",
                  msg.sender === "freelance" ? "bg-primary/10 text-slate-100" : "bg-neutral-dark text-slate-200"
                )}>
                  <p className="text-xs font-bold mb-1">{msg.senderName}</p>
                  {msg.type === "file" ? (
                    <div className="flex items-center gap-2 bg-background-dark/50 rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-primary">description</span>
                      <div>
                        <p className="text-xs font-semibold">{msg.fileName}</p>
                        <p className="text-[10px] text-slate-500">{msg.fileSize}</p>
                      </div>
                      <button className="ml-auto text-primary"><span className="material-symbols-outlined text-lg">download</span></button>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1.5">{formatDate(msg.timestamp)}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border-dark p-4">
            <div className="flex gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <input
                type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Tapez votre message..."
                className="flex-1 px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={handleSendMessage} disabled={!message.trim()}
                className="px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Tab */}
      {activeTab === "fichiers" && (
        <div className="space-y-3">
          {order.files.length === 0 && (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">folder_open</span>
              <p className="text-slate-500">Aucun fichier pour cette commande.</p>
            </div>
          )}
          {order.files.map((file) => (
            <div key={file.id} className="flex items-center gap-4 bg-background-dark/50 border border-border-dark rounded-xl p-4 hover:border-primary/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{file.size} · {file.uploadedBy === "freelance" ? "Vous" : order.clientName} · {formatDate(file.uploadedAt)}</p>
              </div>
              <button className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors" onClick={() => addToast("info", `Telechargement de ${file.name}`)}>
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Timeline is now always visible above the tabs */}

      {/* Review Section — shown when order is completed */}
      {order.status === "termine" && !hasExistingReview && !reviewSubmitted && (
        <div className="bg-background-dark/50 border border-primary/30 rounded-xl p-6 space-y-5">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">rate_review</span>
            Laisser un avis
          </h3>
          <p className="text-sm text-slate-400">
            Evaluez cette prestation sur 3 criteres. Votre avis aide les autres clients.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Qualite", value: reviewQualite, setter: setReviewQualite, icon: "workspace_premium" },
              { label: "Communication", value: reviewCommunication, setter: setReviewCommunication, icon: "forum" },
              { label: "Delai", value: reviewDelai, setter: setReviewDelai, icon: "schedule" },
            ].map(({ label, value, setter, icon }) => (
              <div key={label} className="bg-primary/5 rounded-xl border border-primary/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                  <span className="text-sm font-bold">{label}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setter(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-2xl",
                          star <= value ? "text-amber-400" : "text-slate-600"
                        )}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Commentaire (optionnel)</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Partagez votre experience..."
              rows={3}
              className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-slate-500"
            />
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={reviewSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all"
          >
            {reviewSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Publication...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">send</span>
                Publier l&apos;avis
              </>
            )}
          </button>
        </div>
      )}

      {/* Review submitted confirmation */}
      {(reviewSubmitted || hasExistingReview) && order.status === "termine" && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex items-center gap-4">
          <span className="material-symbols-outlined text-emerald-400 text-3xl">check_circle</span>
          <div>
            <p className="font-bold text-emerald-400">Avis publie</p>
            <p className="text-sm text-slate-400">Merci pour votre evaluation ! Elle est visible sur le profil du freelance.</p>
          </div>
        </div>
      )}
    </div>
  );
}
