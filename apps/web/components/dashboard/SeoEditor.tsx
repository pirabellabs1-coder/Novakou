"use client";

import { useState, useEffect, useCallback } from "react";

interface SeoData {
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  slug: string;
  seoScore: number;
}

interface SeoCheck {
  label: string;
  status: "bon" | "ameliorable" | "manquant";
  detail: string;
  points: number;
  maxPoints: number;
}

interface SeoAnalysis {
  checks: SeoCheck[];
  recommendations: string[];
}

interface SeoEditorProps {
  serviceId: string;
  serviceTitle: string;
  onClose: () => void;
}

export function SeoEditor({ serviceId, serviceTitle, onClose }: SeoEditorProps) {
  const [seo, setSeo] = useState<SeoData | null>(null);
  const [analysis, setAnalysis] = useState<SeoAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Local form state
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const fetchSeo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/services/${serviceId}/seo`);
      if (!res.ok) throw new Error("Erreur chargement SEO");
      const data = await res.json();
      setSeo(data.seo);
      setAnalysis(data.analysis);
      setMetaTitle(data.seo?.metaTitle || "");
      setMetaDescription(data.seo?.metaDescription || "");
      setTags(data.seo?.tags || []);
    } catch {
      setError("Impossible de charger les donnees SEO");
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchSeo();
  }, [fetchSeo]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/services/${serviceId}/seo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metaTitle, metaDescription, tags }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la sauvegarde");
        return;
      }
      setSeo(data.seo);
      setAnalysis(data.analysis);
      setSuccess("SEO mis a jour avec succes");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur reseau");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagsInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagsInput("");
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // Live score estimate
  const liveScore = calculateLiveScore(metaTitle, metaDescription, tags);

  const statusIcon = (status: string) => {
    if (status === "bon") return { icon: "check_circle", color: "text-green-500" };
    if (status === "ameliorable") return { icon: "warning", color: "text-amber-500" };
    return { icon: "cancel", color: "text-red-500" };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold">Optimisation SEO</h2>
            <p className="text-sm text-slate-500 mt-0.5 truncate max-w-md">{serviceTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="3" />
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={liveScore >= 70 ? "#22c55e" : liveScore >= 40 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="3" strokeDasharray={`${liveScore}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{liveScore}</span>
                </div>
              </div>
              <div>
                <p className="font-semibold">Score SEO : {liveScore}/100</p>
                <p className="text-xs text-slate-500">
                  {liveScore >= 70 ? "Bon score" : liveScore >= 40 ? "Ameliorable" : "A optimiser"}
                </p>
              </div>
            </div>

            {/* Meta Title */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Meta titre <span className="text-slate-400 font-normal">({metaTitle.length}/70)</span>
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value.slice(0, 70))}
                placeholder="Titre optimise pour Google..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
              <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all ${metaTitle.length >= 30 && metaTitle.length <= 60 ? "bg-green-500" : metaTitle.length >= 10 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min((metaTitle.length / 70) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Ideal : 30-60 caracteres</p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Meta description <span className="text-slate-400 font-normal">({metaDescription.length}/160)</span>
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
                placeholder="Description qui apparaitra dans les resultats Google..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
              />
              <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all ${metaDescription.length >= 120 && metaDescription.length <= 160 ? "bg-green-500" : metaDescription.length >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min((metaDescription.length / 160) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Ideal : 120-160 caracteres</p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Tags <span className="text-slate-400 font-normal">({tags.length}/10)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Ajouter un tag..."
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  disabled={tags.length >= 10}
                />
                <button onClick={addTag} disabled={tags.length >= 10 || !tagsInput.trim()} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40">
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-500">
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Analysis from API */}
            {analysis && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Analyse detaillee</h3>
                <div className="space-y-2">
                  {analysis.checks.map((check, i) => {
                    const s = statusIcon(check.status);
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className={`material-symbols-outlined text-base ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                        <span className="font-medium flex-1">{check.label}</span>
                        <span className="text-slate-500 text-xs">{check.detail}</span>
                        <span className="text-xs font-bold">{check.points}/{check.maxPoints}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis && analysis.recommendations.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">Recommandations</h4>
                <ul className="space-y-1.5">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <span className="material-symbols-outlined text-sm mt-0.5">lightbulb</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Google Preview */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Apercu Google</h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900">
                <p className="text-blue-600 dark:text-blue-400 text-base font-medium truncate">
                  {metaTitle || serviceTitle} | Novakou
                </p>
                <p className="text-green-700 dark:text-green-500 text-xs mt-0.5">
                  novakou.com/services/{seo?.slug || "..."}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {metaDescription || "Aucune meta description definie..."}
                </p>
              </div>
            </div>

            {/* Error / Success */}
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            {success && <p className="text-sm text-green-500 font-medium">{success}</p>}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />}
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function calculateLiveScore(title: string, desc: string, tags: string[]): number {
  let score = 0;
  // Title: 20 pts
  if (title.length >= 30 && title.length <= 60) score += 20;
  else if (title.length >= 10) score += 10;
  // Description: 20 pts
  if (desc.length >= 120 && desc.length <= 160) score += 20;
  else if (desc.length >= 50) score += 10;
  // Tags: 15 pts
  if (tags.length >= 5) score += 15;
  else if (tags.length >= 3) score += 10;
  else if (tags.length > 0) score += 5;
  // Base points for having content: 45 pts (images, description, faq, packages from API analysis)
  score += 45; // Assume moderate base from existing content
  return Math.min(score, 100);
}
