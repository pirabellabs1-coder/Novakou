"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useClientStore } from "@/store/client";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "en_cours", label: "En cours" },
  { key: "livre", label: "Livrées" },
  { key: "termine", label: "Terminées" },
  { key: "litige", label: "Litige" },
];

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-slate-500/20 text-slate-400" },
  en_cours: { label: "En cours", cls: "bg-blue-500/20 text-blue-400" },
  livre: { label: "Livré", cls: "bg-primary/20 text-primary" },
  revision: { label: "Révision", cls: "bg-orange-500/20 text-orange-400" },
  termine: { label: "Terminé", cls: "bg-slate-500/20 text-slate-400" },
  litige: { label: "Litige", cls: "bg-red-500/20 text-red-400" },
  annule: { label: "Annulé", cls: "bg-red-500/20 text-red-400" },
};

function SkeletonRow() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-border-dark" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-border-dark rounded" />
            <div className="h-3 w-64 bg-border-dark rounded" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-5 w-16 bg-border-dark rounded-full" />
          <div className="h-5 w-16 bg-border-dark rounded" />
          <div className="h-5 w-5 bg-border-dark rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ClientOrders() {
  const {
    orders,
    orderFilter,
    setOrderFilter,
    syncOrders,
    loading,
  } = useClientStore();

  useEffect(() => {
    syncOrders();
  }, [syncOrders]);

  const filtered = useMemo(() => {
    if (orderFilter === "all") return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      en_cours: orders.filter((o) => o.status === "en_cours").length,
      livre: orders.filter((o) => o.status === "livre").length,
      termine: orders.filter((o) => o.status === "termine").length,
      litige: orders.filter((o) => o.status === "litige").length,
    }),
    [orders],
  );

  const isLoading = loading.orders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mes Commandes</h1>
        <p className="text-slate-400 text-sm mt-1">
          {isLoading
            ? "Chargement..."
            : `${orders.length} commande${orders.length !== 1 ? "s" : ""} — Suivez l'avancement de vos commandes`}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: counts.all, icon: "receipt_long", color: "text-white" },
          { label: "En cours", value: counts.en_cours, icon: "construction", color: "text-blue-400" },
          { label: "Livrées", value: counts.livre, icon: "local_shipping", color: "text-primary" },
          { label: "Terminées", value: counts.termine, icon: "check_circle", color: "text-slate-400" },
          { label: "Litiges", value: counts.litige, icon: "gavel", color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-dark rounded-xl border border-border-dark p-3 flex items-center gap-3">
            <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
            <div>
              <p className={cn("text-lg font-black", s.color)}>{isLoading ? "-" : s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setOrderFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              orderFilter === f.key
                ? "bg-primary text-background-dark"
                : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white",
            )}
          >
            {f.label}
            {!isLoading && (
              <span
                className={cn(
                  "ml-2 text-xs px-1.5 py-0.5 rounded-full",
                  orderFilter === f.key ? "bg-background-dark/20" : "bg-border-dark",
                )}
              >
                {counts[f.key as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">inbox</span>
            <p className="text-slate-500 font-semibold">
              {orderFilter === "all"
                ? "Vous n'avez pas encore de commandes"
                : "Aucune commande dans cette catégorie"}
            </p>
            <p className="text-slate-600 text-sm mt-1">
              Explorez le marketplace pour trouver des services et passer votre première commande.
            </p>
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-background-dark text-sm font-bold rounded-lg hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              Explorer les services
            </Link>
          </div>
        ) : (
          filtered.map((o) => {
            const statusInfo = STATUS_LABELS[o.status] || STATUS_LABELS.en_cours;
            return (
              <Link
                key={o.id}
                href={`/client/commandes/${o.id}`}
                className="block w-full bg-neutral-dark rounded-xl border border-border-dark p-5 hover:border-primary/30 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">shopping_bag</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">{o.serviceTitle}</p>
                      <p className="text-xs text-slate-500">
                        #{o.id.slice(-4)} -- {o.clientName}{" "}
                        {o.freelanceId && `-- Freelance: ${o.freelanceId}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", statusInfo.cls)}>
                      {statusInfo.label}
                    </span>
                    <span className="text-lg font-bold text-white">{o.amount.toLocaleString("fr-FR")} EUR</span>
                    <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                  </div>
                </div>
                {o.status === "en_cours" && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-border-dark rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${o.progress}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-primary">{o.progress}%</span>
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
