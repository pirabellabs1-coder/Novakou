"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flag } from "@/components/ui/Flag";

type Row = { code: string; name: string; users: number; vendors: number; buyers: number };
type Resp = { data: Row[]; totals: { users: number; vendors: number; buyers: number } };

const fmt = (n: number) => n.toLocaleString("fr-FR");

export default function AdminPaysPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Resp>({
    queryKey: ["admin-stats-countries"],
    queryFn: () => fetch("/api/admin/stats/countries").then((r) => r.json()),
    staleTime: 60_000,
  });
  const rows = data?.data ?? [];
  const totals = data?.totals ?? { users: 0, vendors: 0, buyers: 0 };

  // Backfill du pays des comptes existants (par lots, depuis la dernière IP).
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);
  const backfill = useMutation({
    mutationFn: async () => {
      let totalUpdated = 0;
      // On enchaîne les lots jusqu'à épuisement (borné pour ne pas boucler à l'infini).
      for (let i = 0; i < 40; i++) {
        const res = await fetch("/api/admin/stats/countries/backfill", { method: "POST" });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Erreur");
        totalUpdated += j.data?.updated ?? 0;
        setBackfillMsg(`En cours… ${totalUpdated} renseigné(s), ${j.data?.remaining ?? 0} restant(s)`);
        if (j.data?.done || j.data?.treated === 0) break;
      }
      return totalUpdated;
    },
    onSuccess: (n) => {
      setBackfillMsg(`Terminé : ${n} compte(s) renseigné(s).`);
      qc.invalidateQueries({ queryKey: ["admin-stats-countries"] });
    },
    onError: (e: Error) => setBackfillMsg(`Erreur : ${e.message}`),
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-extrabold text-[#111827] mb-1">Répartition par pays</h1>
        <p className="text-sm text-[#5c647a] mb-4">
          Utilisateurs, vendeurs et acheteurs par pays. Le pays des comptes Google est déduit à la
          connexion (« Inconnu » tant qu'il n'a pas été déterminé).
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => { setBackfillMsg(null); backfill.mutate(); }}
            disabled={backfill.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}
          >
            {backfill.isPending ? "Traitement…" : "Renseigner les pays manquants"}
          </button>
          {backfillMsg && <span className="text-[12.5px] font-semibold text-[#5c647a]">{backfillMsg}</span>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            ["Utilisateurs", totals.users],
            ["Vendeurs", totals.vendors],
            ["Acheteurs", totals.buyers],
          ].map(([label, val]) => (
            <div key={label as string} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">{label}</p>
              <p className="text-2xl font-extrabold text-[#111827] tabular-nums">{isLoading ? "…" : fmt(val as number)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">
            <span>Pays</span>
            <span className="text-right">Utilisateurs</span>
            <span className="text-right">Vendeurs</span>
            <span className="text-right">Acheteurs</span>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-8 bg-gray-50 rounded animate-pulse" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#5c647a]">Aucune donnée.</p>
          ) : (
            rows.map((r) => (
              <div
                key={r.code}
                className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b border-gray-50 items-center text-sm"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {r.code === "??" ? <span>🌍</span> : <Flag code={r.code} size="md" title={r.name} />}
                  <span className="font-bold text-[#111827] truncate">{r.name}</span>
                </span>
                <span className="text-right font-extrabold tabular-nums text-[#111827]">{fmt(r.users)}</span>
                <span className="text-right font-semibold tabular-nums text-[#006e2f]">{fmt(r.vendors)}</span>
                <span className="text-right font-semibold tabular-nums text-[#2563eb]">{fmt(r.buyers)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
