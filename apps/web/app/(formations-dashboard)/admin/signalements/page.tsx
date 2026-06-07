"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
import {
  Flag,
  Search,
  Download,
  AlertTriangle,
  Banknote,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  FilterX,
  Inbox,
  Clock,
} from "lucide-react";

type Report = {
  id: string;
  reason: string;
  createdAt: string;
  user: { name: string | null; email: string };
  discussion: {
    id: string;
    title: string;
    content: string;
    reportCount: number;
    status: string;
    formation: { title: string };
    user: { name: string | null };
  } | null;
  reply: {
    id: string;
    content: string;
    reportCount: number;
    user: { name: string | null };
  } | null;
};

type RefundRequest = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  status: string;
  user: { name: string | null; email: string };
  enrollment: { id: string; paidAmount: number; formation: { title: string } };
};

type Data = { reports: Report[]; refundRequests: RefundRequest[] };
type Summary = {
  totalReports: number;
  totalRefunds: number;
  pendingRefundAmount: number;
};
type Period = "all" | "7d" | "30d" | "90d" | "custom";

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 24) return `${h}h`;
  return `${d}j`;
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harcèlement",
  inappropriate: "Inapproprié",
  "off-topic": "Hors-sujet",
};

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function periodCutoff(period: Period, customSince: string): number {
  if (period === "all") return -Infinity;
  if (period === "custom") {
    if (!customSince) return -Infinity;
    const t = new Date(customSince).getTime();
    return Number.isFinite(t) ? t : -Infinity;
  }
  const map: Record<Exclude<Period, "all" | "custom">, number> = {
    "7d": 7 * 86400_000,
    "30d": 30 * 86400_000,
    "90d": 90 * 86400_000,
  };
  return Date.now() - map[period];
}

export default function AdminSignalementsPage() {
  const [tab, setTab] = useState<"reports" | "refunds">("reports");
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [customSince, setCustomSince] = useState("");

  const [selectedReports, setSelectedReports] = useState<Set<string>>(
    new Set()
  );
  const [bulkRunning, setBulkRunning] = useState(false);
  function toggleReportSelection(id: string) {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function clearSelection() {
    setSelectedReports(new Set());
  }

  const { data: response, isLoading } = useQuery<{
    data: Data;
    summary: Summary | null;
  }>({
    queryKey: ["admin-signalements"],
    queryFn: () =>
      fetch("/api/formations/admin/signalements").then((r) => r.json()),
    staleTime: 15_000,
  });

  const reports = response?.data?.reports ?? [];
  const refunds = response?.data?.refundRequests ?? [];
  const summary = response?.summary;

  const cutoff = useMemo(
    () => periodCutoff(period, customSince),
    [period, customSince]
  );

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      const ts = new Date(r.createdAt).getTime();
      if (ts < cutoff) return false;
      if (!q) return true;
      const haystack = [
        r.reason,
        r.user.name ?? "",
        r.user.email,
        r.discussion?.title ?? "",
        r.discussion?.content ?? "",
        r.discussion?.formation.title ?? "",
        r.discussion?.user.name ?? "",
        r.reply?.content ?? "",
        r.reply?.user.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [reports, search, cutoff]);

  const filteredRefunds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return refunds.filter((r) => {
      const ts = new Date(r.createdAt).getTime();
      if (ts < cutoff) return false;
      if (!q) return true;
      const haystack = [
        r.reason,
        r.user.name ?? "",
        r.user.email,
        r.enrollment.formation.title,
        String(r.amount),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [refunds, search, cutoff]);

  const reportMut = useMutation({
    mutationFn: async (args: {
      id: string;
      action: "delete_content" | "dismiss";
    }) => {
      const res = await fetch(
        `/api/formations/admin/signalements/${args.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: args.action }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      return json;
    },
    onSuccess: (_d, args) => {
      setToast(
        args.action === "dismiss" ? "Signalement ignoré" : "Contenu supprimé"
      );
      qc.invalidateQueries({ queryKey: ["admin-signalements"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  const refundMut = useMutation({
    mutationFn: async (args: {
      id: string;
      action: "approve" | "reject";
      note?: string;
    }) => {
      const res = await fetch(
        `/api/formations/admin/signalements/refunds/${args.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: args.action, note: args.note }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      return json;
    },
    onSuccess: (_d, args) => {
      setToast(
        args.action === "approve"
          ? "Remboursement approuvé"
          : "Remboursement refusé"
      );
      qc.invalidateQueries({ queryKey: ["admin-signalements"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  async function handleDeleteContent(id: string) {
    const ok = await confirmAction({
      title: "Supprimer le contenu signalé ?",
      message:
        "Le message sera masqué et tous les signalements associés seront fermés.",
      confirmLabel: "Supprimer",
      confirmVariant: "danger",
      icon: "delete",
    });
    if (ok) reportMut.mutate({ id, action: "delete_content" });
  }

  async function handleDismissReport(id: string) {
    reportMut.mutate({ id, action: "dismiss" });
  }

  async function handleApproveRefund(id: string) {
    const ok = await confirmAction({
      title: "Approuver le remboursement ?",
      message:
        "L'apprenant sera remboursé et perdra l'accès à la formation.",
      confirmLabel: "Approuver",
      confirmVariant: "default",
      icon: "check",
    });
    if (ok) refundMut.mutate({ id, action: "approve" });
  }

  async function handleRejectRefund(id: string) {
    const ok = await confirmAction({
      title: "Refuser le remboursement ?",
      message: "L'apprenant sera notifié du refus.",
      confirmLabel: "Refuser",
      confirmVariant: "danger",
      icon: "close",
    });
    if (ok) refundMut.mutate({ id, action: "reject" });
  }

  async function handleBulkReports(action: "delete_content" | "dismiss") {
    const ids = [...selectedReports];
    if (ids.length === 0) return;
    const ok = await confirmAction({
      title:
        action === "delete_content"
          ? `Supprimer ${ids.length} contenu(s) signalé(s) ?`
          : `Ignorer ${ids.length} signalement(s) ?`,
      message:
        action === "delete_content"
          ? "Les messages seront masqués et tous les signalements associés fermés."
          : "Les signalements seront marqués comme traités sans suppression de contenu.",
      confirmLabel:
        action === "delete_content" ? "Tout supprimer" : "Tout ignorer",
      confirmVariant: action === "delete_content" ? "danger" : "default",
      icon: action === "delete_content" ? "delete" : "check_circle",
    });
    if (!ok) return;
    setBulkRunning(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/formations/admin/signalements/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          }).then((r) =>
            r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))
          )
        )
      );
      const ok_ = results.filter((r) => r.status === "fulfilled").length;
      const ko = results.length - ok_;
      setToast(
        ko === 0
          ? `${ok_} signalement(s) traité(s)`
          : `${ok_} ok, ${ko} échec(s)`
      );
      clearSelection();
      qc.invalidateQueries({ queryKey: ["admin-signalements"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } finally {
      setBulkRunning(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  function resetFilters() {
    setSearch("");
    setPeriod("all");
    setCustomSince("");
  }

  function exportCSV() {
    const today = new Date().toISOString().slice(0, 10);
    if (tab === "reports") {
      if (filteredReports.length === 0) return;
      downloadCSV(
        `novakou-signalements-${today}.csv`,
        [
          "Date",
          "Motif",
          "Signalé par",
          "Email",
          "Type",
          "Formation",
          "Contenu",
          "Auteur du contenu",
        ],
        filteredReports.map((r) => [
          new Date(r.createdAt).toISOString(),
          r.reason,
          r.user.name ?? "",
          r.user.email,
          r.discussion ? "Discussion" : r.reply ? "Réponse" : "—",
          r.discussion?.formation.title ?? "",
          r.discussion
            ? `${r.discussion.title} — ${r.discussion.content}`
            : (r.reply?.content ?? ""),
          r.discussion?.user.name ?? r.reply?.user.name ?? "",
        ])
      );
    } else {
      if (filteredRefunds.length === 0) return;
      downloadCSV(
        `novakou-remboursements-${today}.csv`,
        [
          "Date",
          "Demandeur",
          "Email",
          "Formation",
          "Montant FCFA",
          "Motif",
          "Statut",
        ],
        filteredRefunds.map((r) => [
          new Date(r.createdAt).toISOString(),
          r.user.name ?? "",
          r.user.email,
          r.enrollment.formation.title,
          Math.round(r.amount),
          r.reason,
          r.status,
        ])
      );
    }
  }

  const filtersActive =
    search.trim() !== "" || period !== "all" || customSince !== "";
  const currentCount =
    tab === "reports" ? filteredReports.length : filteredRefunds.length;

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#0b2540] text-white px-5 py-3 rounded-xl text-xs font-bold shadow-2xl">
          {toast}
        </div>
      )}
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto space-y-8">
        <KazaHero
          badge="Admin"
          badgeColor="orange"
          icon={Flag}
          title="Signalements &amp; litiges"
          subtitle="Gérer les contenus signalés et les demandes de remboursement"
          actions={
            <KazaButton
              variant="secondary"
              icon={Download}
              onClick={exportCSV}
              disabled={currentCount === 0}
            >
              Exporter CSV
            </KazaButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KazaKpiCard
            label="Signalements"
            value={summary?.totalReports ?? 0}
            icon={Flag}
            iconColor="rose"
          />
          <KazaKpiCard
            label="Remboursements en attente"
            value={summary?.totalRefunds ?? 0}
            icon={AlertTriangle}
            iconColor="orange"
          />
          <KazaKpiCard
            label="Montant à rembourser"
            value={`${formatFCFA(summary?.pendingRefundAmount ?? 0)} F`}
            icon={Banknote}
            iconColor="navy"
          />
        </div>

        {/* Tabs + Filtres */}
        <KazaCard>
          <div className="space-y-4">
            <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl w-fit">
              {[
                {
                  value: "reports" as const,
                  label: "Signalements",
                  count: summary?.totalReports ?? 0,
                  icon: Flag,
                },
                {
                  value: "refunds" as const,
                  label: "Remboursements",
                  count: summary?.totalRefunds ?? 0,
                  icon: Banknote,
                },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      tab === t.value
                        ? "bg-[#0b2540] text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={14} />
                    {t.label}
                    <span
                      className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${
                        tab === t.value
                          ? "bg-white/15 text-white"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder={
                  tab === "reports"
                    ? "Rechercher par motif, utilisateur, contenu, formation..."
                    : "Rechercher par demandeur, formation, motif..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between flex-wrap">
              <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl">
                {(
                  [
                    { v: "all", l: "Tout" },
                    { v: "7d", l: "7 j" },
                    { v: "30d", l: "30 j" },
                    { v: "90d", l: "90 j" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.v}
                    onClick={() => {
                      setPeriod(p.v);
                      setCustomSince("");
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      period === p.v
                        ? "bg-[#0b2540] text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {p.l}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Depuis
                  </span>
                  <input
                    type="date"
                    value={customSince}
                    onChange={(e) => {
                      setCustomSince(e.target.value);
                      setPeriod(e.target.value ? "custom" : "all");
                    }}
                    className="text-xs text-slate-900 outline-none bg-transparent"
                  />
                </label>
                {filtersActive && (
                  <KazaButton
                    variant="ghost"
                    size="sm"
                    icon={RotateCcw}
                    onClick={resetFilters}
                  >
                    Réinitialiser
                  </KazaButton>
                )}
              </div>
            </div>
          </div>
        </KazaCard>

        {/* Reports list */}
        {tab === "reports" && (
          <div className="space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white rounded-2xl animate-pulse"
                />
              ))
            ) : filteredReports.length === 0 ? (
              <KazaEmpty
                icon={
                  filtersActive && reports.length > 0 ? FilterX : Inbox
                }
                title={
                  filtersActive && reports.length > 0
                    ? "Aucun résultat"
                    : "Tout est calme"
                }
                description={
                  filtersActive && reports.length > 0
                    ? "Aucun signalement ne correspond à vos filtres."
                    : "Aucun contenu signalé actuellement."
                }
                action={
                  filtersActive && reports.length > 0
                    ? {
                        label: "Réinitialiser les filtres",
                        onClick: resetFilters,
                      }
                    : undefined
                }
              />
            ) : (
              <>
                {selectedReports.size > 0 && (
                  <div className="sticky top-2 z-10 bg-[#0b2540] text-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap shadow-2xl rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold">
                        {selectedReports.size} sélectionné
                        {selectedReports.size > 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-[10px] font-semibold text-slate-300 hover:text-white underline"
                      >
                        Désélectionner
                      </button>
                      <button
                        onClick={() =>
                          setSelectedReports(
                            new Set(filteredReports.map((r) => r.id))
                          )
                        }
                        className="text-[10px] font-semibold text-slate-300 hover:text-white underline"
                      >
                        Tout sélectionner ({filteredReports.length})
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <KazaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBulkReports("dismiss")}
                        disabled={bulkRunning}
                      >
                        {bulkRunning ? "Traitement..." : "Ignorer"}
                      </KazaButton>
                      <KazaButton
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleBulkReports("delete_content")}
                        disabled={bulkRunning}
                      >
                        Supprimer
                      </KazaButton>
                    </div>
                  </div>
                )}
                {filteredReports.map((r) => (
                  <KazaCard
                    key={r.id}
                    className={
                      selectedReports.has(r.id)
                        ? "ring-2 ring-emerald-500 ring-inset"
                        : ""
                    }
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedReports.has(r.id)}
                            onChange={() => toggleReportSelection(r.id)}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                            aria-label="Sélectionner ce signalement"
                          />
                        </label>
                        <KazaBadge variant="rose">
                          {REASON_LABELS[r.reason] ?? r.reason}
                        </KazaBadge>
                        <span className="text-[11px] tabular-nums text-slate-400">
                          {timeAgo(r.createdAt)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          par {r.user.name ?? r.user.email}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <KazaButton
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteContent(r.id)}
                          disabled={reportMut.isPending}
                        >
                          Supprimer
                        </KazaButton>
                        <KazaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissReport(r.id)}
                          disabled={reportMut.isPending}
                        >
                          Ignorer
                        </KazaButton>
                      </div>
                    </div>

                    {r.discussion && (
                      <div className="border-l-4 border-slate-200 pl-4 py-2 bg-slate-50 rounded-r-lg">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                          Discussion · {r.discussion.formation.title}
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          « {r.discussion.title} »
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {r.discussion.content}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-2">
                          par {r.discussion.user.name ?? "—"}
                        </p>
                      </div>
                    )}
                    {r.reply && (
                      <div className="border-l-4 border-slate-200 pl-4 py-2 bg-slate-50 rounded-r-lg">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                          Réponse signalée
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-3">
                          {r.reply.content}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-2">
                          par {r.reply.user.name ?? "—"}
                        </p>
                      </div>
                    )}
                  </KazaCard>
                ))}
              </>
            )}
          </div>
        )}

        {/* Refunds */}
        {tab === "refunds" && (
          <div className="space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white rounded-2xl animate-pulse"
                />
              ))
            ) : filteredRefunds.length === 0 ? (
              <KazaEmpty
                icon={
                  filtersActive && refunds.length > 0 ? FilterX : Inbox
                }
                title={
                  filtersActive && refunds.length > 0
                    ? "Aucun résultat"
                    : "Aucun litige"
                }
                description={
                  filtersActive && refunds.length > 0
                    ? "Aucun remboursement ne correspond à vos filtres."
                    : "Aucune demande de remboursement en attente."
                }
                action={
                  filtersActive && refunds.length > 0
                    ? {
                        label: "Réinitialiser les filtres",
                        onClick: resetFilters,
                      }
                    : undefined
                }
              />
            ) : (
              filteredRefunds.map((r) => (
                <KazaCard key={r.id}>
                  <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <KazaBadge variant="orange" icon={Clock}>
                          En attente
                        </KazaBadge>
                        <span className="text-[11px] tabular-nums text-slate-400">
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>
                      <p className="text-base font-bold text-slate-900">
                        {r.user.name ?? r.user.email} ·{" "}
                        <span className="text-emerald-700">
                          {formatFCFA(r.amount)} FCFA
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Formation : {r.enrollment.formation.title}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <KazaButton
                        variant="primary"
                        size="sm"
                        icon={CheckCircle}
                        onClick={() => handleApproveRefund(r.id)}
                        disabled={refundMut.isPending}
                      >
                        Approuver
                      </KazaButton>
                      <KazaButton
                        variant="danger"
                        size="sm"
                        icon={XCircle}
                        onClick={() => handleRejectRefund(r.id)}
                        disabled={refundMut.isPending}
                      >
                        Refuser
                      </KazaButton>
                    </div>
                  </div>
                  <div className="border-l-4 border-slate-200 pl-4 py-2 bg-slate-50 rounded-r-lg">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Motif
                    </p>
                    <p className="text-sm text-slate-700">{r.reason}</p>
                  </div>
                </KazaCard>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
