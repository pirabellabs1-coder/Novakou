// Prisma client helper for API routes
// Re-exports the shared Prisma client from @freelancehigh/db

export { prisma, default as default } from "@freelancehigh/db";

// Flag pour distinguer le mode developpement (dev-store JSON) du mode production (Prisma/Supabase)
export const IS_DEV = process.env.DEV_MODE === "true";
