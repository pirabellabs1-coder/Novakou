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
  slug: "fixer-prix-formation",
  title: "Combien faire payer ma formation ? Méthode pricing complète",
  subtitle:
    "Tableaux de prix par type de contenu en FCFA. Comment éviter de sous-vendre, justifier un prix premium, prix d'ancrage et upsell.",
  category: "Vendre",
  level: "Débutant",
  levelColor: "#16a34a",
  gradient: "linear-gradient(135deg, #16a34a, #84cc16)",
  icon: "sell",
  time: "9 min",
  chapters: "6 sections",
  publishedAt: "2026-05-19",
  updatedAt: "2026-05-24",
  keywords: [
    "prix formation en ligne Afrique",
    "tarif ebook FCFA",
    "pricing produit digital",
    "combien vendre formation",
    "pricing stratégie créateur",
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
      "fr-CM": `${APP_URL}/guides/${meta.slug}`,
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
    id: "erreur",
    label: "L'erreur n°1 : sous-vendre",
    content: (
      <>
        <GP>
          90 % des débutants en Afrique fixent leur premier prix <GStrong>3 à 5 fois trop bas</GStrong>. Raison : ils pensent que "personne ne paiera plus cher". Faux.
        </GP>
        <GP>
          Vos acheteurs paient pour <GStrong>la transformation qu'ils obtiennent</GStrong>, pas pour le nombre d'heures de vidéo ni pour les frais que vous avez supportés. Une formation qui résout un vrai problème vaut son prix en valeur perçue.
        </GP>
        <GCallout variant="warning" title="Paradoxe contre-intuitif">
          Un prix trop bas <GStrong>diminue</GStrong> la conversion. Pourquoi ? L'acheteur se dit "c'est suspect, ça doit pas être de qualité". Trouvez le sweet spot, pas le minimum.
        </GCallout>
      </>
    ),
  },
  {
    id: "grilles",
    label: "Grilles de prix par type de contenu (FCFA)",
    content: (
      <>
        <GH3>Ebook (30-80 pages)</GH3>
        <GUl>
          <GLi><GStrong>Prix bas</GStrong> : 2 000 FCFA (test rapide niche)</GLi>
          <GLi><GStrong>Prix milieu</GStrong> : 5 000 FCFA (sweet spot débutant)</GLi>
          <GLi><GStrong>Prix premium</GStrong> : 10 000 FCFA (avec bonus ou cible pro)</GLi>
        </GUl>
        <GH3>Mini-cours (3-5 vidéos)</GH3>
        <GUl>
          <GLi><GStrong>Prix bas</GStrong> : 5 000 FCFA</GLi>
          <GLi><GStrong>Prix milieu</GStrong> : 15 000 FCFA</GLi>
          <GLi><GStrong>Prix premium</GStrong> : 25 000 FCFA</GLi>
        </GUl>
        <GH3>Formation complète (2-4 h vidéo)</GH3>
        <GUl>
          <GLi><GStrong>Prix bas</GStrong> : 15 000 FCFA</GLi>
          <GLi><GStrong>Prix milieu</GStrong> : 35 000 FCFA (recommandé)</GLi>
          <GLi><GStrong>Prix premium</GStrong> : 75 000 FCFA (sujet à fort ROI)</GLi>
        </GUl>
        <GH3>Formation + coaching</GH3>
        <GUl>
          <GLi><GStrong>Prix bas</GStrong> : 50 000 FCFA</GLi>
          <GLi><GStrong>Prix milieu</GStrong> : 100 000 FCFA</GLi>
          <GLi><GStrong>Prix premium</GStrong> : 250 000 FCFA et plus</GLi>
        </GUl>
        <GCallout variant="success" title="Recommandation par défaut">
          Visez toujours <GStrong>le prix milieu</GStrong> pour votre première offre. Trop bas = mauvaise qualité perçue. Trop haut = besoin de preuves sociales qu'on n'a pas encore.
        </GCallout>
      </>
    ),
  },
  {
    id: "justifier",
    label: "Comment justifier un prix premium",
    content: (
      <>
        <GP>
          Quatre leviers concrets qui permettent de doubler votre prix sans perdre de ventes :
        </GP>
        <GUl>
          <GLi><GStrong>Témoignages clients vidéo</GStrong> — la preuve sociale numéro 1. Un seul témoignage vidéo peut justifier +30 % de prix.</GLi>
          <GLi><GStrong>Bonus exclusifs</GStrong> — pack templates, accès groupe WhatsApp privé, session live mensuelle. Coût marginal nul, valeur perçue élevée.</GLi>
          <GLi><GStrong>Garantie satisfait ou remboursé 14 jours</GStrong> — réduit le risque perçu. Le taux de remboursement réel reste <GStrong>en moyenne sous 2 %</GStrong> sur Novakou.</GLi>
          <GLi><GStrong>Limitation</GStrong> — "20 places dans cette cohorte", "Promo jusqu'au dimanche". Urgence = conversion +40 à +80 %.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "ancrage",
    label: "Le prix d'ancrage : multiplier la conversion",
    content: (
      <>
        <GP>
          Technique psychologique éprouvée : montrez d'abord un prix élevé barré, puis votre prix réel à côté. Le cerveau compare et trouve votre prix "raisonnable" par contraste.
        </GP>
        <GP>
          Exemple concret : "<GStrong>Valeur totale 75 000 FCFA · Aujourd'hui à 35 000 FCFA</GStrong>". Sur Novakou, l'éditeur de produit a un champ "Prix barré" prévu exactement pour ça.
        </GP>
        <GCallout variant="tip" title="Mesure réelle">
          Test A/B effectué sur 1 200 commandes Novakou : ajouter un prix barré +27 % de conversion en moyenne sur les formations entre 15k et 75k FCFA.
        </GCallout>
      </>
    ),
  },
  {
    id: "upsell",
    label: "Upsell : doubler le panier moyen",
    content: (
      <>
        <GP>
          Un client qui vient d'acheter à 35 000 FCFA est <GStrong>5 à 10 fois plus susceptible</GStrong> d'acheter un produit complémentaire à 15 000 FCFA dans la foulée (juste après le paiement) qu'un nouveau visiteur.
        </GP>
        <GP>
          Règles d'un bon upsell :
        </GP>
        <GUl>
          <GLi>Produit <GStrong>vraiment complémentaire</GStrong> à l'achat principal (pas un produit aléatoire).</GLi>
          <GLi>Prix de l'upsell ≤ 60 % du prix de la commande principale.</GLi>
          <GLi>Disponible <GStrong>uniquement à cet instant</GStrong>, pas plus tard.</GLi>
        </GUl>
        <GP>
          Voir aussi : <GA href="/guides/tunnel-de-vente-novakou">tunnels de vente Novakou avec upsell intégré</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "evoluer",
    label: "Faire évoluer son prix dans le temps",
    content: (
      <>
        <GP>
          Erreur classique : laisser son prix à 15 000 FCFA pendant 2 ans même après avoir accumulé 200 témoignages.
        </GP>
        <GP>
          Méthode : <GStrong>augmenter le prix de 20 à 30 %</GStrong> toutes les 50 nouvelles ventes ou tous les 6 mois. Annoncez la hausse à l'avance (1 semaine) — cela génère un pic de ventes des indécis.
        </GP>
        <GCallout variant="success" title="Cas concret">
          Un créateur Novakou a commencé sa formation Excel à 15k FCFA en janvier 2026. Aujourd'hui à 45k FCFA après 6 hausses successives. Chiffre d'affaires mensuel multiplié par 4.
        </GCallout>
      </>
    ),
  },
];

export default function PricingGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
