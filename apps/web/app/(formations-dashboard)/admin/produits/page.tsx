"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { promptAction } from "@/store/prompt";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StButton,
  StStatusPill,
  ST,
} from "@/components/stitch";
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  ExternalLink,
  Trash2,
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

const STATUS_LABELS: Record<string, string> = {
  ACTIF: "Live",
  EN_ATTENTE: "En attente",
  BROUILLON: "Brouillon",
  ARCHIVE: "Archivé",
  REFUSE: "Refusé",
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

  // Suppression avec motif obligatoire (le vendeur est notifié du motif).
  const deleteMutation = useMutation({
    mutationFn: ({ id, kind, reason }: { id: string; kind: string; reason: string }) =>
      fetch(`/api/formations/admin/produits/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, reason }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-produits"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });

  async function handleDelete(id: string, kind: string, title: string) {
    const reason = await promptAction({
      title: `Retirer « ${title} » du marketplace ?`,
      message: "Le produit n'est pas supprimé : il repasse en brouillon chez le vendeur, qui pourra le corriger et le resoumettre. Indiquez le motif (le vendeur en sera informé).",
      placeholder: "Ex : contenu non conforme aux conditions d'utilisation…",
      confirmLabel: "Remettre en brouillon",
      cancelLabel: "Annuler",
      icon: "drafts",
      multiline: true,
      validate: (v) => (v.trim().length < 3 ? "Le motif est obligatoire (au moins 3 caractères)." : null),
    });
    if (reason === null) return; // annulé
    deleteMutation.mutate({ id, kind, reason: reason.trim() });
  }

  const tabs = [
    { value: "all", label: "Tous", count: summary?.total ?? 0 },
    { value: "EN_ATTENTE", label: "En attente", count: summary?.pending ?? 0 },
    { value: "ACTIF", label: "Actifs", count: summary?.active ?? 0 },
    { value: "BROUILLON", label: "Brouillons", count: summary?.drafts ?? 0 },
    { value: "ARCHIVE", label: "Archivés", count: summary?.archived ?? 0 },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-5">
        <StPageHeader
          title="Produits"
          subtitle={
            isLoading
              ? "Chargement..."
              : `${summary?.total ?? 0} produits · ${summary?.pending ?? 0} en attente de validation`
          }
          actions={
            <StButton variant="secondary" icon={Download}>
              Exporter CSV
            </StButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <StKpiCompact
            label="Total catalogue"
            value={summary?.total ?? 0}
            icon={Package}
            tone="green"
          />
          <StKpiCompact
            label="En attente"
            value={summary?.pending ?? 0}
            icon={Clock}
            tone="amber"
          />
          <StKpiCompact
            label="Actifs"
            value={summary?.active ?? 0}
            icon={CheckCircle}
            tone="green"
          />
          <StKpiCompact
            label="Brouillons"
            value={summary?.drafts ?? 0}
            icon={FileEdit}
            tone="blue"
          />
        </div>

        {/* Filtres */}
        <StCard>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: ST.textMuted }}
              />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-[13.5px] font-semibold focus:outline-none transition-all"
                style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
              />
            </div>
            <div className="flex gap-1 flex-wrap p-1 rounded-[13px]" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
              {tabs.map((tab) => {
                const on = status === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatus(tab.value)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors whitespace-nowrap"
                    style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
                  >
                    {tab.label}
                    <span className="text-[10px] tabular-nums">· {tab.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </StCard>

        {/* Table */}
        <StCard noPadding>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl"
                  style={{ background: ST.divider }}
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center">
              {status === "ARCHIVE" ? (
                <Archive size={36} style={{ color: "#d6e0da" }} />
              ) : (
                <Package size={36} style={{ color: "#d6e0da" }} />
              )}
              <p className="text-[13.5px] font-extrabold mt-3" style={{ color: ST.text }}>Aucun produit</p>
              <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                {status === "EN_ATTENTE"
                  ? "Aucun produit en attente de validation."
                  : "Aucun produit ne correspond aux filtres."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {[
                      { h: "Produit", align: "text-left" },
                      { h: "Vendeur", align: "text-left" },
                      { h: "Ventes", align: "text-right" },
                      { h: "Revenus", align: "text-right" },
                      { h: "Statut", align: "text-left" },
                      { h: "Actions", align: "text-right" },
                    ].map((c) => (
                      <th
                        key={c.h}
                        className={`text-[10.5px] uppercase font-extrabold px-5 py-3 ${c.align}`}
                        style={{ color: ST.textMuted, letterSpacing: ".06em" }}
                      >
                        {c.h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-[#f7faf8]">
                      <td className="px-5 py-4" style={{ borderTop: `1px solid ${ST.divider}` }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                            style={{ background: ST.divider }}
                          >
                            {p.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.thumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : p.kind === "formation" ? (
                              <BookOpen className="w-5 h-5" style={{ color: ST.textMuted }} />
                            ) : (
                              <BookText className="w-5 h-5" style={{ color: ST.textMuted }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-extrabold truncate" style={{ color: ST.text }}>
                              {p.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: ST.textMuted }}>
                                {p.productType}
                              </span>
                              <span className="text-[10px]" style={{ color: ST.textFaint }}>·</span>
                              <span className="text-[10px] tabular-nums" style={{ color: ST.textMuted }}>
                                {formatFCFA(p.price)} FCFA
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4" style={{ borderTop: `1px solid ${ST.divider}` }}>
                        <p className="text-[12px] font-bold truncate max-w-[180px]" style={{ color: ST.text }}>
                          {p.seller}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right" style={{ borderTop: `1px solid ${ST.divider}` }}>
                        <p className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                          {p.sales}
                        </p>
                        {p.rating > 0 && (
                          <p className="text-[10px] tabular-nums" style={{ color: ST.amberText }}>
                            ★ {p.rating.toFixed(1)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right" style={{ borderTop: `1px solid ${ST.divider}` }}>
                        <p className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.green }}>
                          {formatFCFA(p.revenue)}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: ST.textFaint }}>
                          FCFA
                        </p>
                      </td>
                      <td className="px-5 py-4" style={{ borderTop: `1px solid ${ST.divider}` }}>
                        <StStatusPill status={p.status} label={STATUS_LABELS[p.status] ?? p.status} />
                      </td>
                      <td className="px-5 py-4" style={{ borderTop: `1px solid ${ST.divider}` }}>
                        <div className="flex gap-1.5 justify-end">
                          {p.status === "EN_ATTENTE" ? (
                            <>
                              <StButton
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
                              </StButton>
                              <StButton
                                variant="secondary"
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
                              </StButton>
                            </>
                          ) : p.slug ? (
                            <StButton
                              variant="secondary"
                              size="sm"
                              icon={ExternalLink}
                              href={
                                p.kind === "formation"
                                  ? `/formation/${p.slug}`
                                  : `/produit/${p.slug}`
                              }
                            >
                              Voir
                            </StButton>
                          ) : (
                            <span className="text-xs" style={{ color: ST.textFaint }}>—</span>
                          )}
                          {/* Retrait avec motif → repasse en brouillon (vendeur notifié) */}
                          <StButton
                            variant="secondary"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDelete(p.id, p.kind, p.title)}
                            disabled={deleteMutation.isPending}
                          >
                            Retirer
                          </StButton>
                        </div>
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
