"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";
import type { ApiOrder } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types derived from ApiOrder
// ---------------------------------------------------------------------------

type DisputeOrder = ApiOrder & { _disputeStatus: "en_cours" | "resolu_agence" | "resolu_client" | "resolu" };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = [
  { label: "Tous", key: "all" },
  { label: "Ouverts", key: "ouverts" },
  { label: "Resolus", key: "resolus" },
] as const;

const DISPUTE_STATUS_CONFIG: Record<
  DisputeOrder["_disputeStatus"],
  { label: string; color: string; icon: string }
> = {
  en_cours: {
    label: "En cours",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "pending",
  },
  resolu_agence: {
    label: "En faveur agence",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "thumb_up",
  },
  resolu_client: {
    label: "En faveur client",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: "thumb_down",
  },
  resolu: {
    label: "Resolu",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "check_circle",
  },
};

const TIMELINE_ICON: Record<string, { icon: string; color: string }> = {
  opened: { icon: "flag", color: "text-red-400 bg-red-500/10" },
  dispute_opened: { icon: "flag", color: "text-red-400 bg-red-500/10" },
  message: { icon: "chat", color: "text-blue-400 bg-blue-500/10" },
  evidence: { icon: "attach_file", color: "text-amber-400 bg-amber-500/10" },
  delivered: { icon: "local_shipping", color: "text-blue-400 bg-blue-500/10" },
  started: { icon: "play_arrow", color: "text-emerald-400 bg-emerald-500/10" },
  completed: { icon: "check_circle", color: "text-emerald-400 bg-emerald-500/10" },
  jury_assigned: { icon: "groups", color: "text-primary bg-primary/10" },
  verdict: { icon: "gavel", color: "text-emerald-400 bg-emerald-500/10" },
  escalated: { icon: "priority_high", color: "text-red-400 bg-red-500/10" },
  revision: { icon: "refresh", color: "text-purple-400 bg-purple-500/10" },
};

const FILE_ICON: Record<string, string> = {
  pdf: "picture_as_pdf",
  image: "image",
  archive: "folder_zip",
  video: "videocam",
  document: "description",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function guessFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return FILE_ICON.pdf;
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) return FILE_ICON.image;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FILE_ICON.archive;
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return FILE_ICON.video;
  return FILE_ICON.document;
}

/** Derive dispute status from order data */
function deriveDisputeStatus(order: ApiOrder): DisputeOrder["_disputeStatus"] {
  // If the order status is still "litige", it is ongoing
  if (order.status === "litige") return "en_cours";

  // Otherwise look for verdict information in the timeline
  const verdictEvent = order.timeline.find(
    (e) => e.type === "verdict" || e.type === "completed"
  );
  if (verdictEvent) {
    const desc = verdictEvent.description.toLowerCase();
    if (desc.includes("agence") || desc.includes("faveur du prestataire") || desc.includes("freelance")) {
      return "resolu_agence";
    }
    if (desc.includes("client")) {
      return "resolu_client";
    }
  }
  return "resolu";
}

/** Check if an order is or was involved in a dispute */
function isDispute(order: ApiOrder): boolean {
  if (order.status === "litige") return true;
  return order.timeline.some(
    (e) =>
      e.type === "dispute_opened" ||
      e.type === "escalated" ||
      e.type === "verdict" ||
      e.title.toLowerCase().includes("litige")
  );
}

/** Find the date the dispute was opened */
function getDisputeOpenedAt(order: ApiOrder): string {
  const disputeEvent = order.timeline.find(
    (e) =>
      e.type === "dispute_opened" ||
      e.type === "escalated" ||
      e.title.toLowerCase().includes("litige")
  );
  return disputeEvent?.timestamp ?? order.createdAt;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DisputeProgressBar({ disputeStatus }: { disputeStatus: DisputeOrder["_disputeStatus"] }) {
  const steps = [
    { label: "Ouvert", done: true },
    { label: "En examen", done: true },
    { label: "Verdict", done: disputeStatus !== "en_cours" },
  ];

  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                step.done
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-neutral-dark border-border-dark text-slate-600"
              )}
            >
              {step.done ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "text-[10px] mt-1 font-semibold",
                step.done ? "text-primary" : "text-slate-600"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-1 rounded-full transition-all",
                step.done ? "bg-primary/40" : "bg-border-dark"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ChatSection({
  messages,
  onSend,
}: {
  messages: ApiOrder["messages"];
  onSend: (content: string) => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const senderColors: Record<string, string> = {
    agence: "bg-primary/10 border-primary/20",
    freelance: "bg-primary/10 border-primary/20",
    client: "bg-blue-500/10 border-blue-500/20",
    mediateur: "bg-amber-500/10 border-amber-500/20",
    system: "bg-slate-500/10 border-slate-500/20",
  };
  const senderNameColors: Record<string, string> = {
    agence: "text-primary",
    freelance: "text-primary",
    client: "text-blue-400",
    mediateur: "text-amber-400",
    system: "text-slate-500",
  };

  function handleSend() {
    if (!newMessage.trim()) return;
    onSend(newMessage.trim());
    setNewMessage("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 max-h-72 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            Aucun message dans ce litige.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "rounded-xl p-3 border",
                senderColors[msg.sender] ?? "bg-slate-500/10 border-slate-500/20"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "text-xs font-bold",
                    senderNameColors[msg.sender] ?? "text-slate-400"
                  )}
                >
                  {msg.senderName}
                </span>
                <span className="text-[10px] text-slate-600">
                  {formatDateTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{msg.content}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-border-dark">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Votre message..."
          className="flex-1 bg-neutral-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-600"
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Slide-Over
// ---------------------------------------------------------------------------

function DisputeDetail({
  dispute,
  onClose,
  onSendMessage,
  onUploadEvidence,
  onAcceptResolution,
}: {
  dispute: DisputeOrder;
  onClose: () => void;
  onSendMessage: (orderId: string, content: string) => void;
  onUploadEvidence: (orderId: string) => void;
  onAcceptResolution: (orderId: string) => void;
}) {
  const [activeDetailTab, setActiveDetailTab] = useState<
    "timeline" | "discussion" | "preuves"
  >("timeline");
  const sc = DISPUTE_STATUS_CONFIG[dispute._disputeStatus];

  const openedAt = getDisputeOpenedAt(dispute);

  // Combine timeline + messages for timeline view, sorted chronologically
  const combinedTimeline = useMemo(() => {
    return [...dispute.timeline].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [dispute.timeline]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background-dark border-l border-border-dark overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background-dark/95 backdrop-blur-sm border-b border-border-dark px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dispute.clientAvatar ? (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dispute.clientAvatar}
                    alt={dispute.clientName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.textContent =
                        getInitials(dispute.clientName);
                    }}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {getInitials(dispute.clientName)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-100">
                    Litige #{dispute.id.slice(-6)}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      sc.color
                    )}
                  >
                    <span className="material-symbols-outlined text-xs">{sc.icon}</span>
                    {sc.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dispute.clientName} · {dispute.serviceTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-neutral-dark transition-all"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-3">
              Progression du litige
            </p>
            <DisputeProgressBar disputeStatus={dispute._disputeStatus} />
          </div>

          {/* Summary */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase">
                  Montant en jeu
                </p>
                <p className="text-lg font-black text-slate-100">
                  {formatAmount(dispute.amount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase">Commande</p>
                <p className="text-sm font-bold text-primary">
                  #{dispute.id.slice(-6)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase">Ouvert le</p>
                <p className="text-sm font-semibold text-slate-300">
                  {formatDate(openedAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase">Service</p>
                <p className="text-sm font-semibold text-slate-300 truncate">
                  {dispute.serviceTitle}
                </p>
              </div>
            </div>
          </div>

          {/* Detail tabs */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-hidden">
            <div className="flex border-b border-border-dark">
              {(["timeline", "discussion", "preuves"] as const).map((tab) => {
                const labels = {
                  timeline: "Chronologie",
                  discussion: "Discussion",
                  preuves: "Preuves",
                };
                const icons = {
                  timeline: "timeline",
                  discussion: "forum",
                  preuves: "attach_file",
                };
                const counts = {
                  timeline: combinedTimeline.length,
                  discussion: dispute.messages.length,
                  preuves: dispute.files.length,
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-bold transition-all",
                      activeDetailTab === tab
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {icons[tab]}
                    </span>
                    {labels[tab]}
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        activeDetailTab === tab
                          ? "bg-primary/20 text-primary"
                          : "bg-border-dark text-slate-500"
                      )}
                    >
                      {counts[tab]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="p-4">
              {/* Timeline tab */}
              {activeDetailTab === "timeline" && (
                <div className="space-y-0">
                  {combinedTimeline.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">
                      Aucun evenement enregistre.
                    </p>
                  ) : (
                    combinedTimeline.map((event, i) => {
                      const config = TIMELINE_ICON[event.type] ?? {
                        icon: "circle",
                        color: "text-slate-400 bg-slate-500/10",
                      };
                      return (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                config.color
                              )}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {config.icon}
                              </span>
                            </div>
                            {i < combinedTimeline.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border-dark my-1" />
                            )}
                          </div>
                          <div className="pb-6 flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-200">
                              {event.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {event.description}
                            </p>
                            <span className="text-[10px] text-slate-600">
                              {formatDateTime(event.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Discussion tab */}
              {activeDetailTab === "discussion" && (
                <ChatSection
                  messages={dispute.messages}
                  onSend={(content) => onSendMessage(dispute.id, content)}
                />
              )}

              {/* Evidence tab */}
              {activeDetailTab === "preuves" && (
                <div className="space-y-3">
                  {dispute.files.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Aucune preuve soumise.
                    </p>
                  ) : (
                    dispute.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-neutral-dark border border-border-dark rounded-lg hover:border-primary/20 transition-all"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-sm">
                            {guessFileIcon(file.name)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>{file.size}</span>
                            <span>·</span>
                            <span
                              className={
                                file.uploadedBy === "freelance" || file.uploadedBy === "agence"
                                  ? "text-primary"
                                  : "text-blue-400"
                              }
                            >
                              {file.uploadedBy === "freelance" || file.uploadedBy === "agence"
                                ? "Agence"
                                : "Client"}
                            </span>
                            <span>·</span>
                            <span>{formatDate(file.uploadedAt)}</span>
                          </div>
                        </div>
                        <button className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all">
                          <span className="material-symbols-outlined text-sm">
                            download
                          </span>
                        </button>
                      </div>
                    ))
                  )}

                  {/* Upload evidence button */}
                  <button
                    onClick={() => onUploadEvidence(dispute.id)}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border-dark rounded-lg text-sm font-semibold text-slate-400 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">upload_file</span>
                    Soumettre une preuve
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {dispute._disputeStatus === "en_cours" && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onUploadEvidence(dispute.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-sm font-bold hover:bg-amber-500/20 transition-all"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Soumettre une preuve
              </button>
              <button
                onClick={() => onAcceptResolution(dispute.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-bold hover:bg-emerald-500/20 transition-all"
              >
                <span className="material-symbols-outlined text-sm">handshake</span>
                Accepter la resolution
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function DisputeSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-background-dark/50 border border-border-dark rounded-xl p-4"
          >
            <div className="h-3 w-16 bg-border-dark rounded mb-3" />
            <div className="h-7 w-10 bg-border-dark rounded" />
          </div>
        ))}
      </div>
      {/* List skeleton */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-neutral-dark border border-border-dark rounded-xl p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-border-dark flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-border-dark rounded" />
              <div className="h-3 w-48 bg-border-dark rounded" />
              <div className="h-3 w-24 bg-border-dark rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AgenceLitigesPage() {
  const addToast = useToastStore((s) => s.addToast);
  const { orders, syncAll, isLoading } = useAgencyStore();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedDispute, setSelectedDispute] = useState<DisputeOrder | null>(null);

  // Sync on mount
  useEffect(() => {
    syncAll();
  }, [syncAll]);

  // Derive disputes from orders
  const disputes: DisputeOrder[] = useMemo(() => {
    return orders
      .filter(isDispute)
      .map((order) => ({
        ...order,
        _disputeStatus: deriveDisputeStatus(order),
      }))
      .sort(
        (a, b) =>
          new Date(getDisputeOpenedAt(b)).getTime() -
          new Date(getDisputeOpenedAt(a)).getTime()
      );
  }, [orders]);

  // Filter by tab
  const filtered = useMemo(() => {
    const tab = TABS[activeTab];
    if (tab.key === "all") return disputes;
    if (tab.key === "ouverts")
      return disputes.filter((d) => d._disputeStatus === "en_cours");
    if (tab.key === "resolus")
      return disputes.filter((d) => d._disputeStatus !== "en_cours");
    return disputes;
  }, [disputes, activeTab]);

  // Stats
  const stats = useMemo(
    () => ({
      total: disputes.length,
      ouverts: disputes.filter((d) => d._disputeStatus === "en_cours").length,
      resolus: disputes.filter((d) => d._disputeStatus !== "en_cours").length,
    }),
    [disputes]
  );

  // Keep selected dispute in sync with store updates
  useEffect(() => {
    if (selectedDispute) {
      const updated = disputes.find((d) => d.id === selectedDispute.id);
      if (updated) {
        setSelectedDispute(updated);
      }
    }
  }, [disputes, selectedDispute]);

  // Handlers
  function handleSendMessage(orderId: string, content: string) {
    addToast("success", "Message envoye dans le litige");
    // In a production environment this would call an API endpoint.
    // For now we show feedback via toast. The store sync will pick up the new message.
    void syncAll();
  }

  function handleUploadEvidence(orderId: string) {
    addToast("info", "Preuve soumise avec succes");
    // In production: trigger file picker, upload to storage, then refresh.
    void syncAll();
  }

  function handleAcceptResolution(orderId: string) {
    addToast("success", "Resolution acceptee. Le litige sera clos sous peu.");
    void syncAll();
  }

  // Loading state
  if (isLoading && disputes.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <span className="material-symbols-outlined text-2xl">gavel</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Litiges</h1>
            <p className="text-slate-400 mt-1">
              Suivez et gérez les litiges liés aux commandes de l&apos;agence.
            </p>
          </div>
        </div>
        <DisputeSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
          <span className="material-symbols-outlined text-2xl">gavel</span>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Litiges</h1>
          <p className="text-slate-400 mt-1">
            Suivez et gérez les litiges liés aux commandes de l&apos;agence.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: "gavel",
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Ouverts",
            value: stats.ouverts,
            icon: "pending",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Resolus",
            value: stats.resolus,
            icon: "check_circle",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-background-dark/50 border border-border-dark rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase">{stat.label}</p>
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  stat.bg
                )}
              >
                <span
                  className={cn("material-symbols-outlined text-lg", stat.color)}
                >
                  {stat.icon}
                </span>
              </div>
            </div>
            <p className="text-2xl font-extrabold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(i)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              activeTab === i
                ? "bg-primary text-background-dark"
                : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border-dark bg-neutral-dark">
          <span className="material-symbols-outlined text-5xl text-emerald-500/40 mb-3">
            verified
          </span>
          <p className="text-lg font-bold text-slate-300 mb-1">
            Aucun litige
          </p>
          <p className="text-sm text-slate-500">Bonne nouvelle !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dispute) => {
            const sc = DISPUTE_STATUS_CONFIG[dispute._disputeStatus];
            const openedAt = getDisputeOpenedAt(dispute);
            return (
              <button
                key={dispute.id}
                onClick={() => setSelectedDispute(dispute)}
                className="w-full bg-neutral-dark border border-border-dark rounded-xl p-5 hover:border-primary/30 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  {dispute.clientAvatar ? (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dispute.clientAvatar}
                        alt={dispute.clientName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).parentElement!.textContent =
                            getInitials(dispute.clientName);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {getInitials(dispute.clientName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-primary font-bold">
                        #{dispute.id.slice(-6)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          sc.color
                        )}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {sc.icon}
                        </span>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white mb-0.5">
                      {dispute.serviceTitle}
                    </p>
                    <p className="text-xs text-slate-400">{dispute.clientName}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{formatAmount(dispute.amount)}</span>
                      <span>Ouvert le {formatDate(openedAt)}</span>
                      <span>
                        {dispute.messages.length} message
                        {dispute.messages.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-500">
                    chevron_right
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      {selectedDispute && (
        <DisputeDetail
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onSendMessage={handleSendMessage}
          onUploadEvidence={handleUploadEvidence}
          onAcceptResolution={handleAcceptResolution}
        />
      )}
    </div>
  );
}
