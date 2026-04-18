"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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

export default function AdminSignalementsPage() {
  const [tab, setTab] = useState<"reports" | "refunds">("reports");

  const { data: response, isLoading } = useQuery<{ data: Data; summary: Summary | null }>({
    queryKey: ["admin-signalements"],
    queryFn: () => fetch("/api/formations/admin/signalements").then((r) => r.json()),
    staleTime: 15_000,
  });

  const reports = response?.data?.reports ?? [];
  const refunds = response?.data?.refundRequests ?? [];
  const summary = response?.summary;

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
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
            <p className="text-3xl font-extrabold tracking-tighter text-zinc-900 tabular-nums">
              {isLoading ? "…" : summary?.totalReports ?? 0}
            </p>
          </div>
          <div className="bg-white p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Remboursements</p>
            <p className="text-3xl font-extrabold tracking-tighter text-zinc-900 tabular-nums">
              {isLoading ? "…" : summary?.totalRefunds ?? 0}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">En attente</p>
          </div>
          <div className="bg-zinc-900 p-8 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Montant à rembourser</p>
            <p className="text-3xl font-extrabold tracking-tighter tabular-nums">
              {isLoading ? "…" : formatFCFA(summary?.pendingRefundAmount ?? 0)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">FCFA</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border border-zinc-100 bg-white mb-8 w-fit">
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

        {/* Reports list */}
        {tab === "reports" && (
          <div className="space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => <div key={i} className="h-28 bg-white animate-pulse" />)
            ) : reports.length === 0 ? (
              <div className="bg-white p-16 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Tout est calme</p>
                <p className="text-sm text-zinc-500">Aucun contenu signalé actuellement.</p>
              </div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="bg-white p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
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
                      <button className="px-4 py-2 bg-[#ffdad6] text-[#93000a] text-[10px] font-bold uppercase tracking-widest hover:bg-[#ffb4a9] transition-colors">
                        Supprimer
                      </button>
                      <button className="px-4 py-2 bg-zinc-200 text-zinc-700 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors">
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
              ))
            )}
          </div>
        )}

        {/* Refunds */}
        {tab === "refunds" && (
          <div className="space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => <div key={i} className="h-28 bg-white animate-pulse" />)
            ) : refunds.length === 0 ? (
              <div className="bg-white p-16 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Aucun litige</p>
                <p className="text-sm text-zinc-500">Aucune demande de remboursement en attente.</p>
              </div>
            ) : (
              refunds.map((r) => (
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
                      <button className="px-4 py-2 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors">
                        Approuver
                      </button>
                      <button className="px-4 py-2 bg-[#ffdad6] text-[#93000a] text-[10px] font-bold uppercase tracking-widest hover:bg-[#ffb4a9] transition-colors">
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
