"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  ExternalLink,
  BookOpen,
  BookText,
  Clock,
  Archive,
  FileEdit,
  Download,
} from "lucide-react";

type Product = {
  id: string;
  kind: "formation" | "product";
  title: string;
  slug?: string;
  price: number;
  thumbnail: string | null;
  status: string;
  createdAt: string;
  category: string;
  sales: number;
  rating: number;
  revenue: number;
  seller: string;
  productType: string;
};

type Summary = {
  total: number;
  pending: number;
  active: number;
  drafts: number;
  archived: number;
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

type StatusInfo = {
  label: string;
  variant: "green" | "orange" | "slate" | "rose";
};

const STATUS_CONFIG: Record<string, StatusInfo> = {
  ACTIF: { label: "Live", variant: "green" },
  EN_ATTENTE: { label: "En attente", variant: "orange" },
  BROUILLON: { label: "Brouillon", variant: "slate" },
  ARCHIVE: { label: "Archivé", variant: "slate" },
  REFUSE: { label: "Refusé", variant: "rose" },
};

export default function AdminProduitsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery<{
    data: Product[];
    summary: Summary;
  }>({
    queryKey: ["admin-produits", status, search],
    queryFn: () =>
      fetch(
        `/api/formations/admin/produits?status=${status}&search=${encodeURIComponent(search)}`
      ).then((r) => r.json()),
    staleTime: 15_000,
  });

  const products = response?.data ?? [];
  const summary = response?.summary;

  const actionMutation = useMutation({
    mutationFn: ({
      id,
      kind,
      action,
    }: {
      id: string;
      kind: string;
      action: string;
    }) =>
      fetch(`/api/formations/admin/produits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, action }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-produits"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });

  const tabs = [
    { value: "all", label: "Tous", count: summary?.total ?? 0 },
    { value: "EN_ATTENTE", label: "En attente", count: summary?.pending ?? 0 },
    { value: "ACTIF", label: "Actifs", count: summary?.active ?? 0 },
    { value: "BROUILLON", label: "Brouillons", count: summary?.drafts ?? 0 },
    { value: "ARCHIVE", label: "Archivés", count: summary?.archived ?? 0 },
  ];

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1600px] mx-auto space-y-8">
        <KazaHero
          badge="Admin"
          badgeColor="orange"
          icon={Package}
          title="Produits"
          subtitle={
            isLoading
              ? "Chargement..."
              : `${summary?.total ?? 0} produits · ${summary?.pending ?? 0} en attente de validation`
          }
          actions={
            <KazaButton variant="secondary" icon={Download}>
              Exporter CSV
            </KazaButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KazaKpiCard
            label="Total catalogue"
            value={summary?.total ?? 0}
            icon={Package}
            iconColor="navy"
          />
          <KazaKpiCard
            label="En attente"
            value={summary?.pending ?? 0}
            icon={Clock}
            iconColor="orange"
          />
          <KazaKpiCard
            label="Actifs"
            value={summary?.active ?? 0}
            icon={CheckCircle}
            iconColor="emerald"
          />
          <KazaKpiCard
            label="Brouillons"
            value={summary?.drafts ?? 0}
            icon={FileEdit}
            iconColor="sky"
          />
        </div>

        {/* Filtres */}
        <KazaCard>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap bg-slate-50 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatus(tab.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    status === tab.value
                      ? "bg-[#0b2540] text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${
                      status === tab.value
                        ? "bg-white/15 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </KazaCard>

        {/* Table */}
        <KazaCard noPadding>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-100 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-5">
              <KazaEmpty
                icon={status === "ARCHIVE" ? Archive : Package}
                title="Aucun produit"
                description={
                  status === "EN_ATTENTE"
                    ? "Aucun produit en attente de validation."
                    : "Aucun produit ne correspond aux filtres."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-5 py-3 text-left font-semibold">
                      Produit
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Vendeur
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Ventes
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Revenus
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Statut
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.BROUILLON;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {p.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.thumbnail}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : p.kind === "formation" ? (
                                <BookOpen className="w-5 h-5 text-slate-400" />
                              ) : (
                                <BookText className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {p.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                  {p.productType}
                                </span>
                                <span className="text-[10px] text-slate-300">
                                  ·
                                </span>
                                <span className="text-[10px] tabular-nums text-slate-500">
                                  {formatFCFA(p.price)} FCFA
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                            {p.seller}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-extrabold tabular-nums text-slate-900">
                            {p.sales}
                          </p>
                          {p.rating > 0 && (
                            <p className="text-[10px] tabular-nums text-amber-500">
                              ★ {p.rating.toFixed(1)}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-extrabold tabular-nums text-emerald-700">
                            {formatFCFA(p.revenue)}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            FCFA
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <KazaBadge variant={sc.variant}>{sc.label}</KazaBadge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 justify-end">
                            {p.status === "EN_ATTENTE" ? (
                              <>
                                <KazaButton
                                  variant="primary"
                                  size="sm"
                                  icon={CheckCircle}
                                  onClick={() =>
                                    actionMutation.mutate({
                                      id: p.id,
                                      kind: p.kind,
                                      action: "approve",
                                    })
                                  }
                                  disabled={actionMutation.isPending}
                                >
                                  Valider
                                </KazaButton>
                                <KazaButton
                                  variant="ghost"
                                  size="sm"
                                  icon={XCircle}
                                  onClick={() =>
                                    actionMutation.mutate({
                                      id: p.id,
                                      kind: p.kind,
                                      action: "reject",
                                    })
                                  }
                                  disabled={actionMutation.isPending}
                                >
                                  Refuser
                                </KazaButton>
                              </>
                            ) : p.slug ? (
                              <KazaButton
                                variant="ghost"
                                size="sm"
                                icon={ExternalLink}
                                href={
                                  p.kind === "formation"
                                    ? `/formation/${p.slug}`
                                    : `/produit/${p.slug}`
                                }
                              >
                                Voir
                              </KazaButton>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </KazaCard>
      </main>
    </div>
  );
}
