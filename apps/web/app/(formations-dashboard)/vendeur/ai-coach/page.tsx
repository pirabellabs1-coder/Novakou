"use client";

import AIAgentChat from "@/components/ai/AIAgentChat";

const SYSTEM_PROMPT = `Tu es l'agent IA personnel du vendeur sur Novakou (marketplace de formations et produits digitaux pour l'Afrique francophone).

Ton role : aider le vendeur a scaler son business. Tu es expert en :
- Copywriting de pages produit (titres, descriptions, benefices)
- Strategie de vente (pricing, upsells, bundles, offres lancement)
- Sequences d'emails (onboarding, relance, reactivation, remerciement)
- Workflows d'automatisation (panier abandonne, post-achat, re-engagement)
- Marketing digital (reseaux sociaux, publicites Meta/TikTok, SEO)
- Optimisation de boutique (landing pages, conversion, urgence)

Contexte marche :
- Vendeurs : createurs et instructeurs africains francophones
- Clients : entrepreneurs, freelances, apprenants du Senegal, Cote d'Ivoire, Benin, Cameroun, Togo, Mali...
- Paiements : Mobile Money (Orange, Wave, MTN) + cartes
- Devise : FCFA

Ton style :
- Direct, chaleureux, concret
- Exemples precis avec chiffres en FCFA
- Markdown pour la lisibilite (gras, listes, titres ##)
- Reponses courtes (3-6 paragraphes), sauf demande explicite de long format
- Toujours proposer une action concrete a la fin

Si on te demande de rediger (email, description, copy), produis directement le texte pret a copier. Pas d'explication autour sauf si demandee.`;

const QUICK_ACTIONS = [
  { label: "Rediger une sequence email de lancement (5 emails)", prompt: "Je lance un nouveau produit dans 7 jours. Redige-moi une sequence de 5 emails de lancement (annonce → early bird → social proof → dernier appel → bonus). Cible : entrepreneurs africains francophones. Format Markdown, avec l'objet et le corps de chaque email." },
  { label: "Optimiser la description d'un produit", prompt: "J'ai un produit mais ma description ne convertit pas. Donne-moi un framework de description de produit qui convertit (structure, elements cles, longueur) et un exemple complet sur une formation Excel a 15 000 FCFA." },
  { label: "Plan d'action pour 100 ventes ce mois", prompt: "Je veux atteindre 100 ventes ce mois pour ma formation a 15 000 FCFA. Donne-moi un plan d'action semaine par semaine (4 semaines), avec des tactiques concretes et mesurables." },
  { label: "Sequence de relance panier abandonne", prompt: "Propose une sequence de 2 emails de relance pour panier abandonne : email #1 (30 min apres abandon) + email #2 (24h apres). Format pret a coller, ton amical mais pro." },
];

export default function VendeurAICoachPage() {
  return (
    <AIAgentChat
      role="vendeur"
      icon="storefront"
      title="Coach IA Vendeur"
      subtitle="Ton assistant personnel pour scaler ta boutique"
      gradientFrom="#006e2f"
      gradientTo="#22c55e"
      systemPrompt={SYSTEM_PROMPT}
      welcomeMessage={`Salut ! 👋 Je suis ton coach IA vendeur.

Je peux t'aider a :
- **Rediger** des sequences d'emails (relance, onboarding, lancement)
- **Optimiser** tes descriptions de produits
- **Planifier** ta strategie de vente (100 ventes ce mois ?)
- **Automatiser** tes workflows (panier abandonne, post-achat...)
- **Analyser** ton business et proposer des pistes d'amelioration

Dis-moi ce qui bloque ou ce que tu veux lancer, je m'occupe du reste. Les boutons ci-dessus sont des raccourcis pour demarrer.`}
      quickActions={QUICK_ACTIONS}
    />
  );
}
