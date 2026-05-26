// Applique la migration 2026052701_bundle_purchase_payment_ref.
// Idempotent (IF NOT EXISTS partout) — safe à relancer.

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");

const prisma = new PrismaClient();
try {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ProductBundlePurchase"
      ADD COLUMN IF NOT EXISTS "paymentRef" TEXT,
      ADD COLUMN IF NOT EXISTS "provider"   TEXT,
      ADD COLUMN IF NOT EXISTS "status"     TEXT NOT NULL DEFAULT 'PAID',
      ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "ProductBundlePurchase_paymentRef_unique"
      ON "ProductBundlePurchase" ("paymentRef")
      WHERE "paymentRef" IS NOT NULL
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProductBundlePurchase_paymentRef_idx"
      ON "ProductBundlePurchase" ("paymentRef")
  `);

  // Vérif : les colonnes existent
  const cols = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ProductBundlePurchase'
    ORDER BY ordinal_position
  `;
  console.log("✅ Colonnes ProductBundlePurchase :");
  for (const c of cols) console.log("   -", c.column_name);

  const idx = await prisma.$queryRaw`
    SELECT indexname FROM pg_indexes
    WHERE schemaname='public' AND tablename='ProductBundlePurchase'
  `;
  console.log("✅ Indexes :");
  for (const i of idx) console.log("   -", i.indexname);
} catch (e) {
  console.error("❌", e.message ?? e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
