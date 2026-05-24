// Source de vérité des articles de blog. Partagé entre :
//   - /blog (liste)
//   - /blog/[slug] (article)
//   - / (3 derniers sur la home)
//   - sitemap.ts (URLs)
//
// Pas de DB pour le MVP : ces articles sont éditoriaux, écrits une fois,
// rarement mis à jour. Les passer en code permet :
//   - ISR/SSG (super rapide)
//   - SEO max (HTML statique généré au build)
//   - Pas de panneau admin à construire pour 6 articles
//
// Pour ajouter un article : ajouter une entrée + créer le fichier MDX/JSX
// correspondant dans /app/blog/[slug]/ (ou via le composant ArticleBody).

export interface BlogArticleMeta {
  slug: string;
  title: string;
  excerpt: string; // 160 chars pour meta description
  category: "Vendre" | "Marketing" | "Produit" | "Stratégie" | "Outils" | "Cas pratiques";
  // Image hero : chemin absolu sous /public ou URL Cloudinary.
  // 1600x900 recommandé, format webp.
  heroImage: string;
  heroAlt: string;
  /** ISO date (YYYY-MM-DD). Utilisé pour ordre + datePublished JSON-LD. */
  publishedAt: string;
  /** ISO date (YYYY-MM-DD). Utilisé pour dateModified JSON-LD. */
  updatedAt: string;
  readingMinutes: number;
  /** Tags pour SEO + filtres futurs. */
  tags: string[];
  /** Mots-clés SEO ciblés (5-8 max). */
  keywords: string[];
  /** Auteur display. */
  author: string;
}

export const BLOG_ARTICLES: BlogArticleMeta[] = [
  {
    slug: "vendre-formation-en-ligne-afrique-2026",
    title: "Vendre une formation en ligne en Afrique en 2026 : le guide complet",
    excerpt:
      "Méthode pas-à-pas pour lancer votre première formation digitale rentable au Sénégal, Côte d'Ivoire ou Cameroun. Stratégie, prix, paiement Mobile Money.",
    category: "Vendre",
    heroImage: "/blog/hero-vendre-formation-afrique.svg",
    heroAlt:
      "Créateur africain devant son ordinateur lançant sa formation en ligne",
    publishedAt: "2026-05-20",
    updatedAt: "2026-05-24",
    readingMinutes: 14,
    tags: ["formation", "vente", "Afrique", "digital"],
    keywords: [
      "vendre formation en ligne Afrique",
      "créer formation digitale Sénégal",
      "monétiser expertise Côte d'Ivoire",
      "formation en ligne Cameroun",
      "lancer business digital Afrique",
    ],
    author: "Équipe Novakou",
  },
  {
    slug: "mobile-money-orange-wave-mtn-guide-paiement",
    title: "Mobile Money, Orange Money, Wave, MTN : recevoir vos paiements en Afrique",
    excerpt:
      "Comparatif des solutions Mobile Money pour encaisser vos ventes digitales. Frais, délais, pays couverts, intégration Novakou en 3 clics.",
    category: "Outils",
    heroImage: "/blog/hero-mobile-money.svg",
    heroAlt: "Téléphone affichant des paiements Mobile Money entrant",
    publishedAt: "2026-05-18",
    updatedAt: "2026-05-24",
    readingMinutes: 11,
    tags: ["paiement", "Mobile Money", "Wave", "Orange", "MTN"],
    keywords: [
      "Mobile Money paiement formation",
      "Orange Money digital",
      "Wave Sénégal vendre en ligne",
      "MTN Mobile Money business",
      "recevoir paiements Afrique",
    ],
    author: "Équipe Novakou",
  },
  {
    slug: "trouver-idee-produit-digital-rentable",
    title: "10 idées de produits digitaux rentables en Afrique francophone",
    excerpt:
      "Ebooks, templates, formations vidéo, cours WhatsApp : sélection des produits digitaux qui se vendent le mieux en 2026 selon les données Novakou.",
    category: "Produit",
    heroImage: "/blog/hero-idees-produits.svg",
    heroAlt: "Tableau d'idées et brainstorming créatif",
    publishedAt: "2026-05-15",
    updatedAt: "2026-05-24",
    readingMinutes: 10,
    tags: ["idée produit", "produit digital", "ebook", "template"],
    keywords: [
      "idée produit digital Afrique",
      "ebook à vendre Sénégal",
      "produit numérique rentable",
      "vendre template Afrique",
      "quoi vendre en ligne 2026",
    ],
    author: "Équipe Novakou",
  },
  {
    slug: "publicite-facebook-instagram-afrique-budget-bas",
    title: "Publicité Facebook & Instagram en Afrique : convertir avec 5 000 FCFA/jour",
    excerpt:
      "Tutoriel concret pour lancer vos premières campagnes Meta Ads en Afrique francophone : ciblage, créatifs, A/B test, ROI mesurable dès la 1ère semaine.",
    category: "Marketing",
    heroImage: "/blog/hero-facebook-ads.svg",
    heroAlt: "Tableau de bord Facebook Ads avec courbes de conversion",
    publishedAt: "2026-05-12",
    updatedAt: "2026-05-24",
    readingMinutes: 15,
    tags: ["publicité", "Facebook Ads", "Instagram", "marketing"],
    keywords: [
      "publicité Facebook Afrique",
      "Meta Ads petit budget",
      "campagne Instagram Sénégal",
      "publicité formation en ligne",
      "Facebook Ads créateur digital",
    ],
    author: "Équipe Novakou",
  },
  {
    slug: "tunnel-vente-novakou-augmenter-conversions",
    title: "Tunnel de vente : multipliez vos conversions par 3 avec Novakou",
    excerpt:
      "Pourquoi une page produit ne suffit plus. Construire un tunnel landing → upsell → confirmation qui convertit, étape par étape avec Novakou.",
    category: "Stratégie",
    heroImage: "/blog/hero-tunnel-vente.svg",
    heroAlt: "Schéma de tunnel de vente avec étapes conversion",
    publishedAt: "2026-05-08",
    updatedAt: "2026-05-24",
    readingMinutes: 12,
    tags: ["tunnel de vente", "conversion", "upsell"],
    keywords: [
      "tunnel de vente Afrique",
      "augmenter conversions formation",
      "upsell digital",
      "landing page Novakou",
      "stratégie de vente en ligne",
    ],
    author: "Équipe Novakou",
  },
  {
    slug: "premier-1000-euros-formation-digitale-cas-pratique",
    title: "Comment Aïcha a fait 1 000 € avec sa formation Excel en 30 jours",
    excerpt:
      "Cas pratique réel : du brainstorming au premier virement Mobile Money. Méthode reproductible avec les leviers exacts utilisés.",
    category: "Cas pratiques",
    heroImage: "/blog/hero-cas-pratique-aicha.svg",
    heroAlt: "Créatrice africaine célébrant ses premières ventes en ligne",
    publishedAt: "2026-05-05",
    updatedAt: "2026-05-24",
    readingMinutes: 9,
    tags: ["témoignage", "cas pratique", "success story"],
    keywords: [
      "premier 1000 euros formation",
      "success story digital Afrique",
      "vendre formation Excel en ligne",
      "témoignage créatrice digitale",
      "réussir formation en ligne débutant",
    ],
    author: "Équipe Novakou",
  },
];

export function getArticleBySlug(slug: string): BlogArticleMeta | null {
  return BLOG_ARTICLES.find((a) => a.slug === slug) ?? null;
}

/**
 * Articles triés du plus récent au plus ancien.
 */
export function getArticlesSorted(): BlogArticleMeta[] {
  return [...BLOG_ARTICLES].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/**
 * Les N derniers articles, pour la home (par défaut 3).
 */
export function getLatestArticles(limit = 3): BlogArticleMeta[] {
  return getArticlesSorted().slice(0, limit);
}

/**
 * Articles similaires : même catégorie OU mêmes tags, excluant l'article courant.
 */
export function getRelatedArticles(
  currentSlug: string,
  limit = 3,
): BlogArticleMeta[] {
  const current = getArticleBySlug(currentSlug);
  if (!current) return getLatestArticles(limit);

  const others = BLOG_ARTICLES.filter((a) => a.slug !== currentSlug);
  const sameCategory = others.filter((a) => a.category === current.category);
  const sharedTags = others.filter((a) =>
    a.tags.some((t) => current.tags.includes(t)),
  );
  const merged = [...sameCategory, ...sharedTags];
  const unique = Array.from(new Map(merged.map((a) => [a.slug, a])).values());
  return unique.slice(0, limit);
}
