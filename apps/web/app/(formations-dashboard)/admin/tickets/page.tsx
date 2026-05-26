// Refonte par Sophie Tremblay + Léa Moreau — réunion bureau 2026-05-26 (votes 5 & 6)
"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Status = "NEW" | "AUTO_REPLIED" | "HUMAN_REPLIED" | "CLOSED";
type Period = "all" | "7d" | "30d" | "90d" | "custom";

type TicketSummary = {
  id: string;
  reference: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: Status;
  aiReplyModel: string | null;
  aiReplySentAt: string | null;
  adminReplyAt: string | null;
  createdAt: string;
};

type TicketFull = TicketSummary & {
  aiReply: string | null;
  adminReply: string | null;
  adminNotes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

const STATUS_LABEL: Record<Status, { label: string; tint: string }> = {
  NEW: { label: "Nouveau", tint: "bg-amber-100 text-amber-700" },
  AUTO_REPLIED: { label: "IA répondue", tint: "bg-blue-100 text-blue-700" },
  HUMAN_REPLIED: { label: "Répondu", tint: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Fermé", tint: "bg-zinc-100 text-zinc-600" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
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

export default function AdminTicketsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filtres bureau 2026-05-26
  const [period, setPeriod] = useState<Period>("all");
  const [customSince, setCustomSince] = useState("");

  // Bulk selection (extension bulk actions — addendum #3)
  const [bulkIds, setBulkIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkToast, setBulkToast] = useState<string | null>(null);
  function toggleBulk(id: string) {
    setBulkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const list = useQuery<{ data: { items: TicketSummary[]; total: number; statusCounts: Record<string, number> } }>({
    queryKey: ["admin-tickets", tab, search, page],
    queryFn: () => {
      const p = new URLSearchParams();
      if (tab !== "all") p.set("status", tab);
      if (search.trim()) p.set("q", search.trim());
      p.set("page", String(page));
      return fetch(`/api/formations/admin/tickets?${p}`).then((r) => r.json());
    },
    staleTime: 30_000,
  });

  const detail = useQuery<{ data: TicketFull }>({
    queryKey: ["admin-ticket", selectedId],
    queryFn: () => fetch(`/api/formations/admin/tickets/${selectedId}`).then((r) => r.json()),
    enabled: !!selectedId,
  });

  const rawItems = list.data?.data.items ?? [];
  const counts = list.data?.data.statusCounts ?? {};

  const cutoff = useMemo(() => periodCutoff(period, customSince), [period, customSince]);

  // Filtrage client-side période (la recherche & le statut sont déjà appliqués côté serveur)
  const items = useMemo(
    () => rawItems.filter((t) => new Date(t.createdAt).getTime() >= cutoff),
    [rawItems, cutoff]
  );

  const tabs: { id: Status | "all"; label: string }[] = useMemo(() => [
    { id: "all", label: "Tous" },
    { id: "NEW", label: `Nouveau (${counts.NEW ?? 0})` },
    { id: "AUTO_REPLIED", label: `IA répondue (${counts.AUTO_REPLIED ?? 0})` },
    { id: "HUMAN_REPLIED", label: `Répondu (${counts.HUMAN_REPLIED ?? 0})` },
    { id: "CLOSED", label: `Fermé (${counts.CLOSED ?? 0})` },
  ], [counts]);

  function resetFilters() {
    setSearch("");
    setTab("all");
    setPeriod("all");
    setCustomSince("");
    setPage(1);
  }

  async function bulkCloseSelected() {
    const ids = [...bulkIds];
    if (ids.length === 0) return;
    setBulkRunning(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/formations/admin/tickets/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CLOSED" }),
          }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
        ),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const ko = results.length - ok;
      setBulkToast(ko === 0 ? `${ok} ticket(s) fermé(s)` : `${ok} fermés, ${ko} échec(s)`);
      setBulkIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    } finally {
      setBulkRunning(false);
      setTimeout(() => setBulkToast(null), 4000);
    }
  }

  function exportCSV() {
    if (items.length === 0) return;
    const headers = ["Référence", "Date", "Nom", "Email", "Sujet", "Message", "Statut", "IA modèle", "IA envoyée", "Admin répondu"];
    const rows = items.map((t) => [
      t.reference,
      new Date(t.createdAt).toISOString(),
      t.name,
      t.email,
      t.subject ?? "",
      t.message,
      STATUS_LABEL[t.status].label,
      t.aiReplyModel ?? "",
      t.aiReplySentAt ?? "",
      t.adminReplyAt ?? "",
    ]);
    const csv = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `novakou-tickets-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const filtersActive = search.trim() !== "" || tab !== "all" || period !== "all" || customSince !== "";

  return (
    <div className="p-5 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Support tickets</h1>
        <p className="text-sm text-[#5c647a] mt-1">Tous les messages reçus via le formulaire de contact, avec auto-réponse IA.</p>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par email, nom, référence ou contenu…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#006e2f]"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl mb-4 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === t.id ? "bg-white shadow-sm text-[#191c1e]" : "text-[#5c647a] hover:text-[#191c1e]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period + custom date + export */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl">
          {([
            { v: "all", l: "Tout" },
            { v: "7d", l: "7 j" },
            { v: "30d", l: "30 j" },
            { v: "90d", l: "90 j" },
          ] as const).map((p) => (
            <button
              key={p.v}
              onClick={() => { setPeriod(p.v); setCustomSince(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p.v ? "bg-white shadow-sm text-[#191c1e]" : "text-[#5c647a] hover:text-[#191c1e]"}`}
            >
              {p.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Depuis</span>
            <input
              type="date"
              value={customSince}
              onChange={(e) => { setCustomSince(e.target.value); setPeriod(e.target.value ? "custom" : "all"); }}
              className="text-xs text-[#191c1e] outline-none bg-transparent"
            />
          </label>
          <button
            onClick={exportCSV}
            disabled={items.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006e2f] text-white text-xs font-bold hover:bg-[#005a26] transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {list.isLoading ? (
            <div className="p-6 text-sm text-[#5c647a]">Chargement…</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-gray-400">
                  {filtersActive ? "filter_alt_off" : "inbox"}
                </span>
              </div>
              <p className="text-sm font-bold text-[#191c1e] mb-1">
                {filtersActive ? "Aucun résultat" : "Aucun ticket"}
              </p>
              <p className="text-sm text-[#5c647a] max-w-xs">
                {filtersActive ? "Aucun ticket ne correspond à vos filtres." : "Aucun message dans cette catégorie."}
              </p>
              {filtersActive && (
                <button
                  onClick={resetFilters}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006e2f] text-white text-xs font-bold hover:bg-[#005a26] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Bulk toolbar — visible quand sélection ≥ 1 */}
              {bulkIds.size > 0 && (
                <div className="sticky top-0 z-10 bg-zinc-900 text-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {bulkIds.size} sélectionné{bulkIds.size > 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => setBulkIds(new Set())}
                      className="text-[10px] font-semibold text-zinc-300 hover:text-white underline"
                    >
                      Désélectionner
                    </button>
                    <button
                      onClick={() => setBulkIds(new Set(items.map((t) => t.id)))}
                      className="text-[10px] font-semibold text-zinc-300 hover:text-white underline"
                    >
                      Tout sélectionner ({items.length})
                    </button>
                  </div>
                  <button
                    onClick={bulkCloseSelected}
                    disabled={bulkRunning}
                    className="px-4 py-2 bg-[#006e2f] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#005a26] transition-colors disabled:opacity-50"
                  >
                    {bulkRunning ? "Fermeture…" : `Fermer ${bulkIds.size} ticket${bulkIds.size > 1 ? "s" : ""}`}
                  </button>
                </div>
              )}
              {bulkToast && (
                <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold px-4 py-2">
                  {bulkToast}
                </div>
              )}
              <ul className="divide-y divide-gray-100">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-stretch ${selectedId === t.id ? "bg-[#006e2f]/5" : ""} ${bulkIds.has(t.id) ? "bg-[#006e2f]/8" : ""}`}
                  >
                    <label className="flex items-start pt-5 pl-4 pr-2 cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={bulkIds.has(t.id)}
                        onChange={() => toggleBulk(t.id)}
                        className="w-4 h-4 accent-[#006e2f] cursor-pointer"
                        aria-label="Sélectionner ce ticket"
                      />
                    </label>
                    <button
                      onClick={() => setSelectedId(t.id)}
                      className="flex-1 text-left p-4 pl-2 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-sm font-bold text-[#191c1e] truncate flex-1">{t.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_LABEL[t.status].tint}`}>
                          {STATUS_LABEL[t.status].label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5c647a] font-mono mb-1">{t.reference} · {t.email}</p>
                      <p className="text-xs text-[#191c1e] font-semibold mb-1 truncate">{t.subject || "—"}</p>
                      <p className="text-xs text-[#5c647a] line-clamp-2">{t.message}</p>
                      <p className="text-[10px] text-[#9ca3af] mt-2">{fmtDate(t.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Detail */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {!selectedId ? (
            <div className="text-center py-12 text-[#5c647a]">
              <span className="material-symbols-outlined text-5xl text-gray-300">arrow_back</span>
              <p className="text-sm mt-3">Sélectionnez un ticket pour voir les détails</p>
            </div>
          ) : detail.isLoading || !detail.data ? (
            <div className="text-sm text-[#5c647a]">Chargement…</div>
          ) : (
            <TicketDetail ticket={detail.data.data} onUpdate={() => {
              qc.invalidateQueries({ queryKey: ["admin-tickets"] });
              qc.invalidateQueries({ queryKey: ["admin-ticket", selectedId] });
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

function TicketDetail({ ticket, onUpdate }: { ticket: TicketFull; onUpdate: () => void }) {
  const [reply, setReply] = useState("");
  const [notes, setNotes] = useState(ticket.adminNotes ?? "");
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`/api/formations/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: reply, sendEmail: true }),
      });
      if (r.ok) { setReply(""); onUpdate(); }
    } finally {
      setSending(false);
    }
  }

  async function saveNotes() {
    await fetch(`/api/formations/admin/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes: notes }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onUpdate();
  }

  async function setStatus(status: Status) {
    await fetch(`/api/formations/admin/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onUpdate();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-widest mb-1">Référence</p>
          <p className="text-lg font-mono font-bold text-[#006e2f]">{ticket.reference}</p>
        </div>
        <select
          value={ticket.status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold"
        >
          <option value="NEW">Nouveau</option>
          <option value="AUTO_REPLIED">IA répondue</option>
          <option value="HUMAN_REPLIED">Répondu</option>
          <option value="CLOSED">Fermé</option>
        </select>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-1">
        <p className="text-sm font-bold text-[#191c1e]">{ticket.name} <span className="font-normal text-[#5c647a]">&lt;{ticket.email}&gt;</span></p>
        <p className="text-xs text-[#5c647a]">Sujet : <strong>{ticket.subject || "—"}</strong></p>
        <p className="text-[10px] text-[#9ca3af]">{fmtDate(ticket.createdAt)} · IP {ticket.ipAddress ?? "—"}</p>
      </div>

      <div>
        <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-widest mb-2">Message original</p>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-[#191c1e] whitespace-pre-wrap leading-relaxed">
          {ticket.message}
        </div>
      </div>

      {ticket.aiReply && (
        <div>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            Réponse IA — {ticket.aiReplyModel ?? "?"} · {ticket.aiReplySentAt ? fmtDate(ticket.aiReplySentAt) : ""}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-[#191c1e] whitespace-pre-wrap leading-relaxed">
            {ticket.aiReply}
          </div>
        </div>
      )}

      {ticket.adminReply && (
        <div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Votre réponse · {ticket.adminReplyAt ? fmtDate(ticket.adminReplyAt) : ""}</p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-[#191c1e] whitespace-pre-wrap leading-relaxed">
            {ticket.adminReply}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-widest mb-2">Répondre à l'utilisateur</p>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={5}
          placeholder="Tapez votre réponse — elle sera envoyée par email à l'utilisateur."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f] resize-none"
        />
        <button
          onClick={sendReply}
          disabled={!reply.trim() || sending}
          className="mt-2 px-5 py-2.5 rounded-xl bg-[#006e2f] text-white text-sm font-bold disabled:opacity-40 inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
          {sending ? "Envoi…" : "Envoyer la réponse"}
        </button>
      </div>

      <div>
        <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-widest mb-2">Notes internes (privées)</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Notes pour l'équipe — pas envoyées à l'utilisateur."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f] resize-none"
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={saveNotes}
            className="px-4 py-2 rounded-lg bg-gray-100 text-[#191c1e] text-xs font-bold hover:bg-gray-200"
          >
            Enregistrer les notes
          </button>
          {saved && <span className="text-xs text-emerald-600 font-semibold">✓ Sauvegardé</span>}
        </div>
      </div>
    </div>
  );
}
