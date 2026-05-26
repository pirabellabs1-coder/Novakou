// Applique le SQL de la migration 2026052601_platform_revenue_unique
// directement (la migration a été marquée "applied" sans exécution — fix).
//
// Idempotent : CREATE UNIQUE INDEX IF NOT EXISTS.

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");

const prisma = new PrismaClient();

try {
  // Vérif préalable : aucun doublon
  const dupes = await prisma.$queryRaw`
    SELECT "orderId", "orderType", COUNT(*) AS n
    FROM "PlatformRevenue"
    WHERE "grossAmount" > 0
    GROUP BY "orderId", "orderType"
    HAVING COUNT(*) > 1
    LIMIT 1
  `;
  if (Array.isArray(dupes) && dupes.length > 0) {
    console.error("❌ Doublons détectés — annulation.");
    process.exit(1);
  }

  // Création de l'index (idempotent grâce à IF NOT EXISTS)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "PlatformRevenue_orderId_orderType_unique_positive"
      ON "PlatformRevenue" ("orderId", "orderType")
      WHERE "grossAmount" > 0
  `);

  // Vérif que l'index existe bien
  const idx = await prisma.$queryRaw`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'PlatformRevenue'
      AND indexname = 'PlatformRevenue_orderId_orderType_unique_positive'
  `;
  if (Array.isArray(idx) && idx.length > 0) {
    console.log("✅ Index unique partial créé sur PlatformRevenue (orderId, orderType) WHERE grossAmount > 0");
  } else {
    console.error("❌ L'index n'apparaît pas après création — investigation requise.");
    process.exit(1);
  }
} catch (err) {
  console.error("❌", err.message ?? err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
