"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Wallet, Hourglass, XCircle, Search, Receipt } from "lucide-react";
import { StCard, StPageHeader, StKpi, StAvatar, ST } from "@/components/stitch";
import { useActiveShop } from "@/components/formations/ShopProvider";

type OrderStatus =
  | "paye" | "gratuit" | "offert" | "abonnement" | "pack" | "rembourse"
  | "en_attente" | "echoue" | "annule";

type Order = {
  id: string;
  buyerName: string;
  buyerEmail: string | null;
  avatar: string | null;
  productTitle: string;
  productType: string;
  amount: number;
  status: OrderStatus;
  date: string;
};

type Summary = {
  totalOrders: number;
  uniqueClients: number;
  revenuePaid: number;
  pending: number;
  cancelled: number;
};

// Une teinte DISTINCTE par statut (fond pâle + texte soutenu) — chaque état se
// reconnaît d'un coup d'œil.
const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  paye: { label: "Payé", bg: "#dcfce7", color: "#137a3f" },        // vert
  abonnement: { label: "Abonnement", bg: "#f3e8ff", color: "#7c3aed" }, // violet
  pack: { label: "Pack", bg: "#ccfbf1", color: "#0f766e" },        // turquoise
  offert: { label: "Offert", bg: "#dbeafe", color: "#1d4ed8" },    // bleu
  gratuit: { label: "Gratuit", bg: "#f1f5f9", color: "#475569" },  // gris ardoise
  en_attente: { label: "En attente", bg: "#fef3c7", color: "#b45309" }, // ambre
  echoue: { label: "Échoué", bg: "#fee2e2", color: "#b91c1c" },    // rouge
  annule: { label: "Abandonné", bg: "#ffedd5", color: "#c2410c" }, // orange
  rembourse: { label: "Remboursé", bg: "#fae8ff", color: "#a21caf" }, // magenta
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center text-[11px] font-extrabold rounded-full px-2.5 py-1" style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

export default function VendeurClientsPage() {
  const { scope } = useActiveShop();
  const { data: response, isLoading } = useQuery<{ data: { orders: Order[]; summary: Summary | null } }>({
    queryKey: ["vendeur-clients", scope],
    queryFn: () => fetch(`/api/formations/vendeur/clients?shopId=${encodeURIComponent(scope)}`).then((r) => r.json()),
    staleTime: 30_000,
  });

  const orders = response?.data?.orders ?? [];
  const summary = response?.data?.summary ?? null;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  // Filtres de statut présents dans les données (+ "Tous").
  const presentStatuses = useMemo(() => {
    const set = new Set<OrderStatus>();
    for (const o of orders) set.add(o.status);
    return [...set];
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.buyerName.toLowerCase().includes(q) ||
        (o.buyerEmail?.toLowerCase().includes(q) ?? false) ||
        o.productTitle.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Clients & commandes"
          subtitle="Tous vos acheteurs et le statut de chaque commande — payé, en attente, remboursé…"
        />

        {/* Résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
          <StKpi label="Clients" value={isLoading ? "…" : (summary?.uniqueClients ?? 0).toLocaleString("fr-FR")} icon={Users} />
          <StKpi label="Chiffre d'affaires encaissé" value={isLoading ? "…" : formatFCFA(summary?.revenuePaid ?? 0)} unit="FCFA" icon={Wallet} />
          <StKpi label="Paiements en attente" value={isLoading ? "…" : (summary?.pending ?? 0).toLocaleString("fr-FR")} icon={Hourglass} />
          <StKpi label="Échoués / abandonnés" value={isLoading ? "…" : (summary?.cancelled ?? 0).toLocaleString("fr-FR")} icon={XCircle} />
        </div>

        <StCard className="!p-[18px_20px]">
          {/* Recherche + filtres */}
          <div className="flex flex-col gap-3 mb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: ST.textFaint }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un client, un email, un produit…"
                className="w-full text-[13px] font-semibold rounded-xl pl-9 pr-3 py-2.5 outline-none"
                style={{ background: "#f7faf8", border: `1px solid ${ST.cardBorder}`, color: ST.text }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setStatusFilter("all")}
                className="text-[11.5px] font-extrabold rounded-lg px-2.5 py-1.5 transition-colors"
                style={statusFilter === "all" ? { background: ST.green, color: "#fff" } : { background: "#f1f5f2", color: ST.textSecondary }}
              >
                Tous
              </button>
              {presentStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="text-[11.5px] font-extrabold rounded-lg px-2.5 py-1.5 transition-colors"
                  style={statusFilter === s ? { background: ST.green, color: "#fff" } : { background: "#f1f5f2", color: ST.textSecondary }}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2.5">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: "#f3f6f4" }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14">
              <Receipt size={40} style={{ color: "#d6e0da" }} className="mx-auto" />
              <p className="text-[13px] font-bold mt-3" style={{ color: ST.textSecondary }}>
                {orders.length === 0 ? "Aucun client pour le moment" : "Aucun résultat pour ce filtre"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: ST.textFaint }}>
                    <th className="pb-2.5 pr-3">Client</th>
                    <th className="pb-2.5 pr-3">Produit</th>
                    <th className="pb-2.5 pr-3 text-right">Montant</th>
                    <th className="pb-2.5 pr-3">Statut</th>
                    <th className="pb-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} style={{ borderTop: `1px solid ${ST.divider}` }}>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <StAvatar name={o.buyerName} size={32} />
                          <div className="min-w-0">
                            <div className="text-[12.5px] font-extrabold truncate" style={{ color: ST.text }}>{o.buyerName}</div>
                            {o.buyerEmail && <div className="text-[11px] font-semibold truncate" style={{ color: "#7d9486" }}>{o.buyerEmail}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="text-[12.5px] font-bold truncate max-w-[220px]" style={{ color: ST.text }}>{o.productTitle}</div>
                        <div className="text-[11px] font-semibold" style={{ color: ST.textFaint }}>{o.productType}</div>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className="text-[12.5px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                          {formatFCFA(o.amount)} <span className="text-[10px]" style={{ color: ST.textFaint }}>FCFA</span>
                        </span>
                      </td>
                      <td className="py-3 pr-3"><StatusBadge status={o.status} /></td>
                      <td className="py-3 text-right text-[11.5px] font-semibold tabular-nums" style={{ color: ST.textSecondary }}>
                        {formatDate(o.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </StCard>
      </main>
    </div>
  );
}
