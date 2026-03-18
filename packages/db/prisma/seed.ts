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
  {
    id: createId(),
    nameFr: "Développement Web",
    nameEn: "Web Development",
    slug: "developpement-web",
    icon: "code",
    color: "#3B82F6",
    order: 1,
  },
  {
    id: createId(),
    nameFr: "Design & Créativité",
    nameEn: "Design & Creativity",
    slug: "design-creativite",
    icon: "palette",
    color: "#EC4899",
    order: 2,
  },
  {
    id: createId(),
    nameFr: "Marketing Digital",
    nameEn: "Digital Marketing",
    slug: "marketing-digital",
    icon: "campaign",
    color: "#EF4444",
    order: 3,
  },
  {
    id: createId(),
    nameFr: "Intelligence Artificielle",
    nameEn: "Artificial Intelligence",
    slug: "intelligence-artificielle",
    icon: "smart_toy",
    color: "#6366F1",
    order: 4,
  },
  {
    id: createId(),
    nameFr: "Business & Freelancing",
    nameEn: "Business & Freelancing",
    slug: "business-freelancing",
    icon: "briefcase",
    color: "#7C3AED",
    order: 5,
  },
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

// Formations data with variety of topics
const FORMATIONS_DATA = [
  {
    titleFr: "React & Next.js : Le Guide Complet 2026",
    titleEn: "React & Next.js: The Complete Guide 2026",
    shortDescFr: "Apprenez React et Next.js de zéro à expert avec des projets concrets",
    shortDescEn: "Learn React and Next.js from zero to expert with real projects",
    descriptionFr: "Cette formation complète vous guide pas à pas dans la maîtrise de React et Next.js 14. Vous apprendrez le App Router, les Server Components, le SSR, le SSG, et bien plus. À travers 5 projets pratiques, vous deviendrez un développeur React autonome et compétent.",
    descriptionEn: "This complete course guides you step by step to master React and Next.js 14. You will learn App Router, Server Components, SSR, SSG, and much more. Through 5 practical projects, you will become an autonomous and competent React developer.",
    level: "INTERMEDIAIRE" as const,
    price: 49.99,
    originalPrice: 89.99,
    duration: 1800,
    categoryIdx: 0, // Développement Web
    instructeurIdx: 0, // Sophie
    status: "ACTIF" as const,
    learnPointsFr: ["Maîtriser React 19 et ses hooks avancés", "Construire des applications avec Next.js 14 App Router", "Implémenter le SSR, SSG et ISR", "Gérer l'état avec Zustand et TanStack Query", "Déployer sur Vercel"],
    learnPointsEn: ["Master React 19 and advanced hooks", "Build applications with Next.js 14 App Router", "Implement SSR, SSG, and ISR", "Manage state with Zustand and TanStack Query", "Deploy on Vercel"],
    requirementsFr: ["Connaissances de base en HTML, CSS et JavaScript", "Un ordinateur avec Node.js installé"],
    requirementsEn: ["Basic knowledge of HTML, CSS and JavaScript", "A computer with Node.js installed"],
  },
  {
    titleFr: "Maîtriser Tailwind CSS & shadcn/ui",
    titleEn: "Master Tailwind CSS & shadcn/ui",
    shortDescFr: "Créez des interfaces modernes et accessibles avec Tailwind et shadcn/ui",
    shortDescEn: "Create modern and accessible interfaces with Tailwind and shadcn/ui",
    descriptionFr: "Découvrez comment construire des interfaces utilisateur élégantes avec Tailwind CSS et la bibliothèque shadcn/ui. De la mise en page responsive au design system complet, cette formation couvre tout ce qu'il faut savoir.",
    descriptionEn: "Discover how to build elegant user interfaces with Tailwind CSS and the shadcn/ui library. From responsive layout to complete design system, this course covers everything you need to know.",
    level: "DEBUTANT" as const,
    price: 29.99,
    originalPrice: 49.99,
    duration: 900,
    categoryIdx: 0, // Développement Web
    instructeurIdx: 0, // Sophie
    status: "ACTIF" as const,
    learnPointsFr: ["Maîtriser les classes utilitaires de Tailwind CSS", "Installer et personnaliser shadcn/ui", "Créer un design system complet", "Concevoir des layouts responsive"],
    learnPointsEn: ["Master Tailwind CSS utility classes", "Install and customize shadcn/ui", "Create a complete design system", "Design responsive layouts"],
    requirementsFr: ["Connaissances en HTML et CSS", "Bases de React"],
    requirementsEn: ["HTML and CSS knowledge", "React basics"],
  },
  {
    titleFr: "UI/UX Design : De l'Idée au Prototype",
    titleEn: "UI/UX Design: From Idea to Prototype",
    shortDescFr: "Apprenez à concevoir des interfaces intuitives avec Figma",
    shortDescEn: "Learn to design intuitive interfaces with Figma",
    descriptionFr: "Formez-vous au design d'interface et d'expérience utilisateur. Vous apprendrez à réaliser des wireframes, des maquettes et des prototypes interactifs avec Figma. Études de cas réels et projets pratiques inclus.",
    descriptionEn: "Train in interface and user experience design. You will learn to create wireframes, mockups and interactive prototypes with Figma. Real case studies and practical projects included.",
    level: "TOUS_NIVEAUX" as const,
    price: 39.99,
    originalPrice: 69.99,
    duration: 1200,
    categoryIdx: 1, // Design
    instructeurIdx: 1, // Marc
    status: "ACTIF" as const,
    learnPointsFr: ["Maîtriser Figma de A à Z", "Mener une recherche utilisateur", "Créer des wireframes et prototypes", "Appliquer les principes d'accessibilité"],
    learnPointsEn: ["Master Figma from A to Z", "Conduct user research", "Create wireframes and prototypes", "Apply accessibility principles"],
    requirementsFr: ["Aucun prérequis technique"],
    requirementsEn: ["No technical prerequisites"],
  },
  {
    titleFr: "Branding & Identité Visuelle pour Freelances",
    titleEn: "Branding & Visual Identity for Freelancers",
    shortDescFr: "Construisez une marque personnelle forte qui attire les clients",
    shortDescEn: "Build a strong personal brand that attracts clients",
    descriptionFr: "Dans cette formation, vous apprendrez à créer une identité visuelle professionnelle. Du logo à la charte graphique, en passant par les supports de communication, vous aurez tous les outils pour vous démarquer.",
    descriptionEn: "In this course, you will learn to create a professional visual identity. From logo to brand guidelines, including communication materials, you will have all the tools to stand out.",
    level: "DEBUTANT" as const,
    price: 24.99,
    originalPrice: null,
    duration: 600,
    categoryIdx: 1, // Design
    instructeurIdx: 1, // Marc
    status: "ACTIF" as const,
    learnPointsFr: ["Créer un logo professionnel", "Définir une charte graphique", "Choisir typographies et couleurs", "Créer des templates réutilisables"],
    learnPointsEn: ["Create a professional logo", "Define brand guidelines", "Choose typography and colors", "Create reusable templates"],
    requirementsFr: ["Notions de base en design graphique souhaitées"],
    requirementsEn: ["Basic graphic design knowledge preferred"],
  },
  {
    titleFr: "SEO & Content Marketing : Stratégie Complète",
    titleEn: "SEO & Content Marketing: Complete Strategy",
    shortDescFr: "Dominez les résultats Google et développez votre audience organique",
    shortDescEn: "Dominate Google results and grow your organic audience",
    descriptionFr: "Formation complète sur le référencement naturel et le marketing de contenu. Apprenez à positionner vos pages en première page Google, à créer du contenu qui convertit, et à mesurer vos résultats avec Google Analytics.",
    descriptionEn: "Complete training on SEO and content marketing. Learn to rank your pages on Google's first page, create converting content, and measure your results with Google Analytics.",
    level: "INTERMEDIAIRE" as const,
    price: 34.99,
    originalPrice: 59.99,
    duration: 1080,
    categoryIdx: 2, // Marketing Digital
    instructeurIdx: 2, // Fatou
    status: "ACTIF" as const,
    learnPointsFr: ["Maîtriser le SEO on-page et off-page", "Créer une stratégie de contenu", "Utiliser Google Search Console et Analytics", "Optimiser la conversion"],
    learnPointsEn: ["Master on-page and off-page SEO", "Create a content strategy", "Use Google Search Console and Analytics", "Optimize conversion"],
    requirementsFr: ["Site web ou blog existant recommandé"],
    requirementsEn: ["Existing website or blog recommended"],
  },
  {
    titleFr: "Node.js & API REST : Architecture Backend",
    titleEn: "Node.js & REST API: Backend Architecture",
    shortDescFr: "Construisez des APIs performantes et sécurisées avec Node.js",
    shortDescEn: "Build performant and secure APIs with Node.js",
    descriptionFr: "Apprenez à concevoir et développer des APIs REST robustes avec Node.js, Express/Fastify, et Prisma. Cette formation couvre l'authentification JWT, la validation des données, les tests et le déploiement.",
    descriptionEn: "Learn to design and develop robust REST APIs with Node.js, Express/Fastify, and Prisma. This course covers JWT authentication, data validation, testing, and deployment.",
    level: "AVANCE" as const,
    price: 59.99,
    originalPrice: 99.99,
    duration: 2400,
    categoryIdx: 0, // Développement Web
    instructeurIdx: 0, // Sophie
    status: "BROUILLON" as const,
    learnPointsFr: ["Architecturer des APIs REST professionnelles", "Implémenter JWT et OAuth", "Utiliser Prisma avec PostgreSQL", "Tester avec Jest et Supertest"],
    learnPointsEn: ["Architect professional REST APIs", "Implement JWT and OAuth", "Use Prisma with PostgreSQL", "Test with Jest and Supertest"],
    requirementsFr: ["JavaScript avancé", "Expérience avec Node.js de base"],
    requirementsEn: ["Advanced JavaScript", "Basic Node.js experience"],
  },
  {
    titleFr: "Introduction au Prompt Engineering avec ChatGPT",
    titleEn: "Introduction to Prompt Engineering with ChatGPT",
    shortDescFr: "Apprenez à formuler des prompts efficaces pour exploiter l'IA",
    shortDescEn: "Learn to formulate effective prompts to leverage AI",
    descriptionFr: "Découvrez les techniques de prompt engineering pour tirer le meilleur de ChatGPT et des modèles de langage. Applications concrètes pour le travail freelance : rédaction, code, marketing, et plus.",
    descriptionEn: "Discover prompt engineering techniques to get the most out of ChatGPT and language models. Practical applications for freelance work: writing, code, marketing, and more.",
    level: "DEBUTANT" as const,
    price: 19.99,
    originalPrice: null,
    duration: 480,
    categoryIdx: 3, // IA
    instructeurIdx: 2, // Fatou
    status: "BROUILLON" as const,
    learnPointsFr: ["Comprendre le fonctionnement des LLM", "Maîtriser les techniques de prompting", "Automatiser des tâches avec l'IA", "Intégrer l'IA dans son workflow"],
    learnPointsEn: ["Understand how LLMs work", "Master prompting techniques", "Automate tasks with AI", "Integrate AI into your workflow"],
    requirementsFr: ["Aucun prérequis technique"],
    requirementsEn: ["No technical prerequisites"],
  },
  {
    titleFr: "Facebook & Instagram Ads pour Débutants",
    titleEn: "Facebook & Instagram Ads for Beginners",
    shortDescFr: "Créez vos premières campagnes publicitaires rentables",
    shortDescEn: "Create your first profitable ad campaigns",
    descriptionFr: "Apprenez à créer et optimiser des campagnes publicitaires sur Facebook et Instagram. De la création d'audience au retargeting, en passant par l'A/B testing, cette formation vous donne toutes les clés.",
    descriptionEn: "Learn to create and optimize advertising campaigns on Facebook and Instagram. From audience creation to retargeting, including A/B testing, this course gives you all the keys.",
    level: "DEBUTANT" as const,
    price: 0,
    originalPrice: null,
    duration: 360,
    categoryIdx: 2, // Marketing Digital
    instructeurIdx: 2, // Fatou
    status: "EN_ATTENTE" as const,
    learnPointsFr: ["Configurer le Business Manager", "Créer des audiences ciblées", "Concevoir des publicités qui convertissent", "Analyser les performances"],
    learnPointsEn: ["Set up Business Manager", "Create targeted audiences", "Design converting ads", "Analyze performance"],
    requirementsFr: ["Un compte Facebook actif"],
    requirementsEn: ["An active Facebook account"],
  },
  {
    titleFr: "Lancer son Business de Freelance en Afrique",
    titleEn: "Launch Your Freelance Business in Africa",
    shortDescFr: "Le guide pratique pour devenir freelance prospère depuis l'Afrique",
    shortDescEn: "The practical guide to becoming a prosperous freelancer from Africa",
    descriptionFr: "Formation spécialement conçue pour les freelances africains. Couvre la gestion financière, la facturation en multi-devises, le positionnement international, et les méthodes de paiement Mobile Money.",
    descriptionEn: "Course specifically designed for African freelancers. Covers financial management, multi-currency billing, international positioning, and Mobile Money payment methods.",
    level: "TOUS_NIVEAUX" as const,
    price: 14.99,
    originalPrice: 29.99,
    duration: 720,
    categoryIdx: 4, // Business & Freelancing
    instructeurIdx: 2, // Fatou
    status: "EN_ATTENTE" as const,
    learnPointsFr: ["Définir son positionnement et ses tarifs", "Gérer la facturation multi-devises", "Trouver des clients internationaux", "Maîtriser les outils de productivité"],
    learnPointsEn: ["Define your positioning and rates", "Manage multi-currency billing", "Find international clients", "Master productivity tools"],
    requirementsFr: ["Avoir une compétence à vendre"],
    requirementsEn: ["Have a skill to sell"],
  },
  {
    titleFr: "TypeScript Avancé : Patterns et Bonnes Pratiques",
    titleEn: "Advanced TypeScript: Patterns and Best Practices",
    shortDescFr: "Passez au niveau supérieur avec les types avancés de TypeScript",
    shortDescEn: "Level up with TypeScript's advanced types",
    descriptionFr: "Plongez dans les fonctionnalités avancées de TypeScript : generics, types conditionnels, infer, template literal types, et patterns architecturaux. Formation destinée aux développeurs qui veulent écrire du code TypeScript de qualité production.",
    descriptionEn: "Dive into TypeScript's advanced features: generics, conditional types, infer, template literal types, and architectural patterns. Course for developers who want to write production-quality TypeScript code.",
    level: "AVANCE" as const,
    price: 44.99,
    originalPrice: 79.99,
    duration: 1500,
    categoryIdx: 0, // Développement Web
    instructeurIdx: 0, // Sophie
    status: "ARCHIVE" as const,
    learnPointsFr: ["Maîtriser les generics avancés", "Implémenter des types conditionnels", "Créer des types utilitaires", "Appliquer les patterns TypeScript"],
    learnPointsEn: ["Master advanced generics", "Implement conditional types", "Create utility types", "Apply TypeScript patterns"],
    requirementsFr: ["Expérience avec TypeScript basique", "Connaissance de JavaScript ES6+"],
    requirementsEn: ["Experience with basic TypeScript", "Knowledge of JavaScript ES6+"],
  },
];

// Section/Lesson templates for ACTIF formations
const SECTION_TEMPLATES: Record<number, { titleFr: string; titleEn: string; lessons: { titleFr: string; titleEn: string; type: "VIDEO" | "TEXTE"; duration: number }[] }[]> = {
  // Formation 0: React & Next.js
  0: [
    {
      titleFr: "Introduction et Configuration",
      titleEn: "Introduction and Setup",
      lessons: [
        { titleFr: "Bienvenue dans la formation", titleEn: "Welcome to the course", type: "VIDEO", duration: 8 },
        { titleFr: "Installation de l'environnement", titleEn: "Environment setup", type: "VIDEO", duration: 15 },
        { titleFr: "Premiers pas avec React", titleEn: "First steps with React", type: "VIDEO", duration: 22 },
        { titleFr: "Ressources et documentation", titleEn: "Resources and documentation", type: "TEXTE", duration: 5 },
      ],
    },
    {
      titleFr: "Les Fondamentaux de React",
      titleEn: "React Fundamentals",
      lessons: [
        { titleFr: "Composants et JSX", titleEn: "Components and JSX", type: "VIDEO", duration: 25 },
        { titleFr: "Props et State", titleEn: "Props and State", type: "VIDEO", duration: 30 },
        { titleFr: "Hooks essentiels : useState, useEffect", titleEn: "Essential hooks: useState, useEffect", type: "VIDEO", duration: 35 },
        { titleFr: "Gestion des événements", titleEn: "Event handling", type: "VIDEO", duration: 20 },
        { titleFr: "Exercice pratique : Todo App", titleEn: "Practical exercise: Todo App", type: "TEXTE", duration: 45 },
      ],
    },
    {
      titleFr: "Next.js 14 App Router",
      titleEn: "Next.js 14 App Router",
      lessons: [
        { titleFr: "Architecture du App Router", titleEn: "App Router architecture", type: "VIDEO", duration: 28 },
        { titleFr: "Server Components vs Client Components", titleEn: "Server Components vs Client Components", type: "VIDEO", duration: 32 },
        { titleFr: "Layouts et Loading States", titleEn: "Layouts and Loading States", type: "VIDEO", duration: 22 },
        { titleFr: "Récapitulatif du module", titleEn: "Module recap", type: "TEXTE", duration: 10 },
      ],
    },
  ],
  // Formation 1: Tailwind CSS & shadcn/ui
  1: [
    {
      titleFr: "Découverte de Tailwind CSS",
      titleEn: "Discovering Tailwind CSS",
      lessons: [
        { titleFr: "Qu'est-ce que Tailwind CSS ?", titleEn: "What is Tailwind CSS?", type: "VIDEO", duration: 12 },
        { titleFr: "Installation et configuration", titleEn: "Installation and configuration", type: "VIDEO", duration: 18 },
        { titleFr: "Classes utilitaires essentielles", titleEn: "Essential utility classes", type: "VIDEO", duration: 25 },
      ],
    },
    {
      titleFr: "Mise en Page Responsive",
      titleEn: "Responsive Layout",
      lessons: [
        { titleFr: "Flexbox avec Tailwind", titleEn: "Flexbox with Tailwind", type: "VIDEO", duration: 20 },
        { titleFr: "CSS Grid avec Tailwind", titleEn: "CSS Grid with Tailwind", type: "VIDEO", duration: 22 },
        { titleFr: "Points de rupture et mobile-first", titleEn: "Breakpoints and mobile-first", type: "VIDEO", duration: 18 },
        { titleFr: "Guide des breakpoints", titleEn: "Breakpoints guide", type: "TEXTE", duration: 8 },
      ],
    },
    {
      titleFr: "shadcn/ui : Composants Accessibles",
      titleEn: "shadcn/ui: Accessible Components",
      lessons: [
        { titleFr: "Introduction à shadcn/ui", titleEn: "Introduction to shadcn/ui", type: "VIDEO", duration: 15 },
        { titleFr: "Installer et personnaliser les composants", titleEn: "Install and customize components", type: "VIDEO", duration: 28 },
        { titleFr: "Créer son design system", titleEn: "Create your design system", type: "VIDEO", duration: 35 },
      ],
    },
  ],
  // Formation 2: UI/UX Design
  2: [
    {
      titleFr: "Fondamentaux du UX Design",
      titleEn: "UX Design Fundamentals",
      lessons: [
        { titleFr: "Qu'est-ce que le UX Design ?", titleEn: "What is UX Design?", type: "VIDEO", duration: 15 },
        { titleFr: "Recherche utilisateur : méthodes", titleEn: "User research: methods", type: "VIDEO", duration: 25 },
        { titleFr: "Personas et parcours utilisateur", titleEn: "Personas and user journeys", type: "VIDEO", duration: 20 },
        { titleFr: "Check-list de recherche UX", titleEn: "UX research checklist", type: "TEXTE", duration: 10 },
      ],
    },
    {
      titleFr: "Prise en Main de Figma",
      titleEn: "Getting Started with Figma",
      lessons: [
        { titleFr: "Interface et outils de base", titleEn: "Interface and basic tools", type: "VIDEO", duration: 30 },
        { titleFr: "Composants et variantes", titleEn: "Components and variants", type: "VIDEO", duration: 35 },
        { titleFr: "Auto Layout avancé", titleEn: "Advanced Auto Layout", type: "VIDEO", duration: 28 },
      ],
    },
  ],
  // Formation 3: Branding
  3: [
    {
      titleFr: "Les Bases du Branding",
      titleEn: "Branding Basics",
      lessons: [
        { titleFr: "Qu'est-ce qu'une marque ?", titleEn: "What is a brand?", type: "VIDEO", duration: 12 },
        { titleFr: "Définir son positionnement", titleEn: "Define your positioning", type: "VIDEO", duration: 18 },
        { titleFr: "Étude de cas : marques africaines", titleEn: "Case study: African brands", type: "TEXTE", duration: 15 },
      ],
    },
    {
      titleFr: "Création du Logo",
      titleEn: "Logo Creation",
      lessons: [
        { titleFr: "Principes de création de logo", titleEn: "Logo creation principles", type: "VIDEO", duration: 22 },
        { titleFr: "Atelier pratique : votre logo", titleEn: "Workshop: your logo", type: "VIDEO", duration: 40 },
        { titleFr: "Déclinaisons et usages", titleEn: "Variations and uses", type: "VIDEO", duration: 15 },
        { titleFr: "Brief créatif template", titleEn: "Creative brief template", type: "TEXTE", duration: 5 },
      ],
    },
  ],
  // Formation 4: SEO & Content Marketing
  4: [
    {
      titleFr: "Fondamentaux du SEO",
      titleEn: "SEO Fundamentals",
      lessons: [
        { titleFr: "Comment fonctionne Google", titleEn: "How Google works", type: "VIDEO", duration: 18 },
        { titleFr: "Recherche de mots-clés", titleEn: "Keyword research", type: "VIDEO", duration: 25 },
        { titleFr: "SEO on-page : les essentiels", titleEn: "On-page SEO: the essentials", type: "VIDEO", duration: 30 },
        { titleFr: "Checklist SEO on-page", titleEn: "On-page SEO checklist", type: "TEXTE", duration: 8 },
      ],
    },
    {
      titleFr: "Stratégie de Contenu",
      titleEn: "Content Strategy",
      lessons: [
        { titleFr: "Créer un calendrier éditorial", titleEn: "Create an editorial calendar", type: "VIDEO", duration: 20 },
        { titleFr: "Rédiger pour le web", titleEn: "Writing for the web", type: "VIDEO", duration: 22 },
        { titleFr: "Mesurer les résultats avec Analytics", titleEn: "Measure results with Analytics", type: "VIDEO", duration: 28 },
      ],
    },
    {
      titleFr: "SEO Technique et Netlinking",
      titleEn: "Technical SEO and Link Building",
      lessons: [
        { titleFr: "Optimisation technique du site", titleEn: "Technical site optimization", type: "VIDEO", duration: 25 },
        { titleFr: "Stratégie de backlinks", titleEn: "Backlink strategy", type: "VIDEO", duration: 22 },
        { titleFr: "Outils SEO recommandés", titleEn: "Recommended SEO tools", type: "TEXTE", duration: 10 },
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

// Digital product data
const DIGITAL_PRODUCTS_DATA = [
  {
    titleFr: "Guide Complet du Freelance en Afrique (eBook)",
    titleEn: "Complete African Freelancer Guide (eBook)",
    descriptionFr: "Un guide de 150 pages couvrant tout ce qu'il faut savoir pour démarrer et réussir en tant que freelance en Afrique francophone. Inclut des templates de contrats et de factures.",
    descriptionEn: "A 150-page guide covering everything you need to know to start and succeed as a freelancer in francophone Africa. Includes contract and invoice templates.",
    productType: "EBOOK" as const,
    price: 14.99,
    categoryIdx: 4,
    instructeurIdx: 2,
  },
  {
    titleFr: "Pack de 50 Templates Figma pour Apps Mobile",
    titleEn: "50 Figma Templates Pack for Mobile Apps",
    descriptionFr: "Collection de 50 écrans UI prêts à l'emploi pour vos projets d'applications mobiles. Inclut onboarding, dashboards, profils, paramètres et plus.",
    descriptionEn: "Collection of 50 ready-to-use UI screens for your mobile app projects. Includes onboarding, dashboards, profiles, settings, and more.",
    productType: "TEMPLATE" as const,
    price: 29.99,
    categoryIdx: 1,
    instructeurIdx: 1,
  },
  {
    titleFr: "Checklist SEO 2026 (PDF)",
    titleEn: "SEO Checklist 2026 (PDF)",
    descriptionFr: "La checklist SEO la plus complète pour 2026. 120 points de contrôle organisés par catégorie : technique, contenu, backlinks, local SEO.",
    descriptionEn: "The most complete SEO checklist for 2026. 120 checkpoints organized by category: technical, content, backlinks, local SEO.",
    productType: "PDF" as const,
    price: 9.99,
    categoryIdx: 2,
    instructeurIdx: 2,
  },
  {
    titleFr: "Kit de Branding Complet pour Freelances",
    titleEn: "Complete Branding Kit for Freelancers",
    descriptionFr: "Tout ce qu'il faut pour créer votre identité visuelle : templates de logo, palettes de couleurs, choix typographiques, modèles de cartes de visite et présentations.",
    descriptionEn: "Everything you need to create your visual identity: logo templates, color palettes, typography choices, business card models and presentations.",
    productType: "TEMPLATE" as const,
    price: 19.99,
    categoryIdx: 1,
    instructeurIdx: 1,
  },
  {
    titleFr: "Modèles de Contrats Freelance (Pack PDF)",
    titleEn: "Freelance Contract Templates (PDF Pack)",
    descriptionFr: "Pack de 10 modèles de contrats adaptés au freelancing en Afrique francophone : contrat de prestation, NDA, devis type, conditions générales, et plus.",
    descriptionEn: "Pack of 10 contract templates adapted for freelancing in francophone Africa: service contract, NDA, standard quote, general terms, and more.",
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
    console.log(`  + ${cat.nameFr}`);
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
    const slug = slugify(f.titleFr);
    const category = categories[f.categoryIdx];
    const instructeur = instructeurProfiles[f.instructeurIdx];
    const isFree = f.price === 0;

    const formation = await prisma.formation.create({
      data: {
        id: createId(),
        slug,
        titleFr: f.titleFr,
        titleEn: f.titleEn,
        shortDescFr: f.shortDescFr,
        shortDescEn: f.shortDescEn,
        descriptionFr: f.descriptionFr,
        descriptionEn: f.descriptionEn,
        learnPointsFr: f.learnPointsFr,
        learnPointsEn: f.learnPointsEn,
        requirementsFr: f.requirementsFr,
        requirementsEn: f.requirementsEn,
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
    console.log(`  + [${f.status}] ${f.titleFr}`);
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
          titleFr: sectionData.titleFr,
          titleEn: sectionData.titleEn,
          order: sIdx,
          formationId: formation.id,
        },
      });

      for (let lIdx = 0; lIdx < sectionData.lessons.length; lIdx++) {
        const lessonData = sectionData.lessons[lIdx];
        const lesson = await prisma.lesson.create({
          data: {
            id: createId(),
            titleFr: lessonData.titleFr,
            titleEn: lessonData.titleEn,
            type: lessonData.type,
            duration: lessonData.duration,
            order: lIdx,
            isFree: lIdx === 0 && sIdx === 0, // First lesson of first section is free
            sectionId: section.id,
            videoUrl: lessonData.type === "VIDEO" ? `https://www.youtube.com/watch?v=dQw4w9WgXcQ` : null,
            content: lessonData.type === "TEXTE" ? `<h2>${lessonData.titleFr}</h2><p>Contenu de la leçon texte. Ce contenu serait remplacé par le vrai contenu en production.</p>` : null,
          },
        });
        allLessons.push({ id: lesson.id, formationId: formation.id });
      }
    }
    console.log(`  + Sections/Lessons pour: ${formation.titleFr}`);
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
        slug: slugify(product.titleFr),
        titleFr: product.titleFr,
        titleEn: product.titleEn,
        descriptionFr: product.descriptionFr,
        descriptionEn: product.descriptionEn,
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
    console.log(`  + ${product.titleFr}`);
  }

  // ── Step 8: Create Formation Cohorts ──
  console.log("\nCreating formation cohorts...");
  const cohortFormations = actifFormations.slice(0, 3);
  const cohortData = [
    {
      titleFr: "Cohorte Janvier 2026",
      titleEn: "January 2026 Cohort",
      descriptionFr: "Apprenez ensemble avec un groupe motivé. Sessions de mentorat incluses.",
      descriptionEn: "Learn together with a motivated group. Mentoring sessions included.",
      durationDays: 42,
      maxParticipants: 30,
      price: 79.99,
      originalPrice: 99.99,
      status: "TERMINE" as const,
    },
    {
      titleFr: "Cohorte Mars 2026",
      titleEn: "March 2026 Cohort",
      descriptionFr: "Rejoignez notre cohorte de mars. Accompagnement personnalisé et projets de groupe.",
      descriptionEn: "Join our March cohort. Personalized support and group projects.",
      durationDays: 56,
      maxParticipants: 25,
      price: 89.99,
      originalPrice: 119.99,
      status: "EN_COURS" as const,
    },
    {
      titleFr: "Cohorte Mai 2026",
      titleEn: "May 2026 Cohort",
      descriptionFr: "Inscriptions ouvertes pour la cohorte de mai. Places limitées !",
      descriptionEn: "Registration open for the May cohort. Limited spots!",
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
        titleFr: cohort.titleFr,
        titleEn: cohort.titleEn,
        descriptionFr: cohort.descriptionFr,
        descriptionEn: cohort.descriptionEn,
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
    console.log(`  + ${cohort.titleFr} (${cohort.status})`);
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
