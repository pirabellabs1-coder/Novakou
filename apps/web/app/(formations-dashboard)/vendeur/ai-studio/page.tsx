"use client";

import { useState } from "react";
import Link from "next/link";

type Generated = {
  title: string;
  shortDesc: string;
  description: string;
  learnPoints: string[];
  targetAudience: string;
  faq: Array<{ q: string; a: string }>;
};

function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // fallback
        }
      }}
      className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] hover:bg-[#006e2f]/5 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
    >
      <span className="material-symbols-outlined text-[14px]">
        {copied ? "check" : "content_copy"}
      </span>
      {copied ? "Copié !" : label}
    </button>
  );
}

export default function AIStudioPage() {
  // Form state
  const [productType, setProductType] = useState<"formation" | "digital_product">("formation");
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mainBenefits, setMainBenefits] = useState("");
  const [priceHint, setPriceHint] = useState("");

  // Result
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!topic.trim()) {
      setError("Décrivez le sujet de votre produit en 1 phrase minimum");
      return;
    }
    setError(null);
    setLoading(true);
    setGenerated(null);
    try {
      const res = await fetch("/api/formations/vendeur/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          topic: topic.trim(),
          targetAudience: targetAudience.trim() || undefined,
          mainBenefits: mainBenefits.trim() || undefined,
          priceHint: priceHint.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setGenerated(j.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">AI Studio</h1>
            <p className="text-sm text-[#5c647a]">Générez une page de vente complète en 30 secondes</p>
          </div>
        </div>
        <p className="text-sm text-[#5c647a] max-w-3xl">
          Décrivez votre formation ou produit en quelques lignes. L'IA génère le titre, la description
          complète, les bénéfices, la cible, et une FAQ — tout en français adapté au marché africain.
          Copiez les éléments vers votre page produit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Form ─── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-20">
          <h2 className="text-base font-bold text-[#191c1e] mb-5">Votre brief</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">Type de produit</label>
              <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setProductType("formation")}
                  className={`flex-1 py-2 text-xs font-bold ${productType === "formation" ? "bg-[#006e2f] text-white" : "bg-white text-[#5c647a]"}`}
                >
                  Formation vidéo
                </button>
                <button
                  onClick={() => setProductType("digital_product")}
                  className={`flex-1 py-2 text-xs font-bold ${productType === "digital_product" ? "bg-[#006e2f] text-white" : "bg-white text-[#5c647a]"}`}
                >
                  Produit digital
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                Sujet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Formation Excel pour débutants, 5h en vidéo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                Public cible <span className="font-normal text-[#5c647a]">(optionnel)</span>
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: Freelances en Afrique francophone"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                Bénéfices principaux <span className="font-normal text-[#5c647a]">(optionnel)</span>
              </label>
              <textarea
                value={mainBenefits}
                onChange={(e) => setMainBenefits(e.target.value)}
                rows={2}
                placeholder="Ex: Maîtriser TCD, formules avancées, automatisation VBA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                Infos prix/volume <span className="font-normal text-[#5c647a]">(optionnel)</span>
              </label>
              <input
                type="text"
                value={priceHint}
                onChange={(e) => setPriceHint(e.target.value)}
                placeholder="Ex: 25 000 F CFA, limité à 100 places"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm bg-rose-50 border border-rose-200 text-rose-800">
                {error}
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Génération en cours (30s)…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  Générer avec l'IA
                </>
              )}
            </button>

            <p className="text-[10px] text-[#5c647a] text-center">
              Powered by OpenAI GPT-4o-mini. Coût estimé ~10 F CFA par génération.
            </p>
          </div>
        </div>

        {/* ─── Result ─── */}
        <div className="lg:col-span-3 space-y-4">
          {!generated && !loading && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300">auto_awesome</span>
              <h3 className="text-lg font-bold text-[#191c1e] mt-3">Votre page va apparaître ici</h3>
              <p className="text-sm text-[#5c647a] mt-2 max-w-md mx-auto">
                Remplissez le formulaire à gauche et cliquez « Générer » pour voir le résultat.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-purple-500 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <p className="text-sm text-[#191c1e] font-bold mt-4">L'IA travaille pour vous…</p>
              <p className="text-xs text-[#5c647a] mt-1">Génération de titre, description, bénéfices, FAQ…</p>
            </div>
          )}

          {generated && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Titre</h3>
                  <CopyButton text={generated.title} />
                </div>
                <p className="text-xl font-extrabold text-[#191c1e] leading-snug">{generated.title}</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Description courte (catalog)</h3>
                  <CopyButton text={generated.shortDesc} />
                </div>
                <p className="text-sm text-[#191c1e]">{generated.shortDesc}</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Public cible</h3>
                  <CopyButton text={generated.targetAudience} />
                </div>
                <p className="text-sm text-[#191c1e]">{generated.targetAudience}</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Ce que vous allez apprendre</h3>
                  <CopyButton text={generated.learnPoints.map((p) => `• ${p}`).join("\n")} />
                </div>
                <ul className="space-y-2">
                  {generated.learnPoints.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#191c1e]">
                      <span className="material-symbols-outlined text-[#006e2f] text-[16px] mt-0.5 flex-shrink-0">check_circle</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Description longue (Markdown)</h3>
                  <CopyButton text={generated.description} />
                </div>
                <div className="prose prose-sm max-w-none text-sm text-[#191c1e] whitespace-pre-wrap bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                  {generated.description}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">FAQ</h3>
                  <CopyButton
                    text={generated.faq.map((f) => `Q: ${f.q}\nR: ${f.a}`).join("\n\n")}
                  />
                </div>
                <div className="space-y-3">
                  {generated.faq.map((f, i) => (
                    <div key={i}>
                      <p className="text-sm font-bold text-[#191c1e]">{f.q}</p>
                      <p className="text-sm text-[#5c647a] mt-1">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-5">
                <p className="text-sm font-bold text-[#191c1e]">Satisfait ? 🎨</p>
                <p className="text-xs text-[#5c647a] mt-1 mb-3">
                  Copiez chaque élément vers votre page produit (titre, description, bénéfices…).
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href="/vendeur/produits/creer?type=formation"
                    className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-[#191c1e] hover:bg-gray-50 inline-flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Créer une formation
                  </Link>
                  <button
                    onClick={() => setGenerated(null)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
                  >
                    Nouvelle génération
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
