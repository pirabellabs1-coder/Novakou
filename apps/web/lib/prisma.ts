// Prisma client helper for API routes
// Re-exports the shared Prisma client from @freelancehigh/db

export { prisma, default as default } from "@freelancehigh/db";
import { MODE_DEV_LOCAL } from "./env";

// Flag pour distinguer le mode developpement (dev-store JSON) du mode production (Prisma/Supabase)
export const IS_DEV = MODE_DEV_LOCAL;
