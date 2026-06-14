"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Settings,
  Info,
  Braces,
  Move,
  GripVertical,
  Loader2,
  Save,
  ShoppingCart,
  CreditCard,
  ShoppingBag,
  GraduationCap,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useToastStore } from "@/store/toast";
import { safeJson } from "@/lib/safe-fetch";
import { RichTextEditor } from "@/components/formations/RichTextEditor";

// ─── Theme — vert Novakou primaire ─────────────────────────────────────────────
const BRAND = "#006e2f";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Step {
  id: string;
  stepOrder: number;
  type: "EMAIL" | "DELAY" | "CONDITION" | "TAG";
  delayHours: number | null;
  subject: string | null;
  content: string | null;
  sendAtHour: number | null;
  condition: unknown;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  isActive: boolean;
  steps: Step[];
}

// ─── Variables disponibles — puces cliquables ─────────────────────────────────
const VARIABLES = [
  { tag: "{{clientName}}", label: "Nom du client" },
  { tag: "{{clientEmail}}", label: "Email du client" },
  { tag: "{{productName}}", label: "Nom du produit" },
  { tag: "{{productPrice}}", label: "Prix du produit" },
  { tag: "{{checkoutURL}}", label: "Lien de paiement" },
  { tag: "{{cartItems}}", label: "Articles du panier" },
  { tag: "{{orderDate}}", label: "Date de commande" },
  { tag: "{{discountCode}}", label: "Code promo" },
  { tag: "{{senderName}}", label: "Votre nom" },
  { tag: "{{brandName}}", label: "Nom de votre marque" },
];

// ─── Trigger tabs — segments larges ────────────────────────────────────────────
type TabKey = "ABANDONED_CART" | "PAYMENT_FAILED" | "PURCHASE" | "ENROLLMENT" | "USER_INACTIVITY";

const TABS: { key: TabKey; label: string; icon: LucideIcon; color: string }[] = [
  { key: "ABANDONED_CART", label: "Panier abandonné", icon: ShoppingCart, color: "text-orange-500" },
  { key: "PAYMENT_FAILED", label: "Échec de paiement", icon: CreditCard, color: "text-red-500" },
  { key: "PURCHASE", label: "Après achat", icon: ShoppingBag, color: "text-green-600" },
  { key: "ENROLLMENT", label: "Inscription", icon: GraduationCap, color: "text-blue-600" },
  { key: "USER_INACTIVITY", label: "Inactivité", icon: Clock, color: "text-gray-500" },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function SequenceEditorClient({ id }: { id: string }) {
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Trigger tab
  const [activeTab, setActiveTab] = useState<TabKey>("ABANDONED_CART");

  // Email form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<"EMAIL" | "SMS">("EMAIL");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formations/vendeur/marketing/sequences/${id}`);
        const { ok, data, error } = await safeJson<{ data: Sequence }>(res);
        if (ok && data?.data) {
          const seq = data.data;
          setSequence(seq);
          setActiveTab((seq.trigger as TabKey) ?? "ABANDONED_CART");
          const firstEmailStep = seq.steps?.find((s) => s.type === "EMAIL");
          setSubject(firstEmailStep?.subject ?? "");
          setMessage(firstEmailStep?.content ?? "");
        } else if (error) {
          useToastStore.getState().addToast("error", error);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Insert variable at end of the current HTML body (Tiptap content)
  function insertVariable(tag: string) {
    setMessage((m) => (m ? `${m} ${tag}` : tag));
  }

  async function handleSave() {
    if (!sequence) return;
    setSaving(true);
    try {
      // Save sequence meta + first email step (subject + body) in one PATCH
      const res = await fetch(`/api/formations/vendeur/marketing/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: activeTab,
          subject,
          content: message,
        }),
      });
      const { ok, error } = await safeJson(res);
      if (!ok) throw new Error(error ?? "Sauvegarde échouée");
      useToastStore.getState().addToast("success", "Séquence sauvegardée ✓");
    } catch (e) {
      useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-xl mb-4" />
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-gray-600">Séquence introuvable.</p>
        <Link href="/vendeur/marketing/sequences" className="text-[#006e2f] text-sm mt-3 inline-block">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "Inter, 'Helvetica Neue', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-8 pb-32">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/vendeur/marketing/sequences" className="hover:text-[#006e2f]">
            Séquences email
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">{sequence.name}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{sequence.name}</h1>
          <p className="text-sm text-gray-500 mt-1.5">Personnalisez les messages envoyés automatiquement.</p>
        </div>

        {/* ── Canal & Type d'événement ───────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Canal de diffusion
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as "EMAIL" | "SMS")}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 font-medium focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
                >
                  <option value="EMAIL">Mail Default</option>
                  <option value="SMS" disabled>SMS (bientôt)</option>
                </select>
                <Link
                  href="/vendeur/marketing/pixels"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-[#006e2f] hover:text-[#006e2f] flex items-center gap-1.5 transition-colors"
                >
                  <Settings size={16} />
                  Intégrations
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs ${sequence.isActive ? "text-green-600" : "text-gray-500"} font-semibold`}>
                {sequence.isActive ? "● Active" : "○ Brouillon"}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "text-white shadow-lg"
                      : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                  }`}
                  style={isActive ? { background: BRAND, boxShadow: `0 8px 24px ${BRAND}25` } : {}}
                >
                  <TabIcon size={18} className={isActive ? "text-white" : tab.color} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Éditeur de message ────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          {/* Subject */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Objet du message
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Vous avez oublié quelque chose {{clientName}}…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
            />
          </div>

          {/* Message editor */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Message à envoyer
            </label>

            {/* Rich text editor (Tiptap — supports bold/italic/lists/links/colors) */}
            <RichTextEditor
              value={message}
              onChange={setMessage}
              placeholder="Bonjour {{clientName}}, Vous avez laissé {{productName}} dans votre panier. Cliquez ici pour finaliser votre commande : {{checkoutURL}}"
              minHeight={300}
            />

            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
              <Info size={14} />
              Utilisez les variables ci-dessous pour personnaliser chaque email automatiquement.
            </div>
          </div>
        </section>

        {/* ── Variables disponibles ────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Braces size={18} style={{ color: BRAND }} />
              Variables disponibles
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <Move size={13} />
              Glissez-déposez une variable dans un champ ou cliquez pour l&apos;insérer à la position du curseur.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((v) => (
              <button
                key={v.tag}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", v.tag);
                  e.dataTransfer.setData("application/x-fh-variable", v.tag);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => insertVariable(v.tag)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:-translate-y-0.5 cursor-grab active:cursor-grabbing select-none"
                style={{
                  background: `${BRAND}0f`,
                  color: BRAND,
                  borderColor: `${BRAND}30`,
                  minHeight: "40px",
                }}
                title={`${v.tag} — Glissez-déposez ou cliquez pour insérer`}
              >
                <GripVertical size={14} className="opacity-60" />
                {v.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ── Sticky save bar ──────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            Les modifications sont sauvegardées manuellement.
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/vendeur/marketing/sequences"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Annuler
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:-translate-y-0.5 transition-all disabled:opacity-50"
              style={{ background: BRAND, boxShadow: `0 8px 24px ${BRAND}35` }}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sauvegarde…
                </>
              ) : (
                <>
                  <Save size={18} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
