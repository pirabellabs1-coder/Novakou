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
  slug: "vendre-diaspora-africaine",
  title: "Vendre à la diaspora africaine : encaisser en euros depuis l'Afrique",
  subtitle:
    "Activer paiement carte international, ciblage Facebook France/Belgique/Canada, communauté diaspora, prix multi-devises adaptés.",
  category: "Vendre",
  level: "Avancé",
  levelColor: "#14b8a6",
  gradient: "linear-gradient(135deg, #14b8a6, #06b6d4)",
  icon: "public",
  time: "11 min",
  chapters: "9 sections",
  publishedAt: "2026-05-11",
  updatedAt: "2026-05-24",
  keywords: [
    "vendre diaspora africaine",
    "encaisser euros Afrique",
    "diaspora France Sénégal",
    "ciblage Facebook France",
    "vendre formation étranger",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Vendre à la diaspora africaine : encaisser euros";
const SEO_DESCRIPTION =
  "Vendez vos formations à la diaspora africaine et encaissez en euros depuis l'Afrique : paiement carte, ciblage France/Belgique/Canada, prix multi-devises.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Vendre à la diaspora africaine",
)}&subtitle=${encodeURIComponent(
  "Encaisser en euros depuis l'Afrique : carte, ciblage, multi-devises",
)}`;

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: meta.keywords,
  alternates: {
    canonical: `${APP_URL}/guides/${meta.slug}`,
    languages: {
      "fr-FR": `${APP_URL}/guides/${meta.slug}`,
      "x-default": `${APP_URL}/guides/${meta.slug}`,
    },
  },
  openGraph: {
    type: "article",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: `${APP_URL}/guides/${meta.slug}`,
    siteName: "Novakou",
    publishedTime: meta.publishedAt,
    modifiedTime: meta.updatedAt,
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const sections: GuideSection[] = [
  {
    id: "marche",
    label: "La diaspora : un marché de 30 millions de personnes",
    content: (
      <>
        <GP>
          La diaspora africaine francophone représente <GStrong>plus de 30 millions de personnes</GStrong> dans le monde en 2026. France (5M), Belgique (1M), Canada (800k), USA (600k), Allemagne (400k), Suisse (300k), Italie, Espagne, Royaume-Uni...
        </GP>
        <GP>
          Pouvoir d'achat moyen <GStrong>5 à 15 fois supérieur</GStrong> à un résident sur le continent. Un produit que vous vendez 25 000 FCFA (38 €) en Afrique peut se vendre 50-80 € à la diaspora sans aucun frottement de prix.
        </GP>
        <GCallout variant="success" title="Effet boost CA">
          Les créateurs Novakou qui activent activement la diaspora multiplient leur CA mensuel par 2 à 4 en 6 mois. Ratio effort/impact imbattable.
        </GCallout>
      </>
    ),
  },
  {
    id: "produits",
    label: "Quels produits ciblent bien la diaspora",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Formations identité culturelle</GStrong> : apprentissage wolof/lingala/bambara/peul pour les enfants nés à l'étranger.</GLi>
          <GLi><GStrong>Cuisine africaine pro</GStrong> : ouvrir son restaurant, traiteur événementiel, ebook recettes traditionnelles.</GLi>
          <GLi><GStrong>Investissement immobilier en Afrique</GStrong> : grand classique pour la diaspora qui veut investir au pays.</GLi>
          <GLi><GStrong>Création d'entreprise au pays</GStrong> : démarches administratives, fiscalité, partenaires locaux.</GLi>
          <GLi><GStrong>Tresses/coiffure afro</GStrong> : techniques pro pour ouvrir son salon (énorme marché en Europe et Amérique du Nord).</GLi>
          <GLi><GStrong>Wax / couture africaine</GStrong> : créer sa marque, gestion atelier.</GLi>
          <GLi><GStrong>Coaching famille mixte/biculturelle</GStrong> : éducation des enfants, transmission valeurs.</GLi>
          <GLi><GStrong>Anglais business</GStrong> (utile pour la diaspora dans les pays anglophones).</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "paiement",
    label: "Activer le paiement carte international",
    content: (
      <>
        <GP>
          Sur Novakou, le paiement carte (Visa/Mastercard) est <GStrong>activé par défaut</GStrong> sur tous les comptes vendeur. La diaspora paie comme tous les e-commerçants internationaux. Aucune config nécessaire.
        </GP>
        <GH3>Frais et reversement</GH3>
        <GUl>
          <GLi><GStrong>Frais carte</GStrong> : ~2,9 % + 0,30 € (selon le pays).</GLi>
          <GLi><GStrong>Commission Novakou</GStrong> : 10 % (identique aux ventes Mobile Money).</GLi>
          <GLi><GStrong>Conversion devise</GStrong> : automatique en FCFA sur votre portefeuille.</GLi>
          <GLi><GStrong>Délai réception</GStrong> : 5-7 jours ouvrés (vs instantané pour Mobile Money).</GLi>
        </GUl>
        <GH3>Exemple concret</GH3>
        <GP>
          Formation vendue 60 € à un Sénégalais à Paris :
          <br />→ Paiement carte : 60 €
          <br />→ Frais Stripe : -2,04 €
          <br />→ Commission Novakou : -6 €
          <br />→ <GStrong>Vous recevez : ~52 € (≈ 34 000 FCFA)</GStrong>
        </GP>
      </>
    ),
  },
  {
    id: "prix",
    label: "Stratégie de prix multi-devises",
    content: (
      <>
        <GP>
          Vous pouvez afficher différents prix selon la géolocalisation de votre visiteur :
        </GP>
        <GH3>Option 1 : prix unique en FCFA (le plus simple)</GH3>
        <GP>
          Votre prix est par exemple 35 000 FCFA. La diaspora le voit converti en euros (~53 €) au moment du paiement. <GStrong>Avantage</GStrong> : pas de config, transparence.
        </GP>
        <GH3>Option 2 : tarif diaspora explicite</GH3>
        <GP>
          Créez 2 versions de votre produit :
        </GP>
        <GUl>
          <GLi>"Édition Afrique" : 25 000 FCFA (38 €)</GLi>
          <GLi>"Édition Diaspora avec coaching bonus" : 75 € (~ 49 000 FCFA)</GLi>
        </GUl>
        <GP>
          Justifiez la différence par un <GStrong>contenu différencié</GStrong> (séance live, groupe WhatsApp diaspora, etc.). Pas juste une majoration arbitraire.
        </GP>
      </>
    ),
  },
  {
    id: "facebook",
    label: "Ciblage Facebook Ads diaspora",
    content: (
      <>
        <GP>
          Le ciblage le plus efficace sur Meta Ads pour atteindre la diaspora :
        </GP>
        <GH3>Audience à construire</GH3>
        <GUl>
          <GLi><GStrong>Localisation</GStrong> : France + Belgique + Suisse + Canada + USA</GLi>
          <GLi><GStrong>Langue parlée</GStrong> : français</GLi>
          <GLi><GStrong>Centres d'intérêt</GStrong> : noms de pays africains (Sénégal, Côte d'Ivoire, Cameroun...) + groupes culturels (Wolof, Bambara, Peul...)</GLi>
          <GLi><GStrong>Comportements</GStrong> : "expatriés", "voyages fréquents en Afrique"</GLi>
          <GLi><GStrong>Démographie</GStrong> : 25-55 ans (cœur de cible diaspora active)</GLi>
        </GUl>
        <GH3>Budget recommandé</GH3>
        <GP>
          Plus cher qu'une campagne Afrique : <GStrong>15-30 € par jour</GStrong> pour démarrer. CPM en Europe = 4-8 € (vs 0,5-1 € en Afrique). Mais conversion bien plus élevée.
        </GP>
      </>
    ),
  },
  {
    id: "communautes",
    label: "Communautés diaspora à intégrer",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Groupes Facebook</GStrong> : "Sénégalais en France", "Camerounais à Montréal", "Ivoiriens en Belgique"... existent par dizaines. Demandez à intégrer, apportez de la valeur, puis présentez votre offre.</GLi>
          <GLi><GStrong>Associations diaspora</GStrong> : la plupart des grandes villes occidentales ont des associations diaspora. Proposez un partenariat (commission affiliation, conférence offerte, etc.).</GLi>
          <GLi><GStrong>Podcasts diaspora</GStrong> : "Diaspora Powerhouse", "Génération Africaine"... interviewez ou faites-vous interviewer.</GLi>
          <GLi><GStrong>Forums LinkedIn diaspora</GStrong> : groupes pro francophones africains à l'étranger.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "trust",
    label: "Établir la confiance malgré la distance",
    content: (
      <>
        <GP>
          La diaspora est <GStrong>plus méfiante</GStrong> qu'un acheteur local — peur des arnaques fréquentes ciblant les Africains à l'étranger. Renforcez la crédibilité :
        </GP>
        <GUl>
          <GLi><GStrong>Vidéos témoignages diaspora</GStrong> sur votre page produit (un Sénégalais à Paris, un Camerounais à Montréal, etc.).</GLi>
          <GLi><GStrong>Garantie remboursement explicite</GStrong> 14 jours (rassure énormément).</GLi>
          <GLi><GStrong>Numéro de téléphone WhatsApp visible</GStrong> avec votre indicatif local + drapeau (les gens savent qu'ils peuvent vous joindre).</GLi>
          <GLi><GStrong>Mentions presse / réseaux sociaux</GStrong> bien visibles dans la bio.</GLi>
          <GLi><GStrong>Lives Instagram/Facebook hebdomadaires</GStrong> sur des sujets liés à la diaspora.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "fuseaux",
    label: "Adapter votre disponibilité aux fuseaux",
    content: (
      <>
        <GP>
          La diaspora vit dans des fuseaux différents. Si vous voulez convertir, soyez disponible à leurs horaires :
        </GP>
        <GUl>
          <GLi><GStrong>France/Belgique</GStrong> : +1h vs Afrique de l'Ouest. Connectez-vous 20h-22h heure locale = 19h-21h pour eux.</GLi>
          <GLi><GStrong>Canada (Montréal)</GStrong> : -5h vs Afrique de l'Ouest. Connectez-vous tard (22h-minuit) ou tôt le matin (8h-10h).</GLi>
          <GLi><GStrong>USA</GStrong> : -5h à -8h selon côte.</GLi>
        </GUl>
        <GCallout variant="tip" title="Astuce automation">
          Mettez en place une <GStrong>séquence d'emails automatique</GStrong> avec Novakou qui se déclenche dès qu'un inscrit est géolocalisé en Europe/Amérique du Nord. Ils reçoivent une séquence adaptée (langue, références culturelles, mention du décalage horaire pour les Q&A).
        </GCallout>
      </>
    ),
  },
  {
    id: "cas",
    label: "Cas concret : 80 % du CA depuis la diaspora",
    content: (
      <>
        <GP>
          Mariama, créatrice basée à Dakar, vend une formation "Apprendre le Wolof à ton enfant" à 60 € (40 000 FCFA). Ciblage : 100 % diaspora francophone.
        </GP>
        <GUl>
          <GLi>Lancement décembre 2025 sur Novakou.</GLi>
          <GLi>Pub Facebook ciblée France/Belgique/Canada à 20 €/jour.</GLi>
          <GLi>Posts Instagram organiques + 1 podcast diaspora interview.</GLi>
          <GLi><GStrong>Résultat 6 mois plus tard</GStrong> : 220 ventes, CA 13 200 €, net après commissions ~10 500 €.</GLi>
          <GLi>80 % des ventes viennent de la diaspora, 20 % de l'Afrique.</GLi>
        </GUl>
        <GP>
          Pour aller plus loin : <GA href="/guides/publicite-facebook">Pub Facebook avec petit budget</GA> + <GA href="/guides/scaler-catalogue-produits">Étendre votre catalogue</GA>.
        </GP>
      </>
    ),
  },
];

export default function DiasporaGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
