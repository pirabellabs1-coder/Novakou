import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * POST /api/admin/seed-products
 * Seeds 3 video formations + 2 digital products (ebook/template) owned by the
 * current instructeur (or the dev instructor). Each formation gets 3 modules
 * with 2–3 lessons each.
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function getOrCreateCategory(name: string) {
  const slug = slugify(name);
  const existing = await prisma.formationCategory.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.formationCategory.create({
    data: { name, slug, isActive: true },
  });
}

const FORMATIONS = [
  {
    title: "Marketing Digital de A à Z : Facebook, Instagram & TikTok Ads",
    shortDesc: "Maîtrisez les algorithmes des réseaux sociaux et lancez vos premières campagnes rentables.",
    description: "Cette formation complète vous emmène des bases du marketing digital jusqu'à la création de campagnes Facebook Ads, Instagram Ads et TikTok Ads qui convertissent. Vous apprendrez à cibler votre audience, créer des créatives percutantes, optimiser votre budget et analyser vos résultats. Parfait pour les entrepreneurs, freelances et salariés qui veulent se reconvertir en marketing digital.",
    category: "Marketing Digital",
    price: 45000,
    originalPrice: 75000,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop",
    modules: [
      {
        title: "Fondamentaux du Marketing Digital",
        lessons: [
          { title: "Introduction : pourquoi le digital change tout", duration: 8 },
          { title: "Le parcours client moderne (AIDA revisité)", duration: 12 },
          { title: "Construire sa stratégie en une page", duration: 18 },
        ],
      },
      {
        title: "Facebook & Instagram Ads Business",
        lessons: [
          { title: "Setup du Business Manager & Pixel", duration: 15 },
          { title: "Ciblage d'audiences : lookalike, intérêts, custom", duration: 22 },
          { title: "Créatives qui convertissent : formats et copywriting", duration: 18 },
          { title: "Budget, enchères et tests A/B", duration: 20 },
        ],
      },
      {
        title: "TikTok Ads & Scaling",
        lessons: [
          { title: "Algorithme TikTok expliqué", duration: 10 },
          { title: "Créer une pub TikTok virale", duration: 25 },
          { title: "Passer de 100k à 1M de vues", duration: 15 },
        ],
      },
    ],
  },
  {
    title: "Freelance en 30 Jours : De Zéro à Premier Client",
    shortDesc: "La méthode complète pour décrocher vos 3 premiers clients et vivre de votre freelance.",
    description: "30 jours pour poser les bases d'une activité freelance rentable. Vous apprendrez à définir votre offre, trouver vos premiers clients sur LinkedIn et Malt, fixer vos tarifs sans vous sous-estimer, rédiger des propositions commerciales qui closent, et gérer votre activité au quotidien. Inclut tous les templates, contrats et scripts d'approche.",
    category: "Entrepreneuriat",
    price: 65000,
    originalPrice: 95000,
    thumbnail: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1280&h=720&fit=crop",
    modules: [
      {
        title: "Poser les fondations (Semaine 1)",
        lessons: [
          { title: "Choisir sa niche rentable", duration: 14 },
          { title: "Construire son offre signature", duration: 18 },
          { title: "Fixer ses tarifs sans culpabiliser", duration: 12 },
        ],
      },
      {
        title: "Prospecter et attirer (Semaine 2-3)",
        lessons: [
          { title: "LinkedIn : optimiser son profil freelance", duration: 20 },
          { title: "Messages de prospection qui ne spamment pas", duration: 15 },
          { title: "Malt, Upwork, Fiverr : stratégies multi-plateformes", duration: 22 },
        ],
      },
      {
        title: "Closer et livrer (Semaine 4)",
        lessons: [
          { title: "Proposition commerciale irrésistible", duration: 18 },
          { title: "Gérer la négociation et les objections", duration: 16 },
          { title: "Livrer, facturer, se faire recommander", duration: 14 },
        ],
      },
    ],
  },
  {
    title: "Développement Web Moderne : React, Next.js & TypeScript",
    shortDesc: "Construisez des applications web professionnelles avec la stack la plus demandée en 2026.",
    description: "Formation intensive pour développeurs qui veulent maîtriser React 18, Next.js 14 (App Router) et TypeScript. On construit ensemble 3 projets réels : un blog, un dashboard SaaS et une marketplace. Déploiement sur Vercel, authentification, base de données Postgres avec Prisma, et intégration Stripe inclus. Prérequis : bases JavaScript.",
    category: "Développement Web",
    price: 98000,
    originalPrice: 150000,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1280&h=720&fit=crop",
    modules: [
      {
        title: "Les fondamentaux React moderne",
        lessons: [
          { title: "Setup projet Next.js + TypeScript", duration: 12 },
          { title: "Hooks essentiels : useState, useEffect, useContext", duration: 28 },
          { title: "Server Components vs Client Components", duration: 22 },
        ],
      },
      {
        title: "Construire un SaaS complet",
        lessons: [
          { title: "Authentification avec NextAuth", duration: 30 },
          { title: "Base de données Postgres + Prisma", duration: 35 },
          { title: "Paiements Stripe : abonnements récurrents", duration: 40 },
          { title: "Dashboard admin avec tRPC", duration: 45 },
        ],
      },
      {
        title: "Déploiement & Best Practices",
        lessons: [
          { title: "Déploiement Vercel + monitoring Sentry", duration: 18 },
          { title: "SEO avec Next.js Metadata API", duration: 15 },
          { title: "Performance : Core Web Vitals au top", duration: 20 },
        ],
      },
    ],
  },
];

const DIGITAL_PRODUCTS: {
  title: string;
  description: string;
  productType: "EBOOK" | "PDF" | "TEMPLATE";
  category: string;
  price: number;
  originalPrice: number;
  banner: string;
}[] = [
  {
    title: "Le Guide Complet du Copywriting qui Convertit (E-book 120 pages)",
    description: "120 pages de techniques, formules et exemples concrets pour écrire des pages de vente, des emails et des posts qui vendent. Basé sur 10 ans de pratique et les meilleures formules américaines adaptées au marché francophone. Inclut 25 templates réutilisables, une checklist de relecture et 50 headlines prêts à copier.",
    productType: "PDF",
    category: "Marketing Digital",
    price: 18000,
    originalPrice: 29000,
    banner: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1280&h=720&fit=crop",
  },
  {
    title: "Pack Notion Freelance : 12 Templates Prêts à l'Emploi",
    description: "Un système Notion complet pour gérer votre activité freelance : CRM clients, pipeline commercial, gestion de projets, facturation, base de contrats, suivi du temps, objectifs annuels, et bien plus. Importez en un clic dans votre workspace Notion. Maintenu à jour à vie.",
    productType: "TEMPLATE",
    category: "Productivité",
    price: 12500,
    originalPrice: 25000,
    banner: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1280&h=720&fit=crop",
  },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Find or create an instructor profile for this user
    let profile = await prisma.instructeurProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.instructeurProfile.create({
        data: {
          userId,
          bioFr: "Instructeur Novakou — démonstration de produits.",
          expertise: ["Marketing Digital", "Freelance", "Développement Web"],
          yearsExp: 5,
          status: "APPROUVE",
        },
      });
    }

    const results = { formations: [] as unknown[], products: [] as unknown[], skipped: [] as string[] };

    // Seed 3 formations with modules
    for (const f of FORMATIONS) {
      const baseSlug = slugify(f.title);
      const existing = await prisma.formation.findUnique({ where: { slug: baseSlug } });
      if (existing) {
        results.skipped.push(`Formation "${f.title}" (slug déjà pris)`);
        continue;
      }

      const category = await getOrCreateCategory(f.category);

      const totalDuration = f.modules.reduce(
        (sum, m) => sum + m.lessons.reduce((s, l) => s + l.duration, 0),
        0
      );

      const created = await prisma.formation.create({
        data: {
          slug: baseSlug,
          title: f.title,
          shortDesc: f.shortDesc,
          description: f.description,
          customCategory: f.category,
          categoryId: category.id,
          thumbnail: f.thumbnail,
          price: f.price,
          originalPrice: f.originalPrice,
          duration: totalDuration,
          status: "ACTIF",
          instructeurId: profile.id,
          sections: {
            create: f.modules.map((m, mIdx) => ({
              title: m.title,
              order: mIdx,
              lessons: {
                create: m.lessons.map((l, lIdx) => ({
                  title: l.title,
                  type: "VIDEO" as const,
                  duration: l.duration,
                  order: lIdx,
                  isFree: mIdx === 0 && lIdx === 0,
                })),
              },
            })),
          },
        },
        include: { sections: { include: { lessons: true } } },
      });

      results.formations.push({
        id: created.id,
        slug: created.slug,
        title: created.title,
        modules: created.sections.length,
        lessons: created.sections.reduce((s, m) => s + m.lessons.length, 0),
      });
    }

    // Seed 2 digital products
    for (const p of DIGITAL_PRODUCTS) {
      const baseSlug = slugify(p.title);
      const existing = await prisma.digitalProduct.findUnique({ where: { slug: baseSlug } });
      if (existing) {
        results.skipped.push(`Produit "${p.title}" (slug déjà pris)`);
        continue;
      }

      const category = await getOrCreateCategory(p.category);

      const created = await prisma.digitalProduct.create({
        data: {
          slug: baseSlug,
          title: p.title,
          description: p.description,
          productType: p.productType,
          categoryId: category.id,
          banner: p.banner,
          price: p.price,
          originalPrice: p.originalPrice,
          status: "ACTIF",
          instructeurId: profile.id,
        },
      });

      results.products.push({
        id: created.id,
        slug: created.slug,
        title: created.title,
        type: created.productType,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        formationsCreated: results.formations.length,
        productsCreated: results.products.length,
        skipped: results.skipped.length,
      },
    });
  } catch (err) {
    console.error("[seed-products]", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: "Erreur serveur", message }, { status: 500 });
  }
}
