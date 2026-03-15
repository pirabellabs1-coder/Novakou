"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/dashboard";
import { ordersApi } from "@/lib/api-client";
import { OrderPhasePipeline } from "@/components/ui/order-phase-pipeline";

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
const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase();

export default function AgenceCommandeDetail() {
  const { id } = useParams();
  const orderId = id as string;
  const { orders, members, syncAll, deliverOrder } = useAgencyStore();
  const addToast = useToastStore((s) => s.addToast);
  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  const [assignee, setAssignee] = useState("");
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [draftFiles, setDraftFiles] = useState<{ name: string; size: string }[]>([]);
  const [delivering, setDelivering] = useState(false);
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

  async function handleDeliver() {
    setDelivering(true);
    const ok = await deliverOrder(orderId, "Livraison effectuee par l'agence");
    addToast(ok ? "success" : "error", ok ? "Commande livree avec succes !" : "Erreur lors de la livraison");
    if (ok) setDraftFiles([]);
    setDelivering(false);
  }

  return (
    <div className="space-y-6">
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
            <span className="font-bold text-white">{"\u20AC"}{order.amount.toLocaleString("fr-FR")}</span>
          </div>
        </div>
        {sc && (
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full", sc.color)}>
            <span className="material-symbols-outlined text-sm">{sc.icon}</span>{sc.label}
          </span>
        )}
      </div>

      <OrderPhasePipeline status={order.status} revisionsLeft={order.revisionsLeft} timeline={order.timeline} />

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
              {order.status === "en_cours" && (
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-semibold uppercase">Pret pour envoi</span>
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
            {order.status === "en_cours" && (
              <button onClick={handleDeliver} disabled={delivering}
                className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white font-bold rounded-lg text-sm hover:bg-emerald-600 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all">
                {delivering ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">local_shipping</span>}
                {delivering ? "Livraison..." : "Marquer comme livree"}
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

        {/* Chat Panel */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark flex flex-col h-[700px]">
          <div className="p-4 border-b border-border-dark flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{initials(order.clientName)}</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{order.clientName}</p>
              <p className="text-xs text-primary flex items-center gap-1"><span className="w-2 h-2 bg-primary rounded-full animate-pulse" />Client</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {order.messages.length === 0 && (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">chat</span>
                <p className="text-sm text-slate-500">Aucun message pour le moment.</p>
              </div>
            )}
            {order.messages.map((m) => {
              const isAgency = m.sender !== order.clientId;
              return (
                <div key={m.id} className={cn("flex", isAgency ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] px-4 py-2.5 text-sm leading-relaxed",
                    isAgency ? "bg-primary text-background-dark rounded-2xl rounded-tr-none" : "bg-background-dark text-slate-200 rounded-2xl rounded-tl-none border border-border-dark")}>
                    <p className={cn("text-[10px] font-bold mb-1", isAgency ? "text-background-dark/70" : "text-slate-400")}>{m.senderName}</p>
                    <p>{m.content}</p>
                    <p className={cn("text-[10px] mt-1 text-right", isAgency ? "text-background-dark/60" : "text-slate-500")}>{fmtTime(m.timestamp)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-border-dark flex items-center gap-2">
            <button className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined">attach_file</span></button>
            <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder="Votre message..."
              className="flex-1 px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50" />
            <button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-background-dark hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
