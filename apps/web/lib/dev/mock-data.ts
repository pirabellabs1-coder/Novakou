/**
 * Mock Data — Données de démonstration pour le feed et les profils publics.
 * Utilisé en DEV_MODE (pas de DB nécessaire).
 */

export interface MockVendor {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  title: string;
  type: "freelance" | "agence";
  location: string;
  country: string;
  rating: number;
  reviewCount: number;
  responseTime: string;
  completionRate: number;
  skills: string[];
  languages: string[];
  plan: string;
  badges: string[];
  memberSince: string;
  totalServices: number;
  totalOrders: number;
  hourlyRate?: number;
  teamSize?: number;
  description?: string;
  portfolioImages?: string[];
  services?: MockService[];
}

export interface MockPackage {
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
}

export interface MockService {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDesc: string;
  category: string;
  categorySlug: string;
  tags: string[];
  images: string[];
  packages: {
    basic: MockPackage;
    standard: MockPackage;
    premium: MockPackage;
  };
  vendorId: string;
  rating: number;
  reviewCount: number;
  orderCount: number;
  featured: boolean;
  createdAt: string;
  faq: { question: string; answer: string }[];
}

export interface MockReview {
  id: string;
  serviceId: string;
  reviewer: { name: string; avatar: string; country: string; flag: string };
  rating: number;
  qualite: number;
  communication: number;
  delai: number;
  comment: string;
  date: string;
  response?: string;
  helpful?: number;
}

// ─── Vendors ────────────────────────────────────────────────────────────────

export const MOCK_VENDORS: MockVendor[] = [];

const _REMOVED_VENDORS = [
  {
    id: "v1",
    username: "alex-dev",
    name: "Alexandre Rivera",
    avatar: "https://i.pravatar.cc/100?u=alex-dev",
    bio: "Développeur full-stack avec 7 ans d'expérience. Spécialisé React, Next.js et Node.js. Passionné par la création d'applications web performantes et scalables.",
    title: "Développeur Full-Stack React & Node.js",
    type: "freelance",
    location: "Dakar, Sénégal",
    country: "SN",
    rating: 4.9,
    reviewCount: 124,
    responseTime: "< 1h",
    completionRate: 98,
    skills: ["React", "Next.js", "Node.js", "TypeScript", "PostgreSQL", "Docker"],
    languages: ["Français", "Anglais"],
    plan: "pro",
    badges: ["Top Rated", "Vérifié"],
    memberSince: "2022-01",
    totalServices: 8,
    totalOrders: 342,
    hourlyRate: 45,
    portfolioImages: [
      "https://picsum.photos/seed/portfolio1/800/500",
      "https://picsum.photos/seed/portfolio2/800/500",
      "https://picsum.photos/seed/portfolio3/800/500",
    ],
  },
  {
    id: "v2",
    username: "amara-design",
    name: "Amara Diallo",
    avatar: "https://i.pravatar.cc/100?u=amara-design",
    bio: "Designer UI/UX créatif basé à Abidjan. Je transforme vos idées en interfaces belles et fonctionnelles. Expert Figma, Adobe XD et Illustrator.",
    title: "Designer UI/UX & Brand Identity",
    type: "freelance",
    location: "Abidjan, Côte d'Ivoire",
    country: "CI",
    rating: 4.8,
    reviewCount: 89,
    responseTime: "< 2h",
    completionRate: 96,
    skills: ["Figma", "Adobe XD", "Illustrator", "UI Design", "UX Research", "Branding"],
    languages: ["Français", "Anglais", "Dioula"],
    plan: "business",
    badges: ["Top Rated", "Rising Talent", "Vérifié"],
    memberSince: "2021-06",
    totalServices: 5,
    totalOrders: 218,
    hourlyRate: 35,
    portfolioImages: [
      "https://picsum.photos/seed/design1/800/500",
      "https://picsum.photos/seed/design2/800/500",
      "https://picsum.photos/seed/design3/800/500",
    ],
  },
  {
    id: "v3",
    username: "fatou-seo",
    name: "Fatou Mbaye",
    avatar: "https://i.pravatar.cc/100?u=fatou-seo",
    bio: "Consultante SEO & Marketing digital avec 5 ans d'expérience. J'aide les entreprises africaines et françaises à dominer les moteurs de recherche.",
    title: "Experte SEO & Marketing Digital",
    type: "freelance",
    location: "Paris, France",
    country: "FR",
    rating: 4.7,
    reviewCount: 67,
    responseTime: "< 3h",
    completionRate: 95,
    skills: ["SEO", "Google Ads", "Social Media", "Content Marketing", "Analytics", "WordPress"],
    languages: ["Français", "Anglais", "Wolof"],
    plan: "pro",
    badges: ["Vérifié"],
    memberSince: "2022-09",
    totalServices: 4,
    totalOrders: 156,
    hourlyRate: 55,
    portfolioImages: [
      "https://picsum.photos/seed/seo1/800/500",
      "https://picsum.photos/seed/seo2/800/500",
    ],
  },
  {
    id: "v4",
    username: "kofi-video",
    name: "Kofi Acheampong",
    avatar: "https://i.pravatar.cc/100?u=kofi-video",
    bio: "Motion designer et créateur de contenu vidéo. Basé à Accra, je produis des vidéos promotionnelles, animations 2D/3D et montages professionnels.",
    title: "Motion Designer & Créateur Vidéo",
    type: "freelance",
    location: "Accra, Ghana",
    country: "GH",
    rating: 4.9,
    reviewCount: 43,
    responseTime: "< 4h",
    completionRate: 100,
    skills: ["After Effects", "Premiere Pro", "Cinema 4D", "Motion Design", "Animation 2D"],
    languages: ["Français", "Anglais"],
    plan: "pro",
    badges: ["Rising Talent", "Vérifié"],
    memberSince: "2023-03",
    totalServices: 3,
    totalOrders: 78,
    hourlyRate: 40,
    portfolioImages: [
      "https://picsum.photos/seed/video1/800/500",
      "https://picsum.photos/seed/video2/800/500",
    ],
  },
  {
    id: "v5",
    username: "nadia-content",
    name: "Nadia Benali",
    avatar: "https://i.pravatar.cc/100?u=nadia-content",
    bio: "Rédactrice web et traductrice FR/EN/AR bilingue. Contenu SEO-optimisé pour votre site, blog ou réseaux sociaux. 200+ clients satisfaits.",
    title: "Rédactrice Web & Traductrice",
    type: "freelance",
    location: "Casablanca, Maroc",
    country: "MA",
    rating: 4.6,
    reviewCount: 201,
    responseTime: "< 1h",
    completionRate: 99,
    skills: ["Rédaction SEO", "Traduction FR/EN/AR", "Copywriting", "Blog", "Réseaux sociaux"],
    languages: ["Français", "Anglais", "Arabe"],
    plan: "gratuit",
    badges: ["Top Rated"],
    memberSince: "2021-01",
    totalServices: 6,
    totalOrders: 587,
    hourlyRate: 25,
    portfolioImages: [
      "https://picsum.photos/seed/content1/800/500",
      "https://picsum.photos/seed/content2/800/500",
    ],
  },
  // Agences
  {
    id: "v6",
    username: "techlab-agency",
    name: "TechLab Africa",
    avatar: "https://i.pravatar.cc/100?u=techlab-agency",
    bio: "Agence tech africaine de référence. Nous accompagnons les startups et PME dans leur transformation digitale : développement, design, stratégie.",
    title: "Agence de Développement & Digital",
    type: "agence",
    location: "Dakar, Sénégal",
    country: "SN",
    rating: 4.9,
    reviewCount: 156,
    responseTime: "< 2h",
    completionRate: 97,
    skills: ["React", "Node.js", "Mobile", "UI/UX", "DevOps", "Stratégie Digitale"],
    languages: ["Français", "Anglais"],
    plan: "agence",
    badges: ["Agence Vérifiée", "Top Rated"],
    memberSince: "2020-06",
    totalServices: 12,
    totalOrders: 478,
    teamSize: 8,
    description: "TechLab Africa est une agence tech panafricaine fondée en 2020. Nous avons accompagné plus de 100 entreprises dans 15 pays. Notre équipe de 8 experts (développeurs, designers, chefs de projet) livre des solutions de qualité internationale.",
    portfolioImages: [
      "https://picsum.photos/seed/agency1/800/500",
      "https://picsum.photos/seed/agency2/800/500",
      "https://picsum.photos/seed/agency3/800/500",
    ],
  },
  {
    id: "v7",
    username: "creative-minds",
    name: "Creative Minds Studio",
    avatar: "https://i.pravatar.cc/100?u=creative-minds",
    bio: "Studio créatif basé à Paris, spécialisé en branding, design et communication visuelle pour les entreprises françaises et africaines.",
    title: "Studio Créatif & Branding",
    type: "agence",
    location: "Paris, France",
    country: "FR",
    rating: 4.8,
    reviewCount: 89,
    responseTime: "< 3h",
    completionRate: 96,
    skills: ["Branding", "UI/UX", "Print", "Motion Design", "Social Media"],
    languages: ["Français", "Anglais"],
    plan: "agence",
    badges: ["Agence Vérifiée"],
    memberSince: "2021-03",
    totalServices: 7,
    totalOrders: 213,
    teamSize: 5,
    description: "Creative Minds Studio est un collectif de 5 créatifs passionnés. Nous créons des identités visuelles mémorables et des expériences digitales engageantes.",
    portfolioImages: [
      "https://picsum.photos/seed/creative1/800/500",
      "https://picsum.photos/seed/creative2/800/500",
    ],
  },
  {
    id: "v9",
    username: "marie-audio",
    name: "Marie Kouassi",
    avatar: "https://i.pravatar.cc/100?u=marie-audio",
    bio: "Ingénieure du son et productrice de podcasts. Je crée des univers sonores professionnels pour vos projets médias, publicités et contenus digitaux.",
    title: "Ingénieure du Son & Productrice Podcast",
    type: "freelance",
    location: "Abidjan, Côte d'Ivoire",
    country: "CI",
    rating: 4.8,
    reviewCount: 54,
    responseTime: "< 2h",
    completionRate: 97,
    skills: ["Production audio", "Podcast", "Mixage", "Mastering", "Adobe Audition", "Logic Pro"],
    languages: ["Français", "Anglais", "Dioula"],
    plan: "pro",
    badges: ["Vérifié", "Rising Talent"],
    memberSince: "2022-06",
    totalServices: 5,
    totalOrders: 143,
    hourlyRate: 30,
    portfolioImages: ["https://picsum.photos/seed/audio1/800/500", "https://picsum.photos/seed/audio2/800/500"],
  },
  {
    id: "v10",
    username: "data-genius",
    name: "Ibrahima Balde",
    avatar: "https://i.pravatar.cc/100?u=data-genius",
    bio: "Data scientist et analyste BI. Je transforme vos données en insights actionnables grâce à Python, Power BI, Tableau et l'IA générative.",
    title: "Data Scientist & Analyste BI",
    type: "freelance",
    location: "Conakry, Guinée",
    country: "GN",
    rating: 4.7,
    reviewCount: 38,
    responseTime: "< 3h",
    completionRate: 93,
    skills: ["Python", "Data Analysis", "Power BI", "Tableau", "Machine Learning", "SQL"],
    languages: ["Français", "Anglais"],
    plan: "business",
    badges: ["Vérifié"],
    memberSince: "2023-01",
    totalServices: 6,
    totalOrders: 89,
    hourlyRate: 50,
    portfolioImages: ["https://picsum.photos/seed/data1/800/500", "https://picsum.photos/seed/data2/800/500"],
  },
  {
    id: "v11",
    username: "photocraft-africa",
    name: "Yasmine Touré",
    avatar: "https://i.pravatar.cc/100?u=photocraft-africa",
    bio: "Photographe professionnelle spécialisée en photo corporate, produit et événementiel. Basée à Dakar, je couvre toute l'Afrique de l'Ouest.",
    title: "Photographe Professionnelle",
    type: "freelance",
    location: "Dakar, Sénégal",
    country: "SN",
    rating: 4.9,
    reviewCount: 72,
    responseTime: "< 4h",
    completionRate: 100,
    skills: ["Photographie produit", "Corporate", "Retouche Lightroom", "Photoshop", "Studio"],
    languages: ["Français", "Anglais", "Wolof"],
    plan: "pro",
    badges: ["Top Rated", "Vérifié"],
    memberSince: "2021-09",
    totalServices: 4,
    totalOrders: 198,
    hourlyRate: 40,
    portfolioImages: ["https://picsum.photos/seed/photo1/800/500", "https://picsum.photos/seed/photo2/800/500", "https://picsum.photos/seed/photo3/800/500"],
  },
  {
    id: "v8",
    username: "digital-hub-ci",
    name: "Digital Hub CI",
    avatar: "https://i.pravatar.cc/100?u=digital-hub-ci",
    bio: "Agence digitale ivoirienne. Marketing, SEO, gestion réseaux sociaux et création de contenu pour les marchés africains et francophones.",
    title: "Agence Marketing & Contenu Digital",
    type: "agence",
    location: "Abidjan, Côte d'Ivoire",
    country: "CI",
    rating: 4.7,
    reviewCount: 67,
    responseTime: "< 4h",
    completionRate: 94,
    skills: ["SEO", "Social Media", "Content", "Email Marketing", "Publicité"],
    languages: ["Français", "Anglais", "Dioula"],
    plan: "agence",
    badges: ["Agence Vérifiée", "Rising Talent"],
    memberSince: "2022-01",
    totalServices: 9,
    totalOrders: 145,
    teamSize: 4,
    description: "Digital Hub CI aide les entreprises africaines à développer leur présence en ligne. Nos 4 experts couvrent l'ensemble du spectre du marketing digital.",
    portfolioImages: [
      "https://picsum.photos/seed/hub1/800/500",
      "https://picsum.photos/seed/hub2/800/500",
    ],
  },
]; // end _REMOVED_VENDORS

export function getVendorById(id: string): MockVendor | undefined {
  return MOCK_VENDORS.find((v) => v.id === id);
}

export function getVendorByUsername(username: string): MockVendor | undefined {
  return MOCK_VENDORS.find((v) => v.username === username);
}

// ─── Services ───────────────────────────────────────────────────────────────

export const MOCK_SERVICES: MockService[] = [];

const _REMOVED_SERVICES = [
  {
    id: "srv1",
    slug: "site-web-nextjs-react",
    title: "Je vais créer votre site web moderne avec Next.js et React",
    shortDesc: "Site web professionnel, rapide et optimisé SEO avec les dernières technologies.",
    description: `Je développe des sites web et applications web modernes avec **Next.js 14**, **React** et **TypeScript**. Chaque projet est livré avec :

- Un design responsive et accessible sur tous les appareils
- Des performances optimales (Core Web Vitals au vert)
- Un code propre, documenté et maintenable
- Une intégration avec votre CMS ou backend existant

Avec 7 ans d'expérience en développement web, j'ai livré plus de 100 projets pour des clients en Afrique, en France et à l'international. Mon objectif : transformer vos besoins en une solution technique fiable et scalable.`,
    category: "Développement web",
    categorySlug: "dev-web",
    tags: ["Next.js", "React", "TypeScript", "Full-Stack", "SEO"],
    images: [
      "https://picsum.photos/seed/srv1-1/800/500",
      "https://picsum.photos/seed/srv1-2/800/500",
      "https://picsum.photos/seed/srv1-3/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "Landing page simple",
        price: 150,
        deliveryDays: 5,
        revisions: 2,
        features: ["1 page", "Design responsive", "Formulaire de contact", "Hébergement guidé"],
      },
      standard: {
        name: "Standard",
        description: "Site vitrine complet",
        price: 450,
        deliveryDays: 10,
        revisions: 3,
        features: ["5 pages", "Design responsive", "CMS intégré", "SEO de base", "Analytics", "SSL"],
      },
      premium: {
        name: "Premium",
        description: "Application web complète",
        price: 950,
        deliveryDays: 21,
        revisions: 5,
        features: ["Pages illimitées", "Backend personnalisé", "Auth utilisateurs", "Base de données", "SEO avancé", "Support 3 mois"],
      },
    },
    vendorId: "v1",
    rating: 4.9,
    reviewCount: 47,
    orderCount: 124,
    featured: true,
    createdAt: "2024-01-15",
    faq: [
      { question: "Utilisez-vous un template ou du code custom ?", answer: "Tout le code est écrit sur mesure selon vos besoins. Je n'utilise pas de templates génériques." },
      { question: "Puis-je modifier le site moi-même après livraison ?", answer: "Oui, je peux intégrer un CMS (Sanity, Contentful, ou un admin custom) pour vous permettre de modifier le contenu facilement." },
      { question: "Gérez-vous l'hébergement ?", answer: "Je peux vous conseiller et configurer l'hébergement (Vercel, Netlify, VPS), mais les frais d'hébergement sont à votre charge." },
    ],
  },
  {
    id: "srv2",
    slug: "identite-visuelle-logo",
    title: "Je vais concevoir votre identité visuelle et votre logo professionnel",
    shortDesc: "Logo unique, charte graphique complète et fichiers sources inclus.",
    description: `Votre identité visuelle est la première impression que vous donnez. Je crée des logos **uniques**, mémorables et adaptés à votre marché.

Ce que vous obtenez :
- Une phase de découverte (questionnaire + brief)
- 3 concepts initiaux différents
- Des fichiers optimisés (SVG, PNG, PDF, formats print)
- Une charte graphique avec typographies et couleurs
- Un guide d'utilisation de votre logo

Je maîtrise les codes visuels des marchés africains et internationaux. Mon approche : écouter, comprendre, créer.`,
    category: "Design & Créatif",
    categorySlug: "design",
    tags: ["Logo", "Branding", "Charte graphique", "Figma", "Identité visuelle"],
    images: [
      "https://picsum.photos/seed/srv2-1/800/500",
      "https://picsum.photos/seed/srv2-2/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "Logo simple",
        price: 80,
        deliveryDays: 4,
        revisions: 2,
        features: ["1 concept logo", "Formats PNG + SVG", "Fond transparent", "2 révisions"],
      },
      standard: {
        name: "Standard",
        description: "Logo + charte couleurs",
        price: 180,
        deliveryDays: 7,
        revisions: 3,
        features: ["3 concepts", "Logo vectoriel HD", "Palette couleurs", "Typographies", "Fichiers sources Figma"],
      },
      premium: {
        name: "Premium",
        description: "Identité visuelle complète",
        price: 380,
        deliveryDays: 14,
        revisions: 5,
        features: ["3 concepts + variations", "Charte graphique 20 pages", "Kit réseaux sociaux", "Mockups réalistes", "Tous formats livraison"],
      },
    },
    vendorId: "v2",
    rating: 4.8,
    reviewCount: 32,
    orderCount: 89,
    featured: true,
    createdAt: "2024-02-10",
    faq: [
      { question: "Les fichiers sources sont-ils inclus ?", answer: "Oui, pour les forfaits Standard et Premium, vous recevez les fichiers sources Figma et Adobe Illustrator." },
      { question: "Combien de temps pour le 1er concept ?", answer: "En général 2 à 3 jours après la validation du brief complet." },
    ],
  },
  {
    id: "srv3",
    slug: "audit-seo-strategie",
    title: "Je vais réaliser un audit SEO complet et une stratégie de référencement",
    shortDesc: "Analyse approfondie de votre site + roadmap SEO priorisée et actionnable.",
    description: `Un site invisible sur Google = une opportunité manquée. Mon audit SEO vous donne une vision claire de votre positionnement et un plan d'action concret.

**Ce que couvre l'audit :**
- SEO technique (vitesse, indexation, crawl)
- SEO on-page (titres, meta, contenu, maillage)
- Analyse des mots-clés et opportunités
- Étude de la concurrence
- Netlinking et autorité de domaine

**Ce que vous recevez :**
- Rapport PDF détaillé (30-50 pages)
- Roadmap prioritaire sur 6 mois
- Recommandations concrètes par ordre d'impact`,
    category: "Marketing digital",
    categorySlug: "marketing",
    tags: ["SEO", "Audit", "Référencement", "Google", "Stratégie digitale"],
    images: [
      "https://picsum.photos/seed/srv3-1/800/500",
      "https://picsum.photos/seed/srv3-2/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "Audit SEO essentiel",
        price: 120,
        deliveryDays: 5,
        revisions: 1,
        features: ["Audit technique", "10 mots-clés", "Rapport PDF", "1 appel conseil 30 min"],
      },
      standard: {
        name: "Standard",
        description: "Audit + stratégie 3 mois",
        price: 280,
        deliveryDays: 7,
        revisions: 2,
        features: ["Audit complet", "50 mots-clés", "Analyse concurrence", "Roadmap 3 mois", "2 appels conseil"],
      },
      premium: {
        name: "Premium",
        description: "Audit + stratégie 6 mois",
        price: 550,
        deliveryDays: 10,
        revisions: 3,
        features: ["Audit ultra-complet", "100+ mots-clés", "Stratégie contenu", "Roadmap 6 mois", "Suivi mensuel", "Rapport de progression"],
      },
    },
    vendorId: "v3",
    rating: 4.7,
    reviewCount: 28,
    orderCount: 67,
    featured: false,
    createdAt: "2024-03-01",
    faq: [
      { question: "L'audit est-il compatible avec tous les CMS ?", answer: "Oui, que vous ayez WordPress, Shopify, Wix, ou un site custom, l'audit s'applique à n'importe quelle technologie." },
    ],
  },
  {
    id: "srv4",
    slug: "video-promo-animation",
    title: "Je vais créer une vidéo promotionnelle avec animation professionnelle",
    shortDesc: "Vidéos animées pour présenter votre produit ou service avec impact.",
    description: `Une vidéo animée bien conçue augmente les conversions de 80%. Je crée des **vidéos promotionnelles** qui captivent votre audience et communiquent votre message avec clarté.

Types de vidéos que je réalise :
- Explainer vidéo (2D animation)
- Présentation de produit
- Publicité pour réseaux sociaux
- Motion design / Logo animation
- Intro/Outro YouTube

Processus : brief → storyboard → animation → son → livraison`,
    category: "Vidéo & Animation",
    categorySlug: "video",
    tags: ["Animation", "Motion design", "Vidéo promo", "After Effects", "2D"],
    images: [
      "https://picsum.photos/seed/srv4-1/800/500",
      "https://picsum.photos/seed/srv4-2/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "Courte animation 30s",
        price: 100,
        deliveryDays: 5,
        revisions: 2,
        features: ["30 secondes", "Animation 2D", "Musique libre de droits", "Format MP4 HD"],
      },
      standard: {
        name: "Standard",
        description: "Vidéo promo 60s",
        price: 250,
        deliveryDays: 10,
        revisions: 3,
        features: ["60 secondes", "Animation premium", "Voix-off FR ou EN", "Musique HD", "Formats multiples"],
      },
      premium: {
        name: "Premium",
        description: "Vidéo complète 2 min",
        price: 500,
        deliveryDays: 20,
        revisions: 5,
        features: ["2 minutes", "Animation 2D/3D", "Voix-off professionnelle", "Script inclus", "Storyboard", "Tous formats"],
      },
    },
    vendorId: "v4",
    rating: 4.9,
    reviewCount: 18,
    orderCount: 34,
    featured: true,
    createdAt: "2024-04-15",
    faq: [
      { question: "Fournissez-vous le script ?", answer: "Pour le forfait Standard, je peux adapter un script fourni. Pour le Premium, j'écris le script complet selon votre brief." },
    ],
  },
  {
    id: "srv5",
    slug: "redaction-articles-seo",
    title: "Je vais rédiger vos articles de blog optimisés SEO en français",
    shortDesc: "Contenu de qualité, 100% original, optimisé pour le référencement.",
    description: `Du contenu de blog qui se positionne dans Google ET qui se lit avec plaisir. C'est mon engagement pour chaque article que je livre.

**Mon approche :**
- Recherche approfondie du sujet
- Analyse des mots-clés et intention de recherche
- Rédaction fluide, engageante et factuelle
- Optimisation on-page (titres Hn, meta, maillage interne)
- Vérification plagiat (rapport Copyscape inclus)

**Marchés couverts :** France, Afrique francophone, Maghreb`,
    category: "Rédaction & Traduction",
    categorySlug: "redaction",
    tags: ["Rédaction SEO", "Blog", "Contenu", "Français", "Copywriting"],
    images: [
      "https://picsum.photos/seed/srv5-1/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "Article 800 mots",
        price: 40,
        deliveryDays: 3,
        revisions: 1,
        features: ["800 mots", "1 mot-clé principal", "Meta description", "Anti-plagiat"],
      },
      standard: {
        name: "Standard",
        description: "Article 1500 mots",
        price: 80,
        deliveryDays: 4,
        revisions: 2,
        features: ["1500 mots", "3 mots-clés", "Titres optimisés", "Méta SEO", "Image incluse"],
      },
      premium: {
        name: "Premium",
        description: "Article long 3000 mots",
        price: 150,
        deliveryDays: 7,
        revisions: 3,
        features: ["3000 mots", "Recherche complète", "5 mots-clés", "FAQ intégrée", "Infographie", "Publication WordPress"],
      },
    },
    vendorId: "v5",
    rating: 4.6,
    reviewCount: 89,
    orderCount: 267,
    featured: false,
    createdAt: "2023-09-01",
    faq: [
      { question: "Dans quel délai livrez-vous ?", answer: "Je respecte toujours les délais annoncés. En cas d'urgence, contactez-moi avant de commander." },
    ],
  },
  {
    id: "srv6",
    slug: "app-mobile-react-native",
    title: "Je vais développer votre application mobile React Native iOS et Android",
    shortDesc: "Application mobile cross-platform performante et publiée sur les stores.",
    description: `Une seule codebase, deux plateformes. Je développe des apps mobiles avec **React Native** qui fonctionnent parfaitement sur iOS et Android.

**Ce que je livre :**
- Application complète et fonctionnelle
- Publication sur App Store et Google Play guidée
- Notifications push intégrées
- Authentification (email, Google, social)
- API REST ou GraphQL connectée`,
    category: "Développement web",
    categorySlug: "dev-web",
    tags: ["React Native", "Mobile", "iOS", "Android", "App"],
    images: [
      "https://picsum.photos/seed/srv6-1/800/500",
      "https://picsum.photos/seed/srv6-2/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "App simple 3 écrans",
        price: 300,
        deliveryDays: 14,
        revisions: 2,
        features: ["3 écrans", "Auth utilisateur", "1 API", "Tests iOS + Android"],
      },
      standard: {
        name: "Standard",
        description: "App complète 8 écrans",
        price: 800,
        deliveryDays: 30,
        revisions: 3,
        features: ["8 écrans", "Backend inclus", "Push notifications", "Paiement in-app", "Tests + déploiement"],
      },
      premium: {
        name: "Premium",
        description: "App avancée avec dashboard",
        price: 1800,
        deliveryDays: 60,
        revisions: 5,
        features: ["Écrans illimités", "Admin dashboard", "Analytics", "Multi-langue", "Support 6 mois"],
      },
    },
    vendorId: "v6",
    rating: 4.9,
    reviewCount: 34,
    orderCount: 78,
    featured: true,
    createdAt: "2024-01-20",
    faq: [
      { question: "L'app sera-t-elle publiée sur les stores ?", answer: "Oui, je vous accompagne dans tout le processus de publication sur l'App Store et le Google Play." },
    ],
  },
  {
    id: "srv7",
    slug: "gestion-reseaux-sociaux",
    title: "Je vais gérer vos réseaux sociaux et créer votre contenu mensuel",
    shortDesc: "Community management complet : stratégie, contenus, publications, stats.",
    description: `Votre présence sur les réseaux sociaux mérite une stratégie solide. Je prends en charge la gestion complète de vos comptes Instagram, Facebook, LinkedIn et TikTok.

**Inclus :**
- Stratégie éditoriale mensuelle
- Création de visuels (Canva Pro / Photoshop)
- Rédaction des captions (tone of voice respecté)
- Planification et publication
- Modération des commentaires
- Rapport de performance mensuel`,
    category: "Réseaux sociaux",
    categorySlug: "social",
    tags: ["Community management", "Instagram", "Facebook", "Contenus", "Social media"],
    images: [
      "https://picsum.photos/seed/srv7-1/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "1 réseau, 8 posts/mois",
        price: 120,
        deliveryDays: 30,
        revisions: 2,
        features: ["1 plateforme", "8 posts/mois", "Visuels inclus", "Rapport mensuel"],
      },
      standard: {
        name: "Standard",
        description: "2 réseaux, 20 posts/mois",
        price: 280,
        deliveryDays: 30,
        revisions: 3,
        features: ["2 plateformes", "20 posts/mois", "Stories", "Modération", "Rapport détaillé"],
      },
      premium: {
        name: "Premium",
        description: "4 réseaux, posts illimités",
        price: 550,
        deliveryDays: 30,
        revisions: 5,
        features: ["4 plateformes", "Posts illimités", "Campagnes pub", "Influencers", "Stratégie full"],
      },
    },
    vendorId: "v8",
    rating: 4.7,
    reviewCount: 45,
    orderCount: 98,
    featured: false,
    createdAt: "2024-02-15",
    faq: [],
  },
  {
    id: "srv8",
    slug: "traduction-francais-anglais",
    title: "Je vais traduire vos documents du français vers l'anglais",
    shortDesc: "Traduction professionnelle FR/EN certifiée, naturelle et fidèle au sens.",
    description: `Traductrice bilingue native FR/EN, je traduis vos documents professionnels, sites web, articles, contrats et contenus marketing avec précision et naturel.

**Secteurs de spécialisation :**
- Business & juridique
- Tech & numérique
- Santé & médical
- Marketing & communication`,
    category: "Rédaction & Traduction",
    categorySlug: "redaction",
    tags: ["Traduction", "Français", "Anglais", "Documents", "Certifiée"],
    images: [
      "https://picsum.photos/seed/srv8-1/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "500 mots",
        price: 25,
        deliveryDays: 2,
        revisions: 1,
        features: ["500 mots", "Relecture incluse", "Format original conservé"],
      },
      standard: {
        name: "Standard",
        description: "2000 mots",
        price: 80,
        deliveryDays: 4,
        revisions: 2,
        features: ["2000 mots", "Terminologie vérifiée", "Certification si besoin"],
      },
      premium: {
        name: "Premium",
        description: "5000 mots + certification",
        price: 180,
        deliveryDays: 7,
        revisions: 3,
        features: ["5000 mots", "Certification officielle", "Glossaire fourni", "Révision native speaker"],
      },
    },
    vendorId: "v5",
    rating: 4.6,
    reviewCount: 112,
    orderCount: 320,
    featured: false,
    createdAt: "2023-07-01",
    faq: [],
  },
  {
    id: "srv9",
    slug: "branding-complet-startup",
    title: "Je vais créer l'identité de marque complète pour votre startup",
    shortDesc: "Branding 360° : logo, charte, templates, ton éditorial, guide de marque.",
    description: `Votre startup mérite une identité aussi forte que votre ambition. Notre studio crée des identités de marque cohérentes, distinctives et scalables.

**Le pack complet comprend :**
- Stratégie de marque (positionnement, valeurs, cible)
- Logo principal + variantes
- Charte graphique complète
- Templates réseaux sociaux
- Templates email et documents
- Guide de marque (Brand Book)`,
    category: "Design & Créatif",
    categorySlug: "design",
    tags: ["Branding", "Startup", "Brand book", "Identité de marque", "Logo"],
    images: [
      "https://picsum.photos/seed/srv9-1/800/500",
      "https://picsum.photos/seed/srv9-2/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "Logo + couleurs",
        price: 250,
        deliveryDays: 7,
        revisions: 3,
        features: ["Logo professionnel", "Palette couleurs", "Typographies", "Fichiers HD"],
      },
      standard: {
        name: "Standard",
        description: "Brand identity",
        price: 650,
        deliveryDays: 14,
        revisions: 5,
        features: ["Logo + variantes", "Charte graphique", "Kit social media", "10 templates"],
      },
      premium: {
        name: "Premium",
        description: "Brand book complet",
        price: 1500,
        deliveryDays: 30,
        revisions: 8,
        features: ["Stratégie marque", "Logo premium", "Brand book 40 pages", "Tous templates", "Formation équipe"],
      },
    },
    vendorId: "v7",
    rating: 4.8,
    reviewCount: 23,
    orderCount: 45,
    featured: true,
    createdAt: "2024-03-10",
    faq: [],
  },
  {
    id: "srv10",
    slug: "wordpress-ecommerce",
    title: "Je vais créer votre boutique en ligne WooCommerce professionnelle",
    shortDesc: "E-commerce WordPress complet : catalogue, paiement, livraison, admin.",
    description: `Lancez votre boutique en ligne en moins de 2 semaines. Je configure et personnalise WooCommerce pour correspondre exactement à votre vision et vos besoins business.

**Inclus dans chaque forfait :**
- Installation et configuration WordPress + WooCommerce
- Thème premium customisé
- Intégration paiements (Stripe, PayPal, Mobile Money)
- Gestion des stocks et livraisons
- Optimisation SEO e-commerce`,
    category: "Développement web",
    categorySlug: "dev-web",
    tags: ["WordPress", "WooCommerce", "E-commerce", "Boutique", "Paiement"],
    images: [
      "https://picsum.photos/seed/srv10-1/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "Boutique 20 produits",
        price: 200,
        deliveryDays: 7,
        revisions: 2,
        features: ["20 produits", "Paiement carte", "SSL + sécurité", "Formation admin"],
      },
      standard: {
        name: "Standard",
        description: "Boutique 100 produits",
        price: 450,
        deliveryDays: 14,
        revisions: 3,
        features: ["100 produits", "Multi-paiement", "Gestion stock", "Bons de réduction", "Mobile Money"],
      },
      premium: {
        name: "Premium",
        description: "E-commerce avancé",
        price: 950,
        deliveryDays: 21,
        revisions: 5,
        features: ["Produits illimités", "Marketplace multi-vendeurs", "Analytics avancé", "Support 3 mois", "SEO e-commerce"],
      },
    },
    vendorId: "v1",
    rating: 4.9,
    reviewCount: 29,
    orderCount: 67,
    featured: false,
    createdAt: "2023-11-05",
    faq: [],
  },
  {
    id: "srv11",
    slug: "campagne-google-ads",
    title: "Je vais créer et gérer votre campagne Google Ads optimisée",
    shortDesc: "Campagnes Search + Display rentables avec un ROI maximal.",
    description: `Arrêtez de brûler votre budget pub. Mes campagnes Google Ads sont conçues pour convertir, pas juste pour générer des impressions.

**Mon approche :**
- Audit de votre présence actuelle
- Recherche de mots-clés qualifiés
- Création des campagnes Search + Display
- A/B testing des annonces
- Optimisation continue du score de qualité
- Rapport hebdomadaire`,
    category: "Marketing digital",
    categorySlug: "marketing",
    tags: ["Google Ads", "SEA", "Publicité", "ROI", "Conversion"],
    images: [
      "https://picsum.photos/seed/srv11-1/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "Setup campagne",
        price: 150,
        deliveryDays: 5,
        revisions: 1,
        features: ["1 campagne Search", "10 annonces", "Tracking conversions", "Rapport setup"],
      },
      standard: {
        name: "Standard",
        description: "Campagne + gestion 1 mois",
        price: 350,
        deliveryDays: 30,
        revisions: 2,
        features: ["3 campagnes", "Optimisation hebdo", "A/B testing", "Rapport mensuel", "Remarketing"],
      },
      premium: {
        name: "Premium",
        description: "Stratégie complète 3 mois",
        price: 900,
        deliveryDays: 90,
        revisions: 4,
        features: ["Campagnes illimitées", "Search + Display + YouTube", "Optimisation quotidienne", "Rapport détaillé", "Stratégie cross-canal"],
      },
    },
    vendorId: "v3",
    rating: 4.7,
    reviewCount: 39,
    orderCount: 89,
    featured: false,
    createdAt: "2024-01-08",
    faq: [],
  },
  {
    id: "srv12",
    slug: "design-ui-ux-application",
    title: "Je vais concevoir l'interface utilisateur de votre application",
    shortDesc: "Design UI/UX complet avec prototypes interactifs Figma.",
    description: `Un design pensé pour l'utilisateur, pas pour les designers. Je conçois des interfaces **intuitives**, **belles** et **testées utilisateurs** pour vos apps web et mobiles.

**Processus :**
1. Discovery & User Research
2. Architecture de l'information
3. Wireframes basse fidélité
4. Prototype haute fidélité
5. Design system complet
6. Handoff développeur`,
    category: "Design & Créatif",
    categorySlug: "design",
    tags: ["UI Design", "UX", "Figma", "Prototype", "Application"],
    images: [
      "https://picsum.photos/seed/srv12-1/800/500",
      "https://picsum.photos/seed/srv12-2/800/500",
    ],
    packages: {
      basic: {
        name: "Basique",
        description: "3 écrans Figma",
        price: 120,
        deliveryDays: 5,
        revisions: 2,
        features: ["3 écrans", "Figma interactif", "Composants de base"],
      },
      standard: {
        name: "Standard",
        description: "10 écrans + design system",
        price: 350,
        deliveryDays: 14,
        revisions: 3,
        features: ["10 écrans", "Design system", "Prototype cliquable", "Handoff développeur"],
      },
      premium: {
        name: "Premium",
        description: "App complète + UX research",
        price: 800,
        deliveryDays: 30,
        revisions: 5,
        features: ["Écrans illimités", "User research", "Tests utilisateurs", "Design system complet", "Formation équipe"],
      },
    },
    vendorId: "v2",
    rating: 4.8,
    reviewCount: 57,
    orderCount: 129,
    featured: true,
    createdAt: "2023-12-01",
    faq: [],
  },
  // ── Services supplémentaires (srv13–srv40) ──────────────────────────────
  { id: "srv13", slug: "analyse-donnees-python", title: "Je vais analyser vos données et créer des dashboards Python interactifs", shortDesc: "Analyse exploratoire, visualisation et insights actionnables avec Python & Pandas.", description: "Transformez vos données brutes en décisions stratégiques.", category: "Data & IA", categorySlug: "data-ia", tags: ["Python", "Data", "Pandas", "Matplotlib", "Dashboard"], images: ["https://picsum.photos/seed/srv13/800/500"], packages: { basic: { name: "Basique", description: "Analyse simple", price: 80, deliveryDays: 3, revisions: 1, features: ["Nettoyage données", "5 visualisations", "Rapport PDF"] }, standard: { name: "Standard", description: "Dashboard interactif", price: 200, deliveryDays: 7, revisions: 2, features: ["Dashboard Plotly/Dash", "10+ graphiques", "Export HTML"] }, premium: { name: "Premium", description: "Analyse complète + ML", price: 500, deliveryDays: 14, revisions: 3, features: ["Machine Learning", "Dashboard cloud", "Rapport exécutif", "Formation"] } }, vendorId: "v10", rating: 4.7, reviewCount: 22, orderCount: 54, featured: false, createdAt: "2024-02-20", faq: [] },
  { id: "srv14", slug: "production-podcast-pro", title: "Je vais produire et monter votre podcast de A à Z", shortDesc: "Enregistrement, mixage, habillage sonore et publication sur toutes les plateformes.", description: "Votre podcast livré clé en main, prêt à publier.", category: "Audio & Musique", categorySlug: "audio", tags: ["Podcast", "Mixage", "Montage audio", "Spotify", "Production"], images: ["https://picsum.photos/seed/srv14/800/500"], packages: { basic: { name: "Basique", description: "1 épisode", price: 60, deliveryDays: 3, revisions: 1, features: ["Montage", "Mixage", "Dé-bruitage", "MP3 HD"] }, standard: { name: "Standard", description: "3 épisodes", price: 160, deliveryDays: 7, revisions: 2, features: ["3 épisodes", "Jingle intro/outro", "Couverture Spotify", "Distribution"] }, premium: { name: "Premium", description: "Pack mensuel 8 épisodes", price: 380, deliveryDays: 30, revisions: 4, features: ["8 épisodes/mois", "Habillage sonore", "RSS + distribution", "Plan éditorial"] } }, vendorId: "v9", rating: 4.8, reviewCount: 31, orderCount: 67, featured: false, createdAt: "2024-03-05", faq: [] },
  { id: "srv15", slug: "formation-react-nextjs", title: "Je vais vous former à React et Next.js en sessions live personnalisées", shortDesc: "Formation individuelle ou équipe, du débutant à l'avancé, avec projets pratiques.", description: "Apprenez React et Next.js avec un développeur senior en 1:1.", category: "Formation", categorySlug: "formation", tags: ["React", "Next.js", "Formation", "JavaScript", "Frontend"], images: ["https://picsum.photos/seed/srv15/800/500"], packages: { basic: { name: "Débutant", description: "2h de formation", price: 90, deliveryDays: 7, revisions: 0, features: ["2h Zoom", "Support slides", "Exercices pratiques"] }, standard: { name: "Intermédiaire", description: "6h en 3 sessions", price: 240, deliveryDays: 14, revisions: 0, features: ["6h en 3 sessions", "Projet fil rouge", "Code review"] }, premium: { name: "Avancé", description: "12h + projet complet", price: 480, deliveryDays: 30, revisions: 0, features: ["12h de formation", "Projet déployé", "Support 1 mois", "Certification"] } }, vendorId: "v1", rating: 4.9, reviewCount: 45, orderCount: 112, featured: true, createdAt: "2024-01-10", faq: [] },
  { id: "srv16", slug: "photo-produit-ecommerce", title: "Je vais photographier vos produits pour votre boutique en ligne", shortDesc: "Photos produit professionnelles sur fond blanc ou en situation, retouchées.", description: "Des photos produits qui augmentent vos ventes en ligne.", category: "Photographie", categorySlug: "photo", tags: ["Photo produit", "E-commerce", "Retouche", "Studio", "Fond blanc"], images: ["https://picsum.photos/seed/srv16/800/500", "https://picsum.photos/seed/srv16b/800/500"], packages: { basic: { name: "Basique", description: "5 produits", price: 80, deliveryDays: 5, revisions: 1, features: ["5 produits", "Fond blanc", "Retouche incluse", "Livrés HD"] }, standard: { name: "Standard", description: "15 produits", price: 200, deliveryDays: 7, revisions: 2, features: ["15 produits", "2 angles/produit", "Fond blanc + ambiance", "Formats web optimisés"] }, premium: { name: "Premium", description: "30 produits + lifestyle", price: 450, deliveryDays: 14, revisions: 3, features: ["30 produits", "Photos lifestyle", "Vidéo 360°", "Usage commercial illimité"] } }, vendorId: "v11", rating: 4.9, reviewCount: 38, orderCount: 89, featured: true, createdAt: "2024-02-01", faq: [] },
  { id: "srv17", slug: "montage-video-youtube", title: "Je vais monter vos vidéos YouTube avec effets dynamiques", shortDesc: "Montage professionnel, transitions, sous-titres, miniatures incluses.", description: "Des vidéos YouTube qui retiennent l'attention du début à la fin.", category: "Vidéo & Animation", categorySlug: "video", tags: ["YouTube", "Montage vidéo", "Sous-titres", "Motion design", "Miniature"], images: ["https://picsum.photos/seed/srv17/800/500"], packages: { basic: { name: "Basique", description: "Vidéo 5 min", price: 50, deliveryDays: 3, revisions: 1, features: ["Jusqu'à 5 min", "Montage + cuts", "Musique libre"] }, standard: { name: "Standard", description: "Vidéo 15 min + graphiques", price: 120, deliveryDays: 5, revisions: 2, features: ["Jusqu'à 15 min", "Motion graphics", "Sous-titres", "Miniature"] }, premium: { name: "Premium", description: "Chaîne complète", price: 300, deliveryDays: 10, revisions: 3, features: ["Vidéo illimitée", "Identité visuelle chaîne", "Intro animée", "5 miniatures/mois"] } }, vendorId: "v4", rating: 4.8, reviewCount: 29, orderCount: 73, featured: false, createdAt: "2024-01-25", faq: [] },
  { id: "srv18", slug: "cv-lettre-motivation-pro", title: "Je vais rédiger votre CV et lettre de motivation percutants", shortDesc: "CV et lettre de motivation optimisés ATS, design professionnel inclus.", description: "Un CV qui passe les filtres ATS et séduit les recruteurs.", category: "Rédaction & Traduction", categorySlug: "redaction", tags: ["CV", "Lettre de motivation", "ATS", "Emploi", "Rédaction pro"], images: ["https://picsum.photos/seed/srv18/800/500"], packages: { basic: { name: "Basique", description: "CV uniquement", price: 35, deliveryDays: 2, revisions: 1, features: ["CV 1 page", "Design ATS-compatible", "Format Word + PDF"] }, standard: { name: "Standard", description: "CV + lettre", price: 75, deliveryDays: 3, revisions: 2, features: ["CV + lettre de motivation", "Design premium", "Adaptation offre"] }, premium: { name: "Premium", description: "Pack complet + LinkedIn", price: 150, deliveryDays: 5, revisions: 3, features: ["CV + lettre + LinkedIn", "3 versions CV", "Coaching entretien 1h"] } }, vendorId: "v5", rating: 4.7, reviewCount: 78, orderCount: 189, featured: false, createdAt: "2023-08-15", faq: [] },
  { id: "srv19", slug: "email-marketing-mailchimp", title: "Je vais créer votre stratégie email marketing et vos campagnes", shortDesc: "Séquences emails automatisées, newsletters et A/B testing pour booster vos conversions.", description: "L'email marketing bien fait génère un ROI de 4200%.", category: "Marketing digital", categorySlug: "marketing", tags: ["Email marketing", "Mailchimp", "Newsletter", "Automation", "ROI"], images: ["https://picsum.photos/seed/srv19/800/500"], packages: { basic: { name: "Basique", description: "Setup + 1 newsletter", price: 90, deliveryDays: 4, revisions: 1, features: ["Config Mailchimp", "1 template email", "Séquence bienvenue"] }, standard: { name: "Standard", description: "Stratégie 1 mois", price: 220, deliveryDays: 14, revisions: 2, features: ["4 newsletters", "Automation", "A/B testing", "Rapport"] }, premium: { name: "Premium", description: "Stratégie 3 mois", price: 550, deliveryDays: 30, revisions: 4, features: ["Stratégie complète", "Segmentation", "12 emails", "Optimisation KPIs"] } }, vendorId: "v8", rating: 4.6, reviewCount: 33, orderCount: 71, featured: false, createdAt: "2024-02-10", faq: [] },
  { id: "srv20", slug: "landing-page-conversion", title: "Je vais créer une landing page qui convertit vos visiteurs en clients", shortDesc: "Page d'atterrissage optimisée conversion : copywriting, design et intégration.", description: "Une landing page conçue pour vendre, pas juste pour être belle.", category: "Développement web", categorySlug: "dev-web", tags: ["Landing page", "Conversion", "CRO", "Next.js", "Copywriting"], images: ["https://picsum.photos/seed/srv20/800/500", "https://picsum.photos/seed/srv20b/800/500"], packages: { basic: { name: "Basique", description: "Landing simple", price: 120, deliveryDays: 4, revisions: 2, features: ["1 section hero", "Formulaire lead", "Responsive", "Google Analytics"] }, standard: { name: "Standard", description: "Landing complète", price: 280, deliveryDays: 7, revisions: 3, features: ["6 sections", "Copywriting inclus", "Animations", "A/B test ready"] }, premium: { name: "Premium", description: "Funnel complet", price: 600, deliveryDays: 14, revisions: 4, features: ["Landing + merci + upsell", "Copywriting premium", "Pop-ups exit intent", "Intégration CRM"] } }, vendorId: "v6", rating: 4.8, reviewCount: 41, orderCount: 95, featured: true, createdAt: "2024-02-28", faq: [] },
  { id: "srv21", slug: "flyer-brochure-design", title: "Je vais créer vos flyers, affiches et brochures imprimables", shortDesc: "Design print professionnel pour tous vos supports de communication.", description: "Des supports print qui captivent et convertissent.", category: "Design & Créatif", categorySlug: "design", tags: ["Flyer", "Brochure", "Affiche", "Print", "Canva"], images: ["https://picsum.photos/seed/srv21/800/500"], packages: { basic: { name: "Basique", description: "1 flyer A5", price: 30, deliveryDays: 2, revisions: 2, features: ["1 face", "Format print HD", "Fichier imprimeur"] }, standard: { name: "Standard", description: "Flyer recto-verso + brochure 4p", price: 80, deliveryDays: 4, revisions: 3, features: ["Recto-verso", "Brochure 4 pages", "Declinaison digitale", "Source Illustrator"] }, premium: { name: "Premium", description: "Pack communication complet", price: 200, deliveryDays: 7, revisions: 4, features: ["Flyer + brochure 8p + affiche", "Cohérence charte", "Tous formats", "Source modifiable"] } }, vendorId: "v7", rating: 4.7, reviewCount: 52, orderCount: 134, featured: false, createdAt: "2023-10-15", faq: [] },
  { id: "srv22", slug: "chatbot-ia-site", title: "Je vais intégrer un chatbot IA intelligent sur votre site web", shortDesc: "Chatbot GPT-4 personnalisé, entraîné sur votre contenu pour automatiser le support.", description: "Un chatbot qui répond 24h/24 avec la précision d'un expert.", category: "Data & IA", categorySlug: "data-ia", tags: ["Chatbot", "IA", "GPT-4", "Automatisation", "Support client"], images: ["https://picsum.photos/seed/srv22/800/500"], packages: { basic: { name: "Basique", description: "Chatbot simple", price: 150, deliveryDays: 5, revisions: 2, features: ["Chatbot FAQ", "Widget web", "Configuration", "1 mois support"] }, standard: { name: "Standard", description: "Chatbot GPT personnalisé", price: 400, deliveryDays: 10, revisions: 3, features: ["GPT-4 personnalisé", "Base de connaissances", "Escalade humain", "Analytics"] }, premium: { name: "Premium", description: "Chatbot + CRM intégré", price: 900, deliveryDays: 21, revisions: 4, features: ["IA avancée", "CRM intégré", "Multi-langue", "Apprentissage continu", "Support 3 mois"] } }, vendorId: "v6", rating: 4.8, reviewCount: 27, orderCount: 58, featured: true, createdAt: "2024-03-20", faq: [] },
  { id: "srv23", slug: "jingle-musique-marque", title: "Je vais composer le jingle et la signature musicale de votre marque", shortDesc: "Composition originale, droits libres, adaptée à tous vos supports médias.", description: "Votre marque mérite une signature musicale inoubliable.", category: "Audio & Musique", categorySlug: "audio", tags: ["Jingle", "Composition", "Musique marque", "Droits", "Sonore"], images: ["https://picsum.photos/seed/srv23/800/500"], packages: { basic: { name: "Basique", description: "Jingle 5-10 secondes", price: 80, deliveryDays: 5, revisions: 2, features: ["Jusqu'à 10s", "Droits commerciaux", "MP3 + WAV"] }, standard: { name: "Standard", description: "Jingle + variantes 30s", price: 200, deliveryDays: 10, revisions: 3, features: ["30 secondes", "Version courte et longue", "Musique fond incluse"] }, premium: { name: "Premium", description: "Identité sonore complète", price: 500, deliveryDays: 21, revisions: 5, features: ["Jingle + ambiances", "Versions multiples", "Format radio + web", "Usage exclusif"] } }, vendorId: "v9", rating: 4.9, reviewCount: 18, orderCount: 42, featured: false, createdAt: "2024-01-30", faq: [] },
  { id: "srv24", slug: "reels-instagram-shorts", title: "Je vais créer vos Reels Instagram et YouTube Shorts viraux", shortDesc: "Vidéos courtes dynamiques avec montage, sous-titres et musique tendance.", description: "Des Reels qui cartonnent et qui font grandir votre audience.", category: "Vidéo & Animation", categorySlug: "video", tags: ["Reels", "Instagram", "YouTube Shorts", "TikTok", "Vertical"], images: ["https://picsum.photos/seed/srv24/800/500"], packages: { basic: { name: "Basique", description: "3 Reels", price: 60, deliveryDays: 3, revisions: 1, features: ["3 vidéos 15-30s", "Sous-titres", "Musique tendance"] }, standard: { name: "Standard", description: "8 Reels + stratégie", price: 150, deliveryDays: 7, revisions: 2, features: ["8 vidéos", "Textes accrocheurs", "Hashtags optimisés", "Planification"] }, premium: { name: "Premium", description: "Pack mensuel 20 Reels", price: 350, deliveryDays: 30, revisions: 3, features: ["20 vidéos/mois", "Stratégie éditoriale", "Templates réutilisables"] } }, vendorId: "v4", rating: 4.7, reviewCount: 34, orderCount: 88, featured: false, createdAt: "2024-02-05", faq: [] },
  { id: "srv25", slug: "business-plan-startup", title: "Je vais rédiger votre business plan complet et prêt pour les investisseurs", shortDesc: "Business plan structuré, financier et stratégique pour lever des fonds ou convaincre.", description: "Un business plan qui ouvre les portes des investisseurs.", category: "Business", categorySlug: "business", tags: ["Business plan", "Startup", "Investisseurs", "Finance", "Stratégie"], images: ["https://picsum.photos/seed/srv25/800/500"], packages: { basic: { name: "Basique", description: "Plan simplifié 10 pages", price: 150, deliveryDays: 7, revisions: 2, features: ["Résumé exécutif", "Marché cible", "Modèle économique", "Projections 1 an"] }, standard: { name: "Standard", description: "Business plan complet 30 pages", price: 380, deliveryDays: 14, revisions: 3, features: ["Analyse marché", "Stratégie commerciale", "Projections 3 ans", "Pitchdeck"] }, premium: { name: "Premium", description: "Dossier investisseur premium", price: 800, deliveryDays: 21, revisions: 5, features: ["Business plan + pitch", "Due diligence", "Étude terrain", "Présentation investisseurs"] } }, vendorId: "v3", rating: 4.6, reviewCount: 29, orderCount: 61, featured: false, createdAt: "2024-01-15", faq: [] },
  { id: "srv26", slug: "formation-excel-avance", title: "Je vais vous former à Excel avancé pour analyser vos données efficacement", shortDesc: "Formation Excel : tableaux croisés, formules avancées, macros VBA et Power Query.", description: "Maîtrisez Excel comme un pro en 4 sessions intensives.", category: "Formation", categorySlug: "formation", tags: ["Excel", "Formation", "VBA", "Power Query", "Tableaux croisés"], images: ["https://picsum.photos/seed/srv26/800/500"], packages: { basic: { name: "Débutant", description: "2h Excel fondamentaux", price: 60, deliveryDays: 7, revisions: 0, features: ["Formules de base", "Mise en forme", "Graphiques simples"] }, standard: { name: "Intermédiaire", description: "4h Excel avancé", price: 140, deliveryDays: 14, revisions: 0, features: ["Tableaux croisés", "RECHERCHEV", "Power Query", "Exercices réels"] }, premium: { name: "Avancé", description: "8h + VBA et automatisation", price: 280, deliveryDays: 30, revisions: 0, features: ["Macros VBA", "Automatisation", "Dashboards", "Support 2 semaines"] } }, vendorId: "v10", rating: 4.7, reviewCount: 41, orderCount: 96, featured: false, createdAt: "2023-11-20", faq: [] },
  { id: "srv27", slug: "refonte-seo-wordpress", title: "Je vais refondre et optimiser SEO votre site WordPress existant", shortDesc: "Audit + corrections techniques + optimisation on-page + vitesse pour booster le classement.", description: "Faites passer votre site WordPress en première page Google.", category: "SEO", categorySlug: "seo", tags: ["SEO", "WordPress", "Vitesse", "Core Web Vitals", "Refonte"], images: ["https://picsum.photos/seed/srv27/800/500"], packages: { basic: { name: "Basique", description: "Audit + 5 corrections", price: 100, deliveryDays: 5, revisions: 1, features: ["Audit technique", "5 corrections prioritaires", "Rapport PDF"] }, standard: { name: "Standard", description: "Optimisation complète", price: 280, deliveryDays: 10, revisions: 2, features: ["Corrections illimitées", "Vitesse < 2s", "Yoast SEO configuré", "Rapport complet"] }, premium: { name: "Premium", description: "Refonte SEO + contenu", price: 600, deliveryDays: 21, revisions: 3, features: ["Toutes corrections", "5 articles optimisés", "Plan de contenu 3 mois", "Suivi mensuel"] } }, vendorId: "v3", rating: 4.8, reviewCount: 44, orderCount: 103, featured: true, createdAt: "2023-09-10", faq: [] },
  { id: "srv28", slug: "copywriting-ads-pub", title: "Je vais rédiger vos accroches publicitaires et textes de vente", shortDesc: "Copywriting persuasif pour vos pubs Facebook, Google Ads, landing pages et emails.", description: "Des mots qui vendent. Chaque ligne compte.", category: "Rédaction & Traduction", categorySlug: "redaction", tags: ["Copywriting", "Publicité", "Facebook Ads", "Textes de vente", "Persuasion"], images: ["https://picsum.photos/seed/srv28/800/500"], packages: { basic: { name: "Basique", description: "5 accroches pub", price: 45, deliveryDays: 2, revisions: 1, features: ["5 variantes d'accroche", "Format Facebook/Instagram", "Headline + body"] }, standard: { name: "Standard", description: "Pack campagne complète", price: 120, deliveryDays: 4, revisions: 2, features: ["15 accroches", "3 angles marketing", "A/B test ready", "CTA inclus"] }, premium: { name: "Premium", description: "Stratégie copwriting complète", price: 300, deliveryDays: 10, revisions: 3, features: ["Copywriting stratégique", "Landing page", "Email séquence", "Rapport conversion"] } }, vendorId: "v5", rating: 4.6, reviewCount: 66, orderCount: 158, featured: false, createdAt: "2023-07-20", faq: [] },
  { id: "srv29", slug: "presentation-powerpoint", title: "Je vais créer votre présentation PowerPoint ou Keynote professionnelle", shortDesc: "Slides percutantes, design premium, pitch deck investisseurs ou présentation client.", description: "Des slides qui impressionnent dès le premier regard.", category: "Design & Créatif", categorySlug: "design", tags: ["PowerPoint", "Pitch deck", "Présentation", "Keynote", "Design slides"], images: ["https://picsum.photos/seed/srv29/800/500"], packages: { basic: { name: "Basique", description: "10 slides", price: 60, deliveryDays: 3, revisions: 2, features: ["10 slides", "Template cohérent", "Format PPT + PDF"] }, standard: { name: "Standard", description: "20 slides premium", price: 150, deliveryDays: 5, revisions: 3, features: ["20 slides", "Animations", "Icônes custom", "Format Keynote + PPT"] }, premium: { name: "Premium", description: "Pitch deck investisseur", price: 380, deliveryDays: 10, revisions: 5, features: ["Slides illimitées", "Design premium", "Narration incluse", "Formation présentation"] } }, vendorId: "v7", rating: 4.8, reviewCount: 61, orderCount: 147, featured: false, createdAt: "2023-12-10", faq: [] },
  { id: "srv30", slug: "app-shopify-boutique", title: "Je vais créer et personnaliser votre boutique Shopify", shortDesc: "Setup Shopify complet, thème custom, paiements, apps essentielles et formation.", description: "Votre boutique Shopify prête à vendre en 10 jours.", category: "Développement web", categorySlug: "dev-web", tags: ["Shopify", "E-commerce", "Boutique", "Paiement", "Dropshipping"], images: ["https://picsum.photos/seed/srv30/800/500", "https://picsum.photos/seed/srv30b/800/500"], packages: { basic: { name: "Basique", description: "Setup basique", price: 180, deliveryDays: 7, revisions: 2, features: ["Thème gratuit customisé", "10 produits", "Paiement Stripe", "Formation"] }, standard: { name: "Standard", description: "Boutique complète", price: 420, deliveryDays: 14, revisions: 3, features: ["Thème premium", "50 produits", "Apps essentielles", "Email marketing", "Mobile Money"] }, premium: { name: "Premium", description: "Shopify Plus multi-devises", price: 900, deliveryDays: 21, revisions: 5, features: ["Développement custom", "Multi-langue", "Multi-devises", "Analytics avancé", "Support 3 mois"] } }, vendorId: "v6", rating: 4.9, reviewCount: 48, orderCount: 112, featured: true, createdAt: "2024-02-15", faq: [] },
  { id: "srv31", slug: "photo-portrait-corporate", title: "Je vais réaliser vos portraits corporate et photos d'équipe professionnels", shortDesc: "Séance photo professionnelle pour vos profils LinkedIn, site web et communication.", description: "Des portraits qui inspirent confiance et professionnalisme.", category: "Photographie", categorySlug: "photo", tags: ["Portrait", "Corporate", "LinkedIn", "Équipe", "Headshot"], images: ["https://picsum.photos/seed/srv31/800/500"], packages: { basic: { name: "Basique", description: "1 personne, 10 photos", price: 70, deliveryDays: 4, revisions: 1, features: ["10 poses", "Retouche légère", "Fond uni", "5 photos HD sélectionnées"] }, standard: { name: "Standard", description: "Équipe 5 personnes", price: 250, deliveryDays: 7, revisions: 2, features: ["5 personnes", "Photo équipe + individuels", "Retouche pro", "15 photos HD"] }, premium: { name: "Premium", description: "Séance complète + reportage", price: 600, deliveryDays: 10, revisions: 3, features: ["Équipe illimitée", "Reportage locaux", "Ambiance et lifestyle", "50 photos HD", "Droits presse"] } }, vendorId: "v11", rating: 4.8, reviewCount: 34, orderCount: 78, featured: false, createdAt: "2024-01-05", faq: [] },
  { id: "srv32", slug: "strategie-linkedin-personal-branding", title: "Je vais optimiser votre profil LinkedIn et développer votre personal branding", shortDesc: "Profil LinkedIn optimisé, stratégie de contenu et plan de prospection B2B.", description: "LinkedIn bien utilisé = nouveaux clients chaque mois.", category: "Réseaux sociaux", categorySlug: "social", tags: ["LinkedIn", "Personal branding", "B2B", "Prospection", "Profil"], images: ["https://picsum.photos/seed/srv32/800/500"], packages: { basic: { name: "Basique", description: "Optimisation profil", price: 80, deliveryDays: 3, revisions: 1, features: ["Profil complet optimisé", "Photo + bannière conseils", "Résumé percutant"] }, standard: { name: "Standard", description: "Profil + stratégie 1 mois", price: 200, deliveryDays: 7, revisions: 2, features: ["Profil optimisé", "Plan contenu 1 mois", "4 posts rédigés", "Guide prospection"] }, premium: { name: "Premium", description: "Personal branding complet", price: 500, deliveryDays: 21, revisions: 4, features: ["Stratégie 3 mois", "16 posts", "Messages de prospection", "Formation LinkedIn"] } }, vendorId: "v8", rating: 4.7, reviewCount: 39, orderCount: 87, featured: false, createdAt: "2024-03-01", faq: [] },
  { id: "srv33", slug: "dashboard-powerbi-tableau", title: "Je vais créer vos dashboards Power BI ou Tableau connectés à vos données", shortDesc: "Tableaux de bord interactifs, KPIs en temps réel, filtres dynamiques et partage cloud.", description: "Prenez vos décisions sur la base de données, pas d'intuitions.", category: "Data & IA", categorySlug: "data-ia", tags: ["Power BI", "Tableau", "Dashboard", "KPI", "Business Intelligence"], images: ["https://picsum.photos/seed/srv33/800/500", "https://picsum.photos/seed/srv33b/800/500"], packages: { basic: { name: "Basique", description: "Dashboard 5 KPIs", price: 120, deliveryDays: 5, revisions: 2, features: ["5 indicateurs", "Filtres date", "Connexion Excel/CSV", "Rapport PDF auto"] }, standard: { name: "Standard", description: "Dashboard 15 KPIs", price: 300, deliveryDays: 10, revisions: 3, features: ["15 KPIs", "Multi-source", "Alertes email", "Partage cloud"] }, premium: { name: "Premium", description: "Suite BI complète", price: 700, deliveryDays: 21, revisions: 4, features: ["KPIs illimités", "API connectée", "Prédictions ML", "Formation équipe", "Support 3 mois"] } }, vendorId: "v10", rating: 4.8, reviewCount: 26, orderCount: 59, featured: true, createdAt: "2024-02-25", faq: [] },
  { id: "srv34", slug: "formation-digital-marketing", title: "Je vais vous former au marketing digital de A à Z", shortDesc: "Formation complète : SEO, réseaux sociaux, Google Ads, email marketing et analytics.", description: "Maîtrisez tous les leviers du marketing digital en 1 mois.", category: "Formation", categorySlug: "formation", tags: ["Marketing digital", "Formation", "SEO", "Google Ads", "Analytics"], images: ["https://picsum.photos/seed/srv34/800/500"], packages: { basic: { name: "Débutant", description: "3h introduction", price: 75, deliveryDays: 7, revisions: 0, features: ["3h Zoom", "Supports cours", "Plan d'action"] }, standard: { name: "Intermédiaire", description: "8h formation complète", price: 200, deliveryDays: 14, revisions: 0, features: ["8h en 4 sessions", "Pratique sur vos comptes", "Outils fournis"] }, premium: { name: "Avancé", description: "Coaching 1 mois", price: 450, deliveryDays: 30, revisions: 0, features: ["Coaching personnalisé", "Plan de lancement", "Suivi hebdo", "Certification"] } }, vendorId: "v8", rating: 4.6, reviewCount: 48, orderCount: 102, featured: false, createdAt: "2023-10-01", faq: [] },
  { id: "srv35", slug: "traduction-anglais-arabe", title: "Je vais traduire vos contenus du français vers l'arabe et l'anglais", shortDesc: "Traduction trilingue FR/EN/AR professionnelle pour sites web, documents et marketing.", description: "Touchez les marchés arabes avec une traduction native de qualité.", category: "Rédaction & Traduction", categorySlug: "redaction", tags: ["Traduction", "Arabe", "Trilingue", "FR/EN/AR", "Localisation"], images: ["https://picsum.photos/seed/srv35/800/500"], packages: { basic: { name: "Basique", description: "500 mots 1 langue", price: 30, deliveryDays: 2, revisions: 1, features: ["500 mots", "FR → EN ou AR", "Relecture native"] }, standard: { name: "Standard", description: "2000 mots trilingue", price: 100, deliveryDays: 5, revisions: 2, features: ["2000 mots", "3 langues", "Adapté culturellement", "Format original"] }, premium: { name: "Premium", description: "Site web complet trilingue", price: 350, deliveryDays: 14, revisions: 3, features: ["Site web entier", "3 langues", "SEO multilingue", "Test utilisateurs"] } }, vendorId: "v5", rating: 4.7, reviewCount: 55, orderCount: 128, featured: false, createdAt: "2023-06-01", faq: [] },
  { id: "srv36", slug: "creation-app-flutter", title: "Je vais développer votre application mobile Flutter performante", shortDesc: "App mobile cross-platform Flutter, design Material/Cupertino, publiée sur les stores.", description: "Flutter : une app belle et rapide sur iOS et Android.", category: "Développement web", categorySlug: "dev-web", tags: ["Flutter", "Mobile", "Dart", "iOS", "Android", "Cross-platform"], images: ["https://picsum.photos/seed/srv36/800/500"], packages: { basic: { name: "Basique", description: "App simple 4 écrans", price: 350, deliveryDays: 14, revisions: 2, features: ["4 écrans", "Auth Firebase", "1 intégration API", "Tests basiques"] }, standard: { name: "Standard", description: "App complète 10 écrans", price: 900, deliveryDays: 30, revisions: 3, features: ["10 écrans", "Firebase complet", "Paiements", "Push notifications"] }, premium: { name: "Premium", description: "App avancée + backend", price: 2000, deliveryDays: 60, revisions: 5, features: ["App complète", "Backend Node.js", "Admin dashboard", "Multi-langue", "Support 6 mois"] } }, vendorId: "v1", rating: 4.9, reviewCount: 21, orderCount: 47, featured: false, createdAt: "2024-03-15", faq: [] },
  { id: "srv37", slug: "voice-over-narration", title: "Je vais enregistrer votre voix-off professionnelle en français", shortDesc: "Narration professionnelle pour vos vidéos, publicités, e-learning et podcasts.", description: "Une voix chaleureuse et claire qui capte l'attention.", category: "Audio & Musique", categorySlug: "audio", tags: ["Voix-off", "Narration", "Podcast", "E-learning", "Publicité"], images: ["https://picsum.photos/seed/srv37/800/500"], packages: { basic: { name: "Basique", description: "150 mots", price: 25, deliveryDays: 1, revisions: 1, features: ["150 mots", "Studio qualité", "MP3 + WAV", "24h livraison"] }, standard: { name: "Standard", description: "500 mots + musique fond", price: 70, deliveryDays: 2, revisions: 2, features: ["500 mots", "Musique d'ambiance", "Mixage inclus", "Formats multiples"] }, premium: { name: "Premium", description: "E-learning complet", price: 200, deliveryDays: 5, revisions: 3, features: ["1500 mots", "Sync diaporama", "Chapitrage", "Toutes les déclinaisons"] } }, vendorId: "v9", rating: 4.8, reviewCount: 23, orderCount: 53, featured: false, createdAt: "2024-01-20", faq: [] },
  { id: "srv38", slug: "conseils-juridiques-contrat", title: "Je vais rédiger vos contrats freelance et CGV professionnels", shortDesc: "Contrats de prestation, CGV, NDA et mentions légales conformes au droit français.", description: "Protégez-vous juridiquement avec des contrats solides.", category: "Business", categorySlug: "business", tags: ["Contrat", "CGV", "Juridique", "NDA", "Freelance"], images: ["https://picsum.photos/seed/srv38/800/500"], packages: { basic: { name: "Basique", description: "Contrat de prestation simple", price: 80, deliveryDays: 3, revisions: 1, features: ["Contrat prestations type", "Conforme droit FR", "Format Word"] }, standard: { name: "Standard", description: "Pack juridique freelance", price: 200, deliveryDays: 5, revisions: 2, features: ["Contrat + CGV + CGU", "NDA", "Mentions légales", "Personnalisé"] }, premium: { name: "Premium", description: "Dossier juridique complet", price: 450, deliveryDays: 10, revisions: 3, features: ["Tous documents", "Consultation 1h avocat", "Mise à jour légale", "Archivage sécurisé"] } }, vendorId: "v5", rating: 4.5, reviewCount: 34, orderCount: 76, featured: false, createdAt: "2023-08-01", faq: [] },
  { id: "srv39", slug: "photo-evenement-reportage", title: "Je vais photographier votre événement professionnel ou soirée corporate", shortDesc: "Reportage photo événementiel complet : conférences, soirées, team building, salons.", description: "Immortalisez vos moments importants avec des photos de qualité.", category: "Photographie", categorySlug: "photo", tags: ["Événementiel", "Reportage", "Corporate", "Conférence", "Soirée"], images: ["https://picsum.photos/seed/srv39/800/500", "https://picsum.photos/seed/srv39b/800/500"], packages: { basic: { name: "Basique", description: "3h de reportage", price: 200, deliveryDays: 5, revisions: 1, features: ["3 heures", "100 photos HD", "Retouche légère", "Galerie en ligne"] }, standard: { name: "Standard", description: "Journée complète", price: 450, deliveryDays: 7, revisions: 2, features: ["Journée entière", "250 photos HD", "Retouche pro", "Galerie + clé USB"] }, premium: { name: "Premium", description: "Événement + vidéo highlights", price: 900, deliveryDays: 10, revisions: 3, features: ["Journée + vidéo 3min", "Photos illimitées", "Drone si possible", "Rapport média"] } }, vendorId: "v11", rating: 4.9, reviewCount: 29, orderCount: 65, featured: false, createdAt: "2023-11-01", faq: [] },
  { id: "srv40", slug: "machine-learning-model", title: "Je vais développer et entraîner votre modèle de machine learning", shortDesc: "Modèle ML custom : classification, prédiction, NLP ou vision par ordinateur.", description: "L'IA au service de votre business, sans jargon superflu.", category: "Data & IA", categorySlug: "data-ia", tags: ["Machine Learning", "Python", "TensorFlow", "NLP", "IA", "Prédiction"], images: ["https://picsum.photos/seed/srv40/800/500"], packages: { basic: { name: "Basique", description: "Modèle de classification", price: 200, deliveryDays: 7, revisions: 2, features: ["Modèle entraîné", "Rapport performances", "Notebook commenté"] }, standard: { name: "Standard", description: "Modèle + API REST", price: 500, deliveryDays: 14, revisions: 3, features: ["Modèle custom", "API REST déployée", "Documentation", "Tests intégration"] }, premium: { name: "Premium", description: "Solution ML production-ready", price: 1200, deliveryDays: 30, revisions: 5, features: ["ML pipeline complet", "Monitoring drift", "Dashboard métriques", "Formation équipe", "Support 3 mois"] } }, vendorId: "v10", rating: 4.7, reviewCount: 15, orderCount: 32, featured: false, createdAt: "2024-03-10", faq: [] },
]; // end _REMOVED_SERVICES

export function getServiceById(id: string): MockService | undefined {
  return MOCK_SERVICES.find((s) => s.id === id);
}

export function getServicesByVendor(vendorId: string): MockService[] {
  return MOCK_SERVICES.filter((s) => s.vendorId === vendorId);
}

export function getServicesByCategory(categorySlug: string): MockService[] {
  return MOCK_SERVICES.filter((s) => s.categorySlug === categorySlug);
}

export function getSimilarServices(service: MockService, limit = 4): MockService[] {
  return MOCK_SERVICES.filter(
    (s) => s.id !== service.id && s.categorySlug === service.categorySlug
  ).slice(0, limit);
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export const MOCK_REVIEWS: MockReview[] = [];

const _REMOVED_REVIEWS = [
  {
    id: "r1",
    serviceId: "srv1",
    reviewer: { name: "Mamadou Sow", avatar: "https://i.pravatar.cc/40?u=mamadou", country: "Sénégal", flag: "🇸🇳" },
    rating: 5,
    qualite: 5,
    communication: 5,
    delai: 5,
    comment: "Excellent travail ! Alexandre a livré un site Next.js ultra-rapide, exactement selon nos specs. Communication parfaite, délai respecté. Je recommande vivement.",
    date: "2024-12-15",
    response: "Merci Mamadou ! Ce fut un plaisir de travailler sur ce projet. N'hésitez pas à revenir pour les futures évolutions.",
    helpful: 12,
  },
  {
    id: "r2",
    serviceId: "srv1",
    reviewer: { name: "Isabelle Dupont", avatar: "https://i.pravatar.cc/40?u=isabelle", country: "France", flag: "🇫🇷" },
    rating: 5,
    qualite: 5,
    communication: 4.5,
    delai: 5,
    comment: "Développeur très professionnel. Il a su comprendre mes besoins complexes et les traduire en une solution élégante. Le code est propre et bien documenté.",
    date: "2024-11-28",
    helpful: 8,
  },
  {
    id: "r3",
    serviceId: "srv1",
    reviewer: { name: "Yao Kouassi", avatar: "https://i.pravatar.cc/40?u=yao", country: "Côte d'Ivoire", flag: "🇨🇮" },
    rating: 4,
    qualite: 4.5,
    communication: 3.5,
    delai: 4,
    comment: "Très bon travail globalement. Quelques allers-retours pour les détails du design, mais le résultat final est excellent. Je reviendrai certainement.",
    date: "2024-10-15",
    helpful: 5,
  },
  {
    id: "r4",
    serviceId: "srv2",
    reviewer: { name: "Amine Tahir", avatar: "https://i.pravatar.cc/40?u=amine", country: "Maroc", flag: "🇲🇦" },
    rating: 5,
    qualite: 5,
    communication: 5,
    delai: 4.5,
    comment: "Amara a créé un logo parfait pour mon entreprise. Elle a compris immédiatement l'essence de ma marque. La charte graphique est très professionnelle.",
    date: "2024-12-01",
    helpful: 15,
  },
  {
    id: "r5",
    serviceId: "srv2",
    reviewer: { name: "Sophie Martin", avatar: "https://i.pravatar.cc/40?u=sophie", country: "France", flag: "🇫🇷" },
    rating: 5,
    qualite: 5,
    communication: 4,
    delai: 5,
    comment: "Créativité exceptionnelle ! Le logo est unique, moderne et mémorable. Les fichiers livrés sont de qualité professionnelle. Très satisfaite.",
    date: "2024-11-10",
    helpful: 9,
  },
  {
    id: "r6",
    serviceId: "srv12",
    reviewer: { name: "Kwame Asante", avatar: "https://i.pravatar.cc/40?u=kwame", country: "Ghana", flag: "🇬🇭" },
    rating: 5,
    qualite: 5,
    communication: 4.5,
    delai: 4,
    comment: "Design exceptionnel pour notre app mobile. L'UX est intuitive, le design est magnifique. Notre taux de conversion a augmenté de 40% après l'implémentation.",
    date: "2024-12-20",
    helpful: 18,
  },
  {
    id: "r7",
    serviceId: "srv9",
    reviewer: { name: "Thomas Leroy", avatar: "https://i.pravatar.cc/40?u=thomas", country: "Belgique", flag: "🇧🇪" },
    rating: 5,
    qualite: 5,
    communication: 5,
    delai: 4.5,
    comment: "Creative Minds Studio a créé une identité de marque qui dépasse toutes nos attentes. Le brand book est un document de référence que toute l'équipe utilise.",
    date: "2024-11-25",
    helpful: 7,
  },
]; // end _REMOVED_REVIEWS

export function getReviewsByService(serviceId: string): MockReview[] {
  return MOCK_REVIEWS.filter((r) => r.serviceId === serviceId);
}

// ─── Categories ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { slug: "dev-web", label: "Développement web", icon: "code" },
  { slug: "design", label: "Design & Créatif", icon: "palette" },
  { slug: "marketing", label: "Marketing digital", icon: "campaign" },
  { slug: "redaction", label: "Rédaction & Traduction", icon: "edit_note" },
  { slug: "video", label: "Vidéo & Animation", icon: "videocam" },
  { slug: "audio", label: "Audio & Musique", icon: "music_note" },
  { slug: "data-ia", label: "Data & IA", icon: "psychology" },
  { slug: "business", label: "Business", icon: "business_center" },
  { slug: "photo", label: "Photographie", icon: "photo_camera" },
  { slug: "jeux", label: "Jeux vidéo", icon: "sports_esports" },
  { slug: "seo", label: "SEO", icon: "trending_up" },
  { slug: "social", label: "Réseaux sociaux", icon: "groups" },
  { slug: "formation", label: "Formation", icon: "school" },
  { slug: "ingenierie", label: "Ingénierie", icon: "engineering" },
  { slug: "mode-vie", label: "Mode de vie", icon: "spa" },
] as const;
