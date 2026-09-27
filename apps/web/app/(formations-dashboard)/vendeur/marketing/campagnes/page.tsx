"use client";

/**
 * Liens de campagne (UTM) — espace vendeur. Design system « Stitch ».
 *
 * Ce qu'on partage est le LIEN TRACKÉ, pas l'URL brute : c'est l'endpoint
 * /api/marketing/campaigns/[slug] qui compte le clic, pose le cookie
 * d'attribution `fh_campaign`, puis redirige vers la destination avec les UTM.
 * Partager l'URL brute contournait le tracker → 0 clic.
 *
 * Les clics sont mesurés à chaque ouverture du lien. Les ventes attribuées, en
 * revanche, ne sont créditées qu'au paiement confirmé : l'affichage le dit au
 * lieu de présenter un « 0 % de conversion » qui ressemble à un échec.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";
import { safeFetch } from "@/lib/safe-fetch";
import {
  Link2,
  MousePointerClick,
  Plus,
  Trash2,
  Check,
  Copy,
  Banknote,
  ShoppingCart,
  Info,
} from "lucide-react";
import { ST, StCard, StPageHeader, StButton, StChip, StKpiCompact } from "@/components/stitch";
import {
  StSwitch,
  StModal,
  StErreur,
  StVide,
  StRetourMarketing,
} from "@/components/formations/dashboard/MarketingKit";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  destinationUrl: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  isActive: boolean;
  createdAt: string;
};

function fcfa(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

const SOURCES = ["facebook", "instagram", "tiktok", "youtube", "email", "whatsapp", "twitter", "linkedin", "google", "autre"];
const SUPPORTS = ["social", "email", "cpc", "organic", "referral", "influencer", "direct"];

/** Lien à partager : toujours l'endpoint tracké, jamais la destination brute. */
function lienTracke(slug: string): string {
  const origine =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://novakou.com");
  return `${origine}/api/marketing/campaigns/${slug}`;
}

/** Aperçu avant enregistrement (pas encore de slug) : destination + UTM. */
function apercuUtm(form: { destinationUrl: string; utmSource: string; utmMedium: string; utmCampaign: string; utmContent: string }): string {
  const base = form.destinationUrl;
  const params = new URLSearchParams();
  if (form.utmSource) params.set("utm_source", form.utmSource);
  if (form.utmMedium) params.set("utm_medium", form.utmMedium);
  if (form.utmCampaign) params.set("utm_campaign", form.utmCampaign);
  if (form.utmContent) params.set("utm_content", form.utmContent);
  const qs = params.toString();
  return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
}

export default function CampagnesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    destinationUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
  });

  const { data: reponse, isLoading, isError, refetch } = useQuery<{ data: Campaign[] }>({
    queryKey: ["vendeur-campagnes"],
    queryFn: async () => {
      const { data, error } = await safeFetch<{ data: Campaign[] }>("/api/formations/vendeur/marketing/campagnes");
      if (error || !data) throw new Error(error ?? "Chargement impossible");
      return data;
    },
    staleTime: 30_000,
  });

  const campagnes = reponse?.data ?? [];

  const creation = useMutation({
    mutationFn: async (corps: typeof form) => {
      const { data, error } = await safeFetch<{ data: Campaign }>("/api/formations/vendeur/marketing/campagnes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-campagnes"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Lien de campagne créé.");
      setShowForm(false);
      setForm({ name: "", destinationUrl: "", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "" });
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const bascule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await safeFetch(`/api/formations/vendeur/marketing/campagnes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-campagnes"] }),
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const suppression = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await safeFetch(`/api/formations/vendeur/marketing/campagnes/${id}`, { method: "DELETE" });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-campagnes"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Lien supprimé.");
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  async function copier(c: Campaign) {
    try {
      await navigator.clipboard.writeText(lienTracke(c.slug));
      setCopie(c.id);
      setTimeout(() => setCopie(null), 2000);
    } catch {
      useToastStore.getState().addToast("error", "Copie impossible : sélectionnez le lien à la main.");
    }
  }

  const clics = campagnes.reduce((s, c) => s + c.totalClicks, 0);
  const ventes = campagnes.reduce((s, c) => s + c.totalConversions, 0);
  const revenus = campagnes.reduce((s, c) => s + c.totalRevenue, 0);
  const actifs = campagnes.filter((c) => c.isActive).length;

  const destinationValide = /^(https?:\/\/|\/)/.test(form.destinationUrl.trim());

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StRetourMarketing />

        <StPageHeader
          title="Liens de campagne"
          subtitle="Un lien par publication : vous saurez lequel amène vraiment des visiteurs."
          actions={
            <StButton icon={Plus} onClick={() => setShowForm(true)}>
              Créer un lien
            </StButton>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <StKpiCompact label="Liens actifs" value={isLoading ? "…" : actifs} icon={Link2} tone="green" />
          <StKpiCompact label="Clics mesurés" value={isLoading ? "…" : fcfa(clics)} icon={MousePointerClick} tone="blue" />
          <StKpiCompact label="Ventes attribuées" value={isLoading ? "…" : ventes} icon={ShoppingCart} tone="green" />
          <StKpiCompact label="Revenus attribués" value={isLoading ? "…" : fcfa(revenus)} unit="FCFA" icon={Banknote} tone="amber" />
        </div>

        {isError ? (
          <StErreur onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-3.5">
            {[0, 1, 2].map((i) => (
              <StCard key={i}>
                <div className="animate-pulse">
                  <div className="h-3.5 w-48 rounded" style={{ background: "#eef2ef" }} />
                  <div className="mt-3 h-8 w-full rounded" style={{ background: "#eef2ef" }} />
                  <div className="mt-3 flex gap-6">
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="h-3 w-20 rounded" style={{ background: "#eef2ef" }} />
                    ))}
                  </div>
                </div>
              </StCard>
            ))}
          </div>
        ) : campagnes.length === 0 ? (
          <StVide
            icon={Link2}
            titre="Aucun lien de campagne"
            message="Créez un lien par publication (story Instagram, message WhatsApp, vidéo TikTok). Vous verrez lequel amène des visiteurs — et vous arrêterez de deviner où investir votre temps."
            action={
              <StButton icon={Plus} onClick={() => setShowForm(true)}>
                Créer mon premier lien
              </StButton>
            }
          />
        ) : (
          <div className="space-y-3.5">
            {campagnes.map((c) => (
              <StCard key={c.id}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate text-[14px] font-extrabold" style={{ color: ST.text }}>
                        {c.name}
                      </h3>
                      {c.isActive ? <StChip tone="green">Actif</StChip> : <StChip tone="neutral">En pause</StChip>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.utmSource && <StChip tone="blue">{c.utmSource}</StChip>}
                      {c.utmMedium && <StChip tone="green">{c.utmMedium}</StChip>}
                      {c.utmCampaign && <StChip tone="neutral">{c.utmCampaign}</StChip>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <StSwitch
                      checked={c.isActive}
                      onChange={(v) => bascule.mutate({ id: c.id, isActive: v })}
                      label={`${c.isActive ? "Mettre en pause" : "Activer"} le lien ${c.name}`}
                    />
                    <button
                      type="button"
                      aria-label={`Supprimer le lien ${c.name}`}
                      onClick={async () => {
                        const ok = await confirmAction({
                          title: "Supprimer ce lien ?",
                          message: "Le lien déjà partagé cessera de fonctionner et ses statistiques seront perdues.",
                          confirmLabel: "Supprimer",
                          confirmVariant: "danger",
                          icon: "delete",
                        });
                        if (ok) suppression.mutate(c.id);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#fceef2]"
                      style={{ color: ST.textSecondary }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <code
                    className="min-w-0 flex-1 truncate rounded-[10px] px-3 py-2 text-[11.5px] font-semibold tabular-nums"
                    style={{ background: "#f4f7f5", color: ST.textSecondary }}
                  >
                    {lienTracke(c.slug)}
                  </code>
                  <StButton
                    size="sm"
                    variant={copie === c.id ? "ghost-green" : "secondary"}
                    icon={copie === c.id ? Check : Copy}
                    onClick={() => copier(c)}
                  >
                    <span translate="no">{copie === c.id ? "Copié !" : "Copier"}</span>
                  </StButton>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                  {[
                    { label: "Clics", valeur: fcfa(c.totalClicks) },
                    { label: "Ventes attribuées", valeur: String(c.totalConversions) },
                    { label: "Revenus", valeur: `${fcfa(c.totalRevenue)} FCFA` },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-[14px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                        {s.valeur}
                      </p>
                      <p className="text-[10.5px] font-bold" style={{ color: ST.textSecondary }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {c.totalClicks > 0 && c.totalConversions === 0 && (
                  <p
                    className="mt-3 flex items-start gap-2 rounded-[10px] p-2.5 text-[11.5px] font-semibold"
                    style={{ background: ST.blueSoft, color: ST.blueText }}
                  >
                    <Info size={14} className="mt-px flex-shrink-0" aria-hidden="true" />
                    Des visiteurs cliquent, mais aucune vente n&apos;est encore attribuée à ce lien : une vente
                    n&apos;est comptée ici qu&apos;après un paiement confirmé.
                  </p>
                )}
              </StCard>
            ))}
          </div>
        )}

        {showForm && (
          <StModal
            titre="Nouveau lien de campagne"
            onClose={() => setShowForm(false)}
            pied={
              <>
                <StButton variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
                  Annuler
                </StButton>
                <StButton
                  className="flex-1"
                  disabled={form.name.trim().length < 2 || !destinationValide || creation.isPending}
                  onClick={() => creation.mutate(form)}
                >
                  {creation.isPending ? "Création…" : "Créer le lien"}
                </StButton>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="camp-nom" className="mb-[7px] block text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                  Nom de la campagne <span style={{ color: ST.roseText }}>*</span>
                </label>
                <input
                  id="camp-nom"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex. Story Instagram — lancement formation React"
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                />
              </div>

              <div>
                <label htmlFor="camp-url" className="mb-[7px] block text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                  Page de destination <span style={{ color: ST.roseText }}>*</span>
                </label>
                <input
                  id="camp-url"
                  type="url"
                  inputMode="url"
                  value={form.destinationUrl}
                  onChange={(e) => setForm((f) => ({ ...f, destinationUrl: e.target.value }))}
                  placeholder="https://novakou.com/formation/mon-cours"
                  aria-invalid={form.destinationUrl.length > 0 && !destinationValide}
                  className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                  style={{
                    color: ST.text,
                    border: form.destinationUrl.length > 0 && !destinationValide ? `1px solid ${ST.roseText}` : "1px solid #dde6e0",
                  }}
                />
                <p
                  className="mt-1.5 text-[11.5px] font-bold"
                  style={{ color: form.destinationUrl.length > 0 && !destinationValide ? ST.roseText : ST.textMuted }}
                >
                  {form.destinationUrl.length > 0 && !destinationValide
                    ? "L'adresse doit commencer par https:// (ou par / pour une page Novakou)."
                    : "La page où arrive le visiteur : votre formation, votre boutique, un tunnel…"}
                </p>
              </div>

              <fieldset className="pt-1">
                <legend className="mb-2.5 text-[12px] font-extrabold" style={{ color: ST.textLabel }}>
                  Étiquettes UTM (facultatif, pour vos statistiques)
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="camp-source" className="mb-1 block text-[11px] font-extrabold" style={{ color: ST.textSecondary }}>
                      Source
                    </label>
                    <select
                      id="camp-source"
                      value={form.utmSource}
                      onChange={(e) => setForm((f) => ({ ...f, utmSource: e.target.value }))}
                      className="w-full rounded-[12px] bg-white px-[12px] py-[10px] text-[13px] font-semibold focus:outline-none"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    >
                      <option value="">Choisir…</option>
                      {SOURCES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="camp-support" className="mb-1 block text-[11px] font-extrabold" style={{ color: ST.textSecondary }}>
                      Support
                    </label>
                    <select
                      id="camp-support"
                      value={form.utmMedium}
                      onChange={(e) => setForm((f) => ({ ...f, utmMedium: e.target.value }))}
                      className="w-full rounded-[12px] bg-white px-[12px] py-[10px] text-[13px] font-semibold focus:outline-none"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    >
                      <option value="">Choisir…</option>
                      {SUPPORTS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="camp-campagne" className="mb-1 block text-[11px] font-extrabold" style={{ color: ST.textSecondary }}>
                      Campagne
                    </label>
                    <input
                      id="camp-campagne"
                      type="text"
                      value={form.utmCampaign}
                      onChange={(e) => setForm((f) => ({ ...f, utmCampaign: e.target.value }))}
                      placeholder="promo-rentree"
                      className="w-full rounded-[12px] bg-white px-[12px] py-[10px] text-[13px] font-semibold focus:outline-none"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    />
                  </div>
                  <div>
                    <label htmlFor="camp-contenu" className="mb-1 block text-[11px] font-extrabold" style={{ color: ST.textSecondary }}>
                      Contenu
                    </label>
                    <input
                      id="camp-contenu"
                      type="text"
                      value={form.utmContent}
                      onChange={(e) => setForm((f) => ({ ...f, utmContent: e.target.value }))}
                      placeholder="story-1"
                      className="w-full rounded-[12px] bg-white px-[12px] py-[10px] text-[13px] font-semibold focus:outline-none"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    />
                  </div>
                </div>
              </fieldset>

              {destinationValide && (
                <div className="rounded-[12px] p-3" style={{ background: "#f4f7f5" }}>
                  <p className="mb-1 text-[11px] font-extrabold" style={{ color: ST.textSecondary }}>
                    Le visiteur atterrira sur
                  </p>
                  <p className="break-all text-[11.5px] font-semibold tabular-nums" style={{ color: ST.text }}>
                    {apercuUtm(form)}
                  </p>
                  <p className="mt-2 text-[11px] font-bold" style={{ color: ST.textSecondary }}>
                    Le lien à partager, lui, passera par Novakou pour compter les clics — il s&apos;affichera ici après création.
                  </p>
                </div>
              )}
            </div>
          </StModal>
        )}
      </main>
    </div>
  );
}
