"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useInstructorPixels, instructorKeys } from "@/lib/formations/hooks";
import { Save, Trash2, AlertCircle, CheckCircle, Facebook, BarChart2, Music } from "lucide-react";

interface Pixel {
  id: string;
  type: "FACEBOOK" | "GOOGLE" | "TIKTOK";
  pixelId: string;
  isActive: boolean;
}

const PIXEL_CONFIG = [
  {
    type: "FACEBOOK" as const,
    label: "Facebook Pixel",
    icon: <Facebook className="w-5 h-5 text-blue-600" />,
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    placeholder: "Ex: 123456789012345",
    help: "ID du pixel Facebook (15-16 chiffres). Se trouve dans le Gestionnaire d'événements Facebook.",
  },
  {
    type: "GOOGLE" as const,
    label: "Google Ads / GA4",
    icon: <BarChart2 className="w-5 h-5 text-sky-500" />,
    iconBg: "bg-sky-50 dark:bg-sky-900/20",
    placeholder: "Ex: AW-123456789 ou G-XXXXXXXXXX",
    help: "ID de conversion Google Ads (AW-...) ou ID GA4 (G-...). Se trouve dans Google Ads ou Google Analytics.",
  },
  {
    type: "TIKTOK" as const,
    label: "TikTok Pixel",
    icon: <Music className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-100" />,
    iconBg: "bg-slate-100 dark:bg-slate-800 dark:bg-slate-700",
    placeholder: "Ex: CXXXXXXXXXXXXXXXX",
    help: "ID du pixel TikTok. Se trouve dans le TikTok Ads Manager sous Événements.",
  },
];

export default function PixelConfigPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Local state for editing
  const [editValues, setEditValues] = useState<Record<string, { pixelId: string; isActive: boolean }>>({});

  const { data: pixelsData, isLoading: loading } = useInstructorPixels();
  const pixels: Pixel[] = (pixelsData as { pixels?: Pixel[] } | null)?.pixels ?? [];

  useEffect(() => {
    if (pixels.length > 0) {
      const edits: Record<string, { pixelId: string; isActive: boolean }> = {};
      for (const p of pixels) {
        if (!editValues[p.type]) {
          edits[p.type] = { pixelId: p.pixelId, isActive: p.isActive };
        }
      }
      if (Object.keys(edits).length > 0) {
        setEditValues((prev) => ({ ...edits, ...prev }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixels.length]);

  async function handleSave(type: "FACEBOOK" | "GOOGLE" | "TIKTOK") {
    const val = editValues[type];
    if (!val?.pixelId?.trim()) return;

    setSaving(type);
    setMessage(null);

    try {
      const res = await fetch("/api/instructeur/marketing/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, pixelId: val.pixelId.trim(), isActive: val.isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur" });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: instructorKeys.pixels() });
      setMessage({ type: "success", text: `Pixel ${type} enregistré` });
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(type: "FACEBOOK" | "GOOGLE" | "TIKTOK") {
    const pixel = pixels.find((p) => p.type === type);
    if (!pixel || !confirm(`Supprimer le pixel ${type} ?`)) return;

    try {
      await fetch(`/api/instructeur/marketing/pixels/${pixel.id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: instructorKeys.pixels() });
      const newEdits = { ...editValues };
      delete newEdits[type];
      setEditValues(newEdits);
      setMessage({ type: "success", text: `Pixel ${type} supprimé` });
    } catch {
      setMessage({ type: "error", text: "Erreur" });
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/formations/instructeur/marketing"
          className="text-sm text-slate-500 hover:text-primary transition-colors"
        >
          Marketing
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-2">Configuration des pixels publicitaires</h1>
      <p className="text-sm text-slate-500 mb-6">
        Configurez vos pixels pour suivre les conversions sur vos formations et produits.
        Les scripts seront automatiquement injectés sur les pages de vos formations.
      </p>

      {message && (
        <div className={`flex items-center gap-2 text-sm rounded-xl p-3 mb-4 ${message.type === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {PIXEL_CONFIG.map((config) => {
          const current = editValues[config.type] || { pixelId: "", isActive: true };
          const existsInDb = pixels.some((p) => p.type === config.type);

          return (
            <div
              key={config.type}
              className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
                    {config.icon}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white dark:text-slate-100">{config.label}</h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-slate-500">{current.isActive ? "Actif" : "Inactif"}</span>
                  <input
                    type="checkbox"
                    checked={current.isActive}
                    onChange={(e) => setEditValues({ ...editValues, [config.type]: { ...current, isActive: e.target.checked } })}
                    className="w-4 h-4 rounded text-primary"
                  />
                </label>
              </div>

              <input
                type="text"
                value={current.pixelId}
                onChange={(e) => setEditValues({ ...editValues, [config.type]: { ...current, pixelId: e.target.value } })}
                placeholder={config.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">{config.help}</p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleSave(config.type)}
                  disabled={!current.pixelId?.trim() || saving === config.type}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  {saving === config.type ? "Enregistrement..." : "Enregistrer"}
                </button>
                {existsInDb && (
                  <button
                    onClick={() => handleDelete(config.type)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-3 h-3" />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
