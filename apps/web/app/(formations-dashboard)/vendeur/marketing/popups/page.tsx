"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  type LucideIcon,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Tag,
  Mail,
  Megaphone,
  TrendingUp,
  Timer,
  MousePointerClick,
  Eye,
  GitBranch,
} from "lucide-react";

type Popup = {
  id: string;
  name: string;
  popupType: "DISCOUNT" | "EMAIL_CAPTURE" | "ANNOUNCEMENT" | "UPSELL" | "COUNTDOWN";
  trigger: "EXIT_INTENT" | "TIME_DELAY" | "SCROLL_PERCENT" | "PAGE_VIEW_COUNT" | "MANUAL";
  delaySeconds: number | null;
  scrollPercent: number | null;
  headlineFr: string | null;
  bodyFr: string | null;
  ctaTextFr: string | null;
  imageBanner: string | null;
  isActive: boolean;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  createdAt: string;
};

const POPUP_TYPES: Record<string, { label: string; icon: LucideIcon; bg: string; color: string; desc: string }> = {
  DISCOUNT: { label: "Code promo", icon: Tag, bg: "bg-amber-50", color: "text-amber-600", desc: "Offre une réduction au visiteur" },
  EMAIL_CAPTURE: { label: "Capture email", icon: Mail, bg: "bg-blue-50", color: "text-blue-600", desc: "Collecte les emails visiteurs" },
  ANNOUNCEMENT: { label: "Annonce", icon: Megaphone, bg: "bg-green-50", color: "text-green-600", desc: "Informe d'une nouveauté" },
  UPSELL: { label: "Upsell", icon: TrendingUp, bg: "bg-[#e6f5eb]", color: "text-[#006e2f]", desc: "Propose une offre complémentaire" },
  COUNTDOWN: { label: "Compte à rebours", icon: Timer, bg: "bg-red-50", color: "text-red-500", desc: "Crée l'urgence avec un timer" },
};

const TRIGGERS: Record<string, { label: string; icon: string }> = {
  EXIT_INTENT: { label: "Intention de sortie", icon: "exit_to_app" },
  TIME_DELAY: { label: "Délai en secondes", icon: "schedule" },
  SCROLL_PERCENT: { label: "Défilement page (%)", icon: "swap_vert" },
  PAGE_VIEW_COUNT: { label: "Nombre de pages vues", icon: "pageview" },
  MANUAL: { label: "Manuel (API)", icon: "code" },
};

export default function PopupsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    popupType: "DISCOUNT",
    trigger: "EXIT_INTENT",
    delaySeconds: "",
    scrollPercent: "",
    headlineFr: "",
    bodyFr: "",
    ctaTextFr: "Obtenir l'offre",
  });

  const { data: response, isLoading } = useQuery<{ data: Popup[] }>({
    queryKey: ["vendeur-popups"],
    queryFn: () => fetch("/api/formations/vendeur/marketing/popups").then((r) => r.json()),
    staleTime: 30_000,
  });

  const popups = response?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (body: typeof form) =>
      fetch("/api/formations/vendeur/marketing/popups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-popups"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      setShowForm(false);
      setForm({ name: "", popupType: "DISCOUNT", trigger: "EXIT_INTENT", delaySeconds: "", scrollPercent: "", headlineFr: "", bodyFr: "", ctaTextFr: "Obtenir l'offre" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/formations/vendeur/marketing/popups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-popups"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/formations/vendeur/marketing/popups/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-popups"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
    },
  });

  const totalImpressions = popups.reduce((s, p) => s + p.totalImpressions, 0);
  const totalConversions = popups.reduce((s, p) => s + p.totalConversions, 0);
  const avgCR = totalImpressions > 0 ? Math.round((totalConversions / totalImpressions) * 100) : 0;

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
            <a href="/vendeur/marketing" className="hover:text-[#006e2f] transition-colors">Marketing</a>
            <ChevronRight size={14} />
            <span className="text-[#191c1e] font-medium">Popups Intelligents</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Popups Intelligents</h1>
          <p className="text-sm text-[#5c647a] mt-1">Convertissez vos visiteurs au moment le plus opportun</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <Plus size={18} />
          Créer un popup
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {([
          { label: "Popups actifs", value: popups.filter((p) => p.isActive).length, icon: MousePointerClick, color: "text-[#22c55e]", bg: "bg-[#e6f5eb]" },
          { label: "Impressions totales", value: totalImpressions.toLocaleString("fr-FR"), icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Taux de conversion", value: `${avgCR}%`, icon: GitBranch, color: "text-[#006e2f]", bg: "bg-[#006e2f]/10" },
        ] as { label: string; value: number | string; icon: LucideIcon; color: string; bg: string }[]).map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${kpi.bg}`}>
              <kpi.icon size={20} className={kpi.color} />
            </div>
            <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wide">{kpi.label}</p>
            <p className="text-lg font-extrabold text-[#191c1e] mt-0.5">{isLoading ? "…" : kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">Nouveau popup</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-[#5c647a]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Nom interne *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Popup -20% page formation"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-2 uppercase tracking-wide">Type de popup *</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(POPUP_TYPES).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm((f) => ({ ...f, popupType: key }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                        form.popupType === key ? "border-[#006e2f] bg-[#006e2f]/5" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                        <cfg.icon size={16} className={cfg.color} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#191c1e] leading-tight">{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Déclencheur *</label>
                <select
                  value={form.trigger}
                  onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40 bg-white"
                >
                  {Object.entries(TRIGGERS).map(([key, t]) => (
                    <option key={key} value={key}>{t.label}</option>
                  ))}
                </select>
                {form.trigger === "TIME_DELAY" && (
                  <input
                    type="number"
                    value={form.delaySeconds}
                    onChange={(e) => setForm((f) => ({ ...f, delaySeconds: e.target.value }))}
                    placeholder="Délai en secondes (ex: 30)"
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40"
                  />
                )}
                {form.trigger === "SCROLL_PERCENT" && (
                  <input
                    type="number"
                    value={form.scrollPercent}
                    onChange={(e) => setForm((f) => ({ ...f, scrollPercent: e.target.value }))}
                    placeholder="Pourcentage défilement (ex: 50)"
                    min="1" max="100"
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Titre du popup</label>
                <input
                  type="text"
                  value={form.headlineFr}
                  onChange={(e) => setForm((f) => ({ ...f, headlineFr: e.target.value }))}
                  placeholder="Attendez ! Voici une offre exclusive 🎁"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Message</label>
                <textarea
                  value={form.bodyFr}
                  onChange={(e) => setForm((f) => ({ ...f, bodyFr: e.target.value }))}
                  placeholder="Profitez de 20% de réduction sur votre première formation. Offre limitée !"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Texte du bouton</label>
                <input
                  type="text"
                  value={form.ctaTextFr}
                  onChange={(e) => setForm((f) => ({ ...f, ctaTextFr: e.target.value }))}
                  placeholder="Obtenir l'offre"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#5c647a] hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || createMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {createMutation.isPending ? "Création…" : "Créer le popup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popups list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-32 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="h-8 bg-gray-100 rounded" />
                <div className="h-8 bg-gray-100 rounded" />
                <div className="h-8 bg-gray-100 rounded" />
              </div>
            </div>
          ))
        ) : popups.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
            <MousePointerClick size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-[#191c1e]">Aucun popup créé</p>
            <p className="text-sm text-[#5c647a] mt-1">Créez votre premier popup pour capturer plus de ventes</p>
          </div>
        ) : (
          popups.map((popup) => {
            const tc = POPUP_TYPES[popup.popupType];
            const trig = TRIGGERS[popup.trigger];
            const cr = popup.totalImpressions > 0 ? Math.round((popup.totalConversions / popup.totalImpressions) * 100) : 0;
            return (
              <div key={popup.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tc.bg}`}>
                      <tc.icon size={20} className={tc.color} />
                    </div>
                    <div>
                      <p className="font-bold text-[#191c1e] text-sm">{popup.name}</p>
                      <p className="text-[10px] text-[#5c647a]">{tc.label} · {trig.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMutation.mutate({ id: popup.id, isActive: !popup.isActive })}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${popup.isActive ? "bg-[#006e2f]" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${popup.isActive ? "left-5" : "left-0.5"}`} />
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirmAction({
                          title: "Supprimer ce popup ?",
                          message: "Cette action est irréversible.",
                          confirmLabel: "Supprimer",
                          confirmVariant: "danger",
                          icon: "delete",
                        });
                        if (ok) deleteMutation.mutate(popup.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {popup.headlineFr && (
                  <p className="text-xs text-[#5c647a] italic mb-3 line-clamp-1">"{popup.headlineFr}"</p>
                )}

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                  {[
                    { label: "Vues", value: popup.totalImpressions.toLocaleString("fr-FR") },
                    { label: "Clics", value: popup.totalClicks.toLocaleString("fr-FR") },
                    { label: "Conv.", value: `${cr}%` },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-sm font-bold text-[#191c1e]">{s.value}</p>
                      <p className="text-[10px] text-[#5c647a]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
