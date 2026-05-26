// Refonte par Sophie Tremblay + Léa Moreau — réunion bureau 2026-05-26 (votes 5 & 6)
"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";

type Report = {
  id: string;
  reason: string;
  createdAt: string;
  user: { name: string | null; email: string };
  discussion: {
    id: string; title: string; content: string; reportCount: number; status: string;
    formation: { title: string };
    user: { name: string | null };
  } | null;
  reply: { id: string; content: string; reportCount: number; user: { name: string | null } } | null;
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
type Summary = { totalReports: number; totalRefunds: number; pendingRefundAmount: number };
type Period = "all" | "7d" | "30d" | "90d" | "custom";

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 24) return `${h}H`;
  return `${d}J`;
}

const REASON_LABELS: Record<string, string> = {
  spam: "SPAM",
  harassment: "HARCÈLEMENT",
  inappropriate: "INAPPROPRIÉ",
  "off-topic": "HORS-SUJET",
};

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
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

  // Filtres bureau 2026-05-26
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [customSince, setCustomSince] = useState("");

  // Sélection bulk (bureau 2026-05-26 — suivi rapport final)
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  function toggleReportSelection(id: string) {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function clearSelection() { setSelectedReports(new Set()); }

  const { data: response, isLoading } = useQuery<{ data: Data; summary: Summary | null }>({
    queryKey: ["admin-signalements"],
    queryFn: () => fetch("/api/formations/admin/signalements").then((r) => r.json()),
    staleTime: 15_000,
  });

  const reports = response?.data?.reports ?? [];
  const refunds = response?.data?.refundRequests ?? [];
  const summary = response?.summary;

  const cutoff = useMemo(() => periodCutoff(period, customSince), [period, customSince]);

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
      ].join(" ").toLowerCase();
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
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [refunds, search, cutoff]);

  const reportMut = useMutation({
    mutationFn: async (args: { id: string; action: "delete_content" | "dismiss" }) => {
      const res = await fetch(`/api/formations/admin/signalements/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: args.action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      return json;
    },
    onSuccess: (_d, args) => {
      setToast(args.action === "dismiss" ? "Signalement ignoré" : "Contenu supprimé");
      qc.invalidateQueries({ queryKey: ["admin-signalements"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  const refundMut = useMutation({
    mutationFn: async (args: { id: string; action: "approve" | "reject"; note?: string }) => {
      const res = await fetch(`/api/formations/admin/signalements/refunds/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: args.action, note: args.note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      return json;
    },
    onSuccess: (_d, args) => {
      setToast(args.action === "approve" ? "Remboursement approuvé" : "Remboursement refusé");
      qc.invalidateQueries({ queryKey: ["admin-signalements"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  async function handleDeleteContent(id: string) {
    const ok = await confirmAction({
      title: "Supprimer le contenu signalé ?",
      message: "Le message sera masqué et tous les signalements associés seront fermés.",
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
      message: "L'apprenant sera remboursé et perdra l'accès à la formation.",
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
      title: action === "delete_content"
        ? `Supprimer ${ids.length} contenu(s) signalé(s) ?`
        : `Ignorer ${ids.length} signalement(s) ?`,
      message: action === "delete_content"
        ? "Les messages seront masqués et tous les signalements associés fermés."
        : "Les signalements seront marqués comme traités sans suppression de contenu.",
      confirmLabel: action === "delete_content" ? "Tout supprimer" : "Tout ignorer",
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
          }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        )
      );
      const ok_ = results.filter((r) => r.status === "fulfilled").length;
      const ko = results.length - ok_;
      setToast(ko === 0 ? `${ok_} signalement(s) traité(s)` : `${ok_} ok, ${ko} échec(s)`);
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
        ["Date", "Motif", "Signalé par", "Email", "Type", "Formation", "Contenu", "Auteur du contenu"],
        filteredReports.map((r) => [
          new Date(r.createdAt).toISOString(),
          r.reason,
          r.user.name ?? "",
          r.user.email,
          r.discussion ? "Discussion" : r.reply ? "Réponse" : "—",
          r.discussion?.formation.title ?? "",
          r.discussion ? `${r.discussion.title} — ${r.discussion.content}` : r.reply?.content ?? "",
          r.discussion?.user.name ?? r.reply?.user.name ?? "",
        ])
      );
    } else {
      if (filteredRefunds.length === 0) return;
      downloadCSV(
        `novakou-remboursements-${today}.csv`,
        ["Date", "Demandeur", "Email", "Formation", "Montant FCFA", "Motif", "Statut"],
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

  const filtersActive = search.trim() !== "" || period !== "all" || customSince !== "";
  const currentCount = tab === "reports" ? filteredReports.length : filteredRefunds.length;

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl">
          {toast}
        </div>
      )}
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1400px] mx-auto">
        <header className="mb-12">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
            Dispute Resolution
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
            Signalements &amp; Litiges
          </h1>
          <p className="text-sm text-zinc-500 mt-3">Gérer les contenus signalés et les demandes de remboursement</p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-100 mb-10 border border-zinc-100">
          <div className="bg-white p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Signalements</p>
            <p className="text-lg md:text-xl font-extrabold tracking-tight text-zinc-900 tabular-nums break-all">
              {isLoading ? "…" : summary?.totalReports ?? 0}
            </p>
          </div>
          <div className="bg-white p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Remboursements</p>
            <p className="text-lg md:text-xl font-extrabold tracking-tight text-zinc-900 tabular-nums break-all">
              {isLoading ? "…" : summary?.totalRefunds ?? 0}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">En attente</p>
          </div>
          <div className="bg-zinc-900 p-8 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Montant à rembourser</p>
            <p className="text-lg md:text-xl font-extrabold tracking-tight tabular-nums break-all">
              {isLoading ? "…" : formatFCFA(summary?.pendingRefundAmount ?? 0)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">FCFA</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border border-zinc-100 bg-white mb-4 w-fit">
          {[
            { value: "reports" as const, label: "Signalements", count: summary?.totalReports ?? 0 },
            { value: "refunds" as const, label: "Remboursements", count: summary?.totalRefunds ?? 0 },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                tab === t.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t.label}
              <span className={`text-[9px] tabular-nums ${tab === t.value ? "text-[#22c55e]" : "text-zinc-400"}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Toolbar : search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400">search</span>
            <input
              type="text"
              placeholder={tab === "reports" ? "Rechercher par motif, utilisateur, contenu, formation…" : "Rechercher par demandeur, formation, motif…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-zinc-100 focus:border-[#22c55e] py-4 pl-12 pr-6 text-sm placeholder:text-zinc-400 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Toolbar : period + custom date + export */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-0 border border-zinc-100 bg-white">
            {([
              { v: "all", l: "Tout" },
              { v: "7d", l: "7 j" },
              { v: "30d", l: "30 j" },
              { v: "90d", l: "90 j" },
            ] as const).map((p) => (
              <button
                key={p.v}
                onClick={() => { setPeriod(p.v); setCustomSince(""); }}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  period === p.v ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {p.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 bg-white border border-zinc-100 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Depuis</span>
              <input
                type="date"
                value={customSince}
                onChange={(e) => { setCustomSince(e.target.value); setPeriod(e.target.value ? "custom" : "all"); }}
                className="text-xs text-zinc-900 outline-none bg-transparent"
              />
            </label>
            <button
              onClick={exportCSV}
              disabled={currentCount === 0}
              className="flex items-center gap-2 px-4 py-3 bg-[#006e2f] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#005a26] transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export CSV
            </button>
          </div>
        </div>

        {/* Reports list */}
        {tab === "reports" && (
          <div className="space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => <div key={i} className="h-28 bg-white animate-pulse" />)
            ) : filteredReports.length === 0 ? (
              <EmptyResults
                hasFilters={filtersActive && reports.length > 0}
                onReset={resetFilters}
                emptyTitle="Tout est calme"
                emptyMessage="Aucun contenu signalé actuellement."
                filteredTitle="Aucun résultat"
                filteredMessage="Aucun signalement ne correspond à vos filtres."
              />
            ) : (
              <>
                {/* Bulk toolbar — visible quand sélection ≥ 1 */}
                {selectedReports.size > 0 && (
                  <div className="sticky top-2 z-10 bg-zinc-900 text-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {selectedReports.size} sélectionné{selectedReports.size > 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-[10px] font-semibold text-zinc-300 hover:text-white underline"
                      >
                        Désélectionner
                      </button>
                      <button
                        onClick={() => setSelectedReports(new Set(filteredReports.map((r) => r.id)))}
                        className="text-[10px] font-semibold text-zinc-300 hover:text-white underline"
                      >
                        Tout sélectionner ({filteredReports.length})
                      </button>
                    </div>
                    <div className="flex gap-0">
                      <button
                        onClick={() => handleBulkReports("dismiss")}
                        disabled={bulkRunning}
                        className="px-4 py-2 bg-zinc-700 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-600 transition-colors disabled:opacity-50"
                      >
                        {bulkRunning ? "Traitement…" : "Ignorer la sélection"}
                      </button>
                      <button
                        onClick={() => handleBulkReports("delete_content")}
                        disabled={bulkRunning}
                        className="px-4 py-2 bg-[#ba1a1a] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#93000a] transition-colors disabled:opacity-50"
                      >
                        Supprimer la sélection
                      </button>
                    </div>
                  </div>
                )}
                {filteredReports.map((r) => (
                  <div key={r.id} className={`bg-white p-6 md:p-8 ${selectedReports.has(r.id) ? "ring-2 ring-[#006e2f] ring-inset" : ""}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedReports.has(r.id)}
                            onChange={() => toggleReportSelection(r.id)}
                            className="w-4 h-4 accent-[#006e2f] cursor-pointer"
                            aria-label="Sélectionner ce signalement"
                          />
                        </label>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-[#ffdad6] text-[#93000a]">
                          {REASON_LABELS[r.reason] ?? r.reason.toUpperCase()}
                        </span>
                        <span className="text-[10px] tabular-nums text-zinc-400 uppercase tracking-widest">
                          {timeAgo(r.createdAt)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          par {r.user.name ?? r.user.email}
                        </span>
                      </div>
                      <div className="flex gap-0 flex-shrink-0">
                        <button
                          onClick={() => handleDeleteContent(r.id)}
                          disabled={reportMut.isPending}
                          className="px-4 py-2 bg-[#ffdad6] text-[#93000a] text-[10px] font-bold uppercase tracking-widest hover:bg-[#ffb4a9] transition-colors disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                        <button
                          onClick={() => handleDismissReport(r.id)}
                          disabled={reportMut.isPending}
                          className="px-4 py-2 bg-zinc-200 text-zinc-700 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50"
                        >
                          Ignorer
                        </button>
                      </div>
                    </div>

                  {r.discussion && (
                    <div className="border-l-4 border-zinc-200 pl-4 py-2 bg-[#f3f3f4]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        Discussion · {r.discussion.formation.title}
                      </p>
                      <p className="text-sm font-bold text-zinc-900">&laquo; {r.discussion.title} &raquo;</p>
                      <p className="text-xs text-zinc-600 line-clamp-2 mt-1">{r.discussion.content}</p>
                      <p className="text-[10px] tabular-nums text-zinc-400 uppercase tracking-widest mt-2">
                        par {r.discussion.user.name ?? "—"}
                      </p>
                    </div>
                  )}
                  {r.reply && (
                    <div className="border-l-4 border-zinc-200 pl-4 py-2 bg-[#f3f3f4]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Réponse signalée</p>
                      <p className="text-xs text-zinc-600 line-clamp-3">{r.reply.content}</p>
                      <p className="text-[10px] tabular-nums text-zinc-400 uppercase tracking-widest mt-2">
                        par {r.reply.user.name ?? "—"}
                      </p>
                    </div>
                  )}
                </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Refunds */}
        {tab === "refunds" && (
          <div className="space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => <div key={i} className="h-28 bg-white animate-pulse" />)
            ) : filteredRefunds.length === 0 ? (
              <EmptyResults
                hasFilters={filtersActive && refunds.length > 0}
                onReset={resetFilters}
                emptyTitle="Aucun litige"
                emptyMessage="Aucune demande de remboursement en attente."
                filteredTitle="Aucun résultat"
                filteredMessage="Aucun remboursement ne correspond à vos filtres."
              />
            ) : (
              filteredRefunds.map((r) => (
                <div key={r.id} className="bg-white p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-amber-400 text-amber-900">
                          En attente
                        </span>
                        <span className="text-[10px] tabular-nums text-zinc-400 uppercase tracking-widest">{timeAgo(r.createdAt)}</span>
                      </div>
                      <p className="text-base font-bold text-zinc-900">
                        {r.user.name ?? r.user.email} · {formatFCFA(r.amount)} FCFA
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">
                        Formation : {r.enrollment.formation.title}
                      </p>
                    </div>
                    <div className="flex gap-0 flex-shrink-0">
                      <button
                        onClick={() => handleApproveRefund(r.id)}
                        disabled={refundMut.isPending}
                        className="px-4 py-2 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors disabled:opacity-50"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleRejectRefund(r.id)}
                        disabled={refundMut.isPending}
                        className="px-4 py-2 bg-[#ffdad6] text-[#93000a] text-[10px] font-bold uppercase tracking-widest hover:bg-[#ffb4a9] transition-colors disabled:opacity-50"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                  <div className="border-l-4 border-zinc-200 pl-4 py-2 bg-[#f3f3f4]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Motif</p>
                    <p className="text-sm text-zinc-700">{r.reason}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyResults({
  hasFilters,
  onReset,
  emptyTitle,
  emptyMessage,
  filteredTitle,
  filteredMessage,
}: {
  hasFilters: boolean;
  onReset: () => void;
  emptyTitle: string;
  emptyMessage: string;
  filteredTitle: string;
  filteredMessage: string;
}) {
  return (
    <div className="bg-white p-16 text-center flex flex-col items-center">
      <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-zinc-400">
          {hasFilters ? "filter_alt_off" : "inbox"}
        </span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
        {hasFilters ? filteredTitle : emptyTitle}
      </p>
      <p className="text-sm text-zinc-500 max-w-md">
        {hasFilters ? filteredMessage : emptyMessage}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-[#006e2f] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#005a26] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
