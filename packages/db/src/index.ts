// Lazy Prisma client — evite "@prisma/client did not initialize" pendant le build Vercel
// Le client n'est instancie qu'au premier appel reel (pas a l'import)
//
// Schema uses the default Prisma output (node_modules/.prisma/client), re-exported
// by @prisma/client. This is the safest setup for Next.js + Vercel bundling.

import type { PrismaClient as PrismaClientType } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClientType;
};

let _prisma: PrismaClientType | null = globalForPrisma.__prisma ?? null;

function getPrisma(): PrismaClientType {
  if (!_prisma) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client") as {
      PrismaClient: new (opts?: Record<string, unknown>) => PrismaClientType;
    };
    _prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = _prisma;
  }
  return _prisma;
}

// Proxy qui forwarde tous les appels vers le client lazy
export const prisma: PrismaClientType = new Proxy({} as PrismaClientType, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default prisma;

// Re-export de tous les types Prisma (types purs, pas d'initialisation runtime)
export type * from "@prisma/client";
