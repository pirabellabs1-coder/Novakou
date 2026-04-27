"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Status = "NEW" | "AUTO_REPLIED" | "HUMAN_REPLIED" | "CLOSED";

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

export default function AdminTicketsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const items = list.data?.data.items ?? [];
  const counts = list.data?.data.statusCounts ?? {};

  const tabs: { id: Status | "all"; label: string }[] = useMemo(() => [
    { id: "all", label: "Tous" },
    { id: "NEW", label: `Nouveau (${counts.NEW ?? 0})` },
    { id: "AUTO_REPLIED", label: `IA répondue (${counts.AUTO_REPLIED ?? 0})` },
    { id: "HUMAN_REPLIED", label: `Répondu (${counts.HUMAN_REPLIED ?? 0})` },
    { id: "CLOSED", label: `Fermé (${counts.CLOSED ?? 0})` },
  ], [counts]);

  return (
    <div className="p-5 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Support tickets</h1>
        <p className="text-sm text-[#5c647a] mt-1">Tous les messages reçus via le formulaire de contact, avec auto-réponse IA.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher par email, nom, référence ou contenu…"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#006e2f]"
        />
      </div>

      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {list.isLoading ? (
            <div className="p-6 text-sm text-[#5c647a]">Chargement…</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300">inbox</span>
              <p className="text-sm text-[#5c647a] mt-3">Aucun ticket dans cette catégorie</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedId === t.id ? "bg-[#006e2f]/5" : ""}`}
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
