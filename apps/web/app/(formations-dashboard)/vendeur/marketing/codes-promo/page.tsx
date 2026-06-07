"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  Tag,
  Plus,
  ShoppingCart,
  Wallet,
  X,
  Trash2,
} from "lucide-react";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";

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
  const totalUsages = codes.reduce((s, c) => s + c.usedCount, 0);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
      <KazaHero
        badge="Pro"
        badgeColor="orange"
        title="Codes promo"
        subtitle={`${codes.length} code${codes.length !== 1 ? "s" : ""} · ${activeCodes} actif${activeCodes !== 1 ? "s" : ""}`}
        icon={Tag}
        actions={
          <KazaButton variant="primary" onClick={() => setShowForm(true)} icon={Plus}>
            Créer un code
          </KazaButton>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KazaKpiCard label="Codes actifs" value={activeCodes} icon={Tag} iconColor="emerald" />
        <KazaKpiCard label="Utilisations totales" value={totalUsages} icon={ShoppingCart} iconColor="sky" />
        <KazaKpiCard
          label="Revenus générés"
          value={isLoading ? "…" : `${formatFCFA(totalRevenue)} FCFA`}
          icon={Wallet}
          iconColor="orange"
        />
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0b2540]">Nouveau code promo</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="PROMO20"
                    className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 tabular-nums"
                  />
                  <KazaButton variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}>
                    Générer
                  </KazaButton>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="PERCENTAGE">Pourcentage (%)</option>
                    <option value="FIXED_AMOUNT">Montant fixe (FCFA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    {form.discountType === "PERCENTAGE" ? "Valeur (%)" : "Montant (FCFA)"}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                    placeholder={form.discountType === "PERCENTAGE" ? "20" : "5000"}
                    min="1"
                    max={form.discountType === "PERCENTAGE" ? "100" : undefined}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Utilisations max</label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Illimité"
                    min="1"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Date d&apos;expiration</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <KazaButton variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>
                Annuler
              </KazaButton>
              <KazaButton
                variant="primary"
                className="flex-1"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.code || !form.discountValue || createMutation.isPending}
              >
                {createMutation.isPending ? "Création…" : "Créer le code"}
              </KazaButton>
            </div>
          </div>
        </div>
      )}

      {/* Codes list */}
      {isLoading ? (
        <KazaCard noPadding>
          <div className="divide-y divide-slate-50">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 animate-pulse items-center">
                <div className="h-4 bg-slate-100 rounded w-24" />
                <div className="h-4 bg-slate-100 rounded w-12" />
                <div className="h-4 bg-slate-100 rounded w-16" />
                <div className="h-4 bg-slate-100 rounded w-20" />
                <div className="h-4 bg-slate-100 rounded w-8" />
              </div>
            ))}
          </div>
        </KazaCard>
      ) : codes.length === 0 ? (
        <KazaEmpty
          icon={Tag}
          title="Aucun code promo"
          description="Créez votre premier code pour booster vos ventes : -20%, -5000 FCFA ou code de lancement limité."
          action={{ label: "Créer un code", onClick: () => setShowForm(true) }}
        />
      ) : (
        <KazaCard noPadding>
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 bg-slate-50 border-b border-slate-100">
            {["Code", "Réduction", "Utilisations", "Revenus", ""].map((h) => (
              <span key={h} className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-slate-50">
            {codes.map((code) => {
              const expired = isExpired(code.expiresAt);
              const effective = code.isActive && !expired;
              return (
                <div key={code.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors items-center">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-bold text-slate-900 tabular-nums bg-slate-100 px-2 py-0.5 rounded">{code.code}</code>
                        {expired && <KazaBadge variant="rose">Expiré</KazaBadge>}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(code.createdAt)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {code.discountType === "PERCENTAGE"
                        ? `-${code.discountValue}%`
                        : `-${formatFCFA(code.discountValue)} FCFA`}
                    </p>
                    <p className="text-[10px] text-slate-500">{code.scope === "ALL" ? "Tous produits" : code.scope}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {code.usedCount}{code.maxUses ? `/${code.maxUses}` : ""}
                    </p>
                    <p className="text-[10px] text-slate-500">utilisations</p>
                    {code.maxUses && (
                      <div className="mt-1 w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, (code.usedCount / code.maxUses) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-emerald-600">{formatFCFA(code.revenue)}</p>
                    <p className="text-[10px] text-slate-500">FCFA générés</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMutation.mutate({ id: code.id, isActive: !code.isActive })}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${effective ? "bg-emerald-500" : "bg-slate-200"}`}
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
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </KazaCard>
      )}
    </div>
  );
}
