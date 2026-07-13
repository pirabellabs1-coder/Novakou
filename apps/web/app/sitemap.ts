// sitemap.ts — Sitemap dynamique Novakou (formations + produits + mentors + boutiques)
// Regénéré toutes les 60 secondes via ISR.
// Le blog a été supprimé — les URLs /blog/* sont redirigées en 301 vers
// les guides équivalents (cf. next.config.ts).

import { MetadataRoute } from "next";

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
const IS_DEV = process.env.DEV_MODE === "true";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques publiques
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/explorer`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/mentors`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    // /instructeurs (index) n'existe pas en tant que page — seuls
    // /instructeurs/[id] sont indexables. Référencer un 404 dans le
    // sitemap dégrade la note Search Console. Les profils dynamiques sont
    // ajoutés plus bas via dynamicRoutes.
    { url: `${BASE_URL}/tarifs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/affiliation`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/a-propos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/partenaires`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/aide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/confiance-securite`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    // /faq redirects 301 to /aide — removed from sitemap
    // Guide pages — high-value SEO content
    { url: `${BASE_URL}/guides`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/guides/meilleures-plateformes-vendre-produits-digitaux-afrique`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/guides/novakou-fonctionnalites-completes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/guides/top-20-produits-digitaux-rentables-2026`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/guides/novakou-vs-systeme-io`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/guides/novakou-vs-chariow`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/guides/alternative-systeme-io-afrique`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/creer-produit-numerique-afrique`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/creer-son-produit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/vendre-en-ligne`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/guide-complet-novakou`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/trouver-son-idee-de-produit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/publicite-facebook`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/automatisations-novakou`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/sequences-emails`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/description-produit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/tunnel-de-vente-novakou`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    // 11 nouveaux guides (mai 2026)
    { url: `${BASE_URL}/guides/mobile-money-encaisser-paiements`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/fixer-prix-formation`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/whatsapp-business-vendre-formations`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/instagram-vendre-formations-afrique`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/affiliation-recruter-affilies`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/tiktok-reels-vendre-formations`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/lancement-30-jours`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/email-marketing-5-emails-vendent`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/linkedin-personal-branding-expert`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/vendre-diaspora-africaine`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/scaler-catalogue-produits`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    // Guides SEO geo-cibles (juin 2026)
    { url: `${BASE_URL}/guides/vendre-formation-senegal-2026`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/guides/vendre-formation-cameroun-2026`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/guides/vendre-formation-cote-divoire-2026`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/guides/vendre-formation-benin-2026`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/guides/vendre-formation-mali-2026`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/guides/vendre-formation-burkina-faso-2026`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/guides/vendre-formation-togo-2026`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    // Other public pages
    { url: `${BASE_URL}/fonctionnalites`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/freelances`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/cgu`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/confidentialite`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    // /connexion + /inscription RETIRÉS du sitemap : Google n'a aucune
    // raison d'indexer les pages d'authentification (mauvais signal qualité,
    // gaspille du crawl budget, et ces pages sont déjà disallow dans
    // robots.txt). Si un user veut s'inscrire il passe par la landing.
  ];

  if (IS_DEV) return staticRoutes;

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const { prisma } = await import("@freelancehigh/db");

    // ── Formations publiques ──
    try {
      const formations = await prisma.formation.findMany({
        where: { status: "ACTIF", hiddenFromMarketplace: false },
        select: { slug: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
      });
      for (const f of formations) {
        dynamicRoutes.push({
          url: `${BASE_URL}/formation/${f.slug}`,
          lastModified: f.updatedAt,
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
    } catch (err) {
      console.error("[sitemap] formations:", err);
    }

    // ── Produits digitaux ──
    try {
      const products = await prisma.digitalProduct.findMany({
        where: { status: "ACTIF", hiddenFromMarketplace: false },
        select: { slug: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
      });
      for (const p of products) {
        dynamicRoutes.push({
          url: `${BASE_URL}/produit/${p.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    } catch (err) {
      console.error("[sitemap] produits:", err);
    }

    // ── Mentors publics ──
    try {
      const mentors = await prisma.mentorProfile.findMany({
        where: { isAvailable: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 2000,
      });
      for (const m of mentors) {
        dynamicRoutes.push({
          url: `${BASE_URL}/mentors/${m.id}`,
          lastModified: m.updatedAt,
          changeFrequency: "weekly",
          priority: 0.75,
        });
      }
    } catch (err) {
      console.error("[sitemap] mentors:", err);
    }

    // Les profils /instructeurs/[id] n'existent plus (ils redirigent vers la
    // boutique du vendeur) : seules les BOUTIQUES sont indexées ci-dessous.

    // ── Boutiques vendeurs (chaque shop = page publique) ──
    try {
      const shops = await prisma.vendorShop.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 2000,
      });
      for (const s of shops) {
        dynamicRoutes.push({
          url: `${BASE_URL}/boutique/${s.slug}`,
          lastModified: s.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    } catch (err) {
      console.error("[sitemap] boutiques:", err);
    }

    // ── Catégories de formations (hubs SEO) ──
    try {
      const cats = await prisma.formationCategory.findMany({
        select: { slug: true, createdAt: true },
        take: 200,
      });
      for (const c of cats) {
        dynamicRoutes.push({
          url: `${BASE_URL}/explorer?categorie=${c.slug}`,
          lastModified: c.createdAt,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    } catch (err) {
      console.error("[sitemap] categories:", err);
    }
  } catch (err) {
    console.error("[sitemap] prisma init:", err);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
