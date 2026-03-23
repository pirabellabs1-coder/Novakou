import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * POST /api/admin/seed-marketplace
 * Peuple la base avec des donnees demo pour que la marketplace ne soit pas vide.
 * Protege par ADMIN_ACCESS_TOKEN.
 *
 * Cree: categories, utilisateurs (freelances, clients, agence), services,
 * projets, formations, produits numeriques, reviews.
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    const validToken = process.env.ADMIN_ACCESS_TOKEN;
    if (!validToken || !token) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const tokenBuffer = Buffer.from(token);
    const validBuffer = Buffer.from(validToken);
    if (
      tokenBuffer.length !== validBuffer.length ||
      !crypto.timingSafeEqual(tokenBuffer, validBuffer)
    ) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { prisma } = await import("@freelancehigh/db");
    const passwordHash = await bcrypt.hash("Demo2026!Secure", 12);

    const results: Record<string, number> = {};

    // ── 1. Categories de services ──────────────────────────────────────────
    const categoryData = [
      { name: "Développement Web", slug: "developpement-web", icon: "Code", color: "#6C2BD9", order: 1 },
      { name: "Design & Graphisme", slug: "design-graphisme", icon: "Palette", color: "#0EA5E9", order: 2 },
      { name: "Rédaction & Contenu", slug: "redaction-contenu", icon: "PenTool", color: "#10B981", order: 3 },
      { name: "Marketing Digital", slug: "marketing-digital", icon: "TrendingUp", color: "#F59E0B", order: 4 },
      { name: "Vidéo & Animation", slug: "video-animation", icon: "Film", color: "#EF4444", order: 5 },
      { name: "Formation & Coaching", slug: "formation-coaching", icon: "BookOpen", color: "#8B5CF6", order: 6 },
    ];

    const categories: Record<string, string> = {};
    for (const cat of categoryData) {
      const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
      if (existing) {
        categories[cat.slug] = existing.id;
      } else {
        const created = await prisma.category.create({ data: cat });
        categories[cat.slug] = created.id;
      }
    }
    results.categories = Object.keys(categories).length;

    // ── 2. Categories de formations ────────────────────────────────────────
    const formCategoryData = [
      { name: "Développement", slug: "dev", icon: "Code", color: "#6C2BD9", order: 1 },
      { name: "Design", slug: "design", icon: "Palette", color: "#0EA5E9", order: 2 },
      { name: "Marketing", slug: "marketing", icon: "TrendingUp", color: "#F59E0B", order: 3 },
      { name: "Business", slug: "business", icon: "Briefcase", color: "#10B981", order: 4 },
    ];

    const formCategories: Record<string, string> = {};
    for (const cat of formCategoryData) {
      const existing = await prisma.formationCategory.findUnique({ where: { slug: cat.slug } });
      if (existing) {
        formCategories[cat.slug] = existing.id;
      } else {
        const created = await prisma.formationCategory.create({ data: cat });
        formCategories[cat.slug] = created.id;
      }
    }
    results.formationCategories = Object.keys(formCategories).length;

    // ── 3. Utilisateurs demo ───────────────────────────────────────────────
    const freelanceUsers = [
      { email: "moussa@demo.fh", name: "Moussa Diallo", country: "SN", countryFlag: "🇸🇳", title: "Développeur Full-Stack", skills: ["React", "Next.js", "Node.js", "TypeScript"], hourlyRate: 35 },
      { email: "aminata@demo.fh", name: "Aminata Koné", country: "CI", countryFlag: "🇨🇮", title: "Designer UI/UX", skills: ["Figma", "UI Design", "UX Research", "Adobe XD"], hourlyRate: 30 },
      { email: "jean@demo.fh", name: "Jean-Baptiste Nguema", country: "CM", countryFlag: "🇨🇲", title: "Développeur Backend", skills: ["Python", "Django", "PostgreSQL", "Docker"], hourlyRate: 40 },
      { email: "fatou@demo.fh", name: "Fatou Sow", country: "SN", countryFlag: "🇸🇳", title: "Rédactrice Web SEO", skills: ["SEO", "Rédaction Web", "Copywriting", "Content Strategy"], hourlyRate: 25 },
      { email: "kofi@demo.fh", name: "Kofi Asante", country: "GH", countryFlag: "🇬🇭", title: "Expert Marketing Digital", skills: ["Google Ads", "Facebook Ads", "SEO", "Analytics"], hourlyRate: 45 },
      { email: "claire@demo.fh", name: "Claire Dubois", country: "FR", countryFlag: "🇫🇷", title: "Motion Designer", skills: ["After Effects", "Cinema 4D", "Premiere Pro", "Illustration"], hourlyRate: 50 },
      { email: "ibrahim@demo.fh", name: "Ibrahim Traoré", country: "BF", countryFlag: "🇧🇫", title: "Développeur Mobile", skills: ["React Native", "Flutter", "Firebase", "TypeScript"], hourlyRate: 35 },
      { email: "nadia@demo.fh", name: "Nadia Benali", country: "MA", countryFlag: "🇲🇦", title: "Graphiste & Illustratrice", skills: ["Illustrator", "Photoshop", "Branding", "Print Design"], hourlyRate: 28 },
    ];

    const clientUsers = [
      { email: "client1@demo.fh", name: "TechStart Africa", country: "SN", company: "TechStart Africa", sector: "Technologie", size: "11-50" },
      { email: "client2@demo.fh", name: "Agence Bloom", country: "CI", company: "Agence Bloom", sector: "Marketing", size: "1-10" },
      { email: "client3@demo.fh", name: "DigiCommerce SARL", country: "CM", company: "DigiCommerce SARL", sector: "E-commerce", size: "11-50" },
    ];

    const freelanceIds: string[] = [];
    const clientIds: string[] = [];

    // Create freelance users
    for (const fl of freelanceUsers) {
      const existing = await prisma.user.findUnique({ where: { email: fl.email } });
      if (existing) {
        freelanceIds.push(existing.id);
        continue;
      }
      const user = await prisma.user.create({
        data: {
          email: fl.email,
          passwordHash,
          name: fl.name,
          role: "FREELANCE",
          plan: "GRATUIT",
          status: "ACTIF",
          country: fl.country,
          countryFlag: fl.countryFlag,
          kyc: 3,
          emailVerified: new Date(),
          freelancerProfile: {
            create: {
              title: fl.title,
              skills: fl.skills,
              hourlyRate: fl.hourlyRate,
              bio: `Freelance expérimenté basé en ${fl.country}. Spécialisé en ${fl.skills.slice(0, 2).join(" et ")}.`,
              country: fl.country,
              completionPercent: 85,
            },
          },
        },
      });
      freelanceIds.push(user.id);
    }
    results.freelances = freelanceIds.length;

    // Create client users
    for (const cl of clientUsers) {
      const existing = await prisma.user.findUnique({ where: { email: cl.email } });
      if (existing) {
        clientIds.push(existing.id);
        continue;
      }
      const user = await prisma.user.create({
        data: {
          email: cl.email,
          passwordHash,
          name: cl.name,
          role: "CLIENT",
          plan: "GRATUIT",
          status: "ACTIF",
          country: cl.country,
          kyc: 2,
          emailVerified: new Date(),
          clientProfile: {
            create: {
              company: cl.company,
              sector: cl.sector,
              size: cl.size,
              description: `Entreprise basée en ${cl.country}, secteur ${cl.sector}.`,
            },
          },
        },
      });
      clientIds.push(user.id);
    }
    results.clients = clientIds.length;

    // ── 4. Services (8 services actifs) ────────────────────────────────────
    const serviceData = [
      {
        title: "Création de site web React & Next.js sur mesure",
        slug: "site-web-react-nextjs",
        categorySlug: "developpement-web",
        basePrice: 250,
        deliveryDays: 7,
        descriptionText: "Je crée votre site web moderne et performant avec React et Next.js. Design responsive, SEO optimisé, déploiement inclus. Portfolio, e-commerce, SaaS — tout type de projet.",
        tags: ["React", "Next.js", "TypeScript", "Web"],
        freelanceIndex: 0,
        rating: 4.8,
        ratingCount: 87,
        orderCount: 95,
        views: 3200,
      },
      {
        title: "Design UI/UX complet pour application mobile",
        slug: "design-ui-ux-mobile",
        categorySlug: "design-graphisme",
        basePrice: 350,
        deliveryDays: 10,
        descriptionText: "Design d'interface utilisateur complet pour votre application mobile. Wireframes, maquettes Figma, prototypes interactifs, design system. iOS et Android.",
        tags: ["UI/UX", "Figma", "Mobile", "Design"],
        freelanceIndex: 1,
        rating: 4.9,
        ratingCount: 42,
        orderCount: 48,
        views: 2100,
      },
      {
        title: "Développement API REST & GraphQL avec Node.js",
        slug: "api-rest-graphql-nodejs",
        categorySlug: "developpement-web",
        basePrice: 180,
        deliveryDays: 5,
        descriptionText: "Développement d'API robustes et scalables avec Node.js, Express ou Fastify. REST ou GraphQL, documentation Swagger, tests unitaires inclus.",
        tags: ["Node.js", "API", "Backend", "GraphQL"],
        freelanceIndex: 2,
        rating: 4.7,
        ratingCount: 52,
        orderCount: 60,
        views: 1800,
      },
      {
        title: "Rédaction d'articles SEO optimisés en français",
        slug: "redaction-articles-seo",
        categorySlug: "redaction-contenu",
        basePrice: 45,
        deliveryDays: 2,
        descriptionText: "Articles de blog SEO-friendly, fiches produits, pages web. Recherche de mots-clés incluse. Contenus optimisés pour le référencement naturel Google.",
        tags: ["SEO", "Rédaction", "Blog", "Contenu"],
        freelanceIndex: 3,
        rating: 4.6,
        ratingCount: 180,
        orderCount: 210,
        views: 3600,
      },
      {
        title: "Audit SEO complet et plan d'optimisation",
        slug: "audit-seo-optimisation",
        categorySlug: "marketing-digital",
        basePrice: 150,
        deliveryDays: 5,
        descriptionText: "Audit technique SEO complet de votre site web. Analyse on-page, off-page, vitesse, mobile-friendly. Rapport détaillé avec plan d'action prioritaire.",
        tags: ["SEO", "Audit", "Marketing", "Google"],
        freelanceIndex: 4,
        rating: 4.8,
        ratingCount: 73,
        orderCount: 80,
        views: 2600,
      },
      {
        title: "Montage vidéo professionnel YouTube ou corporate",
        slug: "montage-video-youtube",
        categorySlug: "video-animation",
        basePrice: 90,
        deliveryDays: 3,
        descriptionText: "Montage vidéo professionnel pour YouTube, réseaux sociaux ou corporate. Effets, transitions, sous-titres, color grading. Livraison rapide.",
        tags: ["Vidéo", "YouTube", "Montage", "Premiere Pro"],
        freelanceIndex: 5,
        rating: 4.7,
        ratingCount: 145,
        orderCount: 160,
        views: 3500,
      },
      {
        title: "Application mobile React Native cross-platform",
        slug: "app-mobile-react-native",
        categorySlug: "developpement-web",
        basePrice: 500,
        deliveryDays: 21,
        descriptionText: "Développement d'application mobile iOS et Android avec React Native. UI native, performance optimale, publication sur les stores incluse.",
        tags: ["React Native", "Mobile", "iOS", "Android"],
        freelanceIndex: 6,
        rating: 4.5,
        ratingCount: 28,
        orderCount: 32,
        views: 1400,
      },
      {
        title: "Création de logo professionnel et charte graphique",
        slug: "logo-charte-graphique",
        categorySlug: "design-graphisme",
        basePrice: 80,
        deliveryDays: 3,
        descriptionText: "Création de logo unique et mémorable avec charte graphique complète. 3 propositions, révisions illimitées. Fichiers sources inclus (AI, SVG, PNG).",
        tags: ["Logo", "Branding", "Identité visuelle", "Design"],
        freelanceIndex: 7,
        rating: 4.9,
        ratingCount: 195,
        orderCount: 220,
        views: 4800,
      },
    ];

    let servicesCreated = 0;
    const serviceIds: string[] = [];

    for (const svc of serviceData) {
      const existing = await prisma.service.findUnique({ where: { slug: svc.slug } });
      if (existing) {
        serviceIds.push(existing.id);
        continue;
      }

      const userId = freelanceIds[svc.freelanceIndex] || freelanceIds[0];
      const categoryId = categories[svc.categorySlug];

      const service = await prisma.service.create({
        data: {
          title: svc.title,
          slug: svc.slug,
          categoryId,
          userId,
          status: "ACTIF",
          basePrice: svc.basePrice,
          price: svc.basePrice,
          deliveryDays: svc.deliveryDays,
          descriptionText: svc.descriptionText,
          tags: svc.tags,
          rating: svc.rating,
          ratingCount: svc.ratingCount,
          orderCount: svc.orderCount,
          views: svc.views,
          images: [],
          packages: {
            basic: { name: "Basique", price: svc.basePrice, deliveryDays: svc.deliveryDays, revisions: 1, description: "Forfait de base" },
            standard: { name: "Standard", price: Math.round(svc.basePrice * 1.6), deliveryDays: svc.deliveryDays + 3, revisions: 3, description: "Forfait recommandé" },
            premium: { name: "Premium", price: Math.round(svc.basePrice * 2.5), deliveryDays: svc.deliveryDays + 7, revisions: 5, description: "Forfait complet" },
          },
        },
      });
      serviceIds.push(service.id);
      servicesCreated++;
    }
    results.services = servicesCreated;

    // ── 5. Projets clients (5 projets ouverts) ─────────────────────────────
    const projectData = [
      {
        title: "Refonte complète de notre site e-commerce",
        description: "Nous cherchons un développeur expérimenté pour refondre notre site e-commerce existant (PrestaShop) vers une solution moderne (Next.js + Stripe). Le site contient environ 500 produits. Budget flexible pour le bon candidat.",
        category: "Développement Web",
        budgetMin: 2000,
        budgetMax: 5000,
        urgency: "normale",
        skills: ["Next.js", "React", "Stripe", "E-commerce"],
        contractType: "ponctuel",
      },
      {
        title: "Création d'identité visuelle pour startup fintech",
        description: "Startup fintech basée à Abidjan, nous avons besoin d'une identité visuelle complète : logo, charte graphique, templates de réseaux sociaux, cartes de visite. Nous ciblons le marché B2B en Afrique de l'Ouest.",
        category: "Design & Graphisme",
        budgetMin: 500,
        budgetMax: 1500,
        urgency: "urgente",
        skills: ["Logo", "Branding", "Illustrator", "Photoshop"],
        contractType: "ponctuel",
      },
      {
        title: "Rédaction de contenu pour blog tech (10 articles/mois)",
        description: "Nous recherchons un rédacteur web spécialisé tech pour produire 10 articles de blog par mois. Sujets : IA, cloud computing, cybersécurité, développement web. SEO obligatoire.",
        category: "Rédaction & Contenu",
        budgetMin: 300,
        budgetMax: 800,
        urgency: "normale",
        skills: ["Rédaction Web", "SEO", "Technologie", "Blog"],
        contractType: "recurrent",
      },
      {
        title: "Application mobile de livraison (iOS + Android)",
        description: "Développement d'une application de livraison de repas pour le marché camerounais. Fonctionnalités : géolocalisation, paiement Mobile Money, suivi en temps réel, interface livreur et restaurant.",
        category: "Développement Web",
        budgetMin: 3000,
        budgetMax: 8000,
        urgency: "normale",
        skills: ["React Native", "Node.js", "Mobile Money", "Firebase"],
        contractType: "ponctuel",
      },
      {
        title: "Campagne marketing digital complète (3 mois)",
        description: "Lancement de notre nouvelle gamme de produits cosmétiques bio. Besoin d'un expert marketing pour gérer : Facebook/Instagram Ads, Google Ads, email marketing, stratégie de contenu. Budget pub séparé.",
        category: "Marketing Digital",
        budgetMin: 1500,
        budgetMax: 3000,
        urgency: "urgente",
        skills: ["Facebook Ads", "Google Ads", "Email Marketing", "Social Media"],
        contractType: "long_terme",
      },
    ];

    let projectsCreated = 0;
    for (const proj of projectData) {
      // Check if a project with same title exists to avoid duplicates
      const existing = await prisma.project.findFirst({ where: { title: proj.title } });
      if (existing) continue;

      const clientId = clientIds[projectsCreated % clientIds.length] || clientIds[0];
      await prisma.project.create({
        data: {
          clientId,
          title: proj.title,
          description: proj.description,
          category: proj.category,
          budgetMin: proj.budgetMin,
          budgetMax: proj.budgetMax,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + projectsCreated * 7 * 24 * 60 * 60 * 1000),
          urgency: proj.urgency,
          contractType: proj.contractType,
          skills: proj.skills,
          status: "ouvert",
          visibility: "public",
        },
      });
      projectsCreated++;
    }
    results.projects = projectsCreated;

    // ── 6. Instructeur + Formations (3 formations actives) ─────────────────
    // Use first freelance as instructor
    const instructorUserId = freelanceIds[0];
    let instructeurProfile = await prisma.instructeurProfile.findUnique({
      where: { userId: instructorUserId },
    });
    if (!instructeurProfile) {
      // Update user to have formationsRole
      await prisma.user.update({
        where: { id: instructorUserId },
        data: { formationsRole: "instructeur" },
      });
      instructeurProfile = await prisma.instructeurProfile.create({
        data: {
          userId: instructorUserId,
          bioFr: "Développeur senior avec 8 ans d'expérience. Formateur passionné, j'aide les développeurs africains à maîtriser les technologies modernes.",
          expertise: ["React", "Next.js", "TypeScript", "Node.js"],
          yearsExp: 8,
          status: "APPROUVE",
        },
      });
    }

    // Second instructor
    const instructor2UserId = freelanceIds[1];
    let instructeur2 = await prisma.instructeurProfile.findUnique({
      where: { userId: instructor2UserId },
    });
    if (!instructeur2) {
      await prisma.user.update({
        where: { id: instructor2UserId },
        data: { formationsRole: "instructeur" },
      });
      instructeur2 = await prisma.instructeurProfile.create({
        data: {
          userId: instructor2UserId,
          bioFr: "Designer UI/UX expérimentée. Je forme les créatifs aux outils et méthodologies du design moderne.",
          expertise: ["Figma", "UI Design", "UX Research"],
          yearsExp: 6,
          status: "APPROUVE",
        },
      });
    }

    const formationData = [
      {
        title: "Maîtriser React & Next.js de zéro à expert",
        slug: "react-nextjs-zero-expert",
        shortDesc: "Formation complète React et Next.js 14 avec projets pratiques. App Router, Server Components, déploiement Vercel.",
        categorySlug: "dev",
        instructeurId: instructeurProfile.id,
        level: "DEBUTANT" as const,
        price: 29,
        duration: 720,
        studentsCount: 342,
        rating: 4.8,
        reviewsCount: 89,
        learnPoints: ["Composants React et hooks avancés", "Next.js 14 App Router", "Server Components & Server Actions", "Déploiement sur Vercel"],
      },
      {
        title: "Design UI/UX avec Figma — Le guide complet",
        slug: "design-ui-ux-figma-complet",
        shortDesc: "Apprenez le design d'interface de A à Z avec Figma. Wireframes, prototypes, design systems, handoff développeur.",
        categorySlug: "design",
        instructeurId: instructeur2.id,
        level: "INTERMEDIAIRE" as const,
        price: 19,
        duration: 480,
        studentsCount: 215,
        rating: 4.7,
        reviewsCount: 56,
        learnPoints: ["Maîtrise complète de Figma", "Création de wireframes et prototypes", "Design systems et composants", "Collaboration et handoff dev"],
      },
      {
        title: "Marketing Digital pour entrepreneurs africains",
        slug: "marketing-digital-entrepreneurs-africains",
        shortDesc: "Stratégie marketing digitale adaptée au marché africain. SEO, réseaux sociaux, publicité en ligne, email marketing.",
        categorySlug: "marketing",
        instructeurId: instructeurProfile.id,
        level: "TOUS_NIVEAUX" as const,
        price: 0,
        isFree: true,
        duration: 180,
        studentsCount: 1250,
        rating: 4.6,
        reviewsCount: 203,
        learnPoints: ["Stratégie digitale adaptée à l'Afrique", "SEO et référencement local", "Facebook & Instagram Ads", "Email marketing efficace"],
      },
    ];

    let formationsCreated = 0;
    for (const f of formationData) {
      const existing = await prisma.formation.findUnique({ where: { slug: f.slug } });
      if (existing) continue;

      await prisma.formation.create({
        data: {
          title: f.title,
          slug: f.slug,
          shortDesc: f.shortDesc,
          categoryId: formCategories[f.categorySlug],
          instructeurId: f.instructeurId,
          level: f.level,
          price: f.price,
          isFree: f.isFree || false,
          duration: f.duration,
          studentsCount: f.studentsCount,
          rating: f.rating,
          reviewsCount: f.reviewsCount,
          learnPoints: f.learnPoints,
          status: "ACTIF",
          publishedAt: new Date(),
          hasCertificate: true,
          language: ["fr"],
        },
      });
      formationsCreated++;
    }
    results.formations = formationsCreated;

    // ── 7. Produits numeriques (3 produits actifs) ─────────────────────────
    const productData = [
      {
        title: "Template Next.js SaaS Starter Kit",
        slug: "nextjs-saas-starter-kit",
        description: "Template complet pour lancer votre SaaS avec Next.js 14, TypeScript, Prisma, Stripe et Tailwind CSS. Auth, dashboard, facturation — tout est inclus.",
        productType: "TEMPLATE" as const,
        categorySlug: "dev",
        instructeurId: instructeurProfile.id,
        price: 49,
        salesCount: 87,
        rating: 4.9,
        reviewsCount: 34,
      },
      {
        title: "Guide complet du freelance en Afrique (PDF)",
        slug: "guide-freelance-afrique-pdf",
        description: "200 pages de conseils pratiques pour réussir en freelance depuis l'Afrique. Trouver des clients internationaux, fixer ses tarifs, gérer ses finances, aspects juridiques.",
        productType: "EBOOK" as const,
        categorySlug: "business",
        instructeurId: instructeurProfile.id,
        price: 15,
        salesCount: 342,
        rating: 4.7,
        reviewsCount: 89,
      },
      {
        title: "Kit UI Figma — 500 composants modernes",
        slug: "kit-ui-figma-500-composants",
        description: "Bibliothèque Figma avec 500+ composants UI modernes. Dashboards, formulaires, navigation, cartes, modales. Compatible avec Tailwind CSS.",
        productType: "TEMPLATE" as const,
        categorySlug: "design",
        instructeurId: instructeur2.id,
        price: 35,
        salesCount: 156,
        rating: 4.8,
        reviewsCount: 45,
      },
    ];

    let productsCreated = 0;
    for (const p of productData) {
      const existing = await prisma.digitalProduct.findUnique({ where: { slug: p.slug } });
      if (existing) continue;

      await prisma.digitalProduct.create({
        data: {
          title: p.title,
          slug: p.slug,
          description: p.description,
          productType: p.productType,
          categoryId: formCategories[p.categorySlug],
          instructeurId: p.instructeurId,
          price: p.price,
          isFree: false,
          salesCount: p.salesCount,
          rating: p.rating,
          reviewsCount: p.reviewsCount,
          status: "ACTIF",
          tags: [],
        },
      });
      productsCreated++;
    }
    results.products = productsCreated;

    // ── 8. Reviews sur les services ────────────────────────────────────────
    // Only create reviews if we have services and orders to reference
    // We create minimal orders first to satisfy the review foreign key
    let reviewsCreated = 0;

    if (serviceIds.length >= 3 && clientIds.length >= 1 && freelanceIds.length >= 1) {
      const reviewData = [
        { serviceIdx: 0, clientIdx: 0, freelanceIdx: 0, rating: 5, comment: "Excellent travail ! Site livré avant le délai, code propre et bien documenté. Je recommande vivement." },
        { serviceIdx: 0, clientIdx: 1, freelanceIdx: 0, rating: 4.5, comment: "Très bon développeur, communication fluide. Quelques ajustements mineurs demandés mais résolus rapidement." },
        { serviceIdx: 1, clientIdx: 0, freelanceIdx: 1, rating: 5, comment: "Design magnifique et très professionnel. Les maquettes Figma étaient parfaitement organisées." },
        { serviceIdx: 3, clientIdx: 2, freelanceIdx: 3, rating: 4, comment: "Bons articles SEO, bien recherchés et optimisés. Livraison ponctuelle." },
        { serviceIdx: 7, clientIdx: 1, freelanceIdx: 7, rating: 5, comment: "Logo parfait dès la première proposition ! Charte graphique complète et professionnelle." },
      ];

      for (const rv of reviewData) {
        const serviceId = serviceIds[rv.serviceIdx];
        const clientId = clientIds[rv.clientIdx % clientIds.length];
        const freelanceId = freelanceIds[rv.freelanceIdx];

        if (!serviceId || !clientId || !freelanceId) continue;

        // Check if order already exists
        const existingOrder = await prisma.order.findFirst({
          where: { serviceId, clientId, freelanceId, status: "TERMINE" },
        });

        let orderId: string;
        if (existingOrder) {
          orderId = existingOrder.id;
        } else {
          const order = await prisma.order.create({
            data: {
              serviceId,
              clientId,
              freelanceId,
              status: "TERMINE",
              escrowStatus: "RELEASED",
              amount: serviceData[rv.serviceIdx]?.basePrice || 100,
              commission: (serviceData[rv.serviceIdx]?.basePrice || 100) * 0.2,
              packageType: "standard",
              deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              progress: 100,
            },
          });
          orderId = order.id;
        }

        // Check if review already exists
        const existingReview = await prisma.review.findUnique({
          where: { orderId_authorId: { orderId, authorId: clientId } },
        });
        if (existingReview) continue;

        await prisma.review.create({
          data: {
            orderId,
            serviceId,
            authorId: clientId,
            targetId: freelanceId,
            rating: rv.rating,
            comment: rv.comment,
            quality: rv.rating,
            communication: rv.rating >= 4.5 ? 5 : 4,
            timeliness: rv.rating >= 4.5 ? 5 : 4,
          },
        });
        reviewsCreated++;
      }
    }
    results.reviews = reviewsCreated;

    return NextResponse.json({
      ok: true,
      message: "Marketplace seedée avec succès",
      results,
    });
  } catch (error) {
    console.error("[SEED MARKETPLACE]", error);
    return NextResponse.json(
      {
        error: "Erreur lors du seeding",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}
