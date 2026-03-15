"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { ordersApi } from "@/lib/api-client";
import { ConfirmModal } from "@/components/ui/confirm-modal";

// ============================================================
// Constants
// ============================================================

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: string; barColor: string }
> = {
  en_attente: {
    label: "En attente",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "schedule",
    barColor: "bg-amber-400",
  },
  en_cours: {
    label: "En cours",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: "play_circle",
    barColor: "bg-primary",
  },
  livre: {
    label: "Livré",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "local_shipping",
    barColor: "bg-emerald-500",
  },
  revision: {
    label: "Révision",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    icon: "edit_note",
    barColor: "bg-orange-400",
  },
  termine: {
    label: "Terminé",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "check_circle",
    barColor: "bg-emerald-500",
  },
  annule: {
    label: "Annulé",
    color: "text-red-400",
    bgColor: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: "cancel",
    barColor: "bg-red-500",
  },
  litige: {
    label: "Litige",
    color: "text-red-400",
    bgColor: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: "gavel",
    barColor: "bg-red-500",
  },
};

const TIMELINE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  created: { icon: "add_circle", color: "text-blue-400", bg: "bg-blue-500/10" },
  started: { icon: "play_circle", color: "text-primary", bg: "bg-primary/10" },
  delivered: { icon: "local_shipping", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  revision: { icon: "edit_note", color: "text-orange-400", bg: "bg-orange-500/10" },
  completed: { icon: "check_circle", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  cancelled: { icon: "cancel", color: "text-red-400", bg: "bg-red-500/10" },
  message: { icon: "chat_bubble", color: "text-slate-400", bg: "bg-slate-500/10" },
};

const FILE_ICONS: Record<string, string> = {
  pdf: "picture_as_pdf",
  zip: "folder_zip",
  fig: "design_services",
  figma: "design_services",
  png: "image",
  jpg: "image",
  jpeg: "image",
  svg: "image",
  mp4: "videocam",
  doc: "description",
  docx: "description",
  xls: "table_chart",
  xlsx: "table_chart",
};

const COUNTRY_FLAGS: Record<string, string> = {
  FR: "🇫🇷",
  SN: "🇸🇳",
  CI: "🇨🇮",
  ML: "🇲🇱",
  CM: "🇨🇲",
  BF: "🇧🇫",
  US: "🇺🇸",
  GB: "🇬🇧",
  CA: "🇨🇦",
  DE: "🇩🇪",
};

// ============================================================
// Helpers
// ============================================================

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(ts: string): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return formatShortDate(ts);
}

function getFileIcon(type: string): string {
  return FILE_ICONS[type.toLowerCase()] || "description";
}

function getDaysLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getHoursLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60));
}

function getCountdownDisplay(deadline: string): { text: string; urgent: boolean; expired: boolean } {
  const hoursLeft = getHoursLeft(deadline);
  const daysLeft = getDaysLeft(deadline);

  if (hoursLeft <= 0) return { text: "Expire", urgent: true, expired: true };
  if (hoursLeft < 24) return { text: `${hoursLeft}h restantes`, urgent: true, expired: false };
  if (daysLeft <= 3) return { text: `${daysLeft}j restants`, urgent: true, expired: false };
  return { text: `${daysLeft}j restants`, urgent: false, expired: false };
}

// ============================================================
// Main Component
// ============================================================

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { orders, updateOrderStatus, addOrderMessage, addOrderFile, apiSendOrderMessage } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deliveryFileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Progress update state
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);
  const [newProgress, setNewProgress] = useState(order?.progress ?? 0);

  // Action states
  const [delivering, setDelivering] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [deliverModal, setDeliverModal] = useState(false);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [order?.messages]);

  // Keep progress slider in sync
  useEffect(() => {
    if (order) setNewProgress(order.progress);
  }, [order?.progress, order]);

  // ---- 404 ----
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        </div>
        <h2 className="text-xl font-extrabold">Commande introuvable</h2>
        <p className="text-sm text-slate-400 text-center max-w-md">
          La commande <span className="font-bold text-slate-300">{orderId}</span> n&apos;existe pas ou a ete supprimee.
        </p>
        <Link
          href="/dashboard/commandes"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Retour aux commandes
        </Link>
      </div>
    );
  }

  // ---- Derived ----
  const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.en_attente;
  const countdown = getCountdownDisplay(order.deadline);

  // ---- Handlers ----

  function handleSendMessage() {
    if (!chatMessage.trim() || !order) return;
    const content = chatMessage.trim();
    setChatMessage("");
    // Optimistic local update
    addOrderMessage(order.id, {
      sender: "freelance",
      senderName: "Vous",
      content,
      timestamp: new Date().toISOString(),
      type: "text",
    });
    // Persist via API
    apiSendOrderMessage(order.id, content);
  }

  function handleChatFileUpload(files: FileList | null) {
    if (!files || !order) return;
    Array.from(files).forEach((f) => {
      const fileSize = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
      const fileName = f.name;
      addOrderFile(order.id, {
        name: fileName,
        size: fileSize,
        type: fileName.split(".").pop() || "file",
        uploadedBy: "freelance",
        uploadedAt: new Date().toISOString(),
        url: "#",
      });
      addOrderMessage(order.id, {
        sender: "freelance",
        senderName: "Vous",
        content: `Fichier envoye : ${fileName}`,
        timestamp: new Date().toISOString(),
        type: "file",
        fileName,
        fileSize,
      });
      // Persist file message via API
      ordersApi.sendMessage(order.id, { content: `Fichier envoye : ${fileName}`, type: "file", fileName, fileSize });
    });
    addToast("success", `${files.length} fichier(s) envoye(s)`);
  }

  function handleDropZoneUpload(files: FileList | null) {
    if (!files || !order) return;
    Array.from(files).forEach((f) => {
      addOrderFile(order.id, {
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: f.name.split(".").pop() || "file",
        uploadedBy: "freelance",
        uploadedAt: new Date().toISOString(),
        url: "#",
      });
    });
    addToast("success", `${files.length} fichier(s) ajoute(s)`);
    setIsDragOver(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleDropZoneUpload(e.dataTransfer.files);
  }

  function handleStart() {
    if (!order) return;
    updateOrderStatus(order.id, "en_cours");
    addToast("success", "Travail demarre ! Bonne chance.");
  }

  function handleDeliver() {
    if (!order) return;
    setDelivering(true);
    setTimeout(() => {
      updateOrderStatus(order.id, "livre");
      setDelivering(false);
      setDeliverModal(false);
      addToast("success", "Commande livree avec succes !");
    }, 1000);
  }

  function handleCancel() {
    if (!order) return;
    updateOrderStatus(order.id, "annule");
    setCancelModal(false);
    addToast("info", "Commande annulee");
  }

  function handleProgressUpdate() {
    if (!order) return;
    // We update the order progress via a custom approach since the store doesn't have a dedicated method
    // We'll use updateOrderStatus approach by dispatching through the store
    const store = useDashboardStore.getState();
    const updatedOrders = store.orders.map((o) =>
      o.id === order.id ? { ...o, progress: newProgress } : o
    );
    useDashboardStore.setState({ orders: updatedOrders });
    setShowProgressUpdate(false);
    addToast("success", `Progression mise a jour : ${newProgress}%`);
  }

  function handleReDeliver() {
    deliveryFileInputRef.current?.click();
  }

  function handleReDeliveryFiles(files: FileList | null) {
    if (!files || !order) return;
    Array.from(files).forEach((f) => {
      const fileSize = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
      const fileName = f.name;
      addOrderFile(order.id, {
        name: fileName,
        size: fileSize,
        type: fileName.split(".").pop() || "file",
        uploadedBy: "freelance",
        uploadedAt: new Date().toISOString(),
        url: "#",
      });
      addOrderMessage(order.id, {
        sender: "freelance",
        senderName: "Vous",
        content: `Nouvelle livraison : ${fileName}`,
        timestamp: new Date().toISOString(),
        type: "file",
        fileName,
        fileSize,
      });
      ordersApi.sendMessage(order.id, { content: `Nouvelle livraison : ${fileName}`, type: "file", fileName, fileSize });
    });
    updateOrderStatus(order.id, "livre");
    addToast("success", "Nouvelle livraison envoyee !");
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-full space-y-6">
      {/* Modals */}
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
        open={deliverModal}
        title="Livrer la commande"
        message="Confirmez-vous la livraison de cette commande ? Le client sera notifie et pourra valider ou demander une revision."
        confirmLabel="Confirmer la livraison"
        variant="primary"
        onConfirm={handleDeliver}
        onCancel={() => setDeliverModal(false)}
      />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleDropZoneUpload(e.target.files)}
      />
      <input
        ref={deliveryFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleReDeliveryFiles(e.target.files)}
      />
      <input
        ref={chatFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleChatFileUpload(e.target.files)}
      />

      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 p-2 rounded-lg hover:bg-primary/10 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight">{order.serviceTitle}</h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                  sc.bgColor
                )}
              >
                <span className="material-symbols-outlined text-sm">{sc.icon}</span>
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {order.id} · {order.clientName} · {order.category}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/commandes/${order.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-background-dark/50 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:border-primary/50 transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">info</span>
          Details commande
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Progression globale</span>
          <span className={cn("text-sm font-bold", sc.color)}>{order.progress}%</span>
        </div>
        <div className="w-full h-2.5 bg-border-dark rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", sc.barColor)}
            style={{ width: `${order.progress}%` }}
          />
        </div>
      </div>

      {/* ================================================================ */}
      {/* ACTION BAR                                                       */}
      {/* ================================================================ */}
      <div className="flex flex-wrap gap-3">
        {order.status === "en_attente" && (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Commencer le travail
          </button>
        )}

        {order.status === "en_cours" && (
          <>
            <button
              onClick={() => setDeliverModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-lg text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              Livrer les fichiers
            </button>
            <button
              onClick={() => setShowProgressUpdate(!showProgressUpdate)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition-all",
                showProgressUpdate
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border-dark text-slate-300 hover:border-primary/50"
              )}
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              Mettre a jour la progression
            </button>
          </>
        )}

        {order.status === "livre" && (
          <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="material-symbols-outlined text-emerald-400">hourglass_top</span>
            <div>
              <p className="text-sm font-bold text-emerald-400">En attente de validation du client</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Le client a 3 jours pour valider ou demander une revision.
              </p>
            </div>
          </div>
        )}

        {order.status === "revision" && (
          <>
            <button
              onClick={handleReDeliver}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-lg text-sm hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-lg">replay</span>
              Re-livrer
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <span className="material-symbols-outlined text-orange-400 text-lg">edit_note</span>
              <span className="text-sm text-orange-300 font-semibold">
                {order.revisionsLeft} revision(s) restante(s)
              </span>
            </div>
          </>
        )}

        {order.status === "termine" && (
          <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-full">
            <span className="material-symbols-outlined text-emerald-400 text-2xl">
              celebration
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-400">Commande terminee avec succes !</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Les fonds ont ete liberes dans votre portefeuille. Merci pour votre excellent travail.
              </p>
            </div>
          </div>
        )}

        {["en_attente", "en_cours"].includes(order.status) && (
          <button
            onClick={() => setCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-400 font-semibold rounded-lg text-sm hover:bg-red-500/10 transition-all ml-auto"
          >
            <span className="material-symbols-outlined text-lg">cancel</span>
            Annuler
          </button>
        )}
      </div>

      {/* Progress Update Slider */}
      {showProgressUpdate && order.status === "en_cours" && (
        <div className="bg-background-dark/50 border border-primary/30 rounded-xl p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold">Mettre a jour la progression</p>
            <span className="text-lg font-extrabold text-primary">{newProgress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={newProgress}
            onChange={(e) => setNewProgress(Number(e.target.value))}
            className="w-full h-2 bg-border-dark rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={() => setShowProgressUpdate(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleProgressUpdate}
              className="px-5 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 2-COLUMN LAYOUT                                                  */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ==== LEFT COLUMN — Timeline (3/5) ==== */}
        <div className="lg:col-span-3 space-y-6">
          {/* Timeline Card */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border-dark">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">timeline</span>
                <h3 className="font-bold">Historique de la commande</h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {order.timeline.length} evenement(s)
              </span>
            </div>

            <div className="p-5">
              {order.timeline.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">
                    history
                  </span>
                  <p className="text-sm text-slate-500">Aucun evenement pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {order.timeline.map((event, i) => {
                    const tc = TIMELINE_ICONS[event.type] ?? {
                      icon: "circle",
                      color: "text-slate-400",
                      bg: "bg-slate-500/10",
                    };
                    const isLast = i === order.timeline.length - 1;

                    return (
                      <div key={event.id} className="flex gap-4">
                        {/* Icon + line */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center",
                              tc.bg
                            )}
                          >
                            <span
                              className={cn("material-symbols-outlined text-lg", tc.color)}
                            >
                              {tc.icon}
                            </span>
                          </div>
                          {!isLast && (
                            <div className="w-0.5 flex-1 bg-border-dark my-1 min-h-[24px]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className={cn("pb-6 flex-1 min-w-0", isLast && "pb-2")}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm">{event.title}</p>
                            <span className="text-[11px] text-slate-500 whitespace-nowrap flex-shrink-0">
                              {formatRelativeTime(event.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
                          <p className="text-[11px] text-slate-600 mt-1">
                            {formatDate(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* Info Cards (below timeline on desktop, below everything on mobile) */}
          {/* ================================================================ */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-border-dark">
              <span className="material-symbols-outlined text-primary">info</span>
              <h3 className="font-bold">Informations de la commande</h3>
            </div>

            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
              {/* Client */}
              <div className="col-span-2 sm:col-span-3 flex items-center gap-4 pb-4 border-b border-border-dark">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {order.clientAvatar}
                </div>
                <div>
                  <p className="font-bold text-sm">{order.clientName}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{COUNTRY_FLAGS[order.clientCountry] || ""}</span>
                    {order.clientCountry}
                  </p>
                </div>
                <button className="ml-auto p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined">chat</span>
                </button>
              </div>

              {/* Package */}
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Forfait</p>
                <p className="text-sm font-bold capitalize">{order.packageType}</p>
              </div>

              {/* Amount */}
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Montant</p>
                <p className="text-sm font-bold text-primary">
                  {"\u20AC"}{order.amount.toLocaleString("fr-FR")}
                </p>
              </div>

              {/* Deadline */}
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Deadline</p>
                <div className="flex items-center gap-1.5">
                  {countdown.urgent && (
                    <span
                      className={cn(
                        "material-symbols-outlined text-sm",
                        countdown.expired ? "text-red-400" : "text-amber-400"
                      )}
                    >
                      {countdown.expired ? "error" : "warning"}
                    </span>
                  )}
                  <p
                    className={cn(
                      "text-sm font-bold",
                      countdown.expired
                        ? "text-red-400"
                        : countdown.urgent
                        ? "text-amber-400"
                        : ""
                    )}
                  >
                    {countdown.text}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {new Date(order.deadline).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Revisions */}
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Revisions</p>
                <p className="text-sm font-bold">{order.revisionsLeft} restante(s)</p>
              </div>

              {/* Created */}
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Commande cree le</p>
                <p className="text-sm font-bold">
                  {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Delivered */}
              {order.deliveredAt && (
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Livrée le</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {new Date(order.deliveredAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==== RIGHT COLUMN — Files + Chat (2/5) ==== */}
        <div className="lg:col-span-2 space-y-6">
          {/* ---- Files Section ---- */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-dark">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder</span>
                <h3 className="font-bold text-sm">Fichiers</h3>
                <span className="text-xs text-slate-500 bg-border-dark px-1.5 py-0.5 rounded">
                  {order.files.length}
                </span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-sm">upload</span>
                Ajouter
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "mx-4 mt-4 border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border-dark hover:border-primary/40"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-2xl mb-2",
                  isDragOver ? "text-primary" : "text-slate-600"
                )}
              >
                cloud_upload
              </span>
              <p className="text-xs text-slate-400">
                {isDragOver
                  ? "Deposez vos fichiers ici"
                  : "Glissez-deposez vos fichiers ou cliquez pour parcourir"}
              </p>
            </div>

            {/* File list */}
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {order.files.length === 0 && (
                <div className="py-6 text-center">
                  <span className="material-symbols-outlined text-2xl text-slate-600 mb-1">
                    folder_open
                  </span>
                  <p className="text-xs text-slate-500">Aucun fichier</p>
                </div>
              )}
              {order.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-dark/50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-lg">
                      {getFileIcon(file.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {file.size} ·{" "}
                      {file.uploadedBy === "freelance" ? "Vous" : order.clientName} ·{" "}
                      {formatShortDate(file.uploadedAt)}
                    </p>
                  </div>
                  <button
                    className="p-1.5 rounded-lg text-slate-500 opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10 transition-all"
                    onClick={() => addToast("info", `Telechargement de ${file.name}`)}
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Chat Section ---- */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border-dark">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">chat</span>
                <h3 className="font-bold text-sm">Messagerie</h3>
                <span className="text-xs text-slate-500 bg-border-dark px-1.5 py-0.5 rounded">
                  {order.messages.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                En ligne
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="h-80 overflow-y-auto p-4 space-y-3"
            >
              {order.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">
                    forum
                  </span>
                  <p className="text-xs text-slate-500">
                    Aucun message. Commencez la conversation !
                  </p>
                </div>
              )}

              {order.messages.map((msg) => {
                const isMe = msg.sender === "freelance";
                return (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2", isMe ? "flex-row-reverse" : "")}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                        isMe
                          ? "bg-primary/20 text-primary"
                          : "bg-slate-700 text-slate-300"
                      )}
                    >
                      {isMe ? "V" : order.clientAvatar}
                    </div>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2.5",
                        isMe
                          ? "bg-primary/10 text-slate-100"
                          : "bg-neutral-dark text-slate-200"
                      )}
                    >
                      <p className="text-[10px] font-bold mb-0.5 text-slate-400">
                        {msg.senderName}
                      </p>

                      {msg.type === "file" ? (
                        <div className="flex items-center gap-2 bg-background-dark/50 rounded-lg px-2.5 py-2">
                          <span className="material-symbols-outlined text-primary text-lg">
                            description
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{msg.fileName}</p>
                            <p className="text-[10px] text-slate-500">{msg.fileSize}</p>
                          </div>
                          <button className="text-primary flex-shrink-0">
                            <span className="material-symbols-outlined text-base">
                              download
                            </span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}

                      <p className="text-[10px] text-slate-500 mt-1">
                        {formatRelativeTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-border-dark p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => chatFileInputRef.current?.click()}
                  className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">attach_file</span>
                </button>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-600"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-all flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
