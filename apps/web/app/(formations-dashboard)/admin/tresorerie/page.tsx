"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  StCard,
  StPageHeader,
  StButton,
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

type Solde = { passerelle: string; disponible: boolean; lignes: Array<{ libelle: string; devise: string; solde: number; soldeFcfa: number }>; totalFcfa: number; note: string | null };
type Total = { passerelle: string; entrees: number; nbEntrees: number; commission: number; sorties: number; nbSorties: number; sortiesRefusees: number };
type Mouvement = {
  id: string; date: string; sens: "entree" | "sortie"; type: string; montant: number; devise: string;
  passerelle: string; moyen: string | null; statut: string; reference: string | null; tiers: string | null;
  detail: string | null; commission?: number; partVendeur?: number; partAffilie?: number;
};
type Reponse = { periode: { depuis: string; jusqu: string }; soldes: Solde[]; soldeTotalFcfa: number; passerellesLues: string[]; totaux: Total[]; mouvements: Mouvement[]; nbMouvements: number };

/** Une couleur stable par passerelle : on la reconnaît avant de lire son nom. */
const COULEURS: Record<string, { bg: string; fg: string; initiale: string }> = {
  pawapay: { bg: "#e8f1fd", fg: "#1d4ed8", initiale: "Pw" },
  feexpay: { bg: "#fdeede", fg: "#c2410c", initiale: "Fx" },
  fedapay: { bg: "#ece9fb", fg: "#6d28d9", initiale: "Fd" },
  monetbil: { bg: "#e6f5eb", fg: "#006e2f", initiale: "Mb" },
  ipaymoney: { bg: "#fdf3df", fg: "#854f0b", initiale: "iP" },
  kkiapay: { bg: "#e6f5eb", fg: "#0b3b20", initiale: "Kk" },
  gratuit: { bg: "#eef2ef", fg: "#5d7166", initiale: "0" },
  manuel: { bg: "#eef2ef", fg: "#5d7166", initiale: "Mn" },
  "—": { bg: "#fceef2", fg: "#993556", initiale: "✕" },
};
function couleur(p: string) {
  return COULEURS[p] ?? { bg: "#eef2ef", fg: "#5d7166", initiale: p.slice(0, 2).toUpperCase() };
}
function Pastille({ p, taille = 28 }: { p: string; taille?: number }) {
  const c = couleur(p);
  return (
    <span
      className="inline-flex items-center justify-center rounded-[8px] font-extrabold flex-shrink-0"
      style={{ width: taille, height: taille, background: c.bg, color: c.fg, fontSize: Math.round(taille * 0.4) }}
      aria-hidden
    >
      {c.initiale}
    </span>
  );
}
const fmtCourt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));

const NOMS: Record<string, string> = {
  pawapay: "PawaPay", feexpay: "FeexPay", fedapay: "FedaPay", monetbil: "Monetbil", ipaymoney: "iPay Money",
  kkiapay: "KkiaPay", gratuit: "Gratuit (0 F)", manuel: "Manuel", inconnue: "Inconnue", "—": "Aucune",
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

      {/* ── 1. L'argent disponible, MAINTENANT ───────────────────────── */}
      <StCard className="!p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4" style={{ background: "linear-gradient(135deg,#0b3b20,#006e2f)" }}>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">Argent disponible chez nos passerelles</div>
          <div className="flex items-end gap-3 mt-1">
            <div className="text-[36px] md:text-[44px] leading-none font-extrabold tabular-nums text-white">
              {isLoading && !data ? "…" : fmtCourt(data?.soldeTotalFcfa ?? 0)}
              <span className="text-[16px] ml-2.5 font-bold text-white/80">FCFA</span>
            </div>
          </div>
          <div className="text-[12px] mt-2 text-white/75">
            {data
              ? `Somme de ce que ${data.passerellesLues.length} passerelle${data.passerellesLues.length > 1 ? "s" : ""} (${data.passerellesLues.map(nom).join(", ") || "aucune"}) détien${data.passerellesLues.length > 1 ? "nent" : "t"} réellement pour Novakou, lu chez elles à l'instant.`
              : "Lecture des soldes en cours…"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: ST.divider }}>
          {(data?.soldes ?? []).filter((x) => x.disponible).map((x) => (
            <div key={x.passerelle} className="px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Pastille p={x.passerelle} taille={30} />
                <div className="min-w-0">
                  <div className="text-[14px] font-extrabold" style={{ color: ST.text }}>{nom(x.passerelle)}</div>
                  <div className="text-[11px] font-semibold" style={{ color: ST.textMuted }}>solde lu chez la passerelle</div>
                </div>
                <div className="ml-auto text-[22px] font-extrabold tabular-nums whitespace-nowrap" style={{ color: ST.text }}>
                  {fmtCourt(x.totalFcfa)} <span className="text-[12px] font-bold" style={{ color: ST.textMuted }}>F</span>
                </div>
              </div>
              {x.lignes.length > 1 || (x.lignes[0] && x.lignes[0].devise !== "XOF") ? (
                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {x.lignes.map((l, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-2 text-[12px]">
                      <span className="font-semibold truncate" style={{ color: ST.textSecondary }}>{l.libelle}</span>
                      <span className="tabular-nums font-bold whitespace-nowrap" style={{ color: ST.text }}>
                        {fmtCourt(l.solde)} {l.devise}
                        {l.devise !== "XOF" && l.devise !== "XAF" && (
                          <span className="ml-1 font-semibold" style={{ color: ST.textMuted }}>≈ {fmtCourt(l.soldeFcfa)} F</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          {!isLoading && (data?.soldes ?? []).filter((x) => x.disponible).length === 0 && (
            <div className="px-5 py-6 text-[13px] font-semibold md:col-span-2" style={{ color: ST.textMuted }}>
              Aucune passerelle n'a pu être lue — les cartes ci-dessous indiquent pourquoi.
            </div>
          )}
        </div>

        {(data?.soldes ?? []).some((x) => !x.disponible) && (
          <div className="px-5 py-3 border-t flex flex-wrap items-center gap-x-5 gap-y-1.5" style={{ borderColor: ST.divider, background: "#fafbfa" }}>
            <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: ST.textMuted }}>Non lisible par API</span>
            {(data?.soldes ?? []).filter((x) => !x.disponible).map((x) => (
              <span key={x.passerelle} className="inline-flex items-center gap-1.5 text-[12px]" title={x.note ?? ""}>
                <Pastille p={x.passerelle} taille={18} />
                <span className="font-bold" style={{ color: ST.textSecondary }}>{nom(x.passerelle)}</span>
                <span style={{ color: ST.textMuted }}>— {x.note?.startsWith("injoignable") ? "injoignable" : x.note?.startsWith("non configur") ? "non configurée" : "à voir sur son tableau de bord"}</span>
              </span>
            ))}
          </div>
        )}
      </StCard>

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

      {/* ── 3. Ce qui a bougé sur la période ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StCard className="!p-4">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: ST.green }}>
            <ArrowDownLeft size={14} /> Entré
          </div>
          <div className="text-[24px] font-extrabold tabular-nums mt-1" style={{ color: ST.text }}>+{fmtCourt(synthese.entrees)} <span className="text-[12px]" style={{ color: ST.textMuted }}>F</span></div>
          <div className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>{synthese.nbEntrees} vente{synthese.nbEntrees > 1 ? "s" : ""} encaissée{synthese.nbEntrees > 1 ? "s" : ""}</div>
        </StCard>
        <StCard className="!p-4">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: ST.amberText }}>
            <ArrowUpRight size={14} /> Sorti
          </div>
          <div className="text-[24px] font-extrabold tabular-nums mt-1" style={{ color: ST.text }}>−{fmtCourt(synthese.sorties)} <span className="text-[12px]" style={{ color: ST.textMuted }}>F</span></div>
          <div className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>{synthese.nbSorties} versement{synthese.nbSorties > 1 ? "s" : ""} effectué{synthese.nbSorties > 1 ? "s" : ""}</div>
        </StCard>
        <StCard className="!p-4">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: ST.blueText }}>
            <Percent size={14} /> Commission Novakou
          </div>
          <div className="text-[24px] font-extrabold tabular-nums mt-1" style={{ color: ST.text }}>{fmtCourt(synthese.commission)} <span className="text-[12px]" style={{ color: ST.textMuted }}>F</span></div>
          <div className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>notre part sur les ventes</div>
        </StCard>
        <StCard className="!p-4" >
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: synthese.refus > 0 ? ST.roseText : ST.textMuted }}>
            <AlertTriangle size={14} /> Versements refusés
          </div>
          <div className="text-[24px] font-extrabold tabular-nums mt-1" style={{ color: synthese.refus > 0 ? ST.roseText : ST.text }}>{synthese.refus}</div>
          <div className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>{synthese.refus > 0 ? "à traiter — voir le journal" : "rien à signaler"}</div>
        </StCard>
      </div>

      {/* ── 4. Totaux par passerelle ────────────────────────────────── */}
      <StCard noPadding>
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: ST.divider }}>
          <Landmark size={16} style={{ color: ST.green }} />
          <h2 className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>Qui a encaissé quoi, qui a versé quoi</h2>
          <span className="text-[11.5px] font-semibold ml-1" style={{ color: ST.textMuted }}>— sur la période choisie</span>
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
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2 font-extrabold" style={{ color: ST.text }}>
                      <Pastille p={t.passerelle} taille={22} />{nom(t.passerelle)}
                    </span>
                  </td>
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
          <span className="text-[11.5px] font-semibold ml-1" style={{ color: ST.textMuted }}>— chaque ligne dit par quelle passerelle l'argent est passé</span>
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
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: ST.text }}>
                        <Pastille p={m.passerelle} taille={18} />{nom(m.passerelle)}
                      </span>
                    </td>
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
