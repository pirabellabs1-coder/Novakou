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
  StCard,
  StPageHeader,
  StButton,
  StSectionTitle,
  StInput,
  StTextarea,
  ST,
} from "@/components/stitch";

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
      className="text-[10px] font-extrabold uppercase tracking-widest hover:bg-[#e6f5eb] px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
      style={{ color: ST.green }}
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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <Script key={`puter-${puterRetryNonce}`} src="https://js.puter.com/v2/" strategy="afterInteractive" />

      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="AI Studio — Générez votre page de vente"
          subtitle="Décrivez votre produit, l'IA génère titre, description, bénéfices et FAQ en 30 secondes."
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Brief form */}
          <div className="lg:col-span-2 h-fit lg:sticky lg:top-6">
            <StCard>
              <StSectionTitle>Votre brief</StSectionTitle>
              <p className="text-[12px] font-semibold -mt-2 mb-4" style={{ color: ST.textSecondary }}>Plus c&apos;est précis, mieux c&apos;est</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Type de produit</label>
                  <div className="flex gap-0 rounded-[12px] overflow-hidden" style={{ border: "1px solid #dde6e0" }}>
                    <button
                      onClick={() => setProductType("formation")}
                      className="flex-1 py-2 text-[12px] font-extrabold transition-colors"
                      style={productType === "formation" ? { background: ST.gradient, color: "#fff" } : { background: "#fff", color: ST.textSecondary }}
                    >
                      Formation vidéo
                    </button>
                    <button
                      onClick={() => setProductType("digital_product")}
                      className="flex-1 py-2 text-[12px] font-extrabold transition-colors"
                      style={productType === "digital_product" ? { background: ST.gradient, color: "#fff" } : { background: "#fff", color: ST.textSecondary }}
                    >
                      Produit digital
                    </button>
                  </div>
                </div>

                <StInput
                  label="Sujet"
                  required
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Formation Excel pour débutants, 5h en vidéo"
                />

                <StInput
                  label="Public cible (optionnel)"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: Freelances en Afrique francophone"
                />

                <StTextarea
                  label="Bénéfices principaux (optionnel)"
                  value={mainBenefits}
                  onChange={(e) => setMainBenefits(e.target.value)}
                  rows={2}
                  placeholder="Ex: Maîtriser TCD, formules avancées, automatisation VBA"
                />

                <StInput
                  label="Infos prix/volume (optionnel)"
                  type="text"
                  value={priceHint}
                  onChange={(e) => setPriceHint(e.target.value)}
                  placeholder="Ex: 25 000 F CFA, limité à 100 places"
                />

                {error && (
                  <div className="px-4 py-3 rounded-[12px] text-[13px] font-semibold flex items-start gap-2" style={{ background: ST.roseSoft, border: "1px solid #f4d4de", color: ST.roseText }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <StButton
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
                </StButton>

                <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-semibold" style={{ color: ST.textSecondary }}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${puterReady ? "" : puterFailed ? "" : "animate-pulse"}`}
                    style={{ background: puterReady ? ST.greenBright : puterFailed ? ST.roseText : "#f59e0b" }}
                  />
                  <span>
                    {puterReady ? "SDK IA prêt · Claude Sonnet 4.6"
                      : puterFailed ? "SDK IA inaccessible"
                      : "Chargement du SDK IA…"}
                  </span>
                  {puterFailed && (
                    <button onClick={puterRetry} className="ml-1 px-1.5 py-0.5 rounded-full text-white text-[9px] font-extrabold" style={{ background: ST.green }}>
                      Réessayer
                    </button>
                  )}
                </div>
                {puterFailed && (
                  <div className="mt-1 rounded-lg p-2.5 text-[10px] leading-snug" style={{ background: ST.amberSoft, border: "1px solid #f3e2bd", color: "#633806" }}>
                    Impossible de charger l&apos;IA. Vérifiez votre connexion et désactivez bloqueurs/VPN/antivirus pour <code className="font-mono px-1 rounded" style={{ background: "#fbeec9" }}>js.puter.com</code>.
                  </div>
                )}
                <p className="text-[10px] font-semibold text-center" style={{ color: ST.textMuted }}>
                  Propulsé par Anthropic Claude via Puter · compte Puter requis la 1ère fois.
                </p>
              </div>
            </StCard>
          </div>

          {/* Result */}
          <div className="lg:col-span-3 space-y-3.5">
            {!generated && !loading && (
              <StCard className="text-center py-12">
                <Sparkles size={44} style={{ color: "#d6e0da" }} className="mx-auto" />
                <h3 className="text-[15px] font-extrabold mt-3" style={{ color: ST.text }}>Votre page va apparaître ici</h3>
                <p className="text-[12.5px] font-semibold mt-1.5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                  Remplissez le formulaire à gauche et cliquez « Générer » pour voir le résultat.
                </p>
              </StCard>
            )}

            {loading && (
              <StCard>
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 mx-auto animate-pulse" style={{ color: ST.greenBright }} />
                  <p className="text-[13.5px] font-extrabold mt-4" style={{ color: ST.text }}>Claude travaille pour vous…</p>
                  <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>Génération du titre, description, bénéfices et FAQ adaptés au marché africain francophone</p>
                  <div className="mt-5 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: ST.greenBright, animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: ST.greenBright, animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: ST.greenBright, animationDelay: "300ms" }} />
                  </div>
                </div>
              </StCard>
            )}

            {generated && (
              <>
                <StCard>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>Titre</h3>
                    <CopyButton text={generated.title} />
                  </div>
                  <p className="text-[19px] font-extrabold leading-snug" style={{ color: ST.text }}>{generated.title}</p>
                </StCard>

                <StCard>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>Description courte (catalog)</h3>
                    <CopyButton text={generated.shortDesc} />
                  </div>
                  <p className="text-[13.5px] font-medium" style={{ color: "#33453b" }}>{generated.shortDesc}</p>
                </StCard>

                <StCard>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>Public cible</h3>
                    <CopyButton text={generated.targetAudience} />
                  </div>
                  <p className="text-[13.5px] font-medium" style={{ color: "#33453b" }}>{generated.targetAudience}</p>
                </StCard>

                <StCard>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>Ce que vous allez apprendre</h3>
                    <CopyButton text={generated.learnPoints.map((p) => `• ${p}`).join("\n")} />
                  </div>
                  <ul className="space-y-2">
                    {generated.learnPoints.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13.5px] font-medium" style={{ color: "#33453b" }}>
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ST.green }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </StCard>

                <StCard>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>Description longue (Markdown)</h3>
                    <CopyButton text={generated.description} />
                  </div>
                  <div className="prose prose-sm max-w-none text-[13.5px] font-medium whitespace-pre-wrap rounded-[12px] p-4 max-h-96 overflow-y-auto" style={{ color: "#33453b", background: "#f6f9f7" }}>
                    {generated.description}
                  </div>
                </StCard>

                <StCard>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>FAQ</h3>
                    <CopyButton
                      text={generated.faq.map((f) => `Q: ${f.q}\nR: ${f.a}`).join("\n\n")}
                    />
                  </div>
                  <div className="space-y-3">
                    {generated.faq.map((f, i) => (
                      <div key={i}>
                        <p className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>{f.q}</p>
                        <p className="text-[13px] font-medium mt-1" style={{ color: ST.textSecondary }}>{f.a}</p>
                      </div>
                    ))}
                  </div>
                </StCard>

                <StCard style={{ background: "#f0faf3", border: "1px solid #d7ecde" }}>
                  <p className="text-[13.5px] font-extrabold" style={{ color: ST.greenDark }}>Satisfait ?</p>
                  <p className="text-[12px] font-semibold mt-1 mb-3" style={{ color: "#2f7a4c" }}>
                    Copiez chaque élément vers votre page produit (titre, description, bénéfices…).
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <StButton variant="secondary" size="sm" icon={Plus} href="/vendeur/produits/creer?type=formation">
                      Créer une formation
                    </StButton>
                    <StButton size="sm" icon={Sparkles} onClick={() => setGenerated(null)}>
                      Nouvelle génération
                    </StButton>
                  </div>
                </StCard>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
