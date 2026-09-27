"use client";

/**
 * Pop-ups intelligents — espace vendeur.
 *
 * Design system « Stitch » (comme le hub Marketing et les codes promo), briques
 * d'accessibilité partagées dans components/formations/dashboard/MarketingKit.
 *
 * Deux règles de fond, apprises en corrigeant cette page :
 *   - un pop-up « Code promo » sans code attaché n'a rien à montrer au visiteur :
 *     le code est donc obligatoire à la création, et choisi dans la liste des
 *     codes du vendeur (l'API vérifie la propriété du code) ;
 *   - un pop-up « Capture email » ne sert à rien si les adresses ne reviennent
 *     pas au vendeur : elles sont listées et exportables ici.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";
import { safeFetch } from "@/lib/safe-fetch";
import {
  type LucideIcon,
  Plus,
  Trash2,
  Tag,
  Mail,
  Megaphone,
  TrendingUp,
  Timer,
  MousePointerClick,
  Eye,
  Download,
  GitBranch,
  Percent,
} from "lucide-react";
import { ST, StCard, StPageHeader, StButton, StChip, StKpiCompact } from "@/components/stitch";
import {
  StSwitch,
  StModal,
  StErreur,
  StVide,
  StRetourMarketing,
} from "@/components/formations/dashboard/MarketingKit";

type PopupType = "DISCOUNT" | "EMAIL_CAPTURE" | "ANNOUNCEMENT" | "UPSELL" | "COUNTDOWN";
type PopupTrigger = "EXIT_INTENT" | "TIME_DELAY" | "SCROLL_PERCENT" | "PAGE_VIEW_COUNT" | "MANUAL";

type Lead = { email: string; date: string };

type Popup = {
  id: string;
  name: string;
  popupType: PopupType;
  trigger: PopupTrigger;
  delaySeconds: number | null;
  scrollPercent: number | null;
  headlineFr: string | null;
  bodyFr: string | null;
  ctaTextFr: string | null;
  imageBanner: string | null;
  discountCodeId: string | null;
  isActive: boolean;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  createdAt: string;
  leads: Lead[];
};

type CodePromo = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  isActive: boolean;
  expiresAt: string | null;
};

const TYPES: Record<PopupType, { label: string; icon: LucideIcon; tone: "green" | "blue" | "amber" | "rose"; desc: string }> = {
  DISCOUNT: { label: "Code promo", icon: Tag, tone: "amber", desc: "Affiche un de vos codes promo, prêt à copier." },
  EMAIL_CAPTURE: { label: "Capture email", icon: Mail, tone: "blue", desc: "Récupère l'adresse du visiteur avant qu'il ne parte." },
  ANNOUNCEMENT: { label: "Annonce", icon: Megaphone, tone: "green", desc: "Annonce une nouveauté, une date, une ouverture." },
  UPSELL: { label: "Upsell", icon: TrendingUp, tone: "green", desc: "Offre complémentaire." },
  COUNTDOWN: { label: "Compte à rebours", icon: Timer, tone: "rose", desc: "Urgence avec minuteur." },
};

/** Types réellement rendus au visiteur aujourd'hui (cf. SmartPopupRenderer). */
const TYPES_CREABLES: PopupType[] = ["DISCOUNT", "EMAIL_CAPTURE", "ANNOUNCEMENT"];

const DECLENCHEURS: Record<PopupTrigger, { label: string; aide: string }> = {
  EXIT_INTENT: { label: "Intention de sortie", aide: "S'ouvre quand la souris quitte la page vers le haut." },
  TIME_DELAY: { label: "Après un délai", aide: "S'ouvre après X secondes sur la page." },
  SCROLL_PERCENT: { label: "Au défilement", aide: "S'ouvre quand le visiteur a lu X % de la page." },
  PAGE_VIEW_COUNT: { label: "Après X pages vues", aide: "S'ouvre au visiteur qui explore déjà votre boutique." },
  MANUAL: { label: "Manuel (API)", aide: "Déclenché par votre propre code." },
};

function nombre(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function libelleCode(c: CodePromo) {
  const valeur = c.discountType === "PERCENTAGE" ? `-${c.discountValue} %` : `-${nombre(c.discountValue)} FCFA`;
  return `${c.code} (${valeur})`;
}

function codeUtilisable(c: CodePromo) {
  return c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date());
}

export default function PopupsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [leadsOuverts, setLeadsOuverts] = useState<Popup | null>(null);
  const [form, setForm] = useState({
    name: "",
    popupType: "DISCOUNT" as PopupType,
    trigger: "EXIT_INTENT" as PopupTrigger,
    delaySeconds: "15",
    scrollPercent: "50",
    headlineFr: "",
    bodyFr: "",
    ctaTextFr: "Obtenir l'offre",
    discountCodeId: "",
  });

  const {
    data: reponse,
    isLoading,
    isError,
    refetch,
  } = useQuery<{ data: Popup[] }>({
    queryKey: ["vendeur-popups"],
    queryFn: async () => {
      const { data, error } = await safeFetch<{ data: Popup[] }>("/api/formations/vendeur/marketing/popups");
      if (error || !data) throw new Error(error ?? "Chargement impossible");
      return data;
    },
    staleTime: 30_000,
  });

  const popups = reponse?.data ?? [];

  // Codes promo du vendeur : nécessaires pour qu'un pop-up « Code promo » ait
  // quelque chose à afficher.
  const { data: reponseCodes } = useQuery<{ data: CodePromo[] }>({
    queryKey: ["vendeur-codes-promo"],
    queryFn: async () => {
      const { data } = await safeFetch<{ data: CodePromo[] }>("/api/formations/vendeur/marketing/codes-promo");
      return data ?? { data: [] };
    },
    staleTime: 60_000,
  });
  const codes = useMemo(() => (reponseCodes?.data ?? []).filter(codeUtilisable), [reponseCodes]);
  const codesParId = useMemo(() => new Map(codes.map((c) => [c.id, c])), [codes]);

  function reinitialiser() {
    setForm({
      name: "",
      popupType: "DISCOUNT",
      trigger: "EXIT_INTENT",
      delaySeconds: "15",
      scrollPercent: "50",
      headlineFr: "",
      bodyFr: "",
      ctaTextFr: "Obtenir l'offre",
      discountCodeId: "",
    });
  }

  const creation = useMutation({
    mutationFn: async (corps: typeof form) => {
      const { data, error } = await safeFetch<{ data: Popup }>("/api/formations/vendeur/marketing/popups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-popups"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Pop-up créé.");
      setShowForm(false);
      reinitialiser();
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const bascule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await safeFetch(`/api/formations/vendeur/marketing/popups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-popups"] }),
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const suppression = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await safeFetch(`/api/formations/vendeur/marketing/popups/${id}`, { method: "DELETE" });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-popups"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Pop-up supprimé.");
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const impressions = popups.reduce((s, p) => s + p.totalImpressions, 0);
  const clics = popups.reduce((s, p) => s + p.totalClicks, 0);
  const conversions = popups.reduce((s, p) => s + p.totalConversions, 0);
  const taux = impressions > 0 ? Math.round((conversions / impressions) * 1000) / 10 : 0;
  const actifs = popups.filter((p) => p.isActive).length;

  /** Export CSV côté navigateur : aucune donnée ne quitte la session. */
  function exporterLeads(p: Popup) {
    const lignes = [["email", "date"], ...p.leads.map((l) => [l.email, new Date(l.date).toISOString()])];
    const csv = lignes.map((l) => l.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `emails-${p.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const codeManquant = form.popupType === "DISCOUNT" && !form.discountCodeId;

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StRetourMarketing />

        <StPageHeader
          title="Pop-ups intelligents"
          subtitle="Un message au bon moment : juste avant que le visiteur ne quitte la page."
          actions={
            <StButton icon={Plus} onClick={() => { reinitialiser(); setShowForm(true); }}>
              Créer un pop-up
            </StButton>
          }
        />

        {/* ── KPI ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <StKpiCompact label="Pop-ups actifs" value={isLoading ? "…" : actifs} icon={MousePointerClick} tone="green" />
          <StKpiCompact label="Affichages" value={isLoading ? "…" : nombre(impressions)} icon={Eye} tone="blue" />
          <StKpiCompact label="Clics" value={isLoading ? "…" : nombre(clics)} icon={GitBranch} tone="blue" />
          <StKpiCompact label="Taux de conversion" value={isLoading ? "…" : taux} unit="%" icon={Percent} tone="amber" />
        </div>

        {/* ── Liste ── */}
        {isError ? (
          <StErreur onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {[0, 1].map((i) => (
              <StCard key={i}>
                <div className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[12px]" style={{ background: "#eef2ef" }} />
                    <div className="flex-1">
                      <div className="h-3.5 w-36 rounded" style={{ background: "#eef2ef" }} />
                      <div className="mt-1.5 h-3 w-24 rounded" style={{ background: "#eef2ef" }} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="h-8 rounded" style={{ background: "#eef2ef" }} />
                    ))}
                  </div>
                </div>
              </StCard>
            ))}
          </div>
        ) : popups.length === 0 ? (
          <StVide
            icon={MousePointerClick}
            titre="Aucun pop-up pour l'instant"
            message="Un pop-up « intention de sortie » rattrape le visiteur qui s'en va : proposez-lui votre code promo ou demandez-lui son email. C'est le levier le plus rapide pour ne plus perdre un visiteur intéressé."
            action={
              <StButton icon={Plus} onClick={() => { reinitialiser(); setShowForm(true); }}>
                Créer mon premier pop-up
              </StButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {popups.map((p) => {
              const t = TYPES[p.popupType];
              const d = DECLENCHEURS[p.trigger];
              const tauxP = p.totalImpressions > 0 ? Math.round((p.totalConversions / p.totalImpressions) * 1000) / 10 : 0;
              const code = p.discountCodeId ? codesParId.get(p.discountCodeId) : undefined;
              const Icone = t.icon;
              return (
                <StCard key={p.id} className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                        style={
                          t.tone === "amber"
                            ? { background: ST.amberSoft, color: ST.amberText }
                            : t.tone === "blue"
                              ? { background: ST.blueSoft, color: ST.blueText }
                              : t.tone === "rose"
                                ? { background: ST.roseSoft, color: ST.roseText }
                                : { background: ST.greenSoft, color: ST.green }
                        }
                      >
                        <Icone size={19} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-extrabold" style={{ color: ST.text }}>
                          {p.name}
                        </p>
                        <p className="text-[11px] font-bold" style={{ color: ST.textSecondary }}>
                          {t.label} · {d?.label ?? p.trigger}
                          {p.trigger === "TIME_DELAY" && p.delaySeconds ? ` (${p.delaySeconds} s)` : ""}
                          {p.trigger === "SCROLL_PERCENT" && p.scrollPercent ? ` (${p.scrollPercent} %)` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <StSwitch
                        checked={p.isActive}
                        onChange={(v) => bascule.mutate({ id: p.id, isActive: v })}
                        label={`${p.isActive ? "Désactiver" : "Activer"} le pop-up ${p.name}`}
                      />
                      <button
                        type="button"
                        aria-label={`Supprimer le pop-up ${p.name}`}
                        onClick={async () => {
                          const ok = await confirmAction({
                            title: "Supprimer ce pop-up ?",
                            message: "Les statistiques et les emails captés par ce pop-up seront perdus.",
                            confirmLabel: "Supprimer",
                            confirmVariant: "danger",
                            icon: "delete",
                          });
                          if (ok) suppression.mutate(p.id);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#fceef2]"
                        style={{ color: ST.textSecondary }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {p.headlineFr && (
                    <p className="mt-3 line-clamp-2 text-[12.5px] font-semibold italic" style={{ color: ST.textSecondary }}>
                      « {p.headlineFr} »
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {p.popupType === "DISCOUNT" &&
                      (code ? (
                        <StChip tone="amber" icon={Tag}>{code.code}</StChip>
                      ) : (
                        <StChip tone="rose">Code promo indisponible</StChip>
                      ))}
                    {p.popupType === "EMAIL_CAPTURE" && (
                      <StChip tone="blue" icon={Mail}>
                        {p.leads.length} email{p.leads.length > 1 ? "s" : ""} capté{p.leads.length > 1 ? "s" : ""}
                      </StChip>
                    )}
                    {!p.isActive && <StChip tone="neutral">En pause</StChip>}
                  </div>

                  <div
                    // mt-auto colle le bloc en bas : deux cartes cote a cote
                    // gardent leurs chiffres alignes, meme si l'une porte une
                    // puce de plus que l'autre.
                    className="mt-auto grid grid-cols-3 gap-2 pt-3.5"
                    style={{ borderTop: `1px solid ${ST.divider}` }}
                  >
                    {[
                      { label: "Affichages", valeur: nombre(p.totalImpressions) },
                      { label: "Clics", valeur: nombre(p.totalClicks) },
                      { label: "Conversion", valeur: `${tauxP} %` },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-[14px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                          {s.valeur}
                        </p>
                        <p className="text-[10.5px] font-bold" style={{ color: ST.textSecondary }}>
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {p.popupType === "EMAIL_CAPTURE" && p.leads.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StButton size="sm" variant="secondary" onClick={() => setLeadsOuverts(p)}>
                        Voir les emails
                      </StButton>
                      <StButton size="sm" variant="ghost-green" icon={Download} onClick={() => exporterLeads(p)}>
                        Exporter en CSV
                      </StButton>
                    </div>
                  )}
                </StCard>
              );
            })}
          </div>
        )}

        {/* ── Modale : création ── */}
        {showForm && (
          <StModal
            titre="Nouveau pop-up"
            onClose={() => setShowForm(false)}
            pied={
              <>
                <StButton variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
                  Annuler
                </StButton>
                <StButton
                  className="flex-1"
                  disabled={form.name.trim().length < 2 || codeManquant || creation.isPending}
                  onClick={() => creation.mutate(form)}
                >
                  {creation.isPending ? "Création…" : "Créer le pop-up"}
                </StButton>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="popup-nom"
                  className="mb-[7px] block text-[12px] font-extrabold"
                  style={{ color: ST.textLabel }}
                >
                  Nom interne <span style={{ color: ST.roseText }}>*</span>
                </label>
                <input
                  id="popup-nom"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex. Sortie page formation — code BIENVENUE"
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                />
                <p className="mt-1.5 text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                  Visible par vous seul, pour retrouver ce pop-up dans la liste.
                </p>
              </div>

              <fieldset>
                <legend className="mb-2 text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                  Que doit faire ce pop-up ?
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES_CREABLES.map((cle) => {
                    const cfg = TYPES[cle];
                    const Icone = cfg.icon;
                    const choisi = form.popupType === cle;
                    return (
                      <button
                        key={cle}
                        type="button"
                        aria-pressed={choisi}
                        onClick={() => setForm((f) => ({ ...f, popupType: cle }))}
                        className="flex flex-col items-center gap-1.5 rounded-[14px] p-3 text-center transition-colors"
                        style={{
                          border: choisi ? `1.5px solid ${ST.green}` : "1px solid #dde6e0",
                          background: choisi ? ST.greenSoft : "#fff",
                        }}
                      >
                        <Icone size={18} style={{ color: choisi ? ST.green : ST.textSecondary }} />
                        <span className="text-[11px] font-extrabold leading-tight" style={{ color: ST.text }}>
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                  {TYPES[form.popupType].desc}
                </p>
              </fieldset>

              {form.popupType === "DISCOUNT" && (
                <div>
                  <label
                    htmlFor="popup-code"
                    className="mb-[7px] block text-[12px] font-extrabold"
                    style={{ color: ST.textLabel }}
                  >
                    Code promo à afficher <span style={{ color: ST.roseText }}>*</span>
                  </label>
                  {codes.length === 0 ? (
                    <div
                      className="rounded-[12px] p-3 text-[12.5px] font-semibold"
                      style={{ background: ST.amberSoft, color: ST.amberText }}
                    >
                      Vous n&apos;avez aucun code promo actif. Créez-en un d&apos;abord dans
                      <Link href="/vendeur/marketing/codes-promo" className="font-extrabold underline"> Codes promo</Link>,
                      sinon le pop-up s&apos;ouvrirait sans rien à copier.
                    </div>
                  ) : (
                    <select
                      id="popup-code"
                      value={form.discountCodeId}
                      onChange={(e) => setForm((f) => ({ ...f, discountCodeId: e.target.value }))}
                      className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    >
                      <option value="">Choisir un code…</option>
                      {codes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {libelleCode(c)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="popup-declencheur"
                  className="mb-[7px] block text-[12px] font-extrabold"
                  style={{ color: ST.textLabel }}
                >
                  Quand s&apos;ouvre-t-il ?
                </label>
                <select
                  id="popup-declencheur"
                  value={form.trigger}
                  onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value as PopupTrigger }))}
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                >
                  {(Object.keys(DECLENCHEURS) as PopupTrigger[])
                    .filter((k) => k !== "MANUAL")
                    .map((k) => (
                      <option key={k} value={k}>
                        {DECLENCHEURS[k].label}
                      </option>
                    ))}
                </select>
                <p className="mt-1.5 text-[11.5px] font-bold" style={{ color: ST.textSecondary }}>
                  {DECLENCHEURS[form.trigger].aide}
                </p>

                {form.trigger === "TIME_DELAY" && (
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={form.delaySeconds}
                    onChange={(e) => setForm((f) => ({ ...f, delaySeconds: e.target.value }))}
                    aria-label="Délai en secondes"
                    className="mt-2 w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold tabular-nums focus:outline-none"
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  />
                )}
                {form.trigger === "SCROLL_PERCENT" && (
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.scrollPercent}
                    onChange={(e) => setForm((f) => ({ ...f, scrollPercent: e.target.value }))}
                    aria-label="Pourcentage de défilement"
                    className="mt-2 w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold tabular-nums focus:outline-none"
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor="popup-titre"
                  className="mb-[7px] block text-[12px] font-extrabold"
                  style={{ color: ST.textLabel }}
                >
                  Titre affiché au visiteur
                </label>
                <input
                  id="popup-titre"
                  type="text"
                  value={form.headlineFr}
                  onChange={(e) => setForm((f) => ({ ...f, headlineFr: e.target.value }))}
                  placeholder="Attendez ! Voici une offre pour vous"
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                />
              </div>

              <div>
                <label
                  htmlFor="popup-message"
                  className="mb-[7px] block text-[12px] font-extrabold"
                  style={{ color: ST.textLabel }}
                >
                  Message
                </label>
                <textarea
                  id="popup-message"
                  rows={2}
                  value={form.bodyFr}
                  onChange={(e) => setForm((f) => ({ ...f, bodyFr: e.target.value }))}
                  placeholder="20 % de réduction sur votre première formation — offre valable aujourd'hui."
                  className="w-full resize-none rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-medium leading-relaxed focus:outline-none"
                  style={{ color: "#33453b", border: "1px solid #dde6e0" }}
                />
              </div>

              <div>
                <label
                  htmlFor="popup-cta"
                  className="mb-[7px] block text-[12px] font-extrabold"
                  style={{ color: ST.textLabel }}
                >
                  Texte du bouton
                </label>
                <input
                  id="popup-cta"
                  type="text"
                  value={form.ctaTextFr}
                  onChange={(e) => setForm((f) => ({ ...f, ctaTextFr: e.target.value }))}
                  placeholder="Obtenir l'offre"
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                />
              </div>
            </div>
          </StModal>
        )}

        {/* ── Modale : emails captés ── */}
        {leadsOuverts && (
          <StModal
            titre={`Emails captés — ${leadsOuverts.name}`}
            onClose={() => setLeadsOuverts(null)}
            pied={
              <>
                <StButton variant="secondary" className="flex-1" onClick={() => setLeadsOuverts(null)}>
                  Fermer
                </StButton>
                <StButton className="flex-1" icon={Download} onClick={() => exporterLeads(leadsOuverts)}>
                  Exporter en CSV
                </StButton>
              </>
            }
          >
            <p className="mb-3 text-[12.5px] font-semibold" style={{ color: ST.textSecondary }}>
              {leadsOuverts.leads.length} adresse{leadsOuverts.leads.length > 1 ? "s" : ""} — 500 dernières conversions.
            </p>
            <ul className="divide-y" style={{ borderColor: ST.divider }}>
              {leadsOuverts.leads.map((l) => (
                <li key={`${l.email}-${l.date}`} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate text-[13px] font-bold" style={{ color: ST.text }}>
                    {l.email}
                  </span>
                  <span className="flex-shrink-0 text-[11.5px] font-bold tabular-nums" style={{ color: ST.textSecondary }}>
                    {new Date(l.date).toLocaleDateString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          </StModal>
        )}
      </main>
    </div>
  );
}
