// sitemap.ts — Génération dynamique du sitemap Next.js
// Revalidation toutes les 60 secondes (ISR)

import { MetadataRoute } from "next";

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
const IS_DEV = process.env.DEV_MODE === "true";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques publiques
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/explorer`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/tarifs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/mentors`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/affiliation`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/a-propos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/aide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/cgu`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/confidentialite`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Services actifs — Prisma en prod, skip en dev
  let serviceRoutes: MetadataRoute.Sitemap = [];
  if (!IS_DEV) {
    try {
      const prisma = (await import("@freelancehigh/db")).default;
      const services = await prisma.service.findMany({
        where: { status: "ACTIF" },
        select: { slug: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
      });

      serviceRoutes = services.map((s) => ({
        url: `${BASE_URL}/services/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    } catch (error) {
      console.error("[sitemap] Erreur chargement services:", error);
    }
  }

  // Profils freelances publics — Prisma en prod
  let freelanceRoutes: MetadataRoute.Sitemap = [];
  if (!IS_DEV) {
    try {
      const prisma = (await import("@freelancehigh/db")).default;
      const profiles = await prisma.user.findMany({
        where: { role: "FREELANCE", status: "ACTIF" },
        select: { id: true, name: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
      });

      freelanceRoutes = profiles
        .filter((p) => p.name)
        .map((p) => ({
          url: `${BASE_URL}/freelances/${p.id}`,
          lastModified: p.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
    } catch (error) {
      console.error("[sitemap] Erreur chargement profils:", error);
    }
  }

  return [...staticRoutes, ...serviceRoutes, ...freelanceRoutes];
}
