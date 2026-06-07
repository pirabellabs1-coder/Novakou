"use client";

import { useState } from "react";
import Script from "next/script";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Wand2,
} from "lucide-react";
import { usePuterReady } from "@/hooks";
import {
  KazaHero,
  KazaCard,
  KazaButton,
  KazaEmpty,
} from "@/components/kaza";

type PuterContentBlock = { type?: string; text?: string };
type PuterChatResponse = {
  message: { content: string | PuterContentBlock[] };
};

function extractText(res: PuterChatResponse): string {
  const c = res.message?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c
      .map((block) => (block && typeof block === "object" && typeof block.text === "string" ? block.text : ""))
      .join("");
  }
  return "";
}

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
      className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copié !" : label}
    </button>
  );
}

export default function AIStudioPage() {
  const [productType, setProductType] = useState<"formation" | "digital_product">("formation");
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mainBenefits, setMainBenefits] = useState("");
  const [priceHint, setPriceHint] = useState("");

  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { ready: puterReady, failed: puterFailed, retry: puterRetry, retryNonce: puterRetryNonce } = usePuterReady();

  const SYSTEM_PROMPT = `Tu es un copywriter expert specialise dans la vente de formations et produits digitaux pour les createurs africains francophones (Senegal, Cote d'Ivoire, Benin, Cameroun, Mali, Togo...).

Ton style : direct, chaleureux, authentique (ton africain mais pro), phrases courtes et percutantes, focus sur la transformation concrete, zero fake promesses, exemples concrets.

Tu dois generer UNIQUEMENT un objet JSON valide avec ces champs EXACTS :
{
  "title": "string (40-70 chars, accrocheur, benefice principal)",
  "shortDesc": "string (100-160 chars, pour le catalog)",
  "description": "string (Markdown, 800-1500 mots, avec ## titres, listes, gras)",
  "learnPoints": ["6 a 8 benefices concrets, commence par verbe d'action"],
  "targetAudience": "string (50-120 chars, a qui s'adresse le produit)",
  "faq": [{"q": "question", "a": "reponse courte utile"}] (5 elements)
}

Reponds UNIQUEMENT avec le JSON, pas de texte avant ou apres.`;

  async function generate() {
    if (!topic.trim()) {
      setError("Décrivez le sujet de votre produit en 1 phrase minimum");
      return;
    }
    if (!puterReady || !window.puter) {
      setError("Puter.js n'est pas encore chargé. Attendez 2 secondes et réessayez.");
      return;
    }
    setError(null);
    setLoading(true);
    setGenerated(null);

    const typeLabel = productType === "formation" ? "formation video" : "produit digital";
    const userPrompt = `Genere une page de vente pour ce ${typeLabel} :

Sujet : ${topic.trim()}
${targetAudience.trim() ? `Public cible : ${targetAudience.trim()}` : ""}
${mainBenefits.trim() ? `Benefices principaux : ${mainBenefits.trim()}` : ""}
${priceHint.trim() ? `Contexte prix : ${priceHint.trim()}` : ""}

Langue : Francais.

${SYSTEM_PROMPT}`;

    try {
      const response = await window.puter.ai.chat(userPrompt, {
        model: "claude-sonnet-4-6",
        temperature: 0.7,
        max_tokens: 4000,
      });
      const text = extractText(response);

      let jsonText = text.trim();
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) jsonText = jsonMatch[1];

      if (!jsonText.startsWith("{")) {
        const firstBrace = jsonText.indexOf("{");
        const lastBrace = jsonText.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          jsonText = jsonText.slice(firstBrace, lastBrace + 1);
        }
      }

      try {
        const parsed = JSON.parse(jsonText) as Generated;
        if (!parsed.title || !Array.isArray(parsed.learnPoints)) {
          throw new Error("JSON incomplet");
        }
        setGenerated(parsed);
      } catch {
        setError(`L'IA n'a pas renvoye du JSON valide. Texte brut :\n\n${text.slice(0, 400)}...`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Script key={`puter-${puterRetryNonce}`} src="https://js.puter.com/v2/" strategy="afterInteractive" />

      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto space-y-8">
        <KazaHero
          badge="Pro"
          badgeColor="orange"
          icon={Sparkles}
          title="AI Studio — Générez votre page de vente"
          subtitle="Décrivez votre produit, l'IA génère titre, description, bénéfices et FAQ en 30 secondes."
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Brief form */}
          <div className="lg:col-span-2 h-fit lg:sticky lg:top-6">
            <KazaCard title="Votre brief" subtitle="Plus c'est précis, mieux c'est">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Type de produit</label>
                  <div className="flex gap-0 border-2 border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setProductType("formation")}
                      className={`flex-1 py-2 text-xs font-bold transition-colors ${productType === "formation" ? "bg-emerald-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                    >
                      Formation vidéo
                    </button>
                    <button
                      onClick={() => setProductType("digital_product")}
                      className={`flex-1 py-2 text-xs font-bold transition-colors ${productType === "digital_product" ? "bg-emerald-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                    >
                      Produit digital
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Sujet <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Formation Excel pour débutants, 5h en vidéo"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Public cible <span className="font-normal text-slate-500">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Ex: Freelances en Afrique francophone"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bénéfices principaux <span className="font-normal text-slate-500">(optionnel)</span>
                  </label>
                  <textarea
                    value={mainBenefits}
                    onChange={(e) => setMainBenefits(e.target.value)}
                    rows={2}
                    placeholder="Ex: Maîtriser TCD, formules avancées, automatisation VBA"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Infos prix/volume <span className="font-normal text-slate-500">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={priceHint}
                    onChange={(e) => setPriceHint(e.target.value)}
                    placeholder="Ex: 25 000 F CFA, limité à 100 places"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl text-sm bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <KazaButton
                  variant="primary"
                  onClick={generate}
                  disabled={loading || !topic.trim() || !puterReady}
                  icon={loading || !puterReady ? Loader2 : puterFailed ? AlertCircle : Wand2}
                  className="w-full"
                >
                  {loading
                    ? "Claude travaille (30-60s)…"
                    : puterFailed
                      ? "SDK IA inaccessible"
                      : !puterReady
                        ? "Chargement du SDK IA…"
                        : "Générer avec l'IA"}
                </KazaButton>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    puterReady ? "bg-emerald-500" : puterFailed ? "bg-rose-500" : "bg-amber-500 animate-pulse"
                  }`} />
                  <span>
                    {puterReady ? "SDK IA prêt · Claude Sonnet 4.6"
                      : puterFailed ? "SDK IA inaccessible"
                      : "Chargement du SDK IA…"}
                  </span>
                  {puterFailed && (
                    <button onClick={puterRetry} className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-bold hover:bg-emerald-800">
                      Réessayer
                    </button>
                  )}
                </div>
                {puterFailed && (
                  <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[10px] text-amber-900 leading-snug">
                    Impossible de charger l&apos;IA. Vérifiez votre connexion et désactivez bloqueurs/VPN/antivirus pour <code className="font-mono bg-amber-100 px-1 rounded">js.puter.com</code>.
                  </div>
                )}
                <p className="text-[10px] text-slate-500 text-center">
                  Propulsé par Anthropic Claude via Puter · compte Puter requis la 1ère fois.
                </p>
              </div>
            </KazaCard>
          </div>

          {/* Result */}
          <div className="lg:col-span-3 space-y-4">
            {!generated && !loading && (
              <KazaEmpty
                icon={Sparkles}
                title="Votre page va apparaître ici"
                description="Remplissez le formulaire à gauche et cliquez « Générer » pour voir le résultat."
              />
            )}

            {loading && (
              <KazaCard>
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-violet-500 mx-auto animate-pulse" />
                  <p className="text-sm text-slate-900 font-bold mt-4">Claude travaille pour vous…</p>
                  <p className="text-xs text-slate-500 mt-1">Génération du titre, description, bénéfices et FAQ adaptés au marché africain francophone</p>
                  <div className="mt-5 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </KazaCard>
            )}

            {generated && (
              <>
                <KazaCard>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Titre</h3>
                    <CopyButton text={generated.title} />
                  </div>
                  <p className="text-xl font-extrabold text-slate-900 leading-snug">{generated.title}</p>
                </KazaCard>

                <KazaCard>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description courte (catalog)</h3>
                    <CopyButton text={generated.shortDesc} />
                  </div>
                  <p className="text-sm text-slate-900">{generated.shortDesc}</p>
                </KazaCard>

                <KazaCard>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Public cible</h3>
                    <CopyButton text={generated.targetAudience} />
                  </div>
                  <p className="text-sm text-slate-900">{generated.targetAudience}</p>
                </KazaCard>

                <KazaCard>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ce que vous allez apprendre</h3>
                    <CopyButton text={generated.learnPoints.map((p) => `• ${p}`).join("\n")} />
                  </div>
                  <ul className="space-y-2">
                    {generated.learnPoints.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </KazaCard>

                <KazaCard>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description longue (Markdown)</h3>
                    <CopyButton text={generated.description} />
                  </div>
                  <div className="prose prose-sm max-w-none text-sm text-slate-900 whitespace-pre-wrap bg-slate-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                    {generated.description}
                  </div>
                </KazaCard>

                <KazaCard>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">FAQ</h3>
                    <CopyButton
                      text={generated.faq.map((f) => `Q: ${f.q}\nR: ${f.a}`).join("\n\n")}
                    />
                  </div>
                  <div className="space-y-3">
                    {generated.faq.map((f, i) => (
                      <div key={i}>
                        <p className="text-sm font-bold text-slate-900">{f.q}</p>
                        <p className="text-sm text-slate-500 mt-1">{f.a}</p>
                      </div>
                    ))}
                  </div>
                </KazaCard>

                <KazaCard variant="highlighted">
                  <p className="text-sm font-bold text-slate-900">Satisfait ?</p>
                  <p className="text-xs text-slate-600 mt-1 mb-3">
                    Copiez chaque élément vers votre page produit (titre, description, bénéfices…).
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <KazaButton variant="ghost" size="sm" icon={Plus} href="/vendeur/produits/creer?type=formation">
                      Créer une formation
                    </KazaButton>
                    <KazaButton variant="primary" size="sm" icon={Sparkles} onClick={() => setGenerated(null)}>
                      Nouvelle génération
                    </KazaButton>
                  </div>
                </KazaCard>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
