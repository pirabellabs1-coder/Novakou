"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";

// ---------------------------------------------------------------------------
// Escrow statuses mapped from order statuses
// ---------------------------------------------------------------------------
function getEscrowStatus(orderStatus: string): {
  label: string;
  color: string;
  icon: string;
  category: "escrow" | "validation" | "libere" | "litige" | "all";
} {
  switch (orderStatus) {
    case "en_attente":
      return { label: "Fonds en depot", color: "text-amber-400 bg-amber-500/10", icon: "hourglass_top", category: "escrow" };
    case "en_cours":
      return { label: "Escrow actif", color: "text-primary bg-primary/10", icon: "lock", category: "escrow" };
    case "livre":
      return { label: "En validation", color: "text-blue-400 bg-blue-500/10", icon: "pending", category: "validation" };
    case "revision":
      return { label: "En revision", color: "text-orange-400 bg-orange-500/10", icon: "rate_review", category: "validation" };
    case "termine":
      return { label: "Fonds liberes", color: "text-emerald-400 bg-emerald-500/10", icon: "check_circle", category: "libere" };
    case "annule":
      return { label: "Rembourse", color: "text-slate-400 bg-slate-500/10", icon: "undo", category: "libere" };
    case "litige":
      return { label: "Fonds geles", color: "text-red-400 bg-red-500/10", icon: "gavel", category: "litige" };
    default:
      return { label: "Inconnu", color: "text-slate-400 bg-slate-500/10", icon: "help", category: "all" };
  }
}

// ---------------------------------------------------------------------------
// Dynamic escrow steps for a given order
// ---------------------------------------------------------------------------
function getOrderEscrowSteps(orderStatus: string, amount: number) {
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const steps = [
    {
      title: "Paiement Client Effectue",
      description: `Le client a effectue le paiement de ${fmt(amount)} EUR. Les fonds ont ete recus et verifies.`,
      status: "completed" as const,
    },
    {
      title: "Fonds Securises par FreelanceHigh",
      description: "Les fonds sont securises sur la plateforme. Aucune partie ne peut y acceder unilateralement avant validation.",
      status: "completed" as const,
    },
    {
      title: "Validation des Livrables",
      description: "Le client examine les livrables soumis par le freelance. Une fois approuves, les fonds seront liberes.",
      status: (["livre", "revision"].includes(orderStatus) ? "in_progress" : ["termine", "annule"].includes(orderStatus) ? "completed" : "pending") as "completed" | "in_progress" | "pending",
    },
    {
      title: "Liberation des Fonds au Freelance",
      description: "Apres validation par le client, les fonds sont transferes vers le portefeuille du freelance.",
      status: (orderStatus === "termine" ? "completed" : "pending") as "completed" | "pending",
    },
  ];

  // Special case: litige
  if (orderStatus === "litige") {
    steps[2] = { ...steps[2], status: "in_progress", description: "Un litige est en cours. Les fonds restent geles jusqu'a resolution par l'equipe FreelanceHigh." };
    steps[3] = { ...steps[3], status: "pending", description: "Les fonds seront liberes selon le verdict de l'equipe de mediation." };
  }

  return steps;
}

type FilterTab = "all" | "escrow" | "validation" | "libere" | "litige";

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function EscrowPage() {
  const { orders } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // All orders with their derived escrow status
  const allOrders = useMemo(() => {
    return orders.map((o) => ({
      ...o,
      escrow: getEscrowStatus(o.status),
    }));
  }, [orders]);

  // Filter
  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return allOrders;
    return allOrders.filter((o) => o.escrow.category === activeFilter);
  }, [allOrders, activeFilter]);

  // Summary computed from orders
  const summary = useMemo(() => {
    let inEscrow = 0;
    let released = 0;
    let inDispute = 0;
    for (const o of allOrders) {
      const amt = o.amount ?? 0;
      if (["en_attente", "en_cours"].includes(o.status)) inEscrow += amt;
      else if (o.status === "termine") released += amt;
      else if (o.status === "litige") inDispute += amt;
    }
    return { inEscrow, released, inDispute, total: inEscrow + released + inDispute };
  }, [allOrders]);

  // Timeline from real order events
  const recentTimeline = useMemo(() => {
    const events: { time: string; text: string; icon: string; color: string }[] = [];
    for (const o of orders) {
      for (const t of (o.timeline || [])) {
        events.push({
          time: t.timestamp,
          text: `${t.title} — ${o.serviceTitle}`,
          icon: t.type === "delivered" ? "upload_file" : t.type === "completed" ? "check_circle" : t.type === "started" ? "play_arrow" : "event",
          color: t.type === "completed" ? "text-emerald-400" : t.type === "delivered" ? "text-blue-400" : "text-primary",
        });
      }
    }
    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return events.slice(0, 6);
  }, [orders]);

  // Selected order for step display
  const selectedOrder = selectedOrderId ? allOrders.find((o) => o.id === selectedOrderId) : allOrders.find((o) => ["en_attente", "en_cours", "livre", "revision", "litige"].includes(o.status));

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Tous", count: allOrders.length },
    { key: "escrow", label: "En escrow", count: allOrders.filter((o) => o.escrow.category === "escrow").length },
    { key: "validation", label: "En validation", count: allOrders.filter((o) => o.escrow.category === "validation").length },
    { key: "libere", label: "Liberes", count: allOrders.filter((o) => o.escrow.category === "libere").length },
    { key: "litige", label: "Litiges", count: allOrders.filter((o) => o.escrow.category === "litige").length },
  ];

  const fmt = (n: number) => n.toLocaleString("fr-FR");

  function formatTimeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "A l'instant";
    if (min < 60) return `Il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h}h`;
    const d = Math.floor(h / 24);
    return `Il y a ${d}j`;
  }

  return (
    <div className="max-w-full space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            Securite des Paiements par Escrow
          </h2>
          <p className="text-slate-400 mt-1">
            Vos fonds sont proteges par le systeme d&apos;escrow FreelanceHigh. Chaque etape est tracable et securisee.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary rounded-xl p-5 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
          <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">En escrow</p>
          <p className="text-3xl font-extrabold">{fmt(summary.inEscrow)} <span className="text-sm font-bold text-white/70">EUR</span></p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Liberes</p>
          <p className="text-3xl font-extrabold text-emerald-400">{fmt(summary.released)} <span className="text-sm font-bold text-slate-500">EUR</span></p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">En litige</p>
          <p className="text-3xl font-extrabold text-red-400">{fmt(summary.inDispute)} <span className="text-sm font-bold text-slate-500">EUR</span></p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Total transite</p>
          <p className="text-3xl font-extrabold">{fmt(summary.total)} <span className="text-sm font-bold text-slate-500">EUR</span></p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN — Escrow Steps + Orders */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Escrow Steps for selected order */}
          {selectedOrder && (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">swap_vert</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Flux de Securisation</h3>
                  <p className="text-xs text-slate-500">{selectedOrder.serviceTitle} — {selectedOrder.clientName}</p>
                </div>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5", selectedOrder.escrow.color)}>
                  <span className="material-symbols-outlined text-sm">{selectedOrder.escrow.icon}</span>
                  {selectedOrder.escrow.label}
                </span>
              </div>

              <div className="space-y-0">
                {getOrderEscrowSteps(selectedOrder.status, selectedOrder.amount).map((step, idx, arr) => {
                  const isCompleted = step.status === "completed";
                  const isInProgress = step.status === "in_progress";
                  const isPending = step.status === "pending";
                  const isLast = idx === arr.length - 1;
                  return (
                    <div key={idx} className="relative flex gap-4">
                      {!isLast && (
                        <div className={cn("absolute left-[19px] top-10 w-0.5 bottom-0",
                          isCompleted ? "bg-emerald-500/40" : isInProgress ? "bg-primary/30" : "bg-border-dark")} />
                      )}
                      <div className="relative z-10 flex-shrink-0">
                        {isCompleted && (
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-400 text-lg">check</span>
                          </div>
                        )}
                        {isInProgress && (
                          <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary border-dashed flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-primary text-lg">pending</span>
                          </div>
                        )}
                        {isPending && (
                          <div className="w-10 h-10 rounded-full bg-neutral-dark border-2 border-border-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-500 text-lg">lock</span>
                          </div>
                        )}
                      </div>
                      <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn("font-bold text-sm",
                            isCompleted && "text-emerald-400", isInProgress && "text-white", isPending && "text-slate-500")}>
                            {step.title}
                          </h4>
                          {isCompleted && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Complete</span>}
                          {isInProgress && <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">En cours</span>}
                          {isPending && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-600/10 px-2 py-0.5 rounded-full">En attente</span>}
                        </div>
                        <p className={cn("text-sm leading-relaxed", isPending ? "text-slate-600" : "text-slate-400")}>{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orders with Escrow Status */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-dark">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                  Commandes avec Escrow ({filteredOrders.length})
                </h3>
              </div>
              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap">
                {filterTabs.map((tab) => (
                  <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
                    className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
                      activeFilter === tab.key ? "bg-primary text-white" : "bg-background-dark/50 text-slate-400 hover:text-white hover:bg-primary/10")}>
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-border-dark">
              {filteredOrders.length === 0 && (
                <div className="p-12 text-center text-slate-500">Aucune commande dans cette categorie.</div>
              )}
              {filteredOrders.map((order) => (
                <button key={order.id} onClick={() => setSelectedOrderId(order.id)}
                  className={cn("flex items-center gap-4 px-6 py-4 hover:bg-primary/5 transition-colors w-full text-left",
                    selectedOrderId === order.id && "bg-primary/5")}>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {order.clientAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{order.serviceTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{order.id} &middot; {order.clientName}</p>
                  </div>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5", order.escrow.color)}>
                    <span className="material-symbols-outlined text-sm">{order.escrow.icon}</span>
                    {order.escrow.label}
                  </span>
                  <p className="text-sm font-bold w-20 text-right flex-shrink-0">&euro;{fmt(order.amount ?? 0)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Summary, Security, Timeline */}
        <div className="flex flex-col gap-6">
          {/* Security Info Card */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary text-xl">gpp_good</span>
              <h3 className="font-bold">Garanties FreelanceHigh</h3>
            </div>
            <div className="space-y-4">
              {[
                { title: "Protection Escrow", description: "Fonds securises jusqu'a validation du client", icon: "verified_user" },
                { title: "Mediation Gratuite", description: "Equipe de mediation disponible en cas de litige", icon: "support_agent" },
                { title: "Historique Complet", description: "Toutes les transactions sont tracees et verifiables", icon: "history" },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-lg">{feature.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{feature.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Timeline */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">timeline</span>
              Activite Recente
            </h3>
            <div className="space-y-3">
              {recentTimeline.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Aucune activite recente.</p>
              ) : (
                recentTimeline.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary/5 transition-colors">
                    <span className={cn("material-symbols-outlined text-lg", event.color)}>{event.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-300 truncate">{event.text}</p>
                      <p className="text-[10px] text-slate-600">{formatTimeAgo(event.time)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Help Box */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="material-symbols-outlined text-5xl text-primary/10">support_agent</span>
            </div>
            <div className="relative z-10">
              <h3 className="font-bold mb-2">Besoin d&apos;aide ?</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Notre equipe est disponible pour repondre a vos questions sur l&apos;escrow, les litiges et la liberation des fonds.
              </p>
              <Link href="/dashboard/aide"
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                <span className="material-symbols-outlined text-lg">headset_mic</span>
                Contacter le support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
