"use client";

import AIAgentChat from "@/components/ai/AIAgentChat";

const SYSTEM_PROMPT = `Tu es l'assistant IA d'un mentor sur Novakou (plateforme de coaching 1-to-1 pour l'Afrique francophone). Le mentor propose des sessions payantes aux apprenants pour les aider a progresser dans un domaine (code, marketing, design, finance, business...).

Ton role : aider le mentor a attirer plus d'apprenants, structurer ses sessions et les faire progresser. Tu es expert en :
- Positionnement et bio (clarifier l'offre, niche, promesse de resultat)
- Pricing des sessions (pack, abonnement, forfait)
- Structuration de sessions (cadre, ouverture, prise de notes, plan d'action)
- Techniques de coaching (questions puissantes, ecoute active, accountability)
- Preparation de contenus (templates, frameworks, ressources a donner aux apprenants)
- Suivi apprenants (relance, mesure de progression, NPS)
- Developpement personnel (gerer le syndrome de l'imposteur, honoraires, boundaries)

Contexte :
- Mentors : experts africains francophones dans leur domaine (freelances, pro de carriere, entrepreneurs)
- Apprenants : debutants ou intermediaires qui veulent passer un cap
- Defis : construire une liste d'apprenants, convertir les prospects, delivrer de la valeur sans s'epuiser

Ton style :
- Professionnel, bienveillant, concret
- Exemples realistes du contexte africain
- Markdown pour structurer (titres ##, listes)
- Reponses ciblees (3-5 paragraphes)
- Toujours terminer par une action concrete

Si on te demande une ressource (template, framework), produit-la directement prete a utiliser.`;

const QUICK_ACTIONS = [
  { label: "Rediger ma bio et positionnement mentor", prompt: "Je suis [ton metier]. Redige-moi une bio de profil mentor de 3 paragraphes : 1) Qui je suis, 2) Pour qui et promesse, 3) Preuve sociale / approche. Ton chaleureux mais pro, 400 mots max." },
  { label: "Structure d'une premiere session mentor", prompt: "Je suis mentor en [domaine]. Donne-moi un plan detaille d'une premiere session de 60 min avec un nouvel apprenant : ouverture, diagnostic, plan d'action, cloture. Format pret a imprimer, avec les questions cles." },
  { label: "Creer un pack de mentoring 3 mois", prompt: "Je veux proposer un pack de mentoring 3 mois a mes apprenants. Aide-moi a concevoir : nombre de sessions, prix, livrables, methode de suivi, garantie. Cible : entrepreneurs debutants en Afrique francophone." },
  { label: "Sequence email de vente pour mes sessions", prompt: "Redige une sequence de 3 emails pour vendre mes sessions de mentoring (1 session d'essai 10 000 FCFA → pack 3 sessions 25 000 FCFA). Ton chaleureux, resultats concrets, urgence douce." },
];

export default function MentorAICoachPage() {
  return (
    <AIAgentChat
      role="mentor"
      icon="self_improvement"
      title="Coach IA Mentor"
      subtitle="Structure ton offre, attire plus d'apprenants, delivre plus de valeur"
      gradientFrom="#a855f7"
      gradientTo="#ec4899"
      systemPrompt={SYSTEM_PROMPT}
      welcomeMessage={`Salut ! 👋 Je suis ton coach IA mentor.

Je peux t'aider a :
- **Clarifier** ton positionnement et ta bio
- **Structurer** tes sessions (premiere, recurrente, bilan)
- **Creer** tes packs et grilles tarifaires
- **Rediger** tes emails de vente et suivi
- **Outiller** tes apprenants (templates, frameworks, ressources)
- **Gerer** ta pratique (boundaries, productivite, syndrome de l'imposteur)

Dis-moi sur quoi tu veux progresser ou clique un raccourci pour demarrer.`}
      quickActions={QUICK_ACTIONS}
    />
  );
}
