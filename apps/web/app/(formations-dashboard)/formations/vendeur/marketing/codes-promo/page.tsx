"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";

type DiscountCode = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  scope: "ALL" | "FORMATIONS" | "PRODUCTS" | "SPECIFIC";
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  minOrderAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  revenue: number;
  totalDiscounted: number;
  createdAt: string;
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return "Hier";
  return `Il y a ${d} jours`;
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function CodesPromoPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    scope: "ALL",
    maxUses: "",
    expiresAt: "",
  });

  const { data: response, isLoading } = useQuery<{ data: DiscountCode[] }>({
    queryKey: ["vendeur-codes-promo"],
    queryFn: () => fetch("/api/formations/vendeur/marketing/codes-promo").then((r) => r.json()),
    staleTime: 30_000,
  });

  const codes = response?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (body: typeof form) =>
      fetch("/api/formations/vendeur/marketing/codes-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-codes-promo"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      setShowForm(false);
      setForm({ code: "", discountType: "PERCENTAGE", discountValue: "", scope: "ALL", maxUses: "", expiresAt: "" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/formations/vendeur/marketing/codes-promo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-codes-promo"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/formations/vendeur/marketing/codes-promo/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-codes-promo"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
    },
  });

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  const totalRevenue = codes.reduce((s, c) => s + c.revenue, 0);
  const activeCodes = codes.filter((c) => c.isActive && !isExpired(c.expiresAt)).length;

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
            <a href="/formations/vendeur/marketing" className="hover:text-[#006e2f] transition-colors">Marketing</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e] font-medium">Codes Promo</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Codes Promo</h1>
          <p className="text-sm text-[#5c647a] mt-1">{codes.length} code{codes.length !== 1 ? "s" : ""} · {activeCodes} actif{activeCodes !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Créer un code
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Codes actifs", value: activeCodes, icon: "local_offer", color: "text-[#006e2f]", bg: "bg-[#006e2f]/10" },
          { label: "Utilisations totales", value: codes.reduce((s, c) => s + c.usedCount, 0), icon: "shopping_cart", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Revenus générés", value: `${formatFCFA(totalRevenue)} FCFA`, icon: "payments", color: "text-amber-600", bg: "bg-amber-50" },
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

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">Nouveau code promo</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="material-symbols-outlined text-[20px] text-[#5c647a]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="PROMO20"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-[#5c647a]/60 focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10 tabular-nums"
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-[#5c647a] hover:bg-gray-50"
                  >
                    Générer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40 bg-white"
                  >
                    <option value="PERCENTAGE">Pourcentage (%)</option>
                    <option value="FIXED_AMOUNT">Montant fixe (FCFA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">
                    {form.discountType === "PERCENTAGE" ? "Valeur (%)" : "Montant (FCFA)"}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                    placeholder={form.discountType === "PERCENTAGE" ? "20" : "5000"}
                    min="1"
                    max={form.discountType === "PERCENTAGE" ? "100" : undefined}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Utilisations max</label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Illimité"
                    min="1"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Date d'expiration</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#5c647a] hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.code || !form.discountValue || createMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {createMutation.isPending ? "Création…" : "Créer le code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Codes list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100">
          {["Code", "Réduction", "Utilisations", "Revenus", ""].map((h) => (
            <span key={h} className="text-[11px] font-bold text-[#5c647a] uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 animate-pulse items-center">
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded w-12" />
                <div className="h-4 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-100 rounded w-20" />
                <div className="h-4 bg-gray-100 rounded w-8" />
              </div>
            ))}
          </div>
        ) : codes.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-[40px] text-gray-300 block mb-3">local_offer</span>
            <p className="font-semibold text-[#191c1e]">Aucun code promo</p>
            <p className="text-sm text-[#5c647a] mt-1">Créez votre premier code pour booster vos ventes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {codes.map((code) => {
              const expired = isExpired(code.expiresAt);
              const effective = code.isActive && !expired;
              return (
                <div key={code.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors items-center">
                  {/* Code */}
                  <div className="flex items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-bold text-[#191c1e] tabular-nums bg-gray-100 px-2 py-0.5 rounded">{code.code}</code>
                        {expired && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Expiré</span>}
                      </div>
                      <p className="text-[10px] text-[#5c647a] mt-0.5">{timeAgo(code.createdAt)}</p>
                    </div>
                  </div>

                  {/* Discount */}
                  <div>
                    <p className="text-sm font-bold text-[#191c1e]">
                      {code.discountType === "PERCENTAGE"
                        ? `-${code.discountValue}%`
                        : `-${formatFCFA(code.discountValue)} FCFA`}
                    </p>
                    <p className="text-[10px] text-[#5c647a]">{code.scope === "ALL" ? "Tous produits" : code.scope}</p>
                  </div>

                  {/* Usage */}
                  <div>
                    <p className="text-sm font-semibold text-[#191c1e]">
                      {code.usedCount}{code.maxUses ? `/${code.maxUses}` : ""}
                    </p>
                    <p className="text-[10px] text-[#5c647a]">utilisations</p>
                    {code.maxUses && (
                      <div className="mt-1 w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#006e2f]"
                          style={{ width: `${Math.min(100, (code.usedCount / code.maxUses) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Revenue */}
                  <div>
                    <p className="text-sm font-bold text-[#006e2f]">{formatFCFA(code.revenue)}</p>
                    <p className="text-[10px] text-[#5c647a]">FCFA générés</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMutation.mutate({ id: code.id, isActive: !code.isActive })}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${effective ? "bg-[#006e2f]" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${effective ? "left-5" : "left-0.5"}`} />
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirmAction({
                          title: "Supprimer ce code promo ?",
                          message: "Cette action est irréversible.",
                          confirmLabel: "Supprimer",
                          confirmVariant: "danger",
                          icon: "delete",
                        });
                        if (ok) deleteMutation.mutate(code.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
