"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/toast";
import { ordersApi } from "@/lib/api-client";
import { OrderPhasePipeline } from "@/components/ui/order-phase-pipeline";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CountdownTimer } from "@/components/ui/countdown-timer";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  en_attente: { label: "En attente", color: "bg-amber-500/20 text-amber-400", icon: "schedule" },
  en_cours: { label: "En cours", color: "bg-blue-500/20 text-blue-400", icon: "play_circle" },
  livre: { label: "Livrée", color: "bg-emerald-500/20 text-emerald-400", icon: "local_shipping" },
  revision: { label: "Révision", color: "bg-orange-500/20 text-orange-400", icon: "edit_note" },
  termine: { label: "Terminé", color: "bg-emerald-500/20 text-emerald-400", icon: "check_circle" },
  annule: { label: "Annulé", color: "bg-red-500/20 text-red-400", icon: "cancel" },
  litige: { label: "En litige", color: "bg-red-500/20 text-red-400", icon: "gavel" },
};

const fmtDate = (ts: string) => new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const initials = (name: string) => (name || "??").split(" ").map((n) => n[0]).join("").toUpperCase();

export default function AgenceCommandeDetail() {
  const { id } = useParams();
  const orderId = id as string;
  const { orders, members, syncAll, acceptOrder, deliverOrder } = useAgencyStore();
  const addToast = useToastStore((s) => s.addToast);
  const rawOrder = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);
  // Normalize status to lowercase (Prisma returns UPPERCASE enum values)
  const order = rawOrder ? { ...rawOrder, status: (rawOrder.status || "en_attente").toLowerCase() } : null;

  const [assignee, setAssignee] = useState("");
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [draftFiles, setDraftFiles] = useState<{ name: string; size: string }[]>([]);
  const [accepting, setAccepting] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { syncAll(); }, [syncAll]);
  useEffect(() => {
    if (order && members.length > 0 && !assignee) {
      const found = members.find((m) => m.id === order.freelanceId);
      setAssignee(found?.id || members[0]?.id || "");
    }
  }, [order, members, assignee]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [order?.messages]);

  if (!order) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">search_off</span>
        <p className="text-slate-400 font-semibold">Commande introuvable</p>
        <Link href="/agence/commandes" className="text-primary text-sm mt-2 inline-block hover:underline">Retour aux commandes</Link>
      </div>
    );
  }

  const sc = STATUS_CONFIG[order.status];
  const currentMember = members.find((m) => m.id === assignee);

  async function handleSendMessage() {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await ordersApi.sendMessage(orderId, { content: newMessage.trim(), type: "text" });
      setNewMessage("");
      await useAgencyStore.getState().syncOrders();
    } catch { addToast("error", "Erreur lors de l'envoi du message"); }
    finally { setSending(false); }
  }

  async function handleAssign(memberId: string) {
    setAssignee(memberId); setShowAssignDropdown(false);
    const member = members.find((m) => m.id === memberId);
    try {
      await ordersApi.update(orderId, { freelanceId: memberId });
      addToast("success", `Commande assignee a ${member?.name || "membre"}`);
    } catch { addToast("error", "Erreur lors de la reassignation"); }
  }

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const added = Array.from(e.target.files).map((f) => ({ name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(1)} MB` }));
    setDraftFiles((prev) => [...prev, ...added]);
    addToast("success", "Fichier(s) ajoute(s)");
  }

  async function handleAccept() {
    setAccepting(true);
    const result = await acceptOrder(orderId);
    setAccepting(false);
    setShowAcceptModal(false);
    if (result.success) {
      addToast("success", "Commande acceptee ! Travail demarre.");
    } else {
      addToast("error", result.error || "Erreur lors de l'acceptation");
    }
  }

  async function handleDeliver() {
    setDelivering(true);
    const result = await deliverOrder(orderId, "Livraison effectuee par l'agence");
    setDelivering(false);
    setShowDeliverModal(false);
    if (result.success) {
      addToast("success", "Commande livree avec succes !");
      setDraftFiles([]);
    } else {
      addToast("error", result.error || "Erreur lors de la livraison");
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={showAcceptModal}
        title="Accepter la commande"
        message={`Vous allez accepter la commande "${order.serviceTitle}". L'agence s'engage a livrer dans les delais convenus.`}
        confirmLabel="Accepter"
        onConfirm={handleAccept}
        onCancel={() => setShowAcceptModal(false)}
      />
      <ConfirmModal
        open={showDeliverModal}
        title="Livrer la commande"
        message={`Vous allez marquer la commande "${order.serviceTitle}" comme livree. Le client pourra valider ou demander une revision.`}
        confirmLabel="Livrer"
        onConfirm={handleDeliver}
        onCancel={() => setShowDeliverModal(false)}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/agence/commandes" className="text-primary hover:underline">Commandes</Link>
        <span className="text-slate-500">/</span>
        <span className="text-slate-400">{order.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">{order.serviceTitle}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
            <span className="font-mono text-primary">{order.id}</span><span>·</span>
            <span>Client : {order.clientName}</span><span>·</span>
            <span className="font-bold text-white">{"\u20AC"}{(order.amount ?? 0).toLocaleString("fr-FR")}</span>
          </div>
        </div>
        {sc && (
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full", sc.color)}>
            <span className="material-symbols-outlined text-sm">{sc.icon}</span>{sc.label}
          </span>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ETAPES D'ACTION AGENCE — Ligne de progression + boutons      */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="bg-neutral-dark border-2 border-primary/20 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-primary">timeline</span>
          Actions de la commande
        </h3>

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
                      {delivering ? "..." : order.status === "revision" ? "Re-livrer" : "Livrer"}
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

        {order.status === "annule" && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg text-red-400 text-sm font-bold">
            <span className="material-symbols-outlined">cancel</span>
            Commande annulee
          </div>
        )}
        {order.status === "revision" && (
          <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg text-orange-400 text-sm font-bold">
            <span className="material-symbols-outlined">edit_note</span>
            Revision demandee par le client — {order.revisionsLeft} revision(s) restante(s)
          </div>
        )}
      </div>

      {/* Countdown Timers */}
      {order.status === "en_attente" && (
        <CountdownTimer
          deadline={order.deadline}
          totalDurationMs={3 * 24 * 60 * 60 * 1000}
          label="Delai pour accepter la commande"
          description="L'agence doit accepter cette commande avant l'expiration du delai. Passe ce delai, la commande sera automatiquement annulee."
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
          expiredText="Delai depasse — validation automatique en cours"
          variant="blue"
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Member Assignment */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">person_add</span>Membre assigne
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                {currentMember ? initials(currentMember.name) : "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{currentMember?.name || "Non assigne"}</p>
                <p className="text-xs text-slate-400">{currentMember?.role || "Membre"}</p>
              </div>
              <div className="relative">
                <button onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                  className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
                  Reassigner
                </button>
                {showAssignDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-neutral-dark border border-border-dark rounded-lg shadow-xl z-20 w-52">
                    {members.filter((m) => m.status === "actif").map((m) => (
                      <button key={m.id} onClick={() => handleAssign(m.id)}
                        className={cn("w-full text-left px-3 py-2 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2",
                          m.id === assignee ? "text-primary font-bold" : "text-slate-300")}>
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">{initials(m.name)}</div>
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{m.name}</span>
                          <span className="text-[10px] text-slate-500">{m.activeOrders} commandes</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Delivery */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">cloud_upload</span>Livraison des fichiers
              </h3>
              {(order.status === "en_cours" || order.status === "revision") && (
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-semibold uppercase">
                  {order.status === "revision" ? "Re-livraison" : "Pret pour envoi"}
                </span>
              )}
            </div>
            <div className="border-2 border-dashed border-primary/20 rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileAdd} />
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">cloud_upload</span>
              </div>
              <p className="font-semibold text-white">Glissez-deposez vos fichiers ici</p>
              <p className="text-xs text-slate-500 mt-1">Format ZIP, FIG, PSD ou PDF (Max 500MB).</p>
              <button className="mt-4 px-4 py-2 border border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary/10 transition-colors">Parcourir</button>
            </div>
            {(draftFiles.length > 0 || order.files.length > 0) && (
              <div className="mt-5 space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3">Fichiers ({draftFiles.length + order.files.length})</p>
                {order.files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-background-dark rounded-lg border border-border-dark">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><span className="material-symbols-outlined text-primary">description</span></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{f.name}</p>
                      <p className="text-xs text-slate-500">{f.size} · {f.uploadedBy}</p>
                    </div>
                  </div>
                ))}
                {draftFiles.map((f, i) => (
                  <div key={`draft-${i}`} className="flex items-center gap-3 p-3 bg-background-dark rounded-lg border border-border-dark">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><span className="material-symbols-outlined text-primary">description</span></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{f.name}</p>
                      <p className="text-xs text-slate-500">{f.size} · Brouillon</p>
                    </div>
                    <button onClick={() => setDraftFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {(order.status === "en_cours" || order.status === "revision") && (
              <button onClick={() => setShowDeliverModal(true)} disabled={delivering}
                className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white font-bold rounded-lg text-sm hover:bg-emerald-600 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all">
                {delivering ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">local_shipping</span>}
                {delivering ? "Livraison..." : order.status === "revision" ? "Re-livrer les fichiers" : "Marquer comme livree"}
              </button>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">info</span>Details de la commande
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{order.category} · Forfait {order.packageType}</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[
                { label: "Date de commande", value: fmtDate(order.createdAt) },
                { label: "Deadline", value: fmtDate(order.deadline) },
                { label: "Progression", value: `${order.progress}%`, cls: "text-primary" },
                { label: "Revisions", value: `${order.revisionsLeft} restante(s)` },
              ].map((d) => (
                <div key={d.label} className="p-3 bg-background-dark rounded-lg border border-border-dark">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{d.label}</p>
                  <p className={cn("text-sm font-semibold mt-1", d.cls || "text-white")}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Panel */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">history</span>Historique
          </h3>
          {order.timeline.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Aucun evenement pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {order.timeline.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">event</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{ev.title}</p>
                    <p className="text-xs text-slate-400">{ev.description}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{fmtDate(ev.timestamp)} · {fmtTime(ev.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Client info */}
          <div className="border-t border-border-dark pt-4 mt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Client</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{initials(order.clientName)}</div>
              <div>
                <p className="text-sm font-bold text-white">{order.clientName}</p>
                <Link href="/agence/messages" className="text-xs text-primary hover:underline">Envoyer un message</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
