"use client";

/**
 * Panneau « Mes moyens de paiement » de l'espace apprenant.
 * Remplace l'ancienne liste statique (mock) par un état réel branché sur
 * /api/payment-methods (voir lib/api-client → paymentMethodsApi).
 *
 * Sécurité : le numéro de carte complet et le CVV ne sont JAMAIS saisis ni
 * stockés ici — seuls les 4 derniers chiffres. Les paiements par carte
 * restent traités sur la page hébergée Moneroo.
 */

import { useEffect, useState } from "react";
import {
  Smartphone,
  Waves,
  Phone,
  CreditCard,
  Landmark,
  Wallet,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { StCard, StSectionTitle, StChip, StButton, ST } from "@/components/stitch";
import { paymentMethodsApi, type ApiPaymentMethod } from "@/lib/api-client";
import { useToastStore } from "@/store/toast";

type AddType = "momo" | "card" | "bank" | "paypal";

const MOMO_PROVIDERS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "orange_money", label: "Orange Money", Icon: Smartphone },
  { id: "wave", label: "Wave", Icon: Waves },
  { id: "mtn_momo", label: "MTN Mobile Money", Icon: Phone },
  { id: "moov_money", label: "Moov Money", Icon: Smartphone },
];

const TYPE_TABS: { id: AddType; label: string; Icon: LucideIcon }[] = [
  { id: "momo", label: "Mobile Money", Icon: Smartphone },
  { id: "card", label: "Carte", Icon: CreditCard },
  { id: "bank", label: "Virement", Icon: Landmark },
  { id: "paypal", label: "PayPal", Icon: Wallet },
];

/** Icône + teinte d'affichage d'un moyen enregistré. */
function methodVisual(m: ApiPaymentMethod): { Icon: LucideIcon; tone: { background: string; color: string } } {
  if (m.type === "card") return { Icon: CreditCard, tone: { background: ST.blueSoft, color: ST.blueText } };
  if (m.type === "bank") return { Icon: Landmark, tone: { background: ST.greenSoft, color: ST.green } };
  if (m.type === "paypal") return { Icon: Wallet, tone: { background: ST.blueSoft, color: ST.blueText } };
  // momo
  if (m.provider === "wave") return { Icon: Waves, tone: { background: ST.blueSoft, color: ST.blueText } };
  if (m.provider === "mtn_momo") return { Icon: Phone, tone: { background: ST.amberSoft, color: ST.amberText } };
  return { Icon: Smartphone, tone: { background: ST.amberSoft, color: ST.amberText } };
}

/** Détail lisible sous le libellé (téléphone, ****last4, email, IBAN masqué). */
function methodDetail(m: ApiPaymentMethod): string {
  if (m.type === "card") return `•••• ${m.last4 ?? "••••"}${m.expiresAt ? ` · exp. ${m.expiresAt}` : ""}`;
  if (m.type === "bank") return m.iban ?? m.bankName ?? "";
  if (m.type === "paypal") return m.email ?? "";
  return m.phone ?? "";
}

const FIELD_CLASS = "w-full px-3.5 py-3 rounded-[12px] text-[13.5px] font-semibold focus:outline-none focus:ring-2 transition-all bg-white";
const FIELD_STYLE: React.CSSProperties = { border: "1px solid #dde6e0", color: ST.text };

export default function SavedPaymentMethodsPanel() {
  const toast = useToastStore.getState().addToast;
  const [methods, setMethods] = useState<ApiPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Champs du formulaire d'ajout
  const [addType, setAddType] = useState<AddType>("momo");
  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState("orange_money");
  const [phone, setPhone] = useState("");
  const [brand, setBrand] = useState("visa");
  const [last4, setLast4] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [email, setEmail] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await paymentMethodsApi.list();
      setMethods(res.methods);
    } catch {
      toast("error", "Impossible de charger vos moyens de paiement");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setAddType("momo");
    setLabel("");
    setProvider("orange_money");
    setPhone("");
    setBrand("visa");
    setLast4("");
    setExpMonth("");
    setExpYear("");
    setBankName("");
    setIban("");
    setEmail("");
  }

  function buildPayload(): Record<string, unknown> | null {
    if (addType === "momo") {
      if (!phone.trim()) { toast("error", "Numéro de téléphone requis"); return null; }
      return { type: "momo", provider, phone: phone.trim(), label: label.trim() || undefined };
    }
    if (addType === "card") {
      if (!label.trim()) { toast("error", "Donnez un nom à cette carte (ex : « Visa perso »)"); return null; }
      if (!/^\d{4}$/.test(last4.trim())) { toast("error", "Entrez uniquement les 4 derniers chiffres"); return null; }
      return {
        type: "card",
        label: label.trim(),
        brand,
        last4: last4.trim(),
        expMonth: expMonth ? Number(expMonth) : undefined,
        expYear: expYear ? Number(expYear) : undefined,
      };
    }
    if (addType === "bank") {
      if (!bankName.trim()) { toast("error", "Nom de la banque requis"); return null; }
      if (iban.replace(/\s/g, "").length < 15) { toast("error", "IBAN invalide"); return null; }
      return { type: "bank", bankName: bankName.trim(), iban: iban.replace(/\s/g, "").toUpperCase(), label: label.trim() || undefined };
    }
    // paypal
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast("error", "Adresse email PayPal invalide"); return null; }
    return { type: "paypal", email: email.trim(), label: label.trim() || undefined };
  }

  async function handleAdd() {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      const res = await paymentMethodsApi.add(payload);
      setMethods((prev) => {
        // le nouveau peut être défini par défaut (1er ajouté) → refléter l'état serveur
        const next = res.method.isDefault ? prev.map((m) => ({ ...m, isDefault: false })) : prev;
        return [res.method, ...next];
      });
      toast("success", "Moyen de paiement ajouté ✓");
      resetForm();
      setShowAdd(false);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Ajout impossible");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce moyen de paiement ?")) return;
    try {
      await paymentMethodsApi.remove(id);
      await load(); // recharge (le défaut peut avoir été réattribué côté serveur)
      toast("success", "Moyen de paiement supprimé");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Suppression impossible");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await paymentMethodsApi.setDefault(id);
      setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
      toast("success", "Moyen par défaut mis à jour");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Mise à jour impossible");
    }
  }

  return (
    <StCard>
      <StSectionTitle
        action={
          <StButton
            size="sm"
            variant={showAdd ? "secondary" : "ghost-green"}
            icon={Plus}
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? "Fermer" : "Ajouter"}
          </StButton>
        }
      >
        Mes moyens de paiement
      </StSectionTitle>

      {/* Note sécurité carte */}
      <div
        className="flex items-start gap-2 rounded-[12px] px-3.5 py-2.5 mb-4"
        style={{ background: ST.greenSoft, color: ST.greenDark }}
      >
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
        <p className="text-[11.5px] font-semibold leading-relaxed">
          Les paiements par carte restent traités sur la page sécurisée Moneroo — nous n&apos;enregistrons jamais votre numéro de carte.
        </p>
      </div>

      {/* Formulaire d'ajout */}
      {showAdd && (
        <div className="mb-4 rounded-[14px] p-4 space-y-3" style={{ border: `1px solid ${ST.divider}`, background: "#fbfdfc" }}>
          {/* Type */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPE_TABS.map((t) => {
              const on = addType === t.id;
              const Icon = t.Icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAddType(t.id)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[12px] font-extrabold transition-colors"
                  style={on ? { background: ST.green, color: "#fff" } : { background: "#fff", color: ST.textSecondary, border: `1px solid ${ST.divider}` }}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Champs par type */}
          {addType === "momo" && (
            <>
              <div>
                <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Opérateur</label>
                <select value={provider} onChange={(e) => setProvider(e.target.value)} className={FIELD_CLASS} style={FIELD_STYLE}>
                  {MOMO_PROVIDERS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Numéro Mobile Money</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 07 00 00 00 00" className={FIELD_CLASS} style={FIELD_STYLE} />
              </div>
            </>
          )}

          {addType === "card" && (
            <>
              <div>
                <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Nom de la carte</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex : Visa perso" maxLength={80} className={FIELD_CLASS} style={FIELD_STYLE} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Réseau</label>
                  <select value={brand} onChange={(e) => setBrand(e.target.value)} className={FIELD_CLASS} style={FIELD_STYLE}>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>4 derniers chiffres</label>
                  <input type="text" inputMode="numeric" value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="4242" className={FIELD_CLASS} style={FIELD_STYLE} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Mois exp. (optionnel)</label>
                  <input type="text" inputMode="numeric" value={expMonth} onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="09" className={FIELD_CLASS} style={FIELD_STYLE} />
                </div>
                <div>
                  <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Année exp. (optionnel)</label>
                  <input type="text" inputMode="numeric" value={expYear} onChange={(e) => setExpYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2028" className={FIELD_CLASS} style={FIELD_STYLE} />
                </div>
              </div>
            </>
          )}

          {addType === "bank" && (
            <>
              <div>
                <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Nom de la banque</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ecobank Sénégal" maxLength={100} className={FIELD_CLASS} style={FIELD_STYLE} />
              </div>
              <div>
                <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>IBAN</label>
                <input type="text" value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} placeholder="SN12 XXXX XXXX XXXX XXXX" className={`${FIELD_CLASS} font-mono`} style={FIELD_STYLE} />
              </div>
            </>
          )}

          {addType === "paypal" && (
            <div>
              <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Email PayPal</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@example.com" className={FIELD_CLASS} style={FIELD_STYLE} />
            </div>
          )}

          {/* Libellé optionnel commun (momo/bank/paypal) */}
          {addType !== "card" && (
            <div>
              <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Libellé (optionnel)</label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex : Perso, Pro…" maxLength={80} className={FIELD_CLASS} style={FIELD_STYLE} />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <StButton onClick={handleAdd} disabled={saving} icon={saving ? Loader2 : Plus}>
              {saving ? "Ajout…" : "Ajouter le moyen"}
            </StButton>
            <StButton variant="secondary" onClick={() => { setShowAdd(false); resetForm(); }}>Annuler</StButton>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1].map((i) => <div key={i} className="h-16 rounded-[12px] animate-pulse" style={{ background: "#eef2ef" }} />)}
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-8 rounded-[12px]" style={{ border: "2px dashed #bcd6c5", background: "#fbfdfc" }}>
          <Wallet size={30} className="mx-auto" style={{ color: ST.textMuted }} />
          <p className="text-[13px] font-extrabold mt-2" style={{ color: ST.text }}>Aucun moyen de paiement enregistré</p>
          <p className="text-[11.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
            Ajoutez-en un pour accélérer vos prochains achats.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => {
            const { Icon, tone } = methodVisual(m);
            return (
              <div key={m.id} className="flex items-center gap-3 p-4 rounded-[12px]" style={{ border: `1px solid ${m.isDefault ? "#bfe3cc" : ST.divider}`, background: m.isDefault ? "#f5fbf7" : "#fff" }}>
                <div className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0" style={tone}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>{m.label}</p>
                    {m.isDefault && <StChip tone="green">Principale</StChip>}
                  </div>
                  <p className="text-[11.5px] font-semibold font-mono mt-0.5" style={{ color: ST.textSecondary }}>{methodDetail(m)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!m.isDefault && (
                    <button
                      onClick={() => handleSetDefault(m.id)}
                      className="text-[11px] font-extrabold whitespace-nowrap hover:underline"
                      style={{ color: ST.green }}
                    >
                      Définir principale
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-rose-50"
                    style={{ color: ST.roseText }}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StCard>
  );
}
