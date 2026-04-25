"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type AffiliateProgram = {
  id: string;
  name: string;
  description: string | null;
  commissionPct: number;
  cookieDays: number;
  isActive: boolean;
  minPayoutAmount: number;
  autoApprove: boolean;
  applyToAll: boolean;
  affiliates: {
    id: string;
    affiliateCode: string;
    status: string;
    totalClicks: number;
    totalConversions: number;
    totalEarned: number;
    pendingEarnings: number;
    user: { name: string | null; email: string };
  }[];
  createdAt: string;
};

type AffiliateData = {
  programs: AffiliateProgram[];
  stats: {
    totalAffiliates: number;
    activeAffiliates: number;
    totalClicks: number;
    totalConversions: number;
    totalEarned: number;
    pendingEarnings: number;
  };
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

const GRADIENTS = ["from-violet-400 to-purple-600","from-blue-400 to-sky-600","from-pink-400 to-rose-500","from-amber-400 to-orange-500","from-teal-400 to-emerald-600"];

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: "bg-[#006e2f]/10", text: "text-[#006e2f]", label: "Actif" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", label: "En attente" },
  SUSPENDED: { bg: "bg-red-50", text: "text-red-600", label: "Suspendu" },
  BANNED: { bg: "bg-gray-100", text: "text-gray-500", label: "Banni" },
};

export default function AffiliationPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "Programme Affiliation",
    description: "",
    commissionPct: "20",
    cookieDays: "30",
    minPayoutAmount: "20",
    autoApprove: true,
  });

  const { data: response, isLoading } = useQuery<{ data: AffiliateData }>({
    queryKey: ["vendeur-affiliation"],
    queryFn: () => fetch("/api/formations/vendeur/marketing/affiliation").then((r) => r.json()),
    staleTime: 30_000,
  });

  const d = response?.data;
  const programs = d?.programs ?? [];
  const stats = d?.stats;
  const mainProgram = programs[0] ?? null;

  const createMutation = useMutation({
    mutationFn: (body: typeof form) =>
      fetch("/api/formations/vendeur/marketing/affiliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-affiliation"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      setShowCreate(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/formations/vendeur/marketing/affiliation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-affiliation"] }),
  });

  function copyAffiliateLink(code: string) {
    const url = `${window.location.origin}/ref/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
            <a href="/vendeur/marketing" className="hover:text-[#006e2f] transition-colors">Marketing</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e] font-medium">Programme Affiliation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Programme d'Affiliation</h1>
          <p className="text-sm text-[#5c647a] mt-1">Laissez vos affiliés promouvoir vos formations et gagnez ensemble</p>
        </div>
        {!mainProgram && !isLoading && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Créer mon programme
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Affiliés actifs", value: stats?.activeAffiliates ?? 0, icon: "group_add", color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Clics générés", value: (stats?.totalClicks ?? 0).toLocaleString("fr-FR"), icon: "ads_click", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Conversions", value: stats?.totalConversions ?? 0, icon: "conversion_path", color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Revenus affiliation", value: `${formatFCFA(stats?.totalEarned ?? 0)} FCFA`, icon: "payments", color: "text-[#006e2f]", bg: "bg-[#006e2f]/10" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${kpi.bg}`}>
              <span className={`material-symbols-outlined text-[20px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{kpi.icon}</span>
            </div>
            <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wide">{kpi.label}</p>
            <p className="text-base font-extrabold text-[#191c1e] mt-0.5">{isLoading ? "…" : kpi.value}</p>
          </div>
        ))}
      </div>

      {/* No program */}
      {!isLoading && !mainProgram && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>diversity_3</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">Lancez votre programme d'affiliation</h2>
          <p className="text-sm text-[#5c647a] max-w-md mx-auto mb-6">
            Vos apprenants satisfaits sont vos meilleurs ambassadeurs. Offrez-leur une commission sur chaque vente générée et regardez votre audience grandir.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Créer mon programme
          </button>
        </div>
      )}

      {/* Program settings */}
      {mainProgram && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Config card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#191c1e] text-sm">Mon programme</h3>
              <button
                onClick={() => toggleMutation.mutate({ id: mainProgram.id, isActive: !mainProgram.isActive })}
                className={`relative w-10 h-5 rounded-full transition-colors ${mainProgram.isActive ? "bg-[#006e2f]" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${mainProgram.isActive ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Commission", value: `${mainProgram.commissionPct}% par vente`, icon: "percent" },
                { label: "Cookie tracking", value: `${mainProgram.cookieDays} jours`, icon: "cookie" },
                { label: "Seuil retrait", value: `${formatFCFA(mainProgram.minPayoutAmount)} FCFA`, icon: "account_balance_wallet" },
                { label: "Approbation", value: mainProgram.autoApprove ? "Automatique" : "Manuelle", icon: "how_to_reg" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#5c647a]">{item.icon}</span>
                    <span className="text-xs text-[#5c647a]">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-[#191c1e]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending earnings */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#006e2f]/5 to-emerald-50 border border-[#006e2f]/10 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-[#5c647a] uppercase tracking-wide mb-1">Commissions en attente</p>
              <p className="text-3xl font-extrabold text-[#006e2f]">{formatFCFA(stats?.pendingEarnings ?? 0)} <span className="text-lg">FCFA</span></p>
              <p className="text-xs text-[#5c647a] mt-1">≈ {Math.round((stats?.pendingEarnings ?? 0) / 655.957)} € · Versement à 20 affiliés validés</p>
            </div>
            <div className="flex gap-3 mt-4">
              <div className="flex-1 bg-white rounded-xl p-3 text-center border border-[#006e2f]/10">
                <p className="text-lg font-extrabold text-[#191c1e]">{stats?.totalAffiliates ?? 0}</p>
                <p className="text-[10px] text-[#5c647a]">Total affiliés</p>
              </div>
              <div className="flex-1 bg-white rounded-xl p-3 text-center border border-[#006e2f]/10">
                <p className="text-lg font-extrabold text-[#006e2f]">{stats?.activeAffiliates ?? 0}</p>
                <p className="text-[10px] text-[#5c647a]">Actifs</p>
              </div>
              <div className="flex-1 bg-white rounded-xl p-3 text-center border border-[#006e2f]/10">
                <p className="text-lg font-extrabold text-[#191c1e]">
                  {stats?.totalClicks && stats.totalConversions
                    ? `${Math.round((stats.totalConversions / stats.totalClicks) * 100)}%`
                    : "0%"}
                </p>
                <p className="text-[10px] text-[#5c647a]">Taux conv.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Affiliates list */}
      {mainProgram && mainProgram.affiliates.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100">
            {["Affilié", "Clics", "Conv.", "Gagné", "Statut", "Lien"].map((h) => (
              <span key={h} className="text-[11px] font-bold text-[#5c647a] uppercase tracking-wide">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-gray-50">
            {mainProgram.affiliates.map((aff, idx) => {
              const st = STATUS_STYLES[aff.status] ?? STATUS_STYLES.PENDING;
              const initials = (aff.user.name ?? aff.user.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={aff.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#191c1e] truncate">{aff.user.name ?? "—"}</p>
                      <p className="text-[10px] text-[#5c647a] truncate">{aff.user.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#191c1e]">{aff.totalClicks.toLocaleString("fr-FR")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#191c1e]">{aff.totalConversions}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#006e2f]">{formatFCFA(aff.totalEarned)}</p>
                    <p className="text-[10px] text-[#5c647a]">FCFA</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => copyAffiliateLink(aff.affiliateCode)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        copiedCode === aff.affiliateCode ? "bg-[#006e2f]/10 text-[#006e2f]" : "bg-gray-100 text-[#5c647a] hover:bg-gray-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{copiedCode === aff.affiliateCode ? "check" : "content_copy"}</span>
                      {copiedCode === aff.affiliateCode ? "Copié" : aff.affiliateCode}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create program modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">Créer mon programme</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="material-symbols-outlined text-[20px] text-[#5c647a]">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Nom du programme</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Commission (%)</label>
                  <input
                    type="number" value={form.commissionPct} onChange={(e) => setForm((f) => ({ ...f, commissionPct: e.target.value }))}
                    min="1" max="80" placeholder="20"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Cookie (jours)</label>
                  <input
                    type="number" value={form.cookieDays} onChange={(e) => setForm((f) => ({ ...f, cookieDays: e.target.value }))}
                    min="1" max="365" placeholder="30"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Seuil de paiement (FCFA)</label>
                <input
                  type="number" value={form.minPayoutAmount} onChange={(e) => setForm((f) => ({ ...f, minPayoutAmount: e.target.value }))}
                  min="1000" placeholder="13120"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]/40"
                />
              </div>
              <div className="flex items-center justify-between py-2 bg-gray-50 rounded-xl px-4">
                <div>
                  <p className="text-sm font-semibold text-[#191c1e]">Approbation automatique</p>
                  <p className="text-[11px] text-[#5c647a]">Les nouveaux affiliés sont approuvés automatiquement</p>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, autoApprove: !f.autoApprove }))}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-4 ${form.autoApprove ? "bg-[#006e2f]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.autoApprove ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#5c647a] hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || createMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {createMutation.isPending ? "Création…" : "Créer le programme"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
