"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StButton,
  StChip,
  ST,
} from "@/components/stitch";
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
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      {toast && (
        <div className="fixed top-6 right-6 z-50 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-2xl" style={{ background: ST.greenDark }}>
          {toast}
        </div>
      )}
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-5">
        <StPageHeader
          title="Signalements & litiges"
          subtitle="Gérer les contenus signalés et les demandes de remboursement"
          actions={
            <StButton
              variant="secondary"
              icon={Download}
              onClick={exportCSV}
              disabled={currentCount === 0}
            >
              Exporter CSV
            </StButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <StKpiCompact
            label="Signalements"
            value={summary?.totalReports ?? 0}
            icon={Flag}
            tone="rose"
          />
          <StKpiCompact
            label="Remboursements en attente"
            value={summary?.totalRefunds ?? 0}
            icon={AlertTriangle}
            tone="amber"
          />
          <StKpiCompact
            label="Montant à rembourser"
            value={`${formatFCFA(summary?.pendingRefundAmount ?? 0)}`}
            unit="F"
            icon={Banknote}
            tone="green"
          />
        </div>

        {/* Tabs + Filtres */}
        <StCard>
          <div className="space-y-4">
            <div className="flex gap-1 p-1 rounded-[13px] w-fit" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
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
                const on = tab === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors whitespace-nowrap"
                    style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
                  >
                    <Icon size={14} />
                    {t.label}
                    <span className="text-[10px] tabular-nums">· {t.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: ST.textMuted }}
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
                className="w-full pl-11 pr-4 py-3 rounded-xl text-[13.5px] font-semibold focus:outline-none transition-all"
                style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between flex-wrap">
              <div className="flex flex-wrap gap-1 p-1 rounded-[13px]" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
                {(
                  [
                    { v: "all", l: "Tout" },
                    { v: "7d", l: "7 j" },
                    { v: "30d", l: "30 j" },
                    { v: "90d", l: "90 j" },
                  ] as const
                ).map((p) => {
                  const on = period === p.v;
                  return (
                    <button
                      key={p.v}
                      onClick={() => {
                        setPeriod(p.v);
                        setCustomSince("");
                      }}
                      className="px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors"
                      style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
                    >
                      {p.l}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 px-3 py-2 rounded-[12px]" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>
                    Depuis
                  </span>
                  <input
                    type="date"
                    value={customSince}
                    onChange={(e) => {
                      setCustomSince(e.target.value);
                      setPeriod(e.target.value ? "custom" : "all");
                    }}
                    className="text-[12px] outline-none bg-transparent"
                    style={{ color: ST.text }}
                  />
                </label>
                {filtersActive && (
                  <StButton
                    variant="secondary"
                    size="sm"
                    icon={RotateCcw}
                    onClick={resetFilters}
                  >
                    Réinitialiser
                  </StButton>
                )}
              </div>
            </div>
          </div>
        </StCard>

        {/* Reports list */}
        {tab === "reports" && (
          <div className="space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-[18px] animate-pulse"
                  style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}
                />
              ))
            ) : filteredReports.length === 0 ? (
              <StCard className="flex flex-col items-center text-center py-12">
                {filtersActive && reports.length > 0 ? (
                  <FilterX size={40} style={{ color: "#d6e0da" }} />
                ) : (
                  <Inbox size={40} style={{ color: "#d6e0da" }} />
                )}
                <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>
                  {filtersActive && reports.length > 0 ? "Aucun résultat" : "Tout est calme"}
                </p>
                <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                  {filtersActive && reports.length > 0
                    ? "Aucun signalement ne correspond à vos filtres."
                    : "Aucun contenu signalé actuellement."}
                </p>
                {filtersActive && reports.length > 0 && (
                  <div className="mt-4">
                    <StButton variant="primary" size="sm" icon={RotateCcw} onClick={resetFilters}>
                      Réinitialiser les filtres
                    </StButton>
                  </div>
                )}
              </StCard>
            ) : (
              <>
                {selectedReports.size > 0 && (
                  <div className="sticky top-2 z-10 text-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap shadow-2xl rounded-xl" style={{ background: ST.greenDark }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold">
                        {selectedReports.size} sélectionné
                        {selectedReports.size > 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-[10px] font-semibold text-white/70 hover:text-white underline"
                      >
                        Désélectionner
                      </button>
                      <button
                        onClick={() =>
                          setSelectedReports(
                            new Set(filteredReports.map((r) => r.id))
                          )
                        }
                        className="text-[10px] font-semibold text-white/70 hover:text-white underline"
                      >
                        Tout sélectionner ({filteredReports.length})
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBulkReports("dismiss")}
                        disabled={bulkRunning}
                        className="px-3 py-2 rounded-[9px] text-[11px] font-extrabold bg-white/15 hover:bg-white/25 disabled:opacity-50"
                      >
                        {bulkRunning ? "Traitement..." : "Ignorer"}
                      </button>
                      <button
                        onClick={() => handleBulkReports("delete_content")}
                        disabled={bulkRunning}
                        className="px-3 py-2 rounded-[9px] text-[11px] font-extrabold inline-flex items-center gap-1.5 text-white disabled:opacity-50"
                        style={{ background: "#ba1a1a" }}
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
                {filteredReports.map((r) => {
                  const on = selectedReports.has(r.id);
                  return (
                    <StCard
                      key={r.id}
                      style={
                        on
                          ? { boxShadow: `inset 0 0 0 2px ${ST.greenBright}, 0 1px 3px rgba(16,52,32,.05)` }
                          : undefined
                      }
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="inline-flex items-center cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleReportSelection(r.id)}
                              className="w-4 h-4 accent-[#006e2f] cursor-pointer"
                              aria-label="Sélectionner ce signalement"
                            />
                          </label>
                          <StChip tone="rose">
                            {REASON_LABELS[r.reason] ?? r.reason}
                          </StChip>
                          <span className="text-[11px] tabular-nums" style={{ color: ST.textFaint }}>
                            {timeAgo(r.createdAt)}
                          </span>
                          <span className="text-[11px]" style={{ color: ST.textSecondary }}>
                            par {r.user.name ?? r.user.email}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <StButton
                            variant="secondary"
                            size="sm"
                            icon={Trash2}
                            className="!text-[#993556]"
                            onClick={() => handleDeleteContent(r.id)}
                            disabled={reportMut.isPending}
                          >
                            Supprimer
                          </StButton>
                          <StButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDismissReport(r.id)}
                            disabled={reportMut.isPending}
                          >
                            Ignorer
                          </StButton>
                        </div>
                      </div>

                      {r.discussion && (
                        <div className="border-l-4 pl-4 py-2 rounded-r-lg" style={{ borderColor: ST.cardBorder, background: ST.bg }}>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: ST.textMuted }}>
                            Discussion · {r.discussion.formation.title}
                          </p>
                          <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                            « {r.discussion.title} »
                          </p>
                          <p className="text-[12px] line-clamp-2 mt-1" style={{ color: ST.textSecondary }}>
                            {r.discussion.content}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide mt-2" style={{ color: ST.textFaint }}>
                            par {r.discussion.user.name ?? "—"}
                          </p>
                        </div>
                      )}
                      {r.reply && (
                        <div className="border-l-4 pl-4 py-2 rounded-r-lg" style={{ borderColor: ST.cardBorder, background: ST.bg }}>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: ST.textMuted }}>
                            Réponse signalée
                          </p>
                          <p className="text-[12px] line-clamp-3" style={{ color: ST.textSecondary }}>
                            {r.reply.content}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide mt-2" style={{ color: ST.textFaint }}>
                            par {r.reply.user.name ?? "—"}
                          </p>
                        </div>
                      )}
                    </StCard>
                  );
                })}
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
                  className="h-28 rounded-[18px] animate-pulse"
                  style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}
                />
              ))
            ) : filteredRefunds.length === 0 ? (
              <StCard className="flex flex-col items-center text-center py-12">
                {filtersActive && refunds.length > 0 ? (
                  <FilterX size={40} style={{ color: "#d6e0da" }} />
                ) : (
                  <Inbox size={40} style={{ color: "#d6e0da" }} />
                )}
                <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>
                  {filtersActive && refunds.length > 0 ? "Aucun résultat" : "Aucun litige"}
                </p>
                <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                  {filtersActive && refunds.length > 0
                    ? "Aucun remboursement ne correspond à vos filtres."
                    : "Aucune demande de remboursement en attente."}
                </p>
                {filtersActive && refunds.length > 0 && (
                  <div className="mt-4">
                    <StButton variant="primary" size="sm" icon={RotateCcw} onClick={resetFilters}>
                      Réinitialiser les filtres
                    </StButton>
                  </div>
                )}
              </StCard>
            ) : (
              filteredRefunds.map((r) => (
                <StCard key={r.id}>
                  <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <StChip tone="amber" icon={Clock}>En attente</StChip>
                        <span className="text-[11px] tabular-nums" style={{ color: ST.textFaint }}>
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>
                      <p className="text-[15px] font-extrabold" style={{ color: ST.text }}>
                        {r.user.name ?? r.user.email} ·{" "}
                        <span style={{ color: ST.green }}>
                          {formatFCFA(r.amount)} FCFA
                        </span>
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: ST.textSecondary }}>
                        Formation : {r.enrollment.formation.title}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <StButton
                        variant="primary"
                        size="sm"
                        icon={CheckCircle}
                        onClick={() => handleApproveRefund(r.id)}
                        disabled={refundMut.isPending}
                      >
                        Approuver
                      </StButton>
                      <StButton
                        variant="secondary"
                        size="sm"
                        icon={XCircle}
                        className="!text-[#993556]"
                        onClick={() => handleRejectRefund(r.id)}
                        disabled={refundMut.isPending}
                      >
                        Refuser
                      </StButton>
                    </div>
                  </div>
                  <div className="border-l-4 pl-4 py-2 rounded-r-lg" style={{ borderColor: ST.cardBorder, background: ST.bg }}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: ST.textMuted }}>
                      Motif
                    </p>
                    <p className="text-[13px]" style={{ color: ST.textSecondary }}>{r.reason}</p>
                  </div>
                </StCard>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
