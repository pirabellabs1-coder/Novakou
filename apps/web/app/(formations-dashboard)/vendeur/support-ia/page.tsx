"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Config = {
  enabled: boolean;
  welcome: string;
  context: string;
  color: string;
};

const DEFAULT_CONTEXT_PLACEHOLDER = `Exemple de contexte à donner à votre chatbot :

Je vends des formations en ligne sur le marketing digital pour les entrepreneurs africains francophones.

Mes produits principaux :
- Formation complète marketing digital — 25 000 FCFA (5h vidéo + PDF)
- Module avancé publicité Facebook — 15 000 FCFA

Ma politique de remboursement :
- Remboursement intégral sous 7 jours si non satisfait
- Accès à vie aux contenus

Je réponds aux questions par email sous 24h. Le support client se fait via WhatsApp au +229 01 00 00 00 00.

Les questions fréquentes :
- "Comment accéder au contenu après achat ?" → Vous recevez un email avec votre accès dans les 5 minutes
- "Puis-je payer en plusieurs fois ?" → Oui, via Mobile Money sur 2 mensualités
- "Y a-t-il un certificat ?" → Oui, délivré à la fin de chaque formation

Reste poli et professionnel, réponds en français simple, et si tu ne connais pas la réponse, propose de contacter directement le vendeur.`;

export default function SupportAIPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/formations/vendeur/support-ai");
      const json = await res.json();
      setConfig(json.data ?? { enabled: false, welcome: "", context: "", color: "#006e2f" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/formations/vendeur/support-ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setConfig(json.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const ctxLength = config.context.length;
  const welcomeLength = config.welcome.length;

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
          <Link href="/vendeur" className="hover:text-[#006e2f] transition-colors">Tableau de bord</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#191c1e] font-medium">Support client IA</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Support client IA</h1>
            <p className="text-sm text-[#5c647a]">
              Un chatbot intelligent sur votre boutique, qui répond aux questions de vos clients 24/7 — propulsé par Claude Sonnet 4.6 via Puter.js.
            </p>
          </div>
        </div>
      </div>

      {/* Main config card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        {/* Toggle */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex-1">
            <h2 className="text-base font-bold text-[#191c1e]">Activer le chatbot sur ma boutique</h2>
            <p className="text-xs text-[#5c647a] mt-1">
              Une fois activé, un widget de chat apparaîtra en bas à droite de vos pages publiques (boutique, formations, produits).
            </p>
          </div>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`relative w-14 h-8 rounded-full transition-colors ${config.enabled ? "bg-[#006e2f]" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${config.enabled ? "translate-x-7" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* Welcome message */}
        <div>
          <label className="flex items-center justify-between text-sm font-bold text-[#191c1e] mb-2">
            <span>Message d&apos;accueil</span>
            <span className={`text-xs font-normal ${welcomeLength > 300 ? "text-rose-600" : "text-[#5c647a]"}`}>
              {welcomeLength}/300
            </span>
          </label>
          <input
            type="text"
            value={config.welcome}
            onChange={(e) => setConfig({ ...config, welcome: e.target.value.slice(0, 300) })}
            placeholder="Bonjour ! Je suis l'assistant virtuel. Comment puis-je vous aider ?"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
          />
          <p className="text-[10px] text-[#5c647a] mt-1">
            S&apos;affiche dans le chat quand un visiteur ouvre le widget.
          </p>
        </div>

        {/* Context — training */}
        <div>
          <label className="flex items-center justify-between text-sm font-bold text-[#191c1e] mb-2">
            <span>Contexte du chatbot (ses connaissances)</span>
            <span className={`text-xs font-normal ${ctxLength > 8000 ? "text-rose-600" : "text-[#5c647a]"}`}>
              {ctxLength}/8000
            </span>
          </label>
          <textarea
            value={config.context}
            onChange={(e) => setConfig({ ...config, context: e.target.value.slice(0, 8000) })}
            rows={16}
            placeholder={DEFAULT_CONTEXT_PLACEHOLDER}
            className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm font-mono leading-relaxed"
          />
          <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <span className="material-symbols-outlined text-blue-600 text-[18px] flex-shrink-0 mt-0.5">tips_and_updates</span>
            <div className="text-xs text-[#191c1e]">
              <p className="font-bold mb-1">Conseils pour un bon contexte :</p>
              <ul className="space-y-0.5 text-[#5c647a]">
                <li>• Décrivez clairement vos produits et leurs prix</li>
                <li>• Listez vos politiques (remboursement, livraison, support)</li>
                <li>• Ajoutez vos FAQ les plus fréquentes</li>
                <li>• Précisez votre ton et vos limites (ex: "pour les remboursements, dirige vers le support humain")</li>
                <li>• Plus c&apos;est précis, meilleure sera la qualité des réponses</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-bold text-[#191c1e] mb-2">Couleur du widget</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.color}
              onChange={(e) => setConfig({ ...config, color: e.target.value })}
              className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={config.color}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === "") setConfig({ ...config, color: v });
              }}
              className="flex-1 max-w-[140px] px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono"
            />
            <div className="flex items-center gap-2">
              {["#006e2f", "#1d4ed8", "#7c3aed", "#dc2626", "#ea580c", "#0891b2"].map((c) => (
                <button
                  key={c}
                  onClick={() => setConfig({ ...config, color: c })}
                  className="w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c, borderColor: config.color === c ? "#000" : "transparent" }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                Enregistrement…
              </>
            ) : saved ? (
              <>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Enregistré !
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                Enregistrer
              </>
            )}
          </button>
          {config.enabled && (
            <span className="text-xs text-emerald-700 font-bold inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Le chatbot est actif sur vos pages publiques
            </span>
          )}
          {error && <span className="text-xs text-rose-700">{error}</span>}
        </div>
      </div>

      {/* Preview section */}
      <div className="mt-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6">
        <h3 className="text-base font-bold text-[#191c1e] mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">visibility</span>
          Aperçu du widget
        </h3>
        <p className="text-sm text-[#5c647a] mb-4">
          Voici à quoi ressemblera votre chatbot sur votre boutique. Cliquez sur le bouton rond pour l&apos;ouvrir.
        </p>
        <div className="bg-white rounded-xl p-6 min-h-[200px] relative overflow-hidden border border-gray-100">
          <p className="text-xs text-[#5c647a] italic">
            (Votre boutique ressemblera à ceci avec le widget flottant en bas à droite)
          </p>
          <div className="absolute bottom-4 right-4">
            <button
              className="w-14 h-14 rounded-full shadow-lg text-white flex items-center justify-center hover:scale-105 transition-transform"
              style={{ backgroundColor: config.color }}
              disabled
            >
              <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[#5c647a] mt-3 text-center">
          Le vrai widget sera interactif — Claude Sonnet 4.6 répondra en temps réel avec votre contexte.
        </p>
      </div>
    </div>
  );
}
