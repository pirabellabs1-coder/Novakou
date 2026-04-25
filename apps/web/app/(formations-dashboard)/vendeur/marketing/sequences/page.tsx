"use client";
import { useToastStore } from "@/store/toast";
import { safeFetch } from "@/lib/safe-fetch";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type EmailSequence = {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  isActive: boolean;
  totalEnrolled: number;
  totalCompleted: number;
  createdAt: string;
  _count: { steps: number; enrollments: number };
};

const TRIGGERS: Record<string, { label: string; icon: string; color: string }> = {
  PURCHASE: { label: "Après achat", icon: "shopping_cart", color: "text-[#006e2f]" },
  ENROLLMENT: { label: "Inscription formation", icon: "school", color: "text-blue-600" },
  ABANDONED_CART: { label: "Panier abandonné", icon: "remove_shopping_cart", color: "text-orange-500" },
  USER_INACTIVITY: { label: "Inactivité utilisateur", icon: "schedule", color: "text-amber-600" },
  COURSE_COMPLETION: { label: "Cours terminé", icon: "verified", color: "text-purple-600" },
  SIGNUP: { label: "Nouvelle inscription liste", icon: "person_add", color: "text-indigo-600" },
  MANUAL: { label: "Déclenchement manuel", icon: "touch_app", color: "text-gray-500" },
  TAG_ADDED: { label: "Tag ajouté", icon: "label", color: "text-pink-500" },
};

type AutoData = { workflows: unknown[]; sequences: EmailSequence[] };

export default function SequencesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", trigger: "PURCHASE" });

  const { data: response, isLoading } = useQuery<{ data: AutoData } | null>({
    queryKey: ["vendeur-automatisations"],
    queryFn: async () => {
      const { data, error } = await safeFetch<{ data: AutoData }>("/api/formations/vendeur/automatisations");
      if (error) useToastStore.getState().addToast("error", error);
      return data;
    },
    staleTime: 30_000,
  });

  const sequences = response?.data?.sequences ?? [];

  const createMutation = useMutation({
    mutationFn: async (body: typeof form) => {
      const { data, error } = await safeFetch<{ data: EmailSequence; error?: string }>(
        "/api/formations/vendeur/marketing/sequences",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      return { data, error };
    },
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-automatisations"] });
      setShowForm(false);
      setForm({ name: "", description: "", trigger: "PURCHASE" });
    },
  });

  const activeCount = sequences.filter((s) => s.isActive).length;
  const totalEnrolled = sequences.reduce((s, seq) => s + seq.totalEnrolled, 0);
  const totalCompleted = sequences.reduce((s, seq) => s + seq.totalCompleted, 0);

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
            <a href="/vendeur/marketing" className="hover:text-[#006e2f] transition-colors">Marketing</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e] font-medium">Séquences Email</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Séquences Email</h1>
          <p className="text-sm text-[#5c647a] mt-1">Automatisez vos emails pour accompagner chaque apprenant</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Créer une séquence
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Séquences actives", value: activeCount, icon: "mark_email_read", color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Abonnés totaux", value: totalEnrolled.toLocaleString("fr-FR"), icon: "group", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Séquences complétées", value: totalCompleted.toLocaleString("fr-FR"), icon: "verified", color: "text-[#006e2f]", bg: "bg-[#006e2f]/10" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${kpi.bg}`}>
              <span className={`material-symbols-outlined text-[20px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{kpi.icon}</span>
            </div>
            <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wide">{kpi.label}</p>
            <p className="text-lg font-extrabold text-[#191c1e] mt-0.5">{isLoading ? "…" : kpi.value}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-bold text-orange-800 mb-3">Comment fonctionnent les séquences ?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: "1", label: "Déclencheur", desc: "Achat, inscription, inactivité…", icon: "bolt" },
            { step: "2", label: "Délai", desc: "Ex : attendre 1 jour", icon: "schedule" },
            { step: "3", label: "Email envoyé", desc: "Message personnalisé", icon: "mail" },
            { step: "4", label: "Répéter", desc: "Autant d'étapes que voulu", icon: "autorenew" },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-xs font-bold text-orange-900">{s.label}</p>
                <p className="text-[10px] text-orange-700">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sequences list */}
      <div className="space-y-3">
        {isLoading ? (
          [0, 1].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1"><div className="h-4 bg-gray-100 rounded w-40 mb-1" /><div className="h-3 bg-gray-100 rounded w-24" /></div>
              </div>
            </div>
          ))
        ) : sequences.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[28px] text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
            </div>
            <p className="font-semibold text-[#191c1e]">Aucune séquence email</p>
            <p className="text-sm text-[#5c647a] mt-1 mb-4">Créez votre première séquence automatique</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              Créer une séquence
            </button>
          </div>
        ) : (
          sequences.map((seq) => {
            const trig = TRIGGERS[seq.trigger] ?? { label: seq.trigger, icon: "bolt", color: "text-gray-500" };
            return (
              <div key={seq.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50`}>
                      <span className={`material-symbols-outlined text-[20px] ${trig.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{trig.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#191c1e] text-sm truncate">{seq.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#5c647a]">{trig.label}</span>
                        <span className="text-[10px] text-[#5c647a]">·</span>
                        <span className="text-[10px] text-[#5c647a]">{seq._count.steps} étape{seq._count.steps !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${seq.isActive ? "bg-[#006e2f]/10 text-[#006e2f]" : "bg-gray-100 text-[#5c647a]"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${seq.isActive ? "bg-[#006e2f]" : "bg-gray-300"}`} />
                      {seq.isActive ? "Active" : "Inactive"}
                    </span>
                    <a
                      href={`/vendeur/marketing/sequences/${seq.id}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-[#5c647a] hover:text-[#191c1e] transition-colors"
                      title="Éditer la séquence"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-gray-50">
                  {[
                    { label: "Abonnés", value: seq.totalEnrolled },
                    { label: "Complétées", value: seq.totalCompleted },
                    { label: "Taux", value: seq.totalEnrolled > 0 ? `${Math.round((seq.totalCompleted / seq.totalEnrolled) * 100)}%` : "0%" },
                  ].map((s) => (
                    <div key={s.label}>
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

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">Nouvelle séquence</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="material-symbols-outlined text-[20px] text-[#5c647a]">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Nom de la séquence *</label>
                <input
                  type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Bienvenue après achat React"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Déclencheur *</label>
                <select
                  value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40 bg-white"
                >
                  {Object.entries(TRIGGERS).map(([key, t]) => (
                    <option key={key} value={key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez l'objectif de cette séquence"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 resize-none"
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
                {createMutation.isPending ? "Création…" : "Créer la séquence"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
