"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInstructorPopups, instructorKeys } from "@/lib/formations/hooks";
import Link from "next/link";
import {
  MessageSquare, Tag, Mail, Megaphone, ShoppingBag, Timer,
  Plus, Loader2, AlertCircle, X, Eye, MousePointerClick,
  TrendingUp, ToggleLeft, ToggleRight, Trash2, Pencil,
  Copy, Check, Monitor, ArrowLeft, MousePointer, Clock,
  ScrollText, Hash, Zap,
} from "lucide-react";
import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(
  () => import("@/components/formations/MarkdownEditor"),
  { ssr: false, loading: () => <div className="h-[150px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

// ── Types ──────────────────────────────────────────────────────────────────

type PopupType = "DISCOUNT" | "EMAIL_CAPTURE" | "ANNOUNCEMENT" | "UPSELL" | "COUNTDOWN";
type PopupTrigger = "EXIT_INTENT" | "TIME_DELAY" | "SCROLL_PERCENT" | "PAGE_VIEW_COUNT" | "MANUAL";

interface Popup {
  id: string;
  name: string;
  type: PopupType;
  trigger: PopupTrigger;
  triggerValue: number | null;
  headlineFr: string;
  headlineEn: string;
  bodyFr: string;
  bodyEn: string;
  ctaTextFr: string;
  ctaTextEn: string;
  imageBannerUrl: string | null;
  discountCode: string | null;
  emailCaptureTag: string | null;
  countdownEndsAt: string | null;
  upsellProductId: string | null;
  upsellOriginalPrice: number | null;
  upsellDiscountedPrice: number | null;
  ctaUrl: string | null;
  showOnPages: string[];
  excludePages: string[];
  newVisitorsOnly: boolean;
  maxShowsPerUser: number;
  impressions: number;
  clicks: number;
  conversions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalPopups: number;
  activePopups: number;
  totalImpressions: number;
  totalConversions: number;
  avgConversionRate: string;
}

interface FormState {
  name: string;
  type: PopupType;
  trigger: PopupTrigger;
  triggerValue: string;
  headlineFr: string;
  headlineEn: string;
  bodyFr: string;
  bodyEn: string;
  ctaTextFr: string;
  ctaTextEn: string;
  imageBannerUrl: string;
  discountCode: string;
  emailCaptureTag: string;
  countdownEndsAt: string;
  upsellOriginalPrice: string;
  upsellDiscountedPrice: string;
  ctaUrl: string;
  showOnPages: string;
  excludePages: string;
  newVisitorsOnly: boolean;
  maxShowsPerUser: string;
}

interface FormErrors {
  name?: string;
  trigger?: string;
  typeSpecific?: string;
  general?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const POPUP_TYPE_CONFIG: Record<PopupType, { label: string; icon: typeof Tag; color: string; bgColor: string; description: string }> = {
  DISCOUNT: { label: "Reduction", icon: Tag, color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30", description: "Affiche un code promo avec copie rapide" },
  EMAIL_CAPTURE: { label: "Capture email", icon: Mail, color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30", description: "Formulaire d'inscription newsletter" },
  ANNOUNCEMENT: { label: "Annonce", icon: Megaphone, color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30", description: "Message promotionnel avec lien CTA" },
  UPSELL: { label: "Upsell", icon: ShoppingBag, color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30", description: "Produit avec prix barre et CTA d'achat" },
  COUNTDOWN: { label: "Compte a rebours", icon: Timer, color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30", description: "Minuteur d'urgence avec offre limitee" },
};

const POPUP_TRIGGER_CONFIG: Record<PopupTrigger, { label: string; icon: typeof MousePointer; description: string; needsValue: boolean; valueSuffix: string }> = {
  EXIT_INTENT: { label: "Intention de sortie", icon: MousePointer, description: "Quand la souris quitte la fenêtre", needsValue: false, valueSuffix: "" },
  TIME_DELAY: { label: "Délai temporel", icon: Clock, description: "Après X secondes sur la page", needsValue: true, valueSuffix: "secondes" },
  SCROLL_PERCENT: { label: "Défilement", icon: ScrollText, description: "Quand le visiteur scrolle à X%", needsValue: true, valueSuffix: "%" },
  PAGE_VIEW_COUNT: { label: "Nombre de vues", icon: Hash, description: "À la Nième visite de page", needsValue: true, valueSuffix: "vues" },
  MANUAL: { label: "Manuel", icon: Zap, description: "Déclenché par un bouton dans la page", needsValue: false, valueSuffix: "" },
};

const INITIAL_FORM: FormState = {
  name: "",
  type: "DISCOUNT",
  trigger: "EXIT_INTENT",
  triggerValue: "",
  headlineFr: "",
  headlineEn: "",
  bodyFr: "",
  bodyEn: "",
  ctaTextFr: "",
  ctaTextEn: "",
  imageBannerUrl: "",
  discountCode: "",
  emailCaptureTag: "",
  countdownEndsAt: "",
  upsellOriginalPrice: "",
  upsellDiscountedPrice: "",
  ctaUrl: "",
  showOnPages: "",
  excludePages: "",
  newVisitorsOnly: false,
  maxShowsPerUser: "3",
};

// ── Helpers ──────────────────────────────────────────────────────────────

function conversionRate(impressions: number, conversions: number): string {
  if (impressions === 0) return "0";
  return ((conversions / impressions) * 100).toFixed(1);
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PopupsManagementPage() {
  const queryClient = useQueryClient();
  const { data: queryData, isLoading: loading } = useInstructorPopups();
  const popups: Popup[] = (queryData as { popups?: Popup[] })?.popups ?? [];
  const stats: Stats | null = (queryData as { stats?: Stats })?.stats ?? null;

  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ── Form handlers ──

  const updateForm = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors({});
  };

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (popup: Popup) => {
    setForm({
      name: popup.name,
      type: popup.type,
      trigger: popup.trigger,
      triggerValue: popup.triggerValue?.toString() || "",
      headlineFr: popup.headlineFr,
      headlineEn: popup.headlineEn,
      bodyFr: popup.bodyFr,
      bodyEn: popup.bodyEn,
      ctaTextFr: popup.ctaTextFr,
      ctaTextEn: popup.ctaTextEn,
      imageBannerUrl: popup.imageBannerUrl || "",
      discountCode: popup.discountCode || "",
      emailCaptureTag: popup.emailCaptureTag || "",
      countdownEndsAt: popup.countdownEndsAt ? popup.countdownEndsAt.slice(0, 16) : "",
      upsellOriginalPrice: popup.upsellOriginalPrice?.toString() || "",
      upsellDiscountedPrice: popup.upsellDiscountedPrice?.toString() || "",
      ctaUrl: popup.ctaUrl || "",
      showOnPages: popup.showOnPages.join(", "),
      excludePages: popup.excludePages.join(", "),
      newVisitorsOnly: popup.newVisitorsOnly,
      maxShowsPerUser: popup.maxShowsPerUser.toString(),
    });
    setEditingId(popup.id);
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.name.trim()) e.name = "Le nom est obligatoire";

    const triggerCfg = POPUP_TRIGGER_CONFIG[form.trigger];
    if (triggerCfg.needsValue) {
      const val = parseFloat(form.triggerValue);
      if (isNaN(val) || val <= 0) e.trigger = "Valeur du declencheur invalide";
    }

    if (!form.headlineFr.trim()) e.general = "Le titre en francais est obligatoire";
    if (!form.ctaTextFr.trim()) e.general = "Le texte du CTA en francais est obligatoire";

    if (form.type === "DISCOUNT" && !form.discountCode.trim()) {
      e.typeSpecific = "Code de reduction requis";
    }
    if (form.type === "EMAIL_CAPTURE" && !form.emailCaptureTag.trim()) {
      e.typeSpecific = "Tag de capture requis";
    }
    if (form.type === "COUNTDOWN" && !form.countdownEndsAt) {
      e.typeSpecific = "Date de fin du compte a rebours requise";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name.trim(),
        type: form.type,
        trigger: form.trigger,
        triggerValue: POPUP_TRIGGER_CONFIG[form.trigger].needsValue ? parseFloat(form.triggerValue) : null,
        headlineFr: form.headlineFr.trim(),
        headlineEn: form.headlineEn.trim(),
        bodyFr: form.bodyFr.trim(),
        bodyEn: form.bodyEn.trim(),
        ctaTextFr: form.ctaTextFr.trim(),
        ctaTextEn: form.ctaTextEn.trim(),
        imageBannerUrl: form.imageBannerUrl.trim() || null,
        discountCode: form.type === "DISCOUNT" ? form.discountCode.trim() : null,
        emailCaptureTag: form.type === "EMAIL_CAPTURE" ? form.emailCaptureTag.trim() : null,
        countdownEndsAt: form.type === "COUNTDOWN" ? form.countdownEndsAt : null,
        upsellOriginalPrice: form.type === "UPSELL" ? parseFloat(form.upsellOriginalPrice) || null : null,
        upsellDiscountedPrice: form.type === "UPSELL" ? parseFloat(form.upsellDiscountedPrice) || null : null,
        ctaUrl: form.ctaUrl.trim() || null,
        showOnPages: form.showOnPages.split(",").map((s) => s.trim()).filter(Boolean),
        excludePages: form.excludePages.split(",").map((s) => s.trim()).filter(Boolean),
        newVisitorsOnly: form.newVisitorsOnly,
        maxShowsPerUser: parseInt(form.maxShowsPerUser) || 3,
      };

      const res = await fetch("/api/marketing/popups", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrors({ general: err.error || "Erreur lors de l'enregistrement" });
        return;
      }

      setShowForm(false);
      setEditingId(null);
      setForm(INITIAL_FORM);
      await queryClient.invalidateQueries({ queryKey: instructorKeys.popups() });
    } catch {
      setErrors({ general: "Erreur reseau" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (popup: Popup) => {
    try {
      await fetch("/api/marketing/popups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: popup.id, isActive: !popup.isActive }),
      });
      await queryClient.invalidateQueries({ queryKey: instructorKeys.popups() });
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce popup ? Cette action est irreversible.")) return;
    try {
      await fetch(`/api/marketing/popups?id=${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: instructorKeys.popups() });
    } catch {
      // ignore
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── Loading ──

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/formations/instructeur/marketing"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Popups intelligents</h1>
          </div>
          <p className="text-sm text-slate-500 ml-7">
            Creez des popups cibles pour convertir vos visiteurs en clients
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Creer un popup
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Total popups" value={stats.totalPopups} color="text-slate-600 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 dark:text-slate-300" />
          <StatCard icon={<ToggleRight className="w-5 h-5" />} label="Actifs" value={stats.activePopups} color="text-green-600 bg-green-50 dark:bg-green-900/20" />
          <StatCard icon={<Eye className="w-5 h-5" />} label="Impressions totales" value={formatNumber(stats.totalImpressions)} color="text-blue-600 bg-blue-50 dark:bg-blue-900/20" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Conversions totales" value={formatNumber(stats.totalConversions)} sub={`${stats.avgConversionRate}% moy.`} color="text-purple-600 bg-purple-50 dark:bg-purple-900/20" />
        </div>
      )}

      {/* Popup List */}
      {popups.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">Aucun popup</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Les popups intelligents vous permettent de capter l'attention de vos visiteurs au bon moment.
            Creez votre premier popup pour augmenter vos conversions.
          </p>
          <button
            onClick={openCreate}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Creer votre premier popup
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {popups.map((popup) => {
            const typeConfig = POPUP_TYPE_CONFIG[popup.type];
            const triggerConfig = POPUP_TRIGGER_CONFIG[popup.trigger];
            const TypeIcon = typeConfig.icon;
            const TriggerIcon = triggerConfig.icon;
            const rate = conversionRate(popup.impressions, popup.conversions);

            return (
              <div
                key={popup.id}
                className={`bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border transition-all ${
                  popup.isActive
                    ? "border-slate-200 dark:border-slate-700"
                    : "border-slate-200 dark:border-slate-700 opacity-60"
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Left: Name + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-bold text-sm truncate">{popup.name}</h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeConfig.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          <TriggerIcon className="w-3 h-3" />
                          {triggerConfig.label}
                          {popup.triggerValue != null && ` (${popup.triggerValue}${triggerConfig.valueSuffix})`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{popup.headlineFr}</p>
                      {popup.discountCode && (
                        <button
                          onClick={() => handleCopyCode(popup.discountCode!)}
                          className="inline-flex items-center gap-1 mt-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          {copiedCode === popup.discountCode ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          {popup.discountCode}
                        </button>
                      )}
                    </div>

                    {/* Middle: Stats */}
                    <div className="flex items-center gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold">{formatNumber(popup.impressions)}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Impressions</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{formatNumber(popup.clicks)}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Clics</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary">{rate}%</p>
                        <p className="text-[10px] text-slate-500 uppercase">Conversion</p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewPopup(popup)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                        title="Previsualiser"
                      >
                        <Monitor className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => openEdit(popup)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleToggle(popup)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                        title={popup.isActive ? "Desactiver" : "Activer"}
                      >
                        {popup.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(popup.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-8">
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold">
                {editingId ? "Modifier le popup" : "Nouveau popup"}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Nom du popup *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Ex: Remise bienvenue exit intent"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Type Selection — Visual Cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Type de popup *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(POPUP_TYPE_CONFIG) as [PopupType, typeof POPUP_TYPE_CONFIG[PopupType]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const selected = form.type === key;
                    return (
                      <button
                        key={key}
                        onClick={() => updateForm("type", key)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                          selected
                            ? "border-primary bg-primary/5 dark:bg-primary/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${cfg.bgColor}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <span className="text-xs font-bold">{cfg.label}</span>
                        <span className="text-[10px] text-slate-400 leading-tight">{cfg.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trigger Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Declencheur *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(POPUP_TRIGGER_CONFIG) as [PopupTrigger, typeof POPUP_TRIGGER_CONFIG[PopupTrigger]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const selected = form.trigger === key;
                    return (
                      <button
                        key={key}
                        onClick={() => updateForm("trigger", key)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          selected
                            ? "border-primary bg-primary/5 dark:bg-primary/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${selected ? "text-primary" : "text-slate-400"}`} />
                        <div className="text-left">
                          <p className="text-xs font-bold">{cfg.label}</p>
                          <p className="text-[10px] text-slate-400">{cfg.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {POPUP_TRIGGER_CONFIG[form.trigger].needsValue && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Valeur ({POPUP_TRIGGER_CONFIG[form.trigger].valueSuffix}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.triggerValue}
                      onChange={(e) => updateForm("triggerValue", e.target.value)}
                      placeholder={form.trigger === "TIME_DELAY" ? "15" : form.trigger === "SCROLL_PERCENT" ? "40" : "3"}
                      className="w-32 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    {errors.trigger && <p className="text-xs text-red-500 mt-1">{errors.trigger}</p>}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Contenu du popup</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Titre (FR) *</label>
                    <input
                      type="text"
                      value={form.headlineFr}
                      onChange={(e) => updateForm("headlineFr", e.target.value)}
                      placeholder="Titre accrocheur en francais"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Titre (EN)</label>
                    <input
                      type="text"
                      value={form.headlineEn}
                      onChange={(e) => updateForm("headlineEn", e.target.value)}
                      placeholder="Catchy headline in English"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Description (FR)</label>
                    <MarkdownEditor
                      value={form.bodyFr}
                      onChange={(val) => updateForm("bodyFr", val)}
                      placeholder="Texte d'accroche pour convaincre"
                      height={150}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Description (EN)</label>
                    <MarkdownEditor
                      value={form.bodyEn}
                      onChange={(val) => updateForm("bodyEn", val)}
                      placeholder="Persuasive body text"
                      height={150}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Texte CTA (FR) *</label>
                    <input
                      type="text"
                      value={form.ctaTextFr}
                      onChange={(e) => updateForm("ctaTextFr", e.target.value)}
                      placeholder="Ex: J'en profite"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Texte CTA (EN)</label>
                    <input
                      type="text"
                      value={form.ctaTextEn}
                      onChange={(e) => updateForm("ctaTextEn", e.target.value)}
                      placeholder="Ex: Get it now"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">URL image banniere (optionnel)</label>
                  <input
                    type="url"
                    value={form.imageBannerUrl}
                    onChange={(e) => updateForm("imageBannerUrl", e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Type-specific fields */}
              {form.type === "DISCOUNT" && (
                <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Options Reduction
                  </p>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Code de reduction *</label>
                    <input
                      type="text"
                      value={form.discountCode}
                      onChange={(e) => updateForm("discountCode", e.target.value.toUpperCase())}
                      placeholder="BIENVENUE20"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Lien CTA (optionnel)</label>
                    <input
                      type="text"
                      value={form.ctaUrl}
                      onChange={(e) => updateForm("ctaUrl", e.target.value)}
                      placeholder="/formations/explorer"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {form.type === "EMAIL_CAPTURE" && (
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Options Capture Email
                  </p>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tag a appliquer *</label>
                    <input
                      type="text"
                      value={form.emailCaptureTag}
                      onChange={(e) => updateForm("emailCaptureTag", e.target.value)}
                      placeholder="newsletter_web"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Ce tag sera applique au contact capture pour le segmenter</p>
                  </div>
                </div>
              )}

              {form.type === "ANNOUNCEMENT" && (
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5" /> Options Annonce
                  </p>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Lien CTA</label>
                    <input
                      type="text"
                      value={form.ctaUrl}
                      onChange={(e) => updateForm("ctaUrl", e.target.value)}
                      placeholder="https://example.com/promo"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {form.type === "UPSELL" && (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" /> Options Upsell
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Prix original</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.upsellOriginalPrice}
                        onChange={(e) => updateForm("upsellOriginalPrice", e.target.value)}
                        placeholder="59.99"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Prix reduit</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.upsellDiscountedPrice}
                        onChange={(e) => updateForm("upsellDiscountedPrice", e.target.value)}
                        placeholder="29.99"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Lien CTA</label>
                    <input
                      type="text"
                      value={form.ctaUrl}
                      onChange={(e) => updateForm("ctaUrl", e.target.value)}
                      placeholder="/formations/react-nextjs"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {form.type === "COUNTDOWN" && (
                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" /> Options Compte a rebours
                  </p>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Date/heure de fin *</label>
                    <input
                      type="datetime-local"
                      value={form.countdownEndsAt}
                      onChange={(e) => updateForm("countdownEndsAt", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Lien CTA</label>
                    <input
                      type="text"
                      value={form.ctaUrl}
                      onChange={(e) => updateForm("ctaUrl", e.target.value)}
                      placeholder="/formations/react-nextjs"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {errors.typeSpecific && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.typeSpecific}
                </p>
              )}

              {/* Targeting */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Ciblage</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Afficher sur ces pages (virgules)</label>
                    <input
                      type="text"
                      value={form.showOnPages}
                      onChange={(e) => updateForm("showOnPages", e.target.value)}
                      placeholder="Vide = toutes les pages"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Exclure ces pages (virgules)</label>
                    <input
                      type="text"
                      value={form.excludePages}
                      onChange={(e) => updateForm("excludePages", e.target.value)}
                      placeholder="/connexion, /inscription"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.newVisitorsOnly}
                      onChange={(e) => updateForm("newVisitorsOnly", e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                    />
                    <span className="text-xs font-medium">Nouveaux visiteurs uniquement</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Max affichages :</label>
                    <input
                      type="number"
                      min="1"
                      value={form.maxShowsPerUser}
                      onChange={(e) => updateForm("maxShowsPerUser", e.target.value)}
                      className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {errors.general && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl p-3 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errors.general}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Enregistrer" : "Creer le popup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPopup && (
        <PopupPreviewModal popup={previewPopup} onClose={() => setPreviewPopup(null)} />
      )}
    </div>
  );
}

// ── Sub-components ──

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {sub && <p className="text-xs text-primary font-semibold mt-0.5">{sub}</p>}
    </div>
  );
}

function PopupPreviewModal({ popup, onClose }: { popup: Popup; onClose: () => void }) {
  const typeConfig = POPUP_TYPE_CONFIG[popup.type];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Preview label */}
        <div className="bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">APERCU DU POPUP</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview content */}
        <div className="relative p-6">
          {/* Close button */}
          <button className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>

          {/* Banner image */}
          {popup.imageBannerUrl && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img src={popup.imageBannerUrl} alt="" className="w-full h-32 object-cover" />
            </div>
          )}

          {/* Headline */}
          <h3 className="text-xl font-bold pr-8 mb-2">{popup.headlineFr}</h3>

          {/* Body */}
          {popup.bodyFr && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{popup.bodyFr}</p>
          )}

          {/* Type-specific content */}
          {popup.type === "DISCOUNT" && popup.discountCode && (
            <div className="mb-4">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-xl px-4 py-3">
                <span className="text-lg font-mono font-bold flex-1 text-center tracking-wider">
                  {popup.discountCode}
                </span>
                <button className="p-1.5 rounded-lg bg-white dark:bg-slate-900 dark:bg-slate-600 shadow-sm">
                  <Copy className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}

          {popup.type === "EMAIL_CAPTURE" && (
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  readOnly
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>
          )}

          {popup.type === "COUNTDOWN" && (
            <div className="mb-4">
              <div className="flex items-center justify-center gap-3">
                {["12", "34", "56"].map((val, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="bg-slate-900 dark:bg-slate-700 text-white text-2xl font-mono font-bold w-14 h-14 rounded-xl flex items-center justify-center">
                      {val}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {["heures", "minutes", "secondes"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {popup.type === "UPSELL" && popup.upsellOriginalPrice && (
            <div className="mb-4 flex items-center gap-3">
              <span className="text-slate-400 line-through text-lg">{popup.upsellOriginalPrice.toFixed(2)}EUR</span>
              <span className="text-2xl font-bold text-green-600">{popup.upsellDiscountedPrice?.toFixed(2) || "---"}EUR</span>
            </div>
          )}

          {/* CTA Button */}
          <button className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
            {popup.ctaTextFr}
          </button>

          {/* Don't show again */}
          <p className="text-center text-[10px] text-slate-400 mt-3 cursor-pointer hover:text-slate-600 transition-colors">
            Ne plus afficher
          </p>
        </div>
      </div>
    </div>
  );
}
