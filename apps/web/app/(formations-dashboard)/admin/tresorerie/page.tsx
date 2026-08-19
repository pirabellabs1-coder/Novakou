"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StButton,
  StChip,
  StStatusPill,
  ST,
} from "@/components/stitch";
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Percent,
  RefreshCw,
  Download,
  Inbox,
  AlertTriangle,
} from "lucide-react";

/**
 * TRÉSORERIE — où est l'argent, d'où il vient, par où il est passé.
 *
 * Trois blocs, du plus vrai au plus détaillé :
 *   1. Soldes RÉELS chez chaque passerelle (interrogés chez elles, jamais
 *      recalculés) — et, quand une passerelle n'expose pas de solde, on le dit.
 *   2. Totaux par passerelle sur la période : encaissé, commission, versé.
 *   3. Le journal de tous les mouvements, filtrable, exportable en CSV.
 */

type Solde = { passerelle: string; disponible: boolean; lignes: Array<{ libelle: string; devise: string; solde: number }>; note: string | null };
type Total = { passerelle: string; entrees: number; nbEntrees: number; commission: number; sorties: number; nbSorties: number; sortiesRefusees: number };
type Mouvement = {
  id: string; date: string; sens: "entree" | "sortie"; type: string; montant: number; devise: string;
  passerelle: string; moyen: string | null; statut: string; reference: string | null; tiers: string | null;
  detail: string | null; commission?: number; partVendeur?: number; partAffilie?: number;
};
type Reponse = { periode: { depuis: string; jusqu: string }; soldes: Solde[]; totaux: Total[]; mouvements: Mouvement[]; nbMouvements: number };

const NOMS: Record<string, string> = {
  pawapay: "PawaPay", feexpay: "FeexPay", fedapay: "FedaPay", monetbil: "Monetbil", ipaymoney: "iPay Money",
  kkiapay: "KkiaPay", gratuit: "Gratuit (0 F)", manuel: "Manuel", inconnue: "Inconnue", "—": "Non versé",
};
const nom = (p: string) => NOMS[p] ?? p;

const TYPES: Record<string, string> = {
  vente: "Vente", retrait_vendeur: "Retrait vendeur", retrait_mentor: "Retrait mentor",
  retrait_affilie: "Retrait affilié", retrait_plateforme: "Retrait plateforme",
};

const fmt = (n: number, devise = "XOF") =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n))} ${devise === "XOF" ? "F" : devise}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

type Periode = "7d" | "30d" | "90d" | "mois" | "tout";
function bornes(p: Periode): { depuis?: string; jusqu?: string } {
  const now = new Date();
  if (p === "tout") return { depuis: "2024-01-01T00:00:00Z" };
  if (p === "mois") return { depuis: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
  const j = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  return { depuis: new Date(now.getTime() - j * 24 * 3600 * 1000).toISOString() };
}

export default function TresoreriePage() {
  const [periode, setPeriode] = useState<Periode>("30d");
  const [passerelle, setPasserelle] = useState<string>("");
  const [sens, setSens] = useState<"" | "entree" | "sortie">("");
  const [statut, setStatut] = useState<string>("");

  const b = bornes(periode);
  const qs = new URLSearchParams();
  if (b.depuis) qs.set("depuis", b.depuis);
  if (passerelle) qs.set("passerelle", passerelle);

  const { data, isLoading, isFetching, refetch, error } = useQuery<Reponse>({
    queryKey: ["admin-tresorerie", periode, passerelle],
    queryFn: async () => {
      const r = await fetch(`/api/formations/admin/tresorerie?${qs.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Erreur");
      return j.data as Reponse;
    },
    staleTime: 30_000,
  });

  const lignes = useMemo(() => {
    let l = data?.mouvements ?? [];
    if (sens) l = l.filter((m) => m.sens === sens);
    if (statut) l = l.filter((m) => m.statut === statut);
    return l;
  }, [data, sens, statut]);

  const passerellesConnues = useMemo(() => {
    const s = new Set<string>();
    (data?.totaux ?? []).forEach((t) => s.add(t.passerelle));
    ["pawapay", "feexpay", "fedapay", "monetbil"].forEach((p) => s.add(p));
    return [...s];
  }, [data]);

  const synthese = useMemo(() => {
    const t = data?.totaux ?? [];
    return {
      entrees: t.reduce((s, x) => s + x.entrees, 0),
      nbEntrees: t.reduce((s, x) => s + x.nbEntrees, 0),
      commission: t.reduce((s, x) => s + x.commission, 0),
      sorties: t.reduce((s, x) => s + x.sorties, 0),
      nbSorties: t.reduce((s, x) => s + x.nbSorties, 0),
      refus: t.reduce((s, x) => s + x.sortiesRefusees, 0),
    };
  }, [data]);

  function exporterCsv() {
    const en = ["date", "sens", "type", "montant", "devise", "passerelle", "moyen", "statut", "reference", "tiers", "commission", "part_vendeur", "part_affilie", "detail"];
    const rows = lignes.map((m) => [
      m.date, m.sens, TYPES[m.type] ?? m.type, m.montant, m.devise, nom(m.passerelle), m.moyen ?? "", m.statut,
      m.reference ?? "", m.tiers ?? "", m.commission ?? "", m.partVendeur ?? "", m.partAffilie ?? "", (m.detail ?? "").replace(/[\r\n]+/g, " "),
    ]);
    const csv = [en, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tresorerie-novakou-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="p-5 md:p-7 max-w-[1400px] mx-auto space-y-5" style={{ background: ST.bg }}>
      <StPageHeader
        title="Trésorerie"
        subtitle="Où est l'argent, d'où il vient, par quelle passerelle il est passé."
        actions={
          <div className="flex items-center gap-2">
            <StButton variant="secondary" icon={RefreshCw} onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Actualisation…" : "Actualiser"}
            </StButton>
            <StButton variant="secondary" icon={Download} onClick={exporterCsv} disabled={lignes.length === 0}>
              Exporter CSV
            </StButton>
          </div>
        }
      />

      {/* ── 1. Soldes réels chez les passerelles ─────────────────────── */}
      <section>
        <h2 className="text-[12px] font-extrabold uppercase tracking-wide mb-2.5" style={{ color: ST.textLabel }}>
          Soldes réels chez les passerelles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {(data?.soldes ?? ["pawapay", "feexpay", "fedapay", "monetbil"].map((p) => ({ passerelle: p, disponible: false, lignes: [], note: null }))).map((s) => (
            <StCard key={s.passerelle} className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>{nom(s.passerelle)}</div>
                {s.disponible ? (
                  <StChip tone="green">lu chez la passerelle</StChip>
                ) : (
                  <StChip tone="neutral">non lisible</StChip>
                )}
              </div>
              {isLoading && !data ? (
                <div className="h-8 rounded animate-pulse" style={{ background: ST.divider }} />
              ) : s.disponible && s.lignes.length > 0 ? (
                <ul className="space-y-1">
                  {s.lignes.map((l, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-semibold truncate" style={{ color: ST.textSecondary }}>{l.libelle}</span>
                      <span className="text-[16px] font-extrabold tabular-nums" style={{ color: ST.text }}>{fmt(l.solde, l.devise)}</span>
                    </li>
                  ))}
                </ul>
              ) : s.disponible ? (
                <div className="text-[12.5px] font-semibold" style={{ color: ST.textMuted }}>Aucun portefeuille renvoyé.</div>
              ) : (
                <div className="text-[12px] leading-snug flex items-start gap-1.5" style={{ color: ST.textMuted }}>
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  <span>{s.note ?? "non configurée"}</span>
                </div>
              )}
            </StCard>
          ))}
        </div>
        <p className="text-[11px] mt-2" style={{ color: ST.textFaint }}>
          Ces chiffres sont demandés aux passerelles au chargement de la page — ce n'est pas un calcul de notre côté.
          Un solde « non lisible » signifie que la passerelle n'offre pas cette lecture par API : il faut le regarder sur son tableau de bord.
        </p>
      </section>

      {/* ── 2. Filtres ───────────────────────────────────────────────── */}
      <StCard className="!p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: ST.divider }}>
            {(["7d", "30d", "90d", "mois", "tout"] as Periode[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors"
                style={periode === p ? { background: "#fff", color: ST.green, boxShadow: "0 1px 2px rgba(0,0,0,.06)" } : { color: ST.textSecondary }}
              >
                {p === "7d" ? "7 jours" : p === "30d" ? "30 jours" : p === "90d" ? "90 jours" : p === "mois" ? "Ce mois" : "Tout"}
              </button>
            ))}
          </div>
          <select value={passerelle} onChange={(e) => setPasserelle(e.target.value)} className="px-3 py-2 rounded-xl border text-[12.5px] font-bold" style={{ borderColor: ST.cardBorder, color: ST.text }}>
            <option value="">Toutes les passerelles</option>
            {passerellesConnues.map((p) => <option key={p} value={p}>{nom(p)}</option>)}
          </select>
          <select value={sens} onChange={(e) => setSens(e.target.value as "" | "entree" | "sortie")} className="px-3 py-2 rounded-xl border text-[12.5px] font-bold" style={{ borderColor: ST.cardBorder, color: ST.text }}>
            <option value="">Entrées et sorties</option>
            <option value="entree">Entrées (encaissements)</option>
            <option value="sortie">Sorties (versements)</option>
          </select>
          <select value={statut} onChange={(e) => setStatut(e.target.value)} className="px-3 py-2 rounded-xl border text-[12.5px] font-bold" style={{ borderColor: ST.cardBorder, color: ST.text }}>
            <option value="">Tous statuts</option>
            <option value="encaisse">Encaissé</option>
            <option value="TRAITE">Versé</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="REFUSE">Refusé</option>
          </select>
          <span className="ml-auto text-[12px] font-bold" style={{ color: ST.textMuted }}>
            {lignes.length} mouvement{lignes.length > 1 ? "s" : ""}
          </span>
        </div>
      </StCard>

      {/* ── 3. Synthèse de la période ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StKpiCompact icon={ArrowDownLeft} tone="green" label={`Encaissé · ${synthese.nbEntrees} vente${synthese.nbEntrees > 1 ? "s" : ""}`} value={fmt(synthese.entrees)} />
        <StKpiCompact icon={Percent} tone="blue" label="Commission plateforme" value={fmt(synthese.commission)} />
        <StKpiCompact icon={ArrowUpRight} tone="amber" label={`Versé · ${synthese.nbSorties} retrait${synthese.nbSorties > 1 ? "s" : ""}`} value={fmt(synthese.sorties)} />
        <StKpiCompact icon={AlertTriangle} tone={synthese.refus > 0 ? "rose" : "green"} label="Versements refusés" value={String(synthese.refus)} />
      </div>

      {/* ── 4. Totaux par passerelle ────────────────────────────────── */}
      <StCard noPadding>
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: ST.divider }}>
          <Landmark size={16} style={{ color: ST.green }} />
          <h2 className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>Par passerelle, sur la période</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: "#fafbfa", color: ST.textLabel }}>
                <th className="text-left px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">Passerelle</th>
                <th className="text-right px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">Encaissé</th>
                <th className="text-right px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">Ventes</th>
                <th className="text-right px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">Commission</th>
                <th className="text-right px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">Versé</th>
                <th className="text-right px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">Retraits</th>
                <th className="text-right px-4 py-2.5 font-extrabold text-[11px] uppercase tracking-wide">Refusés</th>
              </tr>
            </thead>
            <tbody>
              {(data?.totaux ?? []).map((t) => (
                <tr key={t.passerelle} className="border-t" style={{ borderColor: ST.divider }}>
                  <td className="px-4 py-2.5 font-extrabold" style={{ color: ST.text }}>{nom(t.passerelle)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold" style={{ color: ST.green }}>{t.entrees ? fmt(t.entrees) : "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: ST.textSecondary }}>{t.nbEntrees || "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: ST.textSecondary }}>{t.commission ? fmt(t.commission) : "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold" style={{ color: ST.amberText }}>{t.sorties ? fmt(t.sorties) : "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: ST.textSecondary }}>{t.nbSorties || "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold" style={{ color: t.sortiesRefusees ? ST.roseText : ST.textMuted }}>{t.sortiesRefusees || "—"}</td>
                </tr>
              ))}
              {!isLoading && (data?.totaux ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[12.5px] font-semibold" style={{ color: ST.textMuted }}>Aucun mouvement sur la période.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </StCard>

      {/* ── 5. Journal des mouvements ───────────────────────────────── */}
      <StCard noPadding>
        <div className="px-4 py-3 border-b" style={{ borderColor: ST.divider }}>
          <h2 className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>Journal des mouvements</h2>
        </div>
        {error ? (
          <div className="p-6 text-center text-[13px] font-semibold" style={{ color: ST.roseText }}>{(error as Error).message}</div>
        ) : isLoading ? (
          <div className="p-6 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-9 rounded animate-pulse" style={{ background: ST.divider }} />)}</div>
        ) : lignes.length === 0 ? (
          <div className="p-10 text-center">
            <Inbox size={36} className="mx-auto" style={{ color: "#d6e0da" }} />
            <p className="text-[13px] font-semibold mt-2" style={{ color: ST.textMuted }}>Aucun mouvement pour ces filtres.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr style={{ background: "#fafbfa", color: ST.textLabel }}>
                  {["Date", "Type", "Montant", "Passerelle", "Moyen", "Statut", "Tiers", "Référence", "Détail"].map((h) => (
                    <th key={h} className={`px-3 py-2.5 font-extrabold text-[11px] uppercase tracking-wide ${h === "Montant" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.map((m) => (
                  <tr key={m.sens + m.id} className="border-t align-top" style={{ borderColor: ST.divider }}>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums" style={{ color: ST.textSecondary }}>{fmtDate(m.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold" style={{ color: m.sens === "entree" ? ST.green : ST.amberText }}>
                        {m.sens === "entree" ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                        {TYPES[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums font-extrabold" style={{ color: m.sens === "entree" ? ST.green : ST.text }}>
                      {m.sens === "entree" ? "+" : "−"}{fmt(m.montant, m.devise)}
                      {m.sens === "entree" && typeof m.commission === "number" && (
                        <div className="text-[10.5px] font-semibold" style={{ color: ST.textMuted }}>com. {fmt(m.commission)} · vendeur {fmt(m.partVendeur ?? 0)}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-bold" style={{ color: ST.text }}>{nom(m.passerelle)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono text-[11.5px]" style={{ color: ST.textSecondary }}>{m.moyen ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {m.statut === "encaisse" ? <StStatusPill status="ACTIF" label="Encaissé" /> : <StStatusPill status={m.statut} />}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: ST.textSecondary }}>{m.tiers ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-[11px] max-w-[180px] truncate" title={m.reference ?? ""} style={{ color: ST.textMuted }}>{m.reference ?? "—"}</td>
                    <td className="px-3 py-2 text-[11.5px] max-w-[280px]" style={{ color: m.statut === "REFUSE" ? ST.roseText : ST.textMuted }}>{m.detail ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </StCard>
    </div>
  );
}
