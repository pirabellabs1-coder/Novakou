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
  slug: "scaler-catalogue-produits",
  title: "Passer de 1 formation à un catalogue complet (×10 votre revenu)",
  subtitle:
    "Bundles, abonnements, formations complémentaires, ladder de prix. Multiplier le panier moyen et la lifetime value de chaque client.",
  category: "Vendre",
  level: "Avancé",
  levelColor: "#d946ef",
  gradient: "linear-gradient(135deg, #d946ef, #ec4899)",
  icon: "inventory_2",
  time: "13 min",
  chapters: "10 sections",
  publishedAt: "2026-05-10",
  updatedAt: "2026-05-24",
  keywords: [
    "scaler business digital",
    "augmenter panier moyen",
    "catalogue produits formation",
    "bundle abonnement Novakou",
    "ladder de prix",
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
    label: "Pourquoi 1 produit = un plafond de revenu",
    content: (
      <>
        <GP>
          Avec une seule formation à 25 000 FCFA, votre revenu maximum est <GStrong>fonction directe du nombre de nouveaux acheteurs</GStrong>. Chaque mois, vous repartez de zéro à chercher du trafic, de la pub, des prospects.
        </GP>
        <GP>
          Avec un catalogue complet, un même client génère <GStrong>3 à 8 ventes successives</GStrong> au lieu de 1. Vous augmentez votre LTV (Lifetime Value) sans aucun coût d'acquisition supplémentaire.
        </GP>
        <GCallout variant="success" title="Math simple">
          1 formation à 25k = 25 000 FCFA par client. Catalogue (formation + bundle complémentaire + abonnement mensuel 12 mois) = <GStrong>~250 000 FCFA par client engagé</GStrong>. ×10 sans changer de stratégie acquisition.
        </GCallout>
      </>
    ),
  },
  {
    id: "ladder",
    label: "Le ladder de prix : monter en gamme progressivement",
    content: (
      <>
        <GP>
          Stratégie éprouvée : créer une <GStrong>échelle de produits</GStrong> du gratuit au premium. Chaque marche prépare la suivante.
        </GP>
        <GH3>Échelle type Afrique francophone</GH3>
        <GUl>
          <GLi><GStrong>Niveau 0 — Gratuit</GStrong> : ebook ou mini-cours (lead magnet pour collecter emails)</GLi>
          <GLi><GStrong>Niveau 1 — Entrée (5-15k FCFA)</GStrong> : ebook complet, mini-formation, template</GLi>
          <GLi><GStrong>Niveau 2 — Core (25-50k FCFA)</GStrong> : votre formation principale</GLi>
          <GLi><GStrong>Niveau 3 — Premium (100-250k FCFA)</GStrong> : coaching de groupe ou cohorte 3 mois</GLi>
          <GLi><GStrong>Niveau 4 — Elite (500k-1M+ FCFA)</GStrong> : accompagnement individuel 6 mois, mastermind</GLi>
        </GUl>
        <GP>
          Pas besoin de tout créer en même temps. Lancez le Niveau 2 (Core) d'abord, ajoutez les autres niveaux au fur et à mesure que votre audience grandit.
        </GP>
      </>
    ),
  },
  {
    id: "bundles",
    label: "Bundles : doubler le panier moyen sans effort",
    content: (
      <>
        <GP>
          Un bundle = un pack qui combine plusieurs produits avec une réduction. C'est <GStrong>le levier le plus simple</GStrong> pour augmenter votre panier moyen.
        </GP>
        <GH3>Exemple concret</GH3>
        <GUl>
          <GLi>Formation Excel pro : 25k FCFA</GLi>
          <GLi>Pack 10 templates Excel : 15k FCFA</GLi>
          <GLi>Mini-cours Power BI : 20k FCFA</GLi>
          <GLi><GStrong>Total individuel : 60k FCFA</GStrong></GLi>
          <GLi><GStrong>Bundle "Excel Master" : 45k FCFA</GStrong> (vous donnez 15k de réduction, mais vous vendez les 3 d'un coup)</GLi>
        </GUl>
        <GP>
          Activation : <GStrong>Vendeur → Bundles</GStrong> dans Novakou. Sélectionnez les produits + fixez le prix bundle. Page de vente générée automatiquement.
        </GP>
        <GCallout variant="info" title="Stat Novakou">
          25 % des acheteurs choisissent le bundle quand il est proposé en alternative au produit unique. Et leur panier moyen est <GStrong>80 % plus élevé</GStrong> qu'en moyenne.
        </GCallout>
      </>
    ),
  },
  {
    id: "abonnement",
    label: "Abonnement : passer du transactionnel au récurrent",
    content: (
      <>
        <GP>
          L'abonnement est <GStrong>la plus grande révolution business</GStrong> de ces 10 dernières années. Au lieu d'une vente unique, vous touchez 15-50k FCFA par mois récurrent pendant 6-24 mois en moyenne.
        </GP>
        <GH3>Formats d'abonnement qui marchent en Afrique</GH3>
        <GUl>
          <GLi><GStrong>Communauté privée</GStrong> : groupe WhatsApp/Discord + 1 live mensuel + ressources. Prix : 10-25k FCFA/mois.</GLi>
          <GLi><GStrong>Coaching de groupe</GStrong> : 2 sessions Zoom par mois + revue de progrès individuelle. Prix : 25-50k FCFA/mois.</GLi>
          <GLi><GStrong>Bibliothèque évolutive</GStrong> : accès à toutes vos formations + 1 nouvelle par mois. Prix : 15-30k FCFA/mois.</GLi>
          <GLi><GStrong>Newsletter premium</GStrong> : analyses + outils pro chaque semaine. Prix : 5-15k FCFA/mois.</GLi>
        </GUl>
        <GH3>Activer sur Novakou</GH3>
        <GP>
          <GStrong>Vendeur → Abonnements (Memberships)</GStrong>. Définissez le contenu inclus, prix mensuel/annuel, période d'essai (7-14 jours recommandé), nombre max de membres si vous voulez créer la rareté.
        </GP>
      </>
    ),
  },
  {
    id: "upsell",
    label: "Upsell post-achat : monétiser l'instant clé",
    content: (
      <>
        <GP>
          Le moment où votre client vient de sortir sa carte est le <GStrong>moment psychologique d'or</GStrong>. Il est en mode "achat", peu de friction.
        </GP>
        <GH3>Règles d'un bon upsell</GH3>
        <GUl>
          <GLi><GStrong>Complémentaire</GStrong> au produit acheté (pas un produit aléatoire)</GLi>
          <GLi>Prix ≤ <GStrong>60 % du produit principal</GStrong></GLi>
          <GLi>Disponible <GStrong>seulement à cet instant</GStrong> (créer l'urgence)</GLi>
          <GLi>1 clic pour accepter (pas de re-saisie carte)</GLi>
        </GUl>
        <GP>
          Conversion upsell moyenne sur Novakou : <GStrong>22-40 %</GStrong> quand bien construit. Sur 100 acheteurs = +22 à 40 ventes "gratuites".
        </GP>
        <GP>
          Voir aussi : <GA href="/guides/tunnel-de-vente-novakou">Construire votre tunnel avec upsell</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "calendrier",
    label: "Calendrier de lancement progressif (12 mois)",
    content: (
      <>
        <GH3>Modèle pour passer de 1 à 8 produits</GH3>
        <GUl>
          <GLi><GStrong>Mois 1-3</GStrong> : votre Core (formation principale 25-35k).</GLi>
          <GLi><GStrong>Mois 4</GStrong> : un Entry (ebook ou template 10-15k).</GLi>
          <GLi><GStrong>Mois 5</GStrong> : un Upsell complémentaire (10-15k).</GLi>
          <GLi><GStrong>Mois 6</GStrong> : un Bundle de tout (35-45k).</GLi>
          <GLi><GStrong>Mois 7-8</GStrong> : votre Premium (coaching 100-200k).</GLi>
          <GLi><GStrong>Mois 9</GStrong> : lancement abonnement communauté (15-25k/mois).</GLi>
          <GLi><GStrong>Mois 10</GStrong> : une 2e formation Core (différent angle).</GLi>
          <GLi><GStrong>Mois 11-12</GStrong> : bundle annuel + offre Elite.</GLi>
        </GUl>
        <GP>
          À la fin de l'année 1, vous avez <GStrong>8 produits actifs</GStrong> + un abonnement récurrent. Un client engagé peut générer 200-500k FCFA cumulés.
        </GP>
      </>
    ),
  },
  {
    id: "cross-sell",
    label: "Cross-sell par email : réactiver vos anciens clients",
    content: (
      <>
        <GP>
          Vos meilleurs clients futurs sont vos anciens clients. Une séquence email cross-sell bien faite réactive 8-15 % d'anciens clients par mois.
        </GP>
        <GH3>Trigger automatique Novakou</GH3>
        <GUl>
          <GLi><GStrong>30 jours après achat</GStrong> : "Tu as fini la formation X ? Voici la suite logique" → propose votre Bundle ou Premium.</GLi>
          <GLi><GStrong>90 jours après achat</GStrong> : invitation à votre abonnement communauté.</GLi>
          <GLi><GStrong>1 an après</GStrong> : offre VIP fidélité (-30 % sur n'importe quel produit).</GLi>
        </GUl>
        <GP>
          Voir aussi : <GA href="/guides/email-marketing-5-emails-vendent">5 emails qui vendent</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "metric",
    label: "Métriques business à suivre",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Panier moyen (Average Order Value)</GStrong> : montant moyen d'une commande. Objectif : +20 % chaque 3 mois.</GLi>
          <GLi><GStrong>Lifetime Value (LTV)</GStrong> : revenu total moyen par client sur 12 mois. Objectif : ×2 en 6 mois grâce au catalogue.</GLi>
          <GLi><GStrong>Taux de re-achat 90 jours</GStrong> : % de clients qui achètent un 2e produit dans les 90j. Objectif : 30 %+.</GLi>
          <GLi><GStrong>MRR (Monthly Recurring Revenue)</GStrong> : revenu récurrent issu des abonnements. Objectif : 30-50 % du CA total à 12 mois.</GLi>
          <GLi><GStrong>Churn abonnement</GStrong> : % d'annulations mensuelles. Objectif : &lt; 5 %.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "pieges",
    label: "Pièges à éviter en scalant",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Trop de produits = confusion</GStrong>. Si votre catalogue dépasse 10 produits, créez des collections claires (par niveau, par cas d'usage).</GLi>
          <GLi><GStrong>Cannibalisation</GStrong> : un nouveau produit qui remplace un ancien sans ajouter de valeur. Vérifiez que chaque nouveau produit cible un besoin distinct.</GLi>
          <GLi><GStrong>Promesses gonflées</GStrong> sur les premiums : à 250k FCFA, le client exige des résultats. Soyez prêt à délivrer (vraies sessions, vrai suivi).</GLi>
          <GLi><GStrong>Manque de support</GStrong> sur les abonnements : le churn explose si vous n'êtes pas présent dans la communauté. Réservez 2-3h/semaine MINIMUM pour les membres.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "next",
    label: "Quelle prochaine étape pour vous ?",
    content: (
      <>
        <GP>
          Selon où vous en êtes :
        </GP>
        <GUl>
          <GLi><GStrong>0 produit</GStrong> : commencez par votre Core. Voir <GA href="/guides/lancement-30-jours">Lancement 30 jours</GA>.</GLi>
          <GLi><GStrong>1 produit qui marche</GStrong> : créez votre 1er Bundle. Sur Novakou : <GA href="/vendeur/bundles">Bundles</GA>.</GLi>
          <GLi><GStrong>3-5 produits</GStrong> : lancez votre 1er abonnement. Sur Novakou : <GA href="/vendeur/memberships">Abonnements</GA>.</GLi>
          <GLi><GStrong>Catalogue varié</GStrong> : optimisez votre programme d'affiliation. Voir <GA href="/guides/affiliation-recruter-affilies">Affiliation</GA>.</GLi>
        </GUl>
      </>
    ),
  },
];

export default function ScalerCatalogueGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
