// FreelanceHigh — Database Seed (Formations Module)
// Generates realistic test data for the formations platform
// Run: pnpm --filter=@freelancehigh/db seed

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Helpers ──

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateCertCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "FH-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Password hash using bcryptjs (matches auth system)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// ── Data Definitions ──

const FORMATION_CATEGORIES = [
  { id: createId(), name: "Développement Web", slug: "developpement-web", icon: "code", color: "#3B82F6", order: 1 },
  { id: createId(), name: "Design & Créativité", slug: "design-creativite", icon: "palette", color: "#EC4899", order: 2 },
  { id: createId(), name: "Marketing Digital", slug: "marketing-digital", icon: "campaign", color: "#EF4444", order: 3 },
  { id: createId(), name: "Intelligence Artificielle", slug: "intelligence-artificielle", icon: "smart_toy", color: "#6366F1", order: 4 },
  { id: createId(), name: "Business & Freelancing", slug: "business-freelancing", icon: "briefcase", color: "#7C3AED", order: 5 },
  { id: createId(), name: "Développement Mobile", slug: "developpement-mobile", icon: "smartphone", color: "#06B6D4", order: 6 },
  { id: createId(), name: "Cybersécurité", slug: "cybersecurite", icon: "security", color: "#475569", order: 7 },
  { id: createId(), name: "Data Science & Analytics", slug: "data-science-analytics", icon: "analytics", color: "#0EA5E9", order: 8 },
  { id: createId(), name: "Cloud & DevOps", slug: "cloud-devops", icon: "cloud", color: "#F97316", order: 9 },
  { id: createId(), name: "Photographie & Vidéo", slug: "photographie-video", icon: "photo_camera", color: "#D946EF", order: 10 },
  { id: createId(), name: "Musique & Audio", slug: "musique-audio", icon: "music_note", color: "#F59E0B", order: 11 },
  { id: createId(), name: "Langues & Communication", slug: "langues-communication", icon: "translate", color: "#14B8A6", order: 12 },
  { id: createId(), name: "Finance & Comptabilité", slug: "finance-comptabilite", icon: "account_balance", color: "#22C55E", order: 13 },
  { id: createId(), name: "Gestion de Projet", slug: "gestion-de-projet", icon: "assignment", color: "#8B5CF6", order: 14 },
  { id: createId(), name: "Santé & Bien-être", slug: "sante-bien-etre", icon: "spa", color: "#F43F5E", order: 15 },
  { id: createId(), name: "Droit & Juridique", slug: "droit-juridique", icon: "gavel", color: "#78716C", order: 16 },
  { id: createId(), name: "Éducation & Enseignement", slug: "education-enseignement", icon: "school", color: "#2563EB", order: 17 },
  { id: createId(), name: "Sciences & Ingénierie", slug: "sciences-ingenierie", icon: "science", color: "#059669", order: 18 },
  { id: createId(), name: "Rédaction & Contenu", slug: "redaction-contenu", icon: "edit_note", color: "#4F46E5", order: 19 },
  { id: createId(), name: "Blockchain & Web3", slug: "blockchain-web3", icon: "token", color: "#A855F7", order: 20 },
];

const ADMIN_USERS = [
  {
    id: createId(),
    email: "admin@freelancehigh.com",
    name: "Admin Principal",
    country: "FR",
    countryFlag: "🇫🇷",
  },
  {
    id: createId(),
    email: "admin2@freelancehigh.com",
    name: "Modérateur Formations",
    country: "SN",
    countryFlag: "🇸🇳",
  },
  {
    id: createId(),
    email: "admin3@freelancehigh.com",
    name: "Support Technique",
    country: "CI",
    countryFlag: "🇨🇮",
  },
];

const INSTRUCTEUR_USERS = [
  {
    id: createId(),
    email: "instructeur.sophie@test.com",
    name: "Sophie Diallo",
    country: "SN",
    countryFlag: "🇸🇳",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: {
      fr: "Développeuse web senior avec 8 ans d'expérience. Spécialisée en React, Next.js et Node.js. Passionnée par la transmission de savoir en Afrique francophone.",
      en: "Senior web developer with 8 years of experience. Specialized in React, Next.js and Node.js. Passionate about knowledge sharing in francophone Africa.",
    },
    expertise: ["React", "Next.js", "Node.js", "TypeScript", "PostgreSQL"],
    yearsExp: 8,
    linkedin: "https://linkedin.com/in/sophie-diallo-dev",
    website: "https://sophiediallo.dev",
  },
  {
    id: createId(),
    email: "instructeur.marc@test.com",
    name: "Marc Kouadio",
    country: "CI",
    countryFlag: "🇨🇮",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: {
      fr: "Designer UI/UX et directeur artistique. 10 ans dans le design digital. Ancien lead designer chez une startup tech à Abidjan.",
      en: "UI/UX Designer and Art Director. 10 years in digital design. Former lead designer at a tech startup in Abidjan.",
    },
    expertise: ["Figma", "UI Design", "UX Research", "Branding", "Adobe Creative Suite"],
    yearsExp: 10,
    linkedin: "https://linkedin.com/in/marc-kouadio-design",
    youtube: "https://youtube.com/@marc-design",
  },
  {
    id: createId(),
    email: "instructeur.fatou@test.com",
    name: "Fatou Ndiaye",
    country: "FR",
    countryFlag: "🇫🇷",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: {
      fr: "Experte en marketing digital et stratégie de contenu. Formatrice certifiée Google et Facebook. J'ai accompagné plus de 200 entrepreneurs africains.",
      en: "Digital marketing and content strategy expert. Certified Google and Facebook trainer. I have supported over 200 African entrepreneurs.",
    },
    expertise: ["SEO", "Google Ads", "Facebook Ads", "Content Marketing", "Analytics"],
    yearsExp: 7,
    linkedin: "https://linkedin.com/in/fatou-ndiaye-marketing",
    website: "https://fatou-marketing.com",
  },
  {
    id: createId(),
    email: "instructeur.ibrahima@test.com",
    name: "Ibrahima Bah",
    country: "GN",
    countryFlag: "🇬🇳",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    bio: {
      fr: "Ingénieur mobile avec 6 ans d'expérience. Créateur de 12 applications publiées sur les stores. Spécialiste Flutter et React Native, j'enseigne le développement mobile avec une approche projet.",
      en: "Mobile engineer with 6 years of experience. Creator of 12 published apps. Flutter and React Native specialist, I teach mobile development with a project-based approach.",
    },
    expertise: ["Flutter", "React Native", "Dart", "Firebase", "Swift"],
    yearsExp: 6,
    linkedin: "https://linkedin.com/in/ibrahima-bah",
    website: "https://ibrahima-dev.com",
  },
  {
    id: createId(),
    email: "instructeur.aminata@test.com",
    name: "Aminata Koné",
    country: "ML",
    countryFlag: "🇲🇱",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    bio: {
      fr: "Data Scientist senior chez une fintech à Paris. Diplômée de l'École Polytechnique, j'ai formé plus de 500 étudiants en analyse de données et machine learning appliqué aux problématiques africaines.",
      en: "Senior Data Scientist at a Paris fintech. École Polytechnique graduate, I have trained over 500 students in data analysis and machine learning applied to African challenges.",
    },
    expertise: ["Python", "Pandas", "TensorFlow", "SQL", "Power BI"],
    yearsExp: 9,
    linkedin: "https://linkedin.com/in/aminata-kone-data",
  },
  {
    id: createId(),
    email: "instructeur.oumar@test.com",
    name: "Oumar Seck",
    country: "SN",
    countryFlag: "🇸🇳",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    bio: {
      fr: "Expert en cybersécurité certifié CEH et OSCP. 7 ans d'expérience en audit de sécurité et tests de pénétration. Consultant pour des entreprises en Afrique de l'Ouest et en Europe.",
      en: "CEH and OSCP certified cybersecurity expert. 7 years of experience in security auditing and penetration testing. Consultant for companies in West Africa and Europe.",
    },
    expertise: ["Kali Linux", "Metasploit", "Wireshark", "OWASP", "Pentesting"],
    yearsExp: 7,
    linkedin: "https://linkedin.com/in/oumar-seck-sec",
    youtube: "https://youtube.com/@oumar-cybersec",
  },
  {
    id: createId(),
    email: "instructeur.jb@test.com",
    name: "Jean-Baptiste Mukendi",
    country: "CD",
    countryFlag: "🇨🇩",
    avatar: "https://randomuser.me/api/portraits/men/85.jpg",
    bio: {
      fr: "Architecte Cloud et DevOps avec 8 ans d'expérience. Certifié AWS Solutions Architect et Kubernetes CKA. J'accompagne les équipes dans leur transformation DevOps et l'adoption du cloud.",
      en: "Cloud Architect and DevOps with 8 years of experience. AWS Solutions Architect and Kubernetes CKA certified. I guide teams through their DevOps transformation and cloud adoption.",
    },
    expertise: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"],
    yearsExp: 8,
    linkedin: "https://linkedin.com/in/jb-mukendi",
    website: "https://jbmukendi.dev",
  },
  {
    id: createId(),
    email: "instructeur.koffi@test.com",
    name: "Koffi Asante",
    country: "GH",
    countryFlag: "🇬🇭",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    bio: {
      fr: "Développeur blockchain et fondateur d'une startup Web3 à Accra. Expert Solidity avec 5 ans d'expérience. Contributeur actif à l'écosystème DeFi africain et formateur passionné.",
      en: "Blockchain developer and Web3 startup founder in Accra. Solidity expert with 5 years of experience. Active contributor to the African DeFi ecosystem and passionate trainer.",
    },
    expertise: ["Solidity", "Ethereum", "Hardhat", "Web3.js", "DeFi"],
    yearsExp: 5,
    linkedin: "https://linkedin.com/in/koffi-asante-web3",
  },
];

const APPRENANT_USERS = Array.from({ length: 30 }, (_, i) => {
  const firstNames = [
    "Amadou", "Awa", "Ibrahim", "Mariama", "Ousmane",
    "Aissatou", "Moussa", "Khady", "Abdoulaye", "Fatoumata",
    "Cheikh", "Ndeye", "Mamadou", "Bineta", "Thierno",
    "Coumba", "Saliou", "Adja", "Babacar", "Dieynaba",
    "Sekou", "Aminata", "Boubacar", "Mariam", "Youssouf",
    "Kadiatou", "Ibrahima", "Rokia", "Souleymane", "Fanta",
  ];
  const lastNames = [
    "Ba", "Diop", "Sow", "Traore", "Camara",
    "Ndiaye", "Fall", "Mbaye", "Gueye", "Toure",
    "Diallo", "Coulibaly", "Kane", "Sarr", "Cisse",
    "Bah", "Diouf", "Sy", "Drame", "Konate",
    "Keita", "Sangare", "Sidibe", "Ouedraogo", "Savane",
    "Haidara", "Diabate", "Fofana", "Kouyate", "Sissoko",
  ];
  const countries = [
    { code: "SN", flag: "🇸🇳" },
    { code: "CI", flag: "🇨🇮" },
    { code: "CM", flag: "🇨🇲" },
    { code: "FR", flag: "🇫🇷" },
    { code: "ML", flag: "🇲🇱" },
    { code: "BF", flag: "🇧🇫" },
    { code: "GN", flag: "🇬🇳" },
    { code: "BJ", flag: "🇧🇯" },
    { code: "CD", flag: "🇨🇩" },
    { code: "GH", flag: "🇬🇭" },
  ];
  const country = randomItem(countries);
  return {
    id: createId(),
    email: `apprenant${i + 1}@test.com`,
    name: `${firstNames[i]} ${lastNames[i]}`,
    country: country.code,
    countryFlag: country.flag,
  };
});

// Formations data — 20 formations (15 ACTIF, 2 BROUILLON, 2 EN_ATTENTE, 1 ARCHIVE)
const FORMATIONS_DATA = [
  // ── 0: React & Next.js (ACTIF) ──
  {
    title: "React & Next.js : Le Guide Complet 2026",
    shortDesc: "Apprenez React et Next.js de zéro à expert avec des projets concrets",
    description: "Cette formation complète vous guide pas à pas dans la maîtrise de React et Next.js 14. Vous apprendrez le App Router, les Server Components, le SSR, le SSG, et bien plus.\n\nÀ travers 5 projets pratiques progressifs — d'un simple compteur à une application e-commerce complète — vous développerez les compétences nécessaires pour créer des applications web modernes et performantes.\n\nVous découvrirez également les meilleures pratiques de l'écosystème React : gestion d'état avec Zustand, requêtes serveur avec TanStack Query, et déploiement sur Vercel avec CI/CD automatisé.",
    level: "INTERMEDIAIRE" as const,
    price: 49.99,
    originalPrice: 89.99,
    duration: 1800,
    categoryIdx: 0,
    instructeurIdx: 0,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=Bvwq_S0n2pk",
    learnPoints: ["Maîtriser React 19 et ses hooks avancés", "Construire des applications avec Next.js 14 App Router", "Implémenter le SSR, SSG et ISR", "Gérer l'état avec Zustand et TanStack Query", "Déployer sur Vercel avec CI/CD", "Créer des composants réutilisables et testables"],
    requirements: ["Connaissances de base en HTML, CSS et JavaScript", "Un ordinateur avec Node.js installé"],
    targetAudience: "Développeurs web souhaitant maîtriser React et Next.js pour créer des applications modernes. Idéal pour les freelances qui veulent proposer des services de développement frontend premium.",
  },
  // ── 1: Tailwind CSS & shadcn/ui (ACTIF) ──
  {
    title: "Maîtriser Tailwind CSS & shadcn/ui",
    shortDesc: "Créez des interfaces modernes et accessibles avec Tailwind et shadcn/ui",
    description: "Découvrez comment construire des interfaces utilisateur élégantes avec Tailwind CSS et la bibliothèque shadcn/ui. De la mise en page responsive au design system complet.\n\nCette formation vous emmène des bases de Tailwind jusqu'à la création d'un design system professionnel avec shadcn/ui, Radix UI et des animations fluides.\n\nVous apprendrez à créer des composants accessibles, à gérer le mode sombre, et à optimiser vos styles pour la production.",
    level: "DEBUTANT" as const,
    price: 29.99,
    originalPrice: 49.99,
    duration: 900,
    categoryIdx: 0,
    instructeurIdx: 0,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=dFgzHOX84xQ",
    learnPoints: ["Maîtriser les classes utilitaires de Tailwind CSS", "Installer et personnaliser shadcn/ui", "Créer un design system complet", "Concevoir des layouts responsive mobile-first", "Implémenter le mode sombre", "Animer avec Tailwind et Framer Motion"],
    requirements: ["Connaissances en HTML et CSS", "Bases de React"],
    targetAudience: "Développeurs frontend et intégrateurs souhaitant adopter Tailwind CSS et shadcn/ui pour accélérer leur productivité.",
  },
  // ── 2: UI/UX Design (ACTIF) ──
  {
    title: "UI/UX Design : De l'Idée au Prototype",
    shortDesc: "Apprenez à concevoir des interfaces intuitives avec Figma",
    description: "Formez-vous au design d'interface et d'expérience utilisateur. Vous apprendrez à réaliser des wireframes, des maquettes et des prototypes interactifs avec Figma.\n\nCette formation couvre l'ensemble du processus de design : de la recherche utilisateur à la livraison de maquettes haute fidélité, en passant par les tests d'utilisabilité.\n\nÉtudes de cas réels d'applications africaines et projets pratiques inclus. Vous repartirez avec un portfolio de 3 projets complets.",
    level: "TOUS_NIVEAUX" as const,
    price: 39.99,
    originalPrice: 69.99,
    duration: 1200,
    categoryIdx: 1,
    instructeurIdx: 1,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=FTFaQWZBqQ8",
    learnPoints: ["Maîtriser Figma de A à Z", "Mener une recherche utilisateur efficace", "Créer des wireframes et prototypes interactifs", "Appliquer les principes d'accessibilité WCAG", "Construire un design system dans Figma", "Réaliser des tests d'utilisabilité"],
    requirements: ["Aucun prérequis technique", "Créer un compte Figma gratuit"],
    targetAudience: "Aspirants designers, développeurs souhaitant améliorer leurs compétences UI/UX, et entrepreneurs voulant concevoir leurs propres interfaces.",
  },
  // ── 3: Branding (ACTIF) ──
  {
    title: "Branding & Identité Visuelle pour Freelances",
    shortDesc: "Construisez une marque personnelle forte qui attire les clients",
    description: "Dans cette formation, vous apprendrez à créer une identité visuelle professionnelle qui vous démarque de la concurrence. Du logo à la charte graphique, en passant par les supports de communication.\n\nVous découvrirez les fondamentaux du branding adaptés au contexte africain et international, avec des exemples de marques qui ont réussi leur positionnement.\n\nÀ la fin, vous aurez créé votre propre kit de branding complet, prêt à utiliser sur vos réseaux sociaux et supports marketing.",
    level: "DEBUTANT" as const,
    price: 24.99,
    originalPrice: null,
    duration: 600,
    categoryIdx: 1,
    instructeurIdx: 1,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=wJegTiDqPpA",
    learnPoints: ["Créer un logo professionnel avec Figma", "Définir une charte graphique cohérente", "Choisir typographies et couleurs adaptées", "Créer des templates réutilisables pour les réseaux sociaux", "Concevoir des supports de communication impactants"],
    requirements: ["Notions de base en design graphique souhaitées", "Figma ou Canva installé"],
    targetAudience: "Freelances et entrepreneurs souhaitant créer leur identité visuelle sans passer par une agence.",
  },
  // ── 4: SEO & Content Marketing (ACTIF) ──
  {
    title: "SEO & Content Marketing : Stratégie Complète",
    shortDesc: "Dominez les résultats Google et développez votre audience organique",
    description: "Formation complète sur le référencement naturel et le marketing de contenu. Apprenez à positionner vos pages en première page Google, à créer du contenu qui convertit, et à mesurer vos résultats.\n\nVous maîtriserez les techniques SEO on-page et off-page, la recherche de mots-clés avec des outils gratuits et premium, et la création d'une stratégie de contenu efficace.\n\nCas pratiques avec des sites francophones et focus sur le SEO local pour les marchés africains.",
    level: "INTERMEDIAIRE" as const,
    price: 34.99,
    originalPrice: 59.99,
    duration: 1080,
    categoryIdx: 2,
    instructeurIdx: 2,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=DvwS7cV9GmQ",
    learnPoints: ["Maîtriser le SEO on-page et off-page", "Créer une stratégie de contenu qui convertit", "Utiliser Google Search Console et Analytics", "Optimiser le taux de conversion", "Construire une stratégie de backlinks", "Maîtriser le SEO local pour l'Afrique"],
    requirements: ["Site web ou blog existant recommandé", "Compte Google Search Console"],
    targetAudience: "Entrepreneurs, freelances et marketeurs souhaitant augmenter leur visibilité organique sur Google.",
  },
  // ── 5: Python Data Science (ACTIF — NEW) ──
  {
    title: "Python pour la Data Science",
    shortDesc: "Analysez des données et créez des modèles prédictifs avec Python",
    description: "Apprenez à utiliser Python pour l'analyse de données et le machine learning. Cette formation vous guide des bases de Python jusqu'à la création de modèles prédictifs avec scikit-learn.\n\nVous travaillerez avec des jeux de données réels issus du contexte africain : données démographiques, données financières Mobile Money, et données agricoles.\n\nChaque module inclut des exercices pratiques dans Jupyter Notebook et un projet fil rouge de bout en bout.",
    level: "INTERMEDIAIRE" as const,
    price: 44.99,
    originalPrice: 79.99,
    duration: 1500,
    categoryIdx: 7,
    instructeurIdx: 4,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=rfscVS0vtbw",
    learnPoints: ["Maîtriser Python pour l'analyse de données", "Manipuler des datasets avec Pandas et NumPy", "Visualiser les données avec Matplotlib et Seaborn", "Créer des modèles de machine learning avec scikit-learn", "Nettoyer et préparer des données brutes", "Présenter vos résultats dans Jupyter Notebook"],
    requirements: ["Aucune expérience en programmation requise", "Un ordinateur avec Python installé ou Google Colab"],
    targetAudience: "Analystes, étudiants et professionnels souhaitant se reconvertir dans la data science. Adapté au contexte africain.",
  },
  // ── 6: Flutter Mobile (ACTIF — NEW) ──
  {
    title: "Flutter : Créer des Apps Mobile Cross-Platform",
    shortDesc: "Développez des applications iOS et Android avec un seul code Dart",
    description: "Maîtrisez Flutter et Dart pour créer des applications mobiles performantes qui fonctionnent sur iOS et Android à partir d'un seul code source.\n\nDe l'installation à la publication sur les stores, cette formation couvre tous les aspects du développement mobile moderne : widgets, navigation, gestion d'état avec Provider et Riverpod, appels API REST, et Firebase.\n\nVous construirez 3 applications complètes dont une app de livraison inspirée des services populaires en Afrique de l'Ouest.",
    level: "INTERMEDIAIRE" as const,
    price: 39.99,
    originalPrice: 69.99,
    duration: 1320,
    categoryIdx: 5,
    instructeurIdx: 3,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=VPvVD8t02U8",
    learnPoints: ["Maîtriser Dart et la programmation orientée objet", "Construire des interfaces avec les widgets Flutter", "Gérer la navigation et les routes", "Implémenter la gestion d'état avec Provider et Riverpod", "Intégrer des APIs REST et Firebase", "Publier sur Google Play et App Store"],
    requirements: ["Bases en programmation (tout langage)", "Android Studio ou VS Code installé"],
    targetAudience: "Développeurs souhaitant se lancer dans le mobile, freelances voulant proposer des services de développement d'apps.",
  },
  // ── 7: Docker & Kubernetes (ACTIF — NEW) ──
  {
    title: "Docker & Kubernetes : DevOps Maîtrisé",
    shortDesc: "Conteneurisez et orchestrez vos applications comme un pro",
    description: "Apprenez à conteneuriser vos applications avec Docker et à les orchestrer avec Kubernetes. Cette formation vous donnera les compétences DevOps essentielles pour automatiser le déploiement et la gestion de vos applications.\n\nVous découvrirez Docker de zéro, puis progresserez vers Docker Compose pour les environnements multi-services, avant d'aborder Kubernetes pour l'orchestration à l'échelle.\n\nInclut un module sur CI/CD avec GitHub Actions et le déploiement sur AWS/Railway.",
    level: "INTERMEDIAIRE" as const,
    price: 54.99,
    originalPrice: 89.99,
    duration: 1680,
    categoryIdx: 8,
    instructeurIdx: 6,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=fqMOX6JJhGo",
    learnPoints: ["Maîtriser Docker : images, containers, volumes, networks", "Écrire des Dockerfiles optimisés", "Orchestrer des services avec Docker Compose", "Déployer sur Kubernetes (concepts fondamentaux)", "Automatiser avec CI/CD et GitHub Actions", "Monitorer avec Prometheus et Grafana"],
    requirements: ["Connaissances en ligne de commande Linux", "Bases en développement web (backend)"],
    targetAudience: "Développeurs backend et DevOps souhaitant maîtriser la conteneurisation et l'orchestration de leurs applications.",
  },
  // ── 8: Ethical Hacking (ACTIF — NEW) ──
  {
    title: "Ethical Hacking : Cybersécurité Offensive",
    shortDesc: "Apprenez les techniques de hacking éthique pour sécuriser les systèmes",
    description: "Formez-vous à la cybersécurité offensive avec une approche éthique et légale. Cette formation vous enseigne les techniques utilisées par les hackers pour identifier et exploiter les vulnérabilités.\n\nVous apprendrez la reconnaissance, le scanning, l'exploitation et le reporting dans un environnement de laboratoire sécurisé. Chaque technique offensive est accompagnée de sa contre-mesure défensive.\n\nPréparez-vous aux certifications CEH et CompTIA Security+ avec des exercices pratiques sur des machines virtuelles dédiées.",
    level: "AVANCE" as const,
    price: 59.99,
    originalPrice: 99.99,
    duration: 1440,
    categoryIdx: 6,
    instructeurIdx: 5,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=3Kq1MIfTWCE",
    learnPoints: ["Maîtriser les outils de pentesting (Kali Linux, Metasploit)", "Réaliser des scans de vulnérabilités avec Nmap et Nessus", "Exploiter les failles web OWASP Top 10", "Effectuer des tests de pénétration réseau", "Rédiger des rapports de sécurité professionnels", "Comprendre les contre-mesures défensives"],
    requirements: ["Connaissances réseau (TCP/IP, DNS, HTTP)", "Bases en ligne de commande Linux", "Un ordinateur capable de faire tourner des VMs"],
    targetAudience: "Développeurs, administrateurs systèmes et passionnés de sécurité souhaitant se former au pentesting éthique.",
  },
  // ── 9: WordPress (ACTIF — NEW, GRATUIT) ──
  {
    title: "WordPress : Créer un Site Pro sans Coder",
    shortDesc: "Lancez votre site web professionnel en une semaine sans écrire une ligne de code",
    description: "Apprenez à créer un site web professionnel avec WordPress sans aucune connaissance en programmation. De l'installation à la mise en ligne, cette formation couvre tout le processus.\n\nVous apprendrez à choisir et personnaliser un thème, installer les plugins essentiels, optimiser votre site pour le SEO, et le sécuriser contre les attaques courantes.\n\nFormation gratuite pour démocratiser l'accès au web en Afrique francophone.",
    level: "DEBUTANT" as const,
    price: 0,
    originalPrice: null,
    duration: 600,
    categoryIdx: 0,
    instructeurIdx: 0,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=O79pJ7qXaEo",
    learnPoints: ["Installer WordPress sur un hébergement", "Choisir et personnaliser un thème professionnel", "Installer et configurer les plugins essentiels", "Optimiser le SEO de base avec Yoast", "Sécuriser votre site WordPress"],
    requirements: ["Aucun prérequis technique", "Un nom de domaine et hébergement (ou version locale)"],
    targetAudience: "Entrepreneurs, artisans et professionnels souhaitant créer leur présence en ligne rapidement et sans budget technique.",
  },
  // ── 10: Photoshop (ACTIF — NEW) ──
  {
    title: "Adobe Photoshop : Du Débutant au Pro",
    shortDesc: "Maîtrisez Photoshop pour la retouche photo, le design et la création graphique",
    description: "Formation complète sur Adobe Photoshop, de la prise en main de l'interface aux techniques avancées de retouche et de composition. Vous apprendrez à utiliser les calques, masques, filtres et outils de sélection comme un professionnel.\n\nChaque leçon est accompagnée d'exercices pratiques avec des fichiers sources téléchargeables. Vous travaillerez sur des projets concrets : retouche portrait, création d'affiche, montage photo créatif.\n\nIdéal pour les freelances en design graphique qui veulent proposer des services de retouche et création visuelle.",
    level: "TOUS_NIVEAUX" as const,
    price: 34.99,
    originalPrice: 59.99,
    duration: 960,
    categoryIdx: 9,
    instructeurIdx: 1,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=IyR_uYsRdPs",
    learnPoints: ["Naviguer dans l'interface de Photoshop", "Maîtriser les calques, masques et modes de fusion", "Retoucher des portraits professionnellement", "Créer des compositions et montages photo", "Exporter pour le web et l'impression"],
    requirements: ["Adobe Photoshop installé (version d'essai gratuite disponible)", "Aucune expérience préalable requise"],
    targetAudience: "Photographes, designers en herbe et freelances créatifs souhaitant maîtriser l'outil de référence en retouche photo.",
  },
  // ── 11: Gestion de Projet Agile (ACTIF — NEW) ──
  {
    title: "Gestion de Projet Agile : Scrum & Kanban",
    shortDesc: "Gérez vos projets efficacement avec les méthodes agiles",
    description: "Apprenez les méthodologies agiles Scrum et Kanban pour gérer vos projets de manière efficace et collaborative. Cette formation est conçue pour les chefs de projet, les freelances et les équipes qui veulent livrer plus vite et mieux.\n\nVous découvrirez les rôles Scrum (Product Owner, Scrum Master, équipe), les cérémonies (sprint planning, daily, review, retrospective), et les outils de gestion de projet (Jira, Trello, Notion).\n\nInclut des simulations de sprints et des cas pratiques tirés de projets réels en Afrique.",
    level: "DEBUTANT" as const,
    price: 29.99,
    originalPrice: 49.99,
    duration: 780,
    categoryIdx: 13,
    instructeurIdx: 6,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=9TycLR0TqFA",
    learnPoints: ["Comprendre les principes du manifeste agile", "Maîtriser le framework Scrum et ses cérémonies", "Implémenter Kanban pour un flux de travail continu", "Utiliser Jira, Trello et Notion efficacement", "Estimer et planifier un sprint", "Gérer une équipe distribuée en remote"],
    requirements: ["Aucun prérequis technique", "Expérience de travail en équipe souhaitée"],
    targetAudience: "Chefs de projet, freelances, managers et toute personne impliquée dans la gestion de projets numériques.",
  },
  // ── 12: Finances Freelances (ACTIF — NEW) ──
  {
    title: "Finances et Fiscalité pour Freelances",
    shortDesc: "Gérez vos finances, factures et impôts en tant que freelance",
    description: "Tout ce que vous devez savoir sur la gestion financière en tant que freelance, adapté au contexte africain et international. Facturation, fiscalité, comptabilité simplifiée et stratégies d'optimisation.\n\nVous apprendrez à créer des factures conformes, à gérer votre trésorerie, à comprendre vos obligations fiscales selon votre pays, et à mettre de côté pour les impôts et la retraite.\n\nInclut des templates de factures, un tableur de suivi financier, et un guide par pays (Sénégal, Côte d'Ivoire, Cameroun, France).",
    level: "TOUS_NIVEAUX" as const,
    price: 24.99,
    originalPrice: null,
    duration: 540,
    categoryIdx: 12,
    instructeurIdx: 2,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=WEDIj9JBTC8",
    learnPoints: ["Créer des factures professionnelles conformes", "Comprendre la fiscalité freelance par pays", "Gérer sa trésorerie et ses flux de revenus", "Optimiser ses charges et cotisations", "Utiliser les outils de comptabilité simplifiée"],
    requirements: ["Être freelance ou en projet de le devenir", "Avoir des revenus ou un projet de facturation"],
    targetAudience: "Freelances de tous secteurs souhaitant maîtriser leur gestion financière, en Afrique ou à l'international.",
  },
  // ── 13: Solidity & Web3 (ACTIF — NEW) ──
  {
    title: "Solidity & Web3 : Développer sur Ethereum",
    shortDesc: "Créez des smart contracts et des applications décentralisées",
    description: "Plongez dans le développement blockchain avec Solidity et l'écosystème Ethereum. Apprenez à écrire, tester et déployer des smart contracts sécurisés.\n\nVous construirez des applications décentralisées (DApps) en utilisant Hardhat, Ethers.js et React. Chaque module couvre un aspect essentiel : tokens ERC-20, NFTs ERC-721, DeFi basique, et gouvernance.\n\nFocus sur les opportunités Web3 en Afrique : remittances décentralisées, micro-finance et identité numérique.",
    level: "AVANCE" as const,
    price: 69.99,
    originalPrice: 109.99,
    duration: 1800,
    categoryIdx: 19,
    instructeurIdx: 7,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=M576WGiDBdQ",
    learnPoints: ["Comprendre la blockchain Ethereum en profondeur", "Écrire des smart contracts en Solidity", "Tester et déployer avec Hardhat", "Créer des tokens ERC-20 et NFTs ERC-721", "Construire une DApp complète avec React et Ethers.js", "Auditer la sécurité de vos smart contracts"],
    requirements: ["Expérience en JavaScript/TypeScript", "Bases en développement web", "MetaMask installé"],
    targetAudience: "Développeurs souhaitant se lancer dans le Web3 et la blockchain, avec un focus sur les cas d'usage africains.",
  },
  // ── 14: Copywriting (ACTIF — NEW) ──
  {
    title: "Copywriting : L'Art de Vendre avec les Mots",
    shortDesc: "Écrivez des textes qui convertissent et génèrent des ventes",
    description: "Maîtrisez l'art du copywriting pour créer des textes de vente irrésistibles. Des emails marketing aux pages de vente, en passant par les posts réseaux sociaux et les scripts vidéo.\n\nVous apprendrez les frameworks éprouvés (AIDA, PAS, BAB) et les techniques de persuasion appliquées à la rédaction commerciale. Chaque leçon inclut des exemples réels et des exercices de rédaction.\n\nParfait pour les freelances en rédaction et les entrepreneurs qui veulent vendre plus grâce à leurs textes.",
    level: "DEBUTANT" as const,
    price: 19.99,
    originalPrice: 34.99,
    duration: 660,
    categoryIdx: 18,
    instructeurIdx: 2,
    status: "ACTIF" as const,
    thumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop",
    previewVideo: "https://www.youtube.com/watch?v=5j2F1VaHLPk",
    learnPoints: ["Maîtriser les frameworks AIDA, PAS et BAB", "Écrire des pages de vente qui convertissent", "Rédiger des emails marketing percutants", "Créer des posts réseaux sociaux engageants", "Adapter son ton à sa cible et son marché"],
    requirements: ["Bonne maîtrise du français écrit", "Aucune expérience en copywriting requise"],
    targetAudience: "Freelances en rédaction, entrepreneurs, marketeurs et toute personne souhaitant améliorer ses compétences en écriture persuasive.",
  },
  // ── 15: Node.js (BROUILLON) ──
  {
    title: "Node.js & API REST : Architecture Backend",
    shortDesc: "Construisez des APIs performantes et sécurisées avec Node.js",
    description: "Apprenez à concevoir et développer des APIs REST robustes avec Node.js, Express/Fastify, et Prisma. Cette formation couvre l'authentification JWT, la validation des données, les tests et le déploiement.",
    level: "AVANCE" as const,
    price: 59.99,
    originalPrice: 99.99,
    duration: 2400,
    categoryIdx: 0,
    instructeurIdx: 0,
    status: "BROUILLON" as const,
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop",
    learnPoints: ["Architecturer des APIs REST professionnelles", "Implémenter JWT et OAuth", "Utiliser Prisma avec PostgreSQL", "Tester avec Jest et Supertest"],
    requirements: ["JavaScript avancé", "Expérience avec Node.js de base"],
  },
  // ── 16: Prompt Engineering (BROUILLON) ──
  {
    title: "Introduction au Prompt Engineering avec ChatGPT",
    shortDesc: "Apprenez à formuler des prompts efficaces pour exploiter l'IA",
    description: "Découvrez les techniques de prompt engineering pour tirer le meilleur de ChatGPT et des modèles de langage. Applications concrètes pour le travail freelance : rédaction, code, marketing, et plus.",
    level: "DEBUTANT" as const,
    price: 19.99,
    originalPrice: null,
    duration: 480,
    categoryIdx: 3,
    instructeurIdx: 2,
    status: "BROUILLON" as const,
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
    learnPoints: ["Comprendre le fonctionnement des LLM", "Maîtriser les techniques de prompting", "Automatiser des tâches avec l'IA", "Intégrer l'IA dans son workflow"],
    requirements: ["Aucun prérequis technique"],
  },
  // ── 17: Facebook Ads (EN_ATTENTE) ──
  {
    title: "Facebook & Instagram Ads pour Débutants",
    shortDesc: "Créez vos premières campagnes publicitaires rentables",
    description: "Apprenez à créer et optimiser des campagnes publicitaires sur Facebook et Instagram. De la création d'audience au retargeting, en passant par l'A/B testing.",
    level: "DEBUTANT" as const,
    price: 0,
    originalPrice: null,
    duration: 360,
    categoryIdx: 2,
    instructeurIdx: 2,
    status: "EN_ATTENTE" as const,
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop",
    learnPoints: ["Configurer le Business Manager", "Créer des audiences ciblées", "Concevoir des publicités qui convertissent", "Analyser les performances"],
    requirements: ["Un compte Facebook actif"],
  },
  // ── 18: Business Freelance (EN_ATTENTE) ──
  {
    title: "Lancer son Business de Freelance en Afrique",
    shortDesc: "Le guide pratique pour devenir freelance prospère depuis l'Afrique",
    description: "Formation spécialement conçue pour les freelances africains. Couvre la gestion financière, la facturation en multi-devises, le positionnement international, et les méthodes de paiement Mobile Money.",
    level: "TOUS_NIVEAUX" as const,
    price: 14.99,
    originalPrice: 29.99,
    duration: 720,
    categoryIdx: 4,
    instructeurIdx: 2,
    status: "EN_ATTENTE" as const,
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop",
    learnPoints: ["Définir son positionnement et ses tarifs", "Gérer la facturation multi-devises", "Trouver des clients internationaux", "Maîtriser les outils de productivité"],
    requirements: ["Avoir une compétence à vendre"],
  },
  // ── 19: TypeScript Avancé (ARCHIVE) ──
  {
    title: "TypeScript Avancé : Patterns et Bonnes Pratiques",
    shortDesc: "Passez au niveau supérieur avec les types avancés de TypeScript",
    description: "Plongez dans les fonctionnalités avancées de TypeScript : generics, types conditionnels, infer, template literal types, et patterns architecturaux.",
    level: "AVANCE" as const,
    price: 44.99,
    originalPrice: 79.99,
    duration: 1500,
    categoryIdx: 0,
    instructeurIdx: 0,
    status: "ARCHIVE" as const,
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop",
    learnPoints: ["Maîtriser les generics avancés", "Implémenter des types conditionnels", "Créer des types utilitaires", "Appliquer les patterns TypeScript"],
    requirements: ["Expérience avec TypeScript basique", "Connaissance de JavaScript ES6+"],
  },
];

// Section/Lesson templates for all 15 ACTIF formations
type LT = { title: string; type: "VIDEO" | "TEXTE" | "QUIZ"; duration: number; videoUrl?: string; content?: string };
type ST = { title: string; lessons: LT[] };
const SECTION_TEMPLATES: Record<number, ST[]> = {
  // ── 0: React & Next.js ──
  0: [
    { title: "Introduction et Configuration", lessons: [
      { title: "Bienvenue dans la formation", type: "VIDEO", duration: 8, videoUrl: "https://www.youtube.com/watch?v=Bvwq_S0n2pk" },
      { title: "Installation de l'environnement", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk" },
      { title: "Premiers pas avec React", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=w7ejDZ8SWv8" },
      { title: "Ressources et documentation", type: "TEXTE", duration: 5, content: "<h2>Ressources essentielles</h2><p>Voici les liens vers la documentation officielle de React et Next.js. Gardez-les à portée de main tout au long de la formation.</p><p>React : reactjs.org/docs — Next.js : nextjs.org/docs — TypeScript : typescriptlang.org/docs</p>" },
    ]},
    { title: "Les Fondamentaux de React", lessons: [
      { title: "Composants et JSX", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=dpw9EHDh2bM" },
      { title: "Props et State", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=4UZrsTqkcW4" },
      { title: "Hooks essentiels : useState, useEffect", type: "VIDEO", duration: 35, videoUrl: "https://www.youtube.com/watch?v=CvDTwnHcZqQ" },
      { title: "Exercice pratique : Todo App", type: "TEXTE", duration: 45, content: "<h2>Exercice : Construire une Todo App</h2><p>Mettez en pratique les concepts appris en créant une application Todo complète avec useState et useEffect. L'application doit permettre d'ajouter, supprimer et marquer des tâches comme complétées.</p><p>Bonus : Ajoutez la persistance avec localStorage et un filtre par statut (toutes, actives, complétées).</p>" },
    ]},
    { title: "Next.js 14 App Router", lessons: [
      { title: "Architecture du App Router", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=Sklc_fQBmcs" },
      { title: "Server Components vs Client Components", type: "VIDEO", duration: 32, videoUrl: "https://www.youtube.com/watch?v=__mSgDEOyv8" },
      { title: "Layouts et Loading States", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=T8TZQ6k4SLE" },
    ]},
    { title: "Projet Final et Déploiement", lessons: [
      { title: "Projet E-commerce : Structure", type: "VIDEO", duration: 35, videoUrl: "https://www.youtube.com/watch?v=f55qeKGgB_M" },
      { title: "Déploiement sur Vercel", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=4UZrsTqkcW4" },
      { title: "Quiz final React & Next.js", type: "QUIZ", duration: 20 },
    ]},
  ],
  // ── 1: Tailwind CSS & shadcn/ui ──
  1: [
    { title: "Découverte de Tailwind CSS", lessons: [
      { title: "Qu'est-ce que Tailwind CSS ?", type: "VIDEO", duration: 12, videoUrl: "https://www.youtube.com/watch?v=dFgzHOX84xQ" },
      { title: "Installation et configuration", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=ft30zcMlFao" },
      { title: "Classes utilitaires essentielles", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=pfaSUYaSgRo" },
    ]},
    { title: "Mise en Page Responsive", lessons: [
      { title: "Flexbox avec Tailwind", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=lZHBGwxPdMw" },
      { title: "CSS Grid avec Tailwind", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=YrtFtdTTfv0" },
      { title: "Guide des breakpoints", type: "TEXTE", duration: 8, content: "<h2>Guide des Breakpoints Tailwind</h2><p>Tailwind utilise une approche mobile-first. Les breakpoints sont : sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px). Appliquez les styles de base pour mobile, puis ajoutez les variantes pour les écrans plus grands.</p>" },
    ]},
    { title: "shadcn/ui : Composants Accessibles", lessons: [
      { title: "Introduction à shadcn/ui", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=tS7upsfuxmo" },
      { title: "Installer et personnaliser les composants", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=bJzb5LVNYiY" },
    ]},
    { title: "Design System et Projet Final", lessons: [
      { title: "Créer son design system complet", type: "VIDEO", duration: 35, videoUrl: "https://www.youtube.com/watch?v=dFgzHOX84xQ" },
      { title: "Mode sombre avec Tailwind", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=ft30zcMlFao" },
      { title: "Quiz final Tailwind & shadcn/ui", type: "QUIZ", duration: 15 },
    ]},
  ],
  // ── 2: UI/UX Design ──
  2: [
    { title: "Fondamentaux du UX Design", lessons: [
      { title: "Qu'est-ce que le UX Design ?", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=FTFaQWZBqQ8" },
      { title: "Recherche utilisateur : méthodes", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=dXQ7IHkTiMM" },
      { title: "Check-list de recherche UX", type: "TEXTE", duration: 10, content: "<h2>Checklist Recherche UX</h2><p>Avant de commencer à designer, validez ces points : 1) Définir les objectifs de recherche, 2) Identifier les personas cibles, 3) Choisir les méthodes (interviews, surveys, tests), 4) Préparer les guides d'entretien, 5) Recruter les participants.</p>" },
    ]},
    { title: "Wireframing et Parcours Utilisateur", lessons: [
      { title: "Personas et parcours utilisateur", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=Gu1so3pz4bA" },
      { title: "Wireframes basse et haute fidélité", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=B_ytMSuwbf8" },
    ]},
    { title: "Prise en Main de Figma", lessons: [
      { title: "Interface et outils de base", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=FTFaQWZBqQ8" },
      { title: "Composants et variantes", type: "VIDEO", duration: 35, videoUrl: "https://www.youtube.com/watch?v=NK9WNWPKGMY" },
      { title: "Auto Layout avancé", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=dXQ7IHkTiMM" },
    ]},
    { title: "Prototypage et Tests", lessons: [
      { title: "Prototypes interactifs dans Figma", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=Gu1so3pz4bA" },
      { title: "Tests d'utilisabilité", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=B_ytMSuwbf8" },
      { title: "Quiz final UI/UX Design", type: "QUIZ", duration: 15 },
    ]},
  ],
  // ── 3: Branding ──
  3: [
    { title: "Les Bases du Branding", lessons: [
      { title: "Qu'est-ce qu'une marque ?", type: "VIDEO", duration: 12, videoUrl: "https://www.youtube.com/watch?v=wJegTiDqPpA" },
      { title: "Définir son positionnement", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=YqQx75OPRa0" },
      { title: "Étude de cas : marques africaines", type: "TEXTE", duration: 15, content: "<h2>Étude de cas : Marques africaines qui réussissent</h2><p>Analysons trois marques africaines qui ont bâti une identité forte : Jumia (e-commerce panafricain), Wave (fintech sénégalaise), et Andela (talent tech). Chacune a su créer une identité visuelle distinctive et un positionnement clair sur son marché.</p><p>Points communs : couleurs vives, message centré sur l'impact, authenticité culturelle.</p>" },
    ]},
    { title: "Création du Logo et Identité", lessons: [
      { title: "Principes de création de logo", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=wJegTiDqPpA" },
      { title: "Atelier pratique : votre logo", type: "VIDEO", duration: 40, videoUrl: "https://www.youtube.com/watch?v=YqQx75OPRa0" },
    ]},
    { title: "Supports de Communication", lessons: [
      { title: "Charte graphique complète", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=wJegTiDqPpA" },
      { title: "Templates réseaux sociaux", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=YqQx75OPRa0" },
      { title: "Brief créatif template", type: "TEXTE", duration: 5, content: "<h2>Template de Brief Créatif</h2><p>Un bon brief créatif contient : 1) Contexte du projet, 2) Objectifs, 3) Cible, 4) Message clé, 5) Ton et style, 6) Contraintes techniques, 7) Livrables attendus, 8) Deadline. Téléchargez le template dans les ressources.</p>" },
    ]},
    { title: "Stratégie de Marque Personnelle", lessons: [
      { title: "Personal branding pour freelances", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=wJegTiDqPpA" },
      { title: "Quiz final Branding", type: "QUIZ", duration: 15 },
    ]},
  ],
  // ── 4: SEO & Content Marketing ──
  4: [
    { title: "Fondamentaux du SEO", lessons: [
      { title: "Comment fonctionne Google", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ" },
      { title: "Recherche de mots-clés", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=nU_IIXBWlS4" },
      { title: "SEO on-page : les essentiels", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=MYE6T_gd7H0" },
      { title: "Checklist SEO on-page", type: "TEXTE", duration: 8, content: "<h2>Checklist SEO On-Page</h2><p>Pour chaque page, vérifiez : balise title unique (60 car.), meta description (155 car.), URL propre, H1 unique, hiérarchie des titres, images alt text, maillage interne, vitesse de chargement < 3s, mobile-friendly.</p>" },
    ]},
    { title: "Stratégie de Contenu", lessons: [
      { title: "Créer un calendrier éditorial", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ" },
      { title: "Rédiger pour le web", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=nU_IIXBWlS4" },
    ]},
    { title: "SEO Technique et Netlinking", lessons: [
      { title: "Optimisation technique du site", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=MYE6T_gd7H0" },
      { title: "Stratégie de backlinks", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ" },
    ]},
    { title: "Analytics et Optimisation", lessons: [
      { title: "Mesurer les résultats avec Analytics", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=nU_IIXBWlS4" },
      { title: "Outils SEO recommandés", type: "TEXTE", duration: 10, content: "<h2>Outils SEO Recommandés</h2><p>Gratuits : Google Search Console, Google Analytics, Ubersuggest (limité). Premium : Ahrefs, SEMrush, Surfer SEO. Pour le SEO local en Afrique, Google Business Profile est indispensable.</p>" },
      { title: "Quiz final SEO", type: "QUIZ", duration: 15 },
    ]},
  ],
  // ── 5: Python Data Science ──
  5: [
    { title: "Python : Les Bases", lessons: [
      { title: "Installation de Python et Jupyter", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc" },
      { title: "Variables, types et structures", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw" },
      { title: "Fonctions et modules", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc" },
    ]},
    { title: "NumPy et Pandas pour l'Analyse", lessons: [
      { title: "Introduction à NumPy", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=7eh4d6sabA0" },
      { title: "Manipulation de données avec Pandas", type: "VIDEO", duration: 35, videoUrl: "https://www.youtube.com/watch?v=vmEHCJofslg" },
      { title: "Nettoyage de données réelles", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=GPVsHOlRBBI" },
      { title: "Aide-mémoire Pandas", type: "TEXTE", duration: 10, content: "<h2>Aide-mémoire Pandas</h2><p>Opérations essentielles : df.head(), df.describe(), df.info(), df.groupby(), df.merge(), df.pivot_table(), df.fillna(), df.drop_duplicates(). Pour le filtrage : df[df['col'] > value], df.query('col > value').</p>" },
    ]},
    { title: "Visualisation de Données", lessons: [
      { title: "Graphiques avec Matplotlib", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=7eh4d6sabA0" },
      { title: "Visualisations avancées avec Seaborn", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=vmEHCJofslg" },
    ]},
    { title: "Machine Learning Introductif", lessons: [
      { title: "Premiers pas avec scikit-learn", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=GPVsHOlRBBI" },
      { title: "Projet : Prédiction sur données africaines", type: "VIDEO", duration: 40, videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw" },
      { title: "Quiz final Python Data Science", type: "QUIZ", duration: 20 },
    ]},
  ],
  // ── 6: Flutter Mobile ──
  6: [
    { title: "Dart et Flutter : Les Bases", lessons: [
      { title: "Introduction à Dart", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=VPvVD8t02U8" },
      { title: "Installation de Flutter", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=1ukSR1GRtMU" },
      { title: "Premier projet Flutter", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=x0uinJvhNxI" },
    ]},
    { title: "Widgets et Mise en Page", lessons: [
      { title: "Widgets de base (Text, Container, Column, Row)", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=CD1Y2DmL5JM" },
      { title: "Listes et grilles dynamiques", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=VPvVD8t02U8" },
      { title: "Guide des widgets Flutter", type: "TEXTE", duration: 10, content: "<h2>Guide des Widgets Flutter</h2><p>Widgets essentiels : Scaffold, AppBar, Container, Column, Row, Stack, ListView, GridView, Card, Text, Image, Icon, ElevatedButton, TextField. Pensez composition : chaque écran est un arbre de widgets imbriqués.</p>" },
    ]},
    { title: "Navigation et État", lessons: [
      { title: "Navigation et routes nommées", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=1ukSR1GRtMU" },
      { title: "Gestion d'état avec Provider", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=x0uinJvhNxI" },
    ]},
    { title: "APIs, Firebase et Publication", lessons: [
      { title: "Appels API REST avec http/dio", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=CD1Y2DmL5JM" },
      { title: "Intégration Firebase", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=VPvVD8t02U8" },
      { title: "Quiz final Flutter", type: "QUIZ", duration: 15 },
    ]},
  ],
  // ── 7: Docker & Kubernetes ──
  7: [
    { title: "Introduction à Docker", lessons: [
      { title: "Qu'est-ce que Docker ?", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=fqMOX6JJhGo" },
      { title: "Installation de Docker", type: "VIDEO", duration: 12, videoUrl: "https://www.youtube.com/watch?v=pTFZFxd4hOI" },
      { title: "Premiers containers", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=3c_iBn73dDE" },
    ]},
    { title: "Images et Dockerfiles", lessons: [
      { title: "Écrire un Dockerfile optimisé", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=Wf2eSG3owoA" },
      { title: "Volumes et persistance", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=fqMOX6JJhGo" },
      { title: "Networks et communication inter-containers", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=pTFZFxd4hOI" },
    ]},
    { title: "Docker Compose", lessons: [
      { title: "Multi-services avec Docker Compose", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=3c_iBn73dDE" },
      { title: "Environnements dev vs prod", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=Wf2eSG3owoA" },
      { title: "Bonnes pratiques Docker", type: "TEXTE", duration: 10, content: "<h2>Bonnes Pratiques Docker</h2><p>1) Utilisez des images Alpine légères, 2) Multi-stage builds, 3) Un processus par container, 4) Ne stockez pas de secrets dans les images, 5) Utilisez .dockerignore, 6) Scannez les vulnérabilités avec docker scout.</p>" },
    ]},
    { title: "Introduction à Kubernetes", lessons: [
      { title: "Concepts fondamentaux de K8s", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=X48VuDVv0do" },
      { title: "Pods, Services et Deployments", type: "VIDEO", duration: 35, videoUrl: "https://www.youtube.com/watch?v=fqMOX6JJhGo" },
      { title: "Quiz final Docker & K8s", type: "QUIZ", duration: 20 },
    ]},
  ],
  // ── 8: Ethical Hacking ──
  8: [
    { title: "Fondamentaux de la Cybersécurité", lessons: [
      { title: "Introduction à la cybersécurité", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=3Kq1MIfTWCE" },
      { title: "Les types d'attaques", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=fNzpcB7ODxQ" },
      { title: "Mise en place du lab Kali Linux", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=lpa8uy4DyMo" },
    ]},
    { title: "Reconnaissance et Scanning", lessons: [
      { title: "OSINT et reconnaissance passive", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=HRBbR8NmQKo" },
      { title: "Scanning avec Nmap", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=3Kq1MIfTWCE" },
      { title: "Analyse de vulnérabilités", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=fNzpcB7ODxQ" },
    ]},
    { title: "Exploitation des Vulnérabilités", lessons: [
      { title: "OWASP Top 10 : les failles web", type: "VIDEO", duration: 35, videoUrl: "https://www.youtube.com/watch?v=lpa8uy4DyMo" },
      { title: "Exploitation avec Metasploit", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=HRBbR8NmQKo" },
    ]},
    { title: "Sécurité Défensive et Reporting", lessons: [
      { title: "Contre-mesures et hardening", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=3Kq1MIfTWCE" },
      { title: "Rédiger un rapport de pentest", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=fNzpcB7ODxQ" },
      { title: "Quiz final Ethical Hacking", type: "QUIZ", duration: 20 },
    ]},
  ],
  // ── 9: WordPress ──
  9: [
    { title: "Installation et Configuration", lessons: [
      { title: "Hébergement et installation WordPress", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=O79pJ7qXaEo" },
      { title: "Tour de l'interface d'administration", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=8AZ8GqW5iak" },
    ]},
    { title: "Thèmes et Personnalisation", lessons: [
      { title: "Choisir et installer un thème", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=UT3No6nswz8" },
      { title: "Personnaliser avec l'éditeur de blocs", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=O79pJ7qXaEo" },
      { title: "Guide des thèmes recommandés", type: "TEXTE", duration: 8, content: "<h2>Thèmes WordPress Recommandés</h2><p>Gratuits : Astra, Kadence, GeneratePress. Premium : Divi, Avada, OceanWP Pro. Pour les débutants, Astra + Starter Templates est le meilleur choix : rapide, personnalisable et compatible avec tous les page builders.</p>" },
    ]},
    { title: "Plugins Essentiels", lessons: [
      { title: "Les 10 plugins indispensables", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=8AZ8GqW5iak" },
      { title: "Formulaires et pages de contact", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=UT3No6nswz8" },
    ]},
    { title: "SEO et Lancement", lessons: [
      { title: "SEO WordPress avec Yoast", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=O79pJ7qXaEo" },
      { title: "Sécurité et maintenance", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=8AZ8GqW5iak" },
      { title: "Quiz final WordPress", type: "QUIZ", duration: 15 },
    ]},
  ],
  // ── 10: Photoshop ──
  10: [
    { title: "Interface et Outils de Base", lessons: [
      { title: "Découvrir l'interface Photoshop", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=IyR_uYsRdPs" },
      { title: "Outils de sélection", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=pFyOznL9UvA" },
      { title: "Calques et organisation", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=6MBEB2qN1e0" },
    ]},
    { title: "Retouche Photo", lessons: [
      { title: "Retouche portrait professionnelle", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=IyR_uYsRdPs" },
      { title: "Correction couleur et lumière", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=pFyOznL9UvA" },
    ]},
    { title: "Composition et Effets Créatifs", lessons: [
      { title: "Montage photo et composition", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=6MBEB2qN1e0" },
      { title: "Effets de texte et filtres", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=IyR_uYsRdPs" },
    ]},
    { title: "Export et Workflow Pro", lessons: [
      { title: "Export web et impression", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=pFyOznL9UvA" },
      { title: "Actions et automatisations", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=6MBEB2qN1e0" },
      { title: "Quiz final Photoshop", type: "QUIZ", duration: 15 },
    ]},
  ],
  // ── 11: Gestion de Projet Agile ──
  11: [
    { title: "Introduction à l'Agilité", lessons: [
      { title: "Le manifeste agile", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=9TycLR0TqFA" },
      { title: "Agile vs Waterfall", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=vuBFzAdaHDY" },
      { title: "Résumé des principes agiles", type: "TEXTE", duration: 8, content: "<h2>Les 4 Valeurs Agiles</h2><p>1) Les individus et interactions plutôt que les processus et outils. 2) Un logiciel fonctionnel plutôt qu'une documentation exhaustive. 3) La collaboration avec le client plutôt que la négociation contractuelle. 4) L'adaptation au changement plutôt que le suivi d'un plan.</p>" },
    ]},
    { title: "Scrum en Pratique", lessons: [
      { title: "Les rôles Scrum", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=rIaz_bxNG9o" },
      { title: "Sprint Planning et Daily", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=9TycLR0TqFA" },
      { title: "Review et Rétrospective", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=vuBFzAdaHDY" },
    ]},
    { title: "Kanban et Lean", lessons: [
      { title: "Le tableau Kanban", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=rIaz_bxNG9o" },
      { title: "WIP limits et flow", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=9TycLR0TqFA" },
    ]},
    { title: "Outils et Mise en Œuvre", lessons: [
      { title: "Jira, Trello et Notion en pratique", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=vuBFzAdaHDY" },
      { title: "Simulation de sprint", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=rIaz_bxNG9o" },
      { title: "Quiz final Agile", type: "QUIZ", duration: 15 },
    ]},
  ],
  // ── 12: Finances Freelances ──
  12: [
    { title: "Comprendre sa Fiscalité", lessons: [
      { title: "Statuts juridiques par pays", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=WEDIj9JBTC8" },
      { title: "Impôts et cotisations sociales", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=PHe0bXAIuk0" },
      { title: "Guide fiscal par pays", type: "TEXTE", duration: 15, content: "<h2>Guide Fiscal Freelance par Pays</h2><p>Sénégal : impôt forfaitaire pour les micro-entreprises. Côte d'Ivoire : régime de l'entreprenant. Cameroun : régime simplifié d'imposition. France : micro-entreprise ou EURL. Chaque pays a ses seuils et taux — consultez un comptable local pour les détails.</p>" },
    ]},
    { title: "Facturation et Devis", lessons: [
      { title: "Créer des factures conformes", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=WEDIj9JBTC8" },
      { title: "Devis et conditions générales", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=PHe0bXAIuk0" },
    ]},
    { title: "Gestion de Trésorerie", lessons: [
      { title: "Suivre ses revenus et dépenses", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=WEDIj9JBTC8" },
      { title: "Épargne et provisions pour impôts", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=PHe0bXAIuk0" },
    ]},
    { title: "Optimisation Financière", lessons: [
      { title: "Stratégies d'optimisation", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=WEDIj9JBTC8" },
      { title: "Outils de comptabilité simplifiée", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=PHe0bXAIuk0" },
      { title: "Quiz final Finances", type: "QUIZ", duration: 15 },
    ]},
  ],
  // ── 13: Solidity & Web3 ──
  13: [
    { title: "Blockchain et Ethereum", lessons: [
      { title: "Comprendre la blockchain", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=M576WGiDBdQ" },
      { title: "L'écosystème Ethereum", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=ipwxYa_F1uY" },
      { title: "Configurer MetaMask et un testnet", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=gyMwXuJrbJQ" },
    ]},
    { title: "Solidity : Les Bases", lessons: [
      { title: "Syntaxe Solidity et types", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=coQ5dg8wM2o" },
      { title: "Fonctions, modifiers et events", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=M576WGiDBdQ" },
      { title: "Aide-mémoire Solidity", type: "TEXTE", duration: 10, content: "<h2>Aide-mémoire Solidity</h2><p>Types : uint, int, address, bool, string, bytes, mapping, struct, enum. Visibilité : public, private, internal, external. Modifiers courants : onlyOwner, nonReentrant. Gas optimization : utilisez uint256, évitez les boucles sur les arrays dynamiques.</p>" },
    ]},
    { title: "Smart Contracts Avancés", lessons: [
      { title: "Token ERC-20 de A à Z", type: "VIDEO", duration: 35, videoUrl: "https://www.youtube.com/watch?v=ipwxYa_F1uY" },
      { title: "NFT ERC-721 : créer une collection", type: "VIDEO", duration: 30, videoUrl: "https://www.youtube.com/watch?v=gyMwXuJrbJQ" },
      { title: "Tests et déploiement avec Hardhat", type: "VIDEO", duration: 28, videoUrl: "https://www.youtube.com/watch?v=coQ5dg8wM2o" },
    ]},
    { title: "DApps et Déploiement", lessons: [
      { title: "Frontend React + Ethers.js", type: "VIDEO", duration: 35, videoUrl: "https://www.youtube.com/watch?v=M576WGiDBdQ" },
      { title: "Sécurité des smart contracts", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=ipwxYa_F1uY" },
      { title: "Quiz final Solidity & Web3", type: "QUIZ", duration: 20 },
    ]},
  ],
  // ── 14: Copywriting ──
  14: [
    { title: "Les Fondamentaux du Copywriting", lessons: [
      { title: "Qu'est-ce que le copywriting ?", type: "VIDEO", duration: 12, videoUrl: "https://www.youtube.com/watch?v=5j2F1VaHLPk" },
      { title: "Comprendre sa cible", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=QoY_ByiFpHM" },
      { title: "Les biais cognitifs en copywriting", type: "TEXTE", duration: 10, content: "<h2>Biais Cognitifs pour le Copywriting</h2><p>Les plus puissants : urgence (offre limitée), preuve sociale (témoignages, chiffres), autorité (certifications, médias), réciprocité (contenu gratuit), ancrage (prix barré). Utilisez-les éthiquement pour persuader sans manipuler.</p>" },
    ]},
    { title: "Structures et Formules", lessons: [
      { title: "Framework AIDA", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=5j2F1VaHLPk" },
      { title: "Framework PAS et BAB", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=QoY_ByiFpHM" },
      { title: "Écrire des titres irrésistibles", type: "VIDEO", duration: 15, videoUrl: "https://www.youtube.com/watch?v=5j2F1VaHLPk" },
    ]},
    { title: "Copywriting Digital", lessons: [
      { title: "Pages de vente qui convertissent", type: "VIDEO", duration: 25, videoUrl: "https://www.youtube.com/watch?v=QoY_ByiFpHM" },
      { title: "Email marketing percutant", type: "VIDEO", duration: 22, videoUrl: "https://www.youtube.com/watch?v=5j2F1VaHLPk" },
      { title: "Posts réseaux sociaux engageants", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=QoY_ByiFpHM" },
    ]},
    { title: "Portfolio et Clients", lessons: [
      { title: "Créer un portfolio de copywriter", type: "VIDEO", duration: 20, videoUrl: "https://www.youtube.com/watch?v=5j2F1VaHLPk" },
      { title: "Trouver ses premiers clients", type: "VIDEO", duration: 18, videoUrl: "https://www.youtube.com/watch?v=QoY_ByiFpHM" },
      { title: "Quiz final Copywriting", type: "QUIZ", duration: 15 },
    ]},
  ],
};

// Quiz questions bank — [question, [4 options], correctIndex (0-3), explanation]
type QuizQ = [string, [string, string, string, string], number, string];
const QUIZ_BANK: Record<number, QuizQ[]> = {
  0: [ // React & Next.js
    ["Quel hook React permet de gérer l'état local ?", ["useState", "useEffect", "useRef", "useMemo"], 0, "useState est le hook principal pour gérer l'état local d'un composant."],
    ["Quelle est la particularité des Server Components dans Next.js ?", ["Ils s'exécutent côté serveur uniquement", "Ils ne peuvent pas utiliser de CSS", "Ils remplacent les API routes", "Ils sont toujours asynchrones"], 0, "Les Server Components s'exécutent côté serveur et n'envoient pas de JavaScript au client."],
    ["Que signifie ISR dans Next.js ?", ["Incremental Static Regeneration", "Internal Server Rendering", "Immediate State Refresh", "Inline Script Runner"], 0, "ISR permet de régénérer les pages statiques de manière incrémentale."],
    ["Quel outil est recommandé pour la gestion d'état serveur ?", ["TanStack Query", "Redux", "MobX", "Recoil"], 0, "TanStack Query (React Query) est optimisé pour le cache et le refetch des données serveur."],
    ["Comment déclarer un Client Component dans Next.js App Router ?", ["\"use client\" en haut du fichier", "export const dynamic = 'client'", "En l'important dans _app.tsx", "Avec le suffix .client.tsx"], 0, "La directive \"use client\" en haut du fichier marque un composant comme Client Component."],
  ],
  1: [ // Tailwind CSS
    ["Quelle approche utilise Tailwind CSS ?", ["Utility-first", "BEM", "CSS-in-JS", "Atomic CSS modules"], 0, "Tailwind utilise une approche utility-first avec des classes utilitaires prédéfinies."],
    ["Quel breakpoint correspond à md: dans Tailwind ?", ["768px", "640px", "1024px", "1280px"], 0, "md: correspond à min-width: 768px dans Tailwind CSS."],
    ["Qu'est-ce que shadcn/ui ?", ["Une collection de composants réutilisables", "Un framework CSS complet", "Un éditeur de thèmes", "Un plugin Tailwind"], 0, "shadcn/ui est une collection de composants copiables et personnalisables basés sur Radix UI."],
    ["Comment activer le mode sombre dans Tailwind ?", ["Ajouter darkMode: 'class' dans tailwind.config", "Installer un plugin dark mode", "Utiliser @media (prefers-color-scheme)", "Ajouter dark: true dans le HTML"], 0, "darkMode: 'class' permet de contrôler le mode sombre via une classe CSS sur le HTML."],
    ["Quel outil Tailwind optimise le CSS en production ?", ["PurgeCSS / content config", "PostCSS minify", "CSS tree-shaking", "Webpack CSS loader"], 0, "Tailwind utilise la configuration content pour purger les classes inutilisées en production."],
  ],
  2: [ // UI/UX Design
    ["Quelle est la première étape du processus UX ?", ["Recherche utilisateur", "Wireframing", "Prototypage", "Design visuel"], 0, "La recherche utilisateur est toujours la première étape pour comprendre les besoins."],
    ["Qu'est-ce qu'un persona ?", ["Un profil fictif représentant un utilisateur type", "Un test d'utilisabilité", "Un wireframe simplifié", "Un parcours utilisateur"], 0, "Un persona est un profil fictif qui représente un segment d'utilisateurs cibles."],
    ["Que permet l'Auto Layout dans Figma ?", ["Créer des layouts responsifs automatiques", "Générer du code CSS", "Animer les transitions", "Exporter en SVG"], 0, "Auto Layout permet de créer des layouts qui s'adaptent automatiquement au contenu."],
    ["Quel standard définit les règles d'accessibilité web ?", ["WCAG", "W3C CSS", "ARIA uniquement", "Section 508"], 0, "WCAG (Web Content Accessibility Guidelines) est le standard international d'accessibilité."],
    ["Qu'est-ce qu'un wireframe ?", ["Un schéma de la structure d'une page", "Une maquette haute fidélité", "Un prototype interactif", "Un guide de style"], 0, "Un wireframe est un schéma basse fidélité montrant la structure et la hiérarchie d'une page."],
  ],
  3: [ // Branding
    ["Quel élément N'EST PAS dans une charte graphique ?", ["Le code source du site", "La palette de couleurs", "Les typographies", "Les règles d'utilisation du logo"], 0, "La charte graphique contient les éléments visuels, pas le code technique."],
    ["Qu'est-ce que le positionnement de marque ?", ["La place unique qu'occupe la marque dans l'esprit du consommateur", "Le classement SEO", "La position du logo", "Le prix des services"], 0, "Le positionnement définit comment la marque se différencie dans l'esprit de sa cible."],
    ["Combien de couleurs principales recommande-t-on dans un logo ?", ["2 à 3", "1 seule", "5 à 7", "Autant que possible"], 0, "Un bon logo utilise généralement 2 à 3 couleurs pour rester simple et mémorable."],
    ["Qu'est-ce que le personal branding ?", ["La gestion de son image professionnelle", "Créer un logo personnel", "Acheter un nom de domaine", "Avoir un bureau professionnel"], 0, "Le personal branding est la gestion stratégique de sa marque personnelle et professionnelle."],
    ["Quel format est préférable pour un logo ?", ["SVG vectoriel", "JPEG haute résolution", "PNG 72dpi", "GIF animé"], 0, "Le SVG est vectoriel, donc redimensionnable sans perte de qualité — idéal pour les logos."],
  ],
  4: [ // SEO
    ["Que signifie SEO ?", ["Search Engine Optimization", "Social Engine Optimization", "Site Enhancement Online", "Search Email Outreach"], 0, "SEO = Search Engine Optimization, l'optimisation pour les moteurs de recherche."],
    ["Quel outil Google est gratuit pour le SEO ?", ["Google Search Console", "Ahrefs", "SEMrush", "Moz Pro"], 0, "Google Search Console est l'outil gratuit officiel de Google pour suivre les performances SEO."],
    ["Qu'est-ce qu'un backlink ?", ["Un lien d'un autre site vers le vôtre", "Un lien interne", "Un lien cassé", "Un lien vers un réseau social"], 0, "Un backlink est un lien entrant depuis un site externe vers votre site."],
    ["Quelle balise HTML est la plus importante pour le SEO on-page ?", ["Title", "Meta description", "H2", "Alt text"], 0, "La balise title est le signal on-page le plus important pour le classement Google."],
    ["Qu'est-ce que le SEO local ?", ["L'optimisation pour les recherches géolocalisées", "Le SEO dans une seule langue", "L'hébergement local du site", "Le référencement sur les réseaux locaux"], 0, "Le SEO local optimise la visibilité pour les recherches avec une intention géographique."],
  ],
  5: [ // Python Data Science
    ["Quelle bibliothèque Python est utilisée pour la manipulation de données ?", ["Pandas", "NumPy", "Matplotlib", "Scikit-learn"], 0, "Pandas est LA bibliothèque de référence pour la manipulation et l'analyse de données tabulaires."],
    ["Qu'est-ce qu'un DataFrame ?", ["Un tableau de données à 2 dimensions", "Un graphique", "Un modèle ML", "Une base de données"], 0, "Un DataFrame Pandas est une structure de données tabulaire avec des lignes et des colonnes."],
    ["Quelle méthode affiche les premières lignes d'un DataFrame ?", ["df.head()", "df.first()", "df.top()", "df.show()"], 0, "df.head() affiche les 5 premières lignes par défaut (paramétrable)."],
    ["Quelle bibliothèque crée des graphiques statistiques avancés ?", ["Seaborn", "Pandas", "NumPy", "TensorFlow"], 0, "Seaborn est construite sur Matplotlib et crée des visualisations statistiques élégantes."],
    ["Qu'est-ce que le machine learning supervisé ?", ["Un apprentissage à partir de données étiquetées", "Un apprentissage sans données", "Un apprentissage par renforcement", "Un apprentissage non supervisé"], 0, "Le ML supervisé apprend à partir d'exemples étiquetés (input → output attendu)."],
  ],
  6: [ // Flutter
    ["Quel langage utilise Flutter ?", ["Dart", "Kotlin", "Swift", "JavaScript"], 0, "Flutter utilise Dart, un langage développé par Google, optimisé pour les interfaces."],
    ["Qu'est-ce qu'un Widget dans Flutter ?", ["Tout élément de l'interface utilisateur", "Un plugin externe", "Une API native", "Un gestionnaire d'état"], 0, "Dans Flutter, tout est Widget — chaque élément visuel est un widget composable."],
    ["Quel widget crée une liste défilante ?", ["ListView", "Column", "Stack", "Container"], 0, "ListView est le widget Flutter pour créer des listes défilantes optimisées."],
    ["Quel package gère l'état dans Flutter ?", ["Provider", "Redux uniquement", "MobX uniquement", "Il n'y en a pas"], 0, "Provider est la solution de gestion d'état recommandée par l'équipe Flutter."],
    ["Comment Flutter compile les apps ?", ["En code natif ARM", "En JavaScript", "En bytecode Java", "En HTML/CSS"], 0, "Flutter compile directement en code natif ARM, ce qui lui donne d'excellentes performances."],
  ],
  7: [ // Docker & K8s
    ["Quelle est la différence entre une image et un container Docker ?", ["L'image est un template, le container est une instance en cours d'exécution", "Aucune différence", "L'image est plus lourde", "Le container est read-only"], 0, "Une image Docker est un template immuable, un container est une instance en exécution de cette image."],
    ["Quel fichier définit la construction d'une image Docker ?", ["Dockerfile", "docker-compose.yml", "package.json", ".dockerignore"], 0, "Le Dockerfile contient les instructions pour construire une image Docker."],
    ["Que fait docker-compose up ?", ["Lance tous les services définis dans docker-compose.yml", "Construit une image", "Publie sur Docker Hub", "Supprime les containers"], 0, "docker-compose up crée et démarre tous les services définis dans le fichier docker-compose.yml."],
    ["Qu'est-ce qu'un Pod dans Kubernetes ?", ["La plus petite unité déployable", "Un cluster de serveurs", "Un namespace", "Un service de load balancing"], 0, "Un Pod est la plus petite unité déployable dans Kubernetes, contenant un ou plusieurs containers."],
    ["Quel outil gère l'infrastructure as code ?", ["Terraform", "Docker", "Kubernetes", "Jenkins"], 0, "Terraform permet de définir et provisionner l'infrastructure avec du code déclaratif."],
  ],
  8: [ // Ethical Hacking
    ["Que signifie OWASP ?", ["Open Web Application Security Project", "Online Web Attack Security Protocol", "Open Wireless Application Standard", "Official Web App Security Platform"], 0, "OWASP est un projet open-source dédié à la sécurité des applications web."],
    ["Quel outil est utilisé pour le scanning de ports ?", ["Nmap", "Wireshark", "Metasploit", "Burp Suite"], 0, "Nmap est l'outil de référence pour le scanning de ports et la découverte réseau."],
    ["Qu'est-ce qu'une injection SQL ?", ["L'insertion de code SQL malveillant dans un formulaire", "Un type de virus", "Une attaque DDoS", "Un scan de ports"], 0, "L'injection SQL exploite les entrées non validées pour exécuter des requêtes malveillantes."],
    ["Quelle distribution Linux est spécialisée en pentesting ?", ["Kali Linux", "Ubuntu", "Fedora", "Arch Linux"], 0, "Kali Linux est la distribution de référence pour le pentesting, avec 600+ outils pré-installés."],
    ["Qu'est-ce que le social engineering ?", ["La manipulation psychologique pour obtenir des informations", "Le développement de réseaux sociaux", "La programmation d'IA sociale", "Le marketing viral"], 0, "Le social engineering exploite la psychologie humaine plutôt que les failles techniques."],
  ],
  9: [ // WordPress
    ["Qu'est-ce que WordPress ?", ["Un CMS open-source", "Un langage de programmation", "Un hébergeur web", "Un framework JavaScript"], 0, "WordPress est un système de gestion de contenu (CMS) open-source alimentant 40%+ du web."],
    ["Quel plugin WordPress est recommandé pour le SEO ?", ["Yoast SEO", "WooCommerce", "Elementor", "Contact Form 7"], 0, "Yoast SEO est le plugin de référence pour l'optimisation SEO sous WordPress."],
    ["Quelle est la différence entre un article et une page WordPress ?", ["Les articles sont chronologiques, les pages sont statiques", "Aucune différence", "Les pages ont des catégories", "Les articles ne sont pas indexés"], 0, "Les articles sont des contenus chronologiques (blog), les pages sont des contenus statiques."],
    ["Quel fichier contrôle l'apparence d'un thème ?", ["style.css", "index.html", "app.js", "config.php"], 0, "Le fichier style.css est obligatoire dans tout thème WordPress et contient les métadonnées du thème."],
    ["Qu'est-ce qu'un page builder ?", ["Un outil de construction de pages par glisser-déposer", "Un type de thème", "Un plugin de cache", "Un outil de backup"], 0, "Un page builder permet de construire des pages visuellement par glisser-déposer sans coder."],
  ],
  10: [ // Photoshop
    ["Qu'est-ce qu'un calque dans Photoshop ?", ["Une couche indépendante d'éléments visuels", "Un filtre d'image", "Un mode de couleur", "Un format d'export"], 0, "Les calques sont des couches empilées qui permettent de travailler sur des éléments indépendamment."],
    ["Quel outil permet de détourer un sujet automatiquement ?", ["Sélection du sujet", "Baguette magique uniquement", "Outil plume uniquement", "Recadrage"], 0, "L'outil Sélection du sujet utilise l'IA pour détourer automatiquement le sujet principal."],
    ["Quelle résolution est recommandée pour l'impression ?", ["300 DPI", "72 DPI", "150 DPI", "600 DPI"], 0, "300 DPI est le standard pour une impression de qualité professionnelle."],
    ["Qu'est-ce qu'un masque de fusion ?", ["Un masque qui cache ou révèle des parties d'un calque", "Un filtre artistique", "Un mode de fusion", "Un calque de texte"], 0, "Le masque de fusion utilise le noir/blanc pour masquer ou révéler des zones d'un calque."],
    ["Quel format conserve les calques Photoshop ?", ["PSD", "JPEG", "PNG", "GIF"], 0, "Le format PSD est le format natif de Photoshop qui conserve tous les calques et paramètres."],
  ],
  11: [ // Agile
    ["Combien de temps dure un sprint Scrum typique ?", ["1 à 4 semaines", "1 jour", "6 mois", "1 an"], 0, "Un sprint Scrum dure généralement 1 à 4 semaines, le plus souvent 2 semaines."],
    ["Quel rôle Scrum est le gardien du processus ?", ["Scrum Master", "Product Owner", "Tech Lead", "Chef de projet"], 0, "Le Scrum Master facilite les cérémonies et veille au respect du framework Scrum."],
    ["Qu'est-ce qu'un WIP limit en Kanban ?", ["Le nombre maximum de tâches en cours simultanément", "Le nombre de personnes dans l'équipe", "La durée maximale d'une tâche", "Le budget du projet"], 0, "WIP limit (Work In Progress) limite le nombre de tâches en parallèle pour fluidifier le flux."],
    ["Qu'est-ce qu'une rétrospective ?", ["Une réunion d'amélioration continue de l'équipe", "Un retour client", "Un test de performance", "Un rapport d'audit"], 0, "La rétrospective est une cérémonie Scrum où l'équipe identifie des axes d'amélioration."],
    ["Quel outil est populaire pour gérer un backlog ?", ["Jira", "Photoshop", "VS Code", "Slack"], 0, "Jira (Atlassian) est l'outil le plus populaire pour la gestion de backlog et sprints agiles."],
  ],
  12: [ // Finances Freelances
    ["Qu'est-ce que le régime micro-entreprise en France ?", ["Un statut fiscal simplifié pour les petits revenus", "Une grande entreprise", "Un statut pour les associations", "Un type de société anonyme"], 0, "Le régime micro-entreprise offre une comptabilité simplifiée et un plafond de chiffre d'affaires."],
    ["Que doit obligatoirement contenir une facture ?", ["Le numéro de facture, la date, et les mentions légales", "Seulement le montant", "Un logo uniquement", "La photo du produit"], 0, "Une facture conforme doit contenir : numéro, date, identité des parties, détail des prestations, montants."],
    ["Qu'est-ce que la TVA ?", ["La Taxe sur la Valeur Ajoutée", "La Taxe sur le Volume d'Affaires", "Un impôt sur le revenu", "Une cotisation sociale"], 0, "La TVA est un impôt indirect sur la consommation, collecté par les entreprises pour l'État."],
    ["Quel pourcentage du revenu faut-il provisionner pour les impôts ?", ["20 à 30% selon le pays", "5%", "50%", "Aucun, les freelances ne paient pas d'impôts"], 0, "Il est recommandé de provisionner 20 à 30% de ses revenus pour les impôts et cotisations."],
    ["Qu'est-ce que Mobile Money ?", ["Un service de paiement mobile très utilisé en Afrique", "Une banque traditionnelle", "Une cryptomonnaie", "Un logiciel de comptabilité"], 0, "Mobile Money (Orange Money, Wave, MTN) est le principal moyen de paiement numérique en Afrique."],
  ],
  13: [ // Solidity & Web3
    ["Qu'est-ce qu'un smart contract ?", ["Un programme auto-exécutable sur la blockchain", "Un contrat juridique numérisé", "Un contrat de travail", "Un document PDF signé"], 0, "Un smart contract est un programme déployé sur la blockchain qui s'exécute automatiquement."],
    ["Quel standard définit les tokens fongibles sur Ethereum ?", ["ERC-20", "ERC-721", "ERC-1155", "ERC-404"], 0, "ERC-20 est le standard pour les tokens fongibles (interchangeables) sur Ethereum."],
    ["Qu'est-ce que le gas dans Ethereum ?", ["Le coût computationnel des transactions", "Le carburant physique des serveurs", "Un token spécial", "La vitesse du réseau"], 0, "Le gas mesure le coût computationnel pour exécuter des opérations sur le réseau Ethereum."],
    ["Quel outil de développement est recommandé pour Solidity ?", ["Hardhat", "Visual Studio", "Eclipse", "IntelliJ"], 0, "Hardhat est l'environnement de développement le plus populaire pour les smart contracts Solidity."],
    ["Qu'est-ce que la DeFi ?", ["La finance décentralisée sur blockchain", "Une banque digitale", "Un type de NFT", "Un protocole de chat"], 0, "DeFi (Decentralized Finance) regroupe les services financiers construits sur la blockchain."],
  ],
  14: [ // Copywriting
    ["Que signifie AIDA en copywriting ?", ["Attention, Intérêt, Désir, Action", "Analyse, Information, Données, Application", "Art, Idée, Design, Action", "Audience, Impact, Durée, Achat"], 0, "AIDA est le framework classique : capter l'Attention, susciter l'Intérêt, créer le Désir, inciter à l'Action."],
    ["Qu'est-ce que le framework PAS ?", ["Problème, Agitation, Solution", "Prix, Avantage, Service", "Produit, Audience, Stratégie", "Page, Article, Script"], 0, "PAS : identifier le Problème, Agiter la douleur, présenter la Solution."],
    ["Quel élément est le plus important dans un email marketing ?", ["L'objet (subject line)", "Le footer", "Les images", "La signature"], 0, "L'objet de l'email détermine le taux d'ouverture — c'est l'élément le plus critique."],
    ["Qu'est-ce qu'un CTA ?", ["Call To Action — un appel à l'action", "Content To Audience", "Click Through Analysis", "Creative Text Ad"], 0, "Un CTA (Call To Action) est un bouton ou lien qui incite l'utilisateur à passer à l'action."],
    ["Quelle longueur est recommandée pour un titre de page de vente ?", ["6 à 12 mots, clair et spécifique", "1 à 2 mots", "50+ mots", "Pas de titre, commencer par le contenu"], 0, "Un titre efficace fait 6 à 12 mots : assez long pour être spécifique, assez court pour être percutant."],
  ],
};

// Review comments (30 varied French reviews)
const REVIEW_COMMENTS_FR = [
  "Excellente formation, très bien structurée et claire. Les projets pratiques sont un vrai plus. J'ai pu appliquer immédiatement ce que j'ai appris dans mon travail de freelance.",
  "Formation de qualité. L'instructeur explique très bien les concepts. Je recommande vivement.",
  "Bon contenu mais j'aurais aimé plus d'exercices pratiques. Globalement satisfait.",
  "Parfait pour les débutants. J'ai appris énormément de choses en quelques semaines. L'instructeur est très pédagogue.",
  "Très bonne formation, le rythme est adapté. Les ressources complémentaires sont utiles.",
  "Formation complète et bien organisée. Le support de l'instructeur est réactif et pertinent.",
  "Contenu à jour et pertinent. Les exemples sont tirés de cas réels africains, c'est appréciable.",
  "J'ai enfin compris des concepts qui me semblaient obscurs. Merci pour cette formation !",
  "Bonne formation dans l'ensemble. Quelques leçons mériteraient d'être approfondies.",
  "Vraiment top ! Je suis passé de débutant à un niveau confortable grâce à cette formation.",
  "La meilleure formation que j'ai suivie sur le sujet. Claire, concise et pratique.",
  "J'aurais aimé des mises à jour plus fréquentes, mais le contenu de base est solide.",
  "Excellentes vidéos. L'instructeur connaît vraiment son sujet. Les quiz aident bien à retenir.",
  "Formation très pratique avec des projets concrets. Parfait pour construire son portfolio.",
  "Depuis Dakar, j'ai pu suivre la formation sans problème. Les vidéos sont claires même avec une connexion moyenne.",
  "Les exemples adaptés au contexte africain sont un vrai bonus. On se sent enfin concerné !",
  "Rapport qualité-prix imbattable. J'ai payé bien plus cher pour des formations moins bien ailleurs.",
  "Le quiz final est un peu difficile mais ça pousse à bien réviser. Certificat obtenu du premier coup !",
  "J'ai recommandé cette formation à 3 collègues. Ils sont tous satisfaits aussi.",
  "Le contenu est bon mais la navigation dans la plateforme pourrait être améliorée.",
  "Super formation ! Les fichiers ressources téléchargeables sont très utiles pour la suite.",
  "Formation honnête et transparente. Pas de promesses irréalistes, juste du bon contenu.",
  "J'ai appris plus en 2 semaines qu'en 6 mois d'autodidacte. Merci !",
  "L'instructeur répond aux questions dans la section discussion. Appréciable pour un cours en ligne.",
  "Bonne introduction au sujet. Pour aller plus loin, il faudrait une formation avancée.",
  "Contenu dense mais bien découpé en leçons courtes. On ne se perd jamais.",
  "J'ai suivi depuis Abidjan. Formation parfaitement adaptée au marché africain.",
  "Les leçons texte sont un bon complément aux vidéos. On peut revenir dessus facilement.",
  "Un peu déçu par le manque de profondeur sur certains sujets avancés. 3 étoiles quand même car la base est bonne.",
  "Formation que je re-consulte régulièrement comme référence. Un investissement rentable.",
];

// Instructor response templates
const INSTRUCTOR_RESPONSES = [
  "Merci beaucoup pour votre retour positif ! Ravi que la formation vous ait plu. N'hésitez pas si vous avez des questions.",
  "Merci pour cet avis encourageant ! Votre réussite est ma plus grande satisfaction.",
  "Je suis content que le contenu vous ait été utile. Bonne continuation dans vos projets !",
  "Merci pour votre feedback constructif. Je prends note de vos suggestions pour les prochaines mises à jour.",
  "Heureux que les exemples africains vous aient parlé ! C'est exactement le but.",
  "Merci ! La formation avancée est en préparation, restez connecté.",
  "Votre retour me touche beaucoup. Merci d'avoir pris le temps de partager votre expérience.",
  "Je comprends votre point sur la profondeur de certains sujets. Une mise à jour est prévue avec des modules complémentaires.",
  "Félicitations pour votre certificat ! Vous pouvez le partager sur LinkedIn pour valoriser vos compétences.",
  "Merci pour la recommandation à vos collègues ! Le bouche-à-oreille est la meilleure récompense.",
];

// Digital product data (schema: title, description — single locale)
const DIGITAL_PRODUCTS_DATA = [
  {
    title: "Guide Complet du Freelance en Afrique (eBook)",
    description: "Un guide de 150 pages couvrant tout ce qu'il faut savoir pour démarrer et réussir en tant que freelance en Afrique francophone. Inclut des templates de contrats et de factures.",
    productType: "EBOOK" as const,
    price: 14.99,
    categoryIdx: 4,
    instructeurIdx: 2,
  },
  {
    title: "Pack de 50 Templates Figma pour Apps Mobile",
    description: "Collection de 50 écrans UI prêts à l'emploi pour vos projets d'applications mobiles. Inclut onboarding, dashboards, profils, paramètres et plus.",
    productType: "TEMPLATE" as const,
    price: 29.99,
    categoryIdx: 1,
    instructeurIdx: 1,
  },
  {
    title: "Checklist SEO 2026 (PDF)",
    description: "La checklist SEO la plus complète pour 2026. 120 points de contrôle organisés par catégorie : technique, contenu, backlinks, local SEO.",
    productType: "PDF" as const,
    price: 9.99,
    categoryIdx: 2,
    instructeurIdx: 2,
  },
  {
    title: "Kit de Branding Complet pour Freelances",
    description: "Tout ce qu'il faut pour créer votre identité visuelle : templates de logo, palettes de couleurs, choix typographiques, modèles de cartes de visite et présentations.",
    productType: "TEMPLATE" as const,
    price: 19.99,
    categoryIdx: 1,
    instructeurIdx: 1,
  },
  {
    title: "Modèles de Contrats Freelance (Pack PDF)",
    description: "Pack de 10 modèles de contrats adaptés au freelancing en Afrique francophone : contrat de prestation, NDA, devis type, conditions générales, et plus.",
    productType: "PDF" as const,
    price: 12.99,
    categoryIdx: 4,
    instructeurIdx: 2,
  },
];

// ── Main Seed Function ──

async function main() {
  console.log("=== FreelanceHigh Formations Seed ===\n");

  // ── Step 0: Clean existing test data (reverse dependency order) ──
  console.log("Cleaning existing test data...");
  await prisma.cohortMessage.deleteMany({});
  await prisma.lessonNote.deleteMany({});
  await prisma.lessonProgress.deleteMany({});
  await prisma.lessonResource.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.formationReview.deleteMany({});
  await prisma.digitalProductReview.deleteMany({});
  await prisma.digitalProductPurchase.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.formationFavorite.deleteMany({});
  await prisma.promoCode.deleteMany({});
  await prisma.flashPromotion.deleteMany({});
  await prisma.marketingEvent.deleteMany({});
  await prisma.abandonedCart.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.formationCohort.deleteMany({});
  await prisma.courseDiscussionReply.deleteMany({});
  await prisma.courseDiscussion.deleteMany({});
  await prisma.digitalProduct.deleteMany({});
  await prisma.formation.deleteMany({});
  await prisma.instructorWithdrawal.deleteMany({});
  await prisma.marketingPixel.deleteMany({});
  await prisma.instructeurProfile.deleteMany({});
  await prisma.formationCategory.deleteMany({});

  const testEmails = [
    ...ADMIN_USERS.map((u) => u.email),
    ...INSTRUCTEUR_USERS.map((u) => u.email),
    ...APPRENANT_USERS.map((u) => u.email),
  ];
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
  console.log("  Done.\n");

  // ── Step 1: Create Formation Categories ──
  console.log("Creating formation categories...");
  const categories = [];
  for (const cat of FORMATION_CATEGORIES) {
    const created = await prisma.formationCategory.create({ data: cat });
    categories.push(created);
  }
  console.log(`  + ${categories.length} categories created`);

  // ── Step 2: Create Users ──
  console.log("\nCreating admin users...");
  const passwordHash = await hashPassword("TestPassword123!");
  const adminUsers = [];
  for (const admin of ADMIN_USERS) {
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: { name: admin.name, role: "ADMIN", plan: "AGENCE", kyc: 4, status: "ACTIF", country: admin.country, countryFlag: admin.countryFlag },
      create: { id: admin.id, email: admin.email, passwordHash, name: admin.name, role: "ADMIN", plan: "AGENCE", kyc: 4, status: "ACTIF", country: admin.country, countryFlag: admin.countryFlag },
    });
    adminUsers.push(user);
  }
  console.log(`  + ${adminUsers.length} admin users`);

  console.log("\nCreating instructeur users...");
  const instructeurUsers = [];
  const instructeurProfiles = [];
  for (const inst of INSTRUCTEUR_USERS) {
    const user = await prisma.user.upsert({
      where: { email: inst.email },
      update: { name: inst.name, formationsRole: "instructeur", country: inst.country, countryFlag: inst.countryFlag, avatar: inst.avatar, kyc: 3, status: "ACTIF" },
      create: { id: inst.id, email: inst.email, passwordHash, name: inst.name, role: "FREELANCE", plan: "PRO", kyc: 3, status: "ACTIF", formationsRole: "instructeur", country: inst.country, countryFlag: inst.countryFlag, avatar: inst.avatar },
    });
    instructeurUsers.push(user);

    const profile = await prisma.instructeurProfile.create({
      data: {
        id: createId(),
        userId: user.id,
        bioFr: inst.bio.fr,
        bioEn: inst.bio.en,
        expertise: inst.expertise,
        yearsExp: inst.yearsExp,
        linkedin: (inst as any).linkedin ?? null,
        website: (inst as any).website ?? null,
        youtube: (inst as any).youtube ?? null,
        status: "APPROUVE",
        totalEarned: randomFloat(1000, 25000),
      },
    });
    instructeurProfiles.push(profile);
    console.log(`  + ${inst.name} — Profil instructeur créé`);
  }

  console.log("\nCreating apprenant users...");
  const apprenantUsers = [];
  for (const app of APPRENANT_USERS) {
    const user = await prisma.user.create({
      data: {
        id: app.id, email: app.email, passwordHash, name: app.name,
        role: "FREELANCE", plan: randomItem(["GRATUIT", "GRATUIT", "GRATUIT", "PRO"] as const),
        kyc: randomInt(1, 3), status: "ACTIF", formationsRole: "apprenant",
        country: app.country, countryFlag: app.countryFlag,
      },
    });
    apprenantUsers.push(user);
  }
  console.log(`  + ${apprenantUsers.length} apprenant users created`);

  // ── Step 3: Create Formations ──
  console.log("\nCreating formations...");
  const formations = [];
  for (let i = 0; i < FORMATIONS_DATA.length; i++) {
    const f = FORMATIONS_DATA[i] as any;
    const slug = slugify(f.title);
    const category = categories[f.categoryIdx];
    const instructeur = instructeurProfiles[f.instructeurIdx];
    const isFree = f.price === 0;

    const formation = await prisma.formation.create({
      data: {
        id: createId(),
        slug,
        title: f.title,
        shortDesc: f.shortDesc,
        description: f.description,
        learnPoints: f.learnPoints,
        requirements: f.requirements,
        targetAudience: f.targetAudience ?? null,
        thumbnail: f.thumbnail ?? null,
        previewVideo: f.previewVideo ?? null,
        locale: "fr",
        level: f.level,
        price: f.price,
        originalPrice: f.originalPrice,
        isFree,
        duration: f.duration,
        categoryId: category.id,
        instructeurId: instructeur.id,
        status: f.status,
        studentsCount: f.status === "ACTIF" ? randomInt(50, 2000) : 0,
        rating: f.status === "ACTIF" ? randomFloat(3.8, 4.9, 1) : 0,
        reviewsCount: f.status === "ACTIF" ? randomInt(8, 50) : 0,
        viewsCount: f.status === "ACTIF" ? randomInt(500, 15000) : randomInt(0, 50),
        hasCertificate: true,
        minScore: 80,
        publishedAt: f.status === "ACTIF" ? new Date(Date.now() - randomInt(7, 180) * 86400000) : null,
        language: ["fr", "en"],
      },
    });
    formations.push(formation);
    console.log(`  + [${f.status}] ${f.title}`);
  }

  // ── Step 4: Create Sections, Lessons, Quizzes and Resources ──
  console.log("\nCreating sections, lessons, quizzes and resources...");
  const allLessons: { id: string; formationId: string; sectionId: string; type: string }[] = [];
  let quizCount = 0;
  let resourceCount = 0;

  for (let fIdx = 0; fIdx < formations.length; fIdx++) {
    const formation = formations[fIdx];
    if (formation.status !== "ACTIF") continue;

    const sections = SECTION_TEMPLATES[fIdx];
    if (!sections) continue;

    let firstVideoLessonId: string | null = null;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sectionData = sections[sIdx];
      const section = await prisma.section.create({
        data: { id: createId(), title: sectionData.title, order: sIdx, formationId: formation.id },
      });

      for (let lIdx = 0; lIdx < sectionData.lessons.length; lIdx++) {
        const ld = sectionData.lessons[lIdx];
        const lessonId = createId();

        const lesson = await prisma.lesson.create({
          data: {
            id: lessonId,
            title: ld.title,
            type: ld.type,
            duration: ld.duration,
            order: lIdx,
            isFree: lIdx === 0 && sIdx === 0,
            sectionId: section.id,
            videoUrl: ld.videoUrl ?? null,
            content: ld.content ?? (ld.type === "TEXTE" ? `<h2>${ld.title}</h2><p>Contenu détaillé de cette leçon.</p>` : null),
          },
        });
        allLessons.push({ id: lesson.id, formationId: formation.id, sectionId: section.id, type: ld.type });

        if (!firstVideoLessonId && ld.type === "VIDEO") {
          firstVideoLessonId = lesson.id;
        }

        // Create Quiz for QUIZ-type lessons
        if (ld.type === "QUIZ" && QUIZ_BANK[fIdx]) {
          const quiz = await prisma.quiz.create({
            data: {
              id: createId(),
              title: `Quiz : ${FORMATIONS_DATA[fIdx].title}`,
              passingScore: 80,
              timeLimit: 30,
              lessonId: lesson.id,
            },
          });

          for (let qIdx = 0; qIdx < QUIZ_BANK[fIdx].length; qIdx++) {
            const [text, opts, correctIdx, explanation] = QUIZ_BANK[fIdx][qIdx];
            await prisma.question.create({
              data: {
                id: createId(),
                text,
                type: "CHOIX_UNIQUE",
                options: opts.map((t, i) => ({ text: t, value: String.fromCharCode(97 + i) })),
                correctAnswer: String.fromCharCode(97 + correctIdx),
                explanation,
                order: qIdx,
                quizId: quiz.id,
              },
            });
          }
          quizCount++;
        }
      }
    }

    // Create LessonResources for first VIDEO lesson of each formation
    if (firstVideoLessonId) {
      const resourceTemplates = [
        { name: "Slides de présentation (PDF)", fileSize: 2500000, mimeType: "application/pdf" },
        { name: "Code source du projet (ZIP)", fileSize: 5000000, mimeType: "application/zip" },
        { name: "Aide-mémoire (PDF)", fileSize: 1200000, mimeType: "application/pdf" },
      ];
      const resCount = randomInt(2, 3);
      for (let r = 0; r < resCount; r++) {
        const tmpl = resourceTemplates[r];
        await prisma.lessonResource.create({
          data: {
            id: createId(),
            lessonId: firstVideoLessonId,
            name: tmpl.name,
            url: `#resource-${slugify(tmpl.name)}`,
            fileSize: tmpl.fileSize,
            mimeType: tmpl.mimeType,
          },
        });
        resourceCount++;
      }
    }

    console.log(`  + Sections/Lessons/Quiz pour: ${formation.title}`);
  }

  // ── Step 5: Create Enrollments (80+) ──
  console.log("\nCreating enrollments...");
  const actifFormations = formations.filter((f) => f.status === "ACTIF");
  const enrollments: { id: string; formationId: string; userId: string; progress: number; completedAt: Date | null }[] = [];
  const enrollmentSet = new Set<string>();

  for (let i = 0; i < 120; i++) {
    const user = randomItem(apprenantUsers);
    const formation = randomItem(actifFormations);
    const key = `${user.id}-${formation.id}`;
    if (enrollmentSet.has(key)) continue;
    enrollmentSet.add(key);

    const progress = randomItem([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100]);
    const isCompleted = progress === 100;
    const completedAt = isCompleted ? new Date(Date.now() - randomInt(1, 60) * 86400000) : null;

    const enrollment = await prisma.enrollment.create({
      data: {
        id: createId(), userId: user.id, formationId: formation.id,
        progress, paidAmount: formation.price, completedAt,
      },
    });
    enrollments.push({ id: enrollment.id, formationId: formation.id, userId: user.id, progress, completedAt });
  }
  console.log(`  + ${enrollments.length} enrollments created`);

  // ── Step 6: Create Certificates ──
  console.log("\nCreating certificates...");
  const completedEnrollments = enrollments.filter((e) => e.progress === 100);
  let certCount = 0;
  for (const enrollment of completedEnrollments.slice(0, 25)) {
    await prisma.certificate.create({
      data: {
        id: createId(), code: generateCertCode(),
        enrollmentId: enrollment.id, userId: enrollment.userId,
        formationId: enrollment.formationId, score: randomInt(80, 100),
        issuedAt: enrollment.completedAt || new Date(),
      },
    });
    certCount++;
  }
  console.log(`  + ${certCount} certificates created`);

  // ── Step 7: Create Digital Products ──
  console.log("\nCreating digital products...");
  for (const product of DIGITAL_PRODUCTS_DATA) {
    const category = categories[product.categoryIdx];
    const instructeur = instructeurProfiles[product.instructeurIdx];
    await prisma.digitalProduct.create({
      data: {
        id: createId(), slug: slugify(product.title), title: product.title,
        description: product.description, locale: "fr", productType: product.productType,
        price: product.price, categoryId: category.id, instructeurId: instructeur.id,
        status: "ACTIF", salesCount: randomInt(10, 150), viewsCount: randomInt(100, 3000),
        rating: randomFloat(3.5, 5.0, 1), reviewsCount: randomInt(2, 20),
        tags: ["freelance", "afrique", "francophone"],
      },
    });
  }
  console.log(`  + ${DIGITAL_PRODUCTS_DATA.length} digital products created`);

  // ── Step 8: Create Formation Cohorts ──
  console.log("\nCreating formation cohorts...");
  const cohortFormations = actifFormations.slice(0, 3);
  const cohortData = [
    { title: "Cohorte Janvier 2026", description: "Apprenez ensemble avec un groupe motivé. Sessions de mentorat incluses.", durationDays: 42, maxParticipants: 30, price: 79.99, originalPrice: 99.99, status: "TERMINE" as const },
    { title: "Cohorte Mars 2026", description: "Rejoignez notre cohorte de mars. Accompagnement personnalisé et projets de groupe.", durationDays: 56, maxParticipants: 25, price: 89.99, originalPrice: 119.99, status: "EN_COURS" as const },
    { title: "Cohorte Mai 2026", description: "Inscriptions ouvertes pour la cohorte de mai. Places limitées !", durationDays: 42, maxParticipants: 20, price: 69.99, originalPrice: null, status: "OUVERT" as const },
  ];

  for (let i = 0; i < cohortData.length; i++) {
    const cohort = cohortData[i];
    const formation = cohortFormations[i];
    const startDate = new Date();
    if (cohort.status === "TERMINE") startDate.setDate(startDate.getDate() - 90);
    else if (cohort.status === "EN_COURS") startDate.setDate(startDate.getDate() - 14);
    else startDate.setDate(startDate.getDate() + 30);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + cohort.durationDays);
    const enrollmentDeadline = new Date(startDate);
    enrollmentDeadline.setDate(enrollmentDeadline.getDate() - 7);

    await prisma.formationCohort.create({
      data: {
        id: createId(), formationId: formation.id, title: cohort.title,
        description: cohort.description, startDate, endDate, enrollmentDeadline,
        durationDays: cohort.durationDays, maxParticipants: cohort.maxParticipants,
        currentCount: cohort.status === "TERMINE" ? cohort.maxParticipants : cohort.status === "EN_COURS" ? randomInt(10, cohort.maxParticipants) : randomInt(0, 8),
        price: cohort.price, originalPrice: cohort.originalPrice, status: cohort.status,
        schedule: [
          { week: 1, title: "Introduction et fondamentaux", tasks: ["Regarder les leçons 1-4", "Compléter l'exercice d'introduction"] },
          { week: 2, title: "Approfondissement", tasks: ["Regarder les leçons 5-8", "Projet pratique #1"] },
          { week: 3, title: "Projet final", tasks: ["Travailler sur le projet final", "Review par les pairs"] },
        ],
      },
    });
    console.log(`  + ${cohort.title} (${cohort.status})`);
  }

  // ── Step 9: Create Formation Reviews (50+) ──
  console.log("\nCreating formation reviews...");
  const reviewSet = new Set<string>();
  let reviewCount = 0;

  // Get all eligible enrollments (progress >= 30)
  const eligibleEnrollments = enrollments.filter((e) => e.progress >= 30);

  for (let i = 0; i < eligibleEnrollments.length && reviewCount < 60; i++) {
    const enrollment = eligibleEnrollments[i];
    const key = `${enrollment.userId}-${enrollment.formationId}`;
    if (reviewSet.has(key)) continue;
    reviewSet.add(key);

    // Varied rating distribution: mostly 4-5 but some 2-3
    const rating = randomItem([2, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5]);
    const comment = REVIEW_COMMENTS_FR[reviewCount % REVIEW_COMMENTS_FR.length];

    // Instructor responds to most reviews (good and bad)
    const hasResponse = rating >= 4 || (rating <= 3 && Math.random() > 0.4);

    await prisma.formationReview.create({
      data: {
        id: createId(),
        rating,
        comment,
        userId: enrollment.userId,
        formationId: enrollment.formationId,
        enrollmentId: enrollment.id,
        response: hasResponse ? INSTRUCTOR_RESPONSES[reviewCount % INSTRUCTOR_RESPONSES.length] : null,
        respondedAt: hasResponse ? new Date(Date.now() - randomInt(0, 30) * 86400000) : null,
      },
    });
    reviewCount++;
  }
  console.log(`  + ${reviewCount} reviews created`);

  // ── Step: Create Promo Codes ──
  console.log("\nCreating promo codes...");
  const promoCodes = [
    { code: "BIENVENUE20", discountPct: 20, maxUsage: 100, expiresAt: new Date(Date.now() + 90 * 86400000), isActive: true, formationIds: [] },
    { code: "FLASH50", discountPct: 50, maxUsage: 10, expiresAt: new Date(Date.now() + 7 * 86400000), isActive: true, formationIds: actifFormations.slice(0, 3).map((f) => f.id) },
    { code: "EXPIRE2024", discountPct: 30, maxUsage: 50, expiresAt: new Date("2024-12-31"), isActive: false, formationIds: [] },
    { code: "VIP10", discountPct: 10, maxUsage: null, expiresAt: null, isActive: true, formationIds: [] },
  ];
  for (const pc of promoCodes) {
    await prisma.promoCode.create({ data: { ...pc, usageCount: pc.code === "EXPIRE2024" ? 50 : randomInt(0, 5) } });
  }
  console.log(`  + ${promoCodes.length} promo codes created`);

  // ── Step: Create Cart Items for test users ──
  console.log("\nCreating cart items...");
  let cartItemCount = 0;
  // Add 2-3 formations to first 3 apprenant carts (not already enrolled)
  for (const user of apprenantUsers.slice(0, 3)) {
    const userEnrollments = enrollments.filter((e) => e.userId === user.id);
    const enrolledIds = new Set(userEnrollments.map((e) => e.formationId));
    const available = actifFormations.filter((f) => !enrolledIds.has(f.id));
    const toAdd = available.slice(0, randomInt(1, 3));
    for (const f of toAdd) {
      await prisma.cartItem.create({ data: { userId: user.id, formationId: f.id } });
      cartItemCount++;
    }
  }
  console.log(`  + ${cartItemCount} cart items created`);

  // ── Step: Create Formation Favorites ──
  console.log("\nCreating formation favorites...");
  let favCount = 0;
  for (const user of apprenantUsers) {
    const numFavs = randomInt(1, 4);
    const shuffled = [...actifFormations].sort(() => Math.random() - 0.5);
    for (const f of shuffled.slice(0, numFavs)) {
      await prisma.formationFavorite.create({ data: { userId: user.id, formationId: f.id } }).catch(() => {});
      favCount++;
    }
  }
  console.log(`  + ${favCount} favorites created`);

  // ── Summary ──
  console.log("\n=== Seed Complete ===");
  console.log(`  Categories:          ${categories.length}`);
  console.log(`  Admin users:         ${adminUsers.length}`);
  console.log(`  Instructeur users:   ${instructeurUsers.length}`);
  console.log(`  Apprenant users:     ${apprenantUsers.length}`);
  console.log(`  Formations:          ${formations.length} (${actifFormations.length} ACTIF)`);
  console.log(`  Sections/Lessons:    ${allLessons.length} lessons`);
  console.log(`  Quizzes:             ${quizCount}`);
  console.log(`  Lesson Resources:    ${resourceCount}`);
  console.log(`  Enrollments:         ${enrollments.length}`);
  console.log(`  Certificates:        ${certCount}`);
  console.log(`  Digital Products:    ${DIGITAL_PRODUCTS_DATA.length}`);
  console.log(`  Cohorts:             ${cohortData.length}`);
  console.log(`  Reviews:             ${reviewCount}`);
  console.log(`  Promo Codes:         ${promoCodes.length}`);
  console.log(`  Cart Items:          ${cartItemCount}`);
  console.log(`  Favorites:           ${favCount}`);
  console.log(`\nAll test users password: TestPassword123! (SHA-256 hash)`);
  console.log("Note: In production, use bcryptjs for password hashing.\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
