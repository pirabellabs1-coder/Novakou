// Environment flags — separate from Prisma to avoid triggering heavy module loading
// Import this instead of @/lib/prisma when you only need IS_DEV

export const IS_DEV = process.env.DEV_MODE === "true";
export const IS_VERCEL = !!process.env.VERCEL;
