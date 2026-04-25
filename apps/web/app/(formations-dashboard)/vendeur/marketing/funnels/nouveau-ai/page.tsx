"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";

// ─── Typage Puter ──────────────────────────────────────────────
type PuterContentBlock = { type?: string; text?: string };
type PuterChatResponse = {
  message: { content: string | PuterContentBlock[] };
};
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          prompt: string,
          options?: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean },
        ) => Promise<PuterChatResponse>;
      };
    };
  }
}
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

// ─── Types Funnel generes ──────────────────────────────────────
type FunnelBlock = { id?: string; type: string; data: Record<string, unknown> };
type FunnelStep = {
  stepType: "LANDING" | "PRODUCT" | "UPSELL" | "THANK_YOU";
  title: string;
  headlineFr?: string;
  descriptionFr?: string;
  ctaTextFr?: string;
  discountPct?: number;
  blocks?: FunnelBlock[];
};
type GeneratedFunnel = {
  name: string;
  description: string;
  theme?: { primaryColor?: string; accentColor?: string };
  steps: FunnelStep[];
};

// ─── Prompt systeme ────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un expert en tunnels de vente (funnels) pour la plateforme Novakou, qui cible les createurs et entrepreneurs africains francophones (Senegal, Cote d'Ivoire, Benin, Cameroun, Togo, Mali...).

Ton role : generer un tunnel de vente COMPLET et PRET A PUBLIER avec des copy qui convertissent.

Ton style :
- Direct, chaleureux, authentique (ton africain mais pro)
- Phrases courtes et percutantes
- Focus sur la transformation (de X a Y en Z)
- Preuves sociales avec noms africains (Aminata, Kouakou, Fatou, Ibrahim, Aicha...)
- Prix et chiffres en FCFA quand pertinent
- Zero fake promesses exagerees

Tu dois generer UNIQUEMENT un objet JSON valide strict avec cette structure EXACTE :

{
  "name": "string (nom interne du funnel, 20-60 chars)",
  "description": "string (1-2 phrases, pour que le vendeur se souvienne)",
  "theme": { "primaryColor": "#006e2f", "accentColor": "#22c55e" },
  "steps": [
    {
      "stepType": "LANDING",
      "title": "Page de vente",
      "headlineFr": "string (headline principal, 40-80 chars)",
      "ctaTextFr": "string (texte du bouton, 15-30 chars)",
      "blocks": [
        { "type": "hero", "data": { "badge": "string (10-20 chars, ex: 'Nouveau' ou 'Offre limitee')", "headline": "string (40-80 chars)", "subheadline": "string (60-140 chars)", "ctaText": "string (15-30 chars)", "imageUrl": "" }},
        { "type": "features", "data": { "title": "string (20-50 chars, ex: 'Ce que vous allez apprendre')", "items": [ { "icon": "check_circle", "title": "string (15-40 chars)", "desc": "string (40-100 chars)" } ] }},
        { "type": "testimonials", "data": { "title": "string (20-50 chars)", "items": [ { "name": "string (prenom + nom africain)", "role": "string (metier + ville)", "text": "string (80-180 chars, authentique)", "rating": 5 } ] }},
        { "type": "faq", "data": { "title": "Questions frequentes", "items": [ { "q": "string (question naturelle)", "a": "string (reponse directe 60-180 chars)" } ] }},
        { "type": "cta", "data": { "headline": "string (30-70 chars)", "subheadline": "string (60-140 chars)", "ctaText": "string (15-30 chars)" }}
      ]
    },
    {
      "stepType": "PRODUCT",
      "title": "Checkout",
      "headlineFr": "Finalisez votre commande",
      "ctaTextFr": "Payer maintenant",
      "blocks": []
    },
    {
      "stepType": "UPSELL",
      "title": "Offre exclusive",
      "headlineFr": "string (ex: 'Une derniere offre pour doubler vos resultats !')",
      "descriptionFr": "string (100-250 chars, explique le produit complementaire et pourquoi c'est utile)",
      "ctaTextFr": "string (ex: 'Oui j'ajoute cette offre')",
      "discountPct": 50,
      "blocks": [
        { "type": "heading", "data": { "text": "string (titre de l'upsell)" }},
        { "type": "text", "data": { "content": "string (argumentaire 150-400 chars en markdown simple)" }},
        { "type": "cta", "data": { "headline": "string", "subheadline": "string", "ctaText": "string" }}
      ]
    },
    {
      "stepType": "THANK_YOU",
      "title": "Merci",
      "headlineFr": "Felicitations ! Votre acces est pret",
      "descriptionFr": "string (100-300 chars, confirme l'achat + prochaines etapes : verifier email, rejoindre communaute, etc.)",
      "ctaTextFr": "Acceder au contenu",
      "blocks": [
        { "type": "heading", "data": { "text": "Felicitations !" }},
        { "type": "text", "data": { "content": "string (message de remerciement + 3 prochaines etapes claires)" }}
      ]
    }
  ]
}

CONTRAINTES STRICTES :
- Exactement 4 steps dans l'ordre : LANDING, PRODUCT, UPSELL, THANK_YOU
- Dans LANDING : au moins hero + features (3-4 items) + testimonials (2-3 items) + faq (3-5 items) + cta
- Icones features : utilise ces noms material-symbols valides : check_circle, rocket_launch, support_agent, schedule, verified, groups, lightbulb, trending_up, workspace_premium, insights, psychology, school, star
- Ratings testimonials : toujours 5
- imageUrl toujours "" (le vendeur uploadera)
- PRODUCT step : blocks TOUJOURS [] (c'est le checkout, rendu par Novakou)
- Reponds UNIQUEMENT avec le JSON, RIEN avant, RIEN apres, pas de \`\`\`json.`;

// ─── Types catalogue ───────────────────────────────────────────
type CatalogItem = {
  kind: "formation" | "product";
  id: string;
  title: string;
  image: string | null;
  price: number;
  isFree: boolean;
  status: string;
};

// ─── Composant ─────────────────────────────────────────────────
export default function AIFunnelBuilderPage() {
  const router = useRouter();

  // Catalog
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);

  // Form
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [goal, setGoal] = useState("");

  // State
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedFunnel | null>(null);
  const [puterReady, setPuterReady] = useState(false);

  // Load catalog
  useEffect(() => {
    fetch("/api/formations/vendeur/catalog")
      .then((r) => r.json())
      .then((j) => setCatalog(j.data ?? []))
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, []);

  // Check Puter availability
  useEffect(() => {
    const check = () => {
      if (typeof window !== "undefined" && window.puter) {
        setPuterReady(true);
        return true;
      }
      return false;
    };
    if (!check()) {
      const interval = setInterval(() => { if (check()) clearInterval(interval); }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  function handleCatalogSelect(value: string) {
    if (!value) { setSelectedCatalogItem(null); return; }
    const [kind, id] = value.split("::");
    const item = catalog.find((c) => c.kind === kind && c.id === id);
    if (item) {
      setSelectedCatalogItem(item);
      if (!product.trim()) setProduct(item.title);
      if (!price.trim()) setPrice(`${new Intl.NumberFormat("fr-FR").format(item.price)} FCFA`);
    }
  }

  async function generate() {
    if (!product.trim()) {
      setError("Décrivez votre produit en 1 phrase minimum");
      return;
    }
    if (!puterReady || !window.puter) {
      setError("Le SDK IA n'est pas encore chargé, réessayez dans 2 secondes.");
      return;
    }
    setError(null);
    setLoading(true);
    setGenerated(null);

    const productContext = selectedCatalogItem
      ? `\nDONNEES DU PRODUIT EXISTANT :\n- Titre exact : ${selectedCatalogItem.title}\n- Type : ${selectedCatalogItem.kind === "formation" ? "Formation en ligne" : "Produit digital"}\n- Prix : ${new Intl.NumberFormat("fr-FR").format(selectedCatalogItem.price)} FCFA\n- Utilise ce titre et ce prix dans le tunnel.\n`
      : "";

    const userPrompt = `Genere un tunnel de vente complet en 4 etapes pour ce produit :

Produit : ${product.trim()}
${audience.trim() ? `Public cible : ${audience.trim()}` : ""}
${price.trim() ? `Prix : ${price.trim()}` : ""}
${goal.trim() ? `Objectif du vendeur : ${goal.trim()}` : ""}
${productContext}

Langue : Francais (avec touches africaines naturelles).
Le tunnel doit convertir un visiteur froid en acheteur, puis en client VIP grace a l'upsell.

${SYSTEM_PROMPT}`;

    try {
      const response = await window.puter.ai.chat(userPrompt, {
        model: "claude-sonnet-4-6",
        temperature: 0.7,
        max_tokens: 6000,
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

      const parsed = JSON.parse(jsonText) as GeneratedFunnel;
      if (!parsed.name || !Array.isArray(parsed.steps) || parsed.steps.length < 3) {
        throw new Error("JSON incomplet : manque name ou steps (min 3)");
      }
      setGenerated(parsed);
    } catch (e) {
      setError(
        e instanceof Error
          ? `L'IA a retourné un JSON invalide : ${e.message}. Réessayez (la température introduit de la variation).`
          : "Erreur inconnue",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createFunnel() {
    if (!generated) return;
    setCreating(true);
    setError(null);
    try {
      const payload = {
        ...generated,
        ...(selectedCatalogItem?.kind === "formation" && { formationId: selectedCatalogItem.id }),
        ...(selectedCatalogItem?.kind === "product" && { productId: selectedCatalogItem.id }),
      };
      const res = await fetch("/api/formations/vendeur/funnels/ai-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur lors de la création");
      }
      const json = await res.json();
      router.push(`/vendeur/marketing/funnels/${json.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setCreating(false);
    }
  }

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
          <Link href="/vendeur/marketing/funnels" className="hover:text-[#006e2f] transition-colors">
            Funnels de vente
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#191c1e] font-medium">Générer avec l&apos;IA</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Tunnel de vente par IA</h1>
            <p className="text-sm text-[#5c647a]">Claude génère un tunnel complet prêt à publier en 30 secondes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Form ─── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 h-fit lg:sticky lg:top-20">
          <h2 className="text-base font-bold text-[#191c1e] mb-1">Votre brief</h2>
          <p className="text-xs text-[#5c647a] mb-5">Plus vous êtes précis, meilleur est le tunnel.</p>

          <div className="space-y-4">
            {/* Product selector from catalog */}
            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                Sélectionnez votre produit <span className="font-normal text-[#5c647a]">(optionnel)</span>
              </label>
              {catalogLoading ? (
                <div className="text-xs text-[#5c647a] px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                  Chargement du catalogue…
                </div>
              ) : catalog.length === 0 ? (
                <div className="text-xs text-[#5c647a] px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  Aucun produit dans votre catalogue. Décrivez votre produit manuellement ci-dessous.
                </div>
              ) : (
                <select
                  value={selectedCatalogItem ? `${selectedCatalogItem.kind}::${selectedCatalogItem.id}` : ""}
                  onChange={(e) => handleCatalogSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="">— Choisir un produit existant —</option>
                  {catalog.filter((c) => c.kind === "formation").length > 0 && (
                    <optgroup label="Formations">
                      {catalog.filter((c) => c.kind === "formation").map((c) => (
                        <option key={c.id} value={`${c.kind}::${c.id}`}>
                          {c.title} — {new Intl.NumberFormat("fr-FR").format(c.price)} FCFA
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {catalog.filter((c) => c.kind === "product").length > 0 && (
                    <optgroup label="Produits digitaux">
                      {catalog.filter((c) => c.kind === "product").map((c) => (
                        <option key={c.id} value={`${c.kind}::${c.id}`}>
                          {c.title} — {new Intl.NumberFormat("fr-FR").format(c.price)} FCFA
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
              {selectedCatalogItem && (
                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  L&apos;IA adaptera le tunnel à ce produit.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                Produit ou formation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                rows={3}
                placeholder="Ex: Formation vidéo pour créer son premier site WordPress en 1 weekend, sans coder"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                Public cible <span className="font-normal text-[#5c647a]">(optionnel)</span>
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Ex: Freelances et petits entrepreneurs en Afrique francophone"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                Prix <span className="font-normal text-[#5c647a]">(optionnel)</span>
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 25 000 FCFA, ou 39 EUR"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                Objectif principal <span className="font-normal text-[#5c647a]">(optionnel)</span>
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ex: Vendre 100 copies ce mois, offre de lancement limitée"
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
              disabled={loading || !product.trim() || !puterReady || creating}
              className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Claude construit votre tunnel…
                </>
              ) : !puterReady ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Chargement du SDK IA…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  Générer mon tunnel
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#5c647a]">
              <span className={`w-1.5 h-1.5 rounded-full ${puterReady ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
              <span>{puterReady ? "SDK IA prêt · Claude Sonnet 4.6" : "Chargement du SDK IA…"}</span>
            </div>
            <p className="text-[10px] text-[#5c647a] text-center">
              Propulsé par Claude via Puter · compte Puter requis la 1ère fois.
            </p>
          </div>
        </div>

        {/* ─── Resultat ─── */}
        <div className="lg:col-span-3 space-y-4">
          {!generated && !loading && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300">account_tree</span>
              <h3 className="text-lg font-bold text-[#191c1e] mt-3">Votre tunnel va apparaître ici</h3>
              <p className="text-sm text-[#5c647a] mt-2 max-w-md mx-auto">
                Claude va générer 4 étapes complètes : landing, checkout, upsell, page de remerciement — avec tous les textes, témoignages et FAQ.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-purple-500 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <p className="text-sm text-[#191c1e] font-bold mt-4">Claude construit votre tunnel…</p>
              <p className="text-xs text-[#5c647a] mt-1">Landing, checkout, upsell, remerciement — avec textes, témoignages, FAQ…</p>
              <div className="mt-5 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {generated && (
            <>
              {/* Titre du funnel */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-1">Nom du funnel</p>
                <h2 className="text-xl font-extrabold text-[#191c1e]">{generated.name}</h2>
                {generated.description && <p className="text-sm text-[#5c647a] mt-1">{generated.description}</p>}
              </div>

              {/* Apercu des etapes */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-base font-bold text-[#191c1e] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006e2f]">route</span>
                  Les 4 étapes de votre tunnel
                </h3>
                <div className="space-y-3">
                  {generated.steps.map((step, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-[#006e2f]/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#006e2f]/10 flex items-center justify-center text-[#006e2f] font-bold text-sm flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#006e2f]">{step.stepType}</p>
                            {step.discountPct && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                -{step.discountPct}%
                              </span>
                            )}
                          </div>
                          {step.headlineFr && (
                            <p className="text-sm font-bold text-[#191c1e] mb-1">{step.headlineFr}</p>
                          )}
                          {step.descriptionFr && (
                            <p className="text-xs text-[#5c647a] mb-2 line-clamp-2">{step.descriptionFr}</p>
                          )}
                          {Array.isArray(step.blocks) && step.blocks.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap mt-2">
                              {step.blocks.map((b, j) => (
                                <span key={j} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#5c647a]">
                                  {b.type}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => { setGenerated(null); }}
                  className="flex-1 px-5 py-3 rounded-xl text-sm font-bold text-[#5c647a] border border-gray-200 hover:bg-gray-50 inline-flex items-center justify-center gap-2"
                  disabled={creating}
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Regénérer
                </button>
                <button
                  onClick={createFunnel}
                  disabled={creating}
                  className="flex-1 px-5 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  {creating ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      Création du funnel…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                      Créer et éditer ce tunnel
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-[#5c647a] text-center">
                Le funnel sera créé en brouillon. Vous pourrez modifier tout le contenu avant de le publier.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
