// Lazy Prisma client — evite "@prisma/client did not initialize" pendant le build Vercel
// Le client n'est instancie qu'au premier appel reel (pas a l'import)
//
// IMPORTANT: The generated client lives in ../generated/client (see schema.prisma).
// We import types from that path so TypeScript knows about MentorProfile, PlatformRevenue, etc.

import type { PrismaClient as PrismaClientType } from "../generated/client";

const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClientType;
};

let _prisma: PrismaClientType | null = globalForPrisma.__prisma ?? null;

function getPrisma(): PrismaClientType {
  if (!_prisma) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("../generated/client") as {
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
export type * from "../generated/client";
