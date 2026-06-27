"use client";

/**
 * /admin/affiliate-withdrawals
 * Demandes de retrait des affiliés. L'admin verse via PayGenius (ou manuel),
 * ou refuse (les commissions réservées sont alors libérées).
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import { promptAction } from "@/store/prompt";
import { ST, StPageHeader, StCard, StChip, StButton } from "@/components/stitch";
import { ArrowLeft, Banknote, Check, X, Loader2, Inbox } from "lucide-react";

type Row = {
  id: string; amount: number; method: string; methodLabel: string;
  accountDetails: Record<string, unknown>; status: string; refusedReason: string | null;
  paymentRef: string | null; createdAt: string; processedAt: string | null;
  affiliateCode: string | null; name: string | null; email: string | null; country: string | null;
};

const TABS = [
  { key: "EN_ATTENTE", label: "À traiter" },
  { key: "TRAITE", label: "Versés" },
  { key: "REFUSE", label: "Refusés" },
  { key: "all", label: "Tous" },
];
const fcfa = (n: number) => Math.round(n).toLocaleString("fr-FR") + " FCFA";

export default function AdminAffiliateWithdrawalsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("EN_ATTENTE");
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: { items: Row[]; statusCounts: Record<string, number> } }>({
    queryKey: ["admin-affiliate-withdrawals", tab],
    queryFn: () => fetch(`/api/formations/admin/affiliate-withdrawals?status=${tab}`).then((r) => r.json()),
    staleTime: 15_000,
  });
  const items = data?.data?.items ?? [];
  const counts = data?.data?.statusCounts ?? {};

  const act = useMutation({
    mutationFn: (body: { id: string; action: string; mode?: string; refusedReason?: string }) =>
      fetch(`/api/formations/admin/affiliate-withdrawals/${body.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Erreur"); return j; }),
    onSettled: () => { qc.invalidateQueries({ queryKey: ["admin-affiliate-withdrawals"] }); setBusy(null); },
  });

  async function approve(r: Row, mode: "paygenius" | "manual") {
    const label = mode === "manual" ? "Marquer payé manuellement" : "Verser via PayGenius";
    const ok = await confirmAction({
      title: `${label} — ${fcfa(r.amount)}`,
      message: `${r.name ?? r.email} · ${r.methodLabel}\nDestination : ${JSON.stringify(r.accountDetails)}`,
      confirmLabel: label,
    });
    if (!ok) return;
    setBusy(r.id);
    try { await act.mutateAsync({ id: r.id, action: "approve", mode }); }
    catch (e) { await confirmAction({ title: "Échec", message: (e as Error).message, confirmLabel: "OK" }); }
  }
  async function reject(r: Row) {
    const reason = await promptAction({ title: "Refuser le retrait", message: "Motif (≥ 5 caractères) :", confirmLabel: "Refuser" });
    if (!reason || reason.trim().length < 5) return;
    setBusy(r.id);
    try { await act.mutateAsync({ id: r.id, action: "reject", refusedReason: reason.trim() }); }
    catch (e) { await confirmAction({ title: "Échec", message: (e as Error).message, confirmLabel: "OK" }); }
  }

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1100px] mx-auto">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-[12.5px] font-bold mb-3 hover:underline" style={{ color: ST.green }}>
          <ArrowLeft size={15} /> Tableau de bord
        </Link>
        <StPageHeader title="Retraits affiliés" subtitle="Versez les commissions des affiliés (PayGenius) ou refusez une demande." />

        <div className="flex flex-wrap gap-1.5 mb-4">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="text-[12px] font-bold px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5"
              style={{ borderColor: tab === t.key ? ST.green : ST.cardBorder, color: tab === t.key ? ST.green : ST.textSecondary, background: tab === t.key ? ST.greenSoft : "#fff" }}>
              {t.label}{t.key !== "all" && counts[t.key] ? <span className="opacity-70">({counts[t.key]})</span> : null}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <StCard key={i}><div className="h-20 animate-pulse" /></StCard>)}</div>
        ) : items.length === 0 ? (
          <StCard>
            <div className="flex flex-col items-center py-10 text-center">
              <Inbox size={30} style={{ color: ST.textMuted }} />
              <p className="text-[13px] mt-2" style={{ color: ST.textMuted }}>Aucune demande dans cette catégorie.</p>
            </div>
          </StCard>
        ) : (
          <div className="space-y-2.5">
            {items.map((r) => {
              const dest = (r.accountDetails?.msisdn as string) || (r.accountDetails?.iban as string) || "—";
              const date = new Date(r.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
              return (
                <StCard key={r.id}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote size={16} style={{ color: ST.green }} />
                        <span className="font-extrabold text-[15px]" style={{ color: ST.text }}>{fcfa(r.amount)}</span>
                        <StChip tone={r.status === "TRAITE" ? "green" : r.status === "REFUSE" ? "rose" : "amber"}>
                          {r.status === "TRAITE" ? "Versé" : r.status === "REFUSE" ? "Refusé" : "À traiter"}
                        </StChip>
                      </div>
                      <p className="text-[12.5px]" style={{ color: ST.text }}>{r.name ?? "—"} · <span style={{ color: ST.textSecondary }}>{r.email}</span></p>
                      <p className="text-[11.5px] mt-0.5" style={{ color: ST.textSecondary }}>
                        {r.methodLabel} · <span className="font-mono">{dest}</span>{r.country ? ` · ${r.country}` : ""} · code {r.affiliateCode ?? "—"}
                      </p>
                      <p className="text-[10.5px] mt-0.5" style={{ color: ST.textMuted }}>{date}{r.paymentRef ? ` · réf ${r.paymentRef}` : ""}</p>
                      {r.status === "REFUSE" && r.refusedReason && <p className="text-[11px] mt-1" style={{ color: ST.roseText }}>{r.refusedReason}</p>}
                    </div>
                    {r.status === "EN_ATTENTE" && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => approve(r, "paygenius")} disabled={busy === r.id}
                          className="inline-flex items-center gap-1 text-[11.5px] font-extrabold px-3 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: ST.green }}>
                          {busy === r.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Verser (PayGenius)
                        </button>
                        <button onClick={() => approve(r, "manual")} disabled={busy === r.id}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: ST.cardBorder, color: ST.textSecondary }}>
                          Payé manuellement
                        </button>
                        <button onClick={() => reject(r)} disabled={busy === r.id}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: ST.cardBorder, color: ST.roseText }}>
                          <X size={13} /> Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </StCard>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
