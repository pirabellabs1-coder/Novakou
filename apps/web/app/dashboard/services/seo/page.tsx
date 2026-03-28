"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatServiceTitle } from "@/lib/format-service-title";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { servicesApi } from "@/lib/api-client";

// ============================================================
// Types
// ============================================================

interface SeoCheckItem {
  label: string;
  status: "bon" | "ameliorable" | "manquant";
  detail: string;
  points: number;
  maxPoints: number;
}

interface SeoData {
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  slug: string;
  seoScore: number;
}

interface SeoAnalysis {
  checks: SeoCheckItem[];
  recommendations: string[];
}

interface SeoApiResponse {
  seo: SeoData;
  analysis: SeoAnalysis;
  message?: string;
}

// ============================================================
// Constants
// ============================================================

const MAX_TITLE = 70;
const MAX_DESC = 160;
const MAX_TAGS = 5;
const GAUGE_RADIUS = 54;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

// ============================================================
// Helpers
// ============================================================

function scoreColor(score: number): string {
  if (score > 70) return "#10B981"; // green
  if (score >= 40) return "#F59E0B"; // yellow
  return "#EF4444"; // red
}

function scoreLabel(score: number): string {
  if (score > 70) return "Bon";
  if (score >= 40) return "Moyen";
  return "Faible";
}

function checkIcon(status: SeoCheckItem["status"]): { icon: string; color: string } {
  switch (status) {
    case "bon":
      return { icon: "check_circle", color: "text-green-400" };
    case "ameliorable":
      return { icon: "warning", color: "text-yellow-400" };
    case "manquant":
      return { icon: "cancel", color: "text-red-400" };
  }
}

// ============================================================
// Page Component
// ============================================================

export default function SeoPage() {
  const services = useDashboardStore((s) => s.services);
  const lastSyncAt = useDashboardStore((s) => s.lastSyncAt);
  const syncFromApi = useDashboardStore((s) => s.syncFromApi);
  const addToast = useToastStore((s) => s.addToast);

  // Sync services from API on mount if not already synced
  useEffect(() => {
    if (!lastSyncAt) {
      syncFromApi();
    }
  }, [lastSyncAt, syncFromApi]);

  // Service selection
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // SEO fields (editable)
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // API state
  const [seoScore, setSeoScore] = useState(0);
  const [slug, setSlug] = useState("");
  const [checks, setChecks] = useState<SeoCheckItem[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Track dirty state for the save button
  const [initialData, setInitialData] = useState<{ metaTitle: string; metaDescription: string; tags: string[] } | null>(null);

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return (
      metaTitle !== initialData.metaTitle ||
      metaDesc !== initialData.metaDescription ||
      JSON.stringify(tags) !== JSON.stringify(initialData.tags)
    );
  }, [metaTitle, metaDesc, tags, initialData]);

  // Active services for the selector
  const activeServices = useMemo(
    () => services.filter((s) => s.status === "actif" || s.status === "pause"),
    [services]
  );

  // ── Fetch SEO data when service selection changes ──
  const fetchSeoData = useCallback(async (serviceId: string) => {
    if (!serviceId) return;
    setIsLoading(true);
    setHasLoaded(false);
    try {
      const data = (await servicesApi.getSeo(serviceId)) as SeoApiResponse;
      setMetaTitle(data.seo.metaTitle || "");
      setMetaDesc(data.seo.metaDescription || "");
      setTags(data.seo.tags || []);
      setSlug(data.seo.slug || "");
      setSeoScore(data.seo.seoScore ?? 0);
      setChecks(data.analysis.checks || []);
      setRecommendations(data.analysis.recommendations || []);
      setInitialData({
        metaTitle: data.seo.metaTitle || "",
        metaDescription: data.seo.metaDescription || "",
        tags: data.seo.tags || [],
      });
      setHasLoaded(true);
    } catch (err) {
      console.error("[SEO] Fetch error:", err);
      addToast("error", "Impossible de charger les données SEO de ce service.");
      setHasLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (selectedServiceId) {
      fetchSeoData(selectedServiceId);
    } else {
      // Reset when no service selected
      setMetaTitle("");
      setMetaDesc("");
      setTags([]);
      setSlug("");
      setSeoScore(0);
      setChecks([]);
      setRecommendations([]);
      setInitialData(null);
      setHasLoaded(false);
    }
  }, [selectedServiceId, fetchSeoData]);

  // ── Tag management ──
  const addTag = useCallback(() => {
    const t = newTag.trim();
    if (t && tags.length < MAX_TAGS && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setNewTag("");
    }
  }, [newTag, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((k) => k !== tag));
  }, []);

  // ── Save SEO data ──
  const handleSave = useCallback(async () => {
    if (!selectedServiceId || !isDirty) return;

    // Validate before sending
    if (metaTitle.length > MAX_TITLE) {
      addToast("error", `Le meta titre ne doit pas depasser ${MAX_TITLE} caracteres.`);
      return;
    }
    if (metaDesc.length > MAX_DESC) {
      addToast("error", `La meta description ne doit pas depasser ${MAX_DESC} caracteres.`);
      return;
    }

    setIsSaving(true);
    try {
      const data = (await servicesApi.updateSeo(selectedServiceId, {
        metaTitle,
        metaDescription: metaDesc,
        tags,
      })) as SeoApiResponse;

      // Update state from API response
      setSeoScore(data.seo.seoScore ?? 0);
      setSlug(data.seo.slug || slug);
      setChecks(data.analysis.checks || []);
      setRecommendations(data.analysis.recommendations || []);
      setInitialData({
        metaTitle: data.seo.metaTitle || metaTitle,
        metaDescription: data.seo.metaDescription || metaDesc,
        tags: data.seo.tags || tags,
      });
      addToast("success", "Donnees SEO mises a jour avec succes !");
    } catch (err) {
      console.error("[SEO] Save error:", err);
      const message = err instanceof Error ? err.message : "Erreur lors de la sauvegarde.";
      addToast("error", message);
    } finally {
      setIsSaving(false);
    }
  }, [selectedServiceId, isDirty, metaTitle, metaDesc, tags, slug, addToast]);

  // ── Gauge SVG values ──
  const gaugeOffset = GAUGE_CIRCUMFERENCE - (seoScore / 100) * GAUGE_CIRCUMFERENCE;
  const gaugeColor = scoreColor(seoScore);

  // ── Total & earned points from checks ──
  const totalMaxPoints = checks.reduce((sum, c) => sum + c.maxPoints, 0);
  const totalEarnedPoints = checks.reduce((sum, c) => sum + c.points, 0);

  return (
    <section className="flex-1 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/dashboard/services"
              className="text-slate-500 hover:text-primary flex items-center gap-1 text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Retour aux services
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">Optimisation SEO</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Ameliorez le classement de votre service sur Google et dans les recherches
            internes de la plateforme.
          </p>
        </div>

        {/* Service Selector */}
        <div className="bg-primary/5 rounded-xl border border-primary/10 p-6 mb-8">
          <label className="block text-sm font-bold mb-3">
            <span className="material-symbols-outlined text-primary text-base align-middle mr-1">
              tune
            </span>
            Selectionner un service a optimiser
          </label>
          <select
            className="w-full bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
          >
            <option value="">-- Choisir un service --</option>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {formatServiceTitle(s.title)} ({s.status === "actif" ? "Actif" : "En pause"})
              </option>
            ))}
          </select>
          {activeServices.length === 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Aucun service disponible. Creez un service pour commencer l&apos;optimisation SEO.
            </p>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Chargement des données SEO...</p>
            </div>
          </div>
        )}

        {/* Content — only show when a service is selected and data is loaded */}
        {!isLoading && hasLoaded && selectedServiceId && (
          <div className="grid grid-cols-1 gap-8">
            {/* ── Score Gauge + Breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Circular Score Gauge */}
              <div className="bg-primary/5 rounded-xl border border-primary/10 p-8 flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-wider">
                  Score SEO
                </h3>
                <div className="relative size-36">
                  <svg className="size-36 -rotate-90" viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r={GAUGE_RADIUS}
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-800"
                      strokeWidth="8"
                    />
                    {/* Score arc */}
                    <circle
                      cx="60"
                      cy="60"
                      r={GAUGE_RADIUS}
                      fill="none"
                      stroke={gaugeColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={GAUGE_CIRCUMFERENCE}
                      strokeDashoffset={gaugeOffset}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-3xl font-extrabold"
                      style={{ color: gaugeColor }}
                    >
                      {seoScore}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ 100</span>
                  </div>
                </div>
                <span
                  className="mt-3 text-sm font-bold"
                  style={{ color: gaugeColor }}
                >
                  {scoreLabel(seoScore)}
                </span>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  {totalEarnedPoints} / {totalMaxPoints} points obtenus
                </p>
              </div>

              {/* Score Breakdown — Check Items */}
              <div className="lg:col-span-2 bg-primary/5 rounded-xl border border-primary/10 p-8">
                <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">checklist</span>
                  Analyse detaillee
                </h3>
                <div className="space-y-3">
                  {checks.map((check, i) => {
                    const { icon, color } = checkIcon(check.status);
                    const pct = check.maxPoints > 0 ? (check.points / check.maxPoints) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
                      >
                        <span className={cn("material-symbols-outlined text-lg", color)}>
                          {icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold">{check.label}</span>
                            <span className="text-xs text-slate-400 font-medium">
                              {check.points}/{check.maxPoints} pts
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  check.status === "bon"
                                    ? "#10B981"
                                    : check.status === "ameliorable"
                                      ? "#F59E0B"
                                      : "#EF4444",
                              }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{check.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="mt-6 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <h4 className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">lightbulb</span>
                      Recommandations
                    </h4>
                    <ul className="space-y-1.5">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5 shrink-0">&#8226;</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* ── SEO Form ── */}
            <div className="bg-primary/5 rounded-xl border border-primary/10 p-8">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Modifier les méta-données
              </h3>
              <div className="space-y-8">
                {/* Meta Title */}
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Meta Titre SEO
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      (30-60 caracteres recommandes, max {MAX_TITLE})
                    </span>
                  </label>
                  <input
                    className="w-full bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={MAX_TITLE}
                    placeholder="Ex: Expert en Design de Logo Minimaliste et Moderne"
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-[10px] text-slate-400">
                      Le titre qui apparaitra dans les resultats de recherche.
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        metaTitle.length > MAX_TITLE
                          ? "text-red-400"
                          : metaTitle.length >= 30 && metaTitle.length <= 60
                            ? "text-green-400"
                            : "text-primary"
                      )}
                    >
                      {metaTitle.length} / {MAX_TITLE}
                    </span>
                  </div>
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Meta Description SEO
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      (120-160 caracteres recommandes, max {MAX_DESC})
                    </span>
                  </label>
                  <textarea
                    className="w-full bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                    rows={4}
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    maxLength={MAX_DESC}
                    placeholder="Decrivez votre service pour les moteurs de recherche..."
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-[10px] text-slate-400">
                      Un resume accrocheur pour inciter les clients a cliquer.
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        metaDesc.length > MAX_DESC
                          ? "text-red-400"
                          : metaDesc.length >= 120 && metaDesc.length <= 160
                            ? "text-green-400"
                            : "text-primary"
                      )}
                    >
                      {metaDesc.length} / {MAX_DESC}
                    </span>
                  </div>
                </div>

                {/* Tags / Keywords */}
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Mots-cles personnalises (Tags)
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      (max {MAX_TAGS})
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg min-h-[48px]">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="material-symbols-outlined text-xs hover:text-red-400 transition-colors"
                          type="button"
                        >
                          close
                        </button>
                      </span>
                    ))}
                    {tags.length < MAX_TAGS && (
                      <input
                        className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-slate-400 outline-none min-w-[120px]"
                        placeholder="Ajouter un mot-cle..."
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        onBlur={() => {
                          if (newTag.trim()) addTag();
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-[10px] text-slate-400">
                      Separez les mots-cles par une virgule ou appuyez sur Entree.
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        tags.length >= MAX_TAGS ? "text-yellow-400" : "text-primary"
                      )}
                    >
                      {tags.length} / {MAX_TAGS}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Google SERP Preview ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">visibility</span>
                Aperçu du résultat Google
              </h3>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-6 bg-slate-800 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[12px] text-slate-400">
                        public
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-400 truncate">
                      freelancehigh.com &rsaquo; services &rsaquo;{" "}
                      {slug || "mon-service"}
                    </div>
                  </div>
                  <h4 className="text-[20px] text-[#8ab4f8] hover:underline cursor-pointer font-medium leading-tight mb-1">
                    {metaTitle || "Titre du service"}
                  </h4>
                  <p className="text-[14px] text-slate-300 leading-normal">
                    {metaDesc || "Description du service..."}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Live preview quality hints */}
              <div className="flex flex-wrap gap-3 text-[11px]">
                <span
                  className={cn(
                    "flex items-center gap-1",
                    metaTitle.length >= 30 && metaTitle.length <= 60
                      ? "text-green-400"
                      : metaTitle.length > 0
                        ? "text-yellow-400"
                        : "text-slate-500"
                  )}
                >
                  <span className="material-symbols-outlined text-xs">
                    {metaTitle.length >= 30 && metaTitle.length <= 60
                      ? "check_circle"
                      : "info"}
                  </span>
                  Titre: {metaTitle.length} car.
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    metaDesc.length >= 120 && metaDesc.length <= 160
                      ? "text-green-400"
                      : metaDesc.length > 0
                        ? "text-yellow-400"
                        : "text-slate-500"
                  )}
                >
                  <span className="material-symbols-outlined text-xs">
                    {metaDesc.length >= 120 && metaDesc.length <= 160
                      ? "check_circle"
                      : "info"}
                  </span>
                  Description: {metaDesc.length} car.
                </span>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex justify-end gap-4 border-t border-primary/10 pt-8">
              <Link
                href="/dashboard/services"
                className="px-6 py-2.5 rounded-lg text-sm font-bold border border-primary/20 hover:bg-primary/5 transition-colors"
              >
                Annuler
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className={cn(
                  "px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2",
                  isDirty && !isSaving
                    ? "bg-primary text-white hover:bg-primary/90 cursor-pointer"
                    : "bg-primary/40 text-white/60 cursor-not-allowed"
                )}
              >
                {isSaving && (
                  <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        )}

        {/* Empty state — no service selected */}
        {!isLoading && !selectedServiceId && (
          <div className="bg-primary/5 rounded-xl border border-primary/10 p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">
              search_check
            </span>
            <h3 className="text-lg font-bold mb-2">Selectionnez un service</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Choisissez un service dans le selecteur ci-dessus pour visualiser et ameliorer son
              score SEO.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
