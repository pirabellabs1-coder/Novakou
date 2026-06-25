// Injecte JSON-LD Article + BreadcrumbList sur les 8 anciens guides Novakou.
//
// Les guides v2 (mai 2026) utilisent GuideArticleLayout qui inclut déjà le
// schema. Les anciens guides ont chacun leur layout custom (~1500 lignes
// chacun) et il serait coûteux de tout refactor. Ce composant règle le
// problème en 1 ligne : <OldGuideJsonLd slug="..." />.
//
// Source des meta : array `GUIDES` (data importable depuis la page index).

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

// Mapping slug → { title, description, category, datePublished, dateModified, keywords }
// Données reflétées de l'array GUIDES de /guides/page.tsx. À tenir synchronisé
// si on édite un titre/description sur l'index.
const OLD_GUIDES_META: Record<
  string,
  {
    title: string;
    description: string;
    category: string;
    datePublished: string;
    dateModified: string;
    keywords: string[];
  }
> = {
  "importer-systeme-io": {
    title: "Importer son tunnel Systeme.io sur Novakou",
    description:
      "Migrez votre tunnel de vente Systeme.io vers votre boutique Novakou en quelques secondes : collez l'URL, le titre, le texte et l'image sont importés automatiquement. Guide pas à pas avec captures.",
    category: "Technique",
    datePublished: "2026-06-25",
    dateModified: "2026-06-25",
    keywords: [
      "importer Systeme.io Novakou",
      "migrer tunnel Systeme.io",
      "alternative Systeme.io Afrique",
      "passer de Systeme.io à Novakou",
      "tunnel de vente Mobile Money",
    ],
  },
  "creer-son-produit": {
    title: "Comment créer son premier produit digital en Afrique",
    description:
      "De l'idée à la publication : identifiez votre expertise, structurez votre contenu, produisez avec un smartphone et publiez sur Novakou.",
    category: "Créer",
    datePublished: "2026-03-01",
    dateModified: "2026-05-24",
    keywords: [
      "créer produit digital Afrique",
      "lancer formation en ligne",
      "Novakou tutoriel",
      "produire avec smartphone",
    ],
  },
  "vendre-en-ligne": {
    title: "Comment vendre ses formations en Afrique francophone",
    description:
      "Pages de vente, tunnels, leviers psychologiques, réseaux sociaux, email marketing, affiliation. Toutes les stratégies qui marchent.",
    category: "Vendre",
    datePublished: "2026-03-05",
    dateModified: "2026-05-24",
    keywords: [
      "vendre formation Afrique",
      "stratégie de vente digitale",
      "marketing formation en ligne",
      "Novakou vendre",
    ],
  },
  "guide-complet-novakou": {
    title: "Le guide complet Novakou : de A à Z",
    description:
      "De l'inscription à votre première vente. Boutique, paiements, tunnels, IA, emails, affiliation, retraits. Tout est couvert.",
    category: "Technique",
    datePublished: "2026-03-10",
    dateModified: "2026-05-24",
    keywords: [
      "guide complet Novakou",
      "tutoriel Novakou",
      "comment utiliser Novakou",
      "vendeur Novakou démarrer",
    ],
  },
  "trouver-son-idee-de-produit": {
    title: "Comment trouver son idée de produit digital",
    description:
      "La méthode des 3 cercles, les niches portantes en Afrique, validation gratuite en 48h — de zéro idée à un concept validé.",
    category: "Créer",
    datePublished: "2026-03-15",
    dateModified: "2026-05-24",
    keywords: [
      "trouver idée produit digital",
      "validation idée formation",
      "niches Afrique francophone",
      "brainstorming produit",
    ],
  },
  "publicite-facebook": {
    title: "Publicité Facebook pour vendre en Afrique",
    description:
      "Créer des campagnes rentables depuis 2 000 FCFA/jour. Ciblage Afrique francophone, pixel, visuels, optimisation ROAS.",
    category: "Promouvoir",
    datePublished: "2026-03-20",
    dateModified: "2026-05-24",
    keywords: [
      "publicité Facebook Afrique",
      "Meta Ads créateur digital",
      "campagne Facebook francophone",
      "petit budget pub",
    ],
  },
  "automatisations-novakou": {
    title: "Automatisations Novakou : vendre pendant que vous dormez",
    description:
      "Séquences de bienvenue, relance panier, certificats automatiques, upsell post-achat — configurez une fois, encaissez toujours.",
    category: "Automatiser",
    datePublished: "2026-03-25",
    dateModified: "2026-05-24",
    keywords: [
      "automatisations Novakou",
      "automation marketing Afrique",
      "relance panier automatique",
      "vendre en automatique",
    ],
  },
  "sequences-emails": {
    title: "Séquences emails qui vendent en automatique",
    description:
      "Lead magnets, séquence de bienvenue en 5 emails, relances, segmentation. 23 templates email inclus sur Novakou.",
    category: "Automatiser",
    datePublished: "2026-04-01",
    dateModified: "2026-05-24",
    keywords: [
      "séquence emails formation",
      "email marketing automatique",
      "templates email Novakou",
      "automation email Afrique",
    ],
  },
  "description-produit": {
    title: "Rédiger une description de produit irrésistible",
    description:
      "La structure AIDA, transformer vos modules en bénéfices, le titre parfait, la preuve sociale — avec 3 exemples avant/après.",
    category: "Vendre",
    datePublished: "2026-04-05",
    dateModified: "2026-05-24",
    keywords: [
      "description produit qui vend",
      "copywriting AIDA",
      "titre vente formation",
      "page produit conversion",
    ],
  },
  "tunnel-de-vente-novakou": {
    title: "Tunnel de vente sur Novakou : guide pas-à-pas",
    description:
      "Builder drag-and-drop, 30+ blocs, page de capture, page de vente, checkout Mobile Money, upsell, A/B testing.",
    category: "Technique",
    datePublished: "2026-04-10",
    dateModified: "2026-05-24",
    keywords: [
      "tunnel de vente Novakou",
      "funnel page de capture",
      "checkout Mobile Money",
      "A/B testing tunnel",
    ],
  },
};

export function OldGuideJsonLd({ slug }: { slug: string }) {
  const meta = OLD_GUIDES_META[slug];
  if (!meta) return null;

  const url = `${APP_URL}/guides/${slug}`;
  const ogImage = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
    meta.title,
  )}&subtitle=${encodeURIComponent(meta.description)}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    image: [ogImage],
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
    author: { "@type": "Person", name: "Équipe Novakou", url: APP_URL },
    publisher: {
      "@type": "Organization",
      name: "Novakou",
      url: APP_URL,
      logo: { "@type": "ImageObject", url: `${APP_URL}/icon` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "fr",
    keywords: meta.keywords.join(", "),
    articleSection: meta.category,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: APP_URL },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${APP_URL}/guides` },
      { "@type": "ListItem", position: 3, name: meta.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
