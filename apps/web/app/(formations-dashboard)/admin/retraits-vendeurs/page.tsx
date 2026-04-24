"use client";

/**
 * /admin/retraits-vendeurs
 *
 * L'admin voit toutes les demandes de retrait (vendeurs + mentors)
 * et peut les approuver ou refuser avec motif.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  role: "vendor" | "mentor";
  status: "EN_ATTENTE" | "TRAITE" | "REFUSE";
  refusedReason: string | null;
  accountDetails: Record<string, unknown>;
  processedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    kyc: number;
  };
};

type Summary = {
  total: number;
  pending: number;
  processed: number;
  refused: number;
  pendingAmount: number;
};

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function methodLabel(m: string) {
  const map: Record<string, string> = {
    virement: "Virement bancaire",
    orange_money: "Orange Money",
    wave: "Wave",
    mtn: "MTN MoMo",
    moov: "Moov Money",
    paypal: "PayPal",
    wise: "Wise",
    bank: "Banque",
  };
  return map[m] ?? m;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `il y a ${m} min`;
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${d} j`;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "bg-amber-100", text: "text-amber-800" },
  TRAITE: { label: "Traité", bg: "bg-emerald-100", text: "text-emerald-800" },
  REFUSE: { label: "Refusé", bg: "bg-rose-100", text: "text-rose-800" },
};

export default function AdminRetraitsVendeursPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "EN_ATTENTE" | "TRAITE" | "REFUSE">("EN_ATTENTE");
  const [roleFilter, setRoleFilter] = useState<"all" | "vendor" | "mentor">("all");
  const [toast, setToast] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery<{ data: Withdrawal[]; summary: Summary | null }>({
    queryKey: ["admin-vendor-withdrawals", statusFilter, roleFilter],
    queryFn: () =>
      fetch(`/api/formations/admin/withdrawals?status=${statusFilter}&role=${roleFilter}`).then((r) => r.json()),
    staleTime: 15_000,
  });

  const withdrawals = response?.data ?? [];
  const summary = response?.summary;

  const approveMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/formations/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Retrait approuvé");
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  const refuseMut = useMutation({
    mutationFn: async (args: { id: string; refusedReason: string }) => {
      const res = await fetch(`/api/formations/admin/withdrawals/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refuse", refusedReason: args.refusedReason }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Retrait refusé");
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  async function handleApprove(w: Withdrawal) {
    const ok = await confirmAction({
      title: `Approuver ce retrait de ${fmtFCFA(w.amount)} FCFA ?`,
      message: `Bénéficiaire : ${w.user.name ?? w.user.email} · Méthode : ${methodLabel(w.method)}. Le paiement devra être effectué manuellement.`,
      confirmLabel: "Approuver",
      confirmVariant: "default",
      icon: "check_circle",
    });
    if (ok) approveMut.mutate(w.id);
  }

  async function handleRefuse(w: Withdrawal) {
    const reason = window.prompt(
      `Motif de refus (5 caractères minimum) pour ${w.user.name ?? w.user.email} :`,
      "",
    );
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) setToast("Motif requis (5 caractères minimum)");
      return;
    }
    refuseMut.mutate({ id: w.id, refusedReason: reason.trim() });
  }

  function renderAccountInfo(w: Withdrawal) {
    const d = w.accountDetails || {};
    const parts: string[] = [];
    if (d.phone) parts.push(String(d.phone));
    if (d.iban) parts.push(String(d.iban));
    if (d.email) parts.push(String(d.email));
    if (d.bankName) parts.push(String(d.bankName));
    if (d.accountHolder) parts.push(String(d.accountHolder));
    return parts.length ? parts.join(" · ") : "—";
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl">
          {toast}
        </div>
      )}
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1400px] mx-auto">
        <Link
          href="/admin/dashboard"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 mb-6"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Dashboard
        </Link>

        <header className="mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
            Paiements vendeurs &amp; mentors
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">
            Demandes de retrait
          </h1>
          <p className="text-sm text-zinc-500 mt-3 max-w-2xl">
            Approuvez ou refusez les retraits des vendeurs et mentors. Les paiements réels
            doivent être effectués manuellement via Mobile Money / virement / PayPal.
          </p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-zinc-100 mb-10 border border-zinc-100">
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">En attente</p>
            <p className="text-xl md:text-2xl font-extrabold text-amber-600 tabular-nums break-all">
              {summary?.pending ?? 0}
            </p>
          </div>
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Montant en attente</p>
            <p className="text-xl md:text-2xl font-extrabold text-amber-600 tabular-nums break-all">
              {fmtFCFA(summary?.pendingAmount ?? 0)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">FCFA</p>
          </div>
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Traités</p>
            <p className="text-xl md:text-2xl font-extrabold text-emerald-600 tabular-nums break-all">
              {summary?.processed ?? 0}
            </p>
          </div>
          <div className="bg-zinc-900 text-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Refusés</p>
            <p className="text-xl md:text-2xl font-extrabold tabular-nums break-all">
              {summary?.refused ?? 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="flex gap-0 border border-zinc-100 bg-white">
            {(["EN_ATTENTE", "TRAITE", "REFUSE", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  statusFilter === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-0 border border-zinc-100 bg-white">
            {(["all", "vendor", "mentor"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  roleFilter === r ? "bg-[#22c55e] text-[#004b1e]" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {r === "all" ? "Tous rôles" : r === "vendor" ? "Vendeurs" : "Mentors"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 bg-white border border-zinc-100 animate-pulse" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="bg-white p-16 text-center border border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Aucune demande</p>
            <p className="text-sm text-zinc-500">Aucune demande de retrait ne correspond à ces filtres.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const sc = STATUS_CONFIG[w.status];
              return (
                <div key={w.id} className="bg-white p-6 border border-zinc-100">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(w.user.name ?? w.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-zinc-900 truncate">
                            {w.user.name ?? w.user.email}
                          </p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${w.role === "mentor" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                            {w.role}
                          </span>
                          {w.user.kyc >= 2 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                              <span className="material-symbols-outlined text-[10px]">verified</span>
                              KYC {w.user.kyc}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {w.user.email} · {methodLabel(w.method)} · {timeAgo(w.createdAt)}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-1 font-mono">
                          {renderAccountInfo(w)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 w-full lg:w-auto">
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-zinc-900 tabular-nums">
                          {fmtFCFA(w.amount)}
                        </p>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">FCFA</p>
                      </div>
                      <span className={`inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${sc.bg} ${sc.text} whitespace-nowrap`}>
                        {sc.label}
                      </span>

                      {w.status === "EN_ATTENTE" && (
                        <div className="flex gap-0">
                          <button
                            onClick={() => handleApprove(w)}
                            disabled={approveMut.isPending || refuseMut.isPending}
                            className="px-4 py-2 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors disabled:opacity-50"
                          >
                            Approuver
                          </button>
                          <button
                            onClick={() => handleRefuse(w)}
                            disabled={approveMut.isPending || refuseMut.isPending}
                            className="px-4 py-2 bg-[#ffdad6] text-[#93000a] text-[10px] font-bold uppercase tracking-widest hover:bg-[#ffb4a9] transition-colors disabled:opacity-50"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {w.status === "REFUSE" && w.refusedReason && (
                    <div className="mt-4 border-l-4 border-rose-200 pl-4 py-2 bg-rose-50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700 mb-1">Motif de refus</p>
                      <p className="text-sm text-rose-900">{w.refusedReason}</p>
                    </div>
                  )}

                  {w.status === "TRAITE" && w.processedAt && (
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-700">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Traité le {new Date(w.processedAt).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
