"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import type { Order } from "@/lib/demo-data";

const TABS = [
  { label: "Toutes", filter: null },
  { label: "En attente", filter: "en_attente" },
  { label: "En cours", filter: "en_cours" },
  { label: "Livrées", filter: "livre" },
  { label: "Révision", filter: "revision" },
  { label: "Terminées", filter: "termine" },
  { label: "Annulées", filter: "annule" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  en_attente: { label: "En attente", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: "schedule" },
  en_cours: { label: "En cours", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: "play_circle" },
  livre: { label: "Livré", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: "local_shipping" },
  revision: { label: "Révision", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: "edit_note" },
  termine: { label: "Terminé", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: "check_circle" },
  annule: { label: "Annulé", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: "cancel" },
  litige: { label: "Litige", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: "gavel" },
};

export default function CommandesPage() {
  const { orders, updateOrderStatus, apiAcceptOrder, apiDeliverOrder } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const filtered = useMemo(() => {
    let result = [...orders];
    if (activeTab) result = result.filter((o) => o.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.serviceTitle.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => sortBy === "amount" ? b.amount - a.amount : b.createdAt.localeCompare(a.createdAt));
    return result;
  }, [orders, activeTab, search, sortBy]);

  const stats = useMemo(() => ({
    total: orders.length,
    active: orders.filter((o) => ["en_cours", "en_attente", "revision"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "termine").length,
    revenue: orders.filter((o) => ["termine", "livre"].includes(o.status)).reduce((s, o) => s + o.amount, 0),
  }), [orders]);

  async function handleQuickAction(order: Order, action: string) {
    if (action === "start" && order.status === "en_attente") {
      const success = await apiAcceptOrder(order.id);
      if (!success) updateOrderStatus(order.id, "en_cours");
      addToast("success", `Commande ${order.id} démarrée`);
    } else if (action === "deliver" && order.status === "en_cours") {
      const success = await apiDeliverOrder(order.id, "Livraison effectuée", []);
      if (!success) updateOrderStatus(order.id, "livre");
      addToast("success", `Commande ${order.id} livrée`);
    }
  }

  function getDaysLeft(deadline: string): number {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="max-w-full space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Commandes</h2>
        <p className="text-slate-400 mt-1">Gerez et suivez toutes vos commandes en cours.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-3 sm:p-4 lg:p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1">{stats.total}</p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-3 sm:p-4 lg:p-5">
          <p className="text-xs font-bold text-blue-400 uppercase">Actives</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1">{stats.active}</p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-3 sm:p-4 lg:p-5">
          <p className="text-xs font-bold text-emerald-400 uppercase">Terminées</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1">{stats.completed}</p>
        </div>
        <div className="bg-background-dark/50 border border-border-dark rounded-xl p-3 sm:p-4 lg:p-5">
          <p className="text-xs font-bold text-primary uppercase">Revenus</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1">€{stats.revenue.toLocaleString("fr-FR")}</p>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
          <input type="text" placeholder="Rechercher par service, client ou ID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background-dark/50 border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
          className="px-4 py-2.5 bg-background-dark/50 border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="date">Plus recentes</option>
          <option value="amount">Montant decroissant</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((tab) => {
          const count = tab.filter ? orders.filter((o) => o.status === tab.filter).length : orders.length;
          const isActive = activeTab === tab.filter;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.filter)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
                isActive ? "bg-primary text-white" : "bg-background-dark/50 border border-border-dark text-slate-400 hover:border-primary/50"
              )}
            >
              {tab.label}
              <span className={cn("text-xs px-1.5 py-0.5 rounded", isActive ? "bg-white/20" : "bg-border-dark")}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-3 sm:space-y-4">
        {filtered.length === 0 && (
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-8 sm:p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">inbox</span>
            <p className="text-slate-500">Aucune commande trouvee.</p>
          </div>
        )}
        {filtered.map((order) => {
          const sc = STATUS_CONFIG[order.status];
          const daysLeft = getDaysLeft(order.deadline);
          return (
            <Link key={order.id} href={`/dashboard/commandes/${order.id}`}
              className="block bg-background-dark/50 border border-border-dark rounded-xl p-3 sm:p-4 lg:p-5 hover:border-primary/30 transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {order.clientAvatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{order.serviceTitle}</p>
                      <span className="text-xs text-slate-500">{order.id}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{order.clientName}</span>
                      <span>·</span>
                      <span className="uppercase">{order.clientCountry}</span>
                      <span>·</span>
                      <span className="capitalize">{order.packageType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Deadline */}
                  {["en_cours", "en_attente", "revision"].includes(order.status) && (
                    <div className={cn("text-xs font-bold", daysLeft <= 2 ? "text-red-400" : daysLeft <= 5 ? "text-amber-400" : "text-slate-400")}>
                      {daysLeft > 0 ? `${daysLeft}j restants` : "En retard"}
                    </div>
                  )}

                  {/* Amount */}
                  <p className="text-sm font-bold">€{order.amount.toLocaleString("fr-FR")}</p>

                  {/* Status */}
                  <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border", sc?.color)}>
                    <span className="material-symbols-outlined text-sm">{sc?.icon}</span>
                    {sc?.label}
                  </span>

                  {/* Quick actions */}
                  {order.status === "en_attente" && (
                    <button onClick={(e) => { e.preventDefault(); handleQuickAction(order, "start"); }}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all">
                      Demarrer
                    </button>
                  )}
                  {order.status === "en_cours" && (
                    <button onClick={(e) => { e.preventDefault(); handleQuickAction(order, "deliver"); }}
                      className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all">
                      Livrer
                    </button>
                  )}

                  <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">arrow_forward</span>
                </div>
              </div>

              {/* Progress bar */}
              {["en_cours", "revision"].includes(order.status) && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Progression</span>
                    <span className="font-bold text-primary">{order.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-border-dark rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${order.progress}%` }} />
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
