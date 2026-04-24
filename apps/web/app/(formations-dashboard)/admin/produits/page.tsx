"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

type Summary = { total: number; pending: number; active: number; drafts: number; archived: number };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  ACTIF: { label: "Live", bg: "bg-[#22c55e]", text: "text-[#004b1e]" },
  EN_ATTENTE: { label: "Review", bg: "bg-amber-400", text: "text-amber-900" },
  BROUILLON: { label: "Draft", bg: "bg-zinc-200", text: "text-zinc-700" },
  ARCHIVE: { label: "Archived", bg: "bg-zinc-200", text: "text-zinc-500" },
  REFUSE: { label: "Rejected", bg: "bg-[#ffdad6]", text: "text-[#93000a]" },
};

export default function AdminProduitsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery<{ data: Product[]; summary: Summary }>({
    queryKey: ["admin-produits", status, search],
    queryFn: () =>
      fetch(`/api/formations/admin/produits?status=${status}&search=${encodeURIComponent(search)}`).then((r) => r.json()),
    staleTime: 15_000,
  });

  const products = response?.data ?? [];
  const summary = response?.summary;

  const actionMutation = useMutation({
    mutationFn: ({ id, kind, action }: { id: string; kind: string; action: string }) =>
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
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1920px] mx-auto">
        {/* Header */}
        <header className="mb-12">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
            Catalogue Management
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
            Produits
          </h1>
          <p className="text-sm text-zinc-500 mt-3">
            {isLoading ? "Chargement…" : `${summary?.total ?? 0} produits · ${summary?.pending ?? 0} en attente de validation`}
          </p>
        </header>

        {/* Filters row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400">search</span>
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-zinc-100 focus:border-[#22c55e] py-4 pl-12 pr-6 text-sm placeholder:text-zinc-400 outline-none transition-colors"
            />
          </div>
          <div className="flex gap-0 flex-wrap border border-zinc-100 bg-white">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`flex items-center gap-2 px-5 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  status === tab.value
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {tab.label}
                <span className={`text-[9px] tabular-nums ${status === tab.value ? "text-[#22c55e]" : "text-zinc-400"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Products table */}
        <div className="bg-white">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_auto] gap-6 px-8 py-4 border-b border-zinc-100">
            {["Produit", "Vendeur", "Ventes", "Revenus", "Statut", "Actions"].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div className="p-8 space-y-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 bg-[#f3f3f4] animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Aucun produit</p>
              <p className="text-sm text-zinc-500">
                {status === "EN_ATTENTE" ? "Aucun produit en attente de validation." : "Aucun produit ne correspond aux filtres."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {products.map((p) => {
                const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.BROUILLON;
                return (
                  <div key={p.id} className="grid grid-cols-1 md:grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_auto] gap-6 px-8 py-5 items-center hover:bg-[#f3f3f4] transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 bg-[#f3f3f4] flex-shrink-0 overflow-hidden relative">
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-zinc-300">
                              {p.kind === "formation" ? "school" : "book"}
                            </span>
                          </div>
                        )}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#22c55e]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            {p.productType}
                          </span>
                          <span className="text-[10px] text-zinc-300">·</span>
                          <span className="text-[10px] tabular-nums text-zinc-500">{formatFCFA(p.price)} FCFA</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 truncate">{p.seller}</p>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold tabular-nums text-zinc-900">{p.sales}</p>
                      {p.rating > 0 && (
                        <p className="text-[10px] tabular-nums text-zinc-400 uppercase">★ {p.rating.toFixed(1)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold tabular-nums text-[#006e2f]">{formatFCFA(p.revenue)}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">FCFA</p>
                    </div>
                    <div>
                      <span className={`inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex gap-0">
                      {p.status === "EN_ATTENTE" ? (
                        <>
                          <button
                            onClick={() => actionMutation.mutate({ id: p.id, kind: p.kind, action: "approve" })}
                            disabled={actionMutation.isPending}
                            className="px-4 py-2 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors disabled:opacity-50"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => actionMutation.mutate({ id: p.id, kind: p.kind, action: "reject" })}
                            disabled={actionMutation.isPending}
                            className="px-4 py-2 bg-zinc-200 text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50"
                          >
                            Refuser
                          </button>
                        </>
                      ) : p.slug ? (
                        <Link
                          href={p.kind === "formation" ? `/formation/${p.slug}` : `/produit/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-zinc-100 text-zinc-700 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors inline-flex items-center gap-1"
                        >
                          Voir
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </Link>
                      ) : (
                        <span className="px-4 py-2 text-[10px] text-zinc-400 uppercase tracking-widest">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
