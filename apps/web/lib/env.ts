// Environment flags — separate from Prisma to avoid triggering heavy module loading
// Import this instead of @/lib/prisma when you only need IS_DEV

export const IS_DEV = process.env.DEV_MODE === "true";
export const IS_VERCEL = !!process.env.VERCEL;

/**
 * USE_PRISMA_FOR_DATA — On Vercel, les dev stores en mémoire sont éphémères
 * (perdus entre les invocations serverless). Les APIs de données critiques
 * (services, projets, commandes) doivent utiliser Prisma même si DEV_MODE=true.
 * En local, on utilise les dev stores pour éviter de nécessiter une DB.
 */
export const USE_PRISMA_FOR_DATA = IS_VERCEL || !IS_DEV;
