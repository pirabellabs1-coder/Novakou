"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import { safeFetch } from "@/lib/safe-fetch";
import {
  Tag,
  Plus,
  ShoppingCart,
  Wallet,
  X,
  Trash2,
} from "lucide-react";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StKpiCompact,
  ST,
} from "@/components/stitch";
import { StSwitch, StErreur, StVide, StRetourMarketing } from "@/components/formations/dashboard/MarketingKit";

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

  const { data: response, isLoading, isError, refetch } = useQuery<{ data: DiscountCode[] }>({
    queryKey: ["vendeur-codes-promo"],
    queryFn: async () => {
      const { data, error } = await safeFetch<{ data: DiscountCode[] }>("/api/formations/vendeur/marketing/codes-promo");
      if (error || !data) throw new Error(error ?? "Chargement impossible");
      return data;
    },
    staleTime: 30_000,
  });

  const codes = response?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (body: typeof form) => {
      const { error } = await safeFetch("/api/formations/vendeur/marketing/codes-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-codes-promo"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Code promo créé.");
      setShowForm(false);
      setForm({ code: "", discountType: "PERCENTAGE", discountValue: "", scope: "ALL", maxUses: "", expiresAt: "" });
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await safeFetch(`/api/formations/vendeur/marketing/codes-promo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-codes-promo"] }),
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await safeFetch(`/api/formations/vendeur/marketing/codes-promo/${id}`, { method: "DELETE" });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-codes-promo"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Code supprimé.");
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  const totalRevenue = codes.reduce((s, c) => s + c.revenue, 0);
  const activeCodes = codes.filter((c) => c.isActive && !isExpired(c.expiresAt)).length;
  const totalUsages = codes.reduce((s, c) => s + c.usedCount, 0);

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StRetourMarketing />

        <StPageHeader
          title="Codes promo"
          subtitle={`${codes.length} code${codes.length !== 1 ? "s" : ""} · ${activeCodes} actif${activeCodes !== 1 ? "s" : ""}`}
          actions={
            <StButton onClick={() => setShowForm(true)} icon={Plus}>
              Créer un code
            </StButton>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
          <StKpiCompact label="Codes actifs" value={activeCodes} icon={Tag} tone="green" />
          <StKpiCompact label="Utilisations totales" value={totalUsages} icon={ShoppingCart} tone="blue" />
          <StKpiCompact
            label="Revenus générés"
            value={isLoading ? "…" : `${formatFCFA(totalRevenue)} FCFA`}
            icon={Wallet}
            tone="amber"
          />
        </div>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-[18px] shadow-xl w-full max-w-md p-6" style={{ border: `1px solid ${ST.cardBorder}` }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[17px] font-extrabold" style={{ color: ST.text }}>Nouveau code promo</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-[10px] hover:bg-black/5">
                  <X size={20} style={{ color: ST.textSecondary }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="PROMO20"
                      className="flex-1 rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold tabular-nums focus:outline-none"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    />
                    <StButton variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}>
                      Générer
                    </StButton>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Type</label>
                    <select
                      value={form.discountType}
                      onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                      className="w-full rounded-[12px] px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none bg-white"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    >
                      <option value="PERCENTAGE">Pourcentage (%)</option>
                      <option value="FIXED_AMOUNT">Montant fixe (FCFA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                      {form.discountType === "PERCENTAGE" ? "Valeur (%)" : "Montant (FCFA)"}
                    </label>
                    <input
                      type="number"
                      value={form.discountValue}
                      onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                      placeholder={form.discountType === "PERCENTAGE" ? "20" : "5000"}
                      min="1"
                      max={form.discountType === "PERCENTAGE" ? "95" : undefined}
                      className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Utilisations max</label>
                    <input
                      type="number"
                      value={form.maxUses}
                      onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                      placeholder="Illimité"
                      min="1"
                      className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Date d&apos;expiration</label>
                    <input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                      style={{ color: ST.text, border: "1px solid #dde6e0" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <StButton variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
                  Annuler
                </StButton>
                <StButton
                  className="flex-1"
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.code || !form.discountValue || createMutation.isPending}
                >
                  {createMutation.isPending ? "Création…" : "Créer le code"}
                </StButton>
              </div>
            </div>
          </div>
        )}

        {/* Codes list */}
        {isError ? (
          <StErreur onRetry={() => refetch()} />
        ) : isLoading ? (
          <StCard noPadding>
            <div>
              {[0, 1, 2].map((i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 animate-pulse items-center" style={i ? { borderTop: `1px solid ${ST.divider}` } : undefined}>
                  <div className="h-4 rounded w-24" style={{ background: "#eef2ef" }} />
                  <div className="h-4 rounded w-12" style={{ background: "#eef2ef" }} />
                  <div className="h-4 rounded w-16" style={{ background: "#eef2ef" }} />
                  <div className="h-4 rounded w-20" style={{ background: "#eef2ef" }} />
                  <div className="h-4 rounded w-8" style={{ background: "#eef2ef" }} />
                </div>
              ))}
            </div>
          </StCard>
        ) : codes.length === 0 ? (
          <StVide
            icon={Tag}
            titre="Aucun code promo"
            message="Un code de lancement (« -20 % les 48 premières heures ») crée l'urgence qui débloque les premières ventes. Vous pourrez le désactiver à tout moment."
            action={<StButton onClick={() => setShowForm(true)} icon={Plus}>Créer un code</StButton>}
          />
        ) : (
          <StCard noPadding>
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5" style={{ borderBottom: `1px solid ${ST.divider}` }}>
              {["Code", "Réduction", "Utilisations", "Revenus", ""].map((h) => (
                <span key={h} className="text-[10.5px] font-extrabold uppercase tracking-[.06em]" style={{ color: ST.textSecondary }}>{h}</span>
              ))}
            </div>
            <div>
              {codes.map((code, idx) => {
                const expired = isExpired(code.expiresAt);
                const effective = code.isActive && !expired;
                return (
                  <div key={code.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center" style={idx ? { borderTop: `1px solid ${ST.divider}` } : undefined}>
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-[13px] font-extrabold tabular-nums px-2 py-0.5 rounded" style={{ color: ST.text, background: "#f1efe8" }}>{code.code}</code>
                          {expired && <StChip tone="rose">Expiré</StChip>}
                        </div>
                        <p className="text-[10.5px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>{timeAgo(code.createdAt)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>
                        {code.discountType === "PERCENTAGE"
                          ? `-${code.discountValue}%`
                          : `-${formatFCFA(code.discountValue)} FCFA`}
                      </p>
                      <p className="text-[10.5px] font-semibold" style={{ color: ST.textSecondary }}>{code.scope === "ALL" ? "Tous produits" : code.scope}</p>
                    </div>

                    <div>
                      <p className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>
                        {code.usedCount}{code.maxUses ? `/${code.maxUses}` : ""}
                      </p>
                      <p className="text-[10.5px] font-semibold" style={{ color: ST.textSecondary }}>utilisations</p>
                      {code.maxUses && (
                        <div className="mt-1 w-16 h-1 rounded-full overflow-hidden" style={{ background: ST.divider }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, (code.usedCount / code.maxUses) * 100)}%`, background: ST.gradientH }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[13.5px] font-extrabold" style={{ color: ST.green }}>{formatFCFA(code.revenue)}</p>
                      <p className="text-[10.5px] font-semibold" style={{ color: ST.textSecondary }}>FCFA générés</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StSwitch
                        checked={effective}
                        onChange={(v) => toggleMutation.mutate({ id: code.id, isActive: v })}
                        label={`${effective ? "Désactiver" : "Activer"} le code ${code.code}`}
                      />
                      <button
                        type="button"
                        aria-label={`Supprimer le code ${code.code}`}
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
                        className="p-1.5 rounded-[10px] hover:bg-[#fceef2] transition-colors"
                        style={{ color: ST.textSecondary }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </StCard>
        )}
      </main>
    </div>
  );
}
