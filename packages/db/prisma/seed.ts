// FreelanceHigh — Database Seed (Formations Module)
// Generates realistic test data for the formations platform
// Run: pnpm --filter=@freelancehigh/db seed

import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

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

// Simple password hash (SHA-256 hex) for seed data only
// In production, bcryptjs is used via apps/web
async function simpleHash(password: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
  },
];

const APPRENANT_USERS = Array.from({ length: 20 }, (_, i) => {
  const firstNames = [
    "Amadou", "Awa", "Ibrahim", "Mariama", "Ousmane",
    "Aissatou", "Moussa", "Khady", "Abdoulaye", "Fatoumata",
    "Cheikh", "Ndeye", "Mamadou", "Bineta", "Thierno",
    "Coumba", "Saliou", "Adja", "Babacar", "Dieynaba",
  ];
  const lastNames = [
    "Ba", "Diop", "Sow", "Traore", "Camara",
    "Ndiaye", "Fall", "Mbaye", "Gueye", "Toure",
    "Diallo", "Coulibaly", "Kane", "Sarr", "Cisse",
    "Bah", "Diouf", "Sy", "Drame", "Konate",
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

// Formations data with variety of topics (schema uses single-language fields with `locale`)
const FORMATIONS_DATA = [
  {
    title: "React & Next.js : Le Guide Complet 2026",
    shortDesc: "Apprenez React et Next.js de zéro à expert avec des projets concrets",
    description: "Cette formation complète vous guide pas à pas dans la maîtrise de React et Next.js 14. Vous apprendrez le App Router, les Server Components, le SSR, le SSG, et bien plus. À travers 5 projets pratiques, vous deviendrez un développeur React autonome et compétent.",
    level: "INTERMEDIAIRE" as const,
    price: 49.99,
    originalPrice: 89.99,
    duration: 1800,
    categoryIdx: 0,
    instructeurIdx: 0,
    status: "ACTIF" as const,
    learnPoints: ["Maîtriser React 19 et ses hooks avancés", "Construire des applications avec Next.js 14 App Router", "Implémenter le SSR, SSG et ISR", "Gérer l'état avec Zustand et TanStack Query", "Déployer sur Vercel"],
    requirements: ["Connaissances de base en HTML, CSS et JavaScript", "Un ordinateur avec Node.js installé"],
  },
  {
    title: "Maîtriser Tailwind CSS & shadcn/ui",
    shortDesc: "Créez des interfaces modernes et accessibles avec Tailwind et shadcn/ui",
    description: "Découvrez comment construire des interfaces utilisateur élégantes avec Tailwind CSS et la bibliothèque shadcn/ui. De la mise en page responsive au design system complet, cette formation couvre tout ce qu'il faut savoir.",
    level: "DEBUTANT" as const,
    price: 29.99,
    originalPrice: 49.99,
    duration: 900,
    categoryIdx: 0,
    instructeurIdx: 0,
    status: "ACTIF" as const,
    learnPoints: ["Maîtriser les classes utilitaires de Tailwind CSS", "Installer et personnaliser shadcn/ui", "Créer un design system complet", "Concevoir des layouts responsive"],
    requirements: ["Connaissances en HTML et CSS", "Bases de React"],
  },
  {
    title: "UI/UX Design : De l'Idée au Prototype",
    shortDesc: "Apprenez à concevoir des interfaces intuitives avec Figma",
    description: "Formez-vous au design d'interface et d'expérience utilisateur. Vous apprendrez à réaliser des wireframes, des maquettes et des prototypes interactifs avec Figma. Études de cas réels et projets pratiques inclus.",
    level: "TOUS_NIVEAUX" as const,
    price: 39.99,
    originalPrice: 69.99,
    duration: 1200,
    categoryIdx: 1,
    instructeurIdx: 1,
    status: "ACTIF" as const,
    learnPoints: ["Maîtriser Figma de A à Z", "Mener une recherche utilisateur", "Créer des wireframes et prototypes", "Appliquer les principes d'accessibilité"],
    requirements: ["Aucun prérequis technique"],
  },
  {
    title: "Branding & Identité Visuelle pour Freelances",
    shortDesc: "Construisez une marque personnelle forte qui attire les clients",
    description: "Dans cette formation, vous apprendrez à créer une identité visuelle professionnelle. Du logo à la charte graphique, en passant par les supports de communication, vous aurez tous les outils pour vous démarquer.",
    level: "DEBUTANT" as const,
    price: 24.99,
    originalPrice: null,
    duration: 600,
    categoryIdx: 1,
    instructeurIdx: 1,
    status: "ACTIF" as const,
    learnPoints: ["Créer un logo professionnel", "Définir une charte graphique", "Choisir typographies et couleurs", "Créer des templates réutilisables"],
    requirements: ["Notions de base en design graphique souhaitées"],
  },
  {
    title: "SEO & Content Marketing : Stratégie Complète",
    shortDesc: "Dominez les résultats Google et développez votre audience organique",
    description: "Formation complète sur le référencement naturel et le marketing de contenu. Apprenez à positionner vos pages en première page Google, à créer du contenu qui convertit, et à mesurer vos résultats avec Google Analytics.",
    level: "INTERMEDIAIRE" as const,
    price: 34.99,
    originalPrice: 59.99,
    duration: 1080,
    categoryIdx: 2,
    instructeurIdx: 2,
    status: "ACTIF" as const,
    learnPoints: ["Maîtriser le SEO on-page et off-page", "Créer une stratégie de contenu", "Utiliser Google Search Console et Analytics", "Optimiser la conversion"],
    requirements: ["Site web ou blog existant recommandé"],
  },
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
    learnPoints: ["Architecturer des APIs REST professionnelles", "Implémenter JWT et OAuth", "Utiliser Prisma avec PostgreSQL", "Tester avec Jest et Supertest"],
    requirements: ["JavaScript avancé", "Expérience avec Node.js de base"],
  },
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
    learnPoints: ["Comprendre le fonctionnement des LLM", "Maîtriser les techniques de prompting", "Automatiser des tâches avec l'IA", "Intégrer l'IA dans son workflow"],
    requirements: ["Aucun prérequis technique"],
  },
  {
    title: "Facebook & Instagram Ads pour Débutants",
    shortDesc: "Créez vos premières campagnes publicitaires rentables",
    description: "Apprenez à créer et optimiser des campagnes publicitaires sur Facebook et Instagram. De la création d'audience au retargeting, en passant par l'A/B testing, cette formation vous donne toutes les clés.",
    level: "DEBUTANT" as const,
    price: 0,
    originalPrice: null,
    duration: 360,
    categoryIdx: 2,
    instructeurIdx: 2,
    status: "EN_ATTENTE" as const,
    learnPoints: ["Configurer le Business Manager", "Créer des audiences ciblées", "Concevoir des publicités qui convertissent", "Analyser les performances"],
    requirements: ["Un compte Facebook actif"],
  },
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
    learnPoints: ["Définir son positionnement et ses tarifs", "Gérer la facturation multi-devises", "Trouver des clients internationaux", "Maîtriser les outils de productivité"],
    requirements: ["Avoir une compétence à vendre"],
  },
  {
    title: "TypeScript Avancé : Patterns et Bonnes Pratiques",
    shortDesc: "Passez au niveau supérieur avec les types avancés de TypeScript",
    description: "Plongez dans les fonctionnalités avancées de TypeScript : generics, types conditionnels, infer, template literal types, et patterns architecturaux. Formation destinée aux développeurs qui veulent écrire du code TypeScript de qualité production.",
    level: "AVANCE" as const,
    price: 44.99,
    originalPrice: 79.99,
    duration: 1500,
    categoryIdx: 0,
    instructeurIdx: 0,
    status: "ARCHIVE" as const,
    learnPoints: ["Maîtriser les generics avancés", "Implémenter des types conditionnels", "Créer des types utilitaires", "Appliquer les patterns TypeScript"],
    requirements: ["Expérience avec TypeScript basique", "Connaissance de JavaScript ES6+"],
  },
];

// Section/Lesson templates for ACTIF formations (schema: title, not titleFr/titleEn)
const SECTION_TEMPLATES: Record<number, { title: string; lessons: { title: string; type: "VIDEO" | "TEXTE"; duration: number }[] }[]> = {
  // Formation 0: React & Next.js
  0: [
    {
      title: "Introduction et Configuration",
      lessons: [
        { title: "Bienvenue dans la formation", type: "VIDEO", duration: 8 },
        { title: "Installation de l'environnement", type: "VIDEO", duration: 15 },
        { title: "Premiers pas avec React", type: "VIDEO", duration: 22 },
        { title: "Ressources et documentation", type: "TEXTE", duration: 5 },
      ],
    },
    {
      title: "Les Fondamentaux de React",
      lessons: [
        { title: "Composants et JSX", type: "VIDEO", duration: 25 },
        { title: "Props et State", type: "VIDEO", duration: 30 },
        { title: "Hooks essentiels : useState, useEffect", type: "VIDEO", duration: 35 },
        { title: "Gestion des événements", type: "VIDEO", duration: 20 },
        { title: "Exercice pratique : Todo App", type: "TEXTE", duration: 45 },
      ],
    },
    {
      title: "Next.js 14 App Router",
      lessons: [
        { title: "Architecture du App Router", type: "VIDEO", duration: 28 },
        { title: "Server Components vs Client Components", type: "VIDEO", duration: 32 },
        { title: "Layouts et Loading States", type: "VIDEO", duration: 22 },
        { title: "Récapitulatif du module", type: "TEXTE", duration: 10 },
      ],
    },
  ],
  // Formation 1: Tailwind CSS & shadcn/ui
  1: [
    {
      title: "Découverte de Tailwind CSS",
      lessons: [
        { title: "Qu'est-ce que Tailwind CSS ?", type: "VIDEO", duration: 12 },
        { title: "Installation et configuration", type: "VIDEO", duration: 18 },
        { title: "Classes utilitaires essentielles", type: "VIDEO", duration: 25 },
      ],
    },
    {
      title: "Mise en Page Responsive",
      lessons: [
        { title: "Flexbox avec Tailwind", type: "VIDEO", duration: 20 },
        { title: "CSS Grid avec Tailwind", type: "VIDEO", duration: 22 },
        { title: "Points de rupture et mobile-first", type: "VIDEO", duration: 18 },
        { title: "Guide des breakpoints", type: "TEXTE", duration: 8 },
      ],
    },
    {
      title: "shadcn/ui : Composants Accessibles",
      lessons: [
        { title: "Introduction à shadcn/ui", type: "VIDEO", duration: 15 },
        { title: "Installer et personnaliser les composants", type: "VIDEO", duration: 28 },
        { title: "Créer son design system", type: "VIDEO", duration: 35 },
      ],
    },
  ],
  // Formation 2: UI/UX Design
  2: [
    {
      title: "Fondamentaux du UX Design",
      lessons: [
        { title: "Qu'est-ce que le UX Design ?", type: "VIDEO", duration: 15 },
        { title: "Recherche utilisateur : méthodes", type: "VIDEO", duration: 25 },
        { title: "Personas et parcours utilisateur", type: "VIDEO", duration: 20 },
        { title: "Check-list de recherche UX", type: "TEXTE", duration: 10 },
      ],
    },
    {
      title: "Prise en Main de Figma",
      lessons: [
        { title: "Interface et outils de base", type: "VIDEO", duration: 30 },
        { title: "Composants et variantes", type: "VIDEO", duration: 35 },
        { title: "Auto Layout avancé", type: "VIDEO", duration: 28 },
      ],
    },
  ],
  // Formation 3: Branding
  3: [
    {
      title: "Les Bases du Branding",
      lessons: [
        { title: "Qu'est-ce qu'une marque ?", type: "VIDEO", duration: 12 },
        { title: "Définir son positionnement", type: "VIDEO", duration: 18 },
        { title: "Étude de cas : marques africaines", type: "TEXTE", duration: 15 },
      ],
    },
    {
      title: "Création du Logo",
      lessons: [
        { title: "Principes de création de logo", type: "VIDEO", duration: 22 },
        { title: "Atelier pratique : votre logo", type: "VIDEO", duration: 40 },
        { title: "Déclinaisons et usages", type: "VIDEO", duration: 15 },
        { title: "Brief créatif template", type: "TEXTE", duration: 5 },
      ],
    },
  ],
  // Formation 4: SEO & Content Marketing
  4: [
    {
      title: "Fondamentaux du SEO",
      lessons: [
        { title: "Comment fonctionne Google", type: "VIDEO", duration: 18 },
        { title: "Recherche de mots-clés", type: "VIDEO", duration: 25 },
        { title: "SEO on-page : les essentiels", type: "VIDEO", duration: 30 },
        { title: "Checklist SEO on-page", type: "TEXTE", duration: 8 },
      ],
    },
    {
      title: "Stratégie de Contenu",
      lessons: [
        { title: "Créer un calendrier éditorial", type: "VIDEO", duration: 20 },
        { title: "Rédiger pour le web", type: "VIDEO", duration: 22 },
        { title: "Mesurer les résultats avec Analytics", type: "VIDEO", duration: 28 },
      ],
    },
    {
      title: "SEO Technique et Netlinking",
      lessons: [
        { title: "Optimisation technique du site", type: "VIDEO", duration: 25 },
        { title: "Stratégie de backlinks", type: "VIDEO", duration: 22 },
        { title: "Outils SEO recommandés", type: "TEXTE", duration: 10 },
      ],
    },
  ],
};

// Review comments
const REVIEW_COMMENTS_FR = [
  "Excellente formation, très bien structurée et claire. Les projets pratiques sont un vrai plus.",
  "Formation de qualité. L'instructeur explique très bien les concepts. Je recommande vivement.",
  "Bon contenu mais j'aurais aimé plus d'exercices pratiques. Globalement satisfait.",
  "Parfait pour les débutants. J'ai appris énormément de choses en quelques semaines.",
  "Très bonne formation, le rythme est adapté. Les ressources complémentaires sont utiles.",
  "Formation complète et bien organisée. Le support de l'instructeur est réactif.",
  "Contenu à jour et pertinent. Les exemples sont tirés de cas réels, c'est appréciable.",
  "J'ai enfin compris des concepts qui me semblaient obscurs. Merci pour cette formation !",
  "Bonne formation dans l'ensemble. Quelques leçons mériteraient d'être approfondies.",
  "Vraiment top ! Je suis passé de débutant à un niveau confortable grâce à cette formation.",
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

  // Delete in reverse dependency order to avoid foreign key violations
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

  // Delete test users (keep any real production users)
  const testEmails = [
    ...ADMIN_USERS.map((u) => u.email),
    ...INSTRUCTEUR_USERS.map((u) => u.email),
    ...APPRENANT_USERS.map((u) => u.email),
  ];
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  console.log("  Done.\n");

  // ── Step 1: Create Formation Categories ──
  console.log("Creating formation categories...");
  const categories = [];
  for (const cat of FORMATION_CATEGORIES) {
    const created = await prisma.formationCategory.create({ data: cat });
    categories.push(created);
    console.log(`  + ${cat.name}`);
  }

  // ── Step 2: Create Users ──
  console.log("\nCreating admin users...");
  const passwordHash = await simpleHash("TestPassword123!");

  const adminUsers = [];
  for (const admin of ADMIN_USERS) {
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        role: "ADMIN",
        plan: "AGENCE",
        kyc: 4,
        status: "ACTIF",
        country: admin.country,
        countryFlag: admin.countryFlag,
      },
      create: {
        id: admin.id,
        email: admin.email,
        passwordHash,
        name: admin.name,
        role: "ADMIN",
        plan: "AGENCE",
        kyc: 4,
        status: "ACTIF",
        country: admin.country,
        countryFlag: admin.countryFlag,
      },
    });
    adminUsers.push(user);
    console.log(`  + ${admin.name} (${admin.email})`);
  }

  console.log("\nCreating instructeur users...");
  const instructeurUsers = [];
  const instructeurProfiles = [];
  for (const inst of INSTRUCTEUR_USERS) {
    const user = await prisma.user.upsert({
      where: { email: inst.email },
      update: {
        name: inst.name,
        formationsRole: "instructeur",
        country: inst.country,
        countryFlag: inst.countryFlag,
        avatar: inst.avatar,
        kyc: 3,
        status: "ACTIF",
      },
      create: {
        id: inst.id,
        email: inst.email,
        passwordHash,
        name: inst.name,
        role: "FREELANCE",
        plan: "PRO",
        kyc: 3,
        status: "ACTIF",
        formationsRole: "instructeur",
        country: inst.country,
        countryFlag: inst.countryFlag,
        avatar: inst.avatar,
      },
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
        status: "APPROUVE",
        totalEarned: randomFloat(500, 15000),
      },
    });
    instructeurProfiles.push(profile);
    console.log(`  + ${inst.name} (${inst.email}) — Profil instructeur créé`);
  }

  console.log("\nCreating apprenant users...");
  const apprenantUsers = [];
  for (const app of APPRENANT_USERS) {
    const user = await prisma.user.create({
      data: {
        id: app.id,
        email: app.email,
        passwordHash,
        name: app.name,
        role: "FREELANCE",
        plan: randomItem(["GRATUIT", "GRATUIT", "GRATUIT", "PRO"] as const),
        kyc: randomInt(1, 3),
        status: "ACTIF",
        formationsRole: "apprenant",
        country: app.country,
        countryFlag: app.countryFlag,
      },
    });
    apprenantUsers.push(user);
  }
  console.log(`  + ${apprenantUsers.length} apprenant users created`);

  // ── Step 3: Create Formations ──
  console.log("\nCreating formations...");
  const formations = [];
  for (let i = 0; i < FORMATIONS_DATA.length; i++) {
    const f = FORMATIONS_DATA[i];
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
        locale: "fr",
        level: f.level,
        price: f.price,
        originalPrice: f.originalPrice,
        isFree,
        duration: f.duration,
        categoryId: category.id,
        instructeurId: instructeur.id,
        status: f.status,
        studentsCount: f.status === "ACTIF" ? randomInt(15, 200) : 0,
        rating: f.status === "ACTIF" ? randomFloat(3.5, 5.0, 1) : 0,
        reviewsCount: f.status === "ACTIF" ? randomInt(3, 25) : 0,
        viewsCount: f.status === "ACTIF" ? randomInt(200, 5000) : randomInt(0, 50),
        hasCertificate: true,
        minScore: 80,
        publishedAt: f.status === "ACTIF" ? new Date(Date.now() - randomInt(7, 180) * 86400000) : null,
        language: ["fr", "en"],
      },
    });
    formations.push(formation);
    console.log(`  + [${f.status}] ${f.title}`);
  }

  // ── Step 4: Create Sections and Lessons for ACTIF formations ──
  console.log("\nCreating sections and lessons for active formations...");
  const allLessons: { id: string; formationId: string }[] = [];

  for (let fIdx = 0; fIdx < formations.length; fIdx++) {
    const formation = formations[fIdx];
    if (formation.status !== "ACTIF") continue;

    const sections = SECTION_TEMPLATES[fIdx];
    if (!sections) continue;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sectionData = sections[sIdx];
      const section = await prisma.section.create({
        data: {
          id: createId(),
          title: sectionData.title,
          order: sIdx,
          formationId: formation.id,
        },
      });

      for (let lIdx = 0; lIdx < sectionData.lessons.length; lIdx++) {
        const lessonData = sectionData.lessons[lIdx];
        const lesson = await prisma.lesson.create({
          data: {
            id: createId(),
            title: lessonData.title,
            type: lessonData.type,
            duration: lessonData.duration,
            order: lIdx,
            isFree: lIdx === 0 && sIdx === 0, // First lesson of first section is free
            sectionId: section.id,
            videoUrl: lessonData.type === "VIDEO" ? `https://www.youtube.com/watch?v=dQw4w9WgXcQ` : null,
            content: lessonData.type === "TEXTE" ? `<h2>${lessonData.title}</h2><p>Contenu de la leçon texte. Ce contenu serait remplacé par le vrai contenu en production.</p>` : null,
          },
        });
        allLessons.push({ id: lesson.id, formationId: formation.id });
      }
    }
    console.log(`  + Sections/Lessons pour: ${formation.title}`);
  }

  // ── Step 5: Create Enrollments ──
  console.log("\nCreating enrollments...");
  const actifFormations = formations.filter((f) => f.status === "ACTIF");
  const enrollments = [];
  const enrollmentSet = new Set<string>(); // Track unique userId+formationId

  for (let i = 0; i < 50; i++) {
    const user = randomItem(apprenantUsers);
    const formation = randomItem(actifFormations);
    const key = `${user.id}-${formation.id}`;

    // Skip if this enrollment already exists
    if (enrollmentSet.has(key)) continue;
    enrollmentSet.add(key);

    const progress = randomItem([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100]);
    const isCompleted = progress === 100;

    const enrollment = await prisma.enrollment.create({
      data: {
        id: createId(),
        userId: user.id,
        formationId: formation.id,
        progress,
        paidAmount: formation.price,
        completedAt: isCompleted ? new Date(Date.now() - randomInt(1, 60) * 86400000) : null,
      },
    });
    enrollments.push({ ...enrollment, formationId: formation.id, userId: user.id });
  }
  console.log(`  + ${enrollments.length} enrollments created`);

  // ── Step 6: Create Certificates for completed enrollments ──
  console.log("\nCreating certificates...");
  const completedEnrollments = enrollments.filter((e) => e.progress === 100);
  let certCount = 0;

  for (const enrollment of completedEnrollments.slice(0, 15)) {
    await prisma.certificate.create({
      data: {
        id: createId(),
        code: generateCertCode(),
        enrollmentId: enrollment.id,
        userId: enrollment.userId,
        formationId: enrollment.formationId,
        score: randomInt(80, 100),
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
        id: createId(),
        slug: slugify(product.title),
        title: product.title,
        description: product.description,
        locale: "fr",
        productType: product.productType,
        price: product.price,
        categoryId: category.id,
        instructeurId: instructeur.id,
        status: "ACTIF",
        salesCount: randomInt(10, 150),
        viewsCount: randomInt(100, 3000),
        rating: randomFloat(3.5, 5.0, 1),
        reviewsCount: randomInt(2, 20),
        tags: ["freelance", "afrique", "francophone"],
      },
    });
    console.log(`  + ${product.title}`);
  }

  // ── Step 8: Create Formation Cohorts ──
  console.log("\nCreating formation cohorts...");
  const cohortFormations = actifFormations.slice(0, 3);
  const cohortData = [
    {
      title: "Cohorte Janvier 2026",
      description: "Apprenez ensemble avec un groupe motivé. Sessions de mentorat incluses.",
      durationDays: 42,
      maxParticipants: 30,
      price: 79.99,
      originalPrice: 99.99,
      status: "TERMINE" as const,
    },
    {
      title: "Cohorte Mars 2026",
      description: "Rejoignez notre cohorte de mars. Accompagnement personnalisé et projets de groupe.",
      durationDays: 56,
      maxParticipants: 25,
      price: 89.99,
      originalPrice: 119.99,
      status: "EN_COURS" as const,
    },
    {
      title: "Cohorte Mai 2026",
      description: "Inscriptions ouvertes pour la cohorte de mai. Places limitées !",
      durationDays: 42,
      maxParticipants: 20,
      price: 69.99,
      originalPrice: null,
      status: "OUVERT" as const,
    },
  ];

  for (let i = 0; i < cohortData.length; i++) {
    const cohort = cohortData[i];
    const formation = cohortFormations[i];
    const startDate = new Date();

    if (cohort.status === "TERMINE") {
      startDate.setDate(startDate.getDate() - 90);
    } else if (cohort.status === "EN_COURS") {
      startDate.setDate(startDate.getDate() - 14);
    } else {
      startDate.setDate(startDate.getDate() + 30);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + cohort.durationDays);

    const enrollmentDeadline = new Date(startDate);
    enrollmentDeadline.setDate(enrollmentDeadline.getDate() - 7);

    await prisma.formationCohort.create({
      data: {
        id: createId(),
        formationId: formation.id,
        title: cohort.title,
        description: cohort.description,
        startDate,
        endDate,
        enrollmentDeadline,
        durationDays: cohort.durationDays,
        maxParticipants: cohort.maxParticipants,
        currentCount: cohort.status === "TERMINE" ? cohort.maxParticipants : cohort.status === "EN_COURS" ? randomInt(10, cohort.maxParticipants) : randomInt(0, 8),
        price: cohort.price,
        originalPrice: cohort.originalPrice,
        status: cohort.status,
        schedule: [
          { week: 1, title: "Introduction et fondamentaux", tasks: ["Regarder les leçons 1-4", "Compléter l'exercice d'introduction"] },
          { week: 2, title: "Approfondissement", tasks: ["Regarder les leçons 5-8", "Projet pratique #1"] },
          { week: 3, title: "Projet final", tasks: ["Travailler sur le projet final", "Review par les pairs"] },
        ],
      },
    });
    console.log(`  + ${cohort.title} (${cohort.status})`);
  }

  // ── Step 9: Create Formation Reviews ──
  console.log("\nCreating formation reviews...");
  const reviewSet = new Set<string>();
  let reviewCount = 0;

  for (let i = 0; i < 10; i++) {
    // Pick enrollments with some progress for reviews
    const eligibleEnrollments = enrollments.filter((e) => e.progress >= 50);
    if (eligibleEnrollments.length === 0) break;

    const enrollment = eligibleEnrollments[i % eligibleEnrollments.length];
    const key = `${enrollment.userId}-${enrollment.formationId}`;

    if (reviewSet.has(key)) continue;
    reviewSet.add(key);

    const rating = randomItem([3, 4, 4, 4, 5, 5, 5]);

    await prisma.formationReview.create({
      data: {
        id: createId(),
        rating,
        comment: REVIEW_COMMENTS_FR[i % REVIEW_COMMENTS_FR.length],
        userId: enrollment.userId,
        formationId: enrollment.formationId,
        enrollmentId: enrollment.id,
        response: rating >= 4 ? "Merci beaucoup pour votre retour positif ! Ravi que la formation vous ait plu." : null,
        respondedAt: rating >= 4 ? new Date() : null,
      },
    });
    reviewCount++;
  }
  console.log(`  + ${reviewCount} reviews created`);

  // ── Summary ──
  console.log("\n=== Seed Complete ===");
  console.log(`  Categories:          ${categories.length}`);
  console.log(`  Admin users:         ${adminUsers.length}`);
  console.log(`  Instructeur users:   ${instructeurUsers.length}`);
  console.log(`  Apprenant users:     ${apprenantUsers.length}`);
  console.log(`  Formations:          ${formations.length}`);
  console.log(`  Sections/Lessons:    ${allLessons.length} lessons`);
  console.log(`  Enrollments:         ${enrollments.length}`);
  console.log(`  Certificates:        ${certCount}`);
  console.log(`  Digital Products:    ${DIGITAL_PRODUCTS_DATA.length}`);
  console.log(`  Cohorts:             ${cohortData.length}`);
  console.log(`  Reviews:             ${reviewCount}`);
  console.log(`\nAll test users password: TestPassword123! (SHA-256 hash)`);
  console.log("Note: In production, use bcryptjs for password hashing.\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
