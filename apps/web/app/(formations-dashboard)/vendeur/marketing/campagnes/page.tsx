"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";

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

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function buildUtmUrl(campaign: Campaign): string {
  const base = campaign.destinationUrl;
  const params = new URLSearchParams();
  if (campaign.utmSource) params.set("utm_source", campaign.utmSource);
  if (campaign.utmMedium) params.set("utm_medium", campaign.utmMedium);
  if (campaign.utmCampaign) params.set("utm_campaign", campaign.utmCampaign);
  if (campaign.utmContent) params.set("utm_content", campaign.utmContent);
  const qs = params.toString();
  return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
}

const SOURCE_OPTIONS = ["facebook", "instagram", "tiktok", "youtube", "email", "whatsapp", "twitter", "linkedin", "google", "autre"];
const MEDIUM_OPTIONS = ["social", "email", "cpc", "organic", "referral", "influencer", "direct"];

export default function CampagnesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    destinationUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
  });

  const { data: response, isLoading } = useQuery<{ data: Campaign[] }>({
    queryKey: ["vendeur-campagnes"],
    queryFn: () => fetch("/api/formations/vendeur/marketing/campagnes").then((r) => r.json()),
    staleTime: 30_000,
  });

  const campaigns = response?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (body: typeof form) =>
      fetch("/api/formations/vendeur/marketing/campagnes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-campagnes"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      setShowForm(false);
      setForm({ name: "", destinationUrl: "", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/formations/vendeur/marketing/campagnes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-campagnes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/formations/vendeur/marketing/campagnes/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-campagnes"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
    },
  });

  function copyUrl(campaign: Campaign) {
    const url = buildUtmUrl(campaign);
    navigator.clipboard.writeText(url);
    setCopied(campaign.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalClicks = campaigns.reduce((s, c) => s + c.totalClicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.totalConversions, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.totalRevenue, 0);
  const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100) : 0;

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
            <a href="/vendeur/marketing" className="hover:text-[#006e2f] transition-colors">Marketing</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e] font-medium">Liens de Campagne</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Liens de Campagne</h1>
          <p className="text-sm text-[#5c647a] mt-1">Générez des liens UTM pour tracer vos sources de trafic et de revenus</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add_link</span>
          Créer un lien
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Liens actifs", value: campaigns.filter((c) => c.isActive).length, icon: "link", color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Clics totaux", value: totalClicks.toLocaleString("fr-FR"), icon: "ads_click", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Conversions", value: totalConversions, icon: "conversion_path", color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Taux conversion", value: `${conversionRate}%`, icon: "percent", color: "text-[#006e2f]", bg: "bg-[#006e2f]/10" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${kpi.bg}`}>
              <span className={`material-symbols-outlined text-[18px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{kpi.icon}</span>
            </div>
            <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wide">{kpi.label}</p>
            <p className="text-base font-extrabold text-[#191c1e] mt-0.5">{isLoading ? "…" : kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">Nouveau lien de campagne</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="material-symbols-outlined text-[20px] text-[#5c647a]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Nom de la campagne *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Lancement Formation React - Instagram Stories"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">URL de destination *</label>
                <input
                  type="url"
                  value={form.destinationUrl}
                  onChange={(e) => setForm((f) => ({ ...f, destinationUrl: e.target.value }))}
                  placeholder="https://novakou.com/formations/react-complet"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>

              <div className="pt-1">
                <p className="text-xs font-bold text-[#191c1e] mb-3">Paramètres UTM</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5c647a] mb-1 uppercase tracking-wide">Source</label>
                    <select
                      value={form.utmSource}
                      onChange={(e) => setForm((f) => ({ ...f, utmSource: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40 bg-white"
                    >
                      <option value="">Choisir…</option>
                      {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5c647a] mb-1 uppercase tracking-wide">Support</label>
                    <select
                      value={form.utmMedium}
                      onChange={(e) => setForm((f) => ({ ...f, utmMedium: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40 bg-white"
                    >
                      <option value="">Choisir…</option>
                      {MEDIUM_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5c647a] mb-1 uppercase tracking-wide">Campagne</label>
                    <input
                      type="text"
                      value={form.utmCampaign}
                      onChange={(e) => setForm((f) => ({ ...f, utmCampaign: e.target.value }))}
                      placeholder="promo-noel-2026"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5c647a] mb-1 uppercase tracking-wide">Contenu</label>
                    <input
                      type="text"
                      value={form.utmContent}
                      onChange={(e) => setForm((f) => ({ ...f, utmContent: e.target.value }))}
                      placeholder="story-video-1"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40"
                    />
                  </div>
                </div>
              </div>

              {/* Preview URL */}
              {form.destinationUrl && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wide mb-1">Aperçu du lien</p>
                  <p className="text-[11px] tabular-nums text-[#191c1e] break-all">
                    {buildUtmUrl({
                      ...form,
                      id: "", slug: "", totalClicks: 0, totalConversions: 0, totalRevenue: 0, isActive: true, createdAt: "",
                    } as Campaign)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#5c647a] hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || !form.destinationUrl || createMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {createMutation.isPending ? "Création…" : "Créer le lien"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div className="space-y-3">
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-gray-100 rounded w-40" />
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-64 mb-3" />
              <div className="flex gap-4">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            </div>
          ))
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
            <span className="material-symbols-outlined text-[40px] text-gray-300 block mb-3">add_link</span>
            <p className="font-semibold text-[#191c1e]">Aucun lien de campagne</p>
            <p className="text-sm text-[#5c647a] mt-1">Créez votre premier lien pour tracker vos sources de trafic</p>
          </div>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-[#191c1e] text-sm truncate">{c.name}</h3>
                    {c.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f] flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006e2f]" />Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-[#5c647a] flex-shrink-0">
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.utmSource && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{c.utmSource}</span>}
                    {c.utmMedium && <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{c.utmMedium}</span>}
                    {c.utmCampaign && <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">{c.utmCampaign}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${c.isActive ? "bg-[#006e2f]" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${c.isActive ? "left-5" : "left-0.5"}`} />
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirmAction({
                        title: "Supprimer cette campagne ?",
                        message: "Cette action est irréversible.",
                        confirmLabel: "Supprimer",
                        confirmVariant: "danger",
                        icon: "delete",
                      });
                      if (ok) deleteMutation.mutate(c.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              {/* URL row */}
              <div className="flex items-center gap-2 mb-4">
                <code className="flex-1 text-[11px] tabular-nums text-[#5c647a] bg-gray-50 px-3 py-1.5 rounded-lg truncate">
                  {buildUtmUrl(c)}
                </code>
                <button
                  onClick={() => copyUrl(c)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    copied === c.id ? "bg-[#006e2f]/10 text-[#006e2f]" : "bg-gray-100 text-[#5c647a] hover:bg-gray-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{copied === c.id ? "check" : "content_copy"}</span>
                  {copied === c.id ? "Copié !" : "Copier"}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-50">
                {[
                  { label: "Clics", value: c.totalClicks.toLocaleString("fr-FR"), icon: "ads_click", color: "text-blue-600" },
                  { label: "Conversions", value: c.totalConversions, icon: "conversion_path", color: "text-purple-600" },
                  { label: "Revenus", value: `${formatFCFA(c.totalRevenue)} FCFA`, icon: "payments", color: "text-[#006e2f]" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[16px] ${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-[#191c1e]">{stat.value}</p>
                      <p className="text-[10px] text-[#5c647a]">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
