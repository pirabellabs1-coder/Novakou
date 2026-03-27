"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { OrderPhasePipeline } from "@/components/ui/order-phase-pipeline";
import { reviewsApi, ordersApi, type ApiOrder } from "@/lib/api-client";
import { CountdownTimer } from "@/components/ui/countdown-timer";

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

// Interactive progress slider for freelance
function ProgressSlider({ orderId, currentProgress }: { orderId: string; currentProgress: number }) {
  const { apiUpdateProgress } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [value, setValue] = useState(currentProgress);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setValue(currentProgress); }, [currentProgress]);

  function handleChange(newVal: number) {
    setValue(newVal);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      await apiUpdateProgress(orderId, newVal);
      addToast("success", `Progression mise a jour : ${newVal}%`);
      setSaving(false);
    }, 600);
  }

  const milestones = [0, 25, 50, 75, 100];
  return (
    <div className="mt-1">
      <div className="flex items-center gap-2">
        <p className="text-lg font-bold text-primary">{value}%</p>
        {saving && <span className="material-symbols-outlined animate-spin text-xs text-primary">progress_activity</span>}
      </div>
      <input type="range" min={0} max={100} step={5} value={value}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-full h-1.5 mt-1 accent-primary cursor-pointer" />
      <div className="flex justify-between mt-0.5">
        {milestones.map((m) => (
          <button key={m} onClick={() => handleChange(m)}
            className={cn("text-[9px] font-bold px-1 rounded", value >= m ? "text-primary" : "text-slate-600")}>
            {m}%
          </button>
        ))}
      </div>
    </div>
  );
}


export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { orders, isLoading, syncFromApi, updateOrderStatus, addOrderMessage, addOrderFile, apiAcceptOrder, apiDeliverOrder, apiSendOrderMessage } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);

  // Direct API fetch for this specific order (fallback if store is stale)
  const [localOrder, setLocalOrder] = useState<ApiOrder | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Sync from API on mount to ensure fresh data
  useEffect(() => { syncFromApi(); }, [syncFromApi]);

  const storeOrder = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  // Direct fetch if not found in store
  useEffect(() => {
    if (!storeOrder && !fetchLoading && !localOrder) {
      setFetchLoading(true);
      ordersApi.get(orderId)
        .then((data) => setLocalOrder(data))
        .catch(() => {})
        .finally(() => setFetchLoading(false));
    }
  }, [storeOrder, orderId, fetchLoading, localOrder]);

  const order = storeOrder || (localOrder ? {
    id: localOrder.id,
    serviceTitle: localOrder.serviceTitle,
    category: localOrder.category,
    clientName: localOrder.clientName,
    status: (localOrder.status || "en_attente").toLowerCase() as "en_attente" | "en_cours" | "livre" | "revision" | "termine" | "annule",
    amount: localOrder.amount,
    packageType: localOrder.packageType,
    deadline: localOrder.deadline,
    progress: localOrder.progress,
    revisionsLeft: localOrder.revisionsLeft,
    messages: localOrder.messages || [],
    timeline: localOrder.timeline || [],
    files: localOrder.files || [],
    deliveredAt: localOrder.deliveredAt,
  } : null) as typeof storeOrder;

  const pageLoading = (isLoading && orders.length === 0) || fetchLoading;
  const [activeTab, setActiveTab] = useState<"chat" | "fichiers">("chat");
  const [message, setMessage] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
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
        if ((data.reviews ?? []).length > 0) {
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

  if (pageLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-border-dark rounded" />
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 h-28" />
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 h-40" />
      </div>
    );
  }

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
    const result = await apiDeliverOrder(order.id, "Livraison effectuee", order.files.filter((f) => f.uploadedBy === "freelance"));
    setDelivering(false);
    setShowDeliverModal(false);
    if (result.success) {
      addToast("success", "Commande livree avec succes !");
    } else {
      addToast("error", result.error || "Erreur lors de la livraison");
    }
  }

  async function handleStart() {
    if (!order) return;
    setAccepting(true);
    const result = await apiAcceptOrder(order.id);
    setAccepting(false);
    setShowAcceptModal(false);
    if (result.success) {
      addToast("success", "Commande acceptee ! Travail demarre.");
    } else {
      addToast("error", result.error || "Erreur lors de l'acceptation");
    }
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
      <ConfirmModal
        open={showAcceptModal}
        title="Accepter la commande"
        message={`Vous allez accepter la commande "${order?.serviceTitle}". Vous vous engagez a livrer dans les delais convenus.`}
        confirmLabel="Accepter"
        onConfirm={handleStart}
        onCancel={() => setShowAcceptModal(false)}
      />
      <ConfirmModal
        open={showDeliverModal}
        title="Livrer la commande"
        message={`Vous allez marquer la commande "${order?.serviceTitle}" comme livree. Le client pourra valider ou demander une revision.`}
        confirmLabel="Livrer"
        onConfirm={handleDeliver}
        onCancel={() => setShowDeliverModal(false)}
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

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ETAPES D'ACTION — Ligne de progression avec boutons d'action */}
      {/* TOUJOURS VISIBLE — impossible a manquer                       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="bg-neutral-dark border-2 border-primary/20 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-primary">timeline</span>
          Actions de la commande
        </h3>

        {/* Step line — spread evenly across full width */}
        <div className="flex items-start justify-between overflow-x-auto pb-2">
          {/* Step 1: Accepter */}
          {(() => {
            const done = ["en_cours", "livre", "revision", "termine"].includes(order.status);
            const active = order.status === "en_attente";
            const cancelled = order.status === "annule";
            return (
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    done ? "bg-emerald-500 border-emerald-500 text-white" :
                    active ? "bg-primary border-primary text-white animate-pulse" :
                    cancelled ? "bg-red-500/20 border-red-500/30 text-red-400" :
                    "bg-slate-800 border-slate-600 text-slate-500"
                  )}>
                    <span className="material-symbols-outlined text-lg">{done ? "check" : cancelled ? "cancel" : "play_arrow"}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold text-center whitespace-nowrap", active ? "text-primary" : done ? "text-emerald-400" : "text-slate-500")}>Accepter</span>
                  {active && (
                    <button onClick={() => setShowAcceptModal(true)} disabled={accepting}
                      className="mt-1 px-4 py-2 bg-primary text-white text-xs font-black rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5">
                      {accepting ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">play_arrow</span>}
                      {accepting ? "..." : "Accepter"}
                    </button>
                  )}
                </div>
                <div className={cn("h-0.5 flex-1 min-w-4 max-w-16 mx-1", done ? "bg-emerald-500" : "bg-slate-700")} />
              </div>
            );
          })()}

          {/* Step 2: Travailler */}
          {(() => {
            const done = ["livre", "termine"].includes(order.status);
            const active = order.status === "en_cours" || order.status === "revision";
            return (
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    done ? "bg-emerald-500 border-emerald-500 text-white" :
                    active ? "bg-blue-500 border-blue-500 text-white" :
                    "bg-slate-800 border-slate-600 text-slate-500"
                  )}>
                    <span className="material-symbols-outlined text-lg">{done ? "check" : "construction"}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold text-center whitespace-nowrap", active ? "text-blue-400" : done ? "text-emerald-400" : "text-slate-500")}>En cours</span>
                </div>
                <div className={cn("h-0.5 flex-1 min-w-4 max-w-16 mx-1", done ? "bg-emerald-500" : "bg-slate-700")} />
              </div>
            );
          })()}

          {/* Step 3: Livrer */}
          {(() => {
            const done = ["livre", "termine"].includes(order.status);
            const active = order.status === "en_cours" || order.status === "revision";
            return (
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    done ? "bg-emerald-500 border-emerald-500 text-white" :
                    active ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                    "bg-slate-800 border-slate-600 text-slate-500"
                  )}>
                    <span className="material-symbols-outlined text-lg">{done ? "check" : "local_shipping"}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold text-center whitespace-nowrap", done ? "text-emerald-400" : active ? "text-emerald-400" : "text-slate-500")}>Livrer</span>
                  {active && (
                    <button onClick={() => setShowDeliverModal(true)} disabled={delivering}
                      className="mt-1 px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-lg hover:bg-emerald-600 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5">
                      {delivering ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">local_shipping</span>}
                      {delivering ? "..." : "Livrer"}
                    </button>
                  )}
                </div>
                <div className={cn("h-0.5 flex-1 min-w-4 max-w-16 mx-1", order.status === "termine" ? "bg-emerald-500" : "bg-slate-700")} />
              </div>
            );
          })()}

          {/* Step 4: Validation client */}
          {(() => {
            const done = order.status === "termine";
            const active = order.status === "livre";
            return (
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    done ? "bg-emerald-500 border-emerald-500 text-white" :
                    active ? "bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse" :
                    "bg-slate-800 border-slate-600 text-slate-500"
                  )}>
                    <span className="material-symbols-outlined text-lg">{done ? "check" : "hourglass_top"}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold text-center whitespace-nowrap", done ? "text-emerald-400" : active ? "text-amber-400" : "text-slate-500")}>
                    {active ? "Attente client" : done ? "Valide" : "Validation"}
                  </span>
                  {active && (
                    <span className="text-[9px] text-amber-400/70 font-semibold">7j pour valider</span>
                  )}
                </div>
                <div className={cn("h-0.5 flex-1 min-w-4 max-w-16 mx-1", done ? "bg-emerald-500" : "bg-slate-700")} />
              </div>
            );
          })()}

          {/* Step 5: Termine */}
          {(() => {
            const done = order.status === "termine";
            return (
              <div className="flex flex-col items-center gap-1.5 min-w-0">
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

        {/* Status message */}
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
          label="Delai pour accepter la commande"
          description="Vous devez accepter cette commande avant l'expiration du delai. Passe ce delai, la commande sera automatiquement annulee."
          expiredText="Delai depasse — la commande va etre annulee automatiquement"
          variant="amber"
        />
      )}

      {order.status === "livre" && (
        <CountdownTimer
          deadline={new Date(new Date(order.deliveredAt || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()}
          totalDurationMs={7 * 24 * 60 * 60 * 1000}
          label="Delai de validation client"
          description="Le client a 7 jours pour valider la livraison. Passe ce delai, la commande sera automatiquement validee et les fonds liberes."
          expiredText="Delai depasse — validation automatique en cours, fonds en cours de liberation"
          variant="blue"
        />
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-4">
          <p className="text-xs text-slate-500 font-semibold">Montant</p>
          <p className="text-lg font-bold mt-1">€{(order.amount ?? 0).toLocaleString("fr-FR")}</p>
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
          {order.status === "en_cours" || order.status === "revision" ? (
            <ProgressSlider orderId={order.id} currentProgress={order.progress} />
          ) : (
            <p className="text-lg font-bold mt-1 text-primary">{order.progress}%</p>
          )}
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

      {/* Secondary actions */}
      <div className="flex gap-3 flex-wrap">
        {["en_cours", "en_attente"].includes(order.status) && (
          <button onClick={() => setCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-400 font-semibold rounded-lg text-sm hover:bg-red-500/10">
            <span className="material-symbols-outlined text-lg">cancel</span> Annuler la commande
          </button>
        )}
        <button onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 border border-border-dark text-slate-300 font-semibold rounded-lg text-sm hover:border-primary/50">
          <span className="material-symbols-outlined text-lg">attach_file</span> Joindre un fichier
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
      </div>

      {/* Fichiers */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">folder</span>
          Fichiers ({order.files.length})
        </h3>
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
