// Vérifie qu'aucun doublon (orderId, orderType) WHERE grossAmount > 0
// n'existe AVANT de créer l'index unique partial.
// Sans ce check, la migration échouera sur prod.
// Owner : Fatou Diallo — bureau session 2 (vote 22 / 27).

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");

const prisma = new PrismaClient();

const dupes = await prisma.$queryRaw`
  SELECT "orderId", "orderType", COUNT(*) AS n
  FROM "PlatformRevenue"
  WHERE "grossAmount" > 0
  GROUP BY "orderId", "orderType"
  HAVING COUNT(*) > 1
  ORDER BY n DESC
  LIMIT 20
`;

if (Array.isArray(dupes) && dupes.length > 0) {
  console.error(`❌ ${dupes.length} doublon(s) détecté(s) — l'index échouera tant qu'ils existent.`);
  for (const d of dupes) console.error(`   ${d.orderId} / ${d.orderType} : ${d.n} lignes`);
  process.exit(1);
}

console.log("✅ Aucun doublon (orderId, orderType, grossAmount > 0).");
console.log("   La migration peut être appliquée sans risque.");
await prisma.$disconnect();
