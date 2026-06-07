"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
import {
  Headphones,
  Search,
  Download,
  Bot,
  MailCheck,
  Send,
  Save,
  RotateCcw,
  FilterX,
  Inbox,
  CheckCircle2,
  ArrowLeftCircle,
} from "lucide-react";

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

const STATUS_INFO: Record<
  Status,
  { label: string; variant: "orange" | "blue" | "green" | "slate" }
> = {
  NEW: { label: "Nouveau", variant: "orange" },
  AUTO_REPLIED: { label: "IA répondue", variant: "blue" },
  HUMAN_REPLIED: { label: "Répondu", variant: "green" },
  CLOSED: { label: "Fermé", variant: "slate" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  const [period, setPeriod] = useState<Period>("all");
  const [customSince, setCustomSince] = useState("");

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

  const list = useQuery<{
    data: {
      items: TicketSummary[];
      total: number;
      statusCounts: Record<string, number>;
    };
  }>({
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
    queryFn: () =>
      fetch(`/api/formations/admin/tickets/${selectedId}`).then((r) =>
        r.json()
      ),
    enabled: !!selectedId,
  });

  const rawItems = list.data?.data.items ?? [];
  const counts = list.data?.data.statusCounts ?? {};
  const totalAll = list.data?.data.total ?? 0;

  const cutoff = useMemo(
    () => periodCutoff(period, customSince),
    [period, customSince]
  );

  const items = useMemo(
    () => rawItems.filter((t) => new Date(t.createdAt).getTime() >= cutoff),
    [rawItems, cutoff]
  );

  const tabs: { id: Status | "all"; label: string; count: number }[] = useMemo(
    () => [
      { id: "all", label: "Tous", count: totalAll },
      { id: "NEW", label: "Nouveau", count: counts.NEW ?? 0 },
      {
        id: "AUTO_REPLIED",
        label: "IA répondue",
        count: counts.AUTO_REPLIED ?? 0,
      },
      {
        id: "HUMAN_REPLIED",
        label: "Répondu",
        count: counts.HUMAN_REPLIED ?? 0,
      },
      { id: "CLOSED", label: "Fermé", count: counts.CLOSED ?? 0 },
    ],
    [counts, totalAll]
  );

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
          }).then((r) =>
            r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))
          )
        )
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const ko = results.length - ok;
      setBulkToast(
        ko === 0
          ? `${ok} ticket(s) fermé(s)`
          : `${ok} fermés, ${ko} échec(s)`
      );
      setBulkIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    } finally {
      setBulkRunning(false);
      setTimeout(() => setBulkToast(null), 4000);
    }
  }

  function exportCSV() {
    if (items.length === 0) return;
    const headers = [
      "Référence",
      "Date",
      "Nom",
      "Email",
      "Sujet",
      "Message",
      "Statut",
      "IA modèle",
      "IA envoyée",
      "Admin répondu",
    ];
    const rows = items.map((t) => [
      t.reference,
      new Date(t.createdAt).toISOString(),
      t.name,
      t.email,
      t.subject ?? "",
      t.message,
      STATUS_INFO[t.status].label,
      t.aiReplyModel ?? "",
      t.aiReplySentAt ?? "",
      t.adminReplyAt ?? "",
    ]);
    const csv = [
      headers.map(csvEscape).join(","),
      ...rows.map((r) => r.map(csvEscape).join(",")),
    ].join("\n");
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
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

  const filtersActive =
    search.trim() !== "" ||
    tab !== "all" ||
    period !== "all" ||
    customSince !== "";

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1600px] mx-auto space-y-8">
        <KazaHero
          badge="Admin"
          badgeColor="orange"
          icon={Headphones}
          title="Support tickets"
          subtitle="Tous les messages reçus via le formulaire de contact, avec auto-réponse IA."
          actions={
            <KazaButton
              variant="secondary"
              icon={Download}
              onClick={exportCSV}
              disabled={items.length === 0}
            >
              Exporter CSV
            </KazaButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KazaKpiCard
            label="Nouveaux"
            value={counts.NEW ?? 0}
            icon={Inbox}
            iconColor="orange"
          />
          <KazaKpiCard
            label="IA répondue"
            value={counts.AUTO_REPLIED ?? 0}
            icon={Bot}
            iconColor="sky"
          />
          <KazaKpiCard
            label="Répondus"
            value={counts.HUMAN_REPLIED ?? 0}
            icon={MailCheck}
            iconColor="emerald"
          />
          <KazaKpiCard
            label="Fermés"
            value={counts.CLOSED ?? 0}
            icon={CheckCircle2}
            iconColor="navy"
          />
        </div>

        {/* Filtres */}
        <KazaCard>
          <div className="space-y-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher par email, nom, référence ou contenu..."
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl w-fit">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    tab === t.id
                      ? "bg-[#0b2540] text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.label}
                  <span
                    className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${
                      tab === t.id
                        ? "bg-white/15 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
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
                        ? "bg-emerald-500 text-white shadow"
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
          {/* List */}
          <KazaCard noPadding>
            {list.isLoading ? (
              <div className="p-6 text-sm text-slate-500">Chargement...</div>
            ) : items.length === 0 ? (
              <div className="p-5">
                <KazaEmpty
                  icon={filtersActive ? FilterX : Inbox}
                  title={filtersActive ? "Aucun résultat" : "Aucun ticket"}
                  description={
                    filtersActive
                      ? "Aucun ticket ne correspond à vos filtres."
                      : "Aucun message dans cette catégorie."
                  }
                  action={
                    filtersActive
                      ? {
                          label: "Réinitialiser les filtres",
                          onClick: resetFilters,
                        }
                      : undefined
                  }
                />
              </div>
            ) : (
              <>
                {bulkIds.size > 0 && (
                  <div className="sticky top-0 z-10 bg-[#0b2540] text-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold">
                        {bulkIds.size} sélectionné
                        {bulkIds.size > 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => setBulkIds(new Set())}
                        className="text-[10px] font-semibold text-slate-300 hover:text-white underline"
                      >
                        Désélectionner
                      </button>
                      <button
                        onClick={() =>
                          setBulkIds(new Set(items.map((t) => t.id)))
                        }
                        className="text-[10px] font-semibold text-slate-300 hover:text-white underline"
                      >
                        Tout sélectionner ({items.length})
                      </button>
                    </div>
                    <KazaButton
                      variant="primary"
                      size="sm"
                      onClick={bulkCloseSelected}
                      disabled={bulkRunning}
                    >
                      {bulkRunning
                        ? "Fermeture..."
                        : `Fermer ${bulkIds.size} ticket${bulkIds.size > 1 ? "s" : ""}`}
                    </KazaButton>
                  </div>
                )}
                {bulkToast && (
                  <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold px-4 py-2">
                    {bulkToast}
                  </div>
                )}
                <ul className="divide-y divide-slate-100">
                  {items.map((t) => {
                    const sc = STATUS_INFO[t.status];
                    const isSelected = selectedId === t.id;
                    return (
                      <li
                        key={t.id}
                        className={`flex items-stretch ${isSelected ? "bg-emerald-50/40" : ""}`}
                      >
                        <label className="flex items-start pt-5 pl-4 pr-2 cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={bulkIds.has(t.id)}
                            onChange={() => toggleBulk(t.id)}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                            aria-label="Sélectionner ce ticket"
                          />
                        </label>
                        <button
                          onClick={() => setSelectedId(t.id)}
                          className="flex-1 text-left p-4 pl-2 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <p className="text-sm font-bold text-slate-900 truncate flex-1">
                              {t.name}
                            </p>
                            <KazaBadge variant={sc.variant}>
                              {sc.label}
                            </KazaBadge>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mb-1">
                            {t.reference} · {t.email}
                          </p>
                          <p className="text-xs text-slate-900 font-semibold mb-1 truncate">
                            {t.subject || "—"}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {t.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {fmtDate(t.createdAt)}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </KazaCard>

          {/* Detail */}
          <KazaCard>
            {!selectedId ? (
              <div className="text-center py-12 text-slate-500">
                <ArrowLeftCircle
                  className="mx-auto w-12 h-12 text-slate-300"
                />
                <p className="text-sm mt-3">
                  Sélectionnez un ticket pour voir les détails
                </p>
              </div>
            ) : detail.isLoading || !detail.data ? (
              <div className="text-sm text-slate-500">Chargement...</div>
            ) : (
              <TicketDetail
                ticket={detail.data.data}
                onUpdate={() => {
                  qc.invalidateQueries({ queryKey: ["admin-tickets"] });
                  qc.invalidateQueries({
                    queryKey: ["admin-ticket", selectedId],
                  });
                }}
              />
            )}
          </KazaCard>
        </div>
      </main>
    </div>
  );
}

function TicketDetail({
  ticket,
  onUpdate,
}: {
  ticket: TicketFull;
  onUpdate: () => void;
}) {
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
      if (r.ok) {
        setReply("");
        onUpdate();
      }
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
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Référence
          </p>
          <p className="text-lg font-mono font-bold text-emerald-700">
            {ticket.reference}
          </p>
        </div>
        <select
          value={ticket.status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
        >
          <option value="NEW">Nouveau</option>
          <option value="AUTO_REPLIED">IA répondue</option>
          <option value="HUMAN_REPLIED">Répondu</option>
          <option value="CLOSED">Fermé</option>
        </select>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-1">
        <p className="text-sm font-bold text-slate-900">
          {ticket.name}{" "}
          <span className="font-normal text-slate-500">
            &lt;{ticket.email}&gt;
          </span>
        </p>
        <p className="text-xs text-slate-500">
          Sujet : <strong>{ticket.subject || "—"}</strong>
        </p>
        <p className="text-[10px] text-slate-400">
          {fmtDate(ticket.createdAt)} · IP {ticket.ipAddress ?? "—"}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Message original
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
          {ticket.message}
        </div>
      </div>

      {ticket.aiReply && (
        <div>
          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Bot size={14} />
            Réponse IA — {ticket.aiReplyModel ?? "?"} ·{" "}
            {ticket.aiReplySentAt ? fmtDate(ticket.aiReplySentAt) : ""}
          </p>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
            {ticket.aiReply}
          </div>
        </div>
      )}

      {ticket.adminReply && (
        <div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">
            Votre réponse ·{" "}
            {ticket.adminReplyAt ? fmtDate(ticket.adminReplyAt) : ""}
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
            {ticket.adminReply}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Répondre à l'utilisateur
        </p>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={5}
          placeholder="Tapez votre réponse — elle sera envoyée par email à l'utilisateur."
          className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm focus:outline-none transition-all resize-none"
        />
        <div className="mt-2">
          <KazaButton
            variant="primary"
            icon={Send}
            onClick={sendReply}
            disabled={!reply.trim() || sending}
          >
            {sending ? "Envoi..." : "Envoyer la réponse"}
          </KazaButton>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          Notes internes (privées)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Notes pour l'équipe — pas envoyées à l'utilisateur."
          className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-sm focus:outline-none transition-all resize-none"
        />
        <div className="flex items-center gap-2 mt-2">
          <KazaButton variant="ghost" size="sm" icon={Save} onClick={saveNotes}>
            Enregistrer les notes
          </KazaButton>
          {saved && (
            <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 size={12} />
              Sauvegardé
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
