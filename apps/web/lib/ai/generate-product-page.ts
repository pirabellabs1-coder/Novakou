/**
 * Generateur IA pour les pages produit Novakou.
 *
 * Utilise OpenAI GPT-4o-mini (rapide + bon marche) pour generer :
 *   - title accrocheur
 *   - shortDesc (1-2 lignes pour le catalog)
 *   - description (texte long pour la page produit, format Markdown)
 *   - learnPoints (6-8 benefices pour apprenant)
 *   - targetAudience (1-2 lignes)
 *   - faq (5 questions/reponses)
 *
 * Si OPENAI_API_KEY manque, throw une erreur explicite.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export interface GenerateInput {
  // Contexte minimum requis
  productType: "formation" | "digital_product";
  topic: string; // "Formation Excel pour debutants"
  targetAudience?: string; // "Freelances en Afrique francophone"
  language?: "fr" | "en";

  // Contexte optionnel (plus il y a, meilleur le resultat)
  mainBenefits?: string; // "apprendre en 5h, de zero a pro"
  priceHint?: string; // "Prix FCFA 25000, ecouler 100 copies"
  competitors?: string;
}

export interface GeneratedPage {
  title: string;
  shortDesc: string;
  description: string; // Markdown
  learnPoints: string[];
  targetAudience: string;
  faq: Array<{ q: string; a: string }>;
}

const SYSTEM_PROMPT = `Tu es un copywriter expert specialise dans la vente de formations et produits digitaux pour les createurs africains francophones (Senegal, Cote d'Ivoire, Benin, Cameroun, Mali, Togo...).

Ton style :
- Direct, chaleureux, authentique (ton africain mais pro)
- Phrases courtes et percutantes (pas d'anglicismes excessifs)
- Focus sur la transformation concrete (de X a Y en Z mois)
- Zero exageration ou fake promesses (pas de "changez votre vie" vide)
- Exemples concrets quand possible

Tu generes TOUJOURS en JSON valide strict, avec ces champs EXACTS :
{
  "title": "string (40-70 caracteres, accrocheur, inclut le benefice principal)",
  "shortDesc": "string (100-160 caracteres, pour le catalog)",
  "description": "string (Markdown, 800-1500 mots, avec ## titres, listes, gras)",
  "learnPoints": ["6 a 8 benefices concrets, commence par un verbe d'action"],
  "targetAudience": "string (50-120 caracteres, a qui s'adresse ce produit)",
  "faq": [{"q": "question", "a": "reponse courte et utile"}] (5 elements)
}

JAMAIS de texte avant ou apres le JSON. Juste le JSON.`;

export async function generateProductPage(input: GenerateInput): Promise<GeneratedPage> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY non configuree dans Vercel. Ajoute-la dans Settings > Environment Variables.");
  }

  const language = input.language || "fr";
  const typeLabel = input.productType === "formation" ? "formation video" : "produit digital (ebook, template, etc.)";

  const userPrompt = `Genere une page de vente complete pour ce ${typeLabel} :

Sujet : ${input.topic}
${input.targetAudience ? `Public cible : ${input.targetAudience}` : ""}
${input.mainBenefits ? `Benefices principaux : ${input.mainBenefits}` : ""}
${input.priceHint ? `Contexte prix : ${input.priceHint}` : ""}
${input.competitors ? `Concurrents : ${input.competitors}` : ""}

Langue : ${language === "fr" ? "Francais" : "English"}

Genere le JSON complet.`;

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Reponse OpenAI vide");

  let parsed: GeneratedPage;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`JSON invalide de OpenAI : ${(e as Error).message}`);
  }

  // Validation minimale
  if (!parsed.title || !parsed.description || !Array.isArray(parsed.learnPoints)) {
    throw new Error("JSON OpenAI incomplet (champs manquants)");
  }

  return parsed;
}
