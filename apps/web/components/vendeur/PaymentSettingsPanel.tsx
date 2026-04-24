"use client";

/**
 * Functional "Paiements" panel for the vendor parametres page.
 * Replaces the previous static mock with live API-backed state.
 *
 * Sections :
 *   - Méthodes acceptées : what payment options the vendor's customers
 *     can use at checkout (Orange Money, Wave, MTN, card, …).
 *   - Méthodes de retrait : accounts where the vendor receives payouts.
 */

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";

interface PayoutMethod {
  id: string;
  method: string;
  label?: string;
  phone?: string;
  iban?: string;
  email?: string;
  primary?: boolean;
}

interface Settings {
  acceptedPaymentMethods: string[];
  payoutMethods: PayoutMethod[];
}

const PAYMENT_METHODS: Array<{ id: string; label: string; icon: string; mobileMoney?: boolean }> = [
  { id: "orange_money", label: "Orange Money", icon: "phone_iphone", mobileMoney: true },
  { id: "wave", label: "Wave", icon: "phone_iphone", mobileMoney: true },
  { id: "mtn_momo", label: "MTN Mobile Money", icon: "phone_iphone", mobileMoney: true },
  { id: "moov_money", label: "Moov Money", icon: "phone_iphone", mobileMoney: true },
  { id: "card", label: "Carte bancaire (Visa/Mastercard)", icon: "credit_card" },
  { id: "paypal", label: "PayPal", icon: "account_balance_wallet" },
  { id: "bank_transfer", label: "Virement bancaire", icon: "account_balance" },
  { id: "free", label: "Gratuit / bons cadeaux", icon: "redeem" },
];

const PAYOUT_METHODS: Array<{ id: string; label: string; icon: string; field: "phone" | "iban" | "email" }> = [
  { id: "orange_money", label: "Orange Money", icon: "phone_iphone", field: "phone" },
  { id: "wave", label: "Wave", icon: "phone_iphone", field: "phone" },
  { id: "mtn_momo", label: "MTN Mobile Money", icon: "phone_iphone", field: "phone" },
  { id: "moov_money", label: "Moov Money", icon: "phone_iphone", field: "phone" },
  { id: "bank_transfer", label: "Virement bancaire (IBAN)", icon: "account_balance", field: "iban" },
  { id: "paypal", label: "PayPal", icon: "account_balance_wallet", field: "email" },
];

export default function PaymentSettingsPanel() {
  const toast = useToastStore.getState().addToast;
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAccepted, setSavingAccepted] = useState(false);
  const [showAddPayout, setShowAddPayout] = useState(false);
  const [newPayout, setNewPayout] = useState({
    method: "orange_money",
    label: "",
    phone: "",
    iban: "",
    bic: "",
    bank_name: "",
    account_holder: "",
    email: "",
  });
  const [savingPayout, setSavingPayout] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/vendeur/payment-settings");
      const j = await res.json();
      setSettings({
        acceptedPaymentMethods: j?.data?.acceptedPaymentMethods ?? [],
        payoutMethods: j?.data?.payoutMethods ?? [],
      });
    } catch {
      toast("error", "Chargement des paramètres de paiement impossible");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function persist(next: Partial<Settings>) {
    if (!settings) return;
    setSavingAccepted(true);
    try {
      const res = await fetch("/api/formations/vendeur/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptedPaymentMethods: next.acceptedPaymentMethods ?? settings.acceptedPaymentMethods,
          payoutMethods: next.payoutMethods ?? settings.payoutMethods,
        }),
      });
      const j = await res.json();
      if (!res.ok) { toast("error", j.error ?? "Erreur"); return; }
      setSettings({
        acceptedPaymentMethods: j.data.acceptedPaymentMethods,
        payoutMethods: j.data.payoutMethods,
      });
      toast("success", "Paramètres mis à jour ✓");
    } finally { setSavingAccepted(false); }
  }

  function toggleAccepted(id: string) {
    if (!settings) return;
    const exists = settings.acceptedPaymentMethods.includes(id);
    const next = exists
      ? settings.acceptedPaymentMethods.filter((m) => m !== id)
      : [...settings.acceptedPaymentMethods, id];
    if (next.length === 0) {
      toast("warning", "Au moins une méthode doit rester activée");
      return;
    }
    persist({ acceptedPaymentMethods: next });
  }

  async function addPayout() {
    if (!settings) return;
    const spec = PAYOUT_METHODS.find((m) => m.id === newPayout.method);
    if (!spec) return;
    const entry: PayoutMethod & { bic?: string; bank_name?: string; account_holder?: string } = {
      id: `pm-${Date.now()}`,
      method: newPayout.method,
      label: newPayout.label.trim() || undefined,
      primary: settings.payoutMethods.length === 0, // first one = primary
    };
    if (spec.field === "phone") {
      entry.phone = newPayout.phone.trim();
    } else if (spec.field === "iban") {
      entry.iban = newPayout.iban.trim();
      // Pour un virement, Moneroo a aussi besoin du BIC, du nom de la banque
      // et du titulaire. On les envoie si remplis, sinon l'admin devra les ajouter.
      if (newPayout.bic.trim()) entry.bic = newPayout.bic.trim();
      if (newPayout.bank_name.trim()) entry.bank_name = newPayout.bank_name.trim();
      if (newPayout.account_holder.trim()) entry.account_holder = newPayout.account_holder.trim();
    } else if (spec.field === "email") {
      entry.email = newPayout.email.trim();
    }

    setSavingPayout(true);
    try {
      await persist({ payoutMethods: [...settings.payoutMethods, entry] });
      setShowAddPayout(false);
      setNewPayout({ method: "orange_money", label: "", phone: "", iban: "", bic: "", bank_name: "", account_holder: "", email: "" });
    } finally { setSavingPayout(false); }
  }

  async function removePayout(id: string) {
    if (!settings) return;
    if (!confirm("Supprimer cette méthode de retrait ?")) return;
    const next = settings.payoutMethods.filter((m) => m.id !== id);
    // If we removed the primary, promote the first remaining
    if (next.length > 0 && !next.some((m) => m.primary)) next[0].primary = true;
    await persist({ payoutMethods: next });
  }

  async function setPrimary(id: string) {
    if (!settings) return;
    const next = settings.payoutMethods.map((m) => ({ ...m, primary: m.id === id }));
    await persist({ payoutMethods: next });
  }

  if (loading) {
    return <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-40" />;
  }
  if (!settings) return null;

  const payoutSpec = PAYOUT_METHODS.find((m) => m.id === newPayout.method);

  return (
    <div className="space-y-6">
      {/* Accepted payment methods */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-[#191c1e]">Méthodes de paiement acceptées</h2>
        <p className="text-xs text-[#5c647a] mt-0.5">
          Ce que vos clients peuvent utiliser pour payer vos produits. Désactivez ce que vous ne voulez pas voir proposé au checkout.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {PAYMENT_METHODS.map((m) => {
            const enabled = settings.acceptedPaymentMethods.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleAccepted(m.id)}
                disabled={savingAccepted}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors text-left ${
                  enabled ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${enabled ? "text-emerald-700" : "text-slate-400"}`}>
                    {m.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{m.label}</p>
                    {m.mobileMoney && (
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Mobile Money</p>
                    )}
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-[20px] flex-shrink-0 ${enabled ? "text-emerald-600" : "text-slate-300"}`}
                  style={{ fontVariationSettings: enabled ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {enabled ? "check_circle" : "radio_button_unchecked"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payout methods */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#191c1e]">Comptes de retrait</h2>
            <p className="text-xs text-[#5c647a] mt-0.5">
              Où recevoir votre argent quand vous retirez vos gains. Le compte marqué « principal » est utilisé par défaut.
            </p>
          </div>
          <button
            onClick={() => setShowAddPayout((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">{showAddPayout ? "close" : "add"}</span>
            {showAddPayout ? "Fermer" : "Ajouter"}
          </button>
        </div>

        {showAddPayout && (
          <div className="mb-4 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Méthode</label>
                <select
                  value={newPayout.method}
                  onChange={(e) => setNewPayout((p) => ({ ...p, method: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                >
                  {PAYOUT_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Libellé (optionnel)</label>
                <input
                  type="text"
                  value={newPayout.label}
                  onChange={(e) => setNewPayout((p) => ({ ...p, label: e.target.value }))}
                  placeholder="ex. Personnel, Pro…"
                  maxLength={80}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
            {payoutSpec?.field === "phone" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={newPayout.phone}
                  onChange={(e) => setNewPayout((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+221 77 123 45 67"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            )}
            {payoutSpec?.field === "iban" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IBAN</label>
                  <input
                    type="text"
                    value={newPayout.iban}
                    onChange={(e) => setNewPayout((p) => ({ ...p, iban: e.target.value.toUpperCase() }))}
                    placeholder="SN12 XXXX XXXX XXXX XXXX XXXX"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">BIC / SWIFT</label>
                  <input
                    type="text"
                    value={newPayout.bic}
                    onChange={(e) => setNewPayout((p) => ({ ...p, bic: e.target.value.toUpperCase() }))}
                    placeholder="BNPAFRPP"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom de la banque</label>
                  <input
                    type="text"
                    value={newPayout.bank_name}
                    onChange={(e) => setNewPayout((p) => ({ ...p, bank_name: e.target.value }))}
                    placeholder="Ecobank Sénégal"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titulaire du compte</label>
                  <input
                    type="text"
                    value={newPayout.account_holder}
                    onChange={(e) => setNewPayout((p) => ({ ...p, account_holder: e.target.value }))}
                    placeholder="Prénom Nom"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[11px] text-blue-900">
                  Ces 4 informations sont requises par Moneroo pour traiter un virement bancaire.
                </div>
              </>
            )}
            {payoutSpec?.field === "email" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email PayPal</label>
                <input
                  type="email"
                  value={newPayout.email}
                  onChange={(e) => setNewPayout((p) => ({ ...p, email: e.target.value }))}
                  placeholder="vous@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={addPayout}
                disabled={savingPayout}
                className="px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
              >
                {savingPayout ? "Ajout…" : "Ajouter"}
              </button>
              <button
                onClick={() => setShowAddPayout(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {settings.payoutMethods.length === 0 ? (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300">payments</span>
            <p className="text-sm font-bold text-slate-700 mt-2">Aucun compte de retrait configuré</p>
            <p className="text-xs text-slate-500 mt-1">
              Ajoutez au moins un compte pour pouvoir retirer vos gains.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {settings.payoutMethods.map((pm) => {
              const spec = PAYOUT_METHODS.find((m) => m.id === pm.method);
              return (
                <div
                  key={pm.id}
                  className={`flex items-center gap-4 p-3.5 rounded-xl border ${
                    pm.primary ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px] text-slate-600 flex-shrink-0">
                    {spec?.icon ?? "account_balance"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{spec?.label ?? pm.method}</p>
                      {pm.label && <span className="text-[11px] text-slate-500">· {pm.label}</span>}
                      {pm.primary && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {pm.phone || pm.iban || pm.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!pm.primary && (
                      <button
                        onClick={() => setPrimary(pm.id)}
                        className="text-[11px] font-bold text-emerald-700 hover:underline whitespace-nowrap"
                      >
                        Définir principal
                      </button>
                    )}
                    <button
                      onClick={() => removePayout(pm.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                      title="Supprimer"
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
