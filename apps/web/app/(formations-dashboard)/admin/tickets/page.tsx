"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StButton,
  StChip,
  ST,
} from "@/components/stitch";
import {
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
  { label: string; tone: "amber" | "blue" | "green" | "neutral" }
> = {
  NEW: { label: "Nouveau", tone: "amber" },
  AUTO_REPLIED: { label: "IA répondue", tone: "blue" },
  HUMAN_REPLIED: { label: "Répondu", tone: "green" },
  CLOSED: { label: "Fermé", tone: "neutral" },
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
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-5">
        <StPageHeader
          title="Support tickets"
          subtitle="Tous les messages reçus via le formulaire de contact, avec auto-réponse IA."
          actions={
            <StButton
              variant="secondary"
              icon={Download}
              onClick={exportCSV}
              disabled={items.length === 0}
            >
              Exporter CSV
            </StButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StKpiCompact
            label="Nouveaux"
            value={counts.NEW ?? 0}
            icon={Inbox}
            tone="amber"
          />
          <StKpiCompact
            label="IA répondue"
            value={counts.AUTO_REPLIED ?? 0}
            icon={Bot}
            tone="blue"
          />
          <StKpiCompact
            label="Répondus"
            value={counts.HUMAN_REPLIED ?? 0}
            icon={MailCheck}
            tone="green"
          />
          <StKpiCompact
            label="Fermés"
            value={counts.CLOSED ?? 0}
            icon={CheckCircle2}
            tone="green"
          />
        </div>

        {/* Filtres */}
        <StCard>
          <div className="space-y-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: ST.textMuted }}
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher par email, nom, référence ou contenu..."
                className="w-full pl-11 pr-4 py-3 rounded-xl text-[13.5px] font-semibold focus:outline-none transition-all"
                style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
              />
            </div>

            <div className="flex flex-wrap gap-1 p-1 rounded-[13px] w-fit" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
              {tabs.map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTab(t.id);
                      setPage(1);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors whitespace-nowrap"
                    style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
                  >
                    {t.label}
                    <span className="text-[10px] tabular-nums">· {t.count}</span>
                  </button>
                );
              })}
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
                      style={on ? { background: ST.green, color: "#fff" } : { color: ST.textSecondary }}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3.5">
          {/* List */}
          <StCard noPadding>
            {list.isLoading ? (
              <div className="p-6 text-[13px] font-semibold" style={{ color: ST.textSecondary }}>Chargement...</div>
            ) : items.length === 0 ? (
              <div className="p-10 flex flex-col items-center text-center">
                {filtersActive ? (
                  <FilterX size={36} style={{ color: "#d6e0da" }} />
                ) : (
                  <Inbox size={36} style={{ color: "#d6e0da" }} />
                )}
                <p className="text-[13.5px] font-extrabold mt-3" style={{ color: ST.text }}>
                  {filtersActive ? "Aucun résultat" : "Aucun ticket"}
                </p>
                <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                  {filtersActive
                    ? "Aucun ticket ne correspond à vos filtres."
                    : "Aucun message dans cette catégorie."}
                </p>
                {filtersActive && (
                  <div className="mt-4">
                    <StButton variant="primary" size="sm" icon={RotateCcw} onClick={resetFilters}>
                      Réinitialiser les filtres
                    </StButton>
                  </div>
                )}
              </div>
            ) : (
              <>
                {bulkIds.size > 0 && (
                  <div className="sticky top-0 z-10 text-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap rounded-t-[18px]" style={{ background: ST.greenDark }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold">
                        {bulkIds.size} sélectionné
                        {bulkIds.size > 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => setBulkIds(new Set())}
                        className="text-[10px] font-semibold text-white/70 hover:text-white underline"
                      >
                        Désélectionner
                      </button>
                      <button
                        onClick={() =>
                          setBulkIds(new Set(items.map((t) => t.id)))
                        }
                        className="text-[10px] font-semibold text-white/70 hover:text-white underline"
                      >
                        Tout sélectionner ({items.length})
                      </button>
                    </div>
                    <button
                      onClick={bulkCloseSelected}
                      disabled={bulkRunning}
                      className="px-3 py-2 rounded-[9px] text-[11px] font-extrabold bg-white/15 hover:bg-white/25 disabled:opacity-50"
                    >
                      {bulkRunning
                        ? "Fermeture..."
                        : `Fermer ${bulkIds.size} ticket${bulkIds.size > 1 ? "s" : ""}`}
                    </button>
                  </div>
                )}
                {bulkToast && (
                  <div className="text-[12px] font-semibold px-4 py-2" style={{ background: ST.greenSoft, borderBottom: "1px solid #d7ecde", color: ST.green }}>
                    {bulkToast}
                  </div>
                )}
                <ul>
                  {items.map((t) => {
                    const sc = STATUS_INFO[t.status];
                    const isSelected = selectedId === t.id;
                    return (
                      <li
                        key={t.id}
                        className="flex items-stretch"
                        style={{
                          borderTop: `1px solid ${ST.divider}`,
                          background: isSelected ? "#f0faf3" : undefined,
                        }}
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
                          className="flex-1 text-left p-4 pl-2 transition-colors hover:bg-[#f7faf8]"
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <p className="text-[13px] font-extrabold truncate flex-1" style={{ color: ST.text }}>
                              {t.name}
                            </p>
                            <StChip tone={sc.tone}>{sc.label}</StChip>
                          </div>
                          <p className="text-[11px] font-mono mb-1" style={{ color: ST.textMuted }}>
                            {t.reference} · {t.email}
                          </p>
                          <p className="text-[12px] font-bold mb-1 truncate" style={{ color: ST.text }}>
                            {t.subject || "—"}
                          </p>
                          <p className="text-[12px] line-clamp-2" style={{ color: ST.textSecondary }}>
                            {t.message}
                          </p>
                          <p className="text-[10px] mt-2" style={{ color: ST.textFaint }}>
                            {fmtDate(t.createdAt)}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </StCard>

          {/* Detail */}
          <StCard>
            {!selectedId ? (
              <div className="text-center py-12" style={{ color: ST.textSecondary }}>
                <ArrowLeftCircle className="mx-auto w-12 h-12" style={{ color: "#d6e0da" }} />
                <p className="text-[13px] font-semibold mt-3">
                  Sélectionnez un ticket pour voir les détails
                </p>
              </div>
            ) : detail.isLoading || !detail.data ? (
              <div className="text-[13px] font-semibold" style={{ color: ST.textSecondary }}>Chargement...</div>
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
          </StCard>
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
          <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: ST.textMuted }}>
            Référence
          </p>
          <p className="text-[18px] font-mono font-extrabold" style={{ color: ST.green }}>
            {ticket.reference}
          </p>
        </div>
        <select
          value={ticket.status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="px-3 py-2 rounded-xl text-[12px] font-semibold focus:outline-none"
          style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
        >
          <option value="NEW">Nouveau</option>
          <option value="AUTO_REPLIED">IA répondue</option>
          <option value="HUMAN_REPLIED">Répondu</option>
          <option value="CLOSED">Fermé</option>
        </select>
      </div>

      <div className="rounded-xl p-4 space-y-1" style={{ background: ST.bg }}>
        <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
          {ticket.name}{" "}
          <span className="font-medium" style={{ color: ST.textSecondary }}>
            &lt;{ticket.email}&gt;
          </span>
        </p>
        <p className="text-[12px]" style={{ color: ST.textSecondary }}>
          Sujet : <strong>{ticket.subject || "—"}</strong>
        </p>
        <p className="text-[10px]" style={{ color: ST.textFaint }}>
          {fmtDate(ticket.createdAt)} · IP {ticket.ipAddress ?? "—"}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ST.textMuted }}>
          Message original
        </p>
        <div className="rounded-xl p-4 text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: ST.text, background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
          {ticket.message}
        </div>
      </div>

      {ticket.aiReply && (
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: ST.blueText }}>
            <Bot size={14} />
            Réponse IA — {ticket.aiReplyModel ?? "?"} ·{" "}
            {ticket.aiReplySentAt ? fmtDate(ticket.aiReplySentAt) : ""}
          </p>
          <div className="rounded-xl p-4 text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: ST.text, background: ST.blueSoft, border: "1px solid #cfe3f5" }}>
            {ticket.aiReply}
          </div>
        </div>
      )}

      {ticket.adminReply && (
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ST.green }}>
            Votre réponse ·{" "}
            {ticket.adminReplyAt ? fmtDate(ticket.adminReplyAt) : ""}
          </p>
          <div className="rounded-xl p-4 text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: ST.text, background: ST.greenSoft, border: "1px solid #d7ecde" }}>
            {ticket.adminReply}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ST.textMuted }}>
          Répondre à l&apos;utilisateur
        </p>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={5}
          placeholder="Tapez votre réponse — elle sera envoyée par email à l'utilisateur."
          className="w-full px-4 py-3 rounded-xl text-[13.5px] font-medium focus:outline-none transition-all resize-none"
          style={{ color: "#33453b", border: "1px solid #dde6e0", background: "#fff" }}
        />
        <div className="mt-2">
          <StButton
            variant="primary"
            icon={Send}
            onClick={sendReply}
            disabled={!reply.trim() || sending}
          >
            {sending ? "Envoi..." : "Envoyer la réponse"}
          </StButton>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ST.textMuted }}>
          Notes internes (privées)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Notes pour l'équipe — pas envoyées à l'utilisateur."
          className="w-full px-4 py-3 rounded-xl text-[13.5px] font-medium focus:outline-none transition-all resize-none"
          style={{ color: "#33453b", border: "1px solid #dde6e0", background: "#fff" }}
        />
        <div className="flex items-center gap-2 mt-2">
          <StButton variant="secondary" size="sm" icon={Save} onClick={saveNotes}>
            Enregistrer les notes
          </StButton>
          {saved && (
            <span className="text-[12px] font-semibold inline-flex items-center gap-1" style={{ color: ST.green }}>
              <CheckCircle2 size={12} />
              Sauvegardé
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
