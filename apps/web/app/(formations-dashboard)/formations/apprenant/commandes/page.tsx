"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type OrderType = "formation" | "product" | "mentor";
type OrderStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "PENDING" | "CONFIRMED";

type Order = {
  id: string;
  type: OrderType;
  title: string;
  thumbnail: string | null;
  category: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  progress: number;
  instructeurUserId: string | null;
};

type FilterValue = "all" | OrderType;

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
function toEur(n: number)      { return Math.round(n / 655.957); }

const typeColors: Record<OrderType, string> = {
  formation: "bg-blue-100 text-blue-700",
  product:   "bg-amber-100 text-amber-700",
  mentor:    "bg-purple-100 text-purple-700",
};
const typeLabels: Record<OrderType, string> = {
  formation: "Formation vidéo",
  product:   "Produit numérique",
  mentor:    "Session mentor",
};
const typeIcons: Record<OrderType, string> = {
  formation: "play_circle",
  product:   "inventory_2",
  mentor:    "support_agent",
};

const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
  COMPLETED: { label: "Terminé",    className: "bg-[#006e2f]/10 text-[#006e2f]", icon: "check_circle" },
  ACTIVE:    { label: "En cours",   className: "bg-blue-100 text-blue-700",      icon: "schedule" },
  PENDING:   { label: "En attente", className: "bg-amber-100 text-amber-700",    icon: "hourglass_empty" },
  CONFIRMED: { label: "Confirmé",   className: "bg-blue-100 text-blue-700",      icon: "check" },
  CANCELLED: { label: "Annulé",     className: "bg-red-100 text-red-600",        icon: "cancel" },
  100:       { label: "Terminé",    className: "bg-[#006e2f]/10 text-[#006e2f]", icon: "check_circle" },
};

function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-start gap-4 p-4 md:p-5">
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export default function CommandesPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [contactingId, setContactingId] = useState<string | null>(null);

  async function handleContact(instructeurUserId: string, orderId: string) {
    setContactingId(orderId);
    try {
      const res = await fetch("/api/formations/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: instructeurUserId }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      router.push(`/formations/messages/${json.data.id}`);
    } catch {
      router.push("/formations/messages");
    } finally {
      setContactingId(null);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-commandes", activeFilter],
    queryFn: () => {
      const url = activeFilter === "all"
        ? "/api/formations/apprenant/commandes"
        : `/api/formations/apprenant/commandes?type=${activeFilter}`;
      return fetch(url).then((r) => r.json());
    },
    staleTime: 30_000,
  });

  const orders: Order[] = data?.data ?? [];

  const filters: { label: string; value: FilterValue }[] = [
    { label: "Tout",       value: "all" },
    { label: "Formations", value: "formation" },
    { label: "Produits",   value: "product" },
    { label: "Mentors",    value: "mentor" },
  ];

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes Commandes</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            {isLoading ? "Chargement…" : `${orders.length} commande${orders.length > 1 ? "s" : ""} au total`}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button key={f.value} onClick={() => setActiveFilter(f.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeFilter === f.value ? "text-white shadow-sm" : "bg-white border border-gray-200 text-[#5c647a] hover:border-[#006e2f]/30 hover:text-[#006e2f]"
            }`}
            style={activeFilter === f.value ? { background: "linear-gradient(to right, #006e2f, #22c55e)" } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[0,1,2,3].map((i) => <SkeletonRow key={i} />)}</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#5c647a]">receipt_long</span>
          </div>
          <h3 className="font-bold text-[#191c1e] mb-1">Aucune commande</h3>
          <p className="text-sm text-[#5c647a] mb-4">
            {activeFilter === "all" ? "Vous n'avez pas encore effectué de commande." : "Aucune commande dans cette catégorie."}
          </p>
          <Link href="/formations/explorer"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const type = order.type as OrderType;
            const statusKey = order.status === "COMPLETED" || order.progress >= 100 ? "COMPLETED" : order.status;
            const status = statusConfig[statusKey] ?? { label: order.status, className: "bg-gray-100 text-gray-700", icon: "info" };
            const icon = typeIcons[type] ?? "shopping_bag";
            const date = new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

            return (
              <div key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-start gap-4 p-4 md:p-5">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #006e2f 0%, #22c55e 100%)" }}>
                    <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-[#5c647a] font-medium mb-1 tabular-nums">#{order.id.slice(0, 12).toUpperCase()}</p>
                        <h3 className="font-bold text-[#191c1e] text-sm leading-snug line-clamp-2 mb-1">{order.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#5c647a]">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${typeColors[type] ?? "bg-gray-100 text-gray-700"}`}>
                            {typeLabels[type] ?? type}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                            {date}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap">
                        <div className="text-right">
                          <p className="font-extrabold text-[#191c1e] text-sm whitespace-nowrap">{formatFcfa(order.amount)}</p>
                          <p className="text-[10px] text-[#5c647a]">≈ {toEur(order.amount)} €</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${status.className}`}>
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{status.icon}</span>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/formations/apprenant/commandes/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-[14px] text-[#5c647a]">receipt_long</span>
                        Voir détails
                      </Link>
                      {type === "formation" && (
                        <Link href={`/formations/apprenant/formation/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                          <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                          Accéder
                        </Link>
                      )}
                      {order.instructeurUserId && (
                        <button
                          onClick={() => handleContact(order.instructeurUserId!, order.id)}
                          disabled={contactingId === order.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#006e2f]/30 text-xs font-semibold text-[#006e2f] hover:bg-[#006e2f]/5 transition-colors disabled:opacity-50">
                          {contactingId === order.id ? (
                            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-[14px]">forum</span>
                          )}
                          Contacter l'instructeur
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
