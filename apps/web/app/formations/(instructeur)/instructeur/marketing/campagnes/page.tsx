"use client";

import { useState, useEffect } from "react";
import { useMarketingCampaigns } from "@/lib/formations/hooks";
import Link from "next/link";
import {
  MousePointerClick, Link2, Plus, Copy, Check, X,
  ToggleLeft, ToggleRight, Trash2, Loader2, ExternalLink,
  TrendingUp, Users, DollarSign, BarChart3,
  ChevronDown, ChevronUp, AlertCircle, Globe, Zap,
} from "lucide-react";
import SharedStatCard from "@/components/formations/StatCard";

// ── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  slug: string;
  name: string;
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string | null;
  trackingUrl: string;
  isActive: boolean;
  clicks: number;
  uniqueClicks?: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  lastClickAt: string | null;
  createdAt: string;
}

interface Stats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
}

interface FormState {
  name: string;
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
}

interface FormErrors {
  name?: string;
  destinationUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  general?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SOURCE_PRESETS = [
  { label: "Facebook", source: "facebook", medium: "paid_social" },
  { label: "Instagram", source: "instagram", medium: "organic_social" },
  { label: "YouTube", source: "youtube", medium: "video" },
  { label: "Newsletter", source: "newsletter", medium: "email" },
  { label: "Twitter / X", source: "twitter", medium: "organic_social" },
  { label: "LinkedIn", source: "linkedin", medium: "organic_social" },
  { label: "Google Ads", source: "google", medium: "cpc" },
  { label: "TikTok", source: "tiktok", medium: "organic_social" },
  { label: "Blog", source: "blog", medium: "referral" },
  { label: "Partenaire", source: "partner", medium: "affiliate" },
];

const SOURCE_COLORS: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  instagram: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  youtube: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  newsletter: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  twitter: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  linkedin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  google: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  tiktok: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  blog: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  partner: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Jamais";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const { data: queryData, isLoading: loading, error: queryError, refetch } = useMarketingCampaigns();

  // Local state for optimistic mutation updates — seeded from query data
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCampaigns: 0, activeCampaigns: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0,
  });

  // Seed local state from query data on first successful load
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!seeded && queryData && !loading) {
      const d = queryData as { campaigns?: Campaign[]; stats?: Stats };
      setCampaigns(d.campaigns ?? []);
      setStats(d.stats ?? { totalCampaigns: 0, activeCampaigns: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 });
      setSeeded(true);
    }
  }, [queryData, loading, seeded]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [form, setForm] = useState<FormState>({
    name: "", destinationUrl: "", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // ── Actions ──

  const copyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const toggleActive = async (id: string) => {
    const target = campaigns.find((c) => c.id === id);
    if (!target) return;

    // Optimistic update
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
    );
    setStats((prev) => ({
      ...prev,
      activeCampaigns: target.isActive ? prev.activeCampaigns - 1 : prev.activeCampaigns + 1,
    }));

    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !target.isActive }),
      });
      if (!res.ok) {
        // Revert on failure
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: target.isActive } : c)),
        );
        setStats((prev) => ({
          ...prev,
          activeCampaigns: target.isActive ? prev.activeCampaigns + 1 : prev.activeCampaigns - 1,
        }));
        alert("Erreur lors du changement de statut");
      }
    } catch {
      // Revert on error
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: target.isActive } : c)),
      );
      setStats((prev) => ({
        ...prev,
        activeCampaigns: target.isActive ? prev.activeCampaigns + 1 : prev.activeCampaigns - 1,
      }));
      alert("Erreur lors du changement de statut");
    }
  };

  const deleteCampaign = async (id: string) => {
    const target = campaigns.find((c) => c.id === id);
    try {
      const res = await fetch(`/api/marketing/campaigns?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");

      // Only remove from local state after successful API call
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setStats((prev) => ({
        ...prev,
        totalCampaigns: prev.totalCampaigns - 1,
        activeCampaigns: target?.isActive ? prev.activeCampaigns - 1 : prev.activeCampaigns,
      }));
    } catch {
      // API call failed — keep campaign in local state, do not remove
      alert("Erreur lors de la suppression de la campagne");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Form handling ──

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in formErrors) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof FormErrors];
        return next;
      });
    }
    // Clear generated URL when form changes
    setGeneratedUrl(null);
  };

  const applyPreset = (preset: { source: string; medium: string }) => {
    setForm((prev) => ({
      ...prev,
      utmSource: preset.source,
      utmMedium: preset.medium,
    }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.utmSource;
      delete next.utmMedium;
      return next;
    });
    setGeneratedUrl(null);
  };

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!form.name || form.name.trim().length < 2) {
      errors.name = "Le nom est requis (min 2 caracteres)";
    }
    if (!form.destinationUrl || form.destinationUrl.trim().length < 1) {
      errors.destinationUrl = "L'URL de destination est requise";
    }
    if (!form.utmSource || form.utmSource.trim().length < 1) {
      errors.utmSource = "La source UTM est requise";
    }
    if (!form.utmMedium || form.utmMedium.trim().length < 1) {
      errors.utmMedium = "Le medium UTM est requis";
    }
    if (!form.utmCampaign || form.utmCampaign.trim().length < 1) {
      errors.utmCampaign = "Le nom de campagne UTM est requis";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          destinationUrl: form.destinationUrl.trim(),
          utmSource: form.utmSource.trim().toLowerCase(),
          utmMedium: form.utmMedium.trim().toLowerCase(),
          utmCampaign: form.utmCampaign.trim().toLowerCase().replace(/\s+/g, "-"),
          utmContent: form.utmContent.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCampaigns((prev) => [data.campaign, ...prev]);
        setStats((prev) => ({
          ...prev,
          totalCampaigns: prev.totalCampaigns + 1,
          activeCampaigns: prev.activeCampaigns + 1,
        }));
        setGeneratedUrl(data.campaign.trackingUrl);
      } else {
        const data = await res.json();
        setFormErrors({ general: data.error || "Erreur lors de la creation" });
      }
    } catch {
      setFormErrors({ general: "Erreur de connexion" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", destinationUrl: "", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "" });
    setFormErrors({});
    setGeneratedUrl(null);
  };

  // ── Loading ──

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <Link2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-slate-500 mb-4">{queryError.message || "Erreur lors du chargement"}</p>
          <button onClick={() => refetch()} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/formations/instructeur/marketing"
              className="text-sm text-slate-500 hover:text-primary transition-colors"
            >
              Marketing
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
            Campagnes & Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Creez des liens de suivi UTM pour mesurer l&apos;efficacite de vos campagnes
          </p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); resetForm(); }}
          className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <SharedStatCard icon={Link2} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" label="Campagnes" value={stats.totalCampaigns} />
        <SharedStatCard icon={Zap} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" label="Actives" value={stats.activeCampaigns} />
        <SharedStatCard icon={MousePointerClick} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" label="Clics totaux" value={formatNumber(stats.totalClicks)} />
        <SharedStatCard icon={Users} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" label="Conversions" value={formatNumber(stats.totalConversions)} />
        <SharedStatCard icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/20" label="Revenus" value={formatEur(stats.totalRevenue)} />
      </div>

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Link2 className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-600 dark:text-slate-400">
            Aucune campagne
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Creez votre premier lien de tracking pour mesurer l&apos;impact de vos promotions sur les reseaux sociaux, emails, et autres canaux.
          </p>
          <button
            onClick={() => { setShowCreateModal(true); resetForm(); }}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm mt-6"
          >
            <Plus className="w-4 h-4" />
            Creer une campagne
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              isExpanded={expandedId === c.id}
              isCopied={copiedId === c.id}
              onToggleExpand={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onCopyLink={() => copyLink(c.trackingUrl, c.id)}
              onToggleActive={() => toggleActive(c.id)}
              onDelete={() => setDeletingId(c.id)}
            />
          ))}
        </div>
      )}

      {/* ── Create campaign modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh] overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowCreateModal(false); resetForm(); }}
          />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Nouvelle campagne
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreate} className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {formErrors.general && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formErrors.general}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nom de la campagne *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Ex: Facebook Ads - Promo Mars 2026"
                  className={`w-full text-sm border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 transition-colors ${
                    formErrors.name
                      ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                      : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700"
                  }`}
                />
                {formErrors.name && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              {/* Destination URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  URL de destination *
                </label>
                <input
                  type="text"
                  value={form.destinationUrl}
                  onChange={(e) => updateField("destinationUrl", e.target.value)}
                  placeholder="/formations/react-nextjs-guide-complet"
                  className={`w-full text-sm border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 transition-colors ${
                    formErrors.destinationUrl
                      ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                      : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700"
                  }`}
                />
                <p className="text-xs text-slate-400 mt-1">Chemin relatif ou URL complete</p>
                {formErrors.destinationUrl && (
                  <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.destinationUrl}
                  </p>
                )}
              </div>

              {/* Source presets */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Source rapide
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SOURCE_PRESETS.map((preset) => (
                    <button
                      key={preset.source}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        form.utmSource === preset.source
                          ? "border-primary bg-primary/5 text-primary dark:bg-primary/10"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* UTM Source + Medium */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    UTM Source *
                  </label>
                  <input
                    type="text"
                    value={form.utmSource}
                    onChange={(e) => updateField("utmSource", e.target.value)}
                    placeholder="facebook"
                    className={`w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.utmSource
                        ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                        : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700"
                    }`}
                  />
                  {formErrors.utmSource && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.utmSource}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    UTM Medium *
                  </label>
                  <input
                    type="text"
                    value={form.utmMedium}
                    onChange={(e) => updateField("utmMedium", e.target.value)}
                    placeholder="paid_social"
                    className={`w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.utmMedium
                        ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                        : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700"
                    }`}
                  />
                  {formErrors.utmMedium && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.utmMedium}
                    </p>
                  )}
                </div>
              </div>

              {/* UTM Campaign + Content */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    UTM Campaign *
                  </label>
                  <input
                    type="text"
                    value={form.utmCampaign}
                    onChange={(e) => updateField("utmCampaign", e.target.value)}
                    placeholder="promo-mars-2026"
                    className={`w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.utmCampaign
                        ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                        : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700"
                    }`}
                  />
                  {formErrors.utmCampaign && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.utmCampaign}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    UTM Content
                  </label>
                  <input
                    type="text"
                    value={form.utmContent}
                    onChange={(e) => updateField("utmContent", e.target.value)}
                    placeholder="carousel-ad-v1"
                    className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Optionnel</p>
                </div>
              </div>

              {/* Generated tracking link */}
              {generatedUrl && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">Campagne creee avec succes !</p>
                  </div>
                  <label className="block text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                    Votre lien de tracking :
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedUrl}
                      className="flex-1 text-xs font-mono bg-white dark:bg-slate-900 dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(generatedUrl, "generated")}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {copiedId === "generated" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === "generated" ? "Copie" : "Copier"}
                    </button>
                  </div>
                </div>
              )}

              {/* Preview (before creation) */}
              {!generatedUrl && form.utmSource && form.utmCampaign && form.destinationUrl && (
                <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-600 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apercu UTM</p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
                    {form.destinationUrl}
                    <span className="text-primary">
                      ?utm_source={form.utmSource || "..."}&utm_medium={form.utmMedium || "..."}&utm_campaign={form.utmCampaign || "..."}
                      {form.utmContent ? `&utm_content=${form.utmContent}` : ""}
                    </span>
                  </p>
                </div>
              )}
            </form>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700">
              {generatedUrl ? (
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                >
                  <Check className="w-4 h-4" />
                  Fermer
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creation...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Creer la campagne
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletingId(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-2">
                Supprimer cette campagne ?
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Le lien de tracking ne fonctionnera plus. Les donnees historiques seront perdues.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteCampaign(deletingId)}
                  className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CampaignCard({
  campaign: c,
  isExpanded,
  isCopied,
  onToggleExpand,
  onCopyLink,
  onToggleActive,
  onDelete,
}: {
  campaign: Campaign;
  isExpanded: boolean;
  isCopied: boolean;
  onToggleExpand: () => void;
  onCopyLink: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Main row */}
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Name + source badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 truncate">
                {c.name}
              </h3>
              <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${getSourceColor(c.utmSource)}`}>
                {c.utmSource}
              </span>
              {!c.isActive && (
                <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {c.destinationUrl}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs flex-shrink-0">
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white dark:text-slate-100">{formatNumber(c.clicks)}</p>
              <p className="text-slate-400">Clics</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white dark:text-slate-100">{c.conversions}</p>
              <p className="text-slate-400">Conv.</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-green-600">{formatEur(c.revenue)}</p>
              <p className="text-slate-400">Revenus</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-primary">{c.conversionRate}%</p>
              <p className="text-slate-400">Taux</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onCopyLink}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-primary"
              title="Copier le lien"
            >
              {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onToggleActive}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title={c.isActive ? "Desactiver" : "Activer"}
            >
              {c.isActive ? (
                <ToggleRight className="w-5 h-5 text-green-500" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400"
              title="Details"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-slate-400 hover:text-red-500"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-slate-700 mt-0">
          <div className="pt-4 space-y-4">
            {/* Tracking link */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Lien de tracking
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={c.trackingUrl}
                  className="flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300"
                />
                <button
                  onClick={onCopyLink}
                  className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? "Copie" : "Copier"}
                </button>
              </div>
            </div>

            {/* UTM parameters */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Parametres UTM
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase">Source</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.utmSource}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase">Medium</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.utmMedium}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase">Campaign</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.utmCampaign}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase">Content</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.utmContent || "-"}</p>
                </div>
              </div>
            </div>

            {/* Stats detail */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                <MousePointerClick className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100">{formatNumber(c.clicks)}</p>
                <p className="text-[10px] text-slate-500">Clics totaux</p>
                {c.uniqueClicks !== undefined && (
                  <p className="text-[10px] text-blue-500 mt-0.5">{formatNumber(c.uniqueClicks)} uniques</p>
                )}
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                <Users className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900 dark:text-white dark:text-slate-100">{c.conversions}</p>
                <p className="text-[10px] text-slate-500">Conversions</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                <DollarSign className="w-4 h-4 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-600">{formatEur(c.revenue)}</p>
                <p className="text-[10px] text-slate-500">Revenus</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-primary">{c.conversionRate}%</p>
                <p className="text-[10px] text-slate-500">Taux conv.</p>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
              <span>Cree le {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span>Dernier clic : {timeAgo(c.lastClickAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
