"use client";

import { useState, useEffect } from "react";
import { useToastStore } from "@/store/toast";
import { useAdminStore, type AdminConfig } from "@/store/admin";
import { AdminPermissionGuard } from "@/components/admin/AdminPermissionGuard";
import { cn } from "@/lib/utils";

const ALL_CURRENCIES = [
  { code: "EUR", symbol: "\u20ac", label: "Euro" },
  { code: "FCFA", symbol: "FCFA", label: "Franc CFA" },
  { code: "USD", symbol: "$", label: "Dollar US" },
  { code: "GBP", symbol: "\u00a3", label: "Livre Sterling" },
  { code: "MAD", symbol: "MAD", label: "Dirham marocain" },
];

const ALL_PAYMENT_METHODS = [
  { id: "Carte bancaire", icon: "credit_card", desc: "Visa, Mastercard via Stripe" },
  { id: "SEPA", icon: "account_balance", desc: "Virement SEPA" },
  { id: "PayPal", icon: "account_balance_wallet", desc: "PayPal" },
  { id: "Orange Money", icon: "smartphone", desc: "Orange Money (CinetPay)" },
  { id: "Wave", icon: "smartphone", desc: "Wave (CinetPay)" },
  { id: "MTN Mobile Money", icon: "smartphone", desc: "MTN MoMo (CinetPay)" },
  { id: "Flutterwave", icon: "currency_exchange", desc: "Flutterwave" },
  { id: "USDC / USDT", icon: "token", desc: "Stablecoins crypto" },
];

const EMAILS = [
  { key: "welcome", label: "Email de bienvenue" },
  { key: "order_confirmed", label: "Confirmation commande" },
  { key: "order_delivered", label: "Commande livrée" },
  { key: "revision_requested", label: "Révision demandée" },
  { key: "funds_released", label: "Fonds libérés" },
  { key: "dispute_opened", label: "Litige ouvert" },
  { key: "dispute_resolved", label: "Verdict litige" },
  { key: "kyc_approved", label: "KYC approuvé" },
  { key: "kyc_rejected", label: "KYC refusé" },
  { key: "new_message", label: "Nouveau message" },
  { key: "deadline_reminder", label: "Rappel deadline 24h" },
  { key: "password_reset", label: "Réinitialisation mot de passe" },
];

const PLAN_NAMES = ["decouverte", "ascension", "sommet", "empire"];

function ConfigSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-56 bg-border-dark rounded-lg" />
          <div className="h-4 w-80 bg-border-dark rounded-lg mt-2" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="h-10 w-32 bg-border-dark rounded-lg" />
        ))}
      </div>
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-6">
        <div className="h-6 w-40 bg-border-dark rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-border-dark rounded" />
            <div className="h-10 w-full bg-border-dark rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-border-dark rounded" />
            <div className="h-10 w-full bg-border-dark rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminConfiguration() {
  const { addToast } = useToastStore();
  const { config, loading, syncConfig, updateConfig } = useAdminStore();
  const [tab, setTab] = useState("general");
  const [saving, setSaving] = useState(false);

  // Local draft state for form editing — initialized from store config
  const [draft, setDraft] = useState<AdminConfig | null>(null);

  useEffect(() => {
    syncConfig();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync draft from store when config loads / changes — use structuredClone to avoid
  // mutating nested objects (commissions, plans, announcementBanner) in the Zustand store.
  useEffect(() => {
    if (config) {
      setDraft(structuredClone(config));
    }
  }, [config]);

  async function saveConfig(patch: Record<string, unknown>, label: string) {
    setSaving(true);
    try {
      const ok = await updateConfig(patch);
      if (ok) addToast("success", label);
      else addToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  // Toggle currency in the enabled list
  async function toggleCurrency(code: string) {
    if (!draft) return;
    const currencies = draft.enabledCurrencies || [];
    const list = currencies.includes(code)
      ? currencies.filter(c => c !== code)
      : [...currencies, code];
    setDraft({ ...draft, enabledCurrencies: list });
    await saveConfig({ enabledCurrencies: list }, "Devise mise à jour");
  }

  // Toggle payment method in the enabled list
  async function togglePayment(id: string) {
    if (!draft) return;
    const methods = draft.enabledPaymentMethods || [];
    const list = methods.includes(id)
      ? methods.filter(p => p !== id)
      : [...methods, id];
    setDraft({ ...draft, enabledPaymentMethods: list });
    await saveConfig({ enabledPaymentMethods: list }, "Méthode de paiement mise à jour");
  }

  // Toggle maintenance mode
  async function toggleMaintenance() {
    if (!draft) return;
    const next = !draft.maintenanceMode;
    setDraft({ ...draft, maintenanceMode: next });
    await saveConfig({ maintenanceMode: next }, next ? "Maintenance activée" : "Maintenance désactivée");
  }

  const tabs = [
    { key: "general", label: "Général", icon: "settings" },
    { key: "commissions", label: "Commissions & Plans", icon: "payments" },
    { key: "devises", label: "Devises", icon: "euro" },
    { key: "paiements", label: "Paiements", icon: "credit_card" },
    { key: "emails", label: "Emails", icon: "mail" },
    { key: "maintenance", label: "Maintenance", icon: "build" },
    { key: "banniere", label: "Bannière", icon: "campaign" },
  ];

  if (loading.config || !draft) return <ConfigSkeleton />;

  return (
    <AdminPermissionGuard permission="config.view">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span>
            Configuration Plateforme
          </h1>
          <p className="text-slate-400 text-sm mt-1">Paramètres globaux de FreelanceHigh. Toute modification est appliquée immédiatement.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-primary font-semibold">Sauvegarde...</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              tab === t.key ? "bg-primary text-white" : "bg-neutral-dark border border-border-dark text-slate-500 hover:text-primary"
            )}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* General */}
      {tab === "general" && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-6">
          <h2 className="font-bold text-lg text-white">Paramètres généraux</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Nom du site</label>
              <input
                value={draft.platformName}
                onChange={e => setDraft({ ...draft, platformName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email support</label>
              <input
                value={draft.supportEmail}
                onChange={e => setDraft({ ...draft, supportEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Langues actives</label>
            <p className="text-sm text-slate-400">{(draft.languages || []).join(", ")}</p>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => saveConfig({ platformName: draft.platformName, supportEmail: draft.supportEmail }, "Paramètres généraux sauvegardés")}
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Sauvegarder
            </button>
            <p className="text-xs text-slate-500">Les modifications sont appliquées immédiatement.</p>
          </div>
        </div>
      )}

      {/* Commissions & Plans */}
      {tab === "commissions" && (
        <div className="space-y-6">
          {/* Commission rates */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
            <h2 className="font-bold text-lg text-white mb-4">Taux de commission par plan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PLAN_NAMES.map(plan => (
                <div key={plan} className="bg-background-dark/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{plan}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={(draft.commissions || {})[plan] ?? 0}
                      onChange={e => {
                        const updated = { ...(draft.commissions || {}), [plan]: Number(e.target.value) };
                        setDraft({ ...draft, commissions: updated });
                      }}
                      className="w-20 px-3 py-2 rounded-lg border border-border-dark bg-background-dark text-white text-sm text-center outline-none focus:border-primary"
                    />
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => saveConfig({ commissions: draft.commissions }, "Commissions mises à jour")}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Sauvegarder les commissions
            </button>
          </div>

          {/* Plans config */}
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
            <h2 className="font-bold text-lg text-white mb-4">Configuration des plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                    <th className="px-3 py-2 text-left font-semibold">Plan</th>
                    <th className="px-3 py-2 text-center font-semibold">Prix/mois (EUR)</th>
                    <th className="px-3 py-2 text-center font-semibold">Commission %</th>
                    <th className="px-3 py-2 text-center font-semibold">Services max</th>
                    <th className="px-3 py-2 text-center font-semibold">Candidatures/mois</th>
                    <th className="px-3 py-2 text-center font-semibold">Boosts/mois</th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_NAMES.map(planName => {
                    const plan = ((draft.plans || {}) as Record<string, { price: number; commission: number; maxServices: number; maxCandidatures: number; boostsPerMonth: number }>)[planName];
                    if (!plan) return null;
                    return (
                      <tr key={planName} className="border-b border-border-dark/50">
                        <td className="px-3 py-3 text-sm font-bold text-white capitalize">{planName}</td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            value={plan.price}
                            onChange={e => {
                              const updated = { ...(draft.plans || {}), [planName]: { ...plan, price: Number(e.target.value) } } as AdminConfig["plans"];
                              setDraft({ ...draft, plans: updated });
                            }}
                            className="w-16 px-2 py-1 rounded border border-border-dark bg-background-dark text-white text-sm text-center outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            value={plan.commission}
                            onChange={e => {
                              const updated = { ...(draft.plans || {}), [planName]: { ...plan, commission: Number(e.target.value) } } as AdminConfig["plans"];
                              setDraft({ ...draft, plans: updated });
                            }}
                            className="w-16 px-2 py-1 rounded border border-border-dark bg-background-dark text-white text-sm text-center outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-slate-300">{plan.maxServices > 0 ? plan.maxServices : "\u221e"}</td>
                        <td className="px-3 py-3 text-center text-sm text-slate-300">{plan.maxCandidatures > 0 ? plan.maxCandidatures : "\u221e"}</td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            value={plan.boostsPerMonth}
                            onChange={e => {
                              const updated = { ...(draft.plans || {}), [planName]: { ...plan, boostsPerMonth: Number(e.target.value) } } as AdminConfig["plans"];
                              setDraft({ ...draft, plans: updated });
                            }}
                            className="w-16 px-2 py-1 rounded border border-border-dark bg-background-dark text-white text-sm text-center outline-none focus:border-primary"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => saveConfig({ plans: draft.plans }, "Plans mis à jour")}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Sauvegarder les plans
            </button>
          </div>
        </div>
      )}

      {/* Currencies */}
      {tab === "devises" && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
          <h2 className="font-bold text-lg text-white mb-4">Devises</h2>
          <p className="text-sm text-slate-400 mb-4">Activez ou désactivez les devises disponibles sur la plateforme.</p>
          <div className="space-y-3">
            {ALL_CURRENCIES.map(c => {
              const active = (draft.enabledCurrencies || []).includes(c.code);
              return (
                <div key={c.code} className="flex items-center justify-between p-4 rounded-lg border border-border-dark hover:border-border-dark/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white w-12">{c.symbol}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{c.code}</p>
                      <p className="text-xs text-slate-500">{c.label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCurrency(c.code)}
                    disabled={saving}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50",
                      active ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-slate-500/20 text-slate-400 hover:bg-slate-500/30"
                    )}
                  >
                    {active ? "Actif" : "Inactif"}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-4">Devises actives : {(draft.enabledCurrencies || []).join(", ")}</p>
        </div>
      )}

      {/* Payment methods */}
      {tab === "paiements" && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
          <h2 className="font-bold text-lg text-white mb-4">Méthodes de paiement</h2>
          <p className="text-sm text-slate-400 mb-4">Activez les méthodes de paiement disponibles pour les utilisateurs.</p>
          <div className="space-y-3">
            {ALL_PAYMENT_METHODS.map(pm => {
              const active = (draft.enabledPaymentMethods || []).includes(pm.id);
              return (
                <div key={pm.id} className="flex items-center justify-between p-4 rounded-lg border border-border-dark hover:border-border-dark/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn("material-symbols-outlined text-xl", active ? "text-primary" : "text-slate-500")}>{pm.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{pm.id}</p>
                      <p className="text-xs text-slate-500">{pm.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePayment(pm.id)}
                    disabled={saving}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50",
                      active ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-slate-500/20 text-slate-400 hover:bg-slate-500/30"
                    )}
                  >
                    {active ? "Actif" : "Inactif"}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-4">Méthodes actives : {(draft.enabledPaymentMethods || []).length}/{ALL_PAYMENT_METHODS.length}</p>
        </div>
      )}

      {/* Emails */}
      {tab === "emails" && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-white">Emails transactionnels</h2>
            <p className="text-xs text-slate-500">{EMAILS.length} templates configurés</p>
          </div>
          <p className="text-sm text-slate-400 mb-4">Templates React Email dans <code className="text-primary text-xs">packages/ui/emails/</code>. Configuration des envois via Resend.</p>
          <div className="space-y-2">
            {EMAILS.map(e => (
              <div key={e.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-primary">mail</span>
                  <span className="text-sm text-slate-300">{e.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">{e.key}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Actif</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance */}
      {tab === "maintenance" && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-6">
          <h2 className="font-bold text-lg text-white">Mode maintenance</h2>

          <div className={cn("flex items-center gap-4 p-4 rounded-lg border-2 border-dashed transition-colors", draft.maintenanceMode ? "border-red-500/30 bg-red-500/5" : "border-border-dark")}>
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={toggleMaintenance}
                disabled={saving}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative disabled:opacity-50",
                  draft.maintenanceMode ? "bg-red-500" : "bg-slate-600"
                )}
              >
                <div className={cn("w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform", draft.maintenanceMode ? "translate-x-6" : "translate-x-0.5")} />
              </button>
              <div>
                <p className="font-semibold text-white">Mode maintenance</p>
                <p className="text-xs text-slate-400">Bloque l&apos;accès pour tous les utilisateurs (sauf admins)</p>
              </div>
            </label>
          </div>

          {draft.maintenanceMode && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
              <p className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-lg">warning</span>
                Le mode maintenance est ACTIF — la plateforme est inaccessible !
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold", draft.maintenanceMode ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400")}>
              <span className={cn("w-2 h-2 rounded-full", draft.maintenanceMode ? "bg-red-400" : "bg-emerald-400 animate-pulse")} />
              {draft.maintenanceMode ? "Plateforme hors ligne" : "Plateforme en ligne"}
            </span>
          </div>
        </div>
      )}

      {/* Announcement banner */}
      {tab === "banniere" && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-6">
          <h2 className="font-bold text-lg text-white">Bannière d&apos;annonce</h2>
          <p className="text-sm text-slate-400">Affiche une bannière en haut de la plateforme visible par tous les utilisateurs.</p>

          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => {
                const banner = draft.announcementBanner || { enabled: false, message: "" };
                const next = !banner.enabled;
                setDraft({ ...draft, announcementBanner: { ...banner, enabled: next } });
              }}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                (draft.announcementBanner || {}).enabled ? "bg-primary" : "bg-slate-600"
              )}
            >
              <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform", (draft.announcementBanner || {}).enabled ? "translate-x-5" : "translate-x-0.5")} />
            </button>
            <span className="text-sm text-slate-300 font-semibold">{(draft.announcementBanner || {}).enabled ? "Bannière activée" : "Bannière désactivée"}</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Texte de la bannière</label>
            <textarea
              value={(draft.announcementBanner || { message: "" }).message}
              onChange={e => setDraft({ ...draft, announcementBanner: { ...(draft.announcementBanner || { enabled: false, message: "" }), message: e.target.value } })}
              rows={3}
              placeholder="Laissez vide pour masquer la bannière..."
              className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none resize-none focus:border-primary placeholder:text-slate-500"
            />
          </div>

          {(draft.announcementBanner || {}).message && (draft.announcementBanner || {}).enabled && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Aperçu</p>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary font-semibold text-center">
                {(draft.announcementBanner || { message: "" }).message}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => saveConfig({ announcementBanner: draft.announcementBanner || { enabled: false, message: "" } }, "Bannière mise à jour")}
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Sauvegarder
            </button>
            {(draft.announcementBanner || {}).message && (
              <button
                onClick={() => {
                  const cleared = { ...(draft.announcementBanner || { enabled: false, message: "" }), message: "", enabled: false };
                  setDraft({ ...draft, announcementBanner: cleared });
                  saveConfig({ announcementBanner: cleared }, "Bannière supprimée");
                }}
                disabled={saving}
                className="px-4 py-2 border border-red-500/20 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                Supprimer la bannière
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </AdminPermissionGuard>
  );
}
