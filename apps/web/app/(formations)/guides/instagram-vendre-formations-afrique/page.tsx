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
  slug: "instagram-vendre-formations-afrique",
  title: "Instagram pour vendre vos formations : stratégie organique 2026",
  subtitle:
    "Bio optimisée, Reels qui convertissent, DM stratégique, hashtags Afrique francophone. 0 budget pub, résultats mesurables en 30 jours.",
  category: "Promouvoir",
  level: "Intermédiaire",
  levelColor: "#ec4899",
  gradient: "linear-gradient(135deg, #ec4899, #f97316)",
  icon: "photo_camera",
  time: "13 min",
  chapters: "11 sections",
  publishedAt: "2026-05-17",
  updatedAt: "2026-05-24",
  keywords: [
    "Instagram vendre formation",
    "Reels Afrique francophone",
    "marketing Instagram Sénégal",
    "DM Instagram convertir",
    "Instagram créateur digital",
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
    id: "bio",
    label: "Bio Instagram qui convertit en 3 secondes",
    content: (
      <>
        <GP>
          Vous avez <GStrong>3 secondes</GStrong> pour convaincre quelqu'un de cliquer sur votre lien. Votre bio Instagram doit dire 3 choses :
        </GP>
        <GUl>
          <GLi><GStrong>Qui vous aidez</GStrong> (audience cible).</GLi>
          <GLi><GStrong>Quel résultat</GStrong> ils obtiennent.</GLi>
          <GLi><GStrong>Comment</GStrong> (votre méthode/produit, en 1 mot).</GLi>
        </GUl>
        <GH3>Exemples qui marchent</GH3>
        <GUl>
          <GLi>"J'aide les femmes entrepreneures africaines à vendre via Instagram. 50+ formées. Formation 7j gratuite ↓"</GLi>
          <GLi>"Excel pour les compta de PME. Maîtrisez les TCD en 4h. Formation pro depuis 25k FCFA ↓"</GLi>
          <GLi>"Anglais business pour décrocher un job remote depuis l'Afrique. 200+ élèves placés. Méthode complète ↓"</GLi>
        </GUl>
        <GCallout variant="tip" title="Lien de bio">
          Mettez votre lien direct vers votre <GStrong>boutique Novakou</GStrong> (page la plus rentable) ou utilisez un outil type Linktree pour proposer plusieurs liens. Évitez les blogs ou réseaux secondaires — l'utilisateur veut acheter ou s'inscrire, pas découvrir.
        </GCallout>
      </>
    ),
  },
  {
    id: "highlights",
    label: "Highlights : votre vitrine permanente",
    content: (
      <>
        <GP>
          Vos Highlights (couvertures arrondies sous la bio) sont la <GStrong>2e chose vue</GStrong> par un visiteur. Structurez-les comme une mini-landing page :
        </GP>
        <GUl>
          <GLi><GStrong>"Témoignages"</GStrong> : screenshots de DM/messages de clients satisfaits.</GLi>
          <GLi><GStrong>"Formation"</GStrong> : présentation de votre offre principale en 5-7 stories.</GLi>
          <GLi><GStrong>"FAQ"</GStrong> : les 5 questions qu'on vous pose le plus.</GLi>
          <GLi><GStrong>"Méthode"</GStrong> : votre approche unique en 3-4 stories.</GLi>
          <GLi><GStrong>"Behind"</GStrong> : votre quotidien de créateur (humanise).</GLi>
        </GUl>
        <GP>
          Couvertures : design cohérent sur Canva, fond uni couleur de marque, icône simple, texte 1-2 mots max.
        </GP>
      </>
    ),
  },
  {
    id: "reels",
    label: "Reels : le format n°1 en 2026",
    content: (
      <>
        <GP>
          Instagram pousse <GStrong>massivement les Reels</GStrong> (vidéos verticales 15-60s) dans l'algorithme. Un Reel a en moyenne <GStrong>10x plus de portée</GStrong> qu'un post photo classique.
        </GP>
        <GH3>Structure d'un Reel qui marche</GH3>
        <GUl>
          <GLi><GStrong>3 premières secondes</GStrong> = HOOK ultra-fort. "Si tu fais [erreur X], stop tout de suite." ou "Voici comment j'ai fait [résultat Y]".</GLi>
          <GLi><GStrong>10-30 secondes</GStrong> = développement (3 points max, sous-titres obligatoires).</GLi>
          <GLi><GStrong>Fin</GStrong> = CTA léger : "Sauvegarde ce reel" ou "Lien en bio pour la méthode complète".</GLi>
        </GUl>
        <GH3>Fréquence recommandée</GH3>
        <GP>
          Minimum <GStrong>3 Reels par semaine</GStrong> pendant les 3 premiers mois pour que l'algorithme vous identifie comme créateur actif. Au-delà, 2 par semaine + 1 carrousel pédagogique suffisent.
        </GP>
      </>
    ),
  },
  {
    id: "carrousels",
    label: "Carrousels : le format qui éduque et sauvegarde",
    content: (
      <>
        <GP>
          Les carrousels (10 slides max) ont le <GStrong>plus haut taux de sauvegarde</GStrong> sur Instagram. Et les sauvegardes sont un fort signal positif pour l'algorithme.
        </GP>
        <GH3>Structure type</GH3>
        <GUl>
          <GLi><GStrong>Slide 1</GStrong> : titre fort + chiffre (ex: "7 erreurs qui tuent vos ventes sur Instagram").</GLi>
          <GLi><GStrong>Slides 2-8</GStrong> : un point par slide, visuel clair, max 30 mots.</GLi>
          <GLi><GStrong>Slide 9</GStrong> : récap.</GLi>
          <GLi><GStrong>Slide 10</GStrong> : CTA "Sauvegarde + partage + lien en bio".</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "hashtags",
    label: "Hashtags Afrique francophone qui marchent",
    content: (
      <>
        <GP>
          La règle : <GStrong>mélanger 30 % gros + 50 % moyens + 20 % niche</GStrong>. Utilisez 8 à 15 hashtags max par post (au-delà, l'algorithme considère que vous spammez).
        </GP>
        <GH3>Hashtags Afrique francophone éprouvés</GH3>
        <GUl>
          <GLi><GStrong>Gros (1M+ posts)</GStrong> : #entrepreneurafrique #digitalmarketingafrica #afriquefrancophone</GLi>
          <GLi><GStrong>Moyens (100k-500k)</GStrong> : #entrepreneurseneagal #businessfemininafrique #formationenlignefr</GLi>
          <GLi><GStrong>Niche (10k-100k)</GStrong> : #vendreenligneafrique #formationdigitalefr #createurdigitalafrique</GLi>
        </GUl>
        <GCallout variant="warning" title="Évitez">
          Les hashtags génériques anglais (#business, #success) qui vous noient dans des millions de posts. Préférez le francophone Afrique, beaucoup moins saturé.
        </GCallout>
      </>
    ),
  },
  {
    id: "dm",
    label: "DM stratégique : convertir vos viewers",
    content: (
      <>
        <GP>
          Les DM Instagram convertissent <GStrong>3 à 5 fois mieux</GStrong> que les commentaires publics. Voici 3 tactiques éprouvées :
        </GP>
        <GH3>1. DM aux nouveaux abonnés (24h max)</GH3>
        <GP>
          "Bienvenue ! Merci de me suivre. Tu cherches à atteindre quoi en ce moment ?" Personnel, non-commercial. Lance la conversation.
        </GP>
        <GH3>2. DM aux engagements forts</GH3>
        <GP>
          Quelqu'un like + sauvegarde + commente votre post ? DM-le : "J'ai vu que tu as bien aimé mon post sur [X]. Tu en es où sur ce sujet ?". Conversion 15-25 %.
        </GP>
        <GH3>3. DM aux "voir plus" de Stories</GH3>
        <GP>
          Les gens qui ouvrent vos Stories régulièrement sont vos plus chauds. Faites une Story avec un sticker "Question" sur votre sujet, puis DM ceux qui répondent.
        </GP>
      </>
    ),
  },
  {
    id: "calendrier",
    label: "Calendrier éditorial mensuel",
    content: (
      <>
        <GP>
          Plus de <GStrong>50 % des créateurs abandonnent</GStrong> Instagram dans les 90 premiers jours par manque de constance. Un calendrier mensuel résout ça.
        </GP>
        <GH3>Modèle 4 semaines × 4 piliers</GH3>
        <GUl>
          <GLi><GStrong>Pilier "Éducation"</GStrong> : 1 carrousel ou Reel pédagogique par semaine.</GLi>
          <GLi><GStrong>Pilier "Preuve sociale"</GStrong> : 1 témoignage client par semaine.</GLi>
          <GLi><GStrong>Pilier "Personnel"</GStrong> : 1 Story "behind the scenes" par jour.</GLi>
          <GLi><GStrong>Pilier "Offre"</GStrong> : 1 post commercial par semaine MAX (pas plus, sinon vous saturez).</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "collab",
    label: "Collaborations entre créateurs",
    content: (
      <>
        <GP>
          La méthode la plus rapide pour gagner 500-2000 followers qualifiés en 1 post : <GStrong>collaborer avec un créateur du même niveau ou légèrement au-dessus</GStrong> dans une niche complémentaire.
        </GP>
        <GP>
          Format gagnant : un Reel "co-créé" (les 2 noms en byline) où chacun apporte sa partie. Mention mutuelle dans la bio pendant 1 semaine.
        </GP>
        <GCallout variant="tip" title="Trouver des partenaires">
          Cherchez sur Instagram avec vos hashtags de niche. Engagez sincèrement sur 3-5 posts d'un créateur pendant 1 semaine, puis DM avec une proposition concrète de collab. Acceptation : 30-40 % si vous êtes sincère et précis.
        </GCallout>
      </>
    ),
  },
  {
    id: "analytics",
    label: "Quels chiffres surveiller (et lesquels ignorer)",
    content: (
      <>
        <GH3>À surveiller</GH3>
        <GUl>
          <GLi><GStrong>Taux de sauvegarde</GStrong> (saves/portée) : indicateur n°1 de qualité de contenu.</GLi>
          <GLi><GStrong>Clic sur lien bio</GStrong> : conversion finale.</GLi>
          <GLi><GStrong>DM reçus par semaine</GStrong> : qualité de votre positionnement.</GLi>
          <GLi><GStrong>Croissance d'abonnés qualifiés</GStrong> par semaine.</GLi>
        </GUl>
        <GH3>À ignorer</GH3>
        <GUl>
          <GLi>Nombre de likes (vanity metric, ne corrèle pas avec les ventes).</GLi>
          <GLi>Nombre brut de followers (préférez la qualité à la quantité).</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "instagram-vs-pub",
    label: "Quand passer à la publicité Facebook/Instagram",
    content: (
      <>
        <GP>
          Le travail organique sur Instagram prend 3-6 mois pour porter ses fruits. Quand vous avez <GStrong>5-10 témoignages clients vérifiés</GStrong> et un contenu organique qui convertit, c'est le moment d'amplifier avec la pub payante.
        </GP>
        <GP>
          Voir aussi : <GA href="/guides/publicite-facebook">Publicité Facebook pour vendre en Afrique</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "checklist",
    label: "Votre checklist 30 premiers jours",
    content: (
      <>
        <GUl>
          <GLi>✅ Bio optimisée (qui vous aidez + résultat + CTA).</GLi>
          <GLi>✅ 5 highlights (Témoignages, Formation, FAQ, Méthode, Behind).</GLi>
          <GLi>✅ 12 Reels publiés (3 par semaine).</GLi>
          <GLi>✅ 4 carrousels pédagogiques (1 par semaine).</GLi>
          <GLi>✅ DM personnalisés aux 50 premiers nouveaux abonnés.</GLi>
          <GLi>✅ 4 témoignages clients récoltés.</GLi>
          <GLi>✅ Lien bio pointant directement sur votre boutique Novakou.</GLi>
        </GUl>
      </>
    ),
  },
];

export default function InstagramGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
