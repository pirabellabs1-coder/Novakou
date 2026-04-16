"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAgencyStore } from "@/store/agency";

// ---------------------------------------------------------------------------
// Escrow statuses mapped from order statuses
// ---------------------------------------------------------------------------
function getEscrowStatus(orderStatus: string | null | undefined): {
  label: string;
  color: string;
  icon: string;
  category: "escrow" | "validation" | "libere" | "rembourse" | "litige" | "all";
} {
  const s = (orderStatus || "").toLowerCase();
  switch (s) {
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
      return { label: "Rembourse", color: "text-slate-400 bg-slate-500/10", icon: "undo", category: "rembourse" };
    case "rembourse_partiel":
      return { label: "Remboursement partiel", color: "text-orange-400 bg-orange-500/10", icon: "undo", category: "rembourse" };
    case "litige":
    case "en_mediation":
      return { label: "Fonds geles", color: "text-red-400 bg-red-500/10", icon: "gavel", category: "litige" };
    default:
      return { label: "Inconnu", color: "text-slate-400 bg-slate-500/10", icon: "help", category: "all" };
  }
}

function getOrderEscrowSteps(orderStatus: string, amount: number | null | undefined) {
  const s = (orderStatus || "").toLowerCase();
  const safeAmount = amount ?? 0;
  const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("fr-FR");
  const steps = [
    { title: "Paiement Client Effectue", description: `Le client a effectue le paiement de ${fmt(safeAmount)} EUR.`, status: "completed" as const },
    { title: "Fonds Securises par FreelanceHigh", description: "Les fonds sont securises sur la plateforme.", status: "completed" as const },
    {
      title: "Validation des Livrables",
      description: "Le client examine les livrables. Une fois approuves, les fonds seront liberes.",
      status: (["livre", "revision"].includes(s) ? "in_progress" : ["termine", "annule"].includes(s) ? "completed" : "pending") as "completed" | "in_progress" | "pending",
    },
    {
      title: "Liberation des Fonds a l'Agence",
      description: "Apres validation, les fonds sont transferes vers le portefeuille de l'agence.",
      status: (s === "termine" ? "completed" : "pending") as "completed" | "pending",
    },
  ];

  if (s === "litige" || s === "en_mediation") {
    steps[2] = { ...steps[2], status: "in_progress", description: "Un litige est en cours. Les fonds restent geles." };
    steps[3] = { ...steps[3], status: "pending", description: "Les fonds seront liberes selon le verdict de la mediation." };
  }

  if (s === "rembourse_partiel") {
    steps[2] = { ...steps[2], status: "completed", description: "Les livrables ont ete partiellement valides." };
    steps[3] = { ...steps[3], status: "completed", description: "Les fonds ont ete partiellement liberes et le reste rembourse au client." };
  }

  return steps;
}

type FilterTab = "all" | "escrow" | "validation" | "libere" | "rembourse" | "litige";

export default function AgenceEscrowPage() {
  const { orders, syncOrders } = useAgencyStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    syncOrders();
  }, [syncOrders]);

  const allOrders = useMemo(() => {
    return (orders || []).map((o) => ({
      ...o,
      escrow: getEscrowStatus(o.status),
    }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return allOrders;
    return allOrders.filter((o) => o.escrow.category === activeFilter);
  }, [allOrders, activeFilter]);

  const summary = useMemo(() => {
    let inEscrow = 0;
    let released = 0;
    let inDispute = 0;
    for (const o of allOrders) {
      const amt = o.amount ?? 0;
      const s = (o.status || "").toLowerCase();
      if (["en_attente", "en_cours"].includes(s)) inEscrow += amt;
      else if (s === "termine") released += amt;
      else if (["litige", "en_mediation"].includes(s)) inDispute += amt;
    }
    return { inEscrow, released, inDispute, total: inEscrow + released + inDispute };
  }, [allOrders]);

  const selectedOrder = selectedOrderId
    ? allOrders.find((o) => o.id === selectedOrderId)
    : allOrders.find((o) => ["en_attente", "en_cours", "livre", "revision", "litige", "en_mediation"].includes((o.status || "").toLowerCase()));

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Tous", count: allOrders.length },
    { key: "escrow", label: "En escrow", count: allOrders.filter((o) => o.escrow.category === "escrow").length },
    { key: "validation", label: "En validation", count: allOrders.filter((o) => o.escrow.category === "validation").length },
    { key: "libere", label: "Liberes", count: allOrders.filter((o) => o.escrow.category === "libere").length },
    { key: "rembourse", label: "Rembourses", count: allOrders.filter((o) => o.escrow.category === "rembourse").length },
    { key: "litige", label: "Litiges", count: allOrders.filter((o) => o.escrow.category === "litige").length },
  ];

  const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("fr-FR");

  return (
    <div className="max-w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
          Securite des Paiements — Escrow Agence
        </h2>
        <p className="text-slate-400 mt-1">
          Suivez les fonds bloques, en validation et liberes pour les commandes de votre agence.
        </p>
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

      {/* Escrow Steps for selected order */}
      {selectedOrder && (
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">swap_vert</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg">Flux de Securisation</h3>
                <p className="text-xs text-slate-500 truncate">{selectedOrder.serviceTitle || "Service"} — {selectedOrder.clientName || "Client"}</p>
              </div>
            </div>
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit flex-shrink-0", selectedOrder.escrow.color)}>
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
                      {isCompleted && <span className="text-[10px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Complete</span>}
                      {isInProgress && <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">En cours</span>}
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
          <h3 className="font-bold flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
            Commandes Agence avec Escrow ({filteredOrders.length})
          </h3>
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
              className={cn("flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-primary/5 transition-colors w-full text-left",
                selectedOrderId === order.id && "bg-primary/5")}>
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {(order.clientName || "CL").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{order.serviceTitle || "Service"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{order.clientName || "Client"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 pl-[52px] sm:pl-0">
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0", order.escrow.color)}>
                  <span className="material-symbols-outlined text-sm">{order.escrow.icon}</span>
                  <span className="hidden sm:inline">{order.escrow.label}</span>
                  <span className="sm:hidden">{order.escrow.label.split(" ")[0]}</span>
                </span>
                <p className="text-sm font-bold flex-shrink-0">&euro;{fmt(order.amount ?? 0)}</p>
              </div>
            </button>
          ))}
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
            Notre equipe est disponible pour repondre a vos questions sur l&apos;escrow et les litiges.
          </p>
          <Link href="/agence/aide"
            className="flex items-center gap-2 w-fit px-4 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
            <span className="material-symbols-outlined text-lg">headset_mic</span>
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  );
}
