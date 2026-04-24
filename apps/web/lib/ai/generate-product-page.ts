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

/**
 * DEMO MODE : si OPENAI_API_KEY absent ou invalide (commence par sk-abcdef
 * ou autre placeholder), on retourne un contenu template realiste adapte au
 * topic entre. Permet de tester l'UI sans budget OpenAI.
 *
 * Quand le vendeur ajoute une vraie cle, le demo mode desactive automatiquement.
 */
function generateDemoPage(input: GenerateInput): GeneratedPage {
  const isFormation = input.productType === "formation";
  const topic = input.topic;
  const audience = input.targetAudience || "créateurs et entrepreneurs africains francophones";
  const benefits = input.mainBenefits || "compétences pratiques immédiatement applicables";

  const type = isFormation ? "formation" : "produit";
  const titleVariants = [
    `Maîtrisez ${topic} en quelques heures`,
    `${topic} — la méthode complète`,
    `${topic} de zéro à expert`,
    `${topic} : le guide pratique`,
  ];
  const title = titleVariants[Math.floor(Math.random() * titleVariants.length)];

  return {
    title,
    shortDesc: `${type === "formation" ? "Formation complète" : "Ressource pratique"} sur ${topic}. Conçu pour ${audience}.`,
    description: `## À propos de cette ${type}

${topic} n'est plus un mystère. Cette ${type} vous donne les bases solides et les techniques avancées pour avancer concrètement.

## Ce que vous allez obtenir

Vous ne trouverez pas de théorie inutile ici. Chaque section est pensée pour **résultat immédiat**. Vous apprenez ${benefits}, avec des exemples concrets tirés du quotidien des ${audience}.

## Pourquoi choisir cette ${type}

- **Conçue pour l'Afrique francophone** : exemples locaux, réalité de terrain
- **Format court** : vous avancez vite, sans perdre de temps
- **Applications concrètes** : chaque leçon = une action réalisable immédiatement
- **Support continu** : vous n'êtes jamais seul face à une question

## Pour qui ?

Parfaite si vous êtes :
- Débutant complet qui veut des fondations solides
- Autodidacte qui veut structurer ses connaissances
- Professionnel qui veut passer au niveau supérieur

## Votre investissement

Quelques heures de votre temps + un abonnement mobile money. En retour : une compétence qui peut vous rapporter 10× plus tout au long de votre carrière.

---

*Cette description est générée en mode démo. Ajoutez une clé OpenAI pour avoir une génération IA complète et personnalisée.*`,
    learnPoints: [
      `Comprendre les fondamentaux de ${topic}`,
      "Appliquer les techniques sur des cas réels",
      "Éviter les erreurs courantes qui ralentissent 90% des débutants",
      "Construire un système pour progresser en continu",
      "Mesurer vos résultats concrètement",
      "Gagner en confiance et en efficacité",
    ],
    targetAudience: `Cette ${type} s'adresse aux ${audience} qui veulent maîtriser ${topic}.`,
    faq: [
      { q: `Je suis débutant, est-ce adapté ?`, a: `Oui. Nous partons des bases et avançons progressivement. Aucune connaissance préalable n'est requise.` },
      { q: `Combien de temps ça prend ?`, a: `${isFormation ? "Environ 5 à 8 heures" : "Vous pouvez consulter tout le contenu en 2 heures"}, à votre rythme. Accès illimité.` },
      { q: `Y a-t-il un support si j'ai des questions ?`, a: `Oui, vous avez accès à la communauté des apprenants + vous pouvez poser des questions directement sur chaque leçon.` },
      { q: `Puis-je suivre sur mobile ?`, a: `Absolument. Tout est pensé mobile-first, vous pouvez apprendre depuis votre téléphone partout.` },
      { q: `Combien ça coûte ?`, a: `Voir le prix en haut de cette page. Paiement Mobile Money, carte bancaire, ou virement.` },
    ],
  };
}

export async function generateProductPage(input: GenerateInput): Promise<GeneratedPage> {
  const apiKey = process.env.OPENAI_API_KEY;

  // DEMO MODE : cle manquante ou placeholder evident
  const isDemoKey = !apiKey ||
    apiKey.includes("abcdef") ||
    apiKey === "sk-xxxxxxxx" ||
    apiKey.length < 20;
  if (isDemoKey) {
    // Simule un delai IA (2s) pour que l'UI affiche le spinner normalement
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return generateDemoPage(input);
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
