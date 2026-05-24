import type { Metadata } from "next";
import {
  GuideArticleLayout,
  GP,
  GH3,
  GUl,
  GLi,
  GStrong,
  GA,
  GCallout,
  type GuideMeta,
  type GuideSection,
} from "@/components/formations/GuideArticleLayout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

const meta: GuideMeta = {
  slug: "linkedin-personal-branding-expert",
  title: "Personal branding LinkedIn pour expert africain : profil, posts, DM",
  subtitle:
    "Profil optimisé, 3 posts par semaine qui marchent, DM commercial sans paraître spammy, convertir followers en acheteurs de formations.",
  category: "Promouvoir",
  level: "Intermédiaire",
  levelColor: "#0077b5",
  gradient: "linear-gradient(135deg, #0077b5, #0ea5e9)",
  icon: "person",
  time: "14 min",
  chapters: "10 sections",
  publishedAt: "2026-05-12",
  updatedAt: "2026-05-24",
  keywords: [
    "LinkedIn personal branding Afrique",
    "LinkedIn vendre formation",
    "expert LinkedIn francophone",
    "DM LinkedIn commercial",
    "post LinkedIn viral",
  ],
};

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${meta.title} | Guides Novakou`,
  description: meta.subtitle,
  keywords: meta.keywords,
  alternates: {
    canonical: `${APP_URL}/guides/${meta.slug}`,
    languages: {
      "fr-FR": `${APP_URL}/guides/${meta.slug}`,
      "fr-SN": `${APP_URL}/guides/${meta.slug}`,
      "fr-CI": `${APP_URL}/guides/${meta.slug}`,
      "x-default": `${APP_URL}/guides/${meta.slug}`,
    },
  },
  openGraph: {
    type: "article",
    title: meta.title,
    description: meta.subtitle,
    url: `${APP_URL}/guides/${meta.slug}`,
    siteName: "Novakou",
    publishedTime: meta.publishedAt,
    modifiedTime: meta.updatedAt,
  },
};

const sections: GuideSection[] = [
  {
    id: "pourquoi",
    label: "Pourquoi LinkedIn est sous-exploité par les Africains",
    content: (
      <>
        <GP>
          En Afrique francophone, LinkedIn compte <GStrong>plus de 30 millions de membres</GStrong> en 2026, dont une part énorme de jeunes pros qualifiés. Et pourtant : moins de 5 % des créateurs digitaux y publient régulièrement.
        </GP>
        <GP>
          Résultat : <GStrong>la concurrence est faible</GStrong> et la portée organique reste excellente. Un post LinkedIn moyen pour un compte avec 1k connexions atteint 500-2000 vues. Pour comparaison : un post Instagram dans la même niche fait 50-150 vues organiques en 2026.
        </GP>
        <GCallout variant="success" title="Audience qualifiée">
          LinkedIn = pros qui ont un salaire mensuel. Pouvoir d'achat élevé. Conversion sur formations professionnelles (Excel, anglais business, comptabilité, code, marketing) : <GStrong>2 à 4 fois supérieure</GStrong> à Instagram en Afrique.
        </GCallout>
      </>
    ),
  },
  {
    id: "profil",
    label: "Optimiser votre profil en 4 étapes",
    content: (
      <>
        <GH3>1. Photo de profil pro (3 minutes)</GH3>
        <GP>
          Fond uni (mur blanc/beige). Visage cadré (haut du buste). Sourire naturel. Tenue pro adaptée à votre secteur (pas obligatoirement costume).
        </GP>
        <GH3>2. Bannière qui vend (10 minutes sur Canva)</GH3>
        <GP>
          Template gratuit Canva → "LinkedIn cover". Mettez : votre nom, votre value proposition en 1 phrase, votre formation phare avec prix.
        </GP>
        <GH3>3. Headline magnétique (la partie sous votre nom)</GH3>
        <GP>
          Au lieu de "Assistante administrative chez X" → écrivez ce que vous APPORTEZ : "J'aide les PME africaines à automatiser leur comptabilité Excel | Formation 4h depuis 25k FCFA"
        </GP>
        <GH3>4. Section "Info" structurée AIDA</GH3>
        <GP>
          <GStrong>Attention</GStrong> (problème de votre cible en 1 phrase) → <GStrong>Intérêt</GStrong> (votre histoire courte) → <GStrong>Désir</GStrong> (résultats que vous délivrez) → <GStrong>Action</GStrong> (lien Novakou).
        </GP>
      </>
    ),
  },
  {
    id: "format-post",
    label: "Format de post qui cartonne sur LinkedIn",
    content: (
      <>
        <GH3>Structure éprouvée (Hook + Story + Lesson)</GH3>
        <GUl>
          <GLi><GStrong>Hook ligne 1-2</GStrong> : provocation, chiffre choc, ou question.</GLi>
          <GLi><GStrong>Story 3-7 lignes</GStrong> : récit personnel ou expérience client.</GLi>
          <GLi><GStrong>Leçon 2-3 lignes</GStrong> : ce qu'on retient.</GLi>
          <GLi><GStrong>Liste actionnable 3-5 points</GStrong> (optionnel mais boost la lecture).</GLi>
          <GLi><GStrong>Question finale</GStrong> qui invite au commentaire.</GLi>
        </GUl>
        <GH3>Règles techniques</GH3>
        <GUl>
          <GLi><GStrong>Sauts de ligne entre chaque phrase</GStrong> (mobile friendly).</GLi>
          <GLi>Pas plus de <GStrong>1300 caractères</GStrong> (au-delà LinkedIn tronque "voir plus").</GLi>
          <GLi>Pas de lien externe dans le corps du post (ça tue la portée). Mettez le lien en commentaire 1.</GLi>
          <GLi>3-5 hashtags max à la fin.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "exemple-post",
    label: "Exemple de post qui a fait 50k vues",
    content: (
      <>
        <GCallout variant="info" title="Post viral type">
          <GP>
            <GStrong>J'ai perdu 3 ans avant de comprendre ça.</GStrong>
            <br /><br />
            En 2023, je passais 12h/jour à enseigner Excel à des PME pour 5 000 FCFA la séance.
            <br /><br />
            Burnout total après 18 mois.
            <br /><br />
            Puis j'ai compris UNE chose qui a tout changé :
            <br /><br />
            → Ce n'est pas mon temps qu'on achète. C'est ma transformation.
            <br /><br />
            J'ai créé une formation vidéo 4h sur Excel pro.
            <br />Prix : 25 000 FCFA.
            <br />Délivrée en automatique 24/7.
            <br /><br />
            <GStrong>Résultat 6 mois plus tard :</GStrong>
            <br /><br />
            → 187 ventes
            <br />→ 4 675 000 FCFA de CA
            <br />→ 0h de coaching individuel
            <br />→ Temps libre récupéré pour ma famille
            <br /><br />
            Si tu vends ton TEMPS aujourd'hui, tu plafonnes.
            <br /><br />
            Crée un produit qui scale.
            <br /><br />
            Vous en êtes où vous ?
            <br /><br />
            #entrepreneurafrique #formationenligne #excel #digital
          </GP>
        </GCallout>
        <GP>
          Pourquoi ce post marche : hook personnel + transformation chiffrée + leçon actionnable + question ouverte.
        </GP>
      </>
    ),
  },
  {
    id: "frequence",
    label: "Fréquence : 3 posts par semaine, pendant 90 jours",
    content: (
      <>
        <GP>
          C'est le rythme minimum pour que l'algorithme LinkedIn vous identifie comme créateur sérieux et amplifie votre portée.
        </GP>
        <GH3>Planning idéal</GH3>
        <GUl>
          <GLi><GStrong>Lundi 8h</GStrong> : storytime motivation pour démarrer la semaine.</GLi>
          <GLi><GStrong>Mercredi 12h</GStrong> : conseil pratique + listicle actionnable.</GLi>
          <GLi><GStrong>Vendredi 17h</GStrong> : témoignage client ou retour d'expérience.</GLi>
        </GUl>
        <GCallout variant="tip" title="Batch creation">
          Réservez 2h le dimanche soir pour rédiger les 3 posts de la semaine. Programmez avec Buffer ou Hootsuite (free tier). Zéro stress quotidien.
        </GCallout>
      </>
    ),
  },
  {
    id: "engagement",
    label: "Engagement réciproque : la clé sous-utilisée",
    content: (
      <>
        <GP>
          L'algorithme LinkedIn récompense les <GStrong>conversations</GStrong> bien plus que les vues passives. Tactique éprouvée :
        </GP>
        <GH3>La règle 60 minutes</GH3>
        <GP>
          Dans l'heure qui suit votre post, répondez à <GStrong>TOUS</GStrong> les commentaires. Pas un like rapide — une vraie réponse 2-3 phrases qui relance la conversation.
        </GP>
        <GH3>Engagement croisé avec 10 pairs</GH3>
        <GP>
          Identifiez 10 créateurs francophones africains complémentaires (pas concurrents directs). Likez + commentez 1 de leurs posts par jour. Réciproquement, ils interagiront avec les vôtres. Effet boule de neige.
        </GP>
      </>
    ),
  },
  {
    id: "dm",
    label: "DM LinkedIn : sans paraître spammy",
    content: (
      <>
        <GP>
          Le DM LinkedIn convertit <GStrong>5 à 10 fois mieux</GStrong> qu'un post générique. Mais 95 % des DM sont du spam. Voici comment être dans les 5 % qui marchent :
        </GP>
        <GH3>Règle d'or : DONNER avant de demander</GH3>
        <GH3>Template gagnant (à personnaliser)</GH3>
        <GCallout variant="info" title="Premier DM type">
          <GP>
            Salut [Prénom],
            <br /><br />
            J'ai vu ton dernier post sur [sujet précis du post]. Ce que tu as dit sur [point précis] m'a fait penser à [votre angle d'expérience].
            <br /><br />
            J'ai partagé quelques retours d'expérience sur ce sujet dans une <GStrong>ressource gratuite</GStrong> que j'ai préparée : [lien lead magnet].
            <br /><br />
            Pas d'engagement, prends ce qui peut t'aider.
            <br /><br />
            Bon courage avec [contexte précis lui/elle] !
            <br />[Votre nom]
          </GP>
        </GCallout>
        <GP>
          Taux de réponse mesuré : <GStrong>30-40 %</GStrong>. Conversion en client : 5-10 % sur les répondants.
        </GP>
      </>
    ),
  },
  {
    id: "newsletter",
    label: "LinkedIn Newsletter : votre arme secrète 2026",
    content: (
      <>
        <GP>
          LinkedIn pousse <GStrong>massivement les newsletters</GStrong> depuis 2024. C'est gratuit, et chaque édition est notifiée aux abonnés (vrai mail + notif LinkedIn).
        </GP>
        <GH3>Activer votre newsletter</GH3>
        <GP>
          Profil → "Créer un mode créateur" → activer "Newsletter". Vous pouvez en lancer une par sujet ciblé. Ex : "Sénégal Business Weekly", "Excel pour PME", "Marketing digital Côte d'Ivoire".
        </GP>
        <GH3>Format gagnant</GH3>
        <GUl>
          <GLi>1 édition par semaine, même jour même heure (régularité &gt; volume).</GLi>
          <GLi>Format article 500-800 mots avec sous-titres H2/H3.</GLi>
          <GLi>1 image cover (Canva).</GLi>
          <GLi>CTA discret en fin (formation Novakou, podcast, etc.).</GLi>
        </GUl>
        <GCallout variant="success" title="Effet long terme">
          Une newsletter à 500 abonnés engagés vaut plus qu'un compte à 5000 followers passifs. La consultation par édition est <GStrong>10× supérieure</GStrong> à un post classique.
        </GCallout>
      </>
    ),
  },
  {
    id: "metrics",
    label: "Métriques à suivre",
    content: (
      <>
        <GUl>
          <GLi><GStrong>SSI (Social Selling Index)</GStrong> : score LinkedIn 0-100, à consulter mensuellement. Objectif &gt; 50.</GLi>
          <GLi><GStrong>Croissance connexions/abonnés</GStrong> par semaine.</GLi>
          <GLi><GStrong>Vues moyennes par post</GStrong> sur 7 derniers posts.</GLi>
          <GLi><GStrong>Taux d'engagement</GStrong> (likes + comments / vues). Objectif &gt; 5 %.</GLi>
          <GLi><GStrong>Clics sur lien bio/profil</GStrong> (Novakou tracker).</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "convertir",
    label: "Convertir LinkedIn → ventes Novakou",
    content: (
      <>
        <GP>
          Aucune vente directe sur LinkedIn. Le parcours est :
        </GP>
        <GUl>
          <GLi><GStrong>Post LinkedIn</GStrong> attire l'attention</GLi>
          <GLi><GStrong>Profil consulté</GStrong> → ils voient votre offre dans la bannière + section "Info"</GLi>
          <GLi><GStrong>Lien lead magnet</GStrong> dans votre headline → ils s'inscrivent</GLi>
          <GLi><GStrong>Séquence emails Novakou</GStrong> → conversion en acheteur sur les 14 jours suivants</GLi>
        </GUl>
        <GP>
          Voir aussi : <GA href="/guides/email-marketing-5-emails-vendent">Les 5 emails qui vendent</GA> + <GA href="/guides/tunnel-de-vente-novakou">Construire votre tunnel Novakou</GA>.
        </GP>
      </>
    ),
  },
];

export default function LinkedInGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
