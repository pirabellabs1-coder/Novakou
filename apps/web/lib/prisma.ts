// Prisma client helper for API routes
// Lazy-loading: Prisma is only instantiated when actually needed (production mode)
// Cela evite l'erreur "@prisma/client did not initialize" quand DEV_MODE=true

import type { PrismaClient } from "@prisma/client";

// Flag pour distinguer le mode developpement (dev-store JSON) du mode production (Prisma/Supabase)
export const IS_DEV = process.env.DEV_MODE === "true";

let _prisma: PrismaClient | null = null;

/**
 * Prisma client — lazy singleton.
 * En mode DEV, ce getter ne devrait JAMAIS etre appele (les routes API utilisent devStore).
 * En production, il instancie le client Prisma au premier appel.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_prisma) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient: PC } = require("@prisma/client") as { PrismaClient: new (opts?: Record<string, unknown>) => PrismaClient };
      const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };
      _prisma = globalForPrisma.__prisma ?? new PC({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
      if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = _prisma;
    }
    return (_prisma as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default prisma;
