"use client";

import AIAgentChat from "@/components/ai/AIAgentChat";

const SYSTEM_PROMPT = `Tu es l'assistant IA personnel d'un apprenant sur Novakou (plateforme de formations en ligne pour l'Afrique francophone).

Ton role : aider l'apprenant a tirer le maximum de ses formations. Tu es expert en :
- Apprentissage actif (techniques memorisation, prise de notes, flashcards)
- Motivation et discipline (combattre la procrastination, routine d'etude)
- Mise en pratique (projets, exercices, portfolio)
- Orientation carriere (freelance, emploi, entrepreneuriat)
- Resolution de problemes techniques (code, outils, concepts difficiles)

Contexte :
- Apprenants : jeunes adultes, etudiants, freelances debutants, reconvertis pro
- Pays : Senegal, Cote d'Ivoire, Benin, Cameroun, Togo, Mali, France francophone
- Defis typiques : temps limite, connexion instable, budget serre, reseau pro a construire

Ton style :
- Chaleureux, encourageant, concret
- Exemples africains francophones quand c'est pertinent (ville, metier, contexte)
- Markdown pour structurer (bullets, titres ##)
- Reponses breves (3-5 paragraphes max)
- Termine toujours par une action concrete a faire aujourd'hui

Si l'apprenant est bloque sur un concept, explique avec des analogies simples. Si il doute, reassure-le avec des exemples. Ne promets jamais de resultats magiques, sois realiste.`;

const QUICK_ACTIONS = [
  { label: "Plan d'etude 30 jours pour une nouvelle competence", prompt: "Je veux apprendre [a remplir]. Donne-moi un plan d'etude concret sur 30 jours, avec pour chaque semaine : objectif, ressources, exercices et metrique de reussite. Adapte au fait que j'ai 1h/jour disponible." },
  { label: "Explique-moi ce concept simplement", prompt: "Explique-moi [concept technique] comme si j'avais 15 ans, avec une analogie concrete et 2 exemples. Termine par 1 exercice simple pour verifier ma comprehension." },
  { label: "Roadmap pour devenir freelance en [metier]", prompt: "Je veux devenir freelance dans [metier]. Donne-moi une roadmap de 6 mois avec les etapes cles : competences a acquerir, portfolio, premiers clients, pricing. Contexte : je vis en Afrique francophone, je pars de zero." },
  { label: "Comment rester motive malgre les doutes", prompt: "Je perds ma motivation dans ma formation. Aide-moi a identifier la vraie raison (procrastination ? peur ? sujet inadapte ?) et donne-moi 3 techniques concretes pour retrouver de l'elan cette semaine." },
];

export default function ApprenantAICoachPage() {
  return (
    <AIAgentChat
      role="apprenant"
      icon="school"
      title="Coach IA Apprenant"
      subtitle="Ton mentor virtuel pour progresser, rester motive et mettre en pratique"
      gradientFrom="#3b82f6"
      gradientTo="#06b6d4"
      systemPrompt={SYSTEM_PROMPT}
      welcomeMessage={`Salut ! 👋 Je suis ton coach IA apprenant.

Je peux t'aider a :
- **Comprendre** un concept difficile avec des analogies simples
- **Planifier** ton apprentissage (30 jours, 6 mois, objectif clair)
- **Rester motive** quand tu doutes ou procrastinnes
- **Passer a l'action** : premier projet, portfolio, premier client
- **Reussir ta reconversion** vers le freelance ou l'entrepreneuriat

Qu'est-ce qui te bloque aujourd'hui ? Clique un raccourci ou pose directement ta question.`}
      quickActions={QUICK_ACTIONS}
    />
  );
}
